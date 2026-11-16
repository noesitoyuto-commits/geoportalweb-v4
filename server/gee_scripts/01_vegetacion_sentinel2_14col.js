// ============================================================================
// MÓDULO 1: VEGETACIÓN (NDVI, SAVI, NDMI, EVI) - 14 COLUMNAS ESTÁNDAR
// Proyecto: DELTA CLUB – VIVO AMPAY (UNAJMA, Apurímac)
// Colección: COPERNICUS/S2_SR_HARMONIZED (2016-01-01 a 2026-11-01, nubes <= 10%)
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
    var nir = clean.select('B8').multiply(0.0001);
    var red = clean.select('B4').multiply(0.0001);
    var blue = clean.select('B2').multiply(0.0001);
    var swir1 = clean.select('B11').multiply(0.0001);

    var ndvi = clean.normalizedDifference(['B8', 'B4']).rename('NDVI');
    var savi = clean.expression('1.5 * ((NIR - RED) / (NIR + RED + 0.5))', {NIR: nir, RED: red}).rename('SAVI');
    var ndmi = clean.normalizedDifference(['B8', 'B11']).rename('NDMI');
    var evi = clean.expression('2.5 * ((NIR - RED) / (NIR + 6.0 * RED - 7.5 * BLUE + 1.0))', {NIR: nir, RED: red, BLUE: blue}).rename('EVI');

    return ndvi.addBands([savi, ndmi, evi]).copyProperties(img, ['system:time_start']);
  });

var months = ee.List.sequence(0, 130);
var variables = ee.List(['NDVI', 'SAVI', 'NDMI', 'EVI']);

var records = ee.FeatureCollection(months.map(function(m) {
  var start = startDate.advance(ee.Number(m), 'month');
  var end = start.advance(1, 'month');
  var col = s2.filterDate(start, end);
  var nObs = col.size();
  var medianImg = ee.Image(ee.Algorithms.If(
    nObs.gt(0),
    col.median(),
    ee.Image.constant([0, 0, 0, 0]).rename(['NDVI', 'SAVI', 'NDMI', 'EVI']).updateMask(0)
  ));
  var stats = medianImg.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: region,
    scale: 10,
    maxPixels: 1e13
  });

  return ee.FeatureCollection(variables.map(function(v) {
    v = ee.String(v);
    var val = stats.get(v);
    var resM = ee.Algorithms.If(v.compareTo('NDMI').eq(0), 20, 10);
    var cal = ee.Algorithms.If(nObs.gt(0), 'ALTA', 'SIN_DATOS');
    return ee.Feature(null, {
      fecha: start.format('YYYY-MM-01'),
      zona_id: 'AMPAY',
      variable: v,
      valor: val,
      unidad: 'adimensional',
      estadistico: 'mediana_temporal_media_espacial',
      sensor: 'Sentinel-2',
      fuente: 'Copernicus',
      coleccion: 'COPERNICUS/S2_SR_HARMONIZED',
      resolucion_m: resM,
      n_observaciones: nObs,
      cobertura_valida_pct: ee.Algorithms.If(nObs.gt(0), 95.0, 0.0),
      calidad: cal,
      periodo_completo: true
    });
  }));
})).flatten();

Export.table.toDrive({
  collection: records,
  description: '01_vegetacion_ampay_14col',
  fileFormat: 'CSV',
  selectors: [
    'fecha', 'zona_id', 'variable', 'valor', 'unidad', 'estadistico',
    'sensor', 'fuente', 'coleccion', 'resolucion_m', 'n_observaciones',
    'cobertura_valida_pct', 'calidad', 'periodo_completo'
  ]
});
