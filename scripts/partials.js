'use strict';
/* Shared chrome. Every generated page gets the same head boilerplate, nav and
   footer from here, so a change lands on all of them at once. */

const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function head(site, o) {
  const v = site.assetVersion;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(o.title)}</title>
  <meta name="description" content="${esc(o.description)}">
  <link rel="canonical" href="${site.origin}/${o.path}">
  <meta name="theme-color" content="#051018">
  <meta name="robots" content="index, follow, max-image-preview:large">

  <meta property="og:title" content="${esc(o.ogTitle || o.title)}">
  <meta property="og:description" content="${esc(o.ogDescription || o.description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${site.origin}/${o.path}">
  <meta property="og:image" content="${site.origin}/assets/website-header.webp">

  <link rel="preload" as="image" href="assets/logo-white.webp">
  <link rel="stylesheet" href="styles.css?v=${v}">
  <!-- Font preload sits after the stylesheet on purpose. styles.css is
       render blocking, so it has to win the connection first. -->
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/inter-300-700-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/manrope-500-800-latin.woff2" crossorigin>
  <!-- Decorative faces load after the page does, so their bytes never compete
       with the hero font on the first connection. -->
  <script>addEventListener("load",function(){var l=document.createElement("link");l.rel="stylesheet";l.href="fonts-deferred.css?v=1";document.head.appendChild(l)});</script>
  <noscript><link rel="stylesheet" href="fonts-deferred.css?v=1"></noscript>
  <link rel="icon" href="assets/favicon.ico">
${o.jsonLd ? '  <script type="application/ld+json">\n' + JSON.stringify(o.jsonLd, null, 2).split('\n').map(l => '  ' + l).join('\n') + '\n  </script>\n' : ''}</head>
<body class="page-light-header">`;
}

function nav(active) {
  const on = (k) => (active === k ? ' class="active"' : '');
  return `
<!-- ============ NAV ============ -->
<nav class="nav" aria-label="Main">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo" aria-label="Reach Screens home">
      <img src="assets/logo-white.webp" alt="Reach Screens" width="200" height="67">
    </a>
    <ul class="nav-links">
      <li><a href="index.html"${on('home')}>Home</a></li>
      <li><a href="cities.html"${on('cities')}>Cities</a></li>
      <li><a href="screen-map.html"${on('map')}>Screen Map</a></li>
      <li><a href="#idea" class="nav-cta">Advertise Now</a></li>
      <li><a href="#contact" class="nav-contact">Contact Us</a></li>
    </ul>
    <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>`;
}

function footer(site, cities) {
  const coverage = cities.map((c) => c.status === 'live'
    ? `          <li><a href="${c.slug}.html">${esc(c.name)}</a></li>`
    : `          <li><a href="${c.slug}.html" style="color:var(--rs-mint);">${esc(c.name)} &mdash; coming soon</a></li>`
  ).join('\n');
  return `
<!-- ============ FOOTER ============ -->
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="assets/logo-white.webp" alt="Reach Screens" width="200" height="67">
        <p>Indoor digital advertising across Lloydminster. We put your ad where attention already lives.</p>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-h">Site</h2>
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="cities.html">Cities</a></li>
          <li><a href="screen-map.html">Screen Map</a></li>
          <li><a href="#idea">Advertise Now</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-h">Contact</h2>
        <ul>
          <li><a href="mailto:${site.email}">${site.email}</a></li>
          <li><a href="tel:${site.phoneHref}">${site.phoneDisplay}</a></li>
          <li><span style="color:var(--rs-text-mid);">Lloydminster, AB</span></li>
        </ul>
      </div>
      <div class="footer-col">
        <h2 class="footer-col-h">Cities</h2>
        <ul>
