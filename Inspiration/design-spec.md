# Pattison Outdoor — Design Spec for Reach Screens Rebuild

**Source:** `https://www.pattisonoutdoor.com/en` — captured 2026-05-14
**Stack observed:** Next.js 14 (App Router) + Tailwind CSS + Storyblok CMS

This document is the **synthesis** — what to actually build. Companion files:
- `effects-catalog.json` — raw CSS animations, keyframes, breakpoints
- `interactions-and-effects.md` — hover/scroll/parallax effect mechanics
- `raw-mirror/` — full HTML, CSS, JS, fonts, 166 images
- `screenshots/` — viewport PNGs + full-page PDFs at 3 breakpoints

---

## 1. The Aesthetic — One Sentence

**Confident, premium, kinetic.** Big sparse type. Deep navy meets metallic-blue gradients. Decisive whitespace. Motion that's quiet but never absent. Looks like an OOH ad agency that owns the streets.

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `theme-primary` | **#0079C1** | Primary blue — buttons, links, accents |
| `theme-navy` | **#00285E** | Dark navy — hero gradient, stats section, deep backgrounds |
| `theme-mint` | **#50C1CB** | Mint/cyan — hover underlines, the teal quadrant card |
| `theme-mid-grey` | gray-600/700 | Default nav link color |
| `theme-dark` | **#000000** | Footer, service card backgrounds |
| `white` | **#FFFFFF** | Body text on dark, card backgrounds |
| `gray-800` | **#1F2937** | Body copy on light backgrounds |
| `gray-200` | **#E5E7EB** | Subtle dividers |

**Signature gradient:**
```css
/* The "blue glow" hero backdrop */
background: radial-gradient(50% 50%, rgba(0,40,94,0.5) 52.5%, rgba(0,40,94,0) 100%);
/* Combined with a downward fade-to-navy */
background: linear-gradient(180deg, #00285E00 0%, #00285E 95%);
```

**Reach Screens recommendation:** swap `theme-primary` for the Reach Screens brand color (likely orange/red?). Keep the navy-and-mint accent system — it's what gives Pattison its premium feel.

---

## 3. Typography

### Font stack
- **Headings:** `font-heading` — a custom display font (Effra in computed styles)
- **Body:** `effra, ui-sans-serif, system-ui, sans-serif`
- **Inter** is loaded (5 woff2 weights subset by unicode-range) but Effra wins the cascade — Effra is likely loaded by the CMS/branding layer

### Type scale (responsive)

| Element | Mobile | Tablet | Desktop | Weight | Tracking |
|---|---|---|---|---|---|
| h1 (hero stat or banner) | 3xl / 30px | 4xl / 36px → 5xl / 48px | 6xl / 60px | **200** (ultralight) | normal |
| h2 (massive section heading) | 4xl / 36px | 5xl / 48px → 6xl / 60px | 7xl / 72px → 8xl / 96px | **300** (light) | normal |
| h3 (subsection) | xl / 20px | 2xl / 24px → 3xl / 30px | 4xl / 36px | **300** | normal |
| Body | 16px | 16px | 16px | 400 | normal |
| Eyebrow label | xs / 12px | 12px | 12px | 400 | **uppercase, wide** |

**Line-height for headings: `1.0` (`/none`).** This is what gives the hero its tight, billboard-like presence. Body line-height: 1.5 (24px on 16px).

**French (`language-fr:`) variant:** sizes scale one step down — accommodates longer French text. Worth replicating if you bilingual-ize.

### The hero treatment
```html
<h1 class="font-heading text-3xl/none sm:text-4xl/none md:text-5xl/none lg:text-6xl/none
           text-white uppercase">
  Innovative, Impactful,<br/>
  Everywhere<br/>
  <span class="block text-6xl/none lg:text-8xl/none">We Are<br/>Out-of-Home</span>
</h1>
```

The "WE ARE OUT-OF-HOME" line is the second h1 paragraph, bigger and bolder. Uppercase. White on navy gradient. **This is the move.**

---

## 4. Layout & Spacing

- **Max container:** `max-w-8xl` (~1536px) — content never spans full 1920
- **Gutters:** `px-4` mobile, `sm:px-8`, `md:px-12` — generous on desktop
- **Section vertical rhythm:** `pt-32 md:pt-40 lg:pt-48` for hero (huge top padding). Standard sections use `py-16` to `py-24`.
- **Grid:** 12-column on lg+ (`lg:grid lg:grid-cols-12`). Most content sits on 6-col left, 4-col right with offset.

### Breakpoints (Tailwind defaults + custom)
- `sm` 640px
- `md` 768px
- `lg` 1024px
- `xl` 1280px
- `2xl` 1536px
- **custom `3xl` 1920px** — for ultra-wide
- **custom `4xl` 2560px** — for 4K

---

## 5. Components

