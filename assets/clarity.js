/* ============================================================
   Reach Screens — Microsoft Clarity loader (heatmaps + recordings)

   ⚠️  ONE-LINE EDIT REQUIRED:
   Put your Clarity Project ID in CLARITY_PROJECT_ID below.
   Find it at https://clarity.microsoft.com/ → your project →
   Settings → Setup (it's the short id in the install snippet,
   e.g. 'abcd1234ef'), or in the project URL.

   While the id is empty, this file is a no-op — Clarity is not
   loaded and the rest of the site is unaffected. Once you set the
   id (and uncomment the <script> tag in index.html / locations.html),
   Clarity starts recording heatmaps, scroll maps, and session
   replays. Runs independently of GA4 (analytics.js) and the
   first-party tracker (rs-analytics.js).
   ============================================================ */
(function () {
  'use strict';

  var CLARITY_PROJECT_ID = 'x8j68xo9f7';   // Reach Screens project (clarity.microsoft.com)

  if (!CLARITY_PROJECT_ID) return;   // no-op until configured

  // Microsoft Clarity's standard async loader, with the tag fetch held until the
  // page is idle. The queue (clarity.q) is created immediately, so any call made
  // before the tag lands is replayed. See assets/rs-defer.js.
  (function (c, l, a, r, i) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    (c.rsDefer || function (f) { f(); })(function () {
      var t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    });
  })(window, document, 'clarity', 'script', CLARITY_PROJECT_ID);
})();
