# Mapas para Ampay Vivo
   
Este paquete trabaja con el shapefile del equipo **tamburco_glaciar**. El área verificada corresponde al **distrito de Tamburco** y mide aproximadamente **6 932 ha** en UTM 18 Sur. Para una publicación circunscrita al Santuario Nacional de Ampay, selecciona su límite oficial en el cuaderno. SERNANP reporta **3 635,50 ha** para el área protegida.
   
## Abrir el cuaderno

1. Extrae la carpeta completa. Abre una terminal en la carpeta que contiene **Mapas_Ampay.ipynb**.
2. Si aún no tienes el entorno, instala las dependencias y abre JupyterLab.

   ```cmd
   py -m pip install -r requirements.txt
   py -m jupyter lab
   ```

3. Abre **Mapas_Ampay.ipynb**. En Jupyter selecciona **Run → Run All Cells**. El ejemplo usa los GeoTIFF incluidos y funciona sin autenticar Earth Engine.
4. Revisa la lámina y el catálogo en **salidas/2026-08/**. Dentro de **geoportal/** puedes abrir **vista_previa.html** en Chrome. Leaflet y el mapa base se cargan por internet.

El ejemplo óptico compara **agosto de 2020 y agosto de 2026**, con tres fechas Sentinel-2 por período seleccionadas por cobertura dentro del distrito. Los índices se aplican al **compuesto de mediana de reflectancia** por período, con control por SCL. Las celdas de calidad y los metadatos de cada compuesto identifican las fechas reales. La lluvia regional incluida corresponde a **agosto de 2026**.

## Capas y formatos

| Carpeta o archivo | Uso |
|---|---|
| **geotiff/** | Valores, proyección, unidades y NoData. Para análisis o QGIS. |
| **geoportal/** | PNG transparentes, polígonos GeoJSON y selector de capas Leaflet con fuentes, resoluciones, fechas y leyendas. |
| **catalogo.json** | Inventario, cobertura de datos y método por capa. |
| **lamina_ampay.png** | Vista de seis mapas para una presentación. |

Para incluir las capas en la **v3**, copia la carpeta **geoportal** desde la salida que elijas a **data/mapas_ampay** en la carpeta de la v3, con todos sus archivos. En **index.html** agrega esta etiqueta antes de la que carga **js/app.js**.

```html
<script src="data/mapas_ampay/capas_ampay.js"></script>
```

Dentro de **initOrUpdateMap()** en **js/app.js**, agrega esta llamada inmediatamente debajo de la línea que asigna **state.map = L.map(...)**.

```js
window.agregarMapasJupyterAmpay?.(state.map);
```

Abre el **Mapa SIG Interactivo**. El selector **Capas de Jupyter** añade una capa a la vez. El campo **Ver extensión de la capa** amplía el encuadre según la capa elegida. Las capas de clima conservan la cuadrícula del producto y se leen mejor con el encuadre regional.

## Otros meses con Earth Engine

Configura las variables de la celda de configuración. Para datos nuevos, activa **DESCARGAR_S2_GEE** o **DESCARGAR_CLIMA_GEE**. El campo **PROYECTO_GEE** está configurado para el proyecto del equipo. Si las credenciales han vencido, completa la autenticación en el navegador con **earthengine authenticate**, desde la terminal de tu computadora.

- Sentinel-2 SR armonizado puede generar otros meses con escenas disponibles desde 2017. Para los mapas de cambio elige el mismo mes en ambos años. La muestra de 2020 y 2026 es un contraste entre dos períodos de ejemplo.
- CHIRPS mensual y anual exigen pentadas completas. Para la anomalía se usa el mismo mes calendario de 1991–2020. Activa **ANIO_LLUVIA_ANUAL** con un año calendario completo.
- IMERG utiliza el producto mensual si está disponible. Si usa el de media hora exige la cobertura temporal del mes completo y el catálogo identifica su posible condición provisional.
- MODIS estima **temperatura de superficie** diurna y nocturna. ERA5-Land aporta **temperatura del aire** a 2 m y radiación solar acumulada. 
- **pp_pisco_Nevado.xlsx** aporta una sola serie mensual. El cuaderno la consulta como referencia temporal. Para un mapa PISCOp se requieren celdas georreferenciadas o puntos con coordenadas.

Los polígonos de agua y de nieve/hielo indican **detecciones candidatas** de los días considerados. Revisa el color natural y la cobertura antes de asignarles un nombre o usar su área. La categoría de nieve/hielo incluye cobertura estacional. Para ubicar agua como referencia, abre **Ocurrencia histórica de agua**. Esta capa contiene detecciones Landsat de 1984–2024, con atribución **Source: EC JRC/Google**.

## Fuentes

- [Sentinel-2 SR armonizado y clasificación SCL](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- [Earth Search Sentinel-2 L2A](https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a) y archivos STAC por escena en **insumos/s2/**
- [Copernicus DEM GLO-30](https://registry.opendata.aws/copernicus-dem/)
- [EC JRC/Google Global Surface Water v1.5](https://global-surface-water.appspot.com/download) · Pekel et al. (2016), [doi:10.1038/nature20584](https://doi.org/10.1038/nature20584)
- [CHIRPS v3.0](https://www.chc.ucsb.edu/data/chirps3)
- [GPM IMERG V07 de NASA](https://developers.google.com/earth-engine/datasets/catalog/NASA_GPM_L3_IMERG_V07)
- [MODIS MOD11A2 de NASA](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2)
- [ERA5-Land mensual](https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_MONTHLY_AGGR)
- [Santuario Nacional de Ampay y extensión oficial de SERNANP](https://www.gob.pe/institucion/sernanp/informes-publicaciones/1928581-santuario-nacional-de-ampay)

