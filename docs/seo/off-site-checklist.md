# Off-site SEO checklist (documentation only; nothing here has been done)

## 1. Google Business Profile (most important for the local map pack)
- [ ] Claim or verify the profile. Business name exactly **iTOP Pavers** (no "iTop Builder" and no keyword stuffing).
- [ ] Primary category: **Paving contractor** (or "Patio builder"; check which the client ranks for). Secondary categories: Hardscaping contractor, Swimming pool contractor, Deck builder, Patio enclosure supplier, Landscaper (only those that are true).
- [ ] Address: 6510 Columbia Park Dr, Suite 206, Jacksonville, FL 32258. Phone (904) 525-9191. Website `https://itoppavers.com/`. **Same as the site footer and schema.**
- [ ] Hours: Mon–Fri 8:00 am–6:00 pm, Sat 9:00 am–1:00 pm, Sun closed (same as the site).
- [ ] Service areas: the same towns as `/service-area/` (TODO(client): confirm the list first).
- [ ] Services: the 10 service names exactly as on the site, each with a one-line description.
- [ ] Photos: the real project photos (the same ones on the site), the logo, a cover photo and the office. Add new job photos monthly.
- [ ] Q&A: seed it with the FAQ questions and answers from `/faq/`.
- [ ] Review-request flow: send the GBP review link by SMS or email after each final walkthrough. Never offer incentives; reply to every review.
- [ ] Add the GBP URL to `sameAs` in `src/site_data.py` (`BIZ`), then rebuild.

## 2. Bing Places and Apple Business Connect
- [ ] Bing Places: import from Google Business Profile, then check NAP and hours.
- [ ] Apple Business Connect: create the place card with the same NAP, hours, category and photos.

## 3. Citation clean-up (name, address, phone consistency)
- [ ] Search for "iTop Builder" and rename it to iTOP Pavers where it's the same business: the Facebook page title ("ITop Builder | Jacksonville FL"), the "Become a Sub Contractor" Google Form and directory listings.
- [ ] Remove or correct wrong phone numbers wherever they appear:
  - **123-456-7890** (the old footer placeholder)
  - **(951) 719-0366** (the old Terms of Use)
  - **(904) 685-2555** (on the old quote page; keep it only if the client confirms it as a secondary line)
- [ ] Replace **info@itopbuilder.com** with info@itoppavers.com everywhere.
- [ ] Check Yelp, BBB, Angi, Houzz, Nextdoor, Thumbtack, Facebook and Instagram bios: same name, address, phone, website and hours.
- [ ] Old service-area lists (22 towns, including Ocala and Palatka) should match the confirmed list.

## 4. Search Console, Bing Webmaster and launch monitoring
- [ ] Point `itoppavers.com` (and www → bare) at Vercel only after the client approves the new site.
- [ ] Google Search Console: verify the domain property (DNS TXT), submit `https://itoppavers.com/sitemap.xml`, and request indexing for `/`, `/services/` and the 10 service pages.
- [ ] Bing Webmaster Tools: import from Search Console and submit the sitemap.
- [ ] For 4–6 weeks: watch Coverage/Pages for 404s and add redirects to `REDIRECTS` in `build.py` as needed (see `redirects.md`).
- [ ] Check Core Web Vitals (field data) once there's traffic.
- [ ] Before cut-over: have the host scan the old WordPress install. It contains suspicious non-WordPress files (`123.php`, `default.php`, `ip/default.php`, `htmlStringy`, `ukq.txt`).
