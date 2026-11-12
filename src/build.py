"""iTOP Pavers static site generator.

    python3 src/build.py   ->   dist/   (one folder per page + assets, sitemap, robots, llms.txt, vercel.json)

All facts and copy live in src/site_data.py. The visible HTML and the JSON-LD are both rendered
from it, so the NAP, services and town list cannot drift apart. Never edit dist/ by hand.
"""
import datetime, hashlib, html, json, pathlib, re, shutil, sys

R = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(R / 'src'))
from site_data import *  # noqa: E402,F401,F403

D = R / 'dist'
TODAY = datetime.date.today().isoformat()
YEAR = datetime.date.today().year
e = lambda s: html.escape(str(s), quote=True)
U = lambda p: SITE_URL + p
BID = U('/#business')
read = lambda p: (R / p).read_text(encoding='utf-8')
Q = '"'

# ------------------------------------------------------------------ assets & helpers
vb, o_p, d_p = (read(f'assets/logo/{n}.txt').strip() for n in ('vb', 'o', 'd'))
m_p, mvb = (read(f'assets/logo/{n}.txt').strip() for n in ('m', 'mvb'))
LOGO_ORANGE = '#FB5D00'   # exact colour of the official logo artwork (old site ITOPPAVERS-LOGO files)
LOGO_SYMBOL = (f'<symbol id="logo" viewBox="{vb}"><path fill="{LOGO_ORANGE}" fill-rule="evenodd" d="{o_p}"/><path fill="currentColor" fill-rule="evenodd" d="{d_p}"/></symbol>'
               f'<symbol id="mark" viewBox="{mvb}"><path fill="currentColor" fill-rule="evenodd" d="{m_p}"/></symbol>')
SPRITE = read('src/sprite.svg').replace('{{LOGO_SYMBOL}}', LOGO_SYMBOL)
CSS = read('src/styles.css')
APP = read('src/app.js')
VER = hashlib.md5((CSS + APP).encode()).hexdigest()[:8]
def ic(n, cls=''): return f'<svg{" class=" + Q + cls + Q if cls else ""} aria-hidden="true"><use href="#{n}"/></svg>'
ARROW = ic('i-arrow')
def img(name, sm=True): return f'/img/{name}{"-sm" if sm else ""}.webp'
def tex(cid, col, t=False): return f'/img/pavers/{cid}-{col}{"-t" if t else ""}.webp'
def svc_url(s): return f'/services/{s["slug"]}/'
PAVERS = [s for s in SERVICES if s['group'] == 'Pavers']
LIVING = [s for s in SERVICES if s['group'] == 'Outdoor Living']
SITEMAP = []
def towns_inline(): return ', '.join(TOWN_NAMES[:-1]) + ' and ' + TOWN_NAMES[-1]
def hours_html(): return '<dl class="hours">' + ''.join(f'<dt>{d}</dt><dd>{t}</dd>' for d, t in BIZ['hours']) + '</dl>'

# ------------------------------------------------------------------ JSON-LD (generated from site_data)
def city(n): return {'@type': 'City', 'name': f'{n}, FL'}
def business_node():
    return {
        '@type': 'HomeAndConstructionBusiness', '@id': BID, 'name': BIZ['name'], 'legalName': BIZ['legal_name'], 'url': U('/'),
        'logo': {'@type': 'ImageObject', 'url': U('/assets/logo-512.png'), 'width': 512, 'height': 512},
        'image': [U(img('driveway-gated', False)), U(img('patio-firepit-lake')), U(img('pool-deck'))],
        'telephone': BIZ['phone_e164'], 'email': BIZ['email'],
        'address': {'@type': 'PostalAddress', 'streetAddress': BIZ['street'], 'addressLocality': BIZ['city'], 'addressRegion': BIZ['region'], 'postalCode': BIZ['zip'], 'addressCountry': BIZ['country']},
        'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': d, 'opens': o, 'closes': c} for d, o, c in BIZ['hours_spec']],
        'areaServed': [city(n) for n in TOWN_NAMES],
        'description': f'{BIZ["name"]} designs and builds paver patios, driveways, pool decks, walkways and outdoor living spaces across Northeast Florida. Licensed Florida contractor {BIZ["licence"]}.',
        'slogan': BIZ['slogan'],
        'hasCredential': {'@type': 'EducationalOccupationalCredential', 'credentialCategory': 'license', 'name': f'Florida contractor licence {BIZ["licence"]}',
                          'recognizedBy': {'@type': 'GovernmentOrganization', 'name': 'Florida Department of Business and Professional Regulation'}},
        'knowsAbout': [s['name'] for s in SERVICES],
        'sameAs': [BIZ['instagram'], BIZ['facebook']],
        # TODO(client): geo, priceRange, foundingDate, Google Business Profile URL in sameAs
    }
def website_node(): return {'@type': 'WebSite', '@id': U('/#website'), 'url': U('/'), 'name': BIZ['name'], 'publisher': {'@id': BID}, 'inLanguage': 'en-US'}
def service_node(s):
    n = {'@type': 'Service', '@id': U(svc_url(s)) + '#service', 'name': s['name'], 'serviceType': s['name'], 'url': U(svc_url(s)),
         'description': s['answer'], 'provider': {'@id': BID}, 'areaServed': [city(t) for t in TOWN_NAMES]}
    if s.get('img'): n['image'] = U(img(s['img']))
    return n