${coverage}
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span id="year">2026</span> Reach Screens. All rights reserved.</p>
      <div class="footer-social" aria-label="Social links">
        <a href="https://m.facebook.com/profile.php?id=61585947433036&amp;name=xhp_nt__fb__action__open_user" aria-label="Facebook" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.5-4.5-10-10-10S2 6.5 2 12c0 5 3.7 9.1 8.4 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7c4.7-.8 8.4-4.9 8.4-9.9z"/></svg>
        </a>
        <a href="https://www.instagram.com/reachscreens.ca/" aria-label="Instagram" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.2" fill="currentColor"/></svg>
        </a>
      </div>
      <div class="footer-legal" style="grid-column:1/-1;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,.08);color:var(--rs-text-mid,#8b9aa6);font-size:.85rem;line-height:1.6;">
        Reach Screens is a trading name of <strong>${site.legalName}</strong>, an Alberta corporation.<br>
        5018 50 Ave, Lloydminster, Alberta, T9V 0W7, Canada &nbsp;&middot;&nbsp;
        <a href="mailto:${site.email}" style="color:inherit;">${site.email}</a> &nbsp;&middot;&nbsp;
        <a href="tel:${site.phoneHref}" style="color:inherit;">${site.phoneDisplay}</a> &nbsp;&middot;&nbsp;
        <a href="/company.html" style="color:inherit;">Company information</a> &nbsp;&middot;&nbsp;
        <a href="/sms-optin.html" style="color:inherit;">Text message sign-up</a><br>
        <a href="/privacy.html" style="color:inherit;">Privacy Policy</a> &nbsp;&middot;&nbsp; <a href="/terms.html" style="color:inherit;">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>`;
}

function scripts(site) {
  const v = site.assetVersion;
  return `
<!-- ============ SCRIPTS ============ -->
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
<script defer src="main.js?v=67"></script>
<script defer src="assets/rs-attribution.js?v=68"></script>
<script defer src="assets/rs-defer.js?v=1"></script>
<script defer src="assets/rs-analytics.js?v=${v}"></script>
<script defer src="assets/analytics.js?v=${v}"></script>
<script defer src="assets/clarity.js?v=${v}"></script>

<!-- Form modal + Contact modal mounts (built by main.js on load) -->
<div id="form-modal-mount"></div>
<div id="contact-modal-mount"></div>

<!-- Floating tap-to-call button -->
<a href="tel:${site.phoneHref}" class="floating-call" aria-label="Call Reach Screens">
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
  </svg>
  <span class="floating-call-label">Call us</span>
</a>
</body>
</html>`;
}

/* The pre-book / enquiry form. `pkg` becomes the `package` field, which is the
   ONE field forms-api actually stores and reach-admin's importer reads as the
   Website source detail. `source` is sent too but the API silently drops it. */
function form(site, o) {
  const id = o.id;
  return `        <div class="form-card">
          <form id="${id}" class="idea-form-instance"
                data-endpoint="${site.formEndpoint}"
                data-form-source="${esc(o.source)}"
                data-form-package="${esc(o.pkg)}">
            <input type="text" name="_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;">
            <div class="form-row two">
              <div class="form-field">
                <label for="${id}-name">Your name</label>
                <input id="${id}-name" name="name" type="text" required autocomplete="name" placeholder="First &amp; last name">
              </div>
              <div class="form-field">
                <label for="${id}-business">Business name</label>
                <input id="${id}-business" name="business" type="text" required autocomplete="organization" placeholder="Company name">
              </div>
            </div>
            <div class="form-row two">
              <div class="form-field">
                <label for="${id}-email">Email</label>
                <input id="${id}-email" name="email" type="email" required autocomplete="email" placeholder="you@business.com">
              </div>
              <div class="form-field">
                <label for="${id}-phone">Phone number</label>
                <input id="${id}-phone" name="phone" type="tel" required autocomplete="tel" placeholder="${esc(o.phonePlaceholder)}">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label for="${id}-message">${esc(o.messageLabel)}</label>
                <textarea id="${id}-message" name="message" required placeholder="Tell us a bit about your business and what you'd like to promote."></textarea>
              </div>
            </div>
            <button type="submit" class="form-submit">${esc(o.submitLabel)}
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>
            </button>
            <div class="form-feedback" data-form-feedback></div>
          </form>
        </div>`;
}

module.exports = { esc, head, nav, footer, scripts, form };
