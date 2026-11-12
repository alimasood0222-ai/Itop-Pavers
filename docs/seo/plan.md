# SEO + AEO plan – iTOP Pavers (draft for approval)

Date: 12 Nov 2026. Status: **waiting for approval**. No structural change has been made yet.

---

## 1. What I found

### How the site is built today
- One page. `src/build.py` stitches `src/page.html` (CSS + markup) and `src/app.js` into `dist/index.html`, and copies the photos to `dist/img/`. It's hosted on Vercel as a static upload (https://itop-pavers.vercel.app). itoppavers.com still points at the old WordPress site.
- The current sections are:
  - hero (headline + large photo showcase of real jobs)
  - stats bar
  - Paver Styles (Tremron collections + 3D sample block)
  - "What's under every iTOP patio" (3D exploded layers)
  - services (10)
  - projects (12 real photos)
  - process (4 steps)
  - reviews + service-area map
  - quote form (3 steps)
  - footer

### Already in place
- A `<title>`, a meta description, Open Graph tags and one `HomeAndConstructionBusiness` JSON-LD block (hand-written in `page.html`).
- One `<h1>`, plus `<main>`, `<nav>` and `<footer>`.
- Every `<img>` has an `alt` attribute.
- A favicon (inline SVG).
- WebP photos that lazy-load.
- 3D scenes that only start when they scroll into view.

### Crawlability problems (the big AEO issue)
These containers are **empty in the HTML** and only filled by JavaScript, so non-JS crawlers (most AI crawlers) see nothing in them:

| Content | Container | Today |
|---|---|---|
| Project tiles (12 real jobs) | `#projGrid`, `#filters` | JS only |
| 6 build-up layers | `#layers` | JS only |
| Service-area towns + map labels | `#towns`, `#map` | JS only |
| Quote-form project types | `#typeOpts` | JS only |
| Hero photo showcase + thumbnails | `#showSlides`, `#showThumbs` | JS only |
| Paver collections + colour blends | `#sxColls`, `#sxSw` | JS only |

There is also **no FAQ** on the page. The brief mentions an "explore-the-yard list", but that was removed today together with the 3D hero (at your request), so nothing needs fixing there.

### Technical gaps
- **Fonts:** Poppins loads from Google Fonts (render-blocking, third-party). Five weights load, but 400/500/600/700 cover what's used.
- **Three.js:** loaded synchronously from cdnjs at the end of `<body>` (about 600 KB). It doesn't block the hero text, but it does delay the `load` event and costs main-thread time on mobile.
- **Headings skip levels:**
  - The service cards and process steps are `h4` directly under an `h2`/`h3`.
  - The footer uses `h5`.
  - "The iTOP advantage" is an `h3` with no parent `h2`.
- **Missing files:** no `robots.txt`, `sitemap.xml`, `404.html`, `site.webmanifest`, apple-touch-icon, 1200×630 OG image or `llms.txt`.
- **Schema:**
  - Hand-written in the HTML, so it can drift from the visible NAP.
  - No `WebSite`, `Service`, `FAQPage` or `BreadcrumbList`.
  - `areaServed` lists 3 places, but the map shows 12.
- **The preview domain will compete with the real one.** `itop-pavers.vercel.app` is publicly indexable. Once the real domain is live, Google will see duplicate content unless the preview domain is set to `noindex`.
- **Unconfirmed claim:** the copy promises "3D design preview before you sign" (stats bar, process step 2, iTOP advantage). The client hasn't confirmed this service exists.

### Facts: conflicts between the brief and what you told me earlier today
| Item | This brief | Earlier instruction or evidence | Plan |
|---|---|---|---|
| Review count | "32 Google reviews" | You told me today: "dont mention 32 reviews" | **Keep the count off the site and out of the schema.** Link to the Google reviews instead. No AggregateRating (the brief says the same). |
| Instagram | @itoppaverss | You gave me https://www.instagram.com/itoppavers/ today. The audit also found the live profile at @itoppavers. The brand deck says @itoppaverss. | Use **@itoppavers** (the URL you gave me) and confirm with the client. |
| Facebook | TODO | You gave me https://www.facebook.com/itoppavers/. The audit notes the page is titled "ITop Builder \| Jacksonville FL". | Put it in `sameAs`, and flag the page-name mismatch for the client to fix. |
| Canonical host | default `https://itoppavers.com/` | The brand deck prints `www.itoppavers.com`. The old Yoast sitemap lives on the bare domain. | Default to `https://itoppavers.com/` with www → 301 to bare. Confirm with the client. |