def faq_node(qas, path): return {'@type': 'FAQPage', '@id': U(path) + '#faq', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in qas]}
def crumbs_node(crumbs): return {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': U(p)} for i, (n, p) in enumerate(crumbs)]}
def webpage_node(path, title, desc): return {'@type': 'WebPage', '@id': U(path) + '#webpage', 'url': U(path), 'name': title, 'description': desc, 'isPartOf': {'@id': U('/#website')}, 'about': {'@id': BID}, 'inLanguage': 'en-US'}
def ld(nodes):
    s = json.dumps({'@context': 'https://schema.org', '@graph': nodes}, ensure_ascii=False, separators=(',', ':'))
    json.loads(s)
    return '<script type="application/ld+json">' + s.replace('</', '<\\/') + '</script>'

# ------------------------------------------------------------------ shell
def head(path, title, desc, nodes, noindex=False, og_img='/assets/og-image.jpg'):
    canon = U(path if path != '/404.html' else '/')
    robots = 'noindex,follow' if noindex else 'index,follow,max-image-preview:large'
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{canon}">
<meta name="robots" content="{robots}">
<meta name="theme-color" content="#131313">
<meta property="og:type" content="website"><meta property="og:site_name" content="{BIZ['name']}"><meta property="og:locale" content="en_US">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:url" content="{canon}">
<meta property="og:image" content="{U(og_img)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="iTOP Pavers, paver contractor in Northeast Florida">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{e(title)}"><meta name="twitter:description" content="{e(desc)}"><meta name="twitter:image" content="{U(og_img)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/poppins-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/poppins-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v={VER}">
{ld(nodes)}
</head>'''

def ml_photo(s):
    src = img(s['img']) if s['img'] else tex('olde-towne', 'sand-dune', True)
    return f'<a class="ml" href="{svc_url(s)}"><img class="mp" src="{src}" alt="" loading="lazy" decoding="async"><span><b>{e(s["nav"])}</b><small>{e(s["card"])}</small></span>{ic("i-arrow", "ar")}</a>'
def ml_icon(s): return f'<a class="ml" href="{svc_url(s)}"><span class="mi">{ic(s["icon"])}</span><span><b>{e(s["nav"])}</b><small>{e(s["card"])}</small></span>{ic("i-arrow", "ar")}</a>'
NAV = [('styles', '/styles/', 'Paver Styles'), ('projects', '/projects/', 'Projects'), ('about', '/about/', 'About'), ('faq', '/faq/', 'FAQ')]
def social():
    return (f'<a href="{BIZ["facebook"]}" target="_blank" rel="noopener" aria-label="iTOP Pavers on Facebook">{ic("i-fb")}</a>'
            f'<a href="{BIZ["instagram"]}" target="_blank" rel="noopener" aria-label="iTOP Pavers on Instagram">{ic("i-ig")}</a>')

def header(active=''):
    act = lambda k: ' data-active="1" aria-current="page"' if k == active else ''
    links = ''.join(f'<li><a class="nl" href="{h}"{act(k)}>{t}</a></li>' for k, h, t in NAV)
    grp = lambda g: ' data-active="1"' if active == g else ''
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="top" id="hdr">
  <div class="bar">
    <div class="wrap">
      <a class="brand" href="/" aria-label="{BIZ['name']} home"><svg class="logo" role="img" aria-label="{BIZ['name']}"><use href="#logo"/></svg></a>
      <nav class="mainnav" aria-label="Main">
        <span class="nl-ind" aria-hidden="true"></span>
        <ul class="menu">
          <li class="has-mega"><button class="nl" type="button" data-mega="mm-pavers" aria-expanded="false" aria-controls="mm-pavers"{grp('Pavers')}>Pavers{ic('i-chev', 'chev')}</button></li>
          <li class="has-mega"><button class="nl" type="button" data-mega="mm-living" aria-expanded="false" aria-controls="mm-living"{grp('Outdoor Living')}>Outdoor Living{ic('i-chev', 'chev')}</button></li>
          {links}
        </ul>
      </nav>
      <div class="bar-r">
        <a class="callbox" href="tel:{BIZ['phone_e164']}"><span class="ci">{ic('i-phone')}</span><span><small>Call or WhatsApp</small><b>{BIZ['phone']}</b></span></a>
        <a class="btn btn-primary" href="/get-a-quote/">Free estimate {ARROW}</a>
      </div>
      <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Open menu"><span></span><span></span><span></span></button>
      <div class="prog" aria-hidden="true"></div>
    </div>
  </div>
  <div class="mega" id="mm-pavers" role="region" aria-label="Paver services">
    <div class="wrap mega-in">
      <div><p class="mega-h">Paver services</p><div class="mega-grid">{''.join(ml_photo(s) for s in PAVERS)}</div></div>
      <a class="mega-feature photo" href="/styles/"><img src="/img/pavers/installed-olde-towne.webp" alt="" loading="lazy" decoding="async"><span class="tag2">Paver styles</span><b>Choose your pavers</b><p>Browse five Tremron collections and their colour blends, then see your pick in 3D.</p><span class="fl">Browse paver styles {ARROW}</span></a>
    </div>
    <div class="mega-foot"><div class="wrap"><span>Free on-site estimate</span><span>Permits handled</span><span>Licensed {BIZ['licence']}</span><a href="/services/">All services {ARROW}</a></div></div>
  </div>
  <div class="mega" id="mm-living" role="region" aria-label="Outdoor living services">
    <div class="wrap mega-in">
      <div><p class="mega-h">Outdoor living</p><div class="mega-grid">{''.join(ml_photo(s) for s in LIVING)}</div></div>
      <a class="mega-feature photo" href="/get-a-quote/"><img src="{img('screen-enclosure')}" alt="" loading="lazy" decoding="async"><span class="tag2">One team, one contact</span><b>Pool, deck and kitchen, planned together.</b><p>We plan the whole backyard with you and handle the permits.</p><span class="big">{BIZ['phone']}</span><span class="fl">Book a free visit {ARROW}</span></a>
    </div>
    <div class="mega-foot"><div class="wrap"><span>HOA paperwork done for you</span><span>Built for Florida weather</span><span>{BIZ['experience']} experience</span><a href="/services/">All services {ARROW}</a></div></div>
  </div>
</header>
<div class="scrim" aria-hidden="true"></div>
<div class="mnav" id="mnav" aria-label="Menu">
  <div class="mnav-in">
    <details class="macc"><summary>Pavers{ic('i-chev')}</summary><ul>{''.join(f'<li><a href="{svc_url(s)}">{e(s["nav"])}</a></li>' for s in PAVERS)}</ul></details>
    <details class="macc"><summary>Outdoor Living{ic('i-chev')}</summary><ul>{''.join(f'<li><a href="{svc_url(s)}">{e(s["nav"])}</a></li>' for s in LIVING)}</ul></details>
    {''.join(f'<a class="mlink" href="{h}">{t}{ic("i-arrow")}</a>' for k, h, t in NAV)}
    <a class="mlink" href="/service-area/">Service Area{ic('i-arrow')}</a>
    <a class="mlink" href="/contact/">Contact{ic('i-arrow')}</a>
    <div class="mnav-foot">
      <a class="mphone" href="tel:{BIZ['phone_e164']}"><span class="ci">{ic('i-phone')}</span><span><small>Call or WhatsApp</small><b>{BIZ['phone']}</b></span></a>
      <a class="btn btn-primary" href="/get-a-quote/">Get a free estimate {ARROW}</a>
      <div class="social" style="justify-content:center;margin-top:6px">{social()}</div>
      <p>Licensed {BIZ['licence']} · {BIZ['days']}</p>
    </div>
  </div>
</div>'''

def footer():
    li = lambda h, t: f'<li><a href="{h}">{e(t)}</a></li>'
    col = lambda t, items: f'<div><h2 class="fh">{t}</h2><ul>{"".join(items)}</ul></div>'
    return f'''<footer>
  <div class="wrap">
    <div class="f-brand">
      <a class="brand" href="/" aria-label="{BIZ['name']} home"><svg class="logo" role="img" aria-label="{BIZ['name']}"><use href="#logo"/></svg></a>
      <p>Paver driveways, patios, pool decks and outdoor living across Northeast Florida. Licensed Florida contractor {BIZ['licence']}.</p>
      <div class="social">{social()}</div>
    </div>
    {col('Pavers', [li(svc_url(s), s['nav']) for s in PAVERS])}
    {col('Outdoor living', [li(svc_url(s), s['nav']) for s in LIVING])}
    {col('Company', [li('/about/', 'About iTOP Pavers'), li('/projects/', 'Projects'), li('/styles/', 'Paver styles'), li('/service-area/', 'Service area'), li('/faq/', 'FAQ'), li('/contact/', 'Contact'), li('/get-a-quote/', 'Free estimate')])}
    <div><h2 class="fh">Contact</h2>
      <address class="nap"><a href="tel:{BIZ['phone_e164']}">{BIZ['phone']}</a><a href="mailto:{BIZ['email']}">{BIZ['email']}</a><span>{e(BIZ['street'])}<br>{BIZ['city']}, {BIZ['region']} {BIZ['zip']}</span></address>
      {hours_html()}
    </div>
    <div class="legal"><span>© {YEAR} {BIZ['legal_name']} · Licensed Florida contractor {BIZ['licence']}</span><span><a href="/privacy-policy/">Privacy Policy</a> · <a href="/terms-of-use/">Terms of Use</a> · <a href="/cookie-policy/">Cookie Policy</a></span></div>
  </div>
</footer>
<nav class="mbar" aria-label="Quick actions"><a href="tel:{BIZ['phone_e164']}">{ic('i-phone')}Call</a><a href="/get-a-quote/">Free estimate</a></nav>'''

LIGHTBOX = '''<div class="lb" id="lightbox" role="dialog" aria-modal="true" aria-label="Project photo" hidden>
  <figure><img id="lbImg" alt=""></figure>
  <div class="lb-cap" id="lbCap" aria-live="polite"></div>
  <button class="lb-btn" id="lbClose" type="button" aria-label="Close">×</button>
  <button class="lb-btn" id="lbPrev" type="button" aria-label="Previous photo"><svg aria-hidden="true"><use href="#i-right"/></svg></button>
  <button class="lb-btn" id="lbNext" type="button" aria-label="Next photo"><svg aria-hidden="true"><use href="#i-right"/></svg></button>
</div>'''

def page(path, title, desc, main, nodes, active='', noindex=False, data=None, prio='0.6', sitemap=True):
    nodes = [website_node(), business_node(), webpage_node(path, title, desc)] + nodes
    js_data = f'<script type="application/json" id="site-data">{json.dumps(data, ensure_ascii=False)}</script>' if data else ''
    doc = f'''{head(path, title, desc, nodes, noindex)}
<body>
{SPRITE}
{header(active)}
<main id="main">
{main}
</main>
{footer()}
{LIGHTBOX if 'id="projGrid"' in main else ''}
{js_data}
<script src="/assets/app.js?v={VER}" defer></script>
</body>
</html>
'''
    out = D / 'index.html' if path == '/' else (D / '404.html' if path == '/404.html' else D / path.strip('/') / 'index.html')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(doc, encoding='utf-8')
    if sitemap and not noindex: SITEMAP.append((path, prio))

# ------------------------------------------------------------------ building blocks
def crumbs_html(crumbs):
    items = ''.join(f'<li><a href="{p}">{e(n)}</a></li>' if i < len(crumbs) - 1 else f'<li aria-current="page">{e(n)}</li>' for i, (n, p) in enumerate(crumbs))
    return f'<nav class="crumbs" aria-label="Breadcrumb"><ol>{items}</ol></nav>'
def eyebrow(t): return f'<p class="eyebrow">{e(t)}</p>'
def reveal_shot():
    r = REVEAL_SHOT
    return f'''<section class="rshot" aria-labelledby="rshot-h">
    <div class="rshot-stick">
      <figure class="rshot-frame"><img src="{img(r['img'], False)}" srcset="{img(r['img'])} 720w, {img(r['img'], False)} 1600w" sizes="100vw" alt="{e(r['alt'])}" loading="lazy" decoding="async"></figure>
      <p class="rshot-pre" aria-hidden="true">{e(r['pre'])}</p>
      <div class="wrap rshot-copy">{eyebrow(r['eyebrow'])}<h2 class="display" id="rshot-h">{e(r['h2'])}</h2><p>{e(r['sub'])}</p>
        <div class="ctas"><a class="btn btn-primary" href="/projects/">See our projects {ARROW}</a><a class="btn btn-ghost" href="/get-a-quote/">Get a free estimate</a></div></div>
    </div>
  </section>'''

def sec_head(eb, h2, lede, hid=None):
    idattr = f' id="{hid}"' if hid else ''
    return f'<div class="sec-head"><div>{eyebrow(eb)}<h2 class="display"{idattr}>{h2}</h2></div><p class="lede">{lede}</p></div>'

PAVER_EDGE = ''  # brick edge strip removed (read as decorative/AI); sections meet on a clean straight line

TRUST = [('i-shield', 'Licensed contractor', f'Florida {BIZ["licence"]}'), ('i-clip', 'Permits & HOA handled', 'Engineering and approvals done for you'),
         ('i-team', 'One team, start to finish', 'Pavers, pools, kitchens & enclosures'), ('i-ruler', 'Free on-site estimate', 'Measured, detailed and in writing')]
def trust_bar():
    return '<section class="trust" aria-label="Why homeowners choose iTOP Pavers"><div class="wrap trust-in">' + ''.join(
        f'<div class="tcard"><span class="tic">{ic(i)}</span><div><b>{e(t)}</b><span>{e(d)}</span></div></div>' for i, t, d in TRUST) + '</div></section>'

def svc_card(s, h='h3'):
    alt = f'{s["name"]}: example design' if s.get('img_note') else f'{s["name"]} by iTOP Pavers'
    vis = (f'<span class="svc-ph"><img src="{img(s["img"])}" alt="{e(alt)}" loading="lazy" decoding="async"></span>' if s['img'] else ic(s['icon'], 'ic'))
    return f'<a class="svc" href="{svc_url(s)}">{ic("i-arrow", "go")}{vis}<{h}>{e(s["nav"])}</{h}><p>{e(s["card"])}</p></a>'

def services_section(h2='Built by the space you want to use.', lede='From the driveway that greets you to the pool deck you live on all summer. One local crew, one point of contact, one standard of finish.'):
    return f'''<section id="services" class="light" aria-labelledby="svc-h">
  <div class="wrap">
    {sec_head('Services', h2, lede, 'svc-h')}
    <div class="svc-group"><h3>Pavers</h3><div class="svc-grid">{''.join(svc_card(s, 'h4') for s in PAVERS)}</div></div>
    <div class="svc-group"><h3>Outdoor living</h3><div class="svc-grid">{''.join(svc_card(s, 'h4') for s in LIVING)}</div></div>
  </div>
</section>'''

def proj_tile(p, i):
    return (f'<button type="button" class="proj{" big" if p.get("big") else ""}" data-i="{i}" data-f="{e(p["t"])}" data-img="{p["img"]}" data-full="{p.get("full", 0)}" data-title="{e(p["title"])}" data-sub="{e(p["sub"])}" aria-label="View photo: {e(p["title"])}">'
            f'<img src="{img(p["img"])}" alt="{e(p["title"])}: {e(p["sub"])}, by iTOP Pavers" loading="lazy" decoding="async">'
            f'<span class="pc"><small>{e(p["t"])}</small><b>{e(p["title"])}</b><span>{e(p["sub"])}</span></span>{ic("i-arrow", "zoom")}</button>')
def projects_block(items, filters=True):
    f = ''
    if filters:
        f = '<div class="filters" id="filters" role="group" aria-label="Filter projects">' + ''.join(
            f'<button class="chip" type="button" data-f="{k}" aria-pressed="{str(i == 0).lower()}">{l}<span>{len(items) if k == "All" else sum(1 for p in items if p["t"] == k)}</span></button>' for i, (k, l) in enumerate(PROJ_FILTERS)) + '</div>'
    return f + '<div class="proj-grid" id="projGrid">' + ''.join(proj_tile(p, i) for i, p in enumerate(items)) + '</div>'

def process_section(light=True):
    steps = ''.join(f'<li class="step"><div class="n">0{i + 1}</div><h3>{e(t)}</h3><p>{e(d)}</p><span class="tag">{e(tag)}</span></li>' for i, (t, d, tag) in enumerate(PROCESS))
    adv = ''.join(f'<li>{e(a)}</li>' for a in ADVANTAGE)
    return f'''<section class="process" id="process" aria-labelledby="proc-h">
  <div class="wrap">
    {sec_head('Our process', 'Four steps. No surprises.', 'You get a clear plan and a written estimate before work begins. We take care of HOA, engineering and permit approvals and keep you updated until the job is done.', 'proc-h')}
    <ol class="steps" id="steps">{steps}</ol>
  </div>
</section>'''

def faq_list(qas):
    return '<div class="faq">' + ''.join(f'<details class="qa"{" open" if i == 0 else ""}><summary><h3>{e(q)}</h3>{ic("i-chev")}</summary><div class="qa-a"><p>{e(a)}</p></div></details>' for i, (q, a) in enumerate(qas)) + '</div>'

def map_svg():
    W, H, L0, L1, A0, A1, T = 640, 400, -81.88, -81.16, 29.82, 30.74, 14
    def P(lat, lon):
        bx, by = (lon - L0) / (L1 - L0), (A1 - lat) / (A1 - A0); sc = .74 + .26 * by
        return (W / 2 + (bx - .5) * 560 * sc, 34 + by * 300)
    f = lambda pt: f'{pt[0]:.1f},{pt[1]:.1f}'
    coast = [(30.74, -81.452), (30.62, -81.432), (30.52, -81.42), (30.40, -81.403), (30.33, -81.393), (30.28, -81.385), (30.20, -81.37), (30.10, -81.35), (30.00, -81.322), (29.90, -81.292), (29.82, -81.262)]
    river = [(30.40, -81.42), (30.39, -81.52), (30.36, -81.60), (30.32, -81.65), (30.27, -81.675), (30.18, -81.69), (30.08, -81.68), (29.98, -81.645), (29.86, -81.61)]
    nw, sw, se = P(A1, L0), P(A0, L0), P(A0, L1)
    land = ' '.join(f(p) for p in [nw] + [P(a, b) for a, b in coast] + [sw])
    grid = ''
    for i in range(1, 10):
        lo = L0 + (L1 - L0) * i / 10; a, b = P(A1, lo), P(A0, lo); grid += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>'
    for i in range(1, 8):
        la = A0 + (A1 - A0) * i / 8; a, b = P(la, L0), P(la, L1); grid += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}"/>'
    pins = [dict(name=t[0], p=P(t[1], t[2]), show=t[3], side=t[4], office=False) for t in TOWNS] + [dict(name='iTOP office', p=P(*OFFICE_LL), show=1, side='r', office=True)]
    out = ''
    for o in sorted(pins, key=lambda o: o['p'][1]):
        x, y = o['p']; hgt = 44 if o['office'] else 24
        tx = x - 9 if o['side'] == 'l' else x + 9
        lab = f'<text class="{"" if o["show"] else "hidel"}" x="{tx:.1f}" y="{y - hgt + 4:.1f}" text-anchor="{"end" if o["side"] == "l" else "start"}">{e(o["name"])}</text>'
        headm = (f'<use href="#mark" x="{x - 12:.1f}" y="{y - hgt - 14:.1f}" width="24" height="24" style="color:#EA680F"/>' if o['office']
                 else f'<rect class="head" x="{x - 4.5:.1f}" y="{y - hgt - 4.5:.1f}" width="9" height="9" transform="rotate(45 {x:.1f} {y - hgt:.1f})" fill="#EA680F"/>')
        out += (f'<g class="town{" office" if o["office"] else ""}" data-town="{e(o["name"])}"><ellipse cx="{x:.1f}" cy="{y:.1f}" rx="6" ry="2.6" fill="rgba(0,0,0,.55)"/>'
                f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x:.1f}" y2="{y - hgt:.1f}" stroke="{"#EA680F" if o["office"] else "#e8e3dc"}" stroke-width="{2.5 if o["office"] else 1.5}"/>{headm}{lab}</g>')
    def lbl(la, lo, t, c, extra=''):
        x, y = P(la, lo); return f'<text x="{x:.1f}" y="{y:.1f}" fill="{c}" font-size="11" text-anchor="middle" font-family="Poppins, sans-serif"{extra}>{t}</text>'
    rv = ' '.join(f(P(a, b)) for a, b in river)
    return (f'<svg viewBox="0 0 {W} {H + T + 10}" role="img" aria-label="Map of the iTOP Pavers service area in Northeast Florida: {e(towns_inline())}, with the office in Jacksonville.">'
            '<defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="#16232a"/><stop offset="1" stop-color="#0f171b"/></linearGradient><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a18"/><stop offset="1" stop-color="#262320"/></linearGradient></defs>'
            f'<polygon points="{f(sw)} {f(se)} {se[0]:.1f},{se[1] + T:.1f} {sw[0]:.1f},{sw[1] + T:.1f}" fill="#0a0a0a"/>'
            f'<polygon points="{" ".join(f(P(a, b)) for a, b in [(A1, L0), (A1, L1), (A0, L1), (A0, L0)])}" fill="url(#og)"/>'
            f'<polygon points="{land}" fill="url(#lg)" stroke="#4a443d" stroke-width="1.2"/><g stroke="rgba(234,104,15,.08)" stroke-width="1">{grid}</g>'
            f'<polyline points="{rv}" fill="none" stroke="#1e3a45" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<polyline points="{rv}" fill="none" stroke="#2c5866" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
            + lbl(30.47, -81.27, 'ATLANTIC', '#3d5560', ' font-weight="700" letter-spacing="3"') + lbl(30.43, -81.27, 'OCEAN', '#3d5560', ' font-weight="700" letter-spacing="3"')
            + lbl(29.96, -81.70, 'St. Johns River', '#4f6d78', ' font-style="italic"') + out + '</svg>')

