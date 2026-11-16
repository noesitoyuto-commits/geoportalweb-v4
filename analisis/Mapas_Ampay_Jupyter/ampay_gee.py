"""Descarga opcional de insumos usando la sesión Earth Engine del usuario."""

from calendar import monthrange
from datetime import date
import json
import math

import ee
import geopandas as gpd
import requests
import rasterio
from rasterio.crs import CRS
from rasterio.transform import Affine
from rasterio.windows import from_bounds
from shapely.geometry import mapping

from ampay_mapas import (
    CALIDAD_20, ESCALA_10, ESCALA_20, Grilla, SIN_DATO,
    FUENTE_CHIRPS, FUENTE_ERA5, FUENTE_GPM, FUENTE_MODIS,
)

SENTINEL = "COPERNICUS/S2_SR_HARMONIZED"
CHIRPS = "UCSB-CHC/CHIRPS/V3/PENTAD"
ERA5 = "ECMWF/ERA5_LAND/MONTHLY_AGGR"
MODIS = "MODIS/061/MOD11A2"
IMERG_MES = "NASA/GPM_L3/IMERG_MONTHLY_V07"
IMERG_MEDIA_HORA = "NASA/GPM_L3/IMERG_V07"


def limites_mes(periodo):
    anio, mes = (int(n) for n in periodo.split("-"))
    inicio = date(anio, mes, 1)
    fin = date(anio + (mes == 12), 1 if mes == 12 else mes + 1, 1)
    return inicio.isoformat(), fin.isoformat(), monthrange(anio, mes)[1]


def iniciar(proyecto):
    ee.Initialize(project=proyecto)


def area_del_asset(asset):
    geom = ee.FeatureCollection(asset).geometry(maxError=1).getInfo()
    return gpd.GeoDataFrame.from_features(
        [{"type": "Feature", "geometry": geom, "properties": {}}], crs=4326
    )


def bajar_img(imagen, destino, grilla, codigo_crs=None):
    destino.parent.mkdir(parents=True, exist_ok=True)
    temporal = destino.with_suffix(".part")
    params = {
        "format": "GEO_TIFF",
        "crs": codigo_crs or grilla.crs.to_string(),
        "crs_transform": list(grilla.transform)[:6],
        "dimensions": [grilla.ancho, grilla.alto],
    }
    url = imagen.toFloat().unmask(SIN_DATO, False).getDownloadURL(params)
    try:
        with requests.get(url, timeout=(15, 120), stream=True) as respuesta:
            if not respuesta.ok:
                raise RuntimeError(f"Earth Engine devolvió HTTP {respuesta.status_code} al bajar {destino.name}.")
            with temporal.open("wb") as stream:
                for bloque in respuesta.iter_content(chunk_size=1024 * 1024):
                    stream.write(bloque)
        with rasterio.open(temporal) as validacion:
            if (validacion.width, validacion.height) != (grilla.ancho, grilla.alto):
                raise RuntimeError(f"Tamaño inesperado en {destino.name}.")
        temporal.replace(destino)
    finally:
        temporal.unlink(missing_ok=True)


