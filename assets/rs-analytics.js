/* ============================================================
   Reach Screens — first-party analytics tracker

   Sends pageviews, clicks, scroll depth, and per-section dwell
   time to https://forms-api.reachscreens.ca/track. Powers the
   self-hosted /admin/analytics dashboard. Runs alongside the
   GA4 tracker in analytics.js — the two are independent.
   ============================================================ */
(function () {
  'use strict';

  var ENDPOINT = 'https://forms-api.reachscreens.ca/track';
  var FLUSH_INTERVAL_MS = 8000;
  var SESSION_TTL_MS = 30 * 60 * 1000; // 30 min of inactivity ends a session

  // --- Session id (per-tab, persists across navigations) ---
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'sid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
  function getSession() {
    try {
      var raw = sessionStorage.getItem('rs_session');
      var now = Date.now();
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.id && (now - obj.last) < SESSION_TTL_MS) {
          obj.last = now;
          sessionStorage.setItem('rs_session', JSON.stringify(obj));
          return obj.id;
        }
      }
      var id = uuid();
      sessionStorage.setItem('rs_session', JSON.stringify({ id: id, last: now }));
      return id;
    } catch (_) {
      return uuid();
    }
  }
  var SID = getSession();

  // --- Outgoing queue ---
  var queue = [];
  function enqueue(type, extras) {
    var ev = {
      sid: SID,
      type: type,
      path: location.pathname + location.search,
      ref: document.referrer || ''
    };
    if (extras) {
      if (extras.label != null) ev.label = String(extras.label).slice(0, 200);
      if (extras.value != null) ev.value = Number(extras.value);
      if (extras.meta && typeof extras.meta === 'object') ev.meta = extras.meta;
    }
    queue.push(ev);
  }
  function flush(useBeacon) {
    if (!queue.length) return;
    var payload = JSON.stringify({ events: queue.splice(0, queue.length) });
    try {
      if (useBeacon && navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () { /* swallow network errors */ });
    } catch (_) { /* swallow */ }
  }
  setInterval(function () { flush(false); }, FLUSH_INTERVAL_MS);
  window.addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flush(true);
  });

  // --- Pageview (one per load) ---
  enqueue('pageview');

  // --- Click tracking (delegated) ---
  function labelFor(target) {
    if (!target) return '';
    var t = target;
    while (t && t !== document.body) {
      if (t.dataset && t.dataset.track) return t.dataset.track;
      var tag = t.tagName && t.tagName.toLowerCase();
      if (tag === 'a' || tag === 'button') {
        var txt = (t.textContent || '').replace(/\s+/g, ' ').trim();
        if (txt) return txt.slice(0, 80);
        var aria = t.getAttribute && t.getAttribute('aria-label');
        if (aria) return aria.slice(0, 80);
      }
      t = t.parentNode;
    }
    return '';
  }
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || !el.closest) return;
    var clickable = el.closest('a, button, [data-track], .logo-tile, .screen-card');
    if (!clickable) return;
    var label = labelFor(clickable);
    if (!label) return;
    enqueue('click', { label: label });
    if (clickable.tagName === 'A' && clickable.href && clickable.host && clickable.host !== location.host) {
      enqueue('outbound_click', { label: clickable.href.slice(0, 200) });
      flush(true);
    }
  }, true);

  // --- Scroll-depth milestones (25 / 50 / 75 / 100) ---
  var milestonesHit = {};
  function scrollPercent() {
    var doc = document.documentElement;
    var body = document.body;
    var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    var viewport = window.innerHeight || doc.clientHeight;
    var fullHeight = Math.max(
      body.scrollHeight, doc.scrollHeight,
      body.offsetHeight, doc.offsetHeight,
      body.clientHeight, doc.clientHeight
    );
    var scrollable = Math.max(1, fullHeight - viewport);
    return Math.min(100, Math.round((scrollTop / scrollable) * 100));
  }
  var rafScheduled = false;
  function onScroll() {
    if (rafScheduled) return;
    rafScheduled = true;
    window.requestAnimationFrame(function () {
      rafScheduled = false;
      var pct = scrollPercent();
      [25, 50, 75, 100].forEach(function (m) {
        if (pct >= m && !milestonesHit[m]) {
          milestonesHit[m] = true;
          enqueue('scroll_depth', { value: m });
        }
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Per-section dwell time ---
  var sections = [];
  function collectSections() {
    var nodes = document.querySelectorAll('section[id], section[aria-labelledby], .review-card, .logo-collage-section, .map-block, .form-section, .social-proof');
    nodes.forEach(function (node) {
      if (sections.find(function (s) { return s.node === node; })) return;
      var key = node.id || node.getAttribute('aria-labelledby') || (node.className || '').split(' ')[0] || 'section';
      sections.push({ node: node, key: key, visibleSince: 0, totalMs: 0 });
    });
  }
  collectSections();
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { collectSections(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var now = Date.now();
      entries.forEach(function (entry) {
        var s = sections.find(function (x) { return x.node === entry.target; });
        if (!s) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          if (!s.visibleSince) s.visibleSince = now;
        } else if (s.visibleSince) {
          s.totalMs += now - s.visibleSince;
          s.visibleSince = 0;
        }
      });
    }, { threshold: [0, 0.3, 0.6] });
    function observeAll() {
      sections.forEach(function (s) { try { io.observe(s.node); } catch (_) {} });
    }
    observeAll();
    setInterval(observeAll, 5000);
    function emitDwell() {
      var now = Date.now();
      sections.forEach(function (s) {
        if (s.visibleSince) {
          s.totalMs += now - s.visibleSince;
          s.visibleSince = 0;
        }
        if (s.totalMs > 1000) {
          enqueue('section_dwell', { label: s.key, value: Math.round(s.totalMs / 1000) });
          s.totalMs = 0;
        }
      });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') emitDwell();
    });
    window.addEventListener('pagehide', emitDwell);
  }

  // --- Form-interaction events ---
  var form = document.getElementById('idea-form');
  if (form) {
    enqueue('form_view');
    form.addEventListener('submit', function () {
      enqueue('form_submit');
      flush(true);
    });
  }
})();
