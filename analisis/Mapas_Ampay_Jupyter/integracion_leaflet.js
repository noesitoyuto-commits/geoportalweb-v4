/* La primera asignación se completa al generar los mapas. */
(() => {
  'use strict';
  const datos = /* INSERTAR_CATALOGO */ null;
  if (!datos) return;

  const raiz = new URL('.', document.currentScript.src);
  const instalados = new WeakMap();
  const numero = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 });
  window.ampayJupyterCatalogo = datos;

  window.agregarMapasJupyterAmpay = (mapa, inicial = '') => {
    if (instalados.has(mapa)) return instalados.get(mapa);
    const pane = 'ampay-jupyter-raster';
    const contenedor = mapa.getPane(pane) || mapa.createPane(pane);
    contenedor.style.zIndex = '350';
    contenedor.style.pointerEvents = 'none';
    const control = L.control({ position: 'topright' });
    control.onAdd = () => {
      const panel = L.DomUtil.create('div', 'leaflet-bar ampay-layer-control');
      panel.style.cssText = 'width:228px;max-width:65vw;padding:10px;background:#0b1927;color:#ecf6fb;border:1px solid #385266;border-radius:8px;font:12px/1.45 system-ui';
      L.DomEvent.disableClickPropagation(panel);
      L.DomEvent.disableScrollPropagation(panel);

      const etiqueta = document.createElement('label');
      etiqueta.textContent = 'Mapas Ampay';
      etiqueta.style.fontWeight = '700';
      const lista = document.createElement('select');
      lista.className = 'ampay-layer-select';
      lista.style.cssText = 'display:block;width:100%;margin:5px 0;padding:5px;color:#ecf6fb;background:#152939;border:1px solid #506776;border-radius:4px';
      lista.add(new Option('Sin capa', ''));
      const grupos = new Map();
      for (const c of datos.capas) {
        if (!grupos.has(c.grupo)) {
          const grupo = document.createElement('optgroup');
          grupo.label = c.grupo;
          grupos.set(c.grupo, grupo);
          lista.appendChild(grupo);
        }
        grupos.get(c.grupo).appendChild(new Option(c.nombre, c.id));
      }
      etiqueta.appendChild(lista);
      panel.appendChild(etiqueta);
      const leyenda = document.createElement('div');
      leyenda.setAttribute('aria-live', 'polite');
      panel.appendChild(leyenda);

      const encuadrar = document.createElement('button');
      encuadrar.type = 'button';
      encuadrar.textContent = 'Ver extensión de la capa';
      encuadrar.style.cssText = 'margin-top:6px;padding:4px 7px;border:1px solid #506776;border-radius:4px;color:#ecf6fb;background:#152939';
      panel.appendChild(encuadrar);

      let capa;
      const actualizar = () => {
        if (capa) mapa.removeLayer(capa);
        capa = null;
        leyenda.replaceChildren();
        const elegida = datos.capas.find(c => c.id === lista.value);
        encuadrar.hidden = !elegida;
        if (!elegida) return;

        if (elegida.tipo === 'raster') {
          const opciones = { opacity: .88, interactive: false, pane };
          if (elegida.regional) opciones.className = 'ampay-grilla-regional';
          capa = L.imageOverlay(new URL(elegida.archivo, raiz).href, elegida.bounds, opciones).addTo(mapa);
          if (elegida.regional) capa.getElement().style.imageRendering = 'pixelated';
        } else {
          capa = L.geoJSON(datos.vectores[elegida.id], {
            style: { color: elegida.color, weight: 2, fillOpacity: .44 },
            onEachFeature: (f, lyr) => {
              if (Number.isFinite(f.properties?.area_ha)) lyr.bindTooltip(numero.format(f.properties.area_ha) + ' ha');
            }
          }).addTo(mapa);
        }

        const meta = document.createElement('p');
        meta.style.cssText = 'margin:4px 0;color:#c3d6e3';
        meta.textContent = [elegida.periodo, elegida.resolucion, elegida.fuente].filter(Boolean).join(' · ');
        leyenda.appendChild(meta);

        if (elegida.tipo === 'vector' && capa.getLayers().length === 0) {
          const aviso = document.createElement('p');
          aviso.textContent = 'Sin polígonos candidatos para este producto. Usa las capas de agua histórica o las lagunas del geoportal como referencia.';
          aviso.style.margin = '4px 0';
          leyenda.appendChild(aviso);
          encuadrar.hidden = true;
        }

        if (elegida.clases) {
          const clases = document.createElement('div');
          clases.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px';
          elegida.clases.forEach((nombre, i) => {
            const clase = document.createElement('span');
            const color = document.createElement('span');
            color.style.cssText = 'display:block;height:5px;border-radius:2px';
            color.style.backgroundColor = elegida.colores[i];
            clase.append(color, nombre);
            clases.appendChild(clase);
          });
          leyenda.appendChild(clases);
        } else if (elegida.rango) {
          const barra = document.createElement('div');
          barra.style.height = '7px';
          barra.style.borderRadius = '2px';
          barra.style.background = 'linear-gradient(90deg,' + elegida.colores.join(',') + ')';
          const limites = document.createElement('p');
          limites.style.cssText = 'display:flex;justify-content:space-between;gap:5px;margin:2px 0';
          limites.append(numero.format(elegida.rango[0]), elegida.unidad, numero.format(elegida.rango[1]));
          leyenda.append(barra, limites);
        }
        if (elegida.regional) {
          const nota = document.createElement('p');
          nota.textContent = 'Cuadrícula regional';
          nota.style.margin = '4px 0 0';
          leyenda.appendChild(nota);
        }
      };
      lista.addEventListener('change', actualizar);
      encuadrar.addEventListener('click', () => {
        const bounds = capa?.getBounds?.();
        if (bounds?.isValid()) mapa.fitBounds(bounds, { padding: [24, 24] });
      });
      lista.value = datos.capas.some(c => c.id === inicial) ? inicial : '';
      actualizar();
      return panel;
    };
    control.addTo(mapa);
    instalados.set(mapa, control);
    return control;
  };
})();

