"""Procesamiento local y exportación de capas para Ampay Vivo."""

from dataclasses import dataclass
import json
import math
from pathlib import Path

import geopandas as gpd
import matplotlib as mpl
import matplotlib.pyplot as plt
from mpl_toolkits.axes_grid1.anchored_artists import AnchoredSizeBar
import numpy as np
from PIL import Image
import rasterio
from rasterio.crs import CRS
from rasterio.features import geometry_mask, shapes
from rasterio.transform import Affine, array_bounds, from_origin
from rasterio.warp import Resampling, calculate_default_transform, reproject, transform_bounds
from shapely.geometry import shape

UTM = "EPSG:32718"
SIN_DATO = -9999.0
ESCALA_10 = ("B2", "B3", "B4", "B8")
ESCALA_20 = ("B3", "B4", "B5", "B8", "B8A", "B11", "B12")
CALIDAD_20 = ("OBS_VALIDAS", "AGUA", "NIEVE")
FUENTE_GLO30 = "Copernicus DEM GLO-30 / AWS Open Data"
FUENTE_CHIRPS = "UCSB Climate Hazards Center · CHIRPS v3.0"
FUENTE_ERA5 = "ECMWF / Copernicus · ERA5-Land"
FUENTE_MODIS = "NASA MODIS Terra · MOD11A2 v061"
FUENTE_GPM = "NASA GPM · IMERG V07"


@dataclass(frozen=True)
class Grilla:
    crs: CRS
    transform: Affine
    alto: int
    ancho: int

    @property
    def forma(self):
        return self.alto, self.ancho

    @property
    def bounds(self):
        return array_bounds(self.alto, self.ancho, self.transform)

    @classmethod
    def desde_bounds(cls, bounds, metros, crs=UTM):
        oeste, sur, este, norte = bounds
        oeste = math.floor(oeste / metros) * metros
        norte = math.ceil(norte / metros) * metros
        return cls(CRS.from_user_input(crs), from_origin(oeste, norte, metros, metros),
                   math.ceil((norte - sur) / metros), math.ceil((este - oeste) / metros))


def cargar_area(archivo):
    """Valida y unifica el límite, con coordenadas métricas de UTM 18S."""
    gdf = gpd.read_file(archivo)
    if gdf.empty or not gdf.crs:
        raise ValueError(f"El límite está vacío o no declara un CRS: {archivo}")
    gdf = gdf.to_crs(UTM)
    poligono = gdf.geometry.union_all()
    if poligono.is_empty or not poligono.is_valid or poligono.geom_type not in {"Polygon", "MultiPolygon"}:
        raise ValueError("El área debe contener polígonos válidos.")
    return gpd.GeoDataFrame(geometry=[poligono], crs=UTM)


def leer_bandas(archivo, nombres):
    """Lee en flotante. Conserva cero válido y convierte la máscara a NaN."""
    with rasterio.open(archivo) as ds:
        if not ds.crs or ds.count != len(nombres):
            raise ValueError(f"Revisa la proyección y el número de bandas de {archivo}.")
        datos = ds.read(masked=True).astype("float32").filled(np.nan)
        grilla = Grilla(ds.crs, ds.transform, ds.height, ds.width)
    datos[~np.isfinite(datos) | (datos == SIN_DATO)] = np.nan
    return dict(zip(nombres, datos)), grilla


def proyectar(datos, origen, destino, metodo=Resampling.nearest):
    """Mantiene la distinción entre valores válidos y NoData al reproyectar."""
    salida = np.full(destino.forma, np.nan, dtype="float32")
    reproject(
        np.asarray(datos, dtype="float32"), salida,
        src_crs=origen.crs, src_transform=origen.transform, src_nodata=np.nan,
        dst_crs=destino.crs, dst_transform=destino.transform, dst_nodata=np.nan,
        resampling=metodo,
    )
    return salida


def mascara_area(area, grilla):
    return geometry_mask(
        area.to_crs(grilla.crs).geometry, out_shape=grilla.forma,
        transform=grilla.transform, invert=True,
    )