def towns_list(): return '<ul class="towns" id="towns">' + ''.join(f'<li class="{"hq" if n == "Jacksonville" else ""}" data-town="{e(n)}" tabindex="0">{e(n)}</li>' for n in TOWN_NAMES) + '</ul>'

def area_card(h='h2', more=True):
    ml = f'<p class="more-link"><a href="/service-area/">More about our service area {ARROW}</a></p>' if more else ''
    return f'''<div class="card" id="area">
        {eyebrow('Service area')}
        <{h} class="display" style="font-size:clamp(26px,3vw,40px)">Rooted in Jacksonville.</{h}>
        <div class="map" id="map">{map_svg()}</div>
        {towns_list()}
        <dl class="addr"><dt>Office</dt><dd>{e(ADDRESS_ONE_LINE)}</dd><dt>Hours</dt><dd>{BIZ['days']}</dd></dl>
        {ml}
      </div>'''

def quote_form(h='h2'):
    types = ''.join(f'<label class="opt"><input type="radio" name="type" value="{e(t)}"><span>{e(t)}</span></label>' for t in QUOTE_TYPES)
    radios = lambda name, vals: ''.join(f'<label class="opt"><input type="radio" name="{name}" value="{e(v)}"><span>{e(v)}</span></label>' for v in vals)
    return f'''<section class="quote" id="quote" aria-labelledby="quote-h">
    <div class="quote-bg" aria-hidden="true"><img src="{img('patio-circle', False)}" alt="" loading="lazy" decoding="async"></div>
    <div class="wrap">
      <div>
        {eyebrow('Free estimate')}
        <{h} class="display" id="quote-h">Let’s plan your outdoor space.</{h}>
        <p class="lede">Three quick steps. We call you within one business day to book a free on-site visit and give you a detailed written estimate.</p>
        <ul class="contact-list">
          <li>{ic('i-phone')}<a class="sel" href="tel:{BIZ['phone_e164']}">{BIZ['phone']}</a></li>
          <li>{ic('i-mail')}<a class="sel" href="mailto:{BIZ['email']}">{BIZ['email']}</a></li>
          <li>{ic('i-pin')}<span>{e(ADDRESS_ONE_LINE)}</span></li>
          <li>{ic('i-clock')}<span>{BIZ['days']}</span></li>
          <li>{ic('i-shield')}<span>Licensed Florida contractor <b>{BIZ['licence']}</b></span></li>
        </ul>
      </div>
      <div class="qcard" id="qcard">
        <div class="qprog"><ol class="qsteps" id="qsteps"><li class="on">Project</li><li>Details</li><li>Contact</li></ol></div>
        <form id="qform" novalidate>
          <fieldset data-step="1">
            <legend>What are we building?</legend>
            <div class="opts" id="typeOpts" role="radiogroup" aria-label="Project type">{types}</div>
            <span class="err" id="e-type"></span>
            <span class="qlbl" id="size-l">Approximate size</span>
            <div class="opts" role="radiogroup" aria-labelledby="size-l">{radios('size', ['Under 300 sq ft', '300–600 sq ft', '600+ sq ft', 'Not sure'])}</div>
          </fieldset>
          <fieldset data-step="2" hidden>
            <legend>Your design &amp; timing</legend>
            <div id="designBox"></div>
            <span class="qlbl" id="time-l">When would you like to start?</span>
            <div class="opts" role="radiogroup" aria-labelledby="time-l">{radios('time', ['As soon as possible', '1–3 months', '3+ months', 'Just exploring'])}</div>
            <span class="err" id="e-time"></span>
            <div class="field" style="margin-top:16px"><label for="f-msg">Anything else? <span style="color:var(--muted);font-weight:500">(optional)</span></label><textarea id="f-msg" placeholder="Access, HOA, photos you can send later…"></textarea></div>
          </fieldset>
          <fieldset data-step="3" hidden>
            <legend>Where do we call you?</legend>
            <div class="frow">
              <div class="field"><label for="f-name">Full name <i>*</i></label><input id="f-name" autocomplete="name"><span class="err" id="e-name"></span></div>
              <div class="field"><label for="f-phone">Phone <i>*</i></label><input id="f-phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="(904) 555-0100 or +92 300 1234567"><span class="err" id="e-phone"></span></div>
            </div>
            <div class="frow">
              <div class="field"><label for="f-email">Email <i>*</i></label><input id="f-email" type="email" autocomplete="email"><span class="err" id="e-email"></span></div>
              <div class="field"><label for="f-zip">ZIP / postal code <i>*</i></label><input id="f-zip" autocomplete="postal-code" maxlength="10"><span class="err" id="e-zip"></span></div>
            </div>
          </fieldset>
          <div class="qnav">
            <button type="button" class="back" id="qBack" hidden>← Back</button>
            <button type="submit" class="btn btn-primary" id="qNext" style="margin-left:auto">Next {ic('i-right')}</button>
            <small>We use your details only to contact you about your project. See our <a href="/privacy-policy/">Privacy Policy</a>.</small>
          </div>
        </form>
      </div>
    </div>
  </section>'''