### Content from the old website (added after your note: "for all these pages use the old website")
I pulled the exact text of every published page from the WordPress database in the backup zip (`.wpress` → `database.sql`). The old pages are: Home, About, Services, the 10 service pages, Paver Styles, FAQ, Contact, Get a quote, the two thank-you pages, Privacy Policy, Cookie Policy and Terms of Use. I did **not** read the form-submissions table, because it holds customers' personal details.

What I'll reuse, and how:
| Old page | Reuse | Notes |
|---|---|---|
| Privacy Policy (iTop Pavers LLC, updated 30 Jan 2025) | **Carry over word for word** to `/privacy-policy/` | The only edit is `http://itoppavers.com` → `https://itoppavers.com`. It's the client's own legal text. |
| Cookie Policy (iTop Pavers LLC, updated 30 Jan 2025) | **Carry over word for word** to `/cookie-policy/` | It mentions a "Cookie Consent Manager … in the notification banner" and analytics cookies. The new site has no trackers or banner yet, so the client must either add the tracking tags plus a consent banner, or update the policy. Flagged below. |
| Terms of Use | **Not reusable as is** | It says "residential and commercial cleaning services" and gives the phone +1 (951) 719-0366. I'll carry over the rest and correct only those two factual lines (paver and outdoor-living services, (904) 525-9191), marked for the client's legal review. |
| About | Use for `/about/` and the About section | Fabio's background as published by the client: general contractor in New Haven, CT from the early 2000s with CT Homes; projects featured on "Flip This House"; moved to Florida in 2017. A Vimeo clip of the show is linked. Spelling still varies (Hesteferson / Hesterferson). |
| FAQ (10 Q&As) | Starting point for the new FAQ | It states: payment methods (cash, check, credit/debit, bank transfer); "we can suggest flexible financing plans"; "we offer warranties on materials and craftsmanship, details vary by service". These are the client's own statements, so I'll reuse the wording without adding anything (no terms or lengths), and still ask the client to confirm they're current. |
| 10 service pages | Base copy for each new service page | Same template each time (intro, 4 reasons, materials, 4-step process). I'll fix the known errors: "Hasle-Free" typo, Outdoor Kitchens copied from Patios, and "outdoors spaces". Then I'll rewrite it answer-first. |
| Home / Services / Paver Styles | Taglines, service blurbs, the Tremron product lines | Slogan "Crafting unique home solutions" (also in the brand deck). |
| Hero video `Hero4_1080.mp4` (18 MB) | Optional | Could become a compressed hero or about-page clip. Needs checking that it's their own footage. |

**New facts from the client's own pages** (I'll use them, marked "source: old site"):
- Legal entity: **iTop Pavers LLC**
- Fabio's background (above)
- payment methods
- warranty and financing wording (above)

**Conflicts in the old content:**
- **Service area:** the FAQ lists 22 towns, including Ocala, Palatka, Palm Coast, Satsuma, Middleburg, Green Cove Springs, Yulee and Villano Beach, and misspells "Flager Beach". The new map has 12. The client must confirm one list.
- **Real Google reviews:** a table of them is cached in the database (`grp_google_review`). These are genuine reviews, so quoting a few, with permission and without a count or stars, could work as testimonials. This needs your OK, because you asked me not to show the review count.

**Security note:** the old site's web root has files that aren't part of WordPress: `123.php`, `default.php`, `ip/default.php`, `htmlStringy`, `ukq.txt`. Files like these are often signs of a compromised site. I haven't opened or run them. The host should scan the live itoppavers.com before launch, and the new site must not reuse anything from that folder except images and text.

---

## 2. Proposed site structure and URL map (needs approval)

