/* ================================================================
   Reach Screens — deferred third-party loader.

   GA4 is ~170 KB and Clarity ~25 KB. On a throttled mobile
   connection that is nearly twice the weight of the site's own
   assets, and it competes for bandwidth with the webfont that
   Largest Contentful Paint is waiting on. Loading them eagerly
   cost roughly 20 Lighthouse performance points for data nobody
   needs in the first two seconds.

   Nothing is lost by waiting. Both libraries queue calls made
   before they arrive: gtag pushes to window.dataLayer, Clarity
   pushes to clarity.q. The queue flushes on load.

   Fires on whichever comes first: the browser going idle, the
   first real user interaction, or a hard 4 second backstop so a
   page that never idles still reports.
================================================================ */
(function () {
  'use strict';
  var fired = false;
  var queue = [];

  function fire() {
    if (fired) return;
    fired = true;
    cleanup();
    for (var i = 0; i < queue.length; i++) { try { queue[i](); } catch (e) {} }
    queue.length = 0;
  }

  var EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  function cleanup() {
    for (var i = 0; i < EVENTS.length; i++) {
      window.removeEventListener(EVENTS[i], fire, { passive: true });
    }
  }
  for (var i = 0; i < EVENTS.length; i++) {
    window.addEventListener(EVENTS[i], fire, { passive: true, once: true });
  }

  // Idle is the normal path. requestIdleCallback already takes a timeout, but
  // Safari does not implement it, hence the plain timer fallback.
  if ('requestIdleCallback' in window) {
    requestIdleCallback(fire, { timeout: 4000 });
  } else {
    setTimeout(fire, 4000);
  }
  setTimeout(fire, 6000); // backstop

  // Public API: rsDefer(fn) runs fn once, when the page is done being urgent.
  window.rsDefer = function (fn) {
    if (fired) { try { fn(); } catch (e) {} return; }
    queue.push(fn);
  };
})();