def styles_explorer(h='h2', hid='sx-h'):
    c0 = COLLS[0]; col0 = c0['c'][0]
    chk = lambda on: f'aria-checked="{str(on).lower()}" tabindex="{0 if on else -1}"'
    colls = ''.join(f'<button type="button" class="sx-coll" role="radio" {chk(i == 0)} data-i="{i}"><img src="{tex(c["id"], c["c"][0][0], True)}" alt="" loading="lazy"><span><b>{e(c["name"])}</b><span>{e(c["d"])}</span></span></button>' for i, c in enumerate(COLLS))
    sw = ''.join(f'<button type="button" class="sx-c" role="radio" {chk(j == 0)} aria-label="{e(x[1])}" title="{e(x[1])}"><img src="{tex(c0["id"], x[0], True)}" alt=""></button>' for j, x in enumerate(c0['c']))
    bt = lambda b: tex(b['tex'][0], b['tex'][1], True) if b['tex'] else tex(c0['id'], col0[0], True)
    bord = ''.join(f'<button type="button" class="sx-c" role="radio" {chk(k == 0)} aria-label="{b["name"]} border" title="{b["name"]}"><img src="{bt(b)}" alt=""><i>{b["name"]}</i></button>' for k, b in enumerate(BORD))
    return f'''<section class="studio" id="studio" aria-labelledby="{hid}">
    <div class="wrap">
      <div class="sec-head"><div>{eyebrow('Paver styles · 3D')}<{h} class="display" id="{hid}">Choose your pavers.</{h}></div>
        <p class="lede">These are the Tremron paver collections we install across Northeast Florida. Pick a collection, a colour blend and a border, turn the 3D sample, then add your choice to your estimate.</p></div>
      <div class="sx">
        <div class="sx-stage m3d">
          <figure class="sx-tex"><img id="sxTex" src="{tex(c0['id'], col0[0])}" alt="{e(c0['name'])} pavers in {e(col0[1])}, close-up" decoding="async" loading="lazy"></figure>
          <img class="sx-poster" src="/assets/poster-sample.webp" alt="" aria-hidden="true" decoding="async" loading="lazy">
          <canvas id="sxCanvas" data-3d aria-label="3D sample of the selected pavers with a border and the base layers underneath. Drag to rotate."></canvas>
          <div class="sx-view" role="group" aria-label="Preview mode"><button type="button" data-sxv="3d" aria-pressed="true">3D view</button><button type="button" data-sxv="photo" aria-pressed="false">Close-up photo</button></div>
          <div class="sx-hint">{ic('i-drag')}Drag to rotate</div>
          <div class="sx-label"><small id="sxColl">{e(c0['name'])}</small><b id="sxColor">{e(col0[1])}</b></div>
          <figure class="sx-inst"><img id="sxInst" src="/img/pavers/installed-{c0['id']}.webp" alt="{e(c0['name'])} pavers installed" loading="lazy" decoding="async"><figcaption id="sxInstCap">{e(c0['name'])}, installed · Photo: Tremron</figcaption></figure>
        </div>
        <div class="sx-panel">
          <div class="sp-lbl">1 · Collection</div>
          <div class="sx-colls" id="sxColls" role="radiogroup" aria-label="Paver collection">{colls}</div>
          <div class="sp-lbl">2 · Colour blend <output id="sxColorName">{e(col0[1])}</output></div>
          <div class="sx-sw" id="sxSw" role="radiogroup" aria-label="Colour blend">{sw}</div>
          <div class="sp-lbl">3 · Border <output id="sxBordName">Charcoal</output></div>
          <div class="sx-sw sx-bord" id="sxBord" role="radiogroup" aria-label="Border">{bord}</div>
          <div class="summary">Your selection<b id="sumText">{e(c0['name'])} · {e(col0[1])} · Charcoal border</b></div>
          <a class="btn btn-primary" href="/get-a-quote/" id="useDesign">Add to my estimate {ARROW}</a>
          <p class="studio-note">Product photos courtesy of Tremron. Colours vary by batch and screen; your final choice is confirmed before installation.</p>
        </div>
      </div>
    </div>
  </section>'''

def build_section():
    layers = ''.join(f'<li data-short="{e(sh)}"><span class="ln">0{i + 1}</span><div><b>{e(n)}</b><small>{e(t)}</small></div></li>' for i, (n, t, sh) in enumerate(LAYERS))
    return f'''<section class="build" id="build" aria-labelledby="build-h">
    <div class="build-track" id="buildTrack">
      <div class="wrap build-sticky">
        <div class="build-copy">
          {eyebrow('Built to last')}
          <h2 class="display" id="build-h">What’s under every iTOP patio.</h2>
          <p class="lede">A paver patio is only as good as its base. Every iTOP Pavers patio, driveway and pool deck is built in six layers, from compacted soil to sealed joints, so it stays flat through Florida heat and summer storms.</p>
          <ol class="layers" id="layers">{layers}</ol>
        </div>
        <figure class="build-stage">
          <img class="build-poster" src="/assets/poster-build.webp" alt="" aria-hidden="true" decoding="async" loading="lazy">
          <canvas id="buildCanvas" data-3d aria-label="3D exploded cross-section of a paver installation showing the six layers."></canvas>
          <figcaption class="sr">Cross-section of an iTOP Pavers installation: {e(', '.join(n for n, _, _ in LAYERS))}.</figcaption>
          <div class="ltags" id="ltags"></div>
          <div class="bprog" aria-hidden="true"><span>Assembled</span><i id="bprog"></i><span>Exploded</span></div>
        </figure>
      </div>
    </div>
  </section>'''

def patterns_block(h='h3'):
    return '<div class="pats">' + ''.join(f'<div class="pat-card"><canvas data-pat="{k}" data-col="#cdbb9c" data-u="9" aria-hidden="true"></canvas><{h}>{e(n)}</{h}><p class="best">Best for: {e(b)}</p><p>{e(d)}</p></div>' for k, n, b, d in PATTERNS) + '</div>'

def compare_table():
    th = ''.join(f'<th scope="col">{e(c)}</th>' for c in COMPARE_COLS)
    rows = ''.join(f'<tr><th scope="row">{e(r[0])}</th>' + ''.join(f'<td>{e(x)}</td>' for x in r[1:]) + '</tr>' for r in COMPARE)
    return f'<div class="tbl-wrap"><table class="cmp"><caption class="sr">Concrete pavers vs poured concrete vs travertine</caption><thead><tr><td></td>{th}</tr></thead><tbody>{rows}</tbody></table></div>'

def cta_band(text='Ready to plan your project?', sub=None):
    sub = sub or f'Free on-site consultation and a detailed written estimate. Licensed Florida contractor {BIZ["licence"]}.'
    return f'''<section class="cta-band" aria-label="Get a free estimate"><div class="wrap"><div class="cta-in"><img class="cta-bg" src="{img('driveway-gated', False)}" alt="" loading="lazy" decoding="async">
      <div><h2 class="display">{e(text)}</h2><p>{e(sub)}</p></div>
      <div class="ctas"><a class="btn btn-primary" href="/get-a-quote/">Get a free estimate {ARROW}</a><a class="btn btn-ghost" href="tel:{BIZ['phone_e164']}">{ic('i-phone')}{BIZ['phone']}</a></div>
    </div></div></section>'''

def page_hero(crumbs, eb, h1, lede, aside='', cls='', bg=None):
    bgimg = f'<div class="phero-bg" aria-hidden="true"><img src="{bg}" alt="" decoding="async" fetchpriority="low"></div>' if bg else ''
    return f'''<section class="phero {cls}" aria-labelledby="h1">{bgimg}
    <div class="wrap phero-in">
      <div class="phero-copy">{crumbs_html(crumbs)}{eyebrow(eb)}<h1 class="display" id="h1">{h1}</h1><p class="lede answer">{lede}</p>
        <div class="ctas"><a class="btn btn-primary" href="/get-a-quote/">Get a free estimate {ARROW}</a><a class="btn btn-ghost" href="tel:{BIZ['phone_e164']}">{ic('i-phone')}{BIZ['phone']}</a></div>
        <p class="lic-note">{ic('i-shield')}Licensed Florida contractor {BIZ['licence']} · {BIZ['experience']} experience</p></div>
      {aside}
    </div>
    {PAVER_EDGE}
  </section>'''

def about_teaser():
    return f'''<section class="about-t" aria-labelledby="about-h"><div class="wrap about-in">
      <figure class="about-ph"><img src="/img/fabio-sm.webp" alt="{e(BIZ['manager'])}, manager of iTOP Pavers" loading="lazy" decoding="async" width="720" height="720"><figcaption><b>{e(BIZ['manager'].split()[0])}</b><span>Manager, iTOP Pavers</span><small>{ic('i-shield')}Licensed · {BIZ['licence']}</small></figcaption></figure>
      <div>{eyebrow('About iTOP Pavers')}<h2 class="display" id="about-h">A local crew led by a builder.</h2>
        <p class="lede">{e(ABOUT['intro'])}</p>
        <ul class="ticks"><li>Licensed Florida contractor {BIZ['licence']}</li><li>{BIZ['experience']} building outdoor spaces</li><li>Pools, pavers and screen enclosures from one team</li></ul>
        <div class="ctas"><a class="btn btn-ghost" href="/about/">About iTOP Pavers {ARROW}</a></div></div>
    </div></section>'''

# ------------------------------------------------------------------ pools-standard sections
FINDER = {
    'space': [('driveway', 'Driveway', 'Driveway', 'h45'), ('patio', 'Patio', 'Patio', 'h90'), ('pool', 'Pool deck', 'Pool deck', 'h90'), ('walkway', 'Walkway', 'Walkway', 'bond')],
    'look': [('classic', 'Classic, tumbled', 'olde-towne'), ('large', 'Large & relaxed', 'mega-olde-towne'), ('modern', 'Smooth & modern', 'park-plaza'), ('stone', 'Natural stone', 'stonehurst'), ('brick', 'Classic brick', 'brick')],
    'tone': [('warm', 'Warm', ['autumn-blend', 'sand-dune', 'tan', 'heritage', 'santa-fe']), ('neutral', 'Neutral', ['sierra', 'sandstone', 'taupe', 'natural', 'white']), ('cool', 'Cool grey', ['glacier', 'granite', 'charcoal', 'lions-bridge'])],
}
PAT_NAME = {k: n for k, n, _, _ in PATTERNS}
def finder_pick(space, look, tone):
    sp = next(x for x in FINDER['space'] if x[0] == space); lk = next(x for x in FINDER['look'] if x[0] == look); tn = next(x for x in FINDER['tone'] if x[0] == tone)
    c = next(x for x in COLLS if x['id'] == lk[2]); col = next((x for t in tn[2] for x in c['c'] if x[0] == t), c['c'][0])
    layout = PAT_NAME[sp[3]] if c['id'] in ('brick', 'park-plaza') else 'Multi-size layout, planned with you'
    return c, col, layout, sp