def guardar_tif(archivo, datos, grilla, nombres, tags):
    valores = np.asarray(datos, dtype="float32").reshape(-1, *grilla.forma)
    archivo.parent.mkdir(parents=True, exist_ok=True)
    with rasterio.open(
        archivo, "w", driver="GTiff", dtype="float32", nodata=SIN_DATO,
        width=grilla.ancho, height=grilla.alto, count=len(valores),
        crs=grilla.crs, transform=grilla.transform, compress="deflate", predictor=3, tiled=True,
    ) as destino:
        destino.write(np.where(np.isfinite(valores), valores, SIN_DATO))
        for i, nombre in enumerate(nombres, 1):
            destino.set_band_description(i, nombre)
        destino.update_tags(**tags)


def rgb_reflectancia(datos):
    limpio = np.nan_to_num(datos, nan=0.0)
    return np.moveaxis(np.clip(limpio / 0.30, 0, 1) ** 0.55, 0, -1)


def png_para_leaflet(archivo, valores, grilla, cmap, rango, clase):
    """Dibuja en Web Mercator y devuelve bounds latitud/longitud para Leaflet."""
    crs = CRS.from_epsg(3857)
    tr, w, h = calculate_default_transform(
        grilla.crs, crs, grilla.ancho, grilla.alto, *grilla.bounds
    )
    destino = Grilla(crs, tr, h, w)
    if valores.ndim == 3:
        bandas = np.stack([proyectar(b, grilla, destino) for b in valores])
        alpha = np.all(np.isfinite(bandas), axis=0)
        color = np.round(rgb_reflectancia(bandas) * 255).astype("uint8")
        rgba = np.dstack((color, alpha.astype("uint8") * 255))
    else:
        banda = proyectar(valores, grilla, destino)
        colores = mpl.colormaps[cmap]
        escala = mpl.colors.Normalize(*rango, clip=True)
        if clase:
            colores = mpl.colors.ListedColormap(colores(np.linspace(0,1,len(clase),endpoint=False)))
            escala = mpl.colors.BoundaryNorm(np.arange(-0.5, len(clase) + 0.5), len(clase))
        rgba = colores(escala(banda), bytes=True)
        rgba[~np.isfinite(banda)] = 0
    Image.fromarray(rgba).save(archivo, optimize=True)
    w, s, e, n = transform_bounds(crs, "EPSG:4326", *destino.bounds)
    return [[s, w], [n, e]]


