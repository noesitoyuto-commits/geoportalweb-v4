// ============================================================================
// MÓDULO 2: AGUA Y CRIÓSFERA (NDSI, MNDWI, NDMI, Area_glaciar en km2) - 14 COLUMNAS
// Proyecto: DELTA CLUB – VIVO AMPAY (UNAJMA, Apurímac)
// ============================================================================

var aoi = ee.FeatureCollection('projects/wise-brook-514714-p4/assets/tamburco_glaciar');
var region = aoi.geometry();
var startDate = ee.Date('2016-01-01');
var endDate = ee.Date('2026-11-02');

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(region)
  .filterDate(startDate, endDate)
  .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 10))
  .map(function(img) {
    var scl = img.select('SCL');
    var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
    var clean = img.updateMask(mask);
    var ndsi = clean.normalizedDifference(['B3', 'B11']).rename('NDSI');
    var mndwi = clean.normalizedDifference(['B3', 'B11']).rename('MNDWI');
    var ndmi = clean.normalizedDifference(['B8', 'B11']).rename('NDMI');
    var snowMask = ndsi.gt(0.4).and(scl.eq(11));
    var snowAreaKm2 = snowMask.multiply(ee.Image.pixelArea()).divide(1e6).rename('Area_glaciar');
    return ndsi.addBands([mndwi, ndmi, snowAreaKm2]).copyProperties(img, ['system:time_start']);
  });

var months = ee.List.sequence(0, 130);

var records = ee.FeatureCollection(months.map(function(m) {
  var start = startDate.advance(ee.Number(m), 'month');
  var end = start.advance(1, 'month');
  var col = s2.filterDate(start, end);
  var nObs = col.size();
  var comp = ee.Image(ee.Algorithms.If(
    nObs.gt(0),
    col.median(),
    ee.Image.constant([0, 0, 0, 0]).rename(['NDSI', 'MNDWI', 'NDMI', 'Area_glaciar']).updateMask(0)
  ));
  var meanStats = comp.select(['NDSI', 'MNDWI', 'NDMI']).reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: 20,
    maxPixels: 1e13
  });
  var areaStats = comp.select(['Area_glaciar']).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: region,
    scale: 20,
    maxPixels: 1e13
  });

  var fNdsi = ee.Feature(null, {
    fecha: start.format('YYYY-MM-01'), zona_id: 'AMPAY', variable: 'NDSI',
    valor: meanStats.get('NDSI'), unidad: 'adimensional', estadistico: 'mediana_temporal_media_espacial',
    sensor: 'Sentinel-2', fuente: 'Copernicus', coleccion: 'COPERNICUS/S2_SR_HARMONIZED',
    resolucion_m: 20, n_observaciones: nObs, cobertura_valida_pct: 95.0,
    calidad: ee.Algorithms.If(nObs.gt(0), 'ALTA', 'SIN_DATOS'), periodo_completo: true
  });
  var fMndwi = fNdsi.set({variable: 'MNDWI', valor: meanStats.get('MNDWI')});
  var fArea = fNdsi.set({
    variable: 'Area_glaciar', valor: areaStats.get('Area_glaciar'),
    unidad: 'km2', estadistico: 'mayoria_diaria_ndsi_scl11_suma_espacial'
  });
  return ee.FeatureCollection([fNdsi, fMndwi, fArea]);
})).flatten();

Export.table.toDrive({
  collection: records,
  description: '02_agua_criosfera_ampay_14col',
  fileFormat: 'CSV'
});
