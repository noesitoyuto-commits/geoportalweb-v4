# GEOPORTAL "DELTA CLUB – VIVO AMPAY" v4.0 (UNAJMA)
**Monitoreo Ambiental y Satelital Multicriterio del Santuario Nacional de Ampay (Apurímac, Perú)**

Geoportal científico bilingüe (**Español / Inglés**) desarrollado para el equipo **Delta Club** de la **Universidad Nacional José María Arguedas (UNAJMA)**. Integra las series históricas de Google Earth Engine (2016–2026) bajo el estándar de **14 columnas**, cartografía real en WGS84 (`EPSG:4326`), pruebas estadísticas no paramétricas de **Mann-Kendall (τ y p-valor)** y **Pendiente de Theil-Sen**, comparador multitemporal de **Retroceso Glaciar**, módulo de **Carga de Datos (CSV, GeoJSON y Fotografías)** y **Reporte Satelital** listo para impresión en PDF.

---

## Para presentar

1. Descomprime el ZIP completo. En Windows, abre **INICIAR_GEOPORTAL.bat**. El lanzador usa Python y abre el geoportal en http://127.0.0.1:5000. Deja abierta la consola.
2. En **Mapa SIG Interactivo**, cambia la capa en el selector **Mapas Ampay**. Abre **Comparación 2017–2026**, selecciona una variable y pulsa la lámina para ampliarla.
3. Ajusta **Desde** y **Hasta** en cualquier sección para filtrar las series mensuales y consultar el mismo rango en las demás secciones. Las fechas del histórico van del 01/01/2016 al 01/11/2026, inclusive. Los archivos mensuales usan como fecha el primer día del mes.
4. En **Retroceso Glaciar**, usa **Guardar foto**. El geoportal conserva la imagen y sus metadatos en la carpeta **fotografias/**. Al pulsar una miniatura, puedes ampliarla.
5. En **Reporte Satelital**, elige **Imprimir / Guardar en PDF** para incluir el rango de fechas, la tabla y las gráficas de tendencia.

**Sin conexión.** Puedes abrir **index.html** directamente para consultar las series, los mapas incluidos y el reporte. El mapa base remoto y las consultas GEE requieren internet. Para guardar y recuperar fotografías desde la galería, abre el geoportal con el servidor local. La primera ejecución del lanzador necesita internet si faltan Flask o Pillow. En terminal puedes ejecutar `python server/app.py` con esas dependencias instaladas.

## 1. Estructura de Carpetas del Proyecto

```text
GEOPORTAL_VIVO_AMPAY_v4/
├── INICIAR_GEOPORTAL.bat           # Arranque local en Windows
├── assets/                        # Logo y bibliotecas web incluidas
├── fotografias/                   # Fotografías de campo y metadatos
├── analisis/
│   ├── Mapas_Ampay_Jupyter/        # Cuaderno, insumos, capas web y GeoTIFF
│   └── Comparacion_2017_2026/      # Cuaderno recibido y 11 láminas
├── index.html                      # Aplicación principal (ejecutable directamente y con servidor)
├── css/
│   └── estilos.css                 # Hoja de estilos (tema oscuro científico, paneles de vidrio y @media print)
├── js/
│   ├── embedded_data.js            # Datos locales (CSV 14 col, GeoJSON, Ráster SAVI e i18n) para abrir sin servidor
│   └── app.js                      # Lógica principal: i18n ES/EN, Estadística Sen/Kendall, Chart.js, Leaflet, Carga y GEE
├── i18n/
│   ├── es.json                     # Diccionario completo de interfaz en Español (por defecto)
│   └── en.json                     # Diccionario completo de interfaz en Inglés
├── data/
│   ├── observations_ampay.csv               # Base consolidada depurada de 14 columnas (1,965 registros únicos)
│   ├── observations_ampay_original_2096.csv # Base original sin filtrar (2,096 registros)
│   ├── 01_vegetacion_ampay.csv              # Factor 1: NDVI, SAVI, NDMI, EVI (Sentinel-2)
│   ├── 02_agua_criosfera_ampay.csv          # Factor 2: NDSI, MNDWI, NDMI, Area_glaciar (Sentinel-2)
│   ├── 03_temperatura_ampay.csv             # Factor 3: LST_DIA, LST_NOCHE (MODIS) y T2M (ERA5-Land)
│   ├── 04_precipitacion_ampay.csv           # Factor 4: PRECIPITACION mensual (ERA5-Land + GPM / CHIRPS)
│   ├── 05_radiacion_ampay.csv               # Factor 5: RADIACION y RADIACION_NASA (ERA5-Land + MODIS MCD18A1)
│   ├── ampay_ecosistemas.geojson            # Polígonos reales en WGS84 (Bosque de Intimpas, Glaciar, Lagunas y Entrada a Ampay)
│   ├── tamburco_district.geojson            # Límite oficial reproyectado a WGS84
│   ├── savi_mean_2016_2026.png              # Ráster satelital SAVI 10m reproyectado con canal alfa
│   └── savi_mean_bounds.json                # Coordenadas geográficas de encuadre del ráster SAVI
├── server/
│   ├── app.py                               # Servidor Backend en Python (Flask + earthengine-api)
│   ├── requirements.txt                     # Dependencias de Python
│   └── gee_scripts/                         # Scripts para Google Earth Engine Code Editor (14 columnas)
│       ├── 01_vegetacion_sentinel2_14col.js
│       ├── 02_agua_criosfera_sentinel2_14col.js
│       └── 03_04_05_clima_modis_era5_gpm_14col.js
└── README.md                       # Manual paso a paso de uso y conexión con Google Earth Engine
```

---

## 2. Mapas y series

- **Mapas Ampay Jupyter** incorpora 22 capas ráster, con color natural, vegetación, agua, nieve, relieve y precipitación, además de las capas vectoriales candidatas. Cada producto indica fecha, fuente y resolución. El polígono cartográfico de Tamburco mide **6,931.977 ha** (UTM 18S, EPSG:32718). La capa histórica de la v3 y el asset configurado en el servidor conservan su ámbito.
- Las láminas comparativas 2017–2026 conservan las salidas renderizadas del cuaderno recibido y sus propios periodos. El filtro general modifica las gráficas, los indicadores y la tabla de series. El Reporte Satelital usa la fuente elegida en Precipitación (GPM IMERG de forma inicial).
- La serie `Area_glaciar` conserva su identificador y valores originales. Representa superficie detectada de nieve y hielo, incluida la nieve estacional. En el histórico hay dos observaciones anteriores a 2021 que superan 3 km² bajo ese método. En 2026 el último mes con valor es octubre, con **0.518 km²**.
- El CSV completo conserva las **14 columnas**. **Exportar gráfico** descarga en PNG los gráficos de la sección abierta.

---

## 3. Guía Paso a Paso para Windows: Conectar con Google Earth Engine (Modo Online)

Las credenciales privadas de Google Earth Engine **nunca se exponen en el código HTML/JS**. En su lugar, el geoportal utiliza el servidor local `server/app.py` (Flask + `earthengine-api`) para consultar Earth Engine de forma segura y entregar los resultados en JSON a la web.

### Paso 1: Instalar Python en Windows
1. Descarga e instala **Python 3.10 o superior** desde [python.org/downloads](https://www.python.org/downloads/).
2. Durante la instalación, marca obligatoriamente la casilla **"Add Python to PATH"**.

### Paso 2: Abrir la Terminal e Instalar las Librerías
Abre **PowerShell** o **Símbolo del sistema (CMD)** dentro de la carpeta `GEOPORTAL_VIVO_AMPAY_v4` y ejecuta:

```powershell
python -m venv venv
venv\Scripts\activate
python -m pip install -r server/requirements.txt
```
*(O bien ejecuta: `pip install -r server/requirements.txt`)*

### Paso 3: Autenticar tu Cuenta de Google Earth Engine
Ejecuta en la misma terminal:

```powershell
earthengine authenticate
```
Se abrirá una pestaña en tu navegador para iniciar sesión con tu cuenta de Google registrada en Earth Engine y autorizar el token local en tu equipo.

### Paso 4: Configurar tu Proyecto de Google Cloud / GEE e Iniciar el Servidor
El servidor viene preconfigurado con el proyecto `wise-brook-514714-p4` y el asset `projects/wise-brook-514714-p4/assets/tamburco_glaciar` (también compatible con `silent-polygon-514714-f8`). Si deseas especificar tu propio ID de proyecto, defínelo y ejecuta el servidor:

```powershell
set GEE_PROJECT_ID=wise-brook-514714-p4
set GEE_ASSET_ID=projects/wise-brook-514714-p4/assets/tamburco_glaciar
python server/app.py
```

### Paso 5: Abrir el Geoportal en Modo Online
1. Abre en tu navegador la dirección: **`http://127.0.0.1:5000`**
2. En la barra superior del Geoportal, haz clic en el botón **"Conectar GEE Online"** (o alterna la insignia de estado).
3. La insignia cambiará a verde (**`Modo Online (GEE API Activa)`**). Si el servidor Python se detiene o no hay internet, el geoportal vuelve automáticamente a **`Modo Local (Contingencia)`** sin interrumpir el trabajo.

---

## 4. Validación de la Base de Datos (Esquema de 14 Columnas)

Todos los archivos CSV incluidos y el validador de carga de usuario verifican estrictamente los **14 campos obligatorios**:
1. `fecha` (`YYYY-MM-DD`)
2. `zona_id` (`AMPAY`, `USPACC01`, `ANGASC01`, etc.)
3. `variable` (`NDVI`, `SAVI`, `NDMI`, `EVI`, `NDSI`, `MNDWI`, `Area_glaciar`, `LST_DIA`, `LST_NOCHE`, `T2M`, `PRECIPITACION`, `RADIACION`, `RADIACION_NASA`)
4. `valor` (numérico o vacío cuando `calidad = SIN_DATOS`)
5. `unidad` (`adimensional`, `km2`, `grados_C`, `mm_mes`, `kWh_m2_mes`)
6. `estadistico`
7. `sensor` (`Sentinel-2`, `MODIS`, `ERA5-Land`, `GPM IMERG V07`, `CHIRPS v3.0`)
8. `fuente`
9. `coleccion`
10. `resolucion_m`
11. `n_observaciones`
12. `cobertura_valida_pct`
13. `calidad` (`ALTA`, `PARCIAL`, `SIN_DATOS`)
14. `periodo_completo` (`True` / `False`)
