# Pattison Outdoor — Interactions & Effects Catalog

Source: `https://www.pattisonoutdoor.com/en` — captured 2026-05-14

---

## 1. Signature Hero Effect — Parallax + Radial Glow

The hero is a **fixed-position layer** with a scroll-linked `translateY` that creates the parallax. CSS variable `--scrolledUp` (toggled by JS) controls nav-hide on scroll-down.

**Stack of layered elements:**
```
<div class="fixed top-0 w-screen h-screen pointer-events-none z-[-2]"></div>   ← pinned canvas
<div class="absolute inset-0 overflow-hidden z-[-10]
            translate-y-[calc((var(--scrolledY))px)]">                          ← parallax content (transform: matrix(1,0,0,1,0, [scroll-driven Y]))
  <div class="w-[3297px] h-[3297px] absolute top-0 left-0
              -translate-x-1/2 -translate-y-1/2
              bg-[radial-gradient(50%_50%,rgba(0,40,94,0.5)_52.5%,rgba(0,40,94,0)_100%)]">
  </div>                                                                        ← navy "spotlight" glow
  <div class="absolute bottom-0 w-full h-[50%] z-[-1]
              bg-[linear-gradient(180deg,#00285E00_0%,#00285E_95%)]"></div>    ← bottom fade to navy
</div>
```

**Key takeaway:** The blue/chrome diagonal split visible on the hero is **not** clip-path or SVG — it's a 3297×3297px radial gradient absolutely-positioned, centered, with a downward linear gradient fading to solid navy at the bottom. Cheap, performant, gorgeous.

---

## 2. Nav Scroll-Hide

```
header.fixed.top-0.z-[1500].w-full.transition-transform.duration-300
       .md:translate-y-[calc(var(--scrolledUp)*-100%)]
```

A CSS variable `--scrolledUp` is set to `0` or `1` by JS based on scroll direction. When scrolling **down**, `--scrolledUp = 1` → nav translates up `-100%` (hides). When scrolling **up**, → `0` → nav slides back. 300ms transition.

**Reach Screens build:** trivial to replicate. Set up a scroll listener that flips a body data-attr or CSS var.

---

## 3. Hover Transitions — The Tailwind Default + One Custom Twist

99% of hover transitions use the Tailwind default:
```css
transition: color 0.5s cubic-bezier(0.4, 0, 0.2, 1),
            background-color 0.5s cubic-bezier(0.4, 0, 0.2, 1),
            border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1),
            … box-shadow, transform, filter …;
```

**Custom twist on nav buttons:** asymmetric hover duration
```
duration-500 ease-in-out hover:duration-75
```
- Mouse-out: slow 500ms fade back to grey
- Mouse-in: snappy 75ms snap to the primary color
- Result: "it feels confident, decisive, but also smooth" — high-end interaction design

---

## 4. Service Card Hover — Sliding Mint Underline

```html
<a class="bg-black group duration-500
          hover:border-b-[5px] border-theme-mint">
```

On hover, a 5px mint-cyan underline appears below the card. The card uses `group` so child elements can react to the parent hover via `group-hover:`.

Mint color: `rgb(80, 193, 203)` → **#50C1CB**

---

## 5. CTA Pill Buttons

```html
<!-- Outlined primary -->
<a class="border-2 rounded-full border-theme-primary text-theme-primary
          stroke-theme-primary p-4 cursor-pointer">

<!-- Solid primary (Contact Sales) -->
<a class="bg-theme-primary text-white rounded-full px-6 py-2">
```

- Border radius: **9999px** (true pill)
- Primary blue: `rgb(0, 121, 193)` → **#0079C1**
- Arrow icons use `stroke-theme-primary` (matched stroke color)

---

## 6. Section-Reveal Animations

The page does **NOT** use AOS or Framer Motion. Reveals are minimal — only 4 elements have inline transforms. Most "appearance" is just the parallax effect creating perceived motion.

**This is intentional and elegant.** Quiet on entry, motion only where it matters. Worth replicating instead of bolting AOS onto every scroll target.

---

## 7. Animated Number Counters (Stats Section)

Caught mid-animation: stats counted from `0K+` to `30K+`. Implementation is a scroll-triggered count-up (probably IntersectionObserver + requestAnimationFrame). Numbers in `font-heading` at huge sizes (text-7xl/text-8xl in the home: container).

**Stats observed:**
- 30K+ ADVERTISING DISPLAYS
- 25+ CITIES AND COMMUNITIES
- (one more) PASSIONATE EMPLOYEES

---

## 8. Carousels — react-multi-carousel + revicons font

Two carousels confirmed:
- **Testimonials** (Local Clients Say) — image left, quote+attribution right, arrow buttons bottom-left
- **What's New** (Press Releases) — horizontal card scroll with circular outlined arrow buttons

Library: `react-multi-carousel` (CSS file `5c45ade305272763.css`). Uses a custom icon font called **revicons** (downloaded — file `revicons.ff59b316.woff`, 7.5KB).

---

## 9. Service Quadrant Grid (signature visual pattern)

Four equal cards in a 2×2 grid, each with different background colors. From the screenshots:
- Top-left: **#0079C1** (primary blue) — Campaign Planning
- Top-right: **#00285E** (navy) — Client Support
- Bottom-left: **#50C1CB** (mint/teal) — Data & Analytics
- Bottom-right: **#00285E** (navy) — Design & Production

Big white heading + small white body + "View … details →" link. Hover reveals 5px mint underline.

---

## 10. Footer Decorative Curves

The "Advertise with PATTISON" CTA above the footer has a **concave white curve** that scoops into the dark navy section above. The footer itself is **black** with **subtle navy decorative curves** in the bottom-right area. Two layered curve shapes — likely SVG with stroke.

---

## 11. Reduced-Motion Respect

`@media (prefers-reduced-motion: reduce)` is queried — confirms the site honors user OS settings. Worth doing on the rebuild.

---

## 12. Effects Found in JS Bundles (worth digging into source)

Search the downloaded JS bundles for:
- `scrolledUp` / `scrolledY` — the scroll-tracking variable setter
- `IntersectionObserver` — count-up trigger
- `enterFromRight` / `scaleIn` (named keyframes) — the Radix-style modal/dropdown transitions
- `cubic-bezier(0.62, 0.16, 0.13, 1.01)` — Pattison's signature easing

These are in: `js/2200cc46-eaf2b06ed874b93c.js` (173KB) and `js/945-a9c3bf73b00cea57.js` (124KB).
