/* ==========================================================================
   GEOPORTAL "DELTA CLUB – VIVO AMPAY" v4.0 (UNAJMA)
   - Ecuaciones y pruebas estadísticas
   - Cero Emojis (Iconografía SVG Vectorial Científica de Telemetría)
   - Observatorio HUD Satelital Flotante + 9 Pestañas + Explorador de Datos 2016–2026
   - Opción de Agrandar / Maximizar cualquier tarjeta y escalar interfaz
   ========================================================================== */

(() => {
  'use strict';

  const MANDATORY_14_COLS = [
    'fecha', 'zona_id', 'variable', 'valor', 'unidad', 'estadistico',
    'sensor', 'fuente', 'coleccion', 'resolucion_m', 'n_observaciones',
    'cobertura_valida_pct', 'calidad', 'periodo_completo'
  ];

  // Metadatos científicos bilingües + Fórmulas exactas en LaTeX para KaTeX
  const VAR_META = {
    NDVI: {
      latex: '\\text{NDVI} = \\frac{\\rho_{\\text{NIR}} - \\rho_{\\text{Red}}}{\\rho_{\\text{NIR}} + \\rho_{\\text{Red}}} = \\frac{B_8 - B_4}{B_8 + B_4}',
      es: {
        name: 'NDVI · Índice de Vegetación de Diferencia Normalizada',
        short: 'NDVI (Vigor Vegetal)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#10b981',
        desc: 'Evalúa la densidad de biomasa fotosintéticamente activa del Bosque de Intimpas (Podocarpus glomeratus).'
      },
      en: {
        name: 'NDVI · Normalized Difference Vegetation Index',
        short: 'NDVI (Vegetation Vigor)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#10b981',
        desc: 'Evaluates photosynthetically active biomass density across the Intimpa forest (Podocarpus glomeratus).'
      }
    },
    SAVI: {
      latex: '\\text{SAVI} = (1 + L)\\,\\frac{B_8 - B_4}{B_8 + B_4 + L}, \\quad L = 0.5',
      es: {
        name: 'SAVI · Índice de Vegetación Ajustado al Suelo',
        short: 'SAVI (Ajustado al Suelo)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#22c55e',
        desc: 'Minimiza la influencia del brillo del suelo en laderas andinas con cobertura vegetal intermedia.'
      },
      en: {
        name: 'SAVI · Soil-Adjusted Vegetation Index',
        short: 'SAVI (Soil-Adjusted)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#22c55e',
        desc: 'Minimizes soil brightness background effects on Andean slopes with intermediate canopy cover.'
      }
    },
    NDMI: {
      latex: '\\text{NDMI} = \\frac{\\rho_{\\text{NIR}} - \\rho_{\\text{SWIR1}}}{\\rho_{\\text{NIR}} + \\rho_{\\text{SWIR1}}} = \\frac{B_8 - B_{11}}{B_8 + B_{11}}',
      es: {
        name: 'NDMI · Índice Diferencial de Humedad Vegetal',
        short: 'NDMI (Humedad Foliar)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#06b6d4',
        desc: 'Mide el contenido hídrico foliar del dosel forestal y la humedad del ecosistema para vigilancia de sequías.'
      },
      en: {
        name: 'NDMI · Normalized Difference Moisture Index',
        short: 'NDMI (Canopy Moisture)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#06b6d4',
        desc: 'Measures forest canopy foliar water content and ecosystem moisture for drought surveillance.'
      }
    },
    EVI: {
      latex: '\\text{EVI} = 2.5\\,\\frac{B_8 - B_4}{B_8 + 6\\,B_4 - 7.5\\,B_2 + 1}',
      es: {
        name: 'EVI · Índice de Vegetación Mejorado',
        short: 'EVI (Biomasa Densa)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#84cc16',
        desc: 'Optimiza la sensibilidad en zonas de alta biomasa del bosque montano corrigiendo dispersión por aerosoles.'
      },
      en: {
        name: 'EVI · Enhanced Vegetation Index',
        short: 'EVI (Dense Biomass)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (10 m)',
        color: '#84cc16',
        desc: 'Optimizes sensitivity in high-biomass montane forest regions while correcting aerosol scattering.'
      }
    },
    NDSI: {
      latex: '\\text{NDSI} = \\frac{\\rho_{\\text{Green}} - \\rho_{\\text{SWIR1}}}{\\rho_{\\text{Green}} + \\rho_{\\text{SWIR1}}} = \\frac{B_3 - B_{11}}{B_3 + B_{11}}',
      es: {
        name: 'NDSI · Índice Diferencial Normalizado de Nieve',
        short: 'NDSI (Cobertura Nival)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#38bdf8',
        desc: 'Discrimina nieve y hielo glaciar frente a nubosidad aprovechando la fuerte absorción en banda SWIR1.'
      },
      en: {
        name: 'NDSI · Normalized Difference Snow Index',
        short: 'NDSI (Snow Cover)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#38bdf8',
        desc: 'Discriminates snow and glacier ice from cloud cover using strong SWIR1 absorption.'
      }
    },
    Area_glaciar: {
      latex: 'A_{\\text{glaciar}} = \\frac{1}{10^6}\\sum_{i \\in \\Omega} \\mathbb{I}\\!\\left(\\text{NDSI}_i > 0.4 \\land \\text{SCL}_i = 11\\right)\\cdot A_i \\; [\\text{km}^2]',
      es: {
        name: 'Superficie detectada de nieve y hielo (Area_glaciar)',
        short: 'Nieve y hielo detectados (km²)',
        unit: 'km²',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#60a5fa',
        desc: 'Superficie detectada mediante NDSI y SCL en el área de estudio. Incluye nieve estacional y hielo espectralmente similar.'
      },
      en: {
        name: 'Detected Snow and Ice Area (Area_glaciar)',
        short: 'Detected Snow and Ice (km²)',
        unit: 'km²',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#60a5fa',
        desc: 'Area detected via NDSI and SCL in the study area. Includes seasonal snow and spectrally similar ice.'
      }
    },
    MNDWI: {
      latex: '\\text{MNDWI} = \\frac{\\rho_{\\text{Green}} - \\rho_{\\text{SWIR1}}}{\\rho_{\\text{Green}} + \\rho_{\\text{SWIR1}}} = \\frac{B_3 - B_{11}}{B_3 + B_{11}}',
      es: {
        name: 'MNDWI · Índice de Agua Modificado',
        short: 'MNDWI (Espejos de Agua)',
        unit: 'adimensional',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#0ea5e9',
        desc: 'Delimita espejos de agua libre y humedad superficial en lagunas altoandinas (Uspaccocha y Angascocha).'
      },
      en: {
        name: 'MNDWI · Modified Normalized Difference Water Index',
        short: 'MNDWI (Surface Water)',
        unit: 'dimensionless',
        collection: 'COPERNICUS/S2_SR_HARMONIZED (20 m)',
        color: '#0ea5e9',
        desc: 'Deliniates open water bodies and surface moisture in high-Andean lagoons (Uspaccocha and Angascocha).'
      }
    },
    LST_DIA: {
      latex: 'T_{s,\\text{día}} = 0.02\\cdot \\text{DN}_{\\text{LST\\_Day}} - 273.15 \\; [^\\circ\\text{C}]',
      es: {
        name: 'LST Diurna · Temperatura Superficial (Día)',
        short: 'LST Día (°C)',
        unit: '°C',
        collection: 'MODIS/061/MOD11A2 (1000 m)',
        color: '#f97316',
        desc: 'Temperatura radiométrica de la superficie terrestre durante el paso diurno del sensor MODIS.'
      },
      en: {
        name: 'Daytime LST · Land Surface Temperature (Day)',
        short: 'Day LST (°C)',
        unit: '°C',
        collection: 'MODIS/061/MOD11A2 (1000 m)',
        color: '#f97316',
        desc: 'Radiometric land surface temperature during the daytime MODIS sensor overpass.'
      }
    },
    LST_NOCHE: {
      latex: 'T_{s,\\text{noche}} = 0.02\\cdot \\text{DN}_{\\text{LST\\_Night}} - 273.15 \\; [^\\circ\\text{C}]',
      es: {
        name: 'LST Nocturna · Temperatura Superficial (Noche)',
        short: 'LST Noche (°C)',
        unit: '°C',
        collection: 'MODIS/061/MOD11A2 (1000 m)',
        color: '#a855f7',
        desc: 'Régimen térmico nocturno en alta montaña, crítico para evaluar heladas y pérdida de masa glaciar.'
      },
      en: {
        name: 'Nighttime LST · Land Surface Temperature (Night)',
        short: 'Night LST (°C)',
        unit: '°C',
        collection: 'MODIS/061/MOD11A2 (1000 m)',
        color: '#a855f7',
        desc: 'Nighttime high-mountain thermal regime, critical for evaluating frost and glacier mass loss.'
      }
    },
    T2M: {
      latex: 'T_{2\\text{m}} = T_{\\text{ERA5}}(2\\,\\text{m}) - 273.15 \\; [^\\circ\\text{C}]',
      es: {
        name: 'T2M · Temperatura del Aire a 2 Metros',
        short: 'T2M Aire 2m (°C)',
        unit: '°C',
        collection: 'ECMWF/ERA5_LAND/MONTHLY_AGGR (11.1 km)',
        color: '#eab308',
        desc: 'Temperatura ambiente del aire a 2 metros sobre el suelo estimada por el reanálisis climático ERA5-Land.'
      },
      en: {
        name: 'T2M · 2-Meter Air Temperature',
        short: 'T2M Air 2m (°C)',
        unit: '°C',
        collection: 'ECMWF/ERA5_LAND/MONTHLY_AGGR (11.1 km)',
        color: '#eab308',
        desc: 'Ambient air temperature at 2 meters above ground estimated by the ERA5-Land reanalysis.'
      }
    },
    PRECIPITACION: {
      latex: 'P_{m} = \\sum_{d=1}^{N_m} P_{d} \\; [\\text{mm}\\cdot\\text{mes}^{-1}], \\quad A_{\\%} = \\left(\\frac{P_m - \\bar{P}}{\\bar{P}}\\right)\\times 100',
      es: {
        name: 'Precipitación Mensual Acumulada',
        short: 'Precipitación (mm/mes)',
        unit: 'mm/mes',
        collection: 'NASA/GPM_L3/IMERG_V07 + CHIRPS v3.0',
        color: '#3b82f6',
        desc: 'Precipitación líquida y sólida acumulada mensualmente en la cabecera de cuenca del Santuario de Ampay.'
      },
      en: {
        name: 'Monthly Accumulated Precipitation',
        short: 'Precipitation (mm/month)',
        unit: 'mm/month',
        collection: 'NASA/GPM_L3/IMERG_V07 + CHIRPS v3.0',
        color: '#3b82f6',
        desc: 'Monthly accumulated liquid and solid precipitation across the Ampay Sanctuary headwaters.'
      }
    },
    RADIACION: {
      latex: 'R_{s\\downarrow} = \\frac{1}{3.6\\times 10^6}\\int_{t_0}^{t_1} I_{\\text{SW}\\downarrow}(t)\\,dt \\; [\\text{kWh}\\cdot\\text{m}^{-2}\\cdot\\text{mes}^{-1}]',
      es: {
        name: 'Radiación Solar de Onda Corta Incidente (ERA5-Land)',
        short: 'Radiación ERA5-Land (kWh/m²/mes)',
        unit: 'kWh/m²/mes',
        collection: 'ECMWF/ERA5_LAND/MONTHLY_AGGR (11.1 km)',
        color: '#f59e0b',
        desc: 'Energía solar incidente de onda corta integrada mensualmente sobre la superficie de alta montaña.'
      },
      en: {
        name: 'Incident Shortwave Solar Radiation (ERA5-Land)',
        short: 'ERA5-Land Radiation (kWh/m²/mo)',
        unit: 'kWh/m²/month',
        collection: 'ECMWF/ERA5_LAND/MONTHLY_AGGR (11.1 km)',
        color: '#f59e0b',
        desc: 'Monthly integrated shortwave downward solar energy reaching the high-mountain surface.'
      }
    },
    RADIACION_NASA: {
      latex: 'R_{\\text{MODIS}\\downarrow} = \\sum_{h} \\text{DSR}_{3\\text{h}} \\cdot \\Delta t \\; [\\text{kWh}\\cdot\\text{m}^{-2}\\cdot\\text{mes}^{-1}]',
      es: {
        name: 'Radiación Solar Descendente (MODIS MCD18A1)',
        short: 'Radiación MODIS (kWh/m²/mes)',
        unit: 'kWh/m²/mes',
        collection: 'MODIS/062/MCD18A1 (1000 m)',
        color: '#fbbf24',
        desc: 'Flujo radiativo solar de onda corta estimado directamente por observaciones satelitales MODIS.'
      },
      en: {
        name: 'Downward Shortwave Solar Radiation (MODIS MCD18A1)',
        short: 'MODIS Radiation (kWh/m²/mo)',
        unit: 'kWh/m²/month',
        collection: 'MODIS/062/MCD18A1 (1000 m)',
        color: '#fbbf24',
        desc: 'Shortwave downward solar radiative flux estimated directly from MODIS satellite observations.'
      }
    }
  };

  const SERIES_LIMITS = { start: '2016-01-01', end: '2026-11-01' };
  const MAPPED_AREA_HA = 6931.977;

  const state = {
    range: { ...SERIES_LIMITS },
    savedPhotos: [],
    lang: 'es',
    mode: 'local',
    aiEnabled: true,
    editMode: false,
    uiScale: 1.0,
    activeTab: 'tab-hud',
    observations: [],
    geojson: null,
    saviBounds: null,
    saviImage: null,
    i18n: { es: {}, en: {} },
    charts: {},
    hudMap: null,
    hudLayers: {},
    hudBaseLayers: {},
    map: null,
    mapLayers: {},
    baseLayers: {},
    dbPage: 1,
    dbPageSize: 60,
    customPhotos: [
      {
        title_es: 'Bosque Relicto de Intimpas (Podocarpus glomeratus)',
        title_en: 'Relict Intimpa Forest (Podocarpus glomeratus)',
        sector: 'Santuario Nacional de Ampay (3,350 m s.n.m.)',
        date: '2026-08-14',
        img: null,
        svgPlaceholder: 'forest'
      },
      {
        title_es: 'Laguna Uspaccocha y Cumbre del Nevado Ampay',
        title_en: 'Uspaccocha Lagoon & Mount Ampay Peak',
        sector: 'Sector Criosférico (3,750 – 5,235 m s.n.m.)',
        date: '2026-09-22',
        img: null,
        svgPlaceholder: 'glacier'
      },
      {
        title_es: 'Entrada a Ampay – Caseta de Control SERNANP',
        title_en: 'Ampay Entrance – SERNANP Ranger Station',
        sector: 'Sector Sahuanay - Tamburco (3,150 m s.n.m.)',
        date: '2026-10-19',
        img: null,
        svgPlaceholder: 'station'
      }
    ]
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showToast(msg) {
    const el = $('#toastMsg');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function t(key) {
    const dict = state.i18n[state.lang] || state.i18n.es || {};
    return dict[key] || key;
  }

  function varInfo(v) {
    const entry = VAR_META[v];
    if (!entry) {
      return {
        latex: `\\text{${v}}`,
        name: v, short: v, unit: '', collection: 'Custom / Usuario',
        color: '#2dd4bf', desc: ''
      };
    }
    const loc = entry[state.lang] || entry.es;
    return { ...loc, latex: entry.latex };
  }

  // ==========================================================================
  // RENDERIZADOR MATEMÁTICO LATEX CON KATEX
  // ==========================================================================
  function renderLatexIn(elementOrId, latexStr, displayMode = false) {
    const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!el) return;
    if (window.katex && typeof window.katex.render === 'function') {
      try {
        window.katex.render(latexStr, el, {
          throwOnError: false,
          displayMode: displayMode
        });
        return;
      } catch (e) {}
    }
    el.textContent = latexStr;
  }

  // ==========================================================================
  // 1. ESTADÍSTICA NO PARAMÉTRICA: THEIL-SEN Y MANN-KENDALL
  // ==========================================================================
  function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
    const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const tVal = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * tVal + a4) * tVal) + a3) * tVal + a2) * tVal + a1) * tVal * Math.exp(-x * x);
    return sign * y;
  }

  function normalPValue(z) {
    return 1.0 - erf(Math.abs(z) / Math.SQRT2);
  }

  function dateToFractionalYear(dateStr) {
    if (!dateStr) return 2016;
    const parts = String(dateStr).split('-').map(Number);
    const y = parts[0] || 2016;
    const m = parts[1] || 1;
    return y + (m - 0.5) / 12.0;
  }

  function computeSenAndKendall(points) {
    const valid = points.filter(p => Number.isFinite(p.value));
    const n = valid.length;
    if (n < 3) {
      const ys = valid.map(p => p.value).sort((a, b) => a - b);
      const mean = n ? ys.reduce((a, b) => a + b, 0) / n : 0;
      return {
        n, mean, median: mean, sd: n === 2 ? (ys[1] - ys[0]) / 2 : 0,
        q1: ys[0] ?? 0, q3: ys[0] ?? 0, min: ys[0] ?? 0, max: ys[n - 1] ?? 0,
        senSlopeYr: 0, senSlopeDecade: 0, intercept: 0,
        tau: 0, zScore: 0, pValue: 1, significant: false,
        trendLine: points.map(() => null),
        interpretation: state.lang === 'es'
          ? 'Datos insuficientes (mínimo 3 observaciones válidas) para estimar pendiente de Sen y prueba de Mann-Kendall.'
          : 'Insufficient data (minimum 3 valid observations) to estimate Sen slope and Mann-Kendall test.'
      };
    }

    const xs = valid.map(p => dateToFractionalYear(p.date));
    const ys = valid.map(p => Number(p.value));
    const sortedY = [...ys].sort((a, b) => a - b);
    const mean = ys.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 1 ? sortedY[(n - 1) / 2] : 0.5 * (sortedY[n / 2 - 1] + sortedY[n / 2]);
    const sd = Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
    const q1 = sortedY[Math.floor((n - 1) * 0.25)];
    const q3 = sortedY[Math.floor((n - 1) * 0.75)];
    const min = sortedY[0];
    const max = sortedY[n - 1];

    const slopes = [];
    let sCount = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const dt = xs[j] - xs[i];
        const dy = ys[j] - ys[i];
        if (dt > 0) slopes.push(dy / dt);
        if (dy > 0) sCount += 1;
        else if (dy < 0) sCount -= 1;
      }
    }
    slopes.sort((a, b) => a - b);
    const mSlopes = slopes.length;
    const senSlopeYr = mSlopes === 0 ? 0 : (
      mSlopes % 2 === 1
        ? slopes[(mSlopes - 1) / 2]
        : 0.5 * (slopes[mSlopes / 2 - 1] + slopes[mSlopes / 2])
    );
    const senSlopeDecade = senSlopeYr * 10.0;

    const t0 = xs[0];
    const intercepts = valid.map((_, idx) => ys[idx] - senSlopeYr * (xs[idx] - t0)).sort((a, b) => a - b);
    const intercept0 = n % 2 === 1 ? intercepts[(n - 1) / 2] : 0.5 * (intercepts[n / 2 - 1] + intercepts[n / 2]);

    const nPairs = (n * (n - 1)) / 2;
    const tau = nPairs > 0 ? sCount / nPairs : 0;

    const tieCounts = new Map();
    for (const v of ys) {
      const k = v.toFixed(6);
      tieCounts.set(k, (tieCounts.get(k) || 0) + 1);
    }
    let tieSum = 0;
    for (const tGroup of tieCounts.values()) {
      if (tGroup > 1) tieSum += tGroup * (tGroup - 1) * (2 * tGroup + 5);
    }
    const varS = (n * (n - 1) * (2 * n + 5) - tieSum) / 18.0;
    let zScore = 0;
    if (varS > 0) {
      if (sCount > 0) zScore = (sCount - 1) / Math.sqrt(varS);
      else if (sCount < 0) zScore = (sCount + 1) / Math.sqrt(varS);
    }
    const pValue = normalPValue(zScore);
    const significant = pValue < 0.05;

    const trendLine = points.map(p => {
      const tYr = dateToFractionalYear(p.date);
      return Number((intercept0 + senSlopeYr * (tYr - t0)).toFixed(5));
    });

    const dirEs = senSlopeYr > 0 ? 'incremento monotónico' : (senSlopeYr < 0 ? 'disminución / retroceso' : 'estabilidad');
    const dirEn = senSlopeYr > 0 ? 'monotonic increase' : (senSlopeYr < 0 ? 'decrease / retreat' : 'stability');
    let interpretation = '';
    if (state.lang === 'es') {
      if (significant) {
        interpretation = `Tendencia estadísticamente SIGNIFICATIVA de ${dirEs} al 95% de confianza (p = ${pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4)}, τ = ${tau >= 0 ? '+' : ''}${tau.toFixed(3)}). La mediana del cambio anual es Q = ${senSlopeYr >= 0 ? '+' : ''}${senSlopeYr.toFixed(4)} por año (${senSlopeDecade >= 0 ? '+' : ''}${senSlopeDecade.toFixed(3)} por década).`;
      } else {
        interpretation = `Sin tendencia monotónica significativa en el periodo seleccionado (p = ${pValue.toFixed(3)}, τ = ${tau >= 0 ? '+' : ''}${tau.toFixed(3)}). La pendiente de Sen estimada es Q = ${senSlopeYr >= 0 ? '+' : ''}${senSlopeYr.toFixed(4)}/año.`;
      }
    } else {
      if (significant) {
        interpretation = `STATISTICALLY SIGNIFICANT ${dirEn} trend at 95% confidence (p = ${pValue < 0.0001 ? '< 0.0001' : pValue.toFixed(4)}, τ = ${tau >= 0 ? '+' : ''}${tau.toFixed(3)}). The median annual rate of change is Q = ${senSlopeYr >= 0 ? '+' : ''}${senSlopeYr.toFixed(4)}/yr (${senSlopeDecade >= 0 ? '+' : ''}${senSlopeDecade.toFixed(3)}/decade).`;
      } else {
        interpretation = `No significant monotonic trend in the selected period (p = ${pValue.toFixed(3)}, τ = ${tau >= 0 ? '+' : ''}${tau.toFixed(3)}). The estimated Sen slope is Q = ${senSlopeYr >= 0 ? '+' : ''}${senSlopeYr.toFixed(4)}/yr.`;
      }
    }

    return {
      n, mean, median, sd, q1, q3, min, max,
      senSlopeYr, senSlopeDecade, intercept: intercept0,
      tau, zScore, pValue, significant,
      trendLine, interpretation
    };
  }

  function movingAverage(values, windowSize = 12) {
    return values.map((_, idx) => {
      const start = Math.max(0, idx - windowSize + 1);
      const slice = values.slice(start, idx + 1).filter(v => v !== null && v !== undefined && Number.isFinite(v));
      if (!slice.length) return null;
      return Number((slice.reduce((a, b) => a + b, 0) / slice.length).toFixed(5));
    });
  }

  // ==========================================================================
  // 2. FILTRADO MULTIANUAL (2016–2026) Y AGREGACIÓN TEMPORAL
  // ==========================================================================
  function isInSelectedRange(row) {
    return row.fecha >= state.range.start && row.fecha <= state.range.end;
  }

  function updateSharedRange(event) {
    const { dataset, value, validity } = event.target;
    const key = dataset.rangeDate;
    if (!value || !validity.valid) {
      event.target.value = state.range[key];
      showToast(t('date_invalid'));
      return;
    }
    state.range[key] = value;
    if (state.range.start > state.range.end) {
      state.range[key === 'start' ? 'end' : 'start'] = value;
    }
    $$('[data-range-date]').forEach(input => { input.value = state.range[input.dataset.rangeDate]; });
    state.dbPage = 1;
    renderAllActiveViews();
  }

  function getFilteredSeries({
    variable, zona_id = 'AMPAY', sensor = 'ALL', estadistico = 'ALL',
    frequency = 'month', startDate = state.range.start, endDate = state.range.end
  }) {
    let rows = state.observations.filter(r => r.variable === variable);
    if (zona_id && zona_id !== 'ALL') {
      const byZone = rows.filter(r => r.zona_id === zona_id);
      if (byZone.length > 0) rows = byZone;
    }
    if (sensor && sensor !== 'ALL') {
      const bySensor = rows.filter(r => r.sensor === sensor);
      if (bySensor.length > 0) rows = bySensor;
    }
    if (estadistico && estadistico !== 'ALL') {
      const byEst = rows.filter(r => r.estadistico === estadistico);
      if (byEst.length > 0) rows = byEst;
    }
    if (startDate) rows = rows.filter(r => String(r.fecha) >= startDate);
    if (endDate) rows = rows.filter(r => String(r.fecha) <= endDate);

    rows.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    const groups = new Map();
    for (const r of rows) {
      const d = String(r.fecha);
      const y = d.slice(0, 4);
      const m = Number(d.slice(5, 7) || 1);
      let key = d.slice(0, 7);
      let dateRep = `${key}-01`;
      if (frequency === 'quarter') {
        const q = Math.ceil(m / 3);
        key = `${y}-T${q}`;
        dateRep = `${y}-${String((q - 1) * 3 + 2).padStart(2, '0')}-01`;
      } else if (frequency === 'year') {
        key = y;
        dateRep = `${y}-07-01`;
      }
      if (!groups.has(key)) groups.set(key, { date: dateRep, items: [] });
      groups.get(key).items.push(r);
    }

    const isAccum = variable === 'PRECIPITACION';
    const points = [];
    for (const [key, g] of groups.entries()) {
      const validItems = g.items.filter(x => x.valor !== null && x.valor !== undefined && Number.isFinite(x.valor));
      let val = null;
      if (validItems.length > 0) {
        if (isAccum && frequency !== 'month') {
          const byMonth = new Map();
          for (const item of validItems) {
            const mKey = String(item.fecha).slice(0, 7);
            if (!byMonth.has(mKey)) byMonth.set(mKey, []);
            byMonth.get(mKey).push(Number(item.valor));
          }
          let totalPeriod = 0;
          for (const mVals of byMonth.values()) {
            totalPeriod += mVals.reduce((a, b) => a + b, 0) / mVals.length;
          }
          val = Number(totalPeriod.toFixed(4));
        } else {
          const sum = validItems.reduce((acc, x) => acc + Number(x.valor), 0);
          val = Number((sum / validItems.length).toFixed(5));
        }
      }
      const sample = validItems[0] || g.items[0] || {};
      points.push({
        label: key,
        date: g.date,
        value: val,
        complete: validItems.some(item => item.periodo_completo === true),
        sensor: sample.sensor || 'Sentinel-2',
        fuente: sample.fuente || 'Copernicus',
        coleccion: sample.coleccion || 'COPERNICUS/S2_SR_HARMONIZED',
        resolucion_m: sample.resolucion_m || 10,
        unidad: sample.unidad || ''
      });
    }
    return points;
  }

  function createFixedChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return null;
    if (state.charts[canvasId]) {
      state.charts[canvasId].destroy();
    }
    config.options = config.options || {};
    config.options.responsive = true;
    config.options.maintainAspectRatio = false;
    config.options.plugins = config.options.plugins || {};
    config.options.plugins.legend = {
      ...(config.options.plugins.legend || {}),
      display: true,
      onClick: () => {} // Leyenda siempre fija
    };
    state.charts[canvasId] = new Chart(canvas, config);
    return state.charts[canvasId];
  }

  // Llena el banner estadístico renderizando ecuaciones reales en LaTeX con KaTeX
  function fillStatsBanner(prefix, statsObj, meta, sampleRow) {
    renderLatexIn(`${prefix}_formula`, meta.latex, false);

    const senLatex = `Q = ${statsObj.senSlopeYr >= 0 ? '+' : ''}${statsObj.senSlopeYr.toFixed(4)}\\,\\text{a\\~no}^{-1} \\;\\left(${statsObj.senSlopeDecade >= 0 ? '+' : ''}${statsObj.senSlopeDecade.toFixed(3)}\\,\\text{d\\'ec}^{-1}\\right)`;
    renderLatexIn(`${prefix}_sen`, statsObj.n >= 3 ? senLatex : '\\text{—}', false);

    const pFormatted = statsObj.pValue < 0.0001 ? '< 10^{-4}' : `= ${statsObj.pValue.toFixed(4)}`;
    const tauLatex = `\\tau = ${statsObj.tau >= 0 ? '+' : ''}${statsObj.tau.toFixed(4)},\\; Z = ${statsObj.zScore >= 0 ? '+' : ''}${statsObj.zScore.toFixed(2)},\\; p ${pFormatted}`;
    renderLatexIn(`${prefix}_tau`, statsObj.n >= 3 ? tauLatex : '\\text{—}', false);

    const meanLatex = `\\bar{x} = ${statsObj.mean.toFixed(3)},\\; \\tilde{x} = ${statsObj.median.toFixed(3)},\\; \\sigma = ${statsObj.sd.toFixed(3)} \\; (n=${statsObj.n})`;
    renderLatexIn(`${prefix}_mean`, statsObj.n ? meanLatex : 'n=0', false);

    const colEl = document.getElementById(`${prefix}_collection`);
    if (colEl) colEl.textContent = sampleRow?.coleccion || meta.collection;

    const pvalEl = document.getElementById(`${prefix}_pval`);
    if (pvalEl) {
      pvalEl.textContent = statsObj.n < 3 ? t('insufficient_trend') : statsObj.significant
        ? (state.lang === 'es' ? 'Significativa al 95% (α = 0.05)' : 'Significant at 95% (α = 0.05)')
        : (state.lang === 'es' ? 'Estable / No significativa (p ≥ 0.05)' : 'Stable / Non-significant (p ≥ 0.05)');
    }

    const interpEl = document.getElementById(`${prefix}_interp`);
    if (interpEl) {
      interpEl.innerHTML = `<strong>${t('lbl_simple_interp')}</strong> <span data-editable="true">${statsObj.interpretation}</span> <span style="color:#94b2c4;">(${meta.desc})</span>`;
    }
  }

  // ==========================================================================
  // 3. VISTA 0: OBSERVATORIO HUD SATELITAL FLOTANTE (2016–2026)
  // ==========================================================================
  function initOrUpdateHudMap() {
    const node = document.getElementById('hudMapCanvas');
    if (!node || !window.L) return;

    if (!state.hudMap) {
      state.hudMap = L.map(node, {
        center: [-13.584, -72.886],
        zoom: 12,
        zoomControl: true
      });

      state.hudBaseLayers = {
        sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        dark: L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        })
      };
      state.hudBaseLayers.sat.addTo(state.hudMap);

      state.hudLayers = {
        savi: L.layerGroup().addTo(state.hudMap),
        vectors: L.layerGroup().addTo(state.hudMap)
      };

      if (state.saviImage && state.saviBounds) {
        const b = state.saviBounds;
        L.imageOverlay(state.saviImage, [[b.south, b.west], [b.north, b.east]], {
          opacity: 0.62,
          interactive: false
        }).addTo(state.hudLayers.savi);
      }

      if (state.geojson) {
        L.geoJSON(state.geojson, {
          style: (feat) => {
            const tp = feat.properties?.tipo;
            if (tp === 'limite') return { color: '#2dd4bf', weight: 2.2, dashArray: '6 4', fillOpacity: 0.03 };
            if (tp === 'bosque') return { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.28 };
            if (tp === 'glaciar') return { color: '#38bdf8', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.35 };
            if (tp === 'laguna') return { color: '#0ea5e9', weight: 2, fillColor: '#0284c7', fillOpacity: 0.30 };
            return { color: '#f59e0b', weight: 1.5, fillOpacity: 0.15 };
          },
          pointToLayer: (feat, latlng) => {
            return L.circleMarker(latlng, {
              radius: 8, color: '#ffffff', weight: 2, fillColor: '#ef4444', fillOpacity: 0.95
            });
          },
          onEachFeature: (feat, lyr) => {
            const p = feat.properties || {};
            const name = state.lang === 'es' ? p.nombre_es : p.nombre_en;
            const desc = state.lang === 'es' ? p.descripcion_es : p.descripcion_en;
            lyr.bindPopup(`<strong>${name}</strong><br><span style="font-size:11.5px;">${desc}</span><br><small>Altitud: ${p.altitud_msnm} m s.n.m.</small>`);
          }
        }).addTo(state.hudLayers.vectors);
      }
    }

    setTimeout(() => state.hudMap.invalidateSize(), 150);
  }

  function renderHudObservatory() {
    initOrUpdateHudMap();

    const variable = $('#hudVarSelect')?.value || 'NDVI';
    const freq = $('#hudFreqSelect')?.value || 'month';
    const startDate = state.range.start;
    const endDate = state.range.end;
    const est = variable === 'NDMI' ? 'media_mensual_bosque' : 'ALL';

    const pts = getFilteredSeries({ variable, estadistico: est, frequency: freq, startDate, endDate });
    const st = computeSenAndKendall(pts);
    const meta = varInfo(variable);
    const lastPt = [...pts].reverse().find(p => p.value !== null);

    $('#hudKpiArea').textContent = 'Ampay · Tamburco';
    const area = MAPPED_AREA_HA.toLocaleString(state.lang === 'es' ? 'es-PE' : 'en-US', { maximumFractionDigits: 3 });
    $('#hudKpiAreaSub').textContent = `${area} ha`;
    $('#hudKpiObs').textContent = `${st.n}`;
    $('#hudKpiObsSub').textContent = `${pts.length} periodos (${startDate.slice(0, 4)}–${endDate.slice(0, 4)})`;
    $('#hudKpiSen').textContent = st.n >= 3 ? `${st.senSlopeYr >= 0 ? '+' : ''}${st.senSlopeYr.toFixed(4)}` : '—';
    $('#hudKpiSenSub').textContent = st.n >= 3 ? `τ = ${st.tau.toFixed(3)} · p = ${st.pValue.toFixed(3)}` : t('insufficient_trend');
    $('#hudKpiLast').textContent = lastPt ? lastPt.value.toFixed(3) : '—';
    $('#hudKpiLastSub').textContent = lastPt ? `${lastPt.label} · ${meta.unit}` : '—';

    // Resumen estadístico con chips y LaTeX en panel izquierdo del HUD
    $('#hudStatText').textContent = !st.n ? t('no_data_period') : `${st.n} periodos válidos · Media ${st.mean.toFixed(3)} · Mediana ${st.median.toFixed(3)} · Desv. Est. ${st.sd.toFixed(3)} · Rango [${st.min.toFixed(3)}, ${st.max.toFixed(3)}].`;
    $('#hudStatChips').innerHTML = st.n < 3 ? '' : `
      <span class="stat-chip">Q1: ${st.q1.toFixed(3)}</span>
      <span class="stat-chip">Q3: ${st.q3.toFixed(3)}</span>
      <span class="stat-chip">τ: ${st.tau >= 0 ? '+' : ''}${st.tau.toFixed(3)}</span>
      <span class="stat-chip ${st.significant ? 'warn' : ''}">p: ${st.pValue.toFixed(4)}</span>
    `;

    renderLatexIn('hudLatexFormula', meta.latex, false);
    $('#hudSourceMeta').textContent = `Colección: ${meta.collection} · Periodo: ${startDate} a ${endDate}.`;

    // Título del gráfico inferior central del HUD
    $('#hudChartTitle').textContent = meta.name;
    $('#hudChartSub').textContent = `${pts[0]?.sensor || '—'} · ${startDate.slice(0, 7)} a ${endDate.slice(0, 7)} · ${st.interpretation}`;

    createFixedChart('chartHudSeries', {
      type: 'line',
      data: {
        labels: pts.map(p => p.label),
        datasets: [
          {
            label: `${meta.short}`,
            data: pts.map(p => p.value),
            borderColor: '#2dd4bf',
            backgroundColor: 'rgba(45, 212, 191, 0.18)',
            borderWidth: 2.2,
            pointRadius: 2,
            fill: true,
            tension: 0.25,
            spanGaps: false
          },
          {
            label: `Sen (${st.senSlopeYr >= 0 ? '+' : ''}${st.senSlopeYr.toFixed(4)}/año)`,
            data: st.trendLine,
            borderColor: '#f43f5e',
            borderWidth: 1.8,
            borderDash: [4, 3],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 10 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // ==========================================================================
  // 4. RESUMEN EJECUTIVO Y PESTAÑAS 1 A 6 + EXPLORADOR DE BASE DE DATOS (2016–2026)
  // ==========================================================================
  function renderResumen() {
    const ndviPts = getFilteredSeries({ variable: 'NDVI', zona_id: 'AMPAY' });
    const ndmiPts = getFilteredSeries({ variable: 'NDMI', estadistico: 'media_mensual_bosque' });
    const ndsiPts = getFilteredSeries({ variable: 'NDSI', zona_id: 'AMPAY' });
    const areaPts = getFilteredSeries({ variable: 'Area_glaciar', zona_id: 'AMPAY' });
    const precPts = getFilteredSeries({ variable: 'PRECIPITACION', sensor: 'GPM IMERG V07' });

    const stNdvi = computeSenAndKendall(ndviPts);
    const stNdmi = computeSenAndKendall(ndmiPts);
    const stArea = computeSenAndKendall(areaPts);

    const lastValid = (arr) => [...arr].reverse().find(x => x.value !== null && Number.isFinite(x.value));
    const lNdvi = lastValid(ndviPts);
    const lNdmi = lastValid(ndmiPts);
    const lNdsi = lastValid(ndsiPts);
    const lArea = lastValid(areaPts);

    const monthsByYear = new Map();
    for (const point of precPts) {
      if (point.value === null || !point.complete) continue;
      const year = point.label.slice(0, 4);
      if (!monthsByYear.has(year)) monthsByYear.set(year, []);
      monthsByYear.get(year).push(point.value);
    }
    const annualTotals = [...monthsByYear.values()]
      .filter(months => months.length === 12)
      .map(months => months.reduce((sum, value) => sum + value, 0));
    const meanAnnualPrec = annualTotals.length
      ? annualTotals.reduce((sum, value) => sum + value, 0) / annualTotals.length
      : null;
    const trendSummary = (stats, unit) => stats.n < 3 ? t('insufficient_trend') :
      `Q = ${stats.senSlopeYr >= 0 ? '+' : ''}${stats.senSlopeYr.toFixed(4)} ${unit} · τ = ${stats.tau.toFixed(3)} (p = ${stats.pValue.toFixed(3)})`;
    const perYear = state.lang === 'es' ? '/año' : '/yr';

    $('#kpiVegVal').textContent = lNdvi ? lNdvi.value.toFixed(3) : '—';
    $('#kpiVegDelta').textContent = trendSummary(stNdvi, perYear);
    $('#kpiNdmiVal').textContent = lNdmi ? lNdmi.value.toFixed(3) : '—';
    $('#kpiNdmiDelta').textContent = trendSummary(stNdmi, perYear);
    $('#kpiNdsiVal').textContent = lArea ? `${lArea.value.toFixed(3)} km²` : '—';
    $('#kpiNdsiDelta').textContent = `NDSI: ${lNdsi ? lNdsi.value.toFixed(3) : '—'} · ${trendSummary(stArea, 'km²' + perYear)}`;
    $('#kpiPrecVal').textContent = meanAnnualPrec === null ? '—' : `${meanAnnualPrec.toFixed(1)} mm`;
    $('#kpiPrecDelta').textContent = state.lang === 'es'
      ? `${annualTotals.length} años con 12 meses · GPM IMERG`
      : `${annualTotals.length} years with 12 months · GPM IMERG`;

    const count = state.observations.filter(isInSelectedRange).length;
    $('#kpiTotalObs').textContent = `${count.toLocaleString()} ${t('obs_suffix')} (${state.range.start} · ${state.range.end})`;
    $('#resumenNdmi').textContent = `NDMI · ${stNdmi.interpretation}`;
    $('#resumenGlaciar').textContent = `${varInfo('Area_glaciar').short} · ${stArea.interpretation}`;

    const labels = ndviPts.map(p => p.label);
    const mapByLabel = (pts) => {
      const m = new Map(pts.map(p => [p.label, p.value]));
      return labels.map(l => m.has(l) ? m.get(l) : null);
    };

    createFixedChart('chartMultiResumen', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: state.lang === 'es' ? 'NDVI (Bosque de Intimpas)' : 'NDVI (Intimpa Forest)',
            data: mapByLabel(ndviPts),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            borderWidth: 2.2,
            pointRadius: 1.8,
            tension: 0.3,
            spanGaps: true,
            yAxisID: 'yIdx'
          },
          {
            type: 'line',
            label: state.lang === 'es' ? 'NDMI (Humedad de la Vegetación)' : 'NDMI (Vegetation Moisture)',
            data: mapByLabel(ndmiPts),
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34, 211, 238, 0.1)',
            borderWidth: 2,
            borderDash: [4, 3],
            pointRadius: 1.5,
            tension: 0.3,
            spanGaps: true,
            yAxisID: 'yIdx'
          },
          {
            type: 'bar',
            label: state.lang === 'es' ? 'Precipitación Mensual (mm)' : 'Monthly Precipitation (mm)',
            data: mapByLabel(precPts),
            backgroundColor: 'rgba(59, 130, 246, 0.42)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            yAxisID: 'yPrec'
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          yIdx: {
            type: 'linear', position: 'left',
            title: { display: true, text: 'NDVI / NDMI', color: '#10b981' },
            ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' }
          },
          yPrec: {
            type: 'linear', position: 'right',
            title: { display: true, text: 'mm/mes', color: '#60a5fa' },
            ticks: { color: '#94b2c4' }, grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }

  // Mapa SIG en Pestaña dedicada
  function getNdviColor(val) {
    if (val === null || val === undefined || !Number.isFinite(val)) return '#10b981';
    if (val >= 0.55) return '#059669';
    if (val >= 0.45) return '#10b981';
    if (val >= 0.35) return '#84cc16';
    return '#eab308';
  }

  function initOrUpdateMap() {
    const container = document.getElementById('leafletMap');
    if (!container || !window.L) return;

    if (!state.map) {
      state.map = L.map(container, { center: [-13.585, -72.886], zoom: 12, zoomControl: true });

      state.baseLayers = {
        sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        topo: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        dark: L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        osm: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles &copy; Esri', maxZoom: 19
        }),
        nasa: L.tileLayer('https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-06-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', {
          attribution: 'NASA GIBS MODIS Terra', maxZoom: 9
        })
      };

      state.baseLayers.sat.addTo(state.map);

      state.mapLayers = {
        limite: L.layerGroup().addTo(state.map),
        tamburco: L.layerGroup().addTo(state.map),
        saviRaster: L.layerGroup(),
        bosque: L.layerGroup().addTo(state.map),
        glaciar: L.layerGroup().addTo(state.map),
        lagunas: L.layerGroup().addTo(state.map),
        amort: L.layerGroup().addTo(state.map),
        entrada: L.layerGroup().addTo(state.map),
        custom: L.layerGroup().addTo(state.map)
      };

      if (state.saviImage && state.saviBounds) {
        const b = state.saviBounds;
        L.imageOverlay(state.saviImage, [[b.south, b.west], [b.north, b.east]], {
          opacity: 0.58, interactive: false
        }).addTo(state.mapLayers.saviRaster);
      }

      const district = window.ampayJupyterCatalogo?.limite;
      if (district) {
        const boundary = L.geoJSON(district, {
          style: { color: '#fde68a', weight: 2, dashArray: '6 4', fill: false },
          onEachFeature: (_, layer) => layer.bindTooltip(t('layer_tamburco'))
        }).addTo(state.mapLayers.tamburco);
        state.map.fitBounds(boundary.getBounds(), { padding: [16, 22] });
      }
      window.agregarMapasJupyterAmpay?.(state.map, 'rgb');
    }

    renderGeoJsonFeatures();
    setTimeout(() => state.map.invalidateSize(), 150);
  }

  function renderGeoJsonFeatures() {
    if (!state.map || !state.geojson) return;
    ['limite', 'bosque', 'glaciar', 'lagunas', 'amort', 'entrada'].forEach(k => {
      if (state.mapLayers[k]) state.mapLayers[k].clearLayers();
    });

    const ndviSeries = getFilteredSeries({ variable: 'NDVI' }).filter(point => Number.isFinite(point.value));
    const select = $('#mapNdviPeriod');
    const selected = select.value;
    const meanLabel = state.lang === 'es' ? 'Promedio del periodo' : 'Mean for selected period';
    select.replaceChildren(new Option(meanLabel, 'MEAN'),
      ...ndviSeries.slice().reverse().map(point => new Option(point.label, point.label)));
    select.value = ndviSeries.some(point => point.label === selected) ? selected : 'MEAN';
    const period = select.value;
    const currentNdvi = period === 'MEAN'
      ? (ndviSeries.length ? ndviSeries.reduce((sum, p) => sum + p.value, 0) / ndviSeries.length : null)
      : ndviSeries.find(point => point.label === period).value;

    const ndsiSeries = getFilteredSeries({ variable: 'NDSI' }).filter(point => Number.isFinite(point.value));
    const meanNdsi = ndsiSeries.length
      ? ndsiSeries.reduce((sum, point) => sum + point.value, 0) / ndsiSeries.length : null;
    const lastArea = getFilteredSeries({ variable: 'Area_glaciar' }).filter(point => Number.isFinite(point.value)).at(-1);
    const formatNdvi = currentNdvi === null ? '—' : currentNdvi.toFixed(3);
    const periodLabel = period === 'MEAN' ? meanLabel : period;
    $('#mapNdviReadout').textContent = `NDVI (${periodLabel}) · ${formatNdvi}`;

    for (const feat of state.geojson.features) {
      const p = feat.properties || {};
      const title = state.lang === 'es' ? (p.nombre_es || p.id) : (p.nombre_en || p.nombre_es || p.id);
      const desc = state.lang === 'es' ? (p.descripcion_es || '') : (p.descripcion_en || '');

      if (p.tipo === 'punto_control') {
        const coords = feat.geometry.coordinates;
        L.circleMarker([coords[1], coords[0]], {
          radius: 9, color: '#ffffff', weight: 2.5, fillColor: '#ef4444', fillOpacity: 0.95
        }).bindPopup(`
          <div style="min-width:220px">
            <strong style="color:#2dd4bf;font-size:13px;">${title}</strong><br>
            <span style="font-size:11.5px;color:#cbd5e1;">${desc}</span><br>
            <hr style="border:0;border-top:1px solid #334155;margin:6px 0;">
            <small><b>Altitud:</b> ${p.altitud_msnm} m s.n.m. · <b>Coord:</b> ${coords[1].toFixed(4)}°S, ${coords[0].toFixed(4)}°W</small>
          </div>
        `).addTo(state.mapLayers.entrada);
        continue;
      }

      let layerStyle = { color: '#94a3b8', weight: 2, fillOpacity: 0.2 };
      let targetGroup = state.mapLayers.limite;
      let metricHtml = '';

      if (p.tipo === 'limite') {
        layerStyle = { color: '#2dd4bf', weight: 2.2, dashArray: '6 4', fillOpacity: 0.02 };
        targetGroup = state.mapLayers.limite;
        metricHtml = `<b>Área del polígono del geoportal:</b> ${p.area_ha} ha`;
      } else if (p.tipo === 'bosque') {
        const col = getNdviColor(currentNdvi);
        layerStyle = { color: '#10b981', weight: 2, fillColor: col, fillOpacity: 0.24 };
        targetGroup = state.mapLayers.bosque;
        metricHtml = `<b>NDVI (${periodLabel}):</b> ${formatNdvi} · <b>Área:</b> ${p.area_ha} ha`;
      } else if (p.tipo === 'glaciar') {
        layerStyle = { color: '#38bdf8', weight: 2, fillColor: '#60a5fa', fillOpacity: 0.19 };
        targetGroup = state.mapLayers.glaciar;
        metricHtml = `<b>Nieve y hielo detectados:</b> ${lastArea ? lastArea.value.toFixed(3) + ' km² · ' + lastArea.label : '—'} · <b>NDSI medio:</b> ${meanNdsi?.toFixed(3) ?? '—'}`;
      } else if (p.tipo === 'laguna') {
        const customLag = state.observations.filter(r => r.zona_id === p.zona_id && Number.isFinite(r.valor) && isInSelectedRange(r)).sort((a, b) => a.fecha.localeCompare(b.fecha));
        const lagText = customLag.length
          ? `<b>Registros (${p.zona_id}):</b> ${customLag.length} obs (Último: ${customLag[customLag.length - 1].valor})`
          : `<i>Sin registros en el periodo seleccionado · Zona ${p.zona_id}</i>`;
        layerStyle = { color: '#0ea5e9', weight: 2, fillColor: '#0284c7', fillOpacity: 0.30 };
        targetGroup = state.mapLayers.lagunas;
        metricHtml = `<b>Espejo de agua:</b> ${p.area_ha} ha · ${lagText}`;
      } else if (p.tipo === 'amortiguamiento') {
        layerStyle = { color: '#f59e0b', weight: 1.8, fillColor: '#f59e0b', fillOpacity: 0.16 };
        targetGroup = state.mapLayers.amort;
        metricHtml = `<b>Sector:</b> Tamburco (${p.area_ha} ha)`;
      }

      L.geoJSON(feat, {
        style: layerStyle,
        onEachFeature: (_, lyr) => {
          lyr.bindPopup(`
            <div style="min-width:230px">
              <strong style="color:#2dd4bf;font-size:13px;">${title}</strong><br>
              <span style="font-size:11.5px;color:#cbd5e1;">${desc}</span>
              <hr style="border:0;border-top:1px solid #334155;margin:6px 0;">
              <div style="font-size:11.5px;">${metricHtml}<br><b>Altitud:</b> ${p.altitud_msnm} m s.n.m.</div>
            </div>
          `);
        }
      }).addTo(targetGroup);
    }
  }

  function renderSingleFactorModule({
    variable, zona_id = 'AMPAY', sensor = 'ALL', estadistico = 'ALL',
    frequency = 'month', startDate = state.range.start, endDate = state.range.end,
    canvasId, bannerPrefix
  }) {
    const meta = varInfo(variable);
    const pts = getFilteredSeries({ variable, zona_id, sensor, estadistico, frequency, startDate, endDate });
    const st = computeSenAndKendall(pts);
    const sampleRow = state.observations.find(r => r.variable === variable) || {};

    fillStatsBanner(bannerPrefix, st, meta, sampleRow);

    const labels = pts.map(p => p.label);
    const values = pts.map(p => p.value);
    const ma12 = movingAverage(values, frequency === 'month' ? 12 : 4);

    createFixedChart(canvasId, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${meta.short} (${state.lang === 'es' ? 'Observado' : 'Observed'})`,
            data: values,
            borderColor: meta.color,
            backgroundColor: meta.color + '28',
            borderWidth: 2.3,
            pointRadius: 2.2,
            fill: true,
            tension: 0.25,
            spanGaps: false
          },
          {
            label: state.lang === 'es' ? 'Media Móvil (12m)' : 'Moving Average (12m)',
            data: ma12,
            borderColor: '#e2e8f0',
            borderWidth: 1.8,
            borderDash: [5, 4],
            pointRadius: 0,
            fill: false,
            tension: 0.35,
            spanGaps: true
          },
          {
            label: `${state.lang === 'es' ? 'Recta de Sen' : "Sen's Line"} (${st.senSlopeYr >= 0 ? '+' : ''}${st.senSlopeYr.toFixed(4)}/${state.lang === 'es' ? 'año' : 'yr'})`,
            data: st.trendLine,
            borderColor: '#f43f5e',
            borderWidth: 2,
            borderDash: [2, 2],
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            title: { display: true, text: `${meta.short} [${meta.unit}]`, color: meta.color },
            ticks: { color: '#94b2c4' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });

    const footEl = document.getElementById(`${bannerPrefix}_footer`);
    if (footEl) {
      footEl.innerHTML = `<span><b>Sensor:</b> ${sampleRow.sensor || 'Sentinel-2'} (${sampleRow.fuente || 'Copernicus'})</span>
        <span><b>Resolución espacial:</b> ${sampleRow.resolucion_m || 10} m</span>
        <span><b>Observaciones válidas:</b> ${st.n} de ${pts.length} periodos (2016–2026)</span>
        <span><b>Cuartiles:</b> Q1=${st.q1.toFixed(3)} · Q3=${st.q3.toFixed(3)} · Rango=[${st.min.toFixed(3)}, ${st.max.toFixed(3)}]</span>`;
    }
  }

  function renderVegetacion() {
    const v = $('#vegVarSelect')?.value || 'NDVI';
    const freq = $('#vegFreqSelect')?.value || 'month';
    const zona = $('#vegZoneSelect')?.value || 'AMPAY';
    const start = state.range.start;
    const end = state.range.end;
    const est = v === 'NDMI' ? 'media_mensual_bosque' : 'ALL';
    renderSingleFactorModule({
      variable: v, zona_id: zona, estadistico: est, frequency: freq,
      startDate: start, endDate: end,
      canvasId: 'chartVegetacion', bannerPrefix: 'veg'
    });
  }

  function renderCriosfera() {
    const v = $('#crioVarSelect')?.value || 'NDSI';
    const freq = $('#crioFreqSelect')?.value || 'month';
    const zona = $('#crioZoneSelect')?.value || 'AMPAY';
    const start = state.range.start;
    const end = state.range.end;
    const est = v === 'NDMI' ? 'media_mensual_criosfera' : 'ALL';
    renderSingleFactorModule({
      variable: v, zona_id: zona, estadistico: est, frequency: freq,
      startDate: start, endDate: end,
      canvasId: 'chartCriosfera', bannerPrefix: 'crio'
    });
  }

  function renderTemperatura() {
    const mode = $('#tempVarSelect')?.value || 'CONTRASTE';
    const freq = $('#tempFreqSelect')?.value || 'month';
    const start = state.range.start;
    const end = state.range.end;

    if (mode !== 'CONTRASTE') {
      renderSingleFactorModule({
        variable: mode, zona_id: 'AMPAY', frequency: freq,
        startDate: start, endDate: end,
        canvasId: 'chartTemperatura', bannerPrefix: 'temp'
      });
      return;
    }

    const lstDia = getFilteredSeries({ variable: 'LST_DIA', frequency: freq, startDate: start, endDate: end });
    const t2m = getFilteredSeries({ variable: 'T2M', frequency: freq, startDate: start, endDate: end });
    const lstNoche = getFilteredSeries({ variable: 'LST_NOCHE', frequency: freq, startDate: start, endDate: end });

    const stDia = computeSenAndKendall(lstDia);
    const stT2m = computeSenAndKendall(t2m);
    const metaDia = varInfo('LST_DIA');
    fillStatsBanner('temp', stDia, metaDia, state.observations.find(r => r.variable === 'LST_DIA'));

    const labels = t2m.map(p => p.label);
    const mapBy = (arr) => {
      const m = new Map(arr.map(p => [p.label, p.value]));
      return labels.map(l => m.has(l) ? m.get(l) : null);
    };

    createFixedChart('chartTemperatura', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'LST Superficie Día (MODIS 1km °C)',
            data: mapBy(lstDia),
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            borderWidth: 2.2,
            pointRadius: 2,
            tension: 0.28,
            spanGaps: true
          },
          {
            label: 'T2M Aire a 2m (ERA5-Land 11.1km °C)',
            data: mapBy(t2m),
            borderColor: '#eab308',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            borderWidth: 2.2,
            pointRadius: 2,
            tension: 0.28,
            spanGaps: true
          },
          {
            label: 'LST Superficie Noche (MODIS 1km °C)',
            data: mapBy(lstNoche),
            borderColor: '#a855f7',
            borderWidth: 1.8,
            borderDash: [4, 3],
            pointRadius: 1.5,
            tension: 0.28,
            spanGaps: true
          },
          {
            label: `Sen T2M (+${stT2m.senSlopeYr.toFixed(3)} °C/año)`,
            data: stT2m.trendLine,
            borderColor: '#22d3ee',
            borderWidth: 1.8,
            borderDash: [2, 2],
            pointRadius: 0
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { title: { display: true, text: 'Temperatura (°C)', color: '#f97316' }, ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  function renderPrecipitacion() {
    const sensor = $('#precSensorSelect')?.value || 'GPM IMERG V07';
    const freq = $('#precFreqSelect')?.value || 'month';
    const start = state.range.start;
    const end = state.range.end;

    const pts = getFilteredSeries({ variable: 'PRECIPITACION', sensor, frequency: freq, startDate: start, endDate: end });
    const st = computeSenAndKendall(pts);
    const meta = varInfo('PRECIPITACION');
    const sampleRow = state.observations.find(r => r.variable === 'PRECIPITACION' && (sensor === 'ALL' || r.sensor === sensor)) || {};

    fillStatsBanner('prec', st, meta, sampleRow);

    const labels = pts.map(p => p.label);
    const values = pts.map(p => p.value);

    createFixedChart('chartPrecipitacion', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: `${meta.short} (${sensor})`,
            data: values,
            backgroundColor: 'rgba(59, 130, 246, 0.72)',
            borderColor: '#60a5fa',
            borderWidth: 1,
            borderRadius: 3
          },
          {
            type: 'line',
            label: `Sen (${st.senSlopeYr >= 0 ? '+' : ''}${st.senSlopeYr.toFixed(3)} mm/año)`,
            data: st.trendLine,
            borderColor: '#f59e0b',
            borderWidth: 2.2,
            borderDash: [4, 3],
            pointRadius: 0
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { title: { display: true, text: 'mm', color: '#60a5fa' }, ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });

    const meanVal = st.mean;
    const anomalies = values.map(v => (!meanVal || v === null || !Number.isFinite(v)) ? null : Number((((v - meanVal) / meanVal) * 100).toFixed(1)));
    const barColors = anomalies.map(a => (a !== null && a >= 0) ? 'rgba(14, 165, 233, 0.82)' : 'rgba(239, 68, 68, 0.82)');

    createFixedChart('chartPrecAnomalia', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: state.lang === 'es' ? 'Anomalía de Precipitación (%) frente a la media' : 'Precipitation Anomaly (%) vs. Mean',
            data: anomalies,
            backgroundColor: barColors,
            borderRadius: 2
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { title: { display: true, text: 'Anomalía (%)', color: '#38bdf8' }, ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  function renderRadiacion() {
    const v = $('#radVarSelect')?.value || 'RADIACION';
    const freq = $('#radFreqSelect')?.value || 'month';
    const start = state.range.start;
    const end = state.range.end;
    renderSingleFactorModule({
      variable: v, zona_id: 'AMPAY', frequency: freq,
      startDate: start, endDate: end,
      canvasId: 'chartRadiacion', bannerPrefix: 'rad'
    });
  }

  function renderGlaciar() {
    const areaPts = getFilteredSeries({ variable: 'Area_glaciar', zona_id: 'AMPAY' });
    const valid = areaPts.filter(p => Number.isFinite(p.value));
    const selectA = $('#glacDateA');
    const selectB = $('#glacDateB');
    for (const [select, defaultPoint] of [[selectA, valid[0]], [selectB, valid.at(-1)]]) {
      const previous = select.value;
      select.replaceChildren(...valid.map(p => new Option(`${p.label} (${p.value.toFixed(3)} km²)`, p.label)));
      select.disabled = !valid.length;
      select.value = valid.some(p => p.label === previous) ? previous : defaultPoint?.label || '';
    }
    $('#btnCompareGlaciar').disabled = valid.length < 2;

    const ndsiPts = getFilteredSeries({ variable: 'NDSI', zona_id: 'AMPAY' });
    const stArea = computeSenAndKendall(areaPts);
    const ptA = valid.find(p => p.label === selectA.value);
    const ptB = valid.find(p => p.label === selectB.value);

    $('#glacValA').textContent = ptA ? `${ptA.value.toFixed(3)} km²` : '—';
    $('#glacSubA').textContent = ptA ? `${(ptA.value * 100).toFixed(1)} ha · ${ptA.label}` : '—';
    $('#glacValB').textContent = ptB ? `${ptB.value.toFixed(3)} km²` : '—';
    $('#glacSubB').textContent = ptB ? `${(ptB.value * 100).toFixed(1)} ha · ${ptB.label}` : '—';

    $('#glacDeltaVal').textContent = '—';
    $('#glacDeltaSub').textContent = '—';
    renderLatexIn('glacLatexEq', '\\Delta A = A_B - A_A', false);
    if (ptA && ptB && ptA.label !== ptB.label) {
      const deltaKm2 = ptB.value - ptA.value;
      const deltaHa = deltaKm2 * 100;
      const pctChange = ptA.value > 0 ? deltaKm2 / ptA.value * 100 : null;
      const sign = deltaKm2 > 0 ? '+' : '';
      $('#glacDeltaVal').textContent = `${sign}${deltaKm2.toFixed(3)} km²${pctChange === null ? '' : ` (${sign}${pctChange.toFixed(1)}%)`}`;
      $('#glacDeltaSub').textContent = `${sign}${deltaHa.toFixed(1)} ha (${ptA.label} → ${ptB.label})`;
      renderLatexIn('glacLatexEq', `\\Delta A = A_{${ptB.label}} - A_{${ptA.label}} = ${deltaKm2.toFixed(3)}\\,\\text{km}^2`, false);
    }

    $('#glacSenVal').textContent = stArea.n < 3 ? '—' : `${stArea.senSlopeYr.toFixed(4)} km²/año`;
    $('#glacSenSub').textContent = stArea.n < 3 ? t('insufficient_trend')
      : `τ = ${stArea.tau.toFixed(3)} · p = ${stArea.pValue.toFixed(4)}`;

    const interpEl = document.getElementById('glac_interp');
    if (interpEl) {
      interpEl.innerHTML = `<strong>${t('lbl_simple_interp')}</strong> <span data-editable="true">${stArea.interpretation}</span>`;
    }

    const labels = areaPts.map(p => p.label);
    const mapNdsi = new Map(ndsiPts.map(p => [p.label, p.value]));

    createFixedChart('chartGlaciar', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: state.lang === 'es' ? 'Nieve y hielo detectados (km²)' : 'Detected Snow and Ice Area (km²)',
            data: areaPts.map(p => p.value),
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.22)',
            borderWidth: 2.3,
            pointRadius: 2.2,
            fill: true,
            tension: 0.25,
            spanGaps: true,
            yAxisID: 'yArea'
          },
          {
            label: stArea.n < 3 ? t('insufficient_trend') : `Sen (${stArea.senSlopeYr.toFixed(4)} km²/año)`,
            data: stArea.trendLine,
            borderColor: '#ef4444',
            borderWidth: 2.2,
            borderDash: [4, 3],
            pointRadius: 0,
            fill: false,
            yAxisID: 'yArea'
          },
          {
            label: 'NDSI (Índice de Nieve)',
            data: labels.map(l => mapNdsi.has(l) ? mapNdsi.get(l) : null),
            borderColor: '#a855f7',
            borderWidth: 1.6,
            borderDash: [2, 2],
            pointRadius: 0,
            fill: false,
            spanGaps: true,
            yAxisID: 'yNdsi'
          }
        ]
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { ticks: { color: '#94b2c4', maxTicksLimit: 14 }, grid: { color: 'rgba(255,255,255,0.04)' } },
          yArea: { type: 'linear', position: 'left', title: { display: true, text: 'km²', color: '#38bdf8' }, ticks: { color: '#94b2c4' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          yNdsi: { type: 'linear', position: 'right', title: { display: true, text: 'NDSI', color: '#a855f7' }, ticks: { color: '#94b2c4' }, grid: { drawOnChartArea: false } }
        }
      }
    });

    renderPhotoGallery();
  }

  // ==========================================================================
  // 5. EXPLORADOR DE LA BASE DE DATOS (2016–2026)
  // ==========================================================================
  function renderDatabaseExplorer() {
    const tbody = $('#dbExplorerBody');
    if (!tbody) return;

    const fYear = $('#dbFilterYear')?.value || 'ALL';
    const fVar = $('#dbFilterVar')?.value || 'ALL';
    const fQual = $('#dbFilterQuality')?.value || 'ALL';
    const fSearch = ($('#dbSearchInput')?.value || '').trim().toLowerCase();

    let filtered = state.observations.filter(isInSelectedRange);
    if (fYear !== 'ALL') filtered = filtered.filter(r => String(r.fecha).startsWith(fYear));
    if (fVar !== 'ALL') filtered = filtered.filter(r => r.variable === fVar);
    if (fQual !== 'ALL') filtered = filtered.filter(r => r.calidad === fQual);
    if (fSearch) {
      filtered = filtered.filter(r =>
        String(r.fecha).toLowerCase().includes(fSearch) ||
        String(r.variable).toLowerCase().includes(fSearch) ||
        String(r.sensor).toLowerCase().includes(fSearch) ||
        String(r.zona_id).toLowerCase().includes(fSearch)
      );
    }

    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / state.dbPageSize));
    if (state.dbPage > totalPages) state.dbPage = totalPages;
    const startIdx = (state.dbPage - 1) * state.dbPageSize;
    const pageRows = filtered.slice(startIdx, startIdx + state.dbPageSize);

    $('#dbCountBadge').textContent = `${totalRows.toLocaleString()} / ${state.observations.length.toLocaleString()} registros (Página ${state.dbPage} de ${totalPages})`;

    tbody.innerHTML = pageRows.map(r => `
      <tr>
        <td class="num-tabular">${r.fecha}</td>
        <td>${r.zona_id}</td>
        <td><strong style="color:#2dd4bf;">${r.variable}</strong></td>
        <td class="num-tabular">${r.valor ?? 'SIN_DATOS'}</td>
        <td>${r.unidad}</td>
        <td style="font-size:11px;color:#94b2c4;">${r.estadistico}</td>
        <td>${r.sensor}</td>
        <td>${r.fuente}</td>
        <td style="font-size:11px;">${r.coleccion}</td>
        <td class="num-tabular">${r.resolucion_m ?? ''}</td>
        <td class="num-tabular">${r.n_observaciones ?? 0}</td>
        <td class="num-tabular">${r.cobertura_valida_pct ?? ''}</td>
        <td><span class="stat-chip ${r.calidad === 'SIN_DATOS' ? 'warn' : ''}">${r.calidad}</span></td>
        <td>${r.periodo_completo ? 'True' : 'False'}</td>
      </tr>
    `).join('');
  }

  // ==========================================================================
  // 6. REPORTE SATELITAL
  // ==========================================================================
  function renderReporteSatelital() {
    const tableBody = $('#reportTableBody');
    if (!tableBody) return;
    $('#reportDateRange').textContent = `${state.range.start} — ${state.range.end}`;

    const precipSensor = $('#precSensorSelect').value;
    const specs = [
      { factor_es: '1. Vegetación (Bosque Intimpas)', factor_en: '1. Vegetation (Intimpa Forest)', var: 'NDVI', est: 'ALL' },
      { factor_es: '1b. Humedad Vegetal (Dosel)', factor_en: '1b. Canopy Moisture (Forest)', var: 'NDMI', est: 'media_mensual_bosque' },
      { factor_es: '2. Criósfera (Nieve Ampay)', factor_en: '2. Cryosphere (Ampay Snow)', var: 'NDSI', est: 'ALL' },
      { factor_es: '2b. Superficie detectada de nieve y hielo', factor_en: '2b. Detected Snow and Ice Area', var: 'Area_glaciar', est: 'ALL' },
      { factor_es: '3. Temperatura Superficial Diurna', factor_en: '3. Daytime Land Surface Temp', var: 'LST_DIA', est: 'ALL' },
      { factor_es: '3b. Temperatura Superficial Nocturna', factor_en: '3b. Nighttime Land Surface Temp', var: 'LST_NOCHE', est: 'ALL' },
      { factor_es: '3c. Temperatura del Aire (2m)', factor_en: '3c. 2m Air Temperature', var: 'T2M', est: 'ALL' },
      { factor_es: '4. Precipitación Mensual', factor_en: '4. Monthly Precipitation', var: 'PRECIPITACION', est: 'ALL', sensor: precipSensor },
      { factor_es: '5. Radiación Solar Onda Corta', factor_en: '5. Shortwave Solar Radiation', var: 'RADIACION', est: 'ALL' }
    ];

    const series = specs.map(spec => {
      const points = getFilteredSeries({ variable: spec.var, estadistico: spec.est, sensor: spec.sensor });
      return {
        variable: spec.var,
        label: state.lang === 'es' ? spec.factor_es : spec.factor_en,
        meta: varInfo(spec.var),
        points,
        stats: computeSenAndKendall(points)
      };
    });

    tableBody.innerHTML = series.map(({ variable, label, meta, points: pts, stats: st }, i) => {
      const last = [...pts].reverse().find(p => p.value !== null);
      const multiSource = variable === 'PRECIPITACION' && precipSensor === 'ALL';
      const sensorLabel = multiSource
        ? (state.lang === 'es' ? 'Promedio de fuentes disponibles' : 'Mean of available sources')
        : last?.sensor || '—';
      const collectionLabel = multiSource ? 'GPM IMERG / CHIRPS' : last?.coleccion || '';
      const badgeColor = st.significant ? (st.senSlopeYr < 0 ? '#ef4444' : '#10b981') : '#38bdf8';
      const diag = st.n < 3 ? t('insufficient_trend') : st.significant
        ? (st.senSlopeYr < 0
            ? (state.lang === 'es' ? 'Disminución significativa (p < 0.05)' : 'Significant decrease (p < 0.05)')
            : (state.lang === 'es' ? 'Incremento significativo (p < 0.05)' : 'Significant increase (p < 0.05)'))
        : (state.lang === 'es' ? 'Sin tendencia significativa (p ≥ 0.05)' : 'No significant trend (p ≥ 0.05)');

      return `
        <tr>
          <td><strong data-editable="true" contenteditable="${state.editMode}">${label}</strong><br><small style="color:#94b2c4;">${variable} (${meta.unit})</small></td>
          <td>${sensorLabel}<br><small style="color:#94b2c4;">${collectionLabel}</small></td>
          <td class="num-tabular"><strong>${last ? last.value.toFixed(3) : '—'}</strong><br><small style="color:#94b2c4;">Media: ${st.n ? st.mean.toFixed(3) : '—'}</small></td>
          <td><div id="rep_latex_${i}"></div></td>
          <td><span style="color:${badgeColor};font-weight:700;" data-editable="true" contenteditable="${state.editMode}">${diag}</span></td>
        </tr>
      `;
    }).join('');

    series.forEach(({ stats: st }, i) => {
      const tex = `Q = ${st.senSlopeYr >= 0 ? '+' : ''}${st.senSlopeYr.toFixed(4)}\\,\\text{a\\~no}^{-1},\\; \\tau = ${st.tau >= 0 ? '+' : ''}${st.tau.toFixed(3)}\\;(p=${st.pValue.toFixed(4)})`;
      renderLatexIn(`rep_latex_${i}`, st.n >= 3 ? tex : '\\text{—}', false);
    });

    renderReportTrends(series);

    const reportDateEl = $('#reportEmissionDate');
    if (reportDateEl) {
      reportDateEl.textContent = new Date().toLocaleDateString(state.lang === 'es' ? 'es-PE' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  function renderReportTrends(series) {
    const grid = $('#reportTrendGrid');
    if (!window.Chart) {
      grid.textContent = t('report_chart_missing');
      return;
    }

    grid.innerHTML = series.map(({ variable, meta }) => `
      <figure class="report-trend">
        <figcaption id="report-trend-title-${variable}">${meta.short}</figcaption>
        <div class="report-trend-plot">
          <canvas id="report-trend-${variable}" aria-labelledby="report-trend-title-${variable}"></canvas>
        </div>
        <img class="report-print-chart" alt="${meta.short}">
      </figure>
    `).join('');

    for (const { variable, meta, points, stats } of series) {
      const chart = createFixedChart(`report-trend-${variable}`, {
        type: 'line',
        data: {
          labels: points.map(point => point.label),
          datasets: [
            {
              label: t('report_observed'),
              data: points.map(point => point.value),
              borderColor: meta.color,
              backgroundColor: meta.color,
              borderWidth: 1.8,
              pointRadius: 1.6,
              spanGaps: false
            },
            {
              label: t('report_sen_trend'),
              data: stats.trendLine,
              borderColor: '#fda4af',
              backgroundColor: '#fda4af',
              borderDash: [5, 4],
              borderWidth: 1.8,
              pointRadius: 0
            }
          ]
        },
        options: {
          animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { labels: { color: '#e8f3f8', boxWidth: 18 } } },
          scales: {
            x: { ticks: { color: '#94b2c4', maxTicksLimit: 7, maxRotation: 0 }, grid: { display: false } },
            y: {
              title: { display: true, text: meta.unit, color: '#94b2c4' },
              ticks: { color: '#94b2c4', maxTicksLimit: 6 },
              grid: { color: 'rgba(255,255,255,0.08)' }
            }
          }
        }
      });
      // La imagen conserva el gráfico al paginar el reporte.
      const image = chart.canvas.closest('figure').querySelector('.report-print-chart');
      const png = chartImage(chart);
      if (png) image.src = png;
    }
  }

  // ==========================================================================
  // 7. CARGA CSV, GEOJSON Y GALERÍA FOTOGRÁFICA
  // ==========================================================================
  function parseCsvText(text) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) throw new Error('El archivo CSV está vacío o no tiene filas de datos.');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const normHeaders = headers.map(h => h === 'colección' ? 'coleccion' : h);

    const missing = MANDATORY_14_COLS.filter(col => !normHeaders.includes(col));
    if (missing.length > 0) {
      throw new Error(`Faltan columnas obligatorias de las 14 requeridas: ${missing.join(', ')}`);
    }

    const parsedRows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < normHeaders.length) continue;
      const rowObj = {};
      normHeaders.forEach((h, idx) => { rowObj[h] = cols[idx]; });
      const valNum = rowObj.valor !== '' && rowObj.valor !== undefined ? Number(rowObj.valor) : null;
      parsedRows.push({
        fecha: rowObj.fecha,
        zona_id: rowObj.zona_id || 'AMPAY',
        variable: (rowObj.variable || 'MNDWI').toUpperCase() === 'AREA_GLACIAR' ? 'Area_glaciar' : rowObj.variable,
        valor: Number.isFinite(valNum) ? valNum : null,
        unidad: rowObj.unidad || 'adimensional',
        estadistico: rowObj.estadistico || 'media_mensual',
        sensor: rowObj.sensor || 'Sentinel-2',
        fuente: rowObj.fuente || 'Usuario / Campo',
        coleccion: rowObj.coleccion || 'CUSTOM_UPLOAD',
        resolucion_m: Number(rowObj.resolucion_m) || 10,
        n_observaciones: Number(rowObj.n_observaciones) || 1,
        cobertura_valida_pct: Number(rowObj.cobertura_valida_pct) || 100,
        calidad: rowObj.calidad || 'ALTA',
        periodo_completo: String(rowObj.periodo_completo).toLowerCase() !== 'false'
      });
    }
    return parsedRows;
  }

  function integrateUploadedCsvRows(newRows, sourceLabel) {
    state.observations = state.observations.concat(newRows);
    refreshDynamicZoneSelectors();
    updateModeBadge();
    renderAllActiveViews();
    const statusBox = $('#csvUploadStatus');
    if (statusBox) {
      statusBox.innerHTML = `<span style="color:#10b981;font-weight:700;">Validados ${newRows.length} registros (14 columnas OK) desde "${sourceLabel}".</span>`;
    }
    showToast(`${newRows.length} registros integrados al Geoportal`);
  }

  function refreshDynamicZoneSelectors() {
    const zones = [...new Set(state.observations.map(r => r.zona_id))].filter(Boolean);
    const zoneNames = {
      AMPAY: state.lang === 'es' ? 'Santuario Nacional de Ampay (2016–2026)' : 'Ampay National Sanctuary (2016–2026)',
      USPACC01: state.lang === 'es' ? 'Laguna Uspaccocha (USPACC01)' : 'Uspaccocha Lagoon (USPACC01)',
      ANGASC01: state.lang === 'es' ? 'Laguna Angascocha (ANGASC01)' : 'Angascocha Lagoon (ANGASC01)'
    };
    ['#vegZoneSelect', '#crioZoneSelect'].forEach(selId => {
      const sel = $(selId);
      if (!sel) return;
      const current = sel.value || 'AMPAY';
      sel.innerHTML = zones.map(z => `<option value="${z}">${zoneNames[z] || z}</option>`).join('');
      if (zones.includes(current)) sel.value = current;
    });
  }

  function loadSampleLagunaUspaccocha() {
    const sampleRows = [];
    for (let y = 2025; y <= 2026; y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === 2026 && m > 11) break;
        const seasonal = 0.78 + 0.06 * Math.sin(((m - 3) / 12) * 2 * Math.PI);
        sampleRows.push({
          fecha: `${y}-${String(m).padStart(2, '0')}-01`,
          zona_id: 'USPACC01',
          variable: 'MNDWI',
          valor: Number(seasonal.toFixed(4)),
          unidad: 'adimensional',
          estadistico: 'mediana_temporal_media_espacial',
          sensor: 'Sentinel-2',
          fuente: 'Copernicus / Monitoreo Local Laguna',
          coleccion: 'COPERNICUS/S2_SR_HARMONIZED',
          resolucion_m: 20,
          n_observaciones: 4,
          cobertura_valida_pct: 96.5,
          calidad: 'ALTA',
          periodo_completo: true
        });
      }
    }
    integrateUploadedCsvRows(sampleRows, 'Muestra_Laguna_Uspaccocha_14col.csv');
    const crioZone = $('#crioZoneSelect');
    const crioVar = $('#crioVarSelect');
    if (crioZone && crioVar) {
      crioVar.value = 'MNDWI';
      crioZone.value = 'USPACC01';
      renderCriosfera();
    }
  }

  function svgDataUriForPhoto(type) {
    let svg = '';
    if (type === 'forest') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#064e3b"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="400" height="240" fill="url(#g1)"/><path d="M0 190 L90 110 L170 165 L260 95 L350 155 L400 120 L400 240 L0 240 Z" fill="#047857" opacity="0.6"/><circle cx="320" cy="55" r="24" fill="#34d399" opacity="0.35"/><text x="20" y="220" fill="#a7f3d0" font-family="sans-serif" font-size="13" font-weight="bold">Bosque de Intimpas · Podocarpus glomeratus</text></svg>`;
    } else if (type === 'glacier') {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c4a6e"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs><rect width="400" height="240" fill="url(#g2)"/><polygon points="60,185 195,48 330,185" fill="#38bdf8" opacity="0.45"/><polygon points="150,94 195,48 240,94 215,110 175,105" fill="#e0f2fe"/><ellipse cx="200" cy="200" rx="135" ry="22" fill="#0284c7" opacity="0.75"/><text x="20" y="225" fill="#bae6fd" font-family="sans-serif" font-size="13" font-weight="bold">Nevado Ampay y Laguna Uspaccocha</text></svg>`;
    } else {
      svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#1e293b"/><polygon points="120,130 200,75 280,130" fill="#f59e0b"/><rect x="145" y="130" width="110" height="65" fill="#334155" stroke="#94a3b8" stroke-width="2"/><circle cx="200" cy="105" r="10" fill="#fef3c7"/><text x="20" y="222" fill="#fde68a" font-family="sans-serif" font-size="13" font-weight="bold">Puesto de Control SERNANP · Entrada a Ampay</text></svg>`;
    }
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  function openImagePreview(src, title) {
    const image = $('#imagePreviewImage');
    image.src = src;
    image.alt = title;
    $('#imagePreviewTitle').textContent = title;
    $('#imagePreview').showModal();
  }

  function renderAmpayComparison() {
    const select = $('#ampayComparisonSelect');
    const variable = select.value;
    const img = $('#ampayComparisonImage');
    const title = select.selectedOptions[0].textContent;
    img.alt = `${title} · 2017–2026`;
    img.src = `analisis/Comparacion_2017_2026/${variable}.png`;
    const note = $('#ampayComparisonNote');
    const isClimate = ['LST_dia', 'LST_noche', 'T2M', 'PP', 'RAD'].includes(variable);
    note.hidden = !isClimate;
    note.textContent = isClimate
      ? [t('compare_grid_note'), variable === 'PP' ? t('compare_pp_note') : ''].filter(Boolean).join(' ')
      : '';
  }

  function renderPhotoGallery() {
    const gallery = $('#photoGalleryGrid');
    if (!gallery) return;
    gallery.replaceChildren(...[...state.savedPhotos, ...state.customPhotos].map(item => {
      const title = state.lang === 'es' ? (item.title_es || item.title) : (item.title_en || item.title_es || item.title);
      const src = item.img || svgDataUriForPhoto(item.svgPlaceholder);
      const card = document.createElement('article');
      card.className = 'photo-card';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'image-preview-trigger';
      button.title = t('image_zoom');
      button.setAttribute('aria-label', `${t('image_zoom')} · ${title}`);
      const image = new Image();
      image.src = src;
      image.alt = title;
      image.loading = 'lazy';
      button.append(image);
      button.addEventListener('click', () => openImagePreview(src, title));
      const body = document.createElement('div');
      body.className = 'photo-card-body';
      const heading = document.createElement('h4');
      heading.textContent = title;
      heading.dataset.editable = 'true';
      heading.contentEditable = state.editMode;
      const sector = document.createElement('p');
      sector.textContent = item.sector || '—';
      sector.dataset.editable = 'true';
      sector.contentEditable = state.editMode;
      const date = document.createElement('time');
      date.dateTime = item.date;
      date.textContent = item.date;
      body.append(heading, sector, date);
      card.append(button, body);
      return card;
    }));
  }

  async function loadSavedPhotos() {
    if (location.protocol === 'file:') return;
    try {
      const response = await fetch('/api/fotografias', { cache: 'no-store' });
      if (!response.ok) return;
      const { photos } = await response.json();
      const saved = new Map(state.savedPhotos.map(photo => [photo.id, photo]));
      for (const photo of photos) saved.set(photo.id, photo);
      state.savedPhotos = [...saved.values()];
      renderPhotoGallery();
    } catch (_) {
      // Abrir el HTML también permite consultar el geoportal en modo local.
    }
  }

  async function savePhoto() {
    const button = $('#btnAddPhoto');
    const fileInput = $('#inputUploadPhoto');
    const status = $('#photoUploadStatus');
    const file = fileInput.files[0];
    if (!file) {
      status.textContent = t('photo_file_required');
      return;
    }
    if (location.protocol === 'file:') {
      status.textContent = t('photo_server');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      status.textContent = t('photo_too_large');
      return;
    }
    const form = new FormData();
    form.append('photo', file);
    form.append('title', $('#photoTitleInput').value);
    form.append('sector', $('#photoSectorInput').value);
    const now = new Date();
    form.append('date', [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'));
    button.disabled = true;
    status.textContent = '';
    try {
      const response = await fetch('/api/fotografias', { method: 'POST', body: form });
      if (response.ok) {
        const saved = await response.json();
        state.savedPhotos = [saved, ...state.savedPhotos.filter(photo => photo.id !== saved.id)];
        renderPhotoGallery();
        fileInput.value = '';
        $('#photoTitleInput').value = '';
        $('#photoSectorInput').value = '';
        status.textContent = t('photo_saved');
      } else if (response.status === 400) {
        status.textContent = t('photo_invalid_image');
      } else if (response.status === 413) {
        status.textContent = t('photo_too_large');
      } else {
        status.textContent = t(response.status === 404 || response.status === 405 ? 'photo_server' : 'photo_error');
      }
    } catch (_) {
      status.textContent = t('photo_server');
    } finally {
      button.disabled = false;
    }
  }

  // ==========================================================================
  // 8. GLOSARIO CIENTÍFICO CON KATEX Y CONTROL DE ESCALA / MAXIMIZACIÓN
  // ==========================================================================
  function renderGlossaryModal() {
    const grid = $('#glossaryGrid');
    if (!grid) return;
    const keys = Object.keys(VAR_META);
    grid.innerHTML = keys.map((k, idx) => {
      const m = varInfo(k);
      return `
        <div class="glossary-item">
          <h4>${m.name}</h4>
          <div class="latex-box" id="gloss_latex_${idx}" style="margin-bottom:8px;"></div>
          <p style="font-size:12px;color:#94b2c4;">${m.desc}</p>
          <p style="margin-top:5px;font-size:11px;color:#38bdf8;"><b>GEE:</b> ${m.collection} · <b>Unidad:</b> ${m.unit}</p>
        </div>
      `;
    }).join('') + `
      <div class="glossary-item">
        <h4>${state.lang === 'es' ? 'Pendiente No Paramétrica de Theil-Sen' : 'Theil-Sen Non-Parametric Slope'}</h4>
        <div class="latex-box" id="gloss_latex_sen" style="margin-bottom:8px;"></div>
        <p style="font-size:12px;color:#94b2c4;">${state.lang === 'es'
          ? 'Mediana de las pendientes calculadas entre todos los pares de observaciones (i < j). Inmune a valores extremos y vacíos por nubosidad.'
          : 'Median of slopes computed across all observation pairs (i < j). Robust against outliers and missing cloudy months.'}</p>
      </div>
      <div class="glossary-item">
        <h4>${state.lang === 'es' ? 'Prueba Tau de Mann-Kendall (τ y estadístico Z)' : 'Mann-Kendall Rank Trend Test (τ & Z)'}</h4>
        <div class="latex-box" id="gloss_latex_mk" style="margin-bottom:8px;"></div>
        <p style="font-size:12px;color:#94b2c4;">${state.lang === 'es'
          ? 'Evalúa la correlación monotónica temporal entre -1 y +1 corrigiendo la varianza por empates.'
          : 'Evaluates monotonic temporal rank correlation between -1 and +1 with tie-corrected variance.'}</p>
      </div>
    `;

    keys.forEach((k, idx) => {
      renderLatexIn(`gloss_latex_${idx}`, VAR_META[k].latex, false);
    });
    renderLatexIn('gloss_latex_sen', 'Q_{\\text{Sen}} = \\text{mediana}_{1 \\le i < j \\le n}\\!\\left(\\frac{x_j - x_i}{t_j - t_i}\\right)', false);
    renderLatexIn('gloss_latex_mk', 'S = \\sum_{i=1}^{n-1}\\sum_{j=i+1}^{n}\\text{sgn}(x_j - x_i), \\quad \\tau = \\frac{2S}{n(n-1)}', false);
  }

  function applyLanguage(lang) {
    state.lang = lang === 'en' ? 'en' : 'es';
    try { localStorage.setItem('vivo_ampay_lang', state.lang); } catch (e) {}

    $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === state.lang));
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translated = t(key);
      if (translated) el.textContent = translated;
    });
    $$('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });

    updateModeBadge();
    refreshDynamicZoneSelectors();
    renderGlossaryModal();
    renderAmpayComparison();
    renderAllActiveViews();
  }

  function updateModeBadge() {
    const pill = $('#modeStatusPill');
    const textEl = $('#modeStatusText');
    const btnSwitch = $('#btnSwitchMode');
    if (!pill || !textEl) return;

    const countStr = state.observations.length.toLocaleString();
    if (state.mode === 'online') {
      pill.classList.add('online');
      textEl.textContent = `${t('mode_online')} · ${countStr} ${t('obs_suffix')}`;
      if (btnSwitch) btnSwitch.textContent = t('btn_switch_local');
    } else {
      pill.classList.remove('online');
      textEl.textContent = `${t('mode_local')} · ${countStr} ${t('obs_suffix')}`;
      if (btnSwitch) btnSwitch.textContent = t('btn_switch_mode');
    }
  }

  async function toggleOnlineMode() {
    if (state.mode === 'online') {
      state.mode = 'local';
      updateModeBadge();
      showToast(state.lang === 'es' ? 'Modo Local activado' : 'Local Mode active');
      return;
    }
    try {
      const resp = await fetch('/api/status', { method: 'GET' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const info = await resp.json();
      if (info.status === 'ok' && info.gee_initialized === true) {
        state.mode = 'online';
        updateModeBadge();
        showToast(`GEE Online (${info.project_id})`);
        return;
      }
      state.mode = 'local';
      updateModeBadge();
      showToast(t('gee_unavailable'));
    } catch (err) {
      state.mode = 'local';
      updateModeBadge();
      $('#geeModal')?.classList.add('open');
      showToast(state.lang === 'es' ? 'Servidor Python no detectado en localhost:5000 · Modo Local activo' : 'Python server not found on localhost:5000 · Local Mode active');
    }
  }

  function toggleEditMode() {
    state.editMode = !state.editMode;
    document.body.classList.toggle('edit-mode-active', state.editMode);
    $('#btnEditMode')?.classList.toggle('active-toggle', state.editMode);
    $$('[data-editable="true"]').forEach(el => {
      el.contentEditable = state.editMode ? 'true' : 'false';
    });
    showToast(state.editMode
      ? t('edit_mode_enabled')
      : (state.lang === 'es' ? 'Modo Edición Desactivado (Cambios conservados)' : 'Edit Mode Disabled (Changes kept)'));
  }

  function chartTitle(chart) {
    const heading = document.getElementById(chart.canvas.getAttribute('aria-labelledby'));
    return heading?.textContent.trim() || chart.data.datasets[0]?.label || t('btn_export_chart');
  }

  function chartImage(chart, title = '') {
    const source = chart.canvas;
    if (!source.width || !source.height) return null;
    const ratio = chart.currentDevicePixelRatio || 1;
    const titleHeight = title ? Math.round(42 * ratio) : 0;
    const image = document.createElement('canvas');
    image.width = source.width;
    image.height = source.height + titleHeight;
    const ctx = image.getContext('2d');
    ctx.fillStyle = '#0b1724';
    ctx.fillRect(0, 0, image.width, image.height);
    if (title) {
      ctx.fillStyle = '#e8f3f8';
      ctx.font = `600 ${16 * ratio}px system-ui, sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 14 * ratio, titleHeight / 2, image.width - 28 * ratio);
    }
    ctx.drawImage(source, 0, titleHeight);
    return image.toDataURL('image/png');
  }

  function downloadChart(chart) {
    const title = chartTitle(chart);
    chart.stop();
    chart.resize();
    chart.update('none');
    const url = chartImage(chart, title);
    if (!url) {
      showToast(t('chart_export_error'));
      return;
    }

    const filename = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ampay-${filename || chart.canvas.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(t('chart_export_done'));
  }

  function exportActiveChart() {
    const tab = document.getElementById(state.activeTab);
    const charts = [...tab.querySelectorAll('canvas[id]')]
      .filter(canvas => canvas.getClientRects().length > 0)
      .map(canvas => state.charts[canvas.id])
      .filter(Boolean);

    if (charts.length === 0) {
      showToast(t('chart_export_empty'));
      return;
    }
    if (charts.length === 1) {
      downloadChart(charts[0]);
      return;
    }

    $('#chartExportSelect').replaceChildren(
      ...charts.map(chart => new Option(chartTitle(chart), chart.canvas.id))
    );
    $('#chartExportDialog').showModal();
  }

  function downloadCsvTemplate() {
    const header = MANDATORY_14_COLS.join(',');
    const sample1 = '2026-10-01,USPACC01,MNDWI,0.825,adimensional,mediana_temporal_media_espacial,Sentinel-2,Copernicus,COPERNICUS/S2_SR_HARMONIZED,20,4,98.2,ALTA,True';
    const sample2 = '2026-11-01,USPACC01,MNDWI,0.831,adimensional,mediana_temporal_media_espacial,Sentinel-2,Copernicus,COPERNICUS/S2_SR_HARMONIZED,20,3,95.0,ALTA,True';
    const csvContent = '\uFEFF' + [header, sample1, sample2].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_14_columnas_ampay.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function renderAllActiveViews() {
    renderHudObservatory();
    renderResumen();
    renderVegetacion();
    renderCriosfera();
    renderTemperatura();
    renderPrecipitacion();
    renderRadiacion();
    renderGlaciar();
    renderDatabaseExplorer();
    if (state.activeTab === 'tab-reporte') renderReporteSatelital();
    if (state.map) renderGeoJsonFeatures();
    if (state.editMode) {
      $$('[data-editable="true"]').forEach(el => { el.contentEditable = 'true'; });
    }
  }

  function initApp() {
    const bundle = window.AMPAY_SEED_BUNDLE || {};
    state.observations = Array.isArray(bundle.observations) ? [...bundle.observations] : [];
    state.geojson = bundle.geojson || null;
    state.saviBounds = bundle.saviBounds || null;
    state.saviImage = bundle.saviImage || null;
    state.i18n = bundle.i18n || { es: {}, en: {} };

    let savedLang = 'es';
    try {
      const stored = localStorage.getItem('vivo_ampay_lang');
      if (stored === 'en' || stored === 'es') savedLang = stored;
    } catch (e) {}

    // Colapsar / expandir menú lateral
    $('#btnToggleSidebar')?.addEventListener('click', () => {
      $('#appShell')?.classList.toggle('sidebar-compact');
      setTimeout(() => {
        if (state.hudMap) state.hudMap.invalidateSize();
        if (state.map) state.map.invalidateSize();
      }, 260);
    });

    // Navegación entre pestañas
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (!target) return;
        state.activeTab = target;
        $$('.nav-btn').forEach(b => b.classList.toggle('active', b === btn));
        $$('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === target));
        if (target === 'tab-mapa') initOrUpdateMap();
        if (target === 'tab-hud') initOrUpdateHudMap();
        if (target === 'tab-reporte') renderReporteSatelital();
      });
    });

    // Botones de agrandar / maximizar cualquier tarjeta o panel HUD
    document.addEventListener('click', (e) => {
      const expBtn = e.target.closest('.icon-expand-btn');
      if (!expBtn) return;
      const targetId = expBtn.getAttribute('data-expand');
      const card = targetId ? document.getElementById(targetId) : expBtn.closest('.card, .hud-panel');
      if (!card) return;
      card.classList.toggle('card-maximized');
      // Redimensionar gráficos dentro de la tarjeta
      setTimeout(() => {
        Object.values(state.charts).forEach(ch => { if (ch) ch.resize(); });
        if (state.hudMap) state.hudMap.invalidateSize();
        if (state.map) state.map.invalidateSize();
      }, 120);
    });

    // Escala de interfaz (A- / A / A+)
    $$('.zoom-ui-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sc = Number(btn.dataset.scale || 1);
        state.uiScale = sc;
        document.documentElement.style.setProperty('--ui-scale', String(sc));
        setTimeout(() => {
          Object.values(state.charts).forEach(ch => { if (ch) ch.resize(); });
        }, 100);
      });
    });

    // Idioma ES | EN
    $$('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });

    // Controles de la barra superior
    $('#btnEditMode')?.addEventListener('click', toggleEditMode);
    $('#btnAiToggle')?.addEventListener('click', () => {
      state.aiEnabled = !state.aiEnabled;
      $$('.ai-box').forEach(box => box.classList.toggle('hidden', !state.aiEnabled));
    });
    $('#btnSwitchMode')?.addEventListener('click', toggleOnlineMode);
    $('#btnOpenGeeModal')?.addEventListener('click', () => $('#geeModal')?.classList.add('open'));
    $('#btnOpenGlossary')?.addEventListener('click', () => $('#glossaryModal')?.classList.add('open'));
    $$('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => $$('.modal-backdrop').forEach(m => m.classList.remove('open')));
    });
    $('#btnGoUpload')?.addEventListener('click', () => {
      document.querySelector('.nav-btn[data-tab="tab-glaciar"]')?.click();
      setTimeout(() => document.getElementById('uploadSectionCard')?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    $('#btnExportChart')?.addEventListener('click', exportActiveChart);
    $('#chartExportDialog form')?.addEventListener('submit', event => {
      if (event.submitter?.value !== 'download') return;
      const chart = state.charts[$('#chartExportSelect').value];
      if (chart) downloadChart(chart);
    });

    // Controles del Observatorio HUD Satelital
    ['#hudVarSelect', '#hudFreqSelect'].forEach(s => {
      $(s)?.addEventListener('change', renderHudObservatory);
    });
    $('#hudBasemapSelect')?.addEventListener('change', (e) => {
      if (!state.hudMap) return;
      const v = e.target.value;
      Object.values(state.hudBaseLayers).forEach(l => state.hudMap.removeLayer(l));
      if (state.hudBaseLayers[v]) state.hudBaseLayers[v].addTo(state.hudMap);
    });
    $('#hudSaviCheck')?.addEventListener('change', (e) => {
      if (!state.hudMap || !state.hudLayers.savi) return;
      e.target.checked ? state.hudLayers.savi.addTo(state.hudMap) : state.hudMap.removeLayer(state.hudLayers.savi);
    });
    $('#hudVectorsCheck')?.addEventListener('change', (e) => {
      if (!state.hudMap || !state.hudLayers.vectors) return;
      e.target.checked ? state.hudLayers.vectors.addTo(state.hudMap) : state.hudMap.removeLayer(state.hudLayers.vectors);
    });
    $('#btnHudSoloMapa')?.addEventListener('click', () => {
      $('#hudOverlayContainer')?.classList.toggle('solo-mapa');
    });

    // Controles del Mapa SIG (Pestaña 2)
    $('#mapBaseSelect')?.addEventListener('change', (e) => {
      if (!state.map) return;
      const val = e.target.value;
      Object.values(state.baseLayers).forEach(l => state.map.removeLayer(l));
      if (state.baseLayers[val]) state.baseLayers[val].addTo(state.map);
    });
    $('#mapNdviPeriod')?.addEventListener('change', renderGeoJsonFeatures);
    $$('.map-layer-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        if (!state.map) return;
        const key = e.target.dataset.layer;
        const group = state.mapLayers[key];
        if (!group) return;
        e.target.checked ? group.addTo(state.map) : state.map.removeLayer(group);
      });
    });

    $$('[data-range-date]').forEach(input => input.addEventListener('change', updateSharedRange));

    // Controles de los Factores 1 a 6 (con selectores de fechas 2016–2026)
    ['#vegVarSelect', '#vegFreqSelect', '#vegZoneSelect'].forEach(s => $(s)?.addEventListener('change', renderVegetacion));
    ['#crioVarSelect', '#crioFreqSelect', '#crioZoneSelect'].forEach(s => $(s)?.addEventListener('change', renderCriosfera));
    ['#tempVarSelect', '#tempFreqSelect'].forEach(s => $(s)?.addEventListener('change', renderTemperatura));
    ['#precSensorSelect', '#precFreqSelect'].forEach(s => $(s)?.addEventListener('change', renderPrecipitacion));
    ['#radVarSelect', '#radFreqSelect'].forEach(s => $(s)?.addEventListener('change', renderRadiacion));
    ['#glacDateA', '#glacDateB'].forEach(s => $(s)?.addEventListener('change', renderGlaciar));
    $('#btnCompareGlaciar')?.addEventListener('click', renderGlaciar);

    // Controles del Explorador de Base de Datos (2016–2026)
    ['#dbFilterYear', '#dbFilterVar', '#dbFilterQuality'].forEach(s => {
      $(s)?.addEventListener('change', () => { state.dbPage = 1; renderDatabaseExplorer(); });
    });
    $('#dbSearchInput')?.addEventListener('input', () => { state.dbPage = 1; renderDatabaseExplorer(); });
    $('#btnDbPrev')?.addEventListener('click', () => {
      if (state.dbPage > 1) { state.dbPage--; renderDatabaseExplorer(); }
    });
    $('#btnDbNext')?.addEventListener('click', () => {
      state.dbPage++;
      renderDatabaseExplorer();
    });
    $('#btnDbAddRow')?.addEventListener('click', () => {
      const f = $('#newRowFecha')?.value || '2026-11-01';
      const z = ($('#newRowZona')?.value || 'AMPAY').trim();
      const v = $('#newRowVar')?.value || 'NDVI';
      const val = Number($('#newRowVal')?.value || 0.5);
      const sen = ($('#newRowSensor')?.value || 'Sentinel-2').trim();
      state.observations.unshift({
        fecha: f, zona_id: z, variable: v, valor: val,
        unidad: v === 'Area_glaciar' ? 'km2' : (v === 'PRECIPITACION' ? 'mm_mes' : 'adimensional'),
        estadistico: 'registro_manual_usuario', sensor: sen, fuente: 'Ingreso Directo Usuario',
        coleccion: 'USER_EDIT_2026', resolucion_m: 10, n_observaciones: 1,
        cobertura_valida_pct: 100.0, calidad: 'ALTA', periodo_completo: true
      });
      refreshDynamicZoneSelectors();
      updateModeBadge();
      renderAllActiveViews();
      showToast(`Nuevo registro (${f} · ${v} = ${val}) añadido a la base de datos`);
    });

    // Carga de archivos
    $('#inputUploadCsv')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const rows = parseCsvText(String(reader.result));
          integrateUploadedCsvRows(rows, file.name);
        } catch (err) {
          $('#csvUploadStatus').innerHTML = `<span style="color:#ef4444;font-weight:700;">Error: ${err.message}</span>`;
          showToast(err.message);
        }
      };
      reader.readAsText(file);
    });
    $('#btnDownloadTemplate')?.addEventListener('click', downloadCsvTemplate);
    $('#btnLoadSampleLaguna')?.addEventListener('click', loadSampleLagunaUspaccocha);

    $('#inputUploadGeojson')?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const gj = JSON.parse(String(reader.result));
          initOrUpdateMap();
          const lyr = L.geoJSON(gj, {
            style: { color: '#ec4899', weight: 2.5, fillColor: '#f472b6', fillOpacity: 0.35 }
          }).bindPopup(`<b>Capa GeoJSON de Usuario:</b> ${file.name}`);
          lyr.addTo(state.mapLayers.custom);
          state.map.fitBounds(lyr.getBounds(), { padding: [24, 24] });
          $('#geojsonUploadStatus').innerHTML = `<span style="color:#10b981;font-weight:700;">GeoJSON "${file.name}" cargado en el Mapa SIG.</span>`;
          showToast('Polígono GeoJSON añadido al Mapa SIG');
        } catch (err) {
          $('#geojsonUploadStatus').innerHTML = `<span style="color:#ef4444;font-weight:700;">${err.message}</span>`;
        }
      };
      reader.readAsText(file);
    });

    $('#btnAddPhoto')?.addEventListener('click', savePhoto);
    $('#ampayComparisonSelect')?.addEventListener('change', renderAmpayComparison);
    $('#ampayComparisonZoom')?.addEventListener('click', () => {
      const img = $('#ampayComparisonImage');
      openImagePreview(img.src, img.alt);
    });

    $('#btnPrintReport')?.addEventListener('click', () => window.print());
    $('#btnRefreshReport')?.addEventListener('click', () => {
      renderReporteSatelital();
      showToast('Reporte actualizado');
    });

    applyLanguage(savedLang);
    loadSavedPhotos();
  }

  document.addEventListener('DOMContentLoaded', initApp);
})();
