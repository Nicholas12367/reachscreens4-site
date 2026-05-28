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
        if (e.isIntersecting && !e.target.__animating && !e.target.__done) {
          e.target.__animating = true;
          animate(e.target);
          e.target.__done = true;
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Form submission (works for every .idea-form-instance) ---------- */
  function bindForm(form) {
    if (form.__bound) return;
    form.__bound = true;
    const endpoint = form.dataset.endpoint;
    const source = form.dataset.formSource || 'reachscreens.ca';
    const feedback = $('[data-form-feedback]', form);
    const submitBtn = $('.form-submit', form);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form._hp && form._hp.value) return;

      const data = {
        inquiryType: 'advertise',
        message: form.message.value.trim(),
        name: form.name.value.trim(),
        business: form.business.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        source,
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
  function initForm() {
    $$('.idea-form-instance').forEach(bindForm);
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
      const photos = Array.isArray(loc.images) && loc.images.length ? loc.images : (loc.image ? [loc.image] : []);
      const fitClass = loc.objectFit === 'contain' ? ' modal-location-img--contain' : '';
      if (photos.length > 1) {
        const slides = photos.map((src, i) => `
          <img src="${src}" alt="${escapeHtml(loc.name)} — inside the location" class="modal-location-img${fitClass}${i === 0 ? ' is-active' : ''}" data-slide="${i}" loading="lazy">
        `).join('');
        const dots = photos.map((_, i) => `<button type="button" class="modal-image-dot${i === 0 ? ' is-active' : ''}" data-dot="${i}" aria-label="Show photo ${i + 1}"></button>`).join('');
        imgWrap.innerHTML = `
          ${slides}
          <button type="button" class="modal-image-nav modal-image-nav--prev" data-prev aria-label="Previous photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="modal-image-nav modal-image-nav--next" data-next aria-label="Next photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div class="modal-image-dots" role="tablist">${dots}</div>
          ${pillHtml}
        `;
        let current = 0;
        const total = photos.length;
        const showSlide = (idx) => {
          current = (idx + total) % total;
          imgWrap.querySelectorAll('.modal-location-img').forEach((el, i) => el.classList.toggle('is-active', i === current));
          imgWrap.querySelectorAll('.modal-image-dot').forEach((el, i) => el.classList.toggle('is-active', i === current));
        };
        imgWrap.querySelector('[data-prev]').addEventListener('click', (e) => { e.stopPropagation(); showSlide(current - 1); });
        imgWrap.querySelector('[data-next]').addEventListener('click', (e) => { e.stopPropagation(); showSlide(current + 1); });
        imgWrap.querySelectorAll('.modal-image-dot').forEach((el) => {
          el.addEventListener('click', (e) => { e.stopPropagation(); showSlide(parseInt(el.dataset.dot, 10)); });
        });
      } else if (photos.length === 1) {
        imgWrap.innerHTML = `
          <img src="${photos[0]}" alt="${escapeHtml(loc.name)} — inside the location" class="modal-location-img${fitClass} is-active" loading="lazy">
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

    // Initial centering — scroll the [data-review-center] card into center,
    // falling back to the middle card if none is marked, then to cards[0].
    requestAnimationFrame(() => {
      const target = $('[data-review-center]', track) || cards[Math.floor(cards.length / 2)] || cards[0];
      if (target) {
        const trackRect = track.getBoundingClientRect();
        const cardRect = target.getBoundingClientRect();
        const offset = (cardRect.left - trackRect.left) - (trackRect.width / 2 - cardRect.width / 2);
        track.scrollLeft = offset;
      }
      setCenter();
    });

    // Click-and-drag horizontal scroll (desktop). Only mark as "dragging" once
    // the pointer has actually moved past a threshold — a plain click should
    // never set .is-dragging, otherwise pointer-events:none on the descendants
    // would kill the Read more button's click event.
    let isDown = false, startX = 0, startScroll = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // let native touch handle it
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = track.scrollLeft;
    });
    track.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        carousel.classList.add('is-dragging');
      }
      if (moved) track.scrollLeft = startScroll - dx;
    });
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      carousel.classList.remove('is-dragging');
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    // Card click: open Google profile (unless click was on toggle or was a drag)
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Ignore clicks that originated on the Read more toggle
        if (e.target.closest('.g-review-toggle')) return;
        // Ignore drags
        if (moved) { moved = false; return; }
        // Non-center → snap to center first
        if (!card.classList.contains('is-center')) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          return;
        }
        // Center → open the Google profile
        const href = card.dataset.href;
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
      });
      // Keyboard activation (Enter / Space) since role="link" expects it
      card.addEventListener('keydown', (e) => {
        if (e.target.closest('.g-review-toggle')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Read more / Show less toggle
    cards.forEach(card => {
      const body = $('.g-review-body', card);
      const toggle = $('.g-review-toggle', card);
      if (!body || !toggle) return;
      // Mark cards whose text is clamped so the toggle becomes visible
      const checkOverflow = () => {
        if (card.classList.contains('is-expanded')) {
          card.classList.add('has-overflow');
          return;
        }
        const overflowing = body.scrollHeight - body.clientHeight > 2;
        card.classList.toggle('has-overflow', overflowing);
      };
      requestAnimationFrame(checkOverflow);
      window.addEventListener('resize', checkOverflow, { passive: true });
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = card.classList.toggle('is-expanded');
        toggle.textContent = expanded ? 'Show less' : 'Read more';
        toggle.setAttribute('aria-expanded', String(expanded));
      });
    });

    // Re-evaluate on resize
    window.addEventListener('resize', () => setCenter(), { passive: true });
  }

  /* ---------- Form modal (mount + open/close + CTA intercept) ---------- */
  const FORM_MODAL_HTML = `
    <div class="modal-overlay form-modal-overlay" id="form-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="form-h" hidden>
      <div class="form-modal-shell">
        <button type="button" class="form-modal-close" data-form-modal-close aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <div class="form-section form-section--modal">
          <div class="form-grid">
            <div class="form-side">
              <span class="eyebrow">What happens next</span>
              <h2 id="form-h">One message away from a <span class="text-mint">free, no-obligation ad design.</span></h2>
              <p>Three simple steps &mdash; you won't lift a finger after the first one.</p>
              <ol class="form-steps">
                <li><span class="form-step-num">1</span><div class="form-step-text"><strong>Send us your idea</strong><span>Fill the form. One sentence about your business is enough.</span></div></li>
                <li><span class="form-step-num">2</span><div class="form-step-text"><strong>We come back with a plan</strong><span>Within 48 hours &mdash; locations, timing, and price.</span></div></li>
                <li><span class="form-step-num">3</span><div class="form-step-text"><strong>Your ad goes live within a day</strong><span>Free design included. No commitment to get a quote.</span></div></li>
              </ol>
            </div>
            <div class="form-card">
              <div class="form-card-head">
                <div class="form-card-head-title">Start the conversation</div>
                <div class="form-card-head-sub">We'll be in touch within 48 hours</div>
              </div>
              <form id="idea-form" class="idea-form-instance" data-endpoint="https://forms-api.reachscreens.ca/submit" data-form-source="reachscreens.ca / home (modal)">
                <input type="text" name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;">
                <div class="form-row"><div class="form-field"><label for="f-message"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg> What's your idea?</label><textarea id="f-message" name="message" required placeholder="e.g., Promote our grand opening on June 14 — drive foot traffic for four weeks"></textarea></div></div>
                <div class="form-row two"><div class="form-field"><label for="f-name">Your name</label><input id="f-name" name="name" type="text" required placeholder="First & last name"></div><div class="form-field"><label for="f-business">Business</label><input id="f-business" name="business" type="text" required placeholder="Company name"></div></div>
                <div class="form-row two"><div class="form-field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" required placeholder="you@business.com"></div><div class="form-field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" type="tel" required placeholder="(306) 555-0123"></div></div>
                <button type="submit" class="form-submit">Get My Free Ad Design <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg></button>
                <div class="form-feedback" data-form-feedback></div>
                <div class="form-trust">
                  <span class="form-trust-item"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> 48-hour response</span>
                  <span class="form-trust-item"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> Ad design included</span>
                  <span class="form-trust-item"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7 7a1 1 0 01-1.4 0l-3-3a1 1 0 111.4-1.4l2.3 2.3 6.3-6.3a1 1 0 011.4 0z" clip-rule="evenodd"/></svg> No commitment</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  let formModalEl = null;
  function mountFormModal() {
    const mount = $('#form-modal-mount');
    if (!mount) return;
    mount.innerHTML = FORM_MODAL_HTML;
    formModalEl = $('#form-modal-overlay');
  }

  /* ---------- Contact Us modal (Call Now + form) ---------- */
  const CONTACT_MODAL_HTML = `
    <div class="modal-overlay form-modal-overlay" id="contact-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" hidden>
      <div class="form-modal-shell">
        <button type="button" class="form-modal-close" data-contact-modal-close aria-label="Close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M6 18L18 6"/></svg>
        </button>
        <div class="form-section form-section--modal">
          <h2 id="contact-modal-title" class="sr-only">Contact Reach Screens</h2>
          <a class="contact-call-btn" href="tel:+13065143752">
            <span class="contact-call-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/></svg>
            </span>
            <span class="contact-call-body">
              <span class="contact-call-label">Call Now</span>
              <span class="contact-call-number">(306) 514-3752</span>
            </span>
          </a>
          <div class="contact-divider"><span>Prefer to send a quick note?</span></div>
          <div class="form-card">
            <form id="contact-form" class="idea-form-instance" data-endpoint="https://forms-api.reachscreens.ca/submit" data-form-source="reachscreens.ca / contact modal">
              <input type="text" name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;">
              <div class="form-row"><div class="form-field"><label for="cf-message"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 2"/></svg> What's your question?</label><textarea id="cf-message" name="message" required placeholder="One sentence is enough — we'll come back with a plan."></textarea></div></div>
              <div class="form-row two"><div class="form-field"><label for="cf-name">Your name</label><input id="cf-name" name="name" type="text" required placeholder="First & last name"></div><div class="form-field"><label for="cf-business">Business</label><input id="cf-business" name="business" type="text" required placeholder="Company name"></div></div>
              <div class="form-row two"><div class="form-field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required placeholder="you@business.com"></div><div class="form-field"><label for="cf-phone">Phone</label><input id="cf-phone" name="phone" type="tel" required placeholder="(306) 555-0123"></div></div>
              <button type="submit" class="form-submit">Send Message <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg></button>
              <div class="form-feedback" data-form-feedback></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  let contactModalEl = null;
  function mountContactModal() {
    const mount = $('#contact-modal-mount');
    if (!mount) return;
    mount.innerHTML = CONTACT_MODAL_HTML;
    contactModalEl = $('#contact-modal-overlay');
  }
  function openContactModal() {
    if (!contactModalEl) return;
    contactModalEl.removeAttribute('hidden');
    void contactModalEl.offsetHeight;
    contactModalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeContactModal() {
    if (!contactModalEl) return;
    contactModalEl.classList.remove('open');
    setTimeout(() => contactModalEl.setAttribute('hidden', ''), 260);
    document.body.style.overflow = '';
    if (location.hash === '#contact') {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  function initContactModal() {
    if (!contactModalEl) return;
    contactModalEl.addEventListener('click', (e) => {
      if (e.target === contactModalEl || e.target.closest('[data-contact-modal-close]')) {
        closeContactModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && contactModalEl.classList.contains('open')) closeContactModal();
    });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href$="#contact"]');
      if (!a) return;
      e.preventDefault();
      openContactModal();
    });
    if (location.hash === '#contact') {
      setTimeout(openContactModal, 50);
    }
  }
  function openFormModal() {
    if (!formModalEl) return;
    formModalEl.removeAttribute('hidden');
    // Force a reflow so the browser computes display:flex before applying .open,
    // letting the CSS opacity/transform transition fire.
    void formModalEl.offsetHeight;
    formModalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    const firstField = formModalEl.querySelector('#f-message');
    if (firstField) setTimeout(() => firstField.focus(), 250);
  }
  function closeFormModal() {
    if (!formModalEl) return;
    formModalEl.classList.remove('open');
    setTimeout(() => formModalEl.setAttribute('hidden', ''), 260);
    document.body.style.overflow = '';
    // Strip #idea from URL without scroll-jump
    if (location.hash === '#idea') {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }
  function initFormModal() {
    if (!formModalEl) return;
    // X close button
    formModalEl.addEventListener('click', (e) => {
      if (e.target === formModalEl || e.target.closest('[data-form-modal-close]')) {
        closeFormModal();
      }
    });
    // Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && formModalEl.classList.contains('open')) closeFormModal();
    });
    // Intercept every CTA pointing at #idea (same-page or cross-page)
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href$="#idea"]');
      if (!a) return;
      // Always open the local modal instead of navigating/scrolling
      e.preventDefault();
      // Close any other open modal (e.g. location modal) first
      const otherModal = $('#location-modal');
      if (otherModal && otherModal.classList.contains('open')) {
        otherModal.classList.remove('open');
        setTimeout(() => otherModal.setAttribute('hidden', ''), 260);
      }
      openFormModal();
    });
    // Auto-open if landed with #idea hash
    if (location.hash === '#idea') {
      setTimeout(openFormModal, 50);
    }
  }

  /* ---------- Stats staircase reveal (sticky scroll, per-trigger) ---------- */
  function initStatsReveal() {
    const triggers = $$('.hero-stats-trigger');
    const stats = $$('[data-stat-index]');
    if (!stats.length) return;
    if (prefersReduce || !triggers.length) {
      stats.forEach(s => s.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = parseInt(e.target.dataset.trigger, 10);
          const stat = stats[idx];
          if (stat) stat.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    triggers.forEach(t => io.observe(t));
  }

  /* ---------- Boot ---------- */
  function boot() {
    mountFormModal();
    mountContactModal();
    initNav();
    initReveals();
    initCountUps();
    initStatsReveal();
    initForm();
    initFormModal();
    initContactModal();
    initLocationsList();
    initReviewsCarousel();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
