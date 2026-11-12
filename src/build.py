import pathlib
# Paths are relative to the project root (one level up from src/).
R=pathlib.Path(__file__).resolve().parent.parent
page=(R/'src/page.html').read_text(encoding='utf-8'); app=(R/'src/app.js').read_text(encoding='utf-8')
vb=(R/'assets/logo/vb.txt').read_text(encoding='utf-8').strip(); o=(R/'assets/logo/o.txt').read_text(encoding='utf-8').strip(); d=(R/'assets/logo/d.txt').read_text(encoding='utf-8').strip()
logo=f'<symbol id="logo" viewBox="{vb}"><path fill="#EA680F" fill-rule="evenodd" d="{o}"/><path fill="currentColor" fill-rule="evenodd" d="{d}"/></symbol>'
AR='<svg class="ar"><use href="#i-arrow"/></svg>'
def ml_c(t,d,img): return f'<a class="ml" href="#services"><img class="mp" src="img/{img}-sm.webp" alt="" loading="lazy" decoding="async"><span><b>{t}</b><small>{d}</small></span>{AR}</a>'
def ml_i(t,d,ic): return f'<a class="ml" href="#services"><span class="mi"><svg><use href="#{ic}"/></svg></span><span><b>{t}</b><small>{d}</small></span>{AR}</a>'
pav=[("Patios","Gathering space with clean, lasting edges","patio-firepit-lake"),("Driveways","Interlocking pavers rated for daily traffic","driveway-curved"),("Pool decks","Light, slip-resistant surfaces around water","pool-deck"),("Walkways","Paths from the front door to the backyard","front-entry"),("Paving maintenance","Cleaning, joint sand, sealing and repairs","driveway-terracotta")]
liv=[("Fiberglass pools","Resort-style pools with matching decks","s-pool"),("Outdoor kitchens","Grills and counters built for Florida","s-kitchen"),("Pergolas &amp; gazebos","Shade structures sized to your patio","s-pergola"),("Retaining walls &amp; fire pits","Seat walls, grade changes, a place to gather","s-wall"),("Screen enclosures","Bug-free outdoor rooms over pools and lanais","s-screen")]
header=f'''<header class="top" id="hdr">
  <div class="bar">
    <div class="wrap">
      <a class="brand" href="#top" aria-label="iTOP Pavers home"><svg class="logo" role="img" aria-label="iTOP Pavers"><use href="#logo"/></svg></a>
      <nav class="mainnav" aria-label="Main">
        <span class="nl-ind" aria-hidden="true"></span>
        <ul class="menu">
          <li class="has-mega"><button class="nl" type="button" data-mega="mm-pavers" data-sec="services" aria-expanded="false" aria-controls="mm-pavers">Pavers<svg class="chev"><use href="#i-chev"/></svg></button></li>
          <li class="has-mega"><button class="nl" type="button" data-mega="mm-living" aria-expanded="false" aria-controls="mm-living">Outdoor Living<svg class="chev"><use href="#i-chev"/></svg></button></li>
          <li><a class="nl" href="#studio" data-sec="studio">Paver Styles</a></li>
          <li><a class="nl" href="#projects" data-sec="projects">Projects</a></li>
          <li><a class="nl" href="#process" data-sec="process">Our Process</a></li>
        </ul>
      </nav>
      <div class="bar-r">
        <a class="callbox" href="tel:+19045259191"><span class="ci"><svg><use href="#i-phone"/></svg></span><span><small>Call or WhatsApp</small><b>(904) 525-9191</b></span></a>
        <a class="btn btn-primary" href="#quote">Free estimate <svg><use href="#i-arrow"/></svg></a>
      </div>
      <button class="burger" type="button" aria-expanded="false" aria-controls="mnav" aria-label="Open menu"><span></span><span></span><span></span></button>
      <div class="prog" aria-hidden="true"></div>
    </div>
  </div>
  <div class="mega" id="mm-pavers" role="region" aria-label="Paver services">
    <div class="wrap mega-in">
      <div><div class="mega-h">Paver services</div><div class="mega-grid">{''.join(ml_c(*x) for x in pav)}</div></div>
      <a class="mega-feature photo" href="#studio"><img src="img/pavers/installed-olde-towne.webp" alt="" loading="lazy" decoding="async"><span class="tag2">Paver styles</span><b>Choose your pavers</b><p>Browse five Tremron collections and their colour blends, then add your pick to your estimate.</p><span class="fl">Browse styles <svg><use href="#i-arrow"/></svg></span></a>
    </div>
    <div class="mega-foot"><div class="wrap"><span>Free on-site estimate</span><span>Permits handled</span><span>Licensed CBC 1294954</span><a href="#services">All paver services <svg><use href="#i-arrow"/></svg></a></div></div>
  </div>
  <div class="mega" id="mm-living" role="region" aria-label="Outdoor living services">
    <div class="wrap mega-in">
      <div><div class="mega-h">Outdoor living</div><div class="mega-grid">{''.join(ml_i(*x) for x in liv)}</div></div>
      <a class="mega-feature photo" href="#quote"><img src="img/screen-enclosure-sm.webp" alt="" loading="lazy" decoding="async"><span class="tag2">One crew, one contact</span><b>Pool, deck and kitchen, planned together.</b><p>We plan the whole backyard with you and handle the permits.</p><span class="big">(904) 525-9191</span><span class="fl">Book a free visit <svg><use href="#i-arrow"/></svg></span></a>
    </div>
    <div class="mega-foot"><div class="wrap"><span>3D design preview</span><span>HOA paperwork done for you</span><span>Final walkthrough</span><a href="#services">All outdoor living <svg><use href="#i-arrow"/></svg></a></div></div>
  </div>
</header>
<div class="scrim" aria-hidden="true"></div>
<div class="mnav" id="mnav" aria-label="Menu">
  <div class="mnav-in">
    <details class="macc"><summary>Pavers<svg><use href="#i-chev"/></svg></summary><ul>{''.join(f'<li><a href="#services">{x[0]}</a></li>' for x in pav)}</ul></details>
    <details class="macc"><summary>Outdoor Living<svg><use href="#i-chev"/></svg></summary><ul>{''.join(f'<li><a href="#services">{x[0]}</a></li>' for x in liv)}</ul></details>
    <a class="mlink" href="#studio">Paver Styles<svg><use href="#i-arrow"/></svg></a>
    <a class="mlink" href="#projects">Projects<svg><use href="#i-arrow"/></svg></a>
    <a class="mlink" href="#process">Our Process<svg><use href="#i-arrow"/></svg></a>
    <a class="mlink" href="#reviews">Reviews<svg><use href="#i-arrow"/></svg></a>
    <a class="mlink" href="#area">Service Area<svg><use href="#i-arrow"/></svg></a>
    <div class="mnav-foot">
      <a class="mphone" href="tel:+19045259191"><span class="ci"><svg><use href="#i-phone"/></svg></span><span><small>Call or WhatsApp</small><b>(904) 525-9191</b></span></a>
      <a class="btn btn-primary" href="#quote">Get a free estimate <svg><use href="#i-arrow"/></svg></a>
      <div class="social" style="justify-content:center;margin-top:6px"><a href="https://www.facebook.com/itoppavers/" target="_blank" rel="noopener" aria-label="iTOP Pavers on Facebook"><svg><use href="#i-fb"/></svg></a><a href="https://www.instagram.com/itoppavers/" target="_blank" rel="noopener" aria-label="iTOP Pavers on Instagram"><svg><use href="#i-ig"/></svg></a></div>
      <p>Licensed CBC 1294954 · Free on-site estimates</p>
    </div>
  </div>
</div>'''
out=page.replace('{{LOGO_SYMBOL}}',logo).replace('{{HEADER}}',header).replace('{{APP}}',app)
# 1) Claude Artifact version (no doctype/head; the artifact host adds the skeleton)
(R/'dist/artifact.html').write_text(out,encoding='utf-8')
# 2) Standalone web page: head content = everything before the inline SVG sprite
i=out.index('<svg width="0"')
full=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
      '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
      +out[:i]+'</head>\n<body>\n'+out[i:]+'\n</body>\n</html>\n')
(R/'dist').mkdir(exist_ok=True)
(R/'dist/index.html').write_text(full,encoding='utf-8')
# Project photos (real iTOP jobs, optimised WebP) -> dist/img/
import shutil
img=R/'dist/img'; img.mkdir(exist_ok=True)
for f in (R/'assets/photos').glob('*.webp'): shutil.copy2(f,img/f.name)
# Paver styles (Tremron product photos) -> dist/img/pavers/
pv=img/'pavers'; pv.mkdir(exist_ok=True)
for f in (R/'assets/pavers').glob('*.webp'): shutil.copy2(f,pv/f.name)
print('Built dist/index.html and dist/artifact.html', len(full), 'bytes')