I recommend turning the single page into a **small multi-page static site**, generated by `build.py` from one data file. The old site's slugs are kept so existing rankings carry over.

| URL | Page | Primary intent (see keyword map) | Notes |
|---|---|---|---|
| `/` | Home | paver contractor Jacksonville FL | Same design as now (hero showcase, paver styles + 3D block, build-up, services, projects, process, FAQ, area, quote). Becomes the hub that links to every service. |
| `/services/` | All services | paver and outdoor-living services NE Florida | Hub with the 10 cards, grouped Pavers / Outdoor Living. |
| `/services/patios/` | Paver patios | paver patio Jacksonville | Answer-first intro, what's included, patterns, real photos, 4–6 FAQs, CTA. |
| `/services/driveways/` | Paver driveways | paver driveway St. Johns County | Same template. |
| `/services/pool-decks/` | Pool decks | pool deck pavers St. Augustine | Same template. Includes the pavers vs concrete vs travertine table. |
| `/services/walkways/` | Walkways | paver walkway Jacksonville | Same template. |
| `/services/paving-maintenance/` | Paving maintenance | paver sealing Jacksonville | Same template. |
| `/services/fiberglass-pools/` | Fiberglass pools | fiberglass pool and deck installation NE Florida | Same template. Pool + deck built together. |
| `/services/outdoor-kitchens/` | Outdoor kitchens | outdoor kitchen builder Jacksonville | Same template. |
| `/services/pergolas-gazebos/` | Pergolas & gazebos | pergola builder Jacksonville | Same template. |
| `/services/retaining-walls-firepits/` | Retaining walls & fire pits | paver fire pit / retaining wall Jacksonville | Same template. |
| `/services/screen-enclosures/` | Screen enclosures | screen enclosure Jacksonville | Same template. |
| `/styles/` | Paver styles | Tremron pavers Jacksonville / paver colours | The full Paver Styles explorer + 3D sample block, the 4 laying patterns with "best for", and the comparison table. The home page keeps a teaser. |
| `/projects/` | Projects | paver projects Jacksonville (portfolio) | Filterable gallery of real jobs, all in static HTML. Fixes the old FAQ's dead "gallery page" reference. |
| `/about/` | About iTOP Pavers | licensed paver contractor Jacksonville | E-E-A-T: licence, Fabio as manager (spelling TBC), process, what's different. |
| `/service-area/` | Service area | paver contractor near me / town names | **One page** with the confirmed town list, map and notes. No per-town doorway pages unless the client gives genuinely local content (permits, soil, real local jobs). |
| `/faq/` | FAQ | homeowner questions | The full FAQ (general + per-service). The home page shows 8–10 of them. |
| `/contact/` | Contact | contact iTOP Pavers | NAP, map link, hours (TODO), call/WhatsApp/email. |
| `/get-a-quote/` | Free estimate | free paver estimate Jacksonville | The 3-step form. |
| `/quote-thank-you/`, `/contact-thank-you/` | Thank-you | none | **noindex**. Kept for the GoHighLevel redirect and conversion tracking. |
| `/privacy-policy/`, `/terms-of-use/`, `/cookie-policy/` | Legal | none | URLs kept. Privacy and Cookie are carried over word for word from the old site (iTop Pavers LLC). Terms are carried over with the cleaning-company line and the wrong phone corrected, and flagged for legal review. Indexable but low priority (left out of the main nav, kept in the footer). |
| `/404.html` | Branded 404 | none | Links to home, services, quote and phone. |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/site.webmanifest` | Files | none | Generated by `build.py`. |

**Hosting details (Vercel, static):**
- `vercel.json` sets `trailingSlash: true`.
- It also holds the 301 redirects from `docs/seo/redirects.md`, plus `/get-a-quote` → `/get-a-quote/` and `/services/outdoor-kitchens-2/` → `/services/outdoor-kitchens/`.
- It sends an `X-Robots-Tag: noindex` header **only** when the host is `itop-pavers.vercel.app`, so the preview domain never competes with itoppavers.com.

**Alternative if you'd rather stay single-page:** I can do everything in Phase 1 on the one page and skip Phase 2. Ranking for each service will be weaker, because one URL can't be the best answer for 10 different searches. Phase 1 is worth doing either way.

---

## 3. Phases

### Phase 1: single page, no structural change (can start as soon as you OK this plan)
1. **One data source.** Create `src/site_data.py` holding the NAP, licence, services (name, slug, one-line description), towns, layers, patterns, collections, FAQs and projects. `build.py` renders the visible HTML **and** the JSON-LD from it, so the two can't drift apart.
2. **Static HTML for everything currently built by JS:**
   - project tiles
   - layers list
   - town chips (plus `<text>` labels in the SVG map, built at build time)
   - quote project types
   - hero slides and thumbnails
   - paver collections and swatches

   `app.js` only *enhances* this markup (filters, carousel, 3D). It never creates the content.
3. **3D canvases:** each gets a text description (a `<p>` or `<figcaption>` in the HTML) and a static poster image, shown until WebGL starts and kept if it never does. No empty boxes for no-JS crawlers, and the 3D stays the same for visitors.
4. **Content (answer-first, plain English):**
   - a visible **FAQ** section (8–10 questions)
   - the **pavers vs concrete vs travertine** table
   - the **4 laying patterns** with "best for"
   - a short static intro to the 6-layer build-up
   - an **About** block (licensed contractor, Fabio, process, licence beside the CTA)

   Answers that depend on client facts (price, timeline, warranty, hours) keep their structure and are marked `TODO(client)` in comments, never guessed.
5. **Head:**
   - title (50–60 chars), meta description (140–160 chars), canonical, `lang="en"`, OG + Twitter card
   - a new **1200×630 OG image** (logo + brand colours, generated with Pillow)
   - favicon, `apple-touch-icon`, `site.webmanifest`, `theme-color #131313`