class Catalogo:
    """Empaqueta el dato, su representación web y los metadatos de cada capa."""

    def __init__(self, salida, area, nombre_area):
        self.salida = Path(salida)
        self.area = area
        self.nombre_area = nombre_area
        self.web = self.salida / "geoportal"
        self.web.mkdir(parents=True, exist_ok=True)
        self.capas = []

    def raster(self, clave, titulo, valores, grilla, *,
               grupo, fuente, periodo, unidad="", resolucion="", metodo="",
               cmap="viridis", rango=None, recortar=True, clase=None):
        valores = np.asarray(valores, dtype="float32")
        if valores.shape[-2:] != grilla.forma:
            raise ValueError(f"Dimensiones inconsistentes en {clave}.")
        mascara = mascara_area(self.area, grilla) if recortar else np.ones(grilla.forma, dtype=bool)
        valores = np.where(mascara, valores, np.nan)
        valido = np.isfinite(valores) if valores.ndim == 2 else np.all(np.isfinite(valores), axis=0)
        if not np.any(valido):
            print(f"{titulo}: sin píxeles válidos en este período.")
            return
        compuesto = valores.ndim == 3
        if not compuesto and rango is None:
            p2, p98 = np.nanpercentile(valores, [2, 98])
            margen = max(0.1, abs(float(p2)) * 0.05) if p98 <= p2 else 0.0
            rango = float(p2 - margen), float(p98 + margen)
        rel_tif = Path("geotiff") / f"{clave}.tif"
        guardar_tif(self.salida / rel_tif, valores, grilla,
                    ("Canal rojo", "Canal verde", "Canal azul") if compuesto else (clave,),
                    {"fuente": fuente, "periodo": periodo, "unidad": unidad,
                     "metodo": metodo, "resolucion_fuente": resolucion})
        nombre_png = f"{clave}.png"
        bounds = png_para_leaflet(self.web / nombre_png, valores, grilla, cmap, rango, clase)
        paleta = []
        if not compuesto:
            colores = mpl.colormaps[cmap](np.linspace(0,1,len(clase) if clase else 7,endpoint=not clase))
            paleta = [mpl.colors.to_hex(color) for color in colores]
        self.capas.append({
            "id": clave, "nombre": titulo, "tipo": "raster", "grupo": grupo,
            "fuente": fuente, "periodo": periodo, "unidad": unidad, "resolucion": resolucion,
            "metodo": metodo, "rango": list(rango) if rango else None, "cmap": None if compuesto else cmap,
            "clases": clase, "colores": paleta, "cobertura_pct": round(100 * valido.sum() / mascara.sum(), 3),
            "archivo": nombre_png, "geotiff": rel_tif.as_posix(), "bounds": bounds,
            "regional": not recortar,
        })

    def vector_candidato(self, clave, titulo, frecuencia, exitos, grilla, fuente, periodo,
                        minimo_ha, color):
        limite = self.area.to_crs(grilla.crs).geometry.iloc[0]
        candidato = (frecuencia >= 50) & (exitos >= 2)
        entidades = []
        for geometria, _ in shapes(candidato.astype("uint8"), mask=candidato,
                                   transform=grilla.transform, connectivity=4):
            poligono = shape(geometria).intersection(limite)
            area = poligono.area / 10000
            if area >= minimo_ha:
                entidades.append({"area_ha": round(area,3), "periodo": periodo,
                                  "clase": titulo, "geometry": poligono})
        nombre = f"{clave}.geojson"
        if entidades:
            gdf = gpd.GeoDataFrame(entidades, geometry="geometry", crs=grilla.crs)
            geojson = gdf.to_crs(4326).to_geo_dict()
        else:
            geojson = {"type": "FeatureCollection", "features": []}
            print(f"{titulo}: sin polígonos con los criterios seleccionados.")
        (self.web / nombre).write_text(json.dumps(geojson, ensure_ascii=False) + "\n", encoding="utf-8")
        self.capas.append({
            "id": clave, "nombre": titulo, "grupo": "Agua y criósfera", "tipo": "vector",
            "fuente": fuente, "periodo": periodo, "unidad": "ha", "resolucion": "20 m",
            "archivo": nombre, "color": color, "n_poligonos": len(entidades),
            "metodo": f"≥50 % de observaciones válidas, ≥2 detecciones, polígonos ≥{minimo_ha:.3f} ha.",
        })

    def escribir(self):
        datos = {
            "area": self.nombre_area,
            "limite": self.area.to_crs(4326).to_geo_dict(),
            "capas": self.capas,
            "vectores": {
                c["id"]: json.loads((self.web / c["archivo"]).read_text(encoding="utf-8"))
                for c in self.capas if c["tipo"] == "vector"
            },
        }
        (self.salida / "catalogo.json").write_text(
            json.dumps({"area": self.nombre_area, "capas": self.capas}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        geometria = json.dumps(datos, ensure_ascii=True, separators=(",", ":"))
        js = (Path(__file__).parent / "integracion_leaflet.js").read_text(encoding="utf-8")
        (self.web / "capas_ampay.js").write_text(
            js.replace("/* INSERTAR_CATALOGO */ null", geometria), encoding="utf-8"
        )


def cociente(a, b, valido=None):
    resultado = np.full(a.shape, np.nan, dtype="float32")
    mascara = np.isfinite(a) & np.isfinite(b) & (b > 1e-6)
    if valido is not None:
        mascara &= valido
    np.divide(a, b, out=resultado, where=mascara)
    return resultado


def diferencia_normalizada(a, b):
    return cociente(a - b, a + b, (a >= 0) & (b >= 0))


def leer_s2(carpeta):
    b10, g10 = leer_bandas(carpeta / "reflectancia_10m.tif", ESCALA_10)
    b20, g20 = leer_bandas(carpeta / "reflectancia_20m.tif", ESCALA_20)
    q, gq = leer_bandas(carpeta / "observaciones_20m.tif", CALIDAD_20)
    if g20 != gq:
        raise ValueError("Las bandas de 20 m y las observaciones deben compartir cuadrícula.")
    fuente = json.loads((carpeta / "fuente.json").read_text(encoding="utf-8"))
    return b10, g10, b20, g20, q, fuente


def mapas_espectrales(catalogo, carpeta, referencia=None, min_dias=2, minimo_ha=0.12):
    b10, g10, b20, g20, q, ficha = leer_s2(carpeta)
    fuente, periodo = ficha["fuente"], ficha["periodo"]
    fechas = [reg["fecha"] for reg in ficha["dias_usados"]]
    print(f"Sentinel-2 · {periodo}: {len(fechas)} días considerados en el compuesto.")
    op10 = {"fuente": fuente, "periodo": periodo, "resolucion": "10 m",
            "metodo": "Índice sobre compuesto de mediana de reflectancia L2A; máscara SCL."}
    op20 = {**op10, "resolucion": "20 m"}
    catalogo.raster("rgb", "Color natural", np.stack([b10[b] for b in ("B4","B3","B2")]), g10,
                    grupo="Imágenes Sentinel-2", **{**op10,"metodo":"Canales B4/B3/B2 del compuesto de reflectancia."})
    catalogo.raster("falso_color", "Falso color infrarrojo", np.stack([b10[b] for b in ("B8","B4","B3")]), g10,
                    grupo="Imágenes Sentinel-2", **{**op10,"metodo":"Canales B8/B4/B3 del compuesto de reflectancia."})
    catalogo.raster("falso_color_swir", "Falso color SWIR", np.stack([b20[b] for b in ("B12","B8A","B4")]), g20,
                    grupo="Imágenes Sentinel-2", **{**op20,"metodo":"Canales B12/B8A/B4 del compuesto de reflectancia."})

    rojo, azul, nir, verde = (b10[b] for b in ("B4","B2","B8","B3"))
    ndvi = diferencia_normalizada(nir, rojo)
    savi = cociente(1.5 * (nir-rojo), nir+rojo+0.5)
    evi = cociente(2.5 * (nir-rojo), nir + 6*rojo - 7.5*azul + 1)
    ndmi = diferencia_normalizada(b20["B8"], b20["B11"])
    ndre = diferencia_normalizada(b20["B8A"], b20["B5"])
    for clave,titulo,valores,grilla,estilo,rango,opciones in [
        ("ndvi","NDVI · vigor de la vegetación",ndvi,g10,"YlGn",(-0.2,0.85),op10),
        ("savi","SAVI · vegetación con ajuste al suelo",savi,g10,"YlGn",(-0.15,0.65),op10),
        ("evi","EVI · índice mejorado de vegetación",evi,g10,"YlGn",(-0.15,0.7),op10),
        ("ndmi","NDMI · humedad de la vegetación",ndmi,g20,"BrBG",(-0.6,0.6),op20),
        ("ndre","NDRE · respuesta del borde rojo",ndre,g20,"YlGnBu",(-0.1,0.55),op20),
    ]:
        catalogo.raster(clave,titulo,valores,grilla,grupo="Vegetación",
                       unidad="Índice",cmap=estilo,rango=rango,**opciones)

    validas = np.nan_to_num(q["OBS_VALIDAS"], nan=0.0)
    agua = 100 * cociente(q["AGUA"], validas, validas >= min_dias)
    nieve = 100 * cociente(q["NIEVE"], validas, validas >= min_dias)
    verde_swir = diferencia_normalizada(b20["B3"], b20["B11"])
    catalogo.raster("ndwi","NDWI · contraste de agua y tierra",diferencia_normalizada(verde,nir),g10,
                    grupo="Agua y criósfera",unidad="Índice",cmap="BrBG",rango=(-.5,.5),**op10)
    catalogo.raster("mndwi","MNDWI · agua superficial",np.where(nieve>=50,np.nan,verde_swir),g20,
                    grupo="Agua y criósfera",unidad="Índice",cmap="BrBG",rango=(-.6,.6),
                    **{**op20,"metodo":"Verde/SWIR1; excluye nieve candidata mayoritaria."})
    catalogo.raster("ndsi","NDSI · contraste de nieve",np.where(agua>=50,np.nan,verde_swir),g20,
                    grupo="Agua y criósfera",unidad="Índice",cmap="RdBu",rango=(-.6,.8),
                    **{**op20,"metodo":"Verde/SWIR1; excluye agua candidata mayoritaria."})
    calidad = {"fuente":fuente,"periodo":periodo,"resolucion":"20 m"}
    catalogo.raster("observaciones","Días válidos por píxel",validas,g20,grupo="Calidad",unidad="Días",
                    cmap="magma",rango=(0,len(fechas)),metodo="Días con SCL y bandas válidas.",**calidad)
    for nombre,titulo,fraccion,positivos,estilo,color,criterio in [
        ("agua","Agua candidata",agua,q["AGUA"],"Blues","#0277bd","SCL=6, NDWI>0 y MNDWI>0"),
        ("nieve","Nieve o hielo candidatos",nieve,q["NIEVE"],"PuBu","#8fc8ff","SCL=11, NDSI≥0.40 y verde≥0.12"),
    ]:
        catalogo.raster(f"frecuencia_{nombre}",f"Frecuencia de {titulo.lower()}",fraccion,g20,
                        grupo="Agua y criósfera",unidad="%",cmap=estilo,rango=(0,100),
                        metodo=f"Detecciones/observaciones válidas · {criterio} · mínimo {min_dias} días válidos.",
                        **calidad)
        catalogo.vector_candidato(f"poligonos_{nombre}",titulo,fraccion,positivos,g20,
                                  fuente,periodo,minimo_ha,color)

    if referencia is not None:
        ant10, a10, ant20, a20, antq, antficha = leer_s2(referencia)
        if antficha["periodo"][-2:] != periodo[-2:]:
            raise ValueError("Para comparar estaciones, elige el mismo mes para ambos compuestos.")
        if antficha["fuente"] != fuente:
            raise ValueError("Usa compuestos preparados con la misma fuente en ambos períodos.")
        t0 = antficha["periodo"]
        anteriores = (
            diferencia_normalizada(ant10["B8"], ant10["B4"]),
            diferencia_normalizada(ant20["B8"], ant20["B11"]),
        )
        for clave, titulo, reciente, antiguo, grilla, orig, r in [
            ("cambio_ndvi","Cambio de NDVI",ndvi,anteriores[0],g10,a10,"10 m"),
            ("cambio_ndmi","Cambio de NDMI",ndmi,anteriores[1],g20,a20,"20 m"),
        ]:
            antiguo = proyectar(antiguo,orig,grilla) if orig != grilla else antiguo
            obs_reciente = proyectar(validas,g20,grilla) if g20 != grilla else validas
            obs_anterior = proyectar(antq["OBS_VALIDAS"],a20,grilla) if a20 != grilla else antq["OBS_VALIDAS"]
            cruce = (obs_reciente>=min_dias) & (obs_anterior>=min_dias)
            catalogo.raster(clave,titulo,np.where(cruce,reciente-antiguo,np.nan),grilla,grupo="Cambios",
                            fuente=fuente,periodo=f"{t0} → {periodo}",unidad="Δ del índice",resolucion=r,
                            metodo=f"Reciente menos anterior; mismo mes y ≥{min_dias} días válidos en ambos.",
                            cmap="PuOr",rango=(-.4,.4))


def mapas_relieve(catalogo, dem, fuente=FUENTE_GLO30):
    bandas, src = leer_bandas(dem, ("ALTITUD",))
    margen = catalogo.area.geometry.iloc[0].buffer(90).bounds
    grilla = Grilla.desde_bounds(margen, 30)
    z = proyectar(bandas["ALTITUD"], src, grilla, Resampling.bilinear)
    dy_sur, dx_este = np.gradient(z,30,30)
    dy_norte = -dy_sur
    pendiente = np.degrees(np.arctan(np.hypot(dx_este,dy_norte)))
    exposicion = (np.degrees(np.arctan2(-dx_este,-dy_norte))+360)%360
    sectores = np.where(pendiente>=1,np.floor((exposicion+22.5)/45)%8,np.nan)
    azimut, alt_sol = np.radians([315,45])
    luz = (-dx_este * np.cos(alt_sol) * np.sin(azimut) -
           dy_norte * np.cos(alt_sol) * np.cos(azimut) + np.sin(alt_sol))
    sombra = np.maximum(0,luz/np.sqrt(dx_este**2+dy_norte**2+1))*100
    grid = {"grupo":"Relieve","fuente":fuente,"periodo":"DEM de referencia","resolucion":"≈30 m"}
    catalogo.raster("elevacion","Elevación",z,grilla,unidad="m s. n. m.",cmap="terrain",**grid)
    catalogo.raster("pendiente","Pendiente del terreno",pendiente,grilla,unidad="°",
                    cmap="YlOrBr",rango=(0,55),metodo="Gradiente del DEM en UTM.",**grid)
    catalogo.raster("orientacion","Orientación de laderas",sectores,grilla,unidad="Sector",
                    cmap="twilight",rango=(-.5,7.5),clase=["N","NE","E","SE","S","SO","O","NO"],
                    metodo="Se excluyen pendientes menores de 1°.",**grid)
    catalogo.raster("sombreado","Sombreado del relieve",sombra,grilla,unidad="Luz relativa (%)",
                    cmap="gray",rango=(0,100),metodo="Iluminación simulada de azimut 315° y altura 45°.",**grid)


def mapa_agua_historica(catalogo, archivo):
    """Presenta la ocurrencia histórica sin mezclarla con Sentinel-2 reciente."""
    datos, origen = leer_bandas(archivo, ("ocurrencia",))
    info = json.loads(archivo.with_suffix(".json").read_text(encoding="utf-8"))
    grilla = Grilla.desde_bounds(catalogo.area.total_bounds, 30)
    ocurrencia = proyectar(datos["ocurrencia"], origen, grilla)
    valores = np.where((ocurrencia > 0) & (ocurrencia <= 100), ocurrencia, np.nan)
    catalogo.raster("agua_historica","Ocurrencia histórica de agua",valores,grilla,
                    grupo="Agua y criósfera",fuente=info["fuente"],periodo=info["periodo"],
                    resolucion=info["resolucion"],unidad="%",cmap="Blues",rango=(0,100),
                    metodo="Ocurrencia positiva de agua en Landsat; la visualización muestra celdas con detección.")


CLIMA = {
    "pp_chirps_mes": ("Precipitación mensual CHIRPS", FUENTE_CHIRPS, "0.05° (≈5.5 km)", "mm/mes", "YlGnBu", None),
    "pp_chirps_anomalia": ("Anomalía mensual de precipitación", FUENTE_CHIRPS, "0.05° (≈5.5 km)", "mm/mes", "BrBG", (-70,70)),
    "pp_chirps_anual": ("Precipitación anual CHIRPS", FUENTE_CHIRPS, "0.05° (≈5.5 km)", "mm/año", "YlGnBu", None),
    "pp_imerg_mes": ("Precipitación mensual NASA IMERG", FUENTE_GPM, "0.1° (≈11 km)", "mm/mes", "YlGnBu", None),
    "t2m": ("Temperatura del aire a 2 m", FUENTE_ERA5, "0.1° (≈11 km)", "°C", "RdYlBu_r", None),
    "t2m_anomalia": ("Anomalía de temperatura a 2 m", FUENTE_ERA5, "0.1° (≈11 km)", "°C", "RdBu_r", (-3,3)),
    "radiacion": ("Radiación solar incidente", FUENTE_ERA5, "0.1° (≈11 km)", "kWh/m²/mes", "inferno", None),
    "lst_dia": ("Temperatura superficial diurna", FUENTE_MODIS, "≈1 km", "°C", "RdYlBu_r", None),
    "lst_noche": ("Temperatura superficial nocturna", FUENTE_MODIS, "≈1 km", "°C", "RdYlBu_r", None),
}


def mapas_clima(catalogo, carpeta, mes):
    ficha = carpeta / "fuentes.json"
    metadatos = json.loads(ficha.read_text(encoding="utf-8")) if ficha.is_file() else {}
    for clave,(titulo,fuente,res,unidad,paleta,rango) in CLIMA.items():
        archivo = carpeta / f"{clave}.tif"
        if not archivo.is_file() or (ficha.is_file() and clave not in metadatos):
            continue
        datos, grilla = leer_bandas(archivo, ("valor",))
        info = metadatos.get(clave, {})
        catalogo.raster(clave,titulo,datos["valor"],grilla,grupo="Clima regional",fuente=info.get("fuente",fuente),
                       periodo=info.get("periodo",mes),resolucion=res,unidad=unidad,cmap=paleta,rango=rango,
                       metodo=info.get("metodo","Producto mensual en su cuadrícula de origen."),
                       recortar=False)


def lamina(catalogo, seleccion, archivo):
    """Lámina de lectura rápida. Los GeoTIFF guardan los valores completos."""
    capas = {c["id"]:c for c in catalogo.capas if c["tipo"]=="raster"}
    claves = [k for k in seleccion if k in capas]
    if not claves:
        return
    filas = math.ceil(len(claves)/3)
    plt.rcParams.update({"font.family":"DejaVu Sans","text.color":"#172b36","axes.titlesize":11})
    fig, ejes = plt.subplots(filas,3,squeeze=False,figsize=(14.5,4.7*filas+.9))
    fig.patch.set_facecolor("#f4f6f5")
    fig.suptitle("Ampay Vivo  ·  Mapas de Tamburco",x=.035,y=.975,ha="left",fontsize=21,fontweight="bold")
    for ax in ejes.ravel():
        ax.set_visible(False)
    for ax, clave in zip(ejes.ravel(),claves):
        ax.set_visible(True)
        c = capas[clave]
        with rasterio.open(catalogo.salida/c["geotiff"]) as src:
            datos = src.read(masked=True).astype("float32").filled(np.nan)
            limites = (src.bounds.left,src.bounds.right,src.bounds.bottom,src.bounds.top)
            marco = catalogo.area.to_crs(src.crs)
        ax.set_facecolor("#e3e9e8")
        if datos.shape[0] == 3:
            color = rgb_reflectancia(datos)
            imagen = np.dstack((color,np.all(np.isfinite(datos),axis=0)))
            ax.imshow(imagen,extent=limites,interpolation="nearest")
        else:
            estilo = {"cmap":c["cmap"],"vmin":c["rango"][0],"vmax":c["rango"][1]}
            if c["clases"]:
                n = len(c["clases"])
                estilo = {"cmap":mpl.colors.ListedColormap(c["colores"]),
                          "norm":mpl.colors.BoundaryNorm(np.arange(-.5,n+.5),n)}
            imagen = ax.imshow(datos[0],extent=limites,interpolation="nearest",**estilo)
            bar = fig.colorbar(imagen,ax=ax,orientation="horizontal",fraction=.037,pad=.045,shrink=.92)
            bar.ax.tick_params(labelsize=8,length=2)
            bar.set_label(c["unidad"],fontsize=8)
            if c["clases"]:
                bar.set_ticks(range(len(c["clases"])),labels=c["clases"])
        linea = "#b72e23" if c["regional"] else "#223b45"
        marco.boundary.plot(ax=ax,linewidth=.85,color=linea)
        ax.set_xlim(limites[0],limites[1])
        ax.set_ylim(limites[2],limites[3])
        if clave == "agua_historica":
            fila,col = np.unravel_index(np.nanargmax(datos[0]),datos[0].shape)
            cx,cy = src.transform * (col+.5,fila+.5)
            detalle = ax.inset_axes([.59,.32,.39,.51])
            detalle.set_facecolor("#e3e9e8")
            detalle.imshow(datos[0],extent=limites,cmap=c["cmap"],vmin=0,vmax=100,interpolation="nearest")
            detalle.set(xlim=(cx-460,cx+460),ylim=(cy-460,cy+460),xticks=[],yticks=[])
            detalle.set_title("Detalle",fontsize=8)
        ax.set_title(c["nombre"],loc="left",fontweight="bold",pad=8)
        ax.text(.018,.02,f'{c["periodo"]}  ·  {c["resolucion"]}',
                transform=ax.transAxes,fontsize=8,ha="left",va="bottom",
                bbox={"facecolor":"#f4f6f5","edgecolor":"none","pad":2,"alpha":.93})
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_xlabel("")
        ax.set_ylabel("")
        for borde in ax.spines.values():
            borde.set_visible(False)
        if not c["regional"]:
            ax.add_artist(AnchoredSizeBar(ax.transData,1000,"1 km","lower right",
                                         pad=.4,borderpad=.4,color="#101c24"))
    fig.subplots_adjust(left=.035,right=.965,top=.89,bottom=.08,wspace=.23,hspace=.39)
    fig.text(.035,.034,f"{catalogo.nombre_area} · Copernicus Sentinel-2 y DEM · Source: EC JRC/Google · CHIRPS v3.0",
             ha="left",fontsize=9,color="#455b66")
    fig.savefig(archivo,dpi=145,facecolor=fig.get_facecolor())
    plt.close(fig)