def s2_compuesto(carpeta, area, periodo):
    inicio, fin, _ = limites_mes(periodo)
    if inicio < "2017-03-28":
        raise ValueError("Para Sentinel-2 SR armonizado elige una fecha posterior a marzo de 2017.")
    g20 = Grilla.desde_bounds(area.geometry.iloc[0].buffer(20).bounds, 20)
    g10 = Grilla(g20.crs, g20.transform * Affine.scale(.5), 2*g20.alto, 2*g20.ancho)
    roi = ee.Geometry(mapping(area.to_crs(4326).geometry.iloc[0]))
    escenas = ee.ImageCollection(SENTINEL).filterBounds(roi).filterDate(inicio, fin)
    fechas = escenas.aggregate_array("system:time_start").map(
        lambda t: ee.Date(t).format("YYYY-MM-dd")
    ).distinct().sort()
    dias = fechas.getInfo()
    if not dias:
        raise ValueError(f"Sentinel-2 SR sin escenas para {periodo} y el área seleccionada.")
    nombres20 = [f"{b}_20" for b in ESCALA_20]
    proy10 = ee.Projection(g10.crs.to_string(), list(g10.transform)[:6])
    proy20 = ee.Projection(g20.crs.to_string(), list(g20.transform)[:6])

    def preparar(img):
        scl = img.select("SCL")
        clara = scl.eq(4).Or(scl.eq(5)).Or(scl.eq(6)).Or(scl.eq(11))
        r10 = img.select(list(ESCALA_10)).multiply(0.0001).updateMask(clara).toFloat()
        agregadas = r10.select(["B3","B4","B8"]).reduceResolution(
            reducer=ee.Reducer.mean(), maxPixels=16
        ).reproject(proy20)
        nativas = img.select(["B5","B8A","B11","B12"]).multiply(0.0001).updateMask(clara).toFloat().reproject(proy20)
        r20 = agregadas.addBands(nativas).select(list(ESCALA_20)).rename(nombres20)
        return r10.resample("bilinear").reproject(proy10).addBands(r20).addBands(
            scl.updateMask(clara).reproject(proy20)
        ).set("dia", img.date().format("YYYY-MM-dd"))

    preparados = escenas.map(preparar)
    def mosaico_dia(dia):
        img = preparados.filter(ee.Filter.eq("dia", dia)).mosaic()
        return img.select(list(ESCALA_10)).setDefaultProjection(proy10).addBands(
            img.select(nombres20+["SCL"]).setDefaultProjection(proy20)
        )

    diarios = ee.ImageCollection.fromImages(fechas.map(mosaico_dia))

    def conteos(imagen):
        verde, nir, swir = (imagen.select(b) for b in ("B3_20","B8_20","B11_20"))
        scl = imagen.select("SCL")
        obs = verde.multiply(0).add(1).updateMask(nir.mask()).updateMask(swir.mask()).updateMask(scl.mask())
        ndwi = verde.subtract(nir).divide(verde.add(nir)).updateMask(verde.gte(0).And(nir.gte(0)).And(verde.add(nir).gt(1e-6)))
        verdeswir = verde.subtract(swir).divide(verde.add(swir)).updateMask(verde.gte(0).And(swir.gte(0)).And(verde.add(swir).gt(1e-6)))
        agua = scl.eq(6).And(ndwi.gt(0)).And(verdeswir.gt(0)).unmask(0).updateMask(obs.mask())
        nieve = scl.eq(11).And(verdeswir.gte(.4)).And(verde.gte(.12)).unmask(0).updateMask(obs.mask())
        return obs.addBands([agua,nieve]).rename(list(CALIDAD_20))

    bajar_img(diarios.select(list(ESCALA_10)).median(),carpeta/"reflectancia_10m.tif",g10)
    bajar_img(diarios.select(nombres20).median().rename(list(ESCALA_20)),carpeta/"reflectancia_20m.tif",g20)
    bajar_img(diarios.map(conteos).sum(),carpeta/"observaciones_20m.tif",g20)
    ficha = {"fuente": "Copernicus Sentinel-2 SR armonizado / Google Earth Engine",
             "metodo": "Mediana de reflectancia con SCL, mosaico por fecha UTC.",
             "periodo": periodo, "dias_usados": [{"fecha": d} for d in dias]}
    (carpeta/"fuente.json").write_text(json.dumps(ficha,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")


def grilla_regional(imagen, area, margen_km):
    """Recorta una ventana de la grilla nativa, incluso para MODIS sinusoidal."""
    proyeccion = imagen.projection().getInfo()
    codigo = proyeccion["crs"]
    crs = CRS.from_user_input(
        "+proj=sinu +R=6371007.181 +units=m +no_defs" if codigo == "SR-ORG:6974" else codigo
    )
    af = Affine(*proyeccion["transform"][:6])
    ventana_geo = gpd.GeoSeries([area.geometry.iloc[0].buffer(margen_km * 1000)],crs=area.crs).to_crs(crs)
    fr = from_bounds(*ventana_geo.total_bounds,transform=af)
    x,y = math.floor(fr.col_off), math.floor(fr.row_off)
    w = math.ceil(fr.col_off+fr.width) - x
    h = math.ceil(fr.row_off+fr.height) - y
    return Grilla(crs, af * Affine.translation(x,y), h, w), codigo


def cargar_clima(carpeta, area, periodo, margen_km=55, anio_anual=None,
                 periodo_referencia=(1991,2020)):
    ini,fin,dias = limites_mes(periodo)
    anio,mes = (int(x) for x in periodo.split("-"))
    base_ini,base_fin = periodo_referencia
    anos = list(range(base_ini,base_fin+1))
    if date.fromisoformat(fin) > date.today():
        raise ValueError("Elige un mes cerrado para los mapas de clima mensual.")
    resultados = {}
    carpeta.mkdir(parents=True,exist_ok=True)

    def exportar(clave, img, banda_nativa, fuente, fecha, metodo):
        grilla, codigo = grilla_regional(banda_nativa, area, margen_km)
        bajar_img(img.rename("valor"), carpeta/f"{clave}.tif", grilla, codigo)
        resultados[clave] = {"fuente":fuente,"periodo":fecha,"metodo":metodo}
        print("Insumo guardado:", clave)

    def cantidad_exacta(col, esperado):
        return col.size().getInfo() == esperado and col.aggregate_count_distinct("system:time_start").getInfo() == esperado

    chirps = ee.ImageCollection(CHIRPS).select("precipitation")
    actual = chirps.filterDate(ini,fin)
    if cantidad_exacta(actual,6):
        total = actual.sum().updateMask(actual.count().eq(6))
        nativa = ee.Image(actual.first())
        exportar("pp_chirps_mes",total,nativa,FUENTE_CHIRPS,periodo,"6 pentadas completas de un mes UTC.")
        referencia = chirps.filterDate(f"{base_ini}-01-01",f"{base_fin+1}-01-01").filter(
            ee.Filter.calendarRange(mes,mes,"month")
        )
        if cantidad_exacta(referencia,6*len(anos)):
            normal = referencia.sum().divide(len(anos)).updateMask(referencia.count().eq(6*len(anos)))
            exportar("pp_chirps_anomalia",total.subtract(normal),nativa,FUENTE_CHIRPS,periodo,
                     f"Mes menos normal del mismo mes de {base_ini}–{base_fin}.")
    if anio_anual is not None:
        anual=chirps.filterDate(f"{anio_anual}-01-01",f"{anio_anual+1}-01-01")
        if cantidad_exacta(anual,72):
            exportar("pp_chirps_anual",anual.sum().updateMask(anual.count().eq(72)),
                     ee.Image(anual.first()),FUENTE_CHIRPS,str(anio_anual),"Total de 72 pentadas válidas.")
        else:
            print(f"CHIRPS anual {anio_anual}: el año no reúne 72 pentadas.")

    imerg = ee.ImageCollection(IMERG_MES).filterDate(ini,fin).select("precipitation")
    if imerg.size().getInfo() == 1:
        base = ee.Image(imerg.first())
        exportar("pp_imerg_mes",base.multiply(dias*24),base,FUENTE_GPM,periodo,
                 f"Tasa mensual en mm/h multiplicada por las {dias*24} horas del mes.")
    else:
        imerg = ee.ImageCollection(IMERG_MEDIA_HORA).filterDate(ini,fin).select("precipitation")
        if cantidad_exacta(imerg,dias*48):
            total = imerg.sum().multiply(.5).updateMask(imerg.count().eq(dias*48))
            exportar("pp_imerg_mes",total,ee.Image(imerg.first()),FUENTE_GPM,periodo,
                     "Integración de tasas cada 30 minutos. La colección puede contener datos provisionales.")

    era = ee.ImageCollection(ERA5)
    meteo = era.filterDate(ini,fin)
    if meteo.size().getInfo() == 1:
        img = ee.Image(meteo.first())
        t2m = img.select("temperature_2m")
        sol = img.select("surface_solar_radiation_downwards_sum")
        exportar("t2m",t2m.subtract(273.15),t2m,FUENTE_ERA5,periodo,"Temperatura media a 2 m. Kelvin menos 273.15.")
        exportar("radiacion",sol.divide(3.6e6),sol,FUENTE_ERA5,periodo,"Radiación de onda corta acumulada. J/m² ÷ 3.6 millones.")
        serie = era.filterDate(f"{base_ini}-01-01",f"{base_fin+1}-01-01").filter(
            ee.Filter.calendarRange(mes,mes,"month")
        ).select("temperature_2m")
        if cantidad_exacta(serie,len(anos)):
            normal = serie.mean().updateMask(serie.count().eq(len(anos)))
            exportar("t2m_anomalia",t2m.subtract(normal),t2m,FUENTE_ERA5,periodo,
                     f"Mes menos normal del mismo mes de {base_ini}–{base_fin}.")

    lst = ee.ImageCollection(MODIS).filterDate(ini,fin)
    if lst.size().getInfo() >= 2:
        for clave, banda, qc in (
            ("lst_dia","LST_Day_1km","QC_Day"),
            ("lst_noche","LST_Night_1km","QC_Night"),
        ):
            def filtrar(img):
                calidad = img.select(qc)
                clara = calidad.bitwiseAnd(3).eq(0).And(calidad.rightShift(6).bitwiseAnd(3).lte(1))
                return img.select(banda).updateMask(clara).multiply(.02).subtract(273.15)
            temp = lst.map(filtrar)
            exportar(clave,temp.mean().updateMask(temp.count().gte(2)),
                     ee.Image(lst.first()).select(banda),FUENTE_MODIS,periodo,
                     "Media de compuestos de ocho días iniciados en el mes; QA bueno; mínimo dos por píxel.")

    (carpeta/"fuentes.json").write_text(json.dumps(resultados,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    faltan = set(("pp_chirps_mes","pp_chirps_anomalia","pp_imerg_mes","t2m","t2m_anomalia","radiacion","lst_dia","lst_noche")) - resultados.keys()
    if faltan:
        print("Sin insumo nuevo con cobertura suficiente en este mes:", ", ".join(sorted(faltan)))
    return resultados

