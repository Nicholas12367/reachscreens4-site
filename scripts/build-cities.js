#!/usr/bin/env node
'use strict';
/* ================================================================
   Builds one static page per market from cities.json, plus the
   cities.html index, plus sitemap.xml.

   Run:  node scripts/build-cities.js
   Then commit the generated files. Nothing runs at request time,
   the site stays plain static nginx.

   NEVER hand-edit a generated page. This overwrites them.
================================================================ */
const fs = require('fs');
const path = require('path');
const P = require('./partials.js');
const { esc } = P;

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'cities.json'), 'utf8'));
const site = data.site;
const cities = data.cities;
const written = [];

function write(file, html) {
  fs.writeFileSync(path.join(ROOT, file), html);
  written.push(file);
}

const isLive = (c) => c.status === 'live';
const statusLabel = (c) => (isLive(c) ? 'Live now' : 'Coming soon');
const statusClass = (c) => (isLive(c) ? 'live' : 'soon');

/* ---------- LocalBusiness schema, per city ----------------------
   areaServed is the honest way to describe a city we serve without
   claiming a street address we do not have there. The one real
   postal address stays on the Lloydminster page only. */
function jsonLd(c) {
  const base = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${site.brand} ${c.name}`,
    description: c.metaDescription,
    url: `${site.origin}/${c.slug}.html`,
    telephone: '+1-587-606-2556',
    email: site.email,
    image: `${site.origin}/assets/website-header.webp`,
    parentOrganization: { '@type': 'Organization', name: site.legalName },
    areaServed: { '@type': 'City', name: c.name, containedInPlace: { '@type': 'AdministrativeArea', name: c.province } },
    geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng },
  };
  if (isLive(c)) {
    base.address = {
      '@type': 'PostalAddress',
      streetAddress: '5018 50 Ave',
      addressLocality: 'Lloydminster',
      addressRegion: 'AB',
      postalCode: 'T9V 0W7',
      addressCountry: 'CA',
    };
  }
  return base;
}

/* ---------- one city page -------------------------------------- */
function cityPage(c) {
  const other = cities.filter((x) => x.slug !== c.slug);
  const venueList = c.venueTypes.map((v) => `        <li>${esc(v)}</li>`).join('\n');

  const facts = isLive(c)
    ? `      <div class="city-facts">
        <div class="city-fact"><span class="city-fact-num">${c.screens}</span><span class="city-fact-label">screens</span></div>
        <div class="city-fact"><span class="city-fact-num">${c.venues}</span><span class="city-fact-label">venues</span></div>
        <div class="city-fact"><span class="city-fact-num">${c.province.includes('&') ? '2' : '1'}</span><span class="city-fact-label">${c.province.includes('&') ? 'provinces' : 'province'}</span></div>
      </div>`
    : `      <div class="city-facts">
        <div class="city-fact"><span class="city-fact-num">Soon</span><span class="city-fact-label">venues signing now</span></div>
        <div class="city-fact"><span class="city-fact-num">Limited</span><span class="city-fact-label">launch slots</span></div>
        <div class="city-fact"><span class="city-fact-num">Founding</span><span class="city-fact-label">rate held</span></div>
      </div>`;

  const cta = isLive(c)
    ? `      <div class="city-actions">
        <a href="#idea" class="btn btn-primary">Advertise in ${esc(c.name)}
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>
        </a>
        <a href="screen-map.html" class="btn btn-outline">See every screen</a>
      </div>`
    : `      <div class="city-actions">
        <a href="#prebook" class="btn btn-primary">Pre-book your slot
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>
        </a>
      </div>`;

  const formBlock = isLive(c)
    ? `
<!-- ============ ENQUIRY ============ -->
<section class="markets-section" id="idea" aria-labelledby="city-form-h">
  <div class="container">
    <div class="prebook" id="prebook">
      <div class="prebook-copy">
        <h2 id="city-form-h" class="prebook-h">Get your ad on screen in ${esc(c.name)}.</h2>
        <p class="prebook-sub">Tell us what you want to promote. We design the ad for you and it goes up on the network.</p>
      </div>
      <div class="prebook-form-wrap">
${P.form(site, { id: 'city-form', source: `reachscreens.ca / ${c.slug}`, pkg: `${c.name} enquiry`, phonePlaceholder: '(587) 555-0123', messageLabel: `What would you like to advertise in ${c.name}?`, submitLabel: 'Advertise Now' })}
      </div>
    </div>
  </div>
</section>`
    : `
<!-- ============ PRE-BOOK ============ -->
<section class="markets-section" id="idea" aria-labelledby="city-form-h">
  <div class="container">
    <div class="prebook" id="prebook">
      <div class="prebook-copy">
        <h2 id="city-form-h" class="prebook-h">Pre-book your slot.</h2>
        <p class="prebook-sub">Get on the waiting list. Only a limited number of spots.</p>
        <ul class="prebook-points">
          <li><span class="prebook-tick" aria-hidden="true">&#10003;</span> First pick of locations when we go live</li>
          <li><span class="prebook-tick" aria-hidden="true">&#10003;</span> Founding rate, held for you</li>
          <li><span class="prebook-tick" aria-hidden="true">&#10003;</span> No payment now, no commitment</li>
        </ul>
      </div>
      <div class="prebook-form-wrap">
${P.form(site, { id: 'city-form', source: `reachscreens.ca / ${c.slug} pre-book`, pkg: `${c.name} pre-book`, phonePlaceholder: '(587) 555-0123', messageLabel: `What would you like to advertise in ${c.name}?`, submitLabel: 'Pre-book my slot' })}
      </div>
    </div>
  </div>
</section>`;

  const otherCities = other.length ? `
<!-- ============ OTHER CITIES ============ -->
<section class="markets-section markets-section--tight" aria-labelledby="other-h">
  <div class="container">
    <div class="section-head center">
      <h2 id="other-h">Other cities</h2>
    </div>
    <div class="markets-grid">
${other.map((o) => `      <article class="market-card is-${statusClass(o)}">
        <span class="market-status market-status--${statusClass(o)}"><span class="market-dot"></span>${statusLabel(o)}</span>
        <h3 class="market-name">${esc(o.name)}</h3>
        <p class="market-region">${esc(o.province)}${isLive(o) ? ` &nbsp;&middot;&nbsp; ${o.screens} screens in ${o.venues} venues` : ''}</p>
        <a href="${o.slug}.html" class="market-link${isLive(o) ? '' : ' market-link--accent'}">${isLive(o) ? `See ${esc(o.name)}` : `Pre-book ${esc(o.name)}`}
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>
        </a>
      </article>`).join('\n')}
    </div>
  </div>
</section>` : '';

  return P.head(site, {
    title: c.metaTitle, description: c.metaDescription, path: `${c.slug}.html`,
    ogTitle: `${c.name}: ${isLive(c) ? 'indoor screen advertising' : 'coming soon'}`,
    ogDescription: c.metaDescription, jsonLd: jsonLd(c),
  })
  + P.nav('cities')
  + `

<!-- ============ CITY HEADER ============ -->
<header class="city-header">
  <div class="container">
    <span class="market-status market-status--${statusClass(c)}"><span class="market-dot"></span>${statusLabel(c)}</span>
    <h1>${c.headline}</h1>
    <p class="city-intro">${esc(c.intro)}</p>
${facts}
${cta}
  </div>
</header>

<!-- ============ VENUE TYPES ============ -->
<section class="city-venues" aria-labelledby="venues-h">
  <div class="container">
    <div class="section-head center">
      <h2 id="venues-h">Where your ad ${isLive(c) ? 'plays' : 'will play'} in ${esc(c.name)}.</h2>
    </div>
    <ul class="city-venue-list">
${venueList}
    </ul>
  </div>
</section>
${formBlock}
${otherCities}
`
  + P.footer(site, cities)
  + P.scripts(site);
}

/* ---------- the cities index ----------------------------------- */
function citiesIndex() {
  const cards = cities.map((c) => `      <article class="market-card is-${statusClass(c)}">
        <span class="market-status market-status--${statusClass(c)}"><span class="market-dot"></span>${statusLabel(c)}</span>
        <h2 class="market-name">${esc(c.name)}</h2>
        <p class="market-region">${esc(c.province)}${isLive(c) ? ` &nbsp;&middot;&nbsp; ${c.screens} screens in ${c.venues} venues` : ''}</p>
        <a href="${c.slug}.html" class="market-link${isLive(c) ? '' : ' market-link--accent'}">${isLive(c) ? `See ${esc(c.name)}` : `Pre-book ${esc(c.name)}`}
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>
        </a>
      </article>`).join('\n');

  const soon = cities.filter((c) => !isLive(c));
  const first = soon[0];

  const prebook = first ? `
<!-- ============ PRE-BOOK ============ -->
<section class="markets-section" aria-labelledby="prebook-h">
  <div class="container">
    <div class="section-head center">
      <h2 id="prebook-h">${first.headline}</h2>
    </div>
    <div class="prebook" id="prebook">
      <div class="prebook-copy">
        <h3 class="prebook-h">Pre-book your slot.</h3>
        <p class="prebook-sub">Get on the waiting list. Only a limited number of spots.</p>
      </div>
      <div class="prebook-form-wrap">
${P.form(site, { id: 'prebook-form', source: `reachscreens.ca / ${first.slug} pre-book`, pkg: `${first.name} pre-book`, phonePlaceholder: '(587) 555-0123', messageLabel: 'What would you like to advertise?', submitLabel: 'Pre-book my slot' })}
      </div>
    </div>
  </div>
</section>` : '';

  const liveNames = cities.filter(isLive).map((c) => c.name).join(', ');
  const soonNames = soon.map((c) => c.name).join(', ');

  return P.head(site, {
    title: 'Cities: Where Reach Screens Operates | Lloydminster, Edmonton Coming Soon',
    description: `Reach Screens is live in ${liveNames}${soonNames ? `, with ${soonNames} coming soon` : ''}. See every city, or pre-book your advertising slot before we open.`,
    path: 'cities.html',
    ogTitle: 'Cities: Where Reach Screens Operates',
    ogDescription: `Live in ${liveNames}.${soonNames ? ` ${soonNames} coming soon. Pre-book your slot.` : ''}`,
  })
  + P.nav('cities')
  + `

<!-- ============ HEADER ============ -->
<header class="locations-page-header">
  <div class="container">
    <span class="eyebrow">Coverage</span>
    <h1>Cities.</h1>
    <p class="hero-sub" style="margin-top:1rem; max-width:60ch;">
      Where Reach Screens is live today, and where we open next.
    </p>
  </div>
</header>

<!-- ============ CITY CARDS ============ -->
<section class="markets-section markets-section--tight" aria-labelledby="cities-h">
  <div class="container">
    <h2 id="cities-h" class="sr-only">Every Reach Screens city</h2>
    <div class="markets-grid">
${cards}
    </div>
  </div>
</section>
${prebook}
`
  + P.footer(site, cities)
  + P.scripts(site);
}

/* ---------- sitemap -------------------------------------------- */
function sitemap() {
  const today = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', pri: '1.0', freq: 'weekly', img: true },
    { loc: '/cities.html', pri: '0.9', freq: 'weekly' },
    ...cities.map((c) => ({ loc: `/${c.slug}.html`, pri: '0.9', freq: 'weekly' })),
    { loc: '/screen-map.html', pri: '0.8', freq: 'weekly' },
    { loc: '/company.html', pri: '0.3', freq: 'yearly' },
    { loc: '/privacy.html', pri: '0.2', freq: 'yearly' },
    { loc: '/terms.html', pri: '0.2', freq: 'yearly' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url>
    <loc>${site.origin}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.pri}</priority>${u.img ? `
    <image:image>
      <image:loc>${site.origin}/assets/website-header.webp</image:loc>
      <image:title>Reach Screens, Lloydminster's local digital advertising network</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;
}

// ---------- run -------------------------------------------------
cities.forEach((c) => write(`${c.slug}.html`, cityPage(c)));
write('cities.html', citiesIndex());
write('sitemap.xml', sitemap());
console.log('built:', written.join(', '));