6. **Structured data**, generated:
   - `HomeAndConstructionBusiness` with `@id`, NAP, `areaServed` matching the visible town list exactly, the licence in `description` and `hasCredential` (`EducationalOccupationalCredential`, category "license"), and `sameAs`. `geo`, `openingHoursSpecification` and `priceRange` stay out until confirmed (TODO).
   - `WebSite` + `Organization` with the logo.
   - `Service` ×10 with `provider` → the business `@id`.
   - `FAQPage` for the visible FAQ only.
   - No `AggregateRating` or `Review`.
7. **Semantics:**
   - Fix the heading order: card titles become `h3` under section `h2`s, and the footer headings become `p`/`h2` styled small.
   - Check link text and alt text.
8. **Performance:**
   - Self-host Poppins (400/500/600/700, `woff2`, `font-display: swap`, preload 700 for the headline).
   - Load Three.js `defer`, or inject it only when the first 3D section comes near the viewport. The hero headline is plain HTML, so it's the LCP element and doesn't need JS.
   - Reserve space for the late-loading showcase, map and 3D so nothing shifts.
9. **Files:** `robots.txt` (only the real sitemap; AI crawlers allowed: GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended), `sitemap.xml` with `lastmod`, `llms.txt`, a branded `404.html`, and `vercel.json` (preview noindex).
10. **Copy fix:** remove the "3D design before you sign" claims until the client confirms it (TODO(client)). The 3D on the site stays; only the promise of a 3D design service is withdrawn.

### Phase 2: multi-page split (**only after approval**)
- `build.py` becomes a small generator: shared header, footer and head partials, one template per page type, and every page written to `dist/<slug>/index.html`.
- Per-page titles, H1s and descriptions come from the keyword map.
- `BreadcrumbList` on inner pages, `Service` JSON-LD on each service page, `FAQPage` wherever a page shows FAQs.
- `app.js` is split, so pages without 3D don't load Three.js at all.
- Nav, mega-menu and footer links point at the real pages instead of `#anchors`.

### Phase 3: content for each page
- Each service page gets:
  - a 40–60-word answer-first intro
  - what's included
  - process
  - real photos of that service (where we have them)
  - 4–6 FAQs
  - CTA, with the licence beside it
- Pages for services without real photos (kitchens, pergolas, pools) use icons, Tremron product photos (credited), or no photo. **Never stock photos presented as iTOP work.**
- `/service-area/` with the confirmed town list. `/about/` with Fabio (once the spelling is confirmed).