def finder_section():
    q = lambda key, title, n, opts: (f'<fieldset class="fd-q" data-k="{key}"><legend><span class="fd-n">0{n} / 03</span>{title}</legend><div class="fd-opts">'
        + ''.join(f'<label class="fd-o"><input type="radio" name="fd-{key}" value="{o[0]}"{attr(key, o)}{" checked" if i == 0 else ""}><span>{e(o[1])}</span></label>' for i, o in enumerate(opts)) + '</div></fieldset>')
    def attr(key, o):
        if key == 'space': return f' data-type="{e(o[2])}" data-pat="{e(PAT_NAME[o[3]])}"'
        if key == 'look': return f' data-coll="{o[2]}"'
        return f' data-tones="{",".join(o[2])}"'
    c, col, layout, sp = finder_pick('driveway', 'classic', 'warm')
    return f"""<section class="finder light" id="finder" aria-labelledby="fd-h">
  <div class="wrap">
    {sec_head('Paver finder', 'Find your paver in three questions.', 'Answer three quick questions and we’ll suggest a Tremron collection, colour blend and layout to start from. Then see it in 3D or add it to your estimate.', 'fd-h')}
    <div class="fd">
      <form class="fd-card" id="finderForm" onsubmit="return false">
        {q('space', 'Where are the pavers going?', 1, FINDER['space'])}
        {q('look', 'Which look do you like?', 2, FINDER['look'])}
        {q('tone', 'Warm, neutral or cool?', 3, FINDER['tone'])}
      </form>
      <div class="fd-res" id="finderRes" aria-live="polite">
        <img id="fdImg" src="{tex(c['id'], col[0])}" alt="{e(c['name'])} pavers in {e(col[1])}" loading="lazy" decoding="async">
        <div class="fd-res-in">
          <p class="fd-tag">A good place to start</p>
          <p class="fd-name" id="fdName">{e(c['name'])} · {e(col[1])}</p>
          <p class="fd-d" id="fdDesc">{e(c['d'])}</p>
          <dl class="fd-spec"><div><dt>Space</dt><dd id="fdSpace">{e(sp[1])}</dd></div><div><dt>Collection</dt><dd id="fdColl">{e(c['name'])}</dd></div><div><dt>Colour</dt><dd id="fdCol">{e(col[1])}</dd></div><div><dt>Layout</dt><dd id="fdLay">{e(layout)}</dd></div></dl>
          <div class="ctas"><a class="btn btn-primary" href="#studio" id="fd3d">See it in 3D {ARROW}</a><a class="btn btn-ghost" href="/get-a-quote/" id="fdAdd">Add to my estimate</a></div>
          <p class="fd-note">Suggestions only. We confirm the right paver and pattern with real samples at your free visit.</p>
        </div>
      </div>
    </div>
  </div>
</section>"""

def why_section():
    stats = [('10+', 'years', 'Building outdoor spaces in Northeast Florida', 'dark'), ('10', 'services', 'Pavers, pools, kitchens and enclosures from one team', ''),
             (str(len(TOWN_NAMES)), 'towns', 'Served from our Jacksonville office', ''), ('6', 'layers', 'Under every patio, driveway and pool deck', 'dark')]
    cards = ''.join(f'<div class="bento {cls}"><p class="big">{n}<span>{u}</span></p><p>{e(d)}</p></div>' for n, u, d, cls in stats)
    rows = [('Free on-site consultation', 'Measured, with a detailed written estimate'), ('HOA, engineering & permits', 'We take care of the approvals'),
            ('One team for the whole backyard', 'Pavers, pools, kitchens, pergolas & enclosures'), ('Licensed Florida contractor', BIZ['licence']),
            ('Tremron paver collections', '5 collections, many colour blends'), ('Office hours', 'Mon–Fri 8–6 · Sat 9–1')]
    tbl = ''.join(f'<tr><th scope="row">{e(a)}</th><td><span class="ok" aria-hidden="true">✓</span>{e(b)}</td></tr>' for a, b in rows)
    return f"""<section class="why-sec" aria-labelledby="why-h">
  <div class="wrap">
    {sec_head('Why iTOP Pavers', 'Why homeowners choose iTOP Pavers.', 'A licensed local contractor with its own Jacksonville office, a clear process and one team from the first visit to the final inspection.', 'why-h')}
    <div class="why-grid">
      <div class="bentos">{cards}</div>
      <div class="why-tbl"><table><caption class="sr">What you get with iTOP Pavers</caption><thead><tr><th scope="col">What you get</th><th scope="col">With iTOP Pavers</th></tr></thead><tbody>{tbl}</tbody></table></div>
    </div>
  </div>
</section>"""

def hero_stats():
    items = [('10+ years', 'Building outdoor spaces'), ('Licensed', f'Florida {BIZ["licence"]}'), ('Permits & HOA', 'Handled for you'), ('Free estimate', 'On-site, measured, in writing')]
    return '<div class="wrap hero-stats" role="list">' + ''.join(f'<div role="listitem"><b>{e(a)}</b><span>{e(b)}</span></div>' for a, b in items) + '</div>'

def js_data(proj=True, styles=False, hero=False):
    d = {}
    if proj: d['proj'] = PROJ
    if styles: d['colls'] = COLLS; d['bord'] = BORD
    if hero: d['hero'] = [dict(img=a, full=b, t=c, q=q, title=t, sub=s) for a, b, c, q, t, s in HERO_SLIDES]
    return d

# ------------------------------------------------------------------ pages
def p_home():
    def slide(i, a, full, t, s):
        pr = '' if i == 0 else 'loading="lazy"'
        srcset = f' srcset="{img(a)} 720w, {img(a, False)} 1600w" sizes="(max-width:1100px) 92vw, 56vw"' if full else ''
        return f'<figure class="show-slide{" on" if i == 0 else ""}" aria-hidden="{str(i != 0).lower()}"><img src="{img(a, not full)}"{srcset} alt="{e(t)}: {e(s)}, by iTOP Pavers" {pr} decoding="async" draggable="false"></figure>'
    slides = ''.join(slide(i, a, full, t, s) for i, (a, full, tg, q, t, s) in enumerate(HERO_SLIDES))
    bars = ''.join(f'<i class="{"on" if i == 0 else ""}"><b></b></i>' for i in range(len(HERO_SLIDES)))
    a, full, tg, q, t, s = HERO_SLIDES[0]
    cap = f'<small>{e(tg)} · Recent iTOP job</small><b>{e(t)}</b><span>{e(s)}</span><a class="btn btn-primary" href="/get-a-quote/" data-q="{e(q)}">Get an estimate like this {ARROW}</a>'
    thumbs = ''.join(f'<button type="button" aria-label="Show {e(t)}" aria-pressed="{str(i == 0).lower()}"><img src="{img(a)}" alt="" loading="lazy" decoding="async"><span>{e(tg)}</span></button>' for i, (a, full, tg, q, t, s) in enumerate(HERO_SLIDES))
    spots = ''.join(f'<li><button type="button" data-spot="{s["id"]}" data-type="{e(s["type"])}" data-text="{e(s["text"])}"><span class="n">{i + 1}</span>{e(s["name"])}</button></li>' for i, s in enumerate(HERO_SPOTS))
    main = f'''<section class="hero3d" aria-labelledby="h1">
    <div class="h3d-stage" id="heroStage">
      <picture class="h3d-poster" aria-hidden="true"><source media="(max-width:980px)" srcset="/assets/hero3d-poster-sm.webp"><img src="/assets/hero3d-poster.webp" alt="" fetchpriority="high" decoding="async"></picture>
      <canvas id="heroCanvas" data-3d data-hero3d aria-label="Interactive 3D backyard by iTOP Pavers: paver patio, pool deck, outdoor kitchen with pergola, and fire pit. Drag to look around."></canvas>
      <div class="pins" id="heroPins"></div>
      <button class="exit-view" id="exitView" type="button" hidden>{ic('i-right')}Back to whole yard<kbd>Esc</kbd></button>
    </div>
    <div class="h3d-shade" aria-hidden="true"></div>
    <div class="wrap h3d-grid">
      <div class="h3d-copy">
        {eyebrow('Paver contractor · Northeast Florida')}
        <h1 id="h1" class="display">Crafting unique <em>outdoor</em> spaces.</h1>
        <p class="lede">Paver patios, driveways, pool decks and complete outdoor living across Jacksonville, St.&nbsp;Augustine and St.&nbsp;Johns County. Planned with you and built by our own crew.</p>
        <div class="ctas"><a class="btn btn-primary" href="/get-a-quote/">Get a free estimate {ARROW}</a><a class="btn btn-ghost" href="#studio">Design yours in 3D {ic('i-down')}</a></div>
        <ul class="h3d-proof"><li>Licensed <b>{BIZ['licence']}</b></li><li><b>{BIZ['experience']}</b> building outdoor spaces</li><li>Free on-site estimates</li></ul>
      </div>
    </div>
    <aside class="h3d-explore" id="explore" aria-label="Explore the 3D backyard">
      <div class="ex-head"><p class="ex-title">Explore the yard</p>
        <div class="seg" role="group" aria-label="Time of day"><button type="button" data-tod="1" aria-pressed="true">{ic('i-moon')}Dusk</button><button type="button" data-tod="0" aria-pressed="false">{ic('i-sun')}Day</button></div></div>
      <ul class="ex-list" id="exList">{spots}</ul>
      <div class="ex-detail" id="exDetail" aria-live="polite">
        <div class="ex-nav"><button class="ex-back" type="button" id="exBack">{ic('i-right')}Whole yard</button><button class="ex-next" type="button" id="exNext">Next {ic('i-right')}</button></div>
        <p class="ex-h" id="exTitle"></p><p id="exText"></p>
        <a class="btn btn-primary" href="#quote" id="exCta">Price this feature {ARROW}</a>
      </div>
      <div class="ex-foot"><span>{ic('i-drag')}Drag to look around</span><a href="#studio">Choose your pavers {ic('i-down')}</a></div>
    </aside>
  </section>
  {reveal_shot()}
  {services_section()}
  {styles_explorer()}
  {finder_section()}
  {build_section()}
  <section id="projects" class="light" aria-labelledby="proj-h">
    <div class="wrap">
      {sec_head('Recent work', 'Real yards. Real Northeast Florida.', 'Driveways, pool decks, patios and entries built by our own crew. Tap any photo to see it larger.', 'proj-h')}
      <div class="strip-wrap">{projects_block(PROJ[:8], filters=False)}</div>
      <div class="proj-more"><p>Planning something similar? We’ll visit, measure and give you a detailed estimate, free.</p><a class="btn btn-primary" href="/projects/">See all projects {ARROW}</a></div>
    </div>
  </section>
  {why_section()}
  {about_teaser()}
  {process_section()}
  <section id="reviews" class="light" aria-labelledby="rev-h">
    <div class="wrap duo">
      <div class="card rev-card">
        <div class="rev-in">{eyebrow('Reviews')}<h2 class="display" id="rev-h" style="font-size:clamp(26px,3vw,40px)">Hear it from our homeowners.</h2>
          <p class="lede">Read what Jacksonville and St. Johns County homeowners say about working with our crew, in their own words on Google.</p>
          <div class="ctas"><a class="btn btn-primary" href="{BIZ['google_reviews']}" target="_blank" rel="noopener">Read our Google reviews {ARROW}</a></div></div>
        <figure class="rev-photo"><img src="{img('patio-firepit-lake')}" alt="Lakeside paver patio with fire pit and seat wall by iTOP Pavers" loading="lazy" decoding="async"><figcaption>Lakeside fire pit &amp; seat wall · iTOP Pavers</figcaption></figure>
      </div>
      {area_card()}
    </div>
  </section>
  <section id="faq" aria-labelledby="faq-h"><div class="wrap faq-wrap">
    <div class="faq-side">{eyebrow('FAQ')}<h2 class="display" id="faq-h">Questions homeowners ask us.</h2><p class="lede">Straight answers about pavers, permits, timing and what the free estimate includes.</p><div class="ctas"><a class="btn btn-primary" href="tel:{BIZ['phone_e164']}">{ic('i-phone')}Call {BIZ['phone']}</a><a class="btn btn-ghost" href="/faq/">All questions {ARROW}</a></div></div>
    {faq_list(HOME_FAQ)}
  </div></section>
  {quote_form()}'''
    page('/', 'Paver Contractor in Jacksonville, FL | iTOP Pavers',
         'iTOP Pavers builds paver patios, driveways, pool decks and outdoor living across Jacksonville, St. Augustine and St. Johns County. Licensed CBC 1294954.',
         main, [service_node(s) for s in SERVICES] + [faq_node(HOME_FAQ, '/')], data=js_data(True, True, True), prio='1.0')

