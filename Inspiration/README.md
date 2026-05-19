# Inspiration — Pattison Outdoor Site Scrape

Full reference material captured from **https://www.pattisonoutdoor.com/en** for the Reach Screens rebuild.

**Captured:** 2026-05-14
**Total size:** ~370 MB

---

## Start here

| File | What it is |
|---|---|
| **[`design-spec.md`](design-spec.md)** | **The master doc.** Color palette, type scale, components, layout, motion — synthesized into "build like this" instructions. Read this first. |
| **[`interactions-and-effects.md`](interactions-and-effects.md)** | Every graphic effect, hover state, scroll behavior, parallax mechanism — with the actual CSS/HTML to replicate them. |
| **[`effects-catalog.json`](effects-catalog.json)** | Raw machine-readable: all 14 `@keyframes`, all breakpoints, signature easing curves, font-face declarations. |

---

## Folder layout

```
Inspiration/
├── README.md                       ← you are here
├── design-spec.md                  ← MASTER: how to build it
├── interactions-and-effects.md     ← every effect explained + code
├── effects-catalog.json            ← raw @keyframes / breakpoints / fonts
│
├── screenshots/
│   ├── desktop-1920/
│   │   ├── home-viewport.png       ← hero-only PNG
│   │   └── home-fullpage.pdf       ← entire 12,094px page as PDF (52MB)
│   ├── tablet-1024/
│   │   ├── home-viewport.png
│   │   └── home-fullpage.pdf
│   └── mobile-375/
│       ├── home-viewport.png
│       └── home-fullpage.pdf
│
└── raw-mirror/
    ├── html/                       ← homepage + 25 internal pages
    ├── css/                        ← 3 stylesheets (Tailwind compiled, 1453 rules)
    ├── js/                         ← 6 Next.js bundles (where the scroll/parallax JS lives)
    ├── fonts/                      ← 7 Inter woff2 subsets + revicons.woff
    ├── icons/                      ← FB / IG / LI SVGs
    └── images-storyblok/           ← 166 brand & ad photography images (247MB)
```

---

## What was captured

✅ **Full HTML** for homepage + 25 internal pages (products, services, markets, company)
✅ **Every CSS rule** (1,453 total) including all `@keyframes`, `@media` queries, `@font-face`
✅ **All JavaScript bundles** (where scroll-linked parallax, count-up, nav-hide logic lives)
✅ **Every brand logo and ad photograph** (Storyblok CDN, 166 files)
✅ **Every font file** (Inter at 4/5/7 weights, plus carousel icon font)
✅ **Screenshots at 3 breakpoints** (desktop 1920 / tablet 1024 / mobile 375) — viewport PNGs + full-page PDFs
✅ **Computed design tokens** sampled from the live DOM (colors, type sizes, spacing, transitions)
✅ **Hover / scroll / interaction effects** documented with replication code
✅ **Animated keyframes** (14): spin, enter, exit, enterFromRight/Left, scaleIn/Out, fadeIn/Out, contentShow, …
✅ **The signature easing curve:** `cubic-bezier(0.62, 0.16, 0.13, 1.01)`

---

## Tech stack identified

- **Framework:** Next.js 14 (App Router) — note Pattison’s `_next/static/chunks` bundle structure
- **Styling:** Tailwind CSS (compiled, ~1000 utility rules + custom theme)
- **CMS:** Storyblok (image CDN at `a-us.storyblok.com`)
- **Component primitives:** Radix UI (the `enterFromRight`/`scaleIn` keyframes are Radix defaults)
- **Carousel:** react-multi-carousel
- **Fonts:** Inter via `next/font` (self-hosted woff2, unicode-range subset for perf)
- **Analytics:** Google Tag Manager (`GTM-TLK3T3R`)

---

## Brand colors

| Pattison name | Hex |
|---|---|
| primary blue | **#0079C1** |
| navy | **#00285E** |
| mint / accent | **#50C1CB** |
| black (footer) | **#000000** |

---

## How to use this for the Reach Screens rebuild

1. Read **[`design-spec.md`](design-spec.md)** end-to-end.
2. Skim **[`interactions-and-effects.md`](interactions-and-effects.md)** for the effects you want to replicate.
3. Open `screenshots/desktop-1920/home-fullpage.pdf` to study the full visual flow on a big screen.
4. When implementing a specific component, search `raw-mirror/css/6f3758f37a81c7cb.css` for the relevant Tailwind class.
5. For inspiration photography — most Storyblok images are Pattison's proprietary work. Use them as **layout/composition reference**, not as final assets.
6. Reach Screens substitutions to make:
   - Swap **#0079C1** for the Reach brand color
   - Replace brand-logo wall with Reach's actual clients
   - Cities = wherever Reach has screens (Lloydminster etc.) instead of provinces
   - Simpler nav — Pattison's 5-level mega-menu is overkill at Reach's scale

---

## Companion automation

The downloaded JS bundles contain the real implementations of:
- The scroll-linked parallax variable (`--scrolledY` setter)
- The count-up stat animation (IntersectionObserver + RAF)
- The nav scroll-hide logic (`--scrolledUp` flag)

To dig in: `grep -l "scrolledUp\|scrolledY\|IntersectionObserver" raw-mirror/js/*.js`