### 5.1 Pill Buttons
```html
<!-- Solid (Contact Sales) -->
<a class="bg-theme-primary text-white rounded-full px-6 py-2 font-medium
          transition duration-500 hover:duration-75 hover:bg-theme-primary/90">
  Contact Sales
</a>

<!-- Outlined (Explore All Products) -->
<a class="border-2 border-theme-primary text-theme-primary rounded-full px-6 py-2
          transition duration-500 hover:duration-75 hover:bg-theme-primary hover:text-white">
  Explore All Products
</a>

<!-- Inline arrow link -->
<a class="text-theme-primary font-medium inline-flex items-center gap-2">
  See our extensive airport portfolio
  <span class="arrow">→</span>
</a>
```

**Border-radius: 9999px** (full pill). **Asymmetric duration: 500ms out / 75ms in** — the signature snap.

### 5.2 Service Card (2×2 quadrant grid)
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-0">
  <a class="bg-theme-primary p-12 lg:p-16 text-white group
            duration-500 hover:border-b-[5px] border-theme-mint relative h-[400px]">
    <h3 class="font-heading text-5xl/none mb-6">Campaign Planning</h3>
    <p class="text-lg max-w-sm">We assist with campaign planning, ensuring your OOH strategy is aligned with your objectives.</p>
    <span class="absolute bottom-8 right-8 inline-flex items-center gap-2">
      View planning details →
    </span>
  </a>
  <a class="bg-theme-navy …">Client Support</a>
  <a class="bg-theme-mint …">Data & Analytics</a>
  <a class="bg-theme-navy …">Design & Production</a>
</div>
```

Pattern: **4 large colored cards, no rounded corners, no gaps**. White heading + white body + corner CTA link. Mint underline appears on hover.

### 5.3 Animated Stat Counter
```html
<div class="flex flex-col">
  <span class="uppercase text-xs tracking-wider text-white/70">Advertising Displays</span>
  <span class="font-heading text-7xl text-theme-primary" data-target="30">30K+</span>
  <p class="text-white/80 mt-4 max-w-xs">With coverage across the country, you can reach your audience wherever they are.</p>
</div>
```

JS: IntersectionObserver triggers a count-up from 0 to target when scrolled into view. 1–1.5s duration, easeOut.

### 5.4 Brand Logo Wall
5×3 grid of grayscale/black brand logos on white background. Equal padding. No hover effect on the wall itself.

Pattison's brands: McDonald's, IKEA, DQ, Nike, Netflix, Kraft Heinz, adidas, BMO, Apple, Mercedes, Air Canada, Kia, Audi, Coca-Cola, Paramount.
**Reach Screens equivalent:** logos of Reach's clients (downtown businesses, local restaurants, etc.).

### 5.5 Testimonial / Press Carousel
- Library: **react-multi-carousel**
- Layout: large image left (~5 cols), text right (~4 cols)
- Quote in body weight, bold key phrase pulled out
- Attribution: Name (regular), TITLE (uppercase eyebrow, tracking-wider)
- Arrow buttons: bottom-left, simple SVG triangles in 32×32 grey boxes

### 5.6 Press Card (horizontal scroll)
```html
<article class="min-w-[320px] bg-white">
  <img src="..." class="aspect-[4/3] object-cover">
  <div class="p-6">
    <span class="text-xs uppercase tracking-wider text-theme-primary mb-2">Press Release</span>
    <h4 class="font-heading text-2xl mb-4 line-clamp-3">…</h4>
    <a class="text-theme-primary inline-flex items-center gap-2">Read More →</a>
  </div>
</article>
```

Arrow buttons: circular, outlined in theme-primary, positioned outside the carousel edges.

### 5.7 Header / Nav
```html
<header class="fixed top-0 z-[1500] w-full transition-transform duration-300
               md:translate-y-[calc(var(--scrolledUp)*-100%)]">
  <nav class="flex items-center justify-between px-8 py-4 bg-transparent backdrop-blur-sm">
    <a class="logo-pattison-pill"><svg>PATTISON</svg></a>
    <ul class="hidden lg:flex gap-8">
      <li><button class="text-white duration-500 hover:duration-75 hover:text-theme-primary">Products</button></li>
      …
    </ul>
    <div class="flex items-center gap-4">
      <a class="lang-toggle">EN</a>
      <button class="lg:hidden">Menu</button>
    </div>
  </nav>
</header>
```

- **Pill-shaped logo** (Pattison brandmark is enclosed in an oval/pill outline — distinctive)
- Transparent over hero, becomes opaque on scroll
- Hides on scroll-down, reveals on scroll-up (via `--scrolledUp` CSS var)

### 5.8 Footer
- **Background: pure black** (`#000`)
- 5 columns: Products / Markets / Services / Company / Quicklinks
- Pattison pill logo bottom-left, social icons (FB/IG/LI) centered, copyright below
- Subtle decorative navy curves bottom-right (SVG)
- Column headings in mint/teal, links in white

