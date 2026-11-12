# CLAUDE.md – iTOP Pavers website

Context for Claude Code. Read README.md for structure and the build command.

## Workflow
- Edit files in `src/`, then run `python3 src/build.py`. Never edit `dist/`.
- `src/page.html` holds the CSS and markup, `src/app.js` holds all JS, and `src/build.py` generates the header/menus and assembles the page.
- Preview: `cd dist && python3 -m http.server 8000`.
- After visual changes, check desktop (1440–1600 px wide, including a short 780 px tall viewport) and mobile (360/390 px). Make sure there's no horizontal scroll: `document.documentElement.scrollWidth === innerWidth`.

## Decisions already made with the client (don't revert without asking)
- **Name and logo:** "iTOP Pavers", using the client's logo, vectorised from `assets/logo/itop-pavers-logo-original.png`. On dark backgrounds: orange mark, white wordmark.
- **Colours:** orange `#EA680F`, black `#131313`, white. Dark theme throughout. Primary buttons use **black text on orange** (white on orange fails contrast for small text).
- **Fonts:** **Poppins** everywhere, to match the client's current site itoppavers.com. Headings 700, sub-headings 600, body 400 at 16 px. Already tried and rejected: Archivo Expanded, Unbounded, Inter Tight.
- **Look:** sleek and professional, not childish. The 3D studio uses an architectural-render look: muted realistic grass, ornamental grasses, slatted fence, soft warm light and sprite flames. Avoid saturated cartoon colours, cone shapes and ball shrubs.
- **Hero (changed 2026-11-12):** the 3D backyard hero was dropped as toy-like. The hero is now a real iTOP job photo with a "Start your project" picker that shows a matching real job and pre-selects the quote form. Keep the headline to two lines on desktop so the CTAs stay above the fold.
- **Paver styles (changed 2026-11-12):** the 3D before/after studio was replaced by a selector of real Tremron collections and colour blends (product photos from the old site, credited "Photo: Tremron"). The exploded 3D build-up section stays.
- **Photos:** only real iTOP job photos (from the old site's uploads and Instagram feed) are shown as iTOP work, in `assets/photos/`. Never use the old site's stock/AI images or present Tremron's photos as iTOP jobs.

## Content rules
- Don't invent reviews, ratings, locations, prices, financing or warranty claims. The known facts:
  - 32 Google reviews
  - licence CBC 1294954
  - 10+ years
  - phone (904) 525-9191
  - info@itoppavers.com
  - office: 6510 Columbia Park Dr, Suite 206, Jacksonville, FL 32258
  - Instagram @itoppaverss
- Project photos and the reviews widget are placeholders until the client supplies them.
- Leads must not be lost. The live form should post to GoHighLevel.

## Three.js gotchas (r128, UMD build)
- No OrbitControls. Use the custom `Orbit()` helper.
- Colour management is manual. Convert sRGB hex values to linear (`linScene()` or `.convertSRGBToLinear()`).
- Clipping planes are world-space. Keep paver fields' parent groups at the origin, or update the plane constants.
- A PMREM environment map rendered black in headless/SwiftShader testing, so the scenes use hemisphere + directional lights instead.
