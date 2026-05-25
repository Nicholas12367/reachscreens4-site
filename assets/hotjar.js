/* ============================================================
   Reach Screens — Hotjar loader

   ⚠️  ONE-LINE EDIT REQUIRED:
   Replace HOTJAR_SITE_ID = 0 below with your real Hotjar Site ID.
   You'll find it after signing up at https://insights.hotjar.com/
   and creating a site for reachscreens.ca (Settings → Sites & Orgs).

   While the ID is 0, this file is a no-op — Hotjar is not loaded
   and the rest of the site is unaffected. Once you set the ID,
   Hotjar will start recording sessions, heatmaps, and rage clicks.
   ============================================================ */
(function () {
  'use strict';

  var HOTJAR_SITE_ID = 0;          // ← put your real numeric site id here
  var HOTJAR_VERSION = 6;

  if (!HOTJAR_SITE_ID) return;     // no-op until configured

  // Hotjar's standard async loader, vendored inline so we control the
  // script tag and version pin. See https://help.hotjar.com/hc/en-us/articles/115011639927
  (function (h, o, t, j, a, r) {
    h.hj = h.hj || function () { (h.hj.q = h.hj.q || []).push(arguments); };
    h._hjSettings = { hjid: HOTJAR_SITE_ID, hjsv: HOTJAR_VERSION };
    a = o.getElementsByTagName('head')[0];
    r = o.createElement('script');
    r.async = 1;
    r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
    a.appendChild(r);
  })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
})();