---

## 6. Motion & Effects

| Effect | Where | How |
|---|---|---|
| **Parallax hero** | Hero radial-glow layer | Fixed-position element + scroll-linked `translateY` via CSS var `--scrolledY` |
| **Nav scroll-hide** | Header | `translate-y-[calc(var(--scrolledUp)*-100%)]` flipped 0/1 by JS |
| **Snap hover** | Nav links, buttons | `duration-500 hover:duration-75` |
| **Mint underline** | Service cards | `hover:border-b-[5px] border-theme-mint` |
| **Count-up stats** | Stats section | IntersectionObserver + RAF |
| **Carousel transitions** | Testimonials, press | react-multi-carousel built-in |
| **Modal/dropdown entrances** | (Radix UI) | Named keyframes: enterFromRight, scaleIn, fadeIn — easing `cubic-bezier(0.62, 0.16, 0.13, 1.01)` |

**Animation durations seen:** 75ms (snap) / 150ms / 200ms / 250ms / 300ms / 500ms / 700ms / 1000ms / 1500ms.

**Signature easing:** `cubic-bezier(0.62, 0.16, 0.13, 1.01)` — for premium content reveals. Use this on hero text reveal, modal entrance, etc.

**Respect** `@media (prefers-reduced-motion: reduce)`.

---

## 7. Page Inventory (26 internal pages crawled)

```
products
  ├── airports
  ├── transit
  ├── digital
  ├── classic
  └── place-based
services
  ├── programmatic
  ├── customer-support
  ├── analytics
  └── creative-services
markets
  ├── alberta
  ├── atlantic
  ├── britishcolumbia
  ├── manitoba
  ├── ontario
  ├── quebec
  └── saskatchewan
company
  ├── about-us
  ├── advertise-with-us
  ├── careers
  ├── contact
  ├── lease-to-us
  ├── web-mapping
  └── advertising-content-guidelines
news-press
insights
```

**Reach Screens parallel structure:**
```
products       → screens (indoor TV display, lobby screen, etc.)
markets        → cities/neighborhoods (Lloydminster, etc.)
services       → ad-creation, analytics, install, support
company        → about / contact / lease-your-space
case-studies   → client wins
```

---

## 8. Content Tone

Pattison's voice (from copy):
- **Confident, declarative.** "We are OOH." "Canada's largest OOH advertising company."
- **Quantified.** "30K+ displays. 25+ communities. 1000+ employees."
- **Outcome-focused.** "Capture audiences on the move." "High-frequency, strategic locations."
- Section headings are **noun phrases** ("Outdoor advertising", "Service & Support", "Brands", "What's New") — not actions, not questions.

**Reach Screens voice:** lean into the same confidence. "We own the screens in your city." "Reach where your customers actually are." Numbers matter — total screen count, total impressions/month, partner businesses.

---

## 9. Assets Inventory

- **166 Storyblok images** (247MB) — billboard/airport/transit photography in `raw-mirror/images-storyblok/`
  - Many usable as inspiration only (Pattison's proprietary photography)
  - Several generic ad mockups (3D billboards, transit shelter examples) — useful templates
- **8 woff2 fonts** — Inter subset bundle (don't redistribute, but reference the loading strategy)
- **revicons.woff** — carousel arrow font (can use SVG icons instead)
- **3 SVG icons** — Facebook, Instagram, LinkedIn (replace with Reach Screens socials)

---

## 10. Implementation Recommendations

### What to copy literally
- The hero formula: massive uppercase headline + radial navy glow + parallax + diagonal-light feeling
- 2×2 colored service card grid
- Animated stat counters
- Pill buttons with snap-hover
- Black footer with subtle decorative curves
- Mint underline on card hover
- Asymmetric hover duration

### What to adapt
- Color palette: swap Pattison's primary blue for Reach Screens' brand color, keep the navy+mint accent system
- Type: if Reach has a brand display font, use it instead of Effra; otherwise use **Bricolage Grotesque** or **Inter Display** for a similar premium feel
- Content: Reach Screens has fewer cities/products than Pattison — so simpler nav. Skip the 5-col mega-footer; 3 cols is enough.

### What to skip
- Storyblok CMS (overkill for Reach Screens unless they need editor-friendly content)
- react-multi-carousel (use Embla Carousel — better, lighter, modern API)
- 7 JS bundles (Pattison's polyfills are bloated; modern Next.js needs fewer)

### Recommended Reach Screens stack
- **Next.js 16** (App Router, Server Components by default)
- **Tailwind CSS v4** (latest, with CSS-first config)
- **Embla Carousel** for press/testimonial sliders
- **Framer Motion** for the parallax hero (cleaner than rolling your own)
- **Sanity** or **Payload** if you want CMS, or just hardcoded MDX
- Deploy on **Vercel** or your existing Coolify/Hetzner setup