### Phase 4: verify and document
- No-JS check: `curl` each page and grep for every service name and description, the process steps, the FAQ questions and answers, the towns, the NAP and the licence.
- Lighthouse, mobile + desktop, on the home page, one service page and `/styles/`, reporting SEO, Performance, Accessibility and Best Practices. Fix anything under 90 that's within our control.
- Parse every JSON-LD block. Check the heading outline (one H1, no skips), image alt attributes and internal links.
- Visual checks at 1440–1600 (including 780 tall) and 360/390, with no horizontal scroll. 3D still works and reduced motion is respected.
- Docs:
  - `docs/seo/redirects.md`
  - `docs/seo/schema.md`
  - `docs/seo/keyword-map.md`
  - `docs/seo/off-site-checklist.md`
  - `docs/seo/client-questions.md`

---

## 4. Open questions for the client (these will go into `docs/seo/client-questions.md`)
1. **Opening hours.** The old site says both Mon–Sat 8–5 and 8–6. Which is right?
2. **Canonical domain:** `itoppavers.com` or `www.itoppavers.com`?
3. **Instagram handle:** `@itoppavers` (the live URL) or `@itoppaverss` (the brand deck)?
4. **Facebook page:** it's titled "ITop Builder". Will they rename it to iTOP Pavers?
5. **Google Business Profile URL**, and its primary category.
6. **Service-area towns:** confirm the 12 on the map, or give the real list. The FAQ on the old site listed 22, including Ocala and Palatka.
7. **Manager's name spelling:** Hesteferson or Hesterferson? And may we feature Fabio's photo?
8. **Founding year** (for "since …" and the schema `foundingDate`).
9. **Insurance:** may we say "insured"? Any details?
10. **Warranty or financing:** anything we can state?
11. **Price ranges or "from" prices:** any they're happy to publish? (Otherwise no `priceRange`.)
12. **Typical timelines** (e.g. a patio in X days) for the FAQ answers.
13. **Permits/HOA:** confirm that they pull permits and do the HOA paperwork in every county they serve.
14. **3D design:** do they really provide a 3D design before signing? If not, the claim stays removed.
15. **Legal texts:** correct Terms, Privacy and Cookie policies. The old Terms are for a cleaning company.
16. **The second phone (904) 685-2555** and the `@itopbuilder.com` email: still in use?
17. **AI crawlers:** OK to allow GPTBot, ClaudeBot, PerplexityBot and the others to read the site? (Default: allowed.)
18. **Review count:** you asked me not to show "32 reviews". Should that also apply to answer-engine content (llms.txt and FAQs)? Default: not mentioned anywhere.
19. **GoHighLevel webhook** for the quote form, so leads arrive automatically instead of through the email fallback.
20. **Cookie Policy vs reality:** the old policy promises a consent banner and analytics cookies. Will the new site run Meta Pixel, Clarity or Google Ads? If yes, we add a consent banner. If no, the policy should be updated.
21. **Terms of Use:** OK to correct the cleaning-company paragraph and the (951) phone, pending their lawyer's review?
22. **Old-site statements:** are these still true? Payment methods, "flexible financing plans", "warranties on materials and craftsmanship", "Flip This House", moved to Florida in 2017.
23. **Testimonials:** may we quote a few of their real Google reviews (first name + town, no count or stars)?
24. **Security:** have the host scan the live WordPress site (`123.php`, `default.php`, `ip/default.php`, `htmlStringy`, `ukq.txt` in the web root).
25. **Hero video** `Hero4_1080.mp4`: is it their own footage, and may we use it?

---

## 5. What I need from you now
- **Approve or adjust** the URL map in section 2: multi-page (recommended), or single-page only.
- Confirm I should apply the four "conflict" decisions in section 1 (no review count, @itoppavers, Facebook in `sameAs`, bare domain as canonical).
- Confirm the old-site content handling: legal pages carried over (Terms corrected), and old-site statements (financing, warranty, payment methods, Fabio's background) reused word for word.
- Once you approve, I'll start Phase 1, then Phase 2–4 if multi-page is approved.