def p_services():
    crumbs = [('Home', '/'), ('Services', '/services/')]
    main = page_hero(crumbs, 'Services', 'Paver & outdoor living services in Northeast Florida',
                     'iTOP Pavers designs and builds paver patios, driveways, pool decks and walkways, plus outdoor living: fiberglass pools, outdoor kitchens, pergolas, fire pits and screen enclosures. We work across Jacksonville, St. Augustine and St. Johns County, with one team and free estimates.', bg=img('driveway-gated', False))
    main += services_section('Pavers and outdoor living, from one team.', 'Choose a service to see what is included, how we build it and answers to common questions.')
    main += process_section() + cta_band()
    page('/services/', 'Paver & Outdoor Living Services | iTOP Pavers Jacksonville',
         'Paver patios, driveways, pool decks, walkways, maintenance, fiberglass pools, outdoor kitchens, pergolas, fire pits and screen enclosures in Northeast Florida.',
         main, [service_node(s) for s in SERVICES] + [crumbs_node(crumbs)], prio='0.9')

def p_service(s):
    crumbs = [('Home', '/'), ('Services', '/services/'), (s['name'], svc_url(s))]
    photos = [p for p in PROJ if p['svc'] == s['slug']] or [p for p in PROJ if s['img'] and p['img'] == s['img']]
    big = bool(s['img']) and (R / 'assets' / 'photos' / f"{s['img']}.webp").exists()
    note = s.get('img_note', 'Recent iTOP job')
    alt = f'{s["name"]}: example design' if s.get('img_note') else f'{s["name"]} by iTOP Pavers'
    aside = (f'<figure class="phero-ph"><img src="{img(s["img"], not big)}" alt="{e(alt)}" fetchpriority="high" decoding="async"><figcaption>{e(note)}</figcaption></figure>'
             if s['img'] else f'<div class="phero-ic">{ic(s["icon"])}<p>{e(s["card"])}</p></div>')
    why = ''.join(f'<li><b>{e(t)}</b><span>{e(d)}</span></li>' for t, d in s['why'])
    inc = ''.join(f'<li>{e(x)}</li>' for x in s['included'])
    proc = PAVER_PROCESS if s['group'] == 'Pavers' else LIVING_PROCESS
    steps = ''.join(f'<li class="step"><div class="n">0{i + 1}</div><h3>{e(t)}</h3><p>{e(d)}</p></li>' for i, (t, d) in enumerate(proc))
    related = [x for x in SERVICES if x['group'] == s['group'] and x['slug'] != s['slug']][:4]
    extra = ''
    if s['group'] == 'Pavers' and s['slug'] != 'paving-maintenance':
        extra += f'<section class="sec-tight light" aria-labelledby="pat-h"><div class="wrap">{sec_head("Laying patterns", "Four patterns, four looks.", "The pattern changes how strong and how busy the surface feels. Here is where each one works best.", "pat-h")}{patterns_block()}</div></section>'
    if s['slug'] in ('pool-decks', 'patios'):
        extra += f'<section class="sec-tight" aria-labelledby="cmp-h"><div class="wrap">{sec_head("Compare materials", "Pavers vs concrete vs travertine.", "A quick, honest comparison of the three most common patio and pool deck surfaces in Florida.", "cmp-h")}{compare_table()}</div></section>'
    gallery = ''
    if photos:
        gallery = f'<section class="sec-tight" aria-labelledby="gal-h"><div class="wrap">{sec_head("Recent work", e(s["nav"]) + " we have built.", "Real iTOP Pavers jobs in Northeast Florida. Tap a photo to see it larger.", "gal-h")}{projects_block(photos, filters=False)}<div class="proj-more"><p>See driveways, pool decks, patios and more.</p><a class="btn btn-ghost" href="/projects/">All projects {ARROW}</a></div></div></section>'
    main = page_hero(crumbs, s['group'], e(s['h1']), e(s['answer']), aside, bg=img(s['img']) if s['img'] else None)
    main += f'''<section class="svc-body light" aria-labelledby="inc-h"><div class="wrap svc-cols">
      <div>
        <h2 class="display h-md" id="inc-h">What’s included</h2>
        <ul class="ticks big">{inc}</ul>
        <h2 class="display h-md">Why choose iTOP Pavers</h2>
        <ul class="why">{why}</ul>
      </div>
      <aside class="svc-aside" aria-label="Free estimate">
        <p class="eyebrow">Free estimate</p><p class="aside-h">Plan your project with us.</p>
        <p>We visit, measure and give you a detailed written estimate, with no obligation.</p>
        <a class="btn btn-primary" href="/get-a-quote/" data-q="{e(s['type'])}">Get a free estimate {ARROW}</a>
        <a class="aside-call" href="tel:{BIZ['phone_e164']}">{ic('i-phone')}{BIZ['phone']}</a>
        <p class="lic-note">{ic('i-shield')}Licensed Florida contractor {BIZ['licence']}</p>
      </aside>
    </div></section>
    <section class="process sec-tight" aria-labelledby="sp-h"><div class="wrap">{sec_head('How we work', 'Our ' + e(s['nav'].lower()) + ' process.', 'Simple, seamless and stress-free, from the first visit to the final inspection.', 'sp-h')}<ol class="steps" id="steps">{steps}</ol></div></section>
    {extra}{gallery}
    <section class="sec-tight light" aria-labelledby="sfaq-h"><div class="wrap faq-wrap">
      <div class="faq-side">{eyebrow('FAQ')}<h2 class="display" id="sfaq-h">{e(s['nav'])}: common questions.</h2><p class="more-link"><a href="/faq/">All questions and answers {ARROW}</a></p></div>
      {faq_list(s['faqs'])}
    </div></section>
    <section class="sec-tight" aria-labelledby="rel-h"><div class="wrap">{sec_head('Related services', 'Often built together.', 'Many of our projects combine several of these, planned and built by one team.', 'rel-h')}<div class="svc-grid rel">{''.join(svc_card(x) for x in related)}</div></div></section>
    {cta_band('Ready to plan your ' + s['name'].lower() + ' project?')}'''
    page(svc_url(s), s['title'], s['desc'], main, [service_node(s), faq_node(s['faqs'], svc_url(s)), crumbs_node(crumbs)], active=s['group'], data=js_data(True), prio='0.9')

def p_styles():
    crumbs = [('Home', '/'), ('Paver styles', '/styles/')]
    main = page_hero(crumbs, 'Paver styles', 'Paver styles, colours & patterns',
                     'iTOP Pavers installs Tremron concrete pavers in five collections: Olde Towne, Mega Olde Towne, Park Plaza, Stonehurst and 4×8 Brick, each in several colour blends. Choose a collection and colour below, see it on a 3D sample with a border, and compare pavers with concrete and travertine.', cls='short edge-dark', bg='/img/pavers/installed-olde-towne.webp')
    main += styles_explorer('h2', 'sx-h2')
    main += f'''<section class="sec-tight light" aria-labelledby="pat-h"><div class="wrap">{sec_head('Laying patterns', 'Four patterns, four looks.', 'The pattern changes how strong and how busy the surface feels. Here is where each one works best.', 'pat-h')}{patterns_block()}</div></section>
    <section class="sec-tight" aria-labelledby="cmp-h"><div class="wrap">{sec_head('Compare materials', 'Pavers vs concrete vs travertine.', 'A quick, honest comparison of the three most common patio and pool deck surfaces in Florida.', 'cmp-h')}{compare_table()}</div></section>
    <section class="sec-tight light" aria-labelledby="col-h"><div class="wrap">{sec_head('Collections', 'The five Tremron collections we install.', 'Every collection comes in several colour blends. We help you choose at your free consultation.', 'col-h')}
      <div class="colls">{''.join(f'<div class="coll"><img src="{tex(c["id"], c["c"][0][0])}" alt="{e(c["name"])} pavers in {e(c["c"][0][1])}" loading="lazy" decoding="async"><h3>{e(c["name"])}</h3><p>{e(c["d"])}</p><p class="blends">Colour blends: {e(", ".join(x[1] for x in c["c"]))}</p></div>' for c in COLLS)}</div></div></section>
    {cta_band('Found a style you like?')}'''
    page('/styles/', 'Paver Styles, Colours & Patterns | iTOP Pavers Jacksonville',
         'Browse Tremron paver collections and colour blends, see them in 3D, compare laying patterns and pavers vs concrete vs travertine. iTOP Pavers, Jacksonville.',
         main, [crumbs_node(crumbs)], active='styles', data=js_data(False, True), prio='0.8')

