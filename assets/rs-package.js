/* Reach Screens package disclosures.
   The panels ship OPEN in the markup on purpose: if this file fails to load the
   detail is still readable. This collapses them on init, then toggles. */
/* Reach Screens · package disclosures (section B). Self contained, safe to append. */
(function () {
  'use strict';
  function bind() {
    var toggles = document.querySelectorAll('.rs-pkg-toggle[aria-controls]');
    if (!toggles.length) return;
    Array.prototype.forEach.call(toggles, function (btn) {
      if (btn.getAttribute('data-rs-pkg-bound') === '1') return;
      btn.setAttribute('data-rs-pkg-bound', '1');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      var open = btn.getAttribute('aria-expanded') === 'true';
      panel.hidden = !open;
      btn.addEventListener('click', function () {
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        panel.hidden = isOpen;
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
