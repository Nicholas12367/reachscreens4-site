/* ============================================================
   REACH SCREENS — map.js (v4)
   MapLibre GL + OpenFreeMap (no key) + 3D buildings
   Click pin → custom popup → "View details" opens shared modal
   ============================================================ */

(function () {
  'use strict';

  let bootstrapped = false;

  function ready() {
    if (typeof maplibregl === 'undefined') return false;
    if (!Array.isArray(window.screenLocations)) return false;
    if (!document.getElementById('map')) return false;
    return true;
  }

  function boot() {
    if (bootstrapped) return;
    if (!ready()) return requestAnimationFrame(boot);
    bootstrapped = true;

    const locations = window.screenLocations;
    const map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-110.0050, 53.2783],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
      fadeDuration: 250,
    });
    window.__rsMap = map;

    map.on('error', (e) => {
      const err = e && e.error;
      if (err && /image|not found|missing/i.test(err.message || '')) return;
    });

    // Silence missing-sprite warnings from OpenFreeMap by providing a transparent stub
    map.on('styleimagemissing', (e) => {
      if (!map.hasImage(e.id)) {
        const px = new Uint8Array([0, 0, 0, 0]);
        map.addImage(e.id, { width: 1, height: 1, data: px }, { pixelRatio: 1 });
      }
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    let setupRan = false;
    let flyRan = false;

    function doFlyIn() {
      if (flyRan) return;
      flyRan = true;
      try { map.resize(); } catch (_) {}
      map.flyTo({
        center: [-110.0050, 53.2783],
        zoom: 14,
        pitch: 55,
        bearing: -18,
        duration: 3500,
        essential: true,
        curve: 1.4,
      });
      try { map.triggerRepaint(); } catch (_) {}
    }

    // Fire the cinematic flyTo when the map first scrolls into view.
    // Falls back to firing immediately if IntersectionObserver isn't available.
    function armFlyOnScroll() {
      const mapEl = document.getElementById('map');
      if (!mapEl) return;
      if (typeof IntersectionObserver === 'undefined') {
        setTimeout(doFlyIn, 300);
        return;
      }
      const rect = mapEl.getBoundingClientRect();
      const inView = rect.top < (window.innerHeight || document.documentElement.clientHeight) * 0.85
        && rect.bottom > 0;
      if (inView) {
        setTimeout(doFlyIn, 300);
        return;
      }
      const io = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            doFlyIn();
            io.disconnect();
            break;
          }
        }
      }, { threshold: [0, 0.25, 0.5] });
      io.observe(mapEl);
    }

    function setup() {
      if (setupRan) return;
      setupRan = true;
      addBuildings(map);
      addMarkers(map, locations);
      try { map.resize(); map.triggerRepaint(); } catch (_) {}
      armFlyOnScroll();
    }
    map.on('load', setup);
    map.on('idle', setup);
    map.once('style.load', setup);
    setTimeout(setup, 1500);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => { try { map.resize(); } catch (_) {} });
      const wrap = document.querySelector('.map-block') || document.querySelector('#map').parentElement;
      if (wrap) ro.observe(wrap);
    }
  }

  function addBuildings(map) {
    if (!map.isStyleLoaded()) {
      map.once('idle', () => addBuildings(map));
      return;
    }
    if (map.getLayer('rs-buildings-3d')) return;

    const sources = map.getStyle().sources || {};
    let sourceId = null;
    for (const id of Object.keys(sources)) {
      if (sources[id].type === 'vector' && (id === 'openmaptiles' || id === 'omt' || id.includes('osm') || id.includes('tiles'))) {
        sourceId = id; break;
      }
    }
    if (!sourceId) {
      for (const id of Object.keys(sources)) {
        if (sources[id].type === 'vector') { sourceId = id; break; }
      }
    }
    if (!sourceId) return;

    const layers = map.getStyle().layers || [];
    const firstSymbol = layers.find(l => l.type === 'symbol');
    const beforeId = firstSymbol ? firstSymbol.id : undefined;

    try {
      map.addLayer({
        id: 'rs-buildings-3d',
        type: 'fill-extrusion',
        source: sourceId,
        'source-layer': 'building',
        filter: ['!=', ['get', 'hide_3d'], true],
        minzoom: 13,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 4],
            0, '#1a2540',
            10, '#243456',
            25, '#2c4068',
            60, '#3a5483',
          ],
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            14, ['coalesce', ['get', 'render_height'], 4],
          ],
          'fill-extrusion-base': [
            'interpolate', ['linear'], ['zoom'],
            13, 0,
            14, ['coalesce', ['get', 'render_min_height'], 0],
          ],
          'fill-extrusion-opacity': 0.88,
          'fill-extrusion-vertical-gradient': true,
        },
      }, beforeId);
    } catch (e) { /* ignore */ }
  }

  let markersAdded = false;
  function addMarkers(map, locations) {
    if (markersAdded) return;
    markersAdded = true;

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 22,
      maxWidth: '280px',
      className: 'rs-popup',
    });

    locations.forEach(loc => {
      const el = document.createElement('div');
      el.className = 'screen-marker';
      el.innerHTML =
        '<div class="screen-marker-pin" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="4" width="18" height="13" rx="1.5"/>' +
        '<path d="M9 21h6"/><path d="M12 17v4"/></svg></div>';
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', loc.name);

      new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([loc.lng, loc.lat])
        .addTo(map);

      const handleSelect = () => {
        const countLine = (loc.screens && loc.screens > 1)
          ? '<div class="map-popup-count">' + loc.screens + ' screens at this location</div>'
          : '<div class="map-popup-count">1 screen at this location</div>';

        const html =
          '<div class="map-popup-label">Reach Screen</div>' +
          '<div class="map-popup-name">' + escapeHtml(loc.name) + '</div>' +
          '<div class="map-popup-addr">' + escapeHtml(loc.address) + '</div>' +
          countLine +
          '<button class="map-popup-btn" type="button" data-popup-open="' + loc.id + '">View details →</button>';

        popup.setLngLat([loc.lng, loc.lat]).setHTML(html).addTo(map);

        map.flyTo({
          center: [loc.lng, loc.lat],
          zoom: 16.5,
          pitch: 65,
          bearing: -10,
          duration: 1400,
          essential: true,
        });

        // Hook the "View details" button after DOM insert
        setTimeout(() => {
          const btn = document.querySelector('.maplibregl-popup-content [data-popup-open="' + loc.id + '"]');
          if (btn) {
            btn.addEventListener('click', () => {
              if (window.__rsModal && window.__rsModal.open) {
                window.__rsModal.open(loc);
              }
              popup.remove();
            });
          }
        }, 0);
      };

      el.addEventListener('click', handleSelect);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(); }
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