def p_projects():
    crumbs = [('Home', '/'), ('Projects', '/projects/')]
    main = page_hero(crumbs, 'Projects', 'Paver projects in Northeast Florida',
                     'These are real iTOP Pavers jobs: paver driveways, pool decks, patios, front entries and a screen enclosure, built by our own crew for homeowners across Northeast Florida. Filter by the space you are planning and tap any photo to see it larger.', cls='short', bg=img('patio-circle', False))
    main += f'<section class="sec-tight light" aria-label="Project gallery"><div class="wrap">{projects_block(PROJ)}</div></section>' + cta_band('Planning something similar?')
    gal = {'@type': 'ImageGallery', '@id': U('/projects/#gallery'), 'name': 'iTOP Pavers projects', 'image': [{'@type': 'ImageObject', 'contentUrl': U(img(p['img'], not p.get('full'))), 'name': p['title'], 'description': p['sub']} for p in PROJ]}
    page('/projects/', 'Paver Projects in Jacksonville & NE Florida | iTOP Pavers',
         'Real iTOP Pavers projects: paver driveways, pool decks, patios, entries and screen enclosures across Jacksonville and Northeast Florida. See the photos.',
         main, [crumbs_node(crumbs), gal], active='projects', data=js_data(True), prio='0.8')

def p_about():
    crumbs = [('Home', '/'), ('About', '/about/')]
    aside = f'<figure class="phero-ph portrait"><img src="/img/fabio.webp" alt="{e(BIZ["manager"])}, manager of iTOP Pavers" fetchpriority="high" decoding="async"><figcaption>{e(BIZ["manager"])} · Manager</figcaption></figure>'
    main = page_hero(crumbs, 'About iTOP Pavers', 'A licensed paver contractor led by a builder',
                     f'iTOP Pavers is a licensed Florida contractor ({BIZ["licence"]}) based in Jacksonville, building paver driveways, patios, pool decks and outdoor living spaces across Northeast Florida. The company is led by manager {BIZ["manager"]}, who has worked in construction since the early 2000s.', aside)
    story = ''.join(f'<p>{e(p)}</p>' for p in ABOUT['story'])
    diff = [('One team for the whole backyard', 'Pavers, fiberglass pools, outdoor kitchens, pergolas and screen enclosures, planned together.'),
            ('Approvals handled', 'We take care of HOA, engineering and permit approvals.'),
            ('Built from the base up', 'A six-layer installation that stays flat through Florida heat and storms.'),
            ('Licensed and local', f'Florida contractor {BIZ["licence"]}, with an office in Jacksonville.')]
    main += f'''<section class="svc-body light" aria-labelledby="story-h"><div class="wrap svc-cols">
      <div class="prose-lite"><h2 class="display h-md" id="story-h">How it all began</h2><p class="lede">{e(ABOUT['intro'])}</p>{story}
        <h2 class="display h-md">What makes iTOP different</h2><ul class="why">{''.join(f'<li><b>{e(t)}</b><span>{e(d)}</span></li>' for t, d in diff)}</ul></div>
      <aside class="svc-aside" aria-label="Company details"><p class="eyebrow">Company details</p><p class="aside-h">{BIZ['legal_name']}</p>
        <address class="nap"><span>{e(BIZ['street'])}<br>{BIZ['city']}, {BIZ['region']} {BIZ['zip']}</span><a href="tel:{BIZ['phone_e164']}">{BIZ['phone']}</a><a href="mailto:{BIZ['email']}">{BIZ['email']}</a></address>
        {hours_html()}
        <p class="lic-note">{ic('i-shield')}Licensed Florida contractor {BIZ['licence']}</p>
        <a class="btn btn-primary" href="/get-a-quote/">Get a free estimate {ARROW}</a></aside>
    </div></section>
    {process_section()}{cta_band()}'''
    person = {'@type': 'Person', '@id': U('/about/#manager'), 'name': BIZ['manager'], 'jobTitle': 'Manager', 'worksFor': {'@id': BID}, 'image': U('/img/fabio.webp')}
    page('/about/', 'About iTOP Pavers | Licensed Paver Contractor, Jacksonville',
         f'Meet iTOP Pavers: a licensed Florida contractor ({BIZ["licence"]}) in Jacksonville, led by {BIZ["manager"]}, building patios, driveways and pool decks.',
         main, [crumbs_node(crumbs), person], active='about', prio='0.7')

def p_area():
    crumbs = [('Home', '/'), ('Service area', '/service-area/')]
    main = page_hero(crumbs, 'Service area', 'Paver contractor serving Northeast Florida',
                     f'iTOP Pavers serves homeowners across Northeast Florida from our office in Jacksonville, including {e(towns_inline())}. We build paver patios, driveways, pool decks and outdoor living spaces throughout {e(", ".join(COUNTIES[:-1]))} and {COUNTIES[-1]}.', cls='short', bg=img('driveway-long'))
    # TODO(client): confirm towns + counties; add town pages only with genuinely local content (permits, soil, real local jobs).
    main += f'''<section class="sec-tight light" aria-label="Map and towns"><div class="wrap duo">{area_card('h2', more=False)}
      <div class="card"><p class="eyebrow">Not on the list?</p><h2 class="display" style="font-size:clamp(24px,2.6vw,34px)">Call and ask.</h2>
        <p class="lede">If you are in Northeast Florida but don’t see your town, call {BIZ['phone']}. We’ll tell you straight away whether we can take on your project.</p>
        <h3 class="h-sm">Services we offer in every town</h3><ul class="ticks">{''.join(f'<li><a href="{svc_url(s)}">{e(s["name"])}</a></li>' for s in SERVICES)}</ul></div>
    </div></section>{cta_band()}'''
    page('/service-area/', 'Service Area: Jacksonville & NE Florida | iTOP Pavers',
         'iTOP Pavers serves Jacksonville, St. Augustine, Ponte Vedra Beach, Nocatee, St. Johns, Orange Park, Fernandina Beach and nearby Northeast Florida towns.',
         main, [crumbs_node(crumbs)], prio='0.7')

def p_faq():
    crumbs = [('Home', '/'), ('FAQ', '/faq/')]
    groups = [('General questions', FAQ, None)] + [(s['name'], s['faqs'], s) for s in SERVICES]
    toc = ''.join(f'<li><a href="#faq-{i}">{e(n)}</a></li>' for i, (n, _, _) in enumerate(groups))
    def grp(i, n, qs, s):
        more = f'<p class="more-link"><a href="{svc_url(s)}">More about {e(s["name"].lower())} {ARROW}</a></p>' if s else ''
        return f'<section class="faq-group" id="faq-{i}" aria-labelledby="fg-{i}"><h2 class="display h-md" id="fg-{i}">{e(n)}</h2>{faq_list(qs)}{more}</section>'
    body = ''.join(grp(i, n, qs, s) for i, (n, qs, s) in enumerate(groups))
    main = page_hero(crumbs, 'FAQ', 'Paver & outdoor living questions, answered',
                     'Straight answers from iTOP Pavers to the questions Northeast Florida homeowners ask most: pavers vs concrete, Florida heat and rain, permits and HOA approval, timing, maintenance, warranty and payment, plus questions about each of our services.', cls='short', bg=img('pool-deck'))
    main += f'<section class="sec-tight light"><div class="wrap faq-page"><nav class="faq-toc" aria-label="FAQ topics"><p class="eyebrow">Topics</p><ul>{toc}</ul></nav><div>{body}</div></div></section>'
    main += cta_band('Still have a question?', f'Call {BIZ["phone"]} or ask during your free on-site consultation.')
    allq = [qa for _, qs, _ in groups for qa in qs]
    page('/faq/', 'Paver FAQ: Patios, Driveways & Pool Decks | iTOP Pavers',
         'Answers to common questions about paver patios, driveways, pool decks, permits, HOA, maintenance, warranty and financing in Northeast Florida. iTOP Pavers.',
         main, [faq_node(allq, '/faq/'), crumbs_node(crumbs)], active='faq', prio='0.8')

def p_contact():
    crumbs = [('Home', '/'), ('Contact', '/contact/')]
    maps = 'https://www.google.com/maps/search/?api=1&query=' + ADDRESS_ONE_LINE.replace(' ', '+').replace(',', '%2C')
    main = page_hero(crumbs, 'Contact', 'Contact iTOP Pavers',
                     f'Call or WhatsApp iTOP Pavers on {BIZ["phone"]}, email {BIZ["email"]}, or visit our office at {e(ADDRESS_ONE_LINE)}. The office is open Monday to Friday 8 am to 6 pm and Saturday 9 am to 1 pm, and we offer free on-site estimates.', cls='short', bg=img('front-entry'))
    cards = [('i-phone', 'Call or WhatsApp', f'<a href="tel:{BIZ["phone_e164"]}">{BIZ["phone"]}</a>'), ('i-mail', 'Email', f'<a href="mailto:{BIZ["email"]}">{BIZ["email"]}</a>'),
             ('i-pin', 'Office', f'{e(BIZ["street"])}<br>{BIZ["city"]}, {BIZ["region"]} {BIZ["zip"]}<br><a href="{e(maps)}" target="_blank" rel="noopener">Open in Google Maps</a>'), ('i-clock', 'Office hours', hours_html())]
    main += '<section class="sec-tight light" aria-label="Contact details"><div class="wrap"><div class="contact-cards">' + ''.join(f'<div class="cc">{ic(i)}<h2>{t}</h2><div>{v}</div></div>' for i, t, v in cards) + '</div></div></section>'
    main += quote_form('h2')
    page('/contact/', 'Contact iTOP Pavers | (904) 525-9191 | Jacksonville, FL',
         f'Call or WhatsApp {BIZ["phone"]}, email {BIZ["email"]} or visit 6510 Columbia Park Dr, Jacksonville. Office Mon–Fri 8–6, Sat 9–1. Free on-site estimates.',
         main, [crumbs_node(crumbs)], data=js_data(False, True), prio='0.7')

def p_quote():
    crumbs = [('Home', '/'), ('Free estimate', '/get-a-quote/')]
    main = page_hero(crumbs, 'Free estimate', 'Get a free paver estimate',
                     'Tell iTOP Pavers what you are planning in three quick steps. We call you within one business day to book a free on-site consultation, measure the space and give you a detailed written estimate, with no obligation.', cls='short edge-dark', bg=img('driveway-curved'))
    main += quote_form('h2')
    page('/get-a-quote/', 'Free Paver Estimate in Jacksonville, FL | iTOP Pavers',
         'Request a free on-site estimate for a paver patio, driveway, pool deck or outdoor living project in Northeast Florida. We call within one business day.',
         main, [crumbs_node(crumbs)], data=js_data(False, True), prio='0.8')

