/* ============================================================
   REACH SCREENS — main.js (v4)
   Parallax · scroll-hide nav · count-up · reveals · form · modal
   ============================================================ */

(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: scroll-hide + scrolled state + mobile menu ---------- */
  function initNav() {
    const nav = $('.nav');
    if (!nav) return;
    let lastY = 0;
    let raf = null;

    const onScroll = () => {
      const y = window.scrollY;
      // Scrolled state (background) — nav stays pinned at all times
      nav.classList.toggle('scrolled', y > 24);
      // Hero parallax (px-based, drives translateY directly)
      const hero = $('.hero-bg');
      if (hero && y < window.innerHeight) {
        document.documentElement.style.setProperty('--scroll-y', String(y));
      }
      lastY = y;
      raf = null;
    };

    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(onScroll);
    }, { passive: true });

    // Initial state
    onScroll();

    // Mobile menu toggle
    const toggle = $('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('menu-open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      });
      // Close menu on any link click
      $$('.nav-links a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    if (prefersReduce) {
      $$('.reveal, .reveal-stagger').forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal, .reveal-stagger').forEach(el => io.observe(el));
  }

  /* ---------- Count-up stats ---------- */
  function initCountUps() {
    const els = $$('[data-count]');
    if (!els.length) return;

    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const decimals = (String(target).split('.')[1] || '').length;
      const duration = 1400;
      const start = performance.now();
      const easeOut = t => 1 - Math.pow(1 - t, 3);

      const fmt = (v) => {
        if (decimals) return v.toFixed(decimals);
        if (target >= 1000) return Math.round(v).toLocaleString();
        return Math.round(v).toString();
      };
      const render = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const v = target * easeOut(t);
        el.textContent = prefix + fmt(v) + suffix;
        if (t < 1) requestAnimationFrame(render);
        else el.__animating = false;
      };
      if (prefersReduce) {
        el.textContent = prefix + fmt(target) + suffix;
        el.__animating = false;
      } else {
        requestAnimationFrame(render);
      }
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!e.target.__animating) {
            e.target.__animating = true;
            animate(e.target);
          }
        } else {
          // Reset when out of view so it re-counts on next entry
          e.target.__animating = false;
          const target = parseFloat(e.target.dataset.count);
          const prefix = e.target.dataset.prefix || '';
          const decimals = (String(target).split('.')[1] || '').length;
          let zero = decimals ? (0).toFixed(decimals) : '0';
          e.target.textContent = prefix + zero;
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Form submission ---------- */
  function initForm() {
    const form = $('#idea-form');
    if (!form) return;
    const endpoint = form.dataset.endpoint;
    const feedback = $('[data-form-feedback]', form);
    const submitBtn = $('.form-submit', form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Honeypot
      if (form._hp && form._hp.value) return;

      const data = {
        inquiryType: 'advertise',
        message: form.message.value.trim(),
        name: form.name.value.trim(),
        business: form.business.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        source: 'reachscreens.ca / home',
        page: location.href,
      };

      submitBtn.disabled = true;
      const originalText = submitBtn.textContent.trim();
      submitBtn.textContent = 'Sending…';
      feedback.classList.remove('show', 'success', 'error');

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        feedback.textContent = "Got it. We'll be in touch within 48 hours.";
        feedback.classList.add('show', 'success');
        form.reset();
      } catch (err) {
        feedback.textContent = "Couldn't send — try emailing info@reachscreens.ca instead.";
        feedback.classList.add('show', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText + ' <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>';
      }
    });
  }

  /* ---------- Location modal (shared across pages) ---------- */
  const Modal = (function () {
    const overlay = $('#location-modal');
    if (!overlay) return { open: () => {}, close: () => {} };
    const nameEl = $('[data-modal-name]', overlay);
    const addrEl = $('[data-modal-addr]', overlay);
    const metaEl = $('[data-modal-meta]', overlay);
    const imgWrap = $('[data-modal-image]', overlay);
    const closeBtn = $('[data-modal-close]', overlay);
    const dirBtn = $('[data-modal-directions]', overlay);
    const ctaBtn = $('[data-modal-close-then]', overlay);

    function open(loc) {
      if (!loc) return;
      nameEl.textContent = loc.name;
      addrEl.textContent = loc.address;

      // Build meta tags
      metaEl.innerHTML = '';
      const tags = [];
      const screens = loc.screens && loc.screens > 1 ? loc.screens + ' screens' : '1 screen';
      tags.push({ icon: '◉', label: screens });
      if (loc.address.includes(' AB ')) tags.push({ icon: '⛰', label: 'Alberta side' });
      else if (loc.address.includes(' SK ')) tags.push({ icon: '🌾', label: 'Saskatchewan side' });
      tags.forEach(t => {
        const el = document.createElement('span');
        el.className = 'modal-tag';
        el.textContent = (t.icon ? t.icon + ' ' : '') + t.label;
        metaEl.appendChild(el);
      });

      // Prefer a real photo of the location; fall back to OSM embed
      const q = encodeURIComponent(loc.lat + ',' + loc.lng);
      const pillHtml = `
        <div class="modal-image-pill">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${escapeHtml(loc.address)}</span>
        </div>
      `;
      if (loc.image) {
        imgWrap.innerHTML = `
          <img src="${loc.image}" alt="${escapeHtml(loc.name)} — inside the location" class="modal-location-img" loading="lazy">
          ${pillHtml}
        `;
      } else {
        imgWrap.innerHTML = `
          <div class="modal-image-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m3 17 5-5 4 4 3-3 6 6"/></svg>
            <span>Image coming soon</span>
          </div>
          ${pillHtml}
        `;
      }

      // Directions link
      if (dirBtn) dirBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${q}`;

      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('open'));
      document.body.style.overflow = 'hidden';
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(() => {
        overlay.hidden = true;
        imgWrap.innerHTML = `<div class="modal-image-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10c-2.5-3-4-6.5-4-10s1.5-7 4-10z"/></svg>
          <span>Map view</span>
        </div>`;
      }, 280);
    }

    closeBtn && closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    if (ctaBtn) ctaBtn.addEventListener('click', () => close());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });

    return { open, close };
  })();
  window.__rsModal = Modal;

  /* ---------- Locations page list (only present on locations.html) ---------- */
  function initLocationsList() {
    const list = $('[data-locations-list]');
    if (!list || !window.screenLocations) return;
    const filterInput = $('[data-locations-filter]');
    const totalEl = $('[data-locations-total]');

    function render(items) {
      list.innerHTML = '';
      items.forEach((loc, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'location-item';
        btn.dataset.locId = loc.id;
        btn.innerHTML = `
          <span class="location-info">
            <span class="location-name">${escapeHtml(loc.name)}</span>
            <span class="location-addr">${escapeHtml(loc.address)}</span>
            ${loc.screens && loc.screens > 1 ? `<span class="location-screens-badge">${loc.screens} screens</span>` : ''}
          </span>
          <span class="location-arrow">→</span>
        `;
        btn.addEventListener('click', () => {
          Modal.open(loc);
          // Also fly the map to the location if available
          if (window.__rsMap) {
            try {
              window.__rsMap.flyTo({
                center: [loc.lng, loc.lat],
                zoom: 16.5,
                pitch: 60,
                bearing: -10,
                duration: 1400,
                essential: true,
              });
            } catch (_) {}
          }
        });
        list.appendChild(btn);
      });
      if (totalEl) totalEl.textContent = items.length;
    }

    render(window.screenLocations);

    if (filterInput) {
      filterInput.addEventListener('input', () => {
        const q = filterInput.value.trim().toLowerCase();
        if (!q) return render(window.screenLocations);
        const filtered = window.screenLocations.filter(l =>
          l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
        );
        render(filtered);
      });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---------- Reviews carousel (Google-style with center scale) ---------- */
  function initReviewsCarousel() {
    const carousel = $('[data-reviews-carousel]');
    if (!carousel) return;
    const track = $('[data-reviews-track]', carousel);
    const cards = $$('[data-review-card]', carousel);
    if (!track || !cards.length) return;

    // Mark the card whose center is closest to the track's center as .is-center
    const setCenter = () => {
      const trackRect = track.getBoundingClientRect();
      const centerX = trackRect.left + trackRect.width / 2;
      let nearest = null, nearestDist = Infinity;
      cards.forEach(card => {
        const r = card.getBoundingClientRect();
        const dist = Math.abs(r.left + r.width / 2 - centerX);
        if (dist < nearestDist) { nearestDist = dist; nearest = card; }
      });
      cards.forEach(c => c.classList.toggle('is-center', c === nearest));
    };
    let rafId = null;
    track.addEventListener('scroll', () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => { setCenter(); rafId = null; });
    }, { passive: true });

    // Initial centering — scroll the first card into center
    requestAnimationFrame(() => {
      const first = cards[0];
      if (first) {
        const trackRect = track.getBoundingClientRect();
        const cardRect = first.getBoundingClientRect();
        const offset = (cardRect.left - trackRect.left) - (trackRect.width / 2 - cardRect.width / 2);
        track.scrollLeft = offset;
      }
      setCenter();
    });

    // Click-and-drag horizontal scroll (desktop)
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // let native touch handle it
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
      carousel.classList.add('is-dragging');
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      track.scrollLeft = startScroll - dx;
    });
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      carousel.classList.remove('is-dragging');
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // If the pointer was dragged, swallow the next click so the card doesn't open
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (moved) { e.preventDefault(); moved = false; }
      });
    });

    // Click a non-center card → snap it to center (in addition to opening on second click)
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!card.classList.contains('is-center')) {
          e.preventDefault();
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    // Re-evaluate on resize
    window.addEventListener('resize', () => setCenter(), { passive: true });
  }

  /* ---------- Boot ---------- */
  function boot() {
    initNav();
    initReveals();
    initCountUps();
    initForm();
    initLocationsList();
    initReviewsCarousel();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
