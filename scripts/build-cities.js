#!/usr/bin/env node
'use strict';
/* ================================================================
   Builds one static page per market from cities.json, plus the
   cities.html index, plus sitemap.xml.

   Run:  node scripts/build-cities.js
   Then commit the generated files. Nothing runs at request time,
   the site stays plain static nginx.

   NEVER hand-edit a generated page. This overwrites them.

   🔴 THERE IS NO live/coming-soon FORK IN HERE ANY MORE.
   It used to render a "Coming soon" pill, a pre-book form and a
   "first pick of locations when we go live" list for any market
   without screens installed. That told every venue owner who
   checked the site that they would be the first one in, which is
   the one thing that stops them signing. Every city now renders
   from the same template. The ONLY thing that varies is what we
   can honestly show for it, and that is driven by data, not by a
   status flag: `facts` renders only if it has entries, and
   `map.mode` is "pins" for a city whose screens are really in and
   "area" for one where they are not. Never add a pin or a count
   for a city that does not have them.
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

const arrow = '<svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" aria-hidden="true"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"/></svg>';

/* ---------- LocalBusiness schema, per city ----------------------
   areaServed is the honest way to describe a city we serve without
   claiming a street address we do not have there. The one real
   postal address goes only on the city carrying hasAddress. */
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
    // A territory is rarely one municipality. `alsoServes` in cities.json names the rest of it, and
    // it must stay identical to the service area set on the Google Business Profile: two different
    // answers to "where do you operate" is exactly what makes a listing look unverifiable.
    areaServed: [{ '@type': 'City', name: c.name, containedInPlace: { '@type': 'AdministrativeArea', name: c.province } },
      ...(c.alsoServes || []).map((n) => ({ '@type': 'AdministrativeArea', name: n, containedInPlace: { '@type': 'AdministrativeArea', name: c.province } }))],
    geo: { '@type': 'GeoCoordinates', latitude: c.lat, longitude: c.lng },
  };
  if (c.hasAddress) {
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

/* ---------- the map block, on EVERY city page -------------------
   Same section, same height, same furniture, either way. A market
   with its screens in gets the real pins and a link to the full
   searchable map. A market without them gets its coverage area.
   Neither page has a hole where the other has a map. */
function mapBlock(c) {
  const pins = (c.map || {}).mode === 'pins';
  const sub = pins
    ? `Every Reach Screens location in ${esc(c.name)}. Click any pin for the venue and its address.`
    : `Your ad runs across ${[c.name, ...(c.alsoServes || [])].map(esc).join(', ')}. We confirm the exact venues with you when you book, and you approve the list before anything goes up.`;

  const loader = pins
    ? `  var s=document.createElement('script');s.src='assets/screen-locations.js?v=${site.assetVersion}';document.head.appendChild(s);
  s.onload=function(){var m=document.createElement('script');m.src='map.js?v=66';document.head.appendChild(m);};`
    : `  var m=document.createElement('script');m.src='assets/rs-area-map.js?v=${site.assetVersion}';document.head.appendChild(m);
  m.onload=function(){window.rsAreaMapInit&&window.rsAreaMapInit();};`;

  const areaCfg = pins ? '' : `
<script>
  window.rsAreaMap = { places: ${JSON.stringify((c.coverage || []).filter((p) => p.lat && p.lng))} };
</script>`;

  return `
<!-- ============ MAP ============ -->
<section class="city-map-section" id="city-map" aria-labelledby="city-map-h">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">${pins ? 'Screen map' : 'Coverage'}</span>
      <h2 id="city-map-h">Where your ad plays in ${esc(c.name)}.</h2>
      <p>${sub}</p>
    </div>
    <div class="map-block city-map-block">
      <div id="map" class="map-canvas" role="region" aria-label="Map of Reach Screens coverage in ${esc(c.name)}"></div>
    </div>${pins ? `
    <div class="city-map-actions">
      <a href="screen-map.html" class="btn btn-outline">Open the full screen map ${arrow}</a>
    </div>` : ''}
  </div>
</section>${areaCfg}
<script>
(function(){
  var el=document.getElementById('map');if(!el)return;var done=false;
  function go(){if(done)return;done=true;
  var css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';document.head.appendChild(css);
  var gl=document.createElement('script');gl.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';document.head.appendChild(gl);
  gl.onload=function(){
${loader}
  };}
  if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){go();io.disconnect();}});},{rootMargin:'300px'});io.observe(el);}
  else{addEventListener('load',go);}
})();
</script>`;
}

/* ---------- one city page -------------------------------------- */
function cityPage(c) {
  const other = cities.filter((x) => x.slug !== c.slug);
  const venueList = c.venueTypes.map((v) => `        <li>${esc(v)}</li>`).join('\n');

  const facts = (c.facts && c.facts.length)
    ? `      <div class="city-facts">
${c.facts.map((f) => `        <div class="city-fact"><span class="city-fact-num">${esc(f.num)}</span><span class="city-fact-label">${esc(f.label)}</span></div>`).join('\n')}
      </div>`
    : '';

  const coverage = (c.coverage && c.coverage.length)
    ? `      <p class="city-coverage">${c.coverage.map((p) => esc(p.name)).join(' <span aria-hidden="true">&middot;</span> ')}</p>`
    : '';

  return P.head(site, {
    title: c.metaTitle, description: c.metaDescription, path: `${c.slug}.html`,
    ogTitle: `${c.name}: indoor screen advertising`,
    ogDescription: c.metaDescription, jsonLd: jsonLd(c),
  })
  + P.nav('cities')
  + `

<!-- ============ CITY HEADER ============ -->
<header class="city-header">
  <div class="container">
    <h1>${c.headline}</h1>
    <p class="city-intro">${esc(c.intro)}</p>
${coverage}
${facts}
      <div class="city-actions">
        <a href="#idea" class="btn btn-primary">Advertise in ${esc(c.name)} ${arrow}</a>
        <a href="#city-map" class="btn btn-outline">See where the screens are</a>
      </div>
  </div>
</header>
${mapBlock(c)}

<!-- ============ VENUE TYPES ============ -->
<section class="city-venues" aria-labelledby="venues-h">
  <div class="container">
    <div class="section-head center">
      <h2 id="venues-h">The kinds of places your ad runs.</h2>
    </div>
    <ul class="city-venue-list">
${venueList}
    </ul>
  </div>
</section>

<!-- ============ ENQUIRY ============ -->
<section class="markets-section" id="idea" aria-labelledby="city-form-h">
  <div class="container">
    <div class="prebook" id="prebook">
      <div class="prebook-copy">
        <h2 id="city-form-h" class="prebook-h">Get your ad on screen in ${esc(c.name)}.</h2>
        <p class="prebook-sub">Tell us what you want to promote. We design the ad for you, you approve it, and it goes up on the network.</p>
      </div>
      <div class="prebook-form-wrap">
${P.form(site, { id: 'city-form', source: `reachscreens.ca / ${c.slug}`, pkg: `${c.name} enquiry`, phonePlaceholder: '(587) 555-0123', messageLabel: `What would you like to advertise in ${c.name}?`, submitLabel: 'Advertise Now' })}
      </div>
    </div>
  </div>
</section>
${other.length ? `
<!-- ============ OTHER CITIES ============ -->
<section class="markets-section markets-section--tight" aria-labelledby="other-h">
  <div class="container">
    <div class="section-head center">
      <h2 id="other-h">Other cities</h2>
    </div>
    <div class="markets-grid">
${other.map((o) => marketCard(o, 'h3')).join('\n')}
    </div>
  </div>
</section>` : ''}
`
  + P.footer(site, cities)
  + P.scripts(site);
}

/* ---------- one card, used by both the index and "other cities" -
   No status pill, no accent variant, no "pre-book" verb. Two cities
   that look different on this grid are two cities the reader ranks. */
function marketCard(c, tag) {
  const region = [esc(c.province), ...(c.alsoServes || []).map(esc)].join(' &nbsp;&middot;&nbsp; ');
  return `      <article class="market-card">
        <${tag} class="market-name">${esc(c.name)}</${tag}>
        <p class="market-region">${region}</p>
        <a href="${c.slug}.html" class="market-link">Advertise in ${esc(c.name)} ${arrow}</a>
      </article>`;
}

/* ---------- the cities index ----------------------------------- */
function citiesIndex() {
  const names = cities.map((c) => c.name).join(', ');

  return P.head(site, {
    // Computed, not literal. A hand-written title here goes stale the moment a city is added to
    // cities.json, which is the one file that is supposed to be the single source of truth.
    title: `Cities: Where Reach Screens Operates | ${names}`,
    description: `Reach Screens runs indoor digital screen advertising in ${names}. Pick your city and tell us what you want to advertise.`,
    path: 'cities.html',
    ogTitle: 'Cities: Where Reach Screens Operates',
    ogDescription: `Indoor screen advertising in ${names}.`,
  })
  + P.nav('cities')
  + `

<!-- ============ HEADER ============ -->
<header class="locations-page-header">
  <div class="container">
    <span class="eyebrow">Coverage</span>
    <h1>Cities.</h1>
    <p class="hero-sub" style="margin-top:1rem; max-width:60ch;">
      Pick your city and tell us what you want to advertise.
    </p>
  </div>
</header>

<!-- ============ CITY CARDS ============ -->
<section class="markets-section markets-section--tight" aria-labelledby="cities-h">
  <div class="container">
    <h2 id="cities-h" class="sr-only">Every Reach Screens city</h2>
    <div class="markets-grid">
${cities.map((c) => marketCard(c, 'h2')).join('\n')}
    </div>
  </div>
</section>

<!-- ============ ENQUIRY ============ -->
<section class="markets-section" id="idea" aria-labelledby="cities-form-h">
  <div class="container">
    <div class="prebook" id="prebook">
      <div class="prebook-copy">
        <h2 id="cities-form-h" class="prebook-h">Ask about getting your ad live.</h2>
        <p class="prebook-sub">Tell us your city and what you want to promote. We design the ad for you, you approve it, and it goes up on the network.</p>
      </div>
      <div class="prebook-form-wrap">
${P.form(site, { id: 'cities-form', source: 'reachscreens.ca / cities', pkg: 'Cities enquiry', phonePlaceholder: '(587) 555-0123', messageLabel: 'Which city, and what would you like to advertise?', submitLabel: 'Advertise Now' })}
      </div>
    </div>
  </div>
</section>
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
      <image:title>Reach Screens, local digital advertising network</image:title>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>
`;
}

/* ---------- keep the hand-written pages' footer honest ----------
   index.html, screen-map.html and friends are NOT generated, but their footer
   lists the cities. Adding a market to cities.json used to leave them behind,
   so half the site advertised two cities and half advertised three. This
   rewrites just that one <ul> in place. Declaring the data file the source of
   truth is not the same as enforcing it. */
const STATIC_PAGES = ['index.html', 'screen-map.html'];
function syncStaticFooters() {
  const items = cities.map((c) => `          <li><a href="${c.slug}.html">${esc(c.name)}</a></li>`).join('\n');
  const re = /(<h([23]) class="footer-col-h">Cities<\/h\2>\s*\n\s*<ul>\n)([\s\S]*?)(\n\s*<\/ul>)/;
  STATIC_PAGES.forEach((f) => {
    const file = path.join(ROOT, f);
    const html = fs.readFileSync(file, 'utf8');
    if (!re.test(html)) throw new Error(`${f}: no footer Cities block found. The markup moved; fix this before shipping a half-updated footer.`);
    const out = html.replace(re, (_m, open2, _lvl, _body, close) => `${open2}${items}${close}`);
    if (out !== html) { fs.writeFileSync(file, out); written.push(`${f} (footer)`); }
  });
}

/* ---------- the guard --------------------------------------------
   The whole point of this rewrite is that no page tells a venue owner
   the market is not open yet. A stray phrase reintroduced by hand is
   invisible in review and obvious to a prospect, so the build refuses
   rather than trusting anyone to remember. */
const BANNED = [/coming soon/i, /pre-?book/i, /\blive now\b/i, /waiting list/i, /when we go live/i, /founding rate/i];
function assertNoStatusLanguage() {
  const files = [...cities.map((c) => `${c.slug}.html`), 'cities.html'];
  const hits = [];
  files.forEach((f) => {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    BANNED.forEach((re) => {
      // `id="prebook"` is the long-standing scroll anchor the CTAs point at, not copy.
      const m = html.replace(/id="prebook"|class="prebook[a-z-]*"|prebook-form/g, '').match(re);
      if (m) hits.push(`${f}: "${m[0]}"`);
    });
  });
  if (hits.length) throw new Error('Status language is back on a city page:\n  ' + hits.join('\n  '));
}

// ---------- run -------------------------------------------------
cities.forEach((c) => write(`${c.slug}.html`, cityPage(c)));
syncStaticFooters();
write('cities.html', citiesIndex());
write('sitemap.xml', sitemap());
assertNoStatusLanguage();
console.log('built:', written.join(', '));