def legal_html(slug):
    h = read(f'src/content/legal/{slug}.html')
    h = re.sub(r'<strong>\s*<strong>(.*?)</strong>\s*</strong>', r'<strong>\1</strong>', h, flags=re.S)
    h = re.sub(r'^\s*<h1>.*?</h1>\s*(<h2>.*?</h2>)?', '', h, count=1, flags=re.S)
    h = re.sub(r'<h3>\s*(PRIVACY POLICY|COOKIE POLICY|TERMS OF USE)\s*</h3>', '', h, flags=re.I)
    h = re.sub(r'<h3>\s*TABLE OF CONTENTS\s*</h3>.*?(?=<h3>)', '', h, count=1, flags=re.S | re.I)
    h = re.sub(r'<h4>', '<h3>', h); h = re.sub(r'</h4>', '</h3>', h)
    h = re.sub(r'<h3>(?=[^<]*(\d+\.|SUMMARY))', '<h2>', h)
    h = re.sub(r'<h2>([^<]*)</h3>', r'<h2>\1</h2>', h)
    h = h.replace('<h1>', '<h2>').replace('</h1>', '</h2>')
    h = re.sub(r'<h3>([^<a-z]*[A-Z][^<a-z]*)</h3>', r'<h2></h2>', h)   # ALL-CAPS section titles are top-level sections
    if slug == 'terms-of-use':
        # Documented factual corrections (the old Terms were a template from another business). Client's lawyer to review.
        h = h.replace('We provide professional residential and commercial cleaning services. We offer regular cleaning, deep cleaning, move-i/move-out cleaning, office cleaning and Airbnb cleaning.',
                      'We provide paver and outdoor living construction services, including paver patios, driveways, pool decks, walkways, paving maintenance, fiberglass pools, outdoor kitchens, pergolas and gazebos, retaining walls and fire pits, and screen enclosures.')
        h = h.replace('+1 (951) 719-0366', '(904) 525-9191')
    return h

def p_legal(slug, title_short, title):
    crumbs = [('Home', '/'), (title_short, f'/{slug}/')]
    main = f'''<section class="phero short legal-h" aria-labelledby="h1"><div class="wrap">{crumbs_html(crumbs)}<h1 class="display" id="h1">{e(title_short)}</h1><p class="lede">{BIZ['legal_name']} · {e(ADDRESS_ONE_LINE)}</p></div></section>
    <section class="sec-tight light"><div class="wrap"><article class="prose">{legal_html(slug)}</article></div></section>'''
    page(f'/{slug}/', title, f'{title_short} for the iTOP Pavers website, operated by iTop Pavers LLC, 6510 Columbia Park Dr, Suite 206, Jacksonville, FL 32258.', main, [crumbs_node(crumbs)], prio='0.2')

def p_thanks(slug, h1):
    main = f'''<section class="phero short center" aria-labelledby="h1"><div class="wrap"><h1 class="display" id="h1">{e(h1)}</h1>
      <p class="lede">We’ll call you within one business day to book your free on-site visit. Need us sooner? Call or WhatsApp {BIZ['phone']}.</p>
      <div class="ctas" style="justify-content:center"><a class="btn btn-primary" href="/">Back to home {ARROW}</a><a class="btn btn-ghost" href="/projects/">See our projects</a></div></div></section>'''
    page(f'/{slug}/', f'{h1} | iTOP Pavers', 'Thank you for contacting iTOP Pavers. We will call you within one business day.', main, [], noindex=True, sitemap=False)

def p_404():
    main = f'''<section class="phero short center" aria-labelledby="h1"><div class="wrap"><p class="big404" aria-hidden="true">404</p><h1 class="display" id="h1">This page has moved or no longer exists.</h1>
      <p class="lede">Try one of these instead, or call {BIZ['phone']}.</p>
      <div class="ctas" style="justify-content:center"><a class="btn btn-primary" href="/">Home {ARROW}</a><a class="btn btn-ghost" href="/services/">Services</a><a class="btn btn-ghost" href="/get-a-quote/">Free estimate</a></div></div></section>'''
    page('/404.html', 'Page not found | iTOP Pavers', 'The page you were looking for could not be found. Visit the iTOP Pavers home page or request a free estimate.', main, [], noindex=True, sitemap=False)

# ------------------------------------------------------------------ files
REDIRECTS = [  # old WordPress URL -> new home (301). Pages that keep their slug need no redirect.
    ('/services/outdoor-kitchens-2/', '/services/outdoor-kitchens/'), ('/home/', '/'), ('/paver-styles/', '/styles/'),
    ('/gallery/', '/projects/'), ('/portfolio/', '/projects/'), ('/contact-us/', '/contact/'), ('/about-us/', '/about/'),
    ('/cookies-policy/', '/cookie-policy/'), ('/sitemap_index.xml', '/sitemap.xml'), ('/page-sitemap.xml', '/sitemap.xml'), ('/wp-sitemap.xml', '/sitemap.xml'),
]
AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended']

def write_files():
    (D / 'robots.txt').write_text('# iTOP Pavers\nUser-agent: *\nAllow: /\nDisallow: /quote-thank-you/\nDisallow: /contact-thank-you/\n\n'
        '# AI answer engines are allowed (client decision, see docs/seo/client-questions.md)\n' + ''.join(f'User-agent: {b}\nAllow: /\n\n' for b in AI_BOTS) + f'Sitemap: {U("/sitemap.xml")}\n', encoding='utf-8')
    urls = ''.join(f'<url><loc>{U(p)}</loc><lastmod>{TODAY}</lastmod><priority>{pr}</priority></url>' for p, pr in SITEMAP)
    (D / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n', encoding='utf-8')
    hrs = '; '.join(f'{d} {t}' for d, t in BIZ['hours'])
    llms = [f'# {BIZ["name"]}', '', f'> {BIZ["name"]} ({BIZ["legal_name"]}) is a licensed Florida contractor ({BIZ["licence"]}) in Jacksonville, FL. It designs and builds paver patios, driveways, pool decks, walkways and outdoor living spaces across Northeast Florida, with {BIZ["experience"]} of experience and free on-site consultations and estimates.', '',
            '## Services', *[f'- [{s["name"]}]({U(svc_url(s))}): {s["card"]}' for s in SERVICES], '',
            '## Area served', f'{towns_inline()}, Northeast Florida. Office: {ADDRESS_ONE_LINE}.', '',
            '## Contact', f'- Phone / WhatsApp: {BIZ["phone"]}', f'- Email: {BIZ["email"]}', f'- Address: {ADDRESS_ONE_LINE}', f'- Office hours: {hrs}', f'- Instagram: {BIZ["instagram"]}', f'- Facebook: {BIZ["facebook"]}', '',
            '## Key pages', f'- [Home]({U("/")})', f'- [All services]({U("/services/")})', f'- [Paver styles, patterns and material comparison]({U("/styles/")})', f'- [Projects]({U("/projects/")})',
            f'- [About]({U("/about/")})', f'- [Service area]({U("/service-area/")})', f'- [FAQ]({U("/faq/")})', f'- [Free estimate]({U("/get-a-quote/")})', f'- [Contact]({U("/contact/")})', '']
    (D / 'llms.txt').write_text('\n'.join(llms), encoding='utf-8')
    (D / 'site.webmanifest').write_text(json.dumps({'name': BIZ['name'], 'short_name': 'iTOP Pavers', 'start_url': '/', 'display': 'standalone', 'background_color': '#131313', 'theme_color': '#131313',
        'icons': [{'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, indent=1), encoding='utf-8')
    vercel = {'trailingSlash': True,
              'redirects': [{'source': a, 'destination': b, 'permanent': True} for a, b in REDIRECTS],
              'headers': [{'source': '/(.*)', 'has': [{'type': 'host', 'value': 'itop-pavers.vercel.app'}], 'headers': [{'key': 'X-Robots-Tag', 'value': 'noindex'}]},
                          {'source': '/assets/(.*)', 'headers': [{'key': 'Cache-Control', 'value': 'public, max-age=31536000, immutable'}]},
                          {'source': '/img/(.*)', 'headers': [{'key': 'Cache-Control', 'value': 'public, max-age=2592000'}]}]}
    # www -> bare domain: set in Vercel > Domains (redirect www.itoppavers.com to itoppavers.com, 308/301).
    (D / 'vercel.json').write_text(json.dumps(vercel, indent=1), encoding='utf-8')

BRAND_ROOT = {'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'}
def copy_assets():
    for sub in ('assets/fonts', 'assets/vendor', 'img/pavers'): (D / sub).mkdir(parents=True, exist_ok=True)
    (D / 'assets' / 'site.css').write_text(CSS, encoding='utf-8')
    (D / 'assets' / 'app.js').write_text(APP, encoding='utf-8')
    for f in (R / 'assets' / 'fonts').glob('*.woff2'): shutil.copy2(f, D / 'assets' / 'fonts' / f.name)
    shutil.copy2(R / 'assets' / 'vendor' / 'three.min.js', D / 'assets' / 'vendor' / 'three.min.js')
    for f in (R / 'assets' / 'brand').glob('*'): shutil.copy2(f, (D / f.name) if f.name in BRAND_ROOT else (D / 'assets' / f.name))
    for f in (R / 'assets' / 'photos').glob('*.webp'): shutil.copy2(f, D / 'img' / f.name)
    for f in (R / 'assets' / 'video').glob('*'): shutil.copy2(f, D / 'assets' / f.name)
    for f in (R / 'assets' / 'pavers').glob('*.webp'): shutil.copy2(f, D / 'img' / 'pavers' / f.name)

def main():
    if D.exists():
        for p in D.iterdir():
            if p.name == '.vercel': continue
            shutil.rmtree(p) if p.is_dir() else p.unlink()
    D.mkdir(exist_ok=True)
    copy_assets()
    p_home(); p_services()
    for s in SERVICES: p_service(s)
    p_styles(); p_projects(); p_about(); p_area(); p_faq(); p_contact(); p_quote()
    p_legal('privacy-policy', 'Privacy Policy', 'Privacy Policy | iTOP Pavers (iTop Pavers LLC), Jacksonville')
    p_legal('terms-of-use', 'Terms of Use', 'Terms of Use | iTOP Pavers (iTop Pavers LLC), Jacksonville')
    p_legal('cookie-policy', 'Cookie Policy', 'Cookie Policy | iTOP Pavers (iTop Pavers LLC), Jacksonville')
    p_thanks('quote-thank-you', 'Thanks, your estimate request is in'); p_thanks('contact-thank-you', 'Thanks for getting in touch')
    p_404(); write_files()
    print(f'Built {len(SITEMAP)} indexable pages + thank-you/404 into dist/ (v{VER})')

if __name__ == '__main__':
    main()
