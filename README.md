# iTOP Pavers – website (homepage concept)

The new homepage for **iTOP Pavers** (Jacksonville / St. Augustine / St. Johns County, FL). It's a single dark, on-brand page built around three live 3D scenes:

- **Hero:** an explorable 3D backyard at dusk (paver patio, pool deck, outdoor kitchen + pergola, fire pit). It has hotspots, a Dusk/Day toggle and drag-to-rotate.
- **3D Design Studio:** 4 laying patterns × 5 paver colours × 3 borders, a before/after split slider, and "Add this design to my estimate", which carries the design into the quote form.
- **Built to last:** a scroll-driven exploded cross-section of a paver installation (6 layers).

Alongside the 3D scenes:

- mega-menu navigation and a mobile menu
- trust strip and services
- 4-step process and an "iTOP advantage" box
- filterable projects
- reviews slot and service-area map
- 3-step quote form
- footer and a mobile Call / Estimate bar

## Quick start

```bash
python3 src/build.py          # writes dist/index.html and dist/artifact.html
cd dist && python3 -m http.server 8000
# open http://localhost:8000
```

There's no npm install and no bundler. The page loads:

- **Three.js r128** from cdnjs: `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
- **Poppins** from Google Fonts

## Project structure

```
src/
  page.html     CSS + page markup, with three placeholders:
                {{LOGO_SYMBOL}}  {{HEADER}}  {{APP}}
  app.js        All JavaScript (navigation, studio controls, quote form, map, three 3D scenes)
  build.py      Generates the header/mega-menu/mobile-menu HTML, injects the logo and app.js,
                and writes dist/index.html (standalone) + dist/artifact.html (Claude Artifact)
assets/logo/
  itop-pavers-logo-original.png   Logo PNG supplied by the client
  o.txt, d.txt, vb.txt            Vectorised logo paths (orange parts / wordmark / viewBox)
  logo_dark.svg, logo_light.svg   The vector logo on dark and light backgrounds
  trace_logo.py                   Script that produced the vector paths from the PNG (OpenCV)
docs/
  brand_guidelines.md             Brand rules from the client's brand deck
  website_concept.md              Design decisions and open items
dist/                             Build output (don't edit by hand)
```

**Edit `src/` and rebuild. Never edit `dist/`.**

## Where things live in `app.js`

| Section | Search for |
|---|---|
| Content data (patterns, colours, quote types, hotspots, layers) | `/* ================= data` |
| Paver laying-pattern maths (herringbone 45/90, running bond, basketweave) | `function layout(` |
| 2D pattern thumbnails | `function drawPattern(` |
| Navigation, mega menus, mobile menu, scroll effects | `/* ================= navigation` |
| Projects grid + filters | `/* ================= projects` |
| Service-area map (schematic SVG) | `service-area map` |
| Studio controls + before/after slider | `studio controls (DOM)` |
| 3-step quote form | `quote form (3 steps)` |
| 3D helpers (Stage loop, Orbit, PaverField, fire pit, grass, palms) | `class Stage`, `function PaverField(` |
| Hero backyard scene | `HERO: dusk backyard` |
| Studio scene | `STUDIO: before / after` |
| Exploded build-up scene | `BUILD-UP: exploded` |

## Notes

- **Colour space:** all material colours are sRGB hex values, converted to linear with `linScene()` after a scene is built. Paver instance colours are converted in `PaverField.recolor`. If you add materials after `linScene` has run, call `.convertSRGBToLinear()` yourself, or the 3D colour won't match its swatch.
- **Performance:** each 3D canvas only renders while on screen. The studio and build-up scenes start only when scrolled near. Reduced-motion users get static scenes.
- **Fallback:** if WebGL is missing, the canvases hide and a gradient shows.
- **Quote form:** it's a demo. It validates and shows a success message, but sends nothing. On the live site, wire the submit handler (`qform.addEventListener('submit'`) to GoHighLevel. The payload should include the project type, size, timeline, the 3D design (`design` object) and the contact fields.
- **Placeholders:**
  - project photos (gallery + before/after tile)
  - Google reviews widget
  - town list (to be confirmed)
  - opening hours (currently shows "Mon – Sat")
