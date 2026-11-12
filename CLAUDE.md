# CLAUDE.md – iTOP Pavers website

Context for Claude Code. Read README.md for structure and the build command.

## Workflow
- Multi-page static site. Edit `src/site_data.py` (facts/copy), `src/build.py` (page templates, JSON-LD, sitemap, robots, llms.txt, vercel.json), `src/styles.css`, `src/app.js`; then run `python3 src/build.py`. Never edit `dist/`.
- Facts and copy live ONLY in `src/site_data.py`; the visible text and the schema are both generated from it.
- `app.js` enhances static HTML; every module must check its markup exists. Meaningful text must be in the HTML (no JS-only content).
- Preview: `cd dist && python3 -m http.server 8000`.
- After visual changes, check desktop (1440–1600 px wide, including a short 780 px tall viewport) and mobile (360/390 px). Make sure there's no horizontal scroll: `document.documentElement.scrollWidth === innerWidth`.
- SEO docs: `docs/seo/` (plan, redirects, schema, keyword map, off-site checklist, client questions).

## Decisions already made with the client (don't revert without asking)
- **Name and logo:** "iTOP Pavers", using the client's logo, vectorised from `assets/logo/itop-pavers-logo-original.png`. On dark backgrounds: orange mark, white wordmark.
- **Colours:** orange `#EA680F`, black `#131313`, white, plus a warm stone `#f4efe7` for light sections (added 2026-11-12 to alternate light/dark, at the user's request, using itop-pools.vercel.app as the quality bar). Primary buttons use **black text on orange** (white on orange fails contrast for small text).
- **Fonts:** **Poppins** everywhere, to match the client's current site itoppavers.com. Headings 700, sub-headings 600, body 400 at 16 px. Already tried and rejected: Archivo Expanded, Unbounded, Inter Tight.
- **Look:** sleek and professional, not childish. The 3D studio uses an architectural-render look: muted realistic grass, ornamental grasses, slatted fence, soft warm light and sprite flames. Avoid saturated cartoon colours, cone shapes and ball shrubs.
- **Hero (changed 2026-11-12):** no 3D backyard (dropped as toy-like). Text on the left; on the right a large rounded photo showcase of real iTOP jobs (crossfade, thumbnails, licence badge in 3D depth). Keep the headline to two lines on desktop so the CTAs stay above the fold. Avoid "AI-looking" touches: glowing pill labels, grid backdrops, button glows.
- **Paver styles (changed 2026-11-12):** the 3D before/after studio was replaced by a selector of real Tremron collections and colour blends (product photos from the old site, credited "Photo: Tremron"). The exploded 3D build-up section stays.
- **Photos:** only real iTOP job photos (from the old site's uploads and Instagram feed) are shown as iTOP work, in `assets/photos/`. Never use the old site's stock/AI images or present Tremron's photos as iTOP jobs.

## Content rules
- Don't invent reviews, ratings, locations, prices, financing or warranty claims. The known facts:
  - Google reviews exist, but never show the review count anywhere (user request 2026-11-12); link to the Google reviews instead
  - licence CBC 1294954
  - 10+ years
  - phone (904) 525-9191
  - info@itoppavers.com
  - office: 6510 Columbia Park Dr, Suite 206, Jacksonville, FL 32258
  - Instagram @itoppavers (https://www.instagram.com/itoppavers/), Facebook https://www.facebook.com/itoppavers/ (confirmed by the user 2026-11-12)
- Project photos and the reviews widget are placeholders until the client supplies them.
- Leads must not be lost. The live form should post to GoHighLevel.

## Three.js gotchas (r128, UMD build)
- No OrbitControls. Use the custom `Orbit()` helper.
- Colour management is manual. Convert sRGB hex values to linear (`linScene()` or `.convertSRGBToLinear()`).
- Clipping planes are world-space. Keep paver fields' parent groups at the origin, or update the plane constants.
- A PMREM environment map rendered black in headless/SwiftShader testing, so the scenes use hemisphere + directional lights instead.
