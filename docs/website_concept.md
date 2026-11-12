# iTOP Pavers – website concept (v3, Nov 2026)

Built as a single HTML page with Three.js r128. A preview is also published as a private Claude artifact ("iTOP Pavers").

## Decisions
- **Name and logo:** iTOP Pavers, using the client's logo (house mark + iTOP + "Pavers"), vectorised from the PNG they supplied. On dark backgrounds: orange mark, white wordmark (approved on-black colourway).
- **Theme:** dark brand canvas (#131313) with orange #EA680F accents. Buttons use black text on orange for contrast.
- **Fonts (client request, Nov 11 2026):** Poppins for headings and body text, to match the current itoppavers.com. That site uses Poppins Bold/Medium headings and Poppins body, with Montserrat SemiBold on a few H2s. Headings use 700, sub-headings 600, body 16px. Earlier stand-ins, all replaced: Archivo Expanded, Unbounded, and Inter Tight + Inter.
- **Concept:** "see it in 3D before we build it".
  - Hero: an explorable 3D backyard (patio, pool deck, kitchen + pergola, fire pit) with numbered hotspots and a Dusk/Day toggle. Drag to rotate. To exit a close-up: the "Back to whole yard" button, clicking the active pin again, Esc, or the panel's Whole yard / Next buttons.
  - 3D Design Studio: architectural-render look, with a realistic lawn, ornamental grasses, a slatted fence, sprite flames and soft lighting. 4 patterns × 5 colours × 3 borders, a before/after split slider, and "Add this design to my estimate", which carries the design into the form.
  - Built to last: a scroll-driven exploded cross-section with 6 layers.
- **Competitor-review ideas implemented:**
  - grouped navigation with mega menus
  - sticky shrinking header
  - trust strip
  - 4-step process
  - "iTOP advantage" box
  - filterable projects with a before/after tile
  - Google reviews slot with Write-a-review
  - local service-area map
  - multi-step quote form with a progress bar (routes to GoHighLevel on the live site)
  - licence number in the footer
  - mobile Call / Estimate bar

## Still needed from the client
- Real project photos (the gallery and before/after tiles are placeholders).
- Confirm: service-area town list, opening hours, Instagram handle (@itoppaverss), and whether financing or a warranty can be advertised.

## Suggested next steps (live build)
1. Wire the quote form to GoHighLevel (webhook or form embed), including the 3D design selection.
2. Replace the project placeholders with real photos and a working before/after slider.
3. Embed the live Google reviews widget.
4. Split the dropdown links into individual service pages.
5. Add SEO meta tags: title, description, Open Graph, and LocalBusiness schema with NAP and licence.
6. Performance pass: self-host Three.js and fonts, and lazy-load below-the-fold scenes (already lazy).
