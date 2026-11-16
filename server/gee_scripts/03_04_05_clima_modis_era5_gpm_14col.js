// ============================================================================
// MÓDULOS 3, 4 Y 5: TEMPERATURA (MODIS + ERA5), PRECIPITACIÓN (GPM + ERA5) Y RADIACIÓN
// Esquema Estandarizado de 14 Columnas - DELTA CLUB – VIVO AMPAY
// ============================================================================

var aoi = ee.FeatureCollection('projects/wise-brook-514714-p4/assets/tamburco_glaciar');
var region = aoi.geometry();
var startDate = ee.Date('2016-01-01');
var endDate = ee.Date('2026-11-02');

// 1. MODIS LST (MODIS/061/MOD11A2) -> LST_DIA y LST_NOCHE en °C
var modisLst = ee.ImageCollection('MODIS/061/MOD11A2')
  .filterBounds(region)
  .filterDate(startDate, endDate)
  .map(function(img) {
    var lstDay = img.select('LST_Day_1km').multiply(0.02).subtract(273.15).rename('LST_DIA');
    var lstNight = img.select('LST_Night_1km').multiply(0.02).subtract(273.15).rename('LST_NOCHE');
    return lstDay.addBands(lstNight).copyProperties(img, ['system:time_start']);
  });

// 2. ERA5-Land Monthly Aggregated (ECMWF/ERA5_LAND/MONTHLY_AGGR) -> T2M (°C) y RADIACION (kWh/m2/mes)
var era5 = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR')
  .filterBounds(region)
  .filterDate(startDate, endDate);

// 3. GPM IMERG V07 Monthly (NASA/GPM_L3/IMERG_MONTHLY_V07) -> PRECIPITACION (mm/mes)
var gpm = ee.ImageCollection('NASA/GPM_L3/IMERG_MONTHLY_V07')
  .filterBounds(region)
  .filterDate(startDate, endDate);

print('Colecciones listas para exportación mensual de 14 columnas:', modisLst.size(), era5.size(), gpm.size());
