/* Reach Screens · coverage-area map.
   A market with installed screens gets pins, drawn by map.js from the real
   screen-locations.js data. A market whose screens are not in yet gets THIS:
   the communities we sell, each drawn at its own coordinates and labelled.
   It is never fed invented pins. There is no honest pin to draw, and a venue
   owner who spots one invented location stops believing the other 33.

   Three things here were each a real failure first, so none of them is
   decoration:

   1. ONE circle round the market centre. At the 11 km it needed to reach
      Fort Saskatchewan it also swallowed most of Edmonton, so the map
      claimed a city we do not sell in. Draw the communities, never a radius.
   2. The circles were a GeoJSON fill layer. They painted on some loads and
      not others · three identical renders gave two blank maps and one right
      one. A coverage map that silently shows no coverage is worse than no
      map. They are DOM markers now, which cannot lose that race.
   3. fitBounds ran before the style was up, where it is silently dropped.
      The view stayed at the placeholder zoom and the discs looked tiny
      beside Edmonton. Fit on load and on resize, not once and hopefully.

   Config comes from window.rsAreaMap. */
(function () {
  'use strict';

  var EARTH = 156543.03392; // metres per pixel at zoom 0 on the equator

  function pxRadius(map, lat, radiusKm) {
    var mpp = (EARTH * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
    return (radiusKm * 1000) / mpp;
  }

  function offsetLatLng(lng, lat, km, bearingDeg) {
    var t = (bearingDeg * Math.PI) / 180;
    return [lng + (km * Math.sin(t)) / (111.32 * Math.cos((lat * Math.PI) / 180)), lat + (km * Math.cos(t)) / 110.574];
  }

  var started = false;

  function init() {
    var cfg = window.rsAreaMap;
    var el = document.getElementById('map');
    if (started || !cfg || !el || typeof maplibregl === 'undefined') return;
    started = true;

    var places = (cfg.places || []).filter(function (p) { return typeof p.lat === 'number' && typeof p.lng === 'number'; });
    if (!places.length) return;
    var areas = places.filter(function (p) { return p.radiusKm; });

    var map = new maplibregl.Map({
      container: 'map',
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [places[0].lng, places[0].lat],
      zoom: 9,
      attributionControl: false,
      fadeDuration: 250,
    });
    window.__rsAreaMap = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    // A label-only place is deliberately NOT fitted. Fitting one 20 km out
    // pulled Edmonton in as the largest thing on the map.
    var bounds = new maplibregl.LngLatBounds();
    (areas.length ? areas : places).forEach(function (p) {
      [0, 90, 180, 270].forEach(function (deg) { bounds.extend(offsetLatLng(p.lng, p.lat, p.radiusKm || 2, deg)); });
    });

    var discs = areas.map(function (p) {
      var node = document.createElement('div');
      node.className = 'rs-area-disc';
      new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
      return { place: p, node: node };
    });

    function sizeDiscs() {
      discs.forEach(function (d) {
        var r = Math.max(8, pxRadius(map, d.place.lat, d.place.radiusKm));
        d.node.style.width = d.node.style.height = (r * 2) + 'px';
      });
    }

    function frame() {
      map.fitBounds(bounds, { padding: 30, duration: 0, animate: false });
      sizeDiscs();
    }

    map.on('zoom', sizeDiscs);
    map.on('move', sizeDiscs);
    map.on('load', frame);
    map.on('resize', frame);
    sizeDiscs();

    // Labels last, so a chip is never buried under a disc.
    places.forEach(function (p) {
      var node = document.createElement('div');
      node.className = 'rs-area-pin';
      node.textContent = p.name;
      new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([p.lng, p.lat]).addTo(map);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.rsAreaMapInit = init;
})();
