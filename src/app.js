(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover:hover) and (pointer:fine)');
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ================= data ================= */
const PATTERNS={
  h45:{name:'Herringbone 45°',info:'The strongest interlock of the four. Our first pick for driveways and busy patios.'},
  h90:{name:'Herringbone 90°',info:'Classic and structured. Lines up square with the house and the pool.'},
  bond:{name:'Running bond',info:'Clean, linear and calm. Makes narrow spaces and walkways feel longer.'},
  basket:{name:'Basketweave',info:'A traditional woven texture for courtyards, walkways and entries.'}
};
const TYPES=['Patio','Driveway','Pool deck','Walkway','Paving maintenance','Fiberglass pool','Outdoor kitchen','Pergola or gazebo','Fire pit or retaining wall','Screen enclosure','Not sure yet'];
const LAYERS=[
  {name:'Compacted subgrade',txt:'We dig out the soil and compact it so the patio never settles unevenly.',short:'Subgrade'},
  {name:'Geotextile fabric',txt:'Keeps soil and stone apart so the base stays clean and strong.',short:'Fabric'},
  {name:'Crushed-stone base',txt:'Laid and compacted in layers. This is what carries the load.',short:'Stone base'},
  {name:'Bedding sand',txt:'A screeded, level bed that the pavers settle into.',short:'Sand bed'},
  {name:'Pavers & edge restraint',txt:'Laid to pattern, cut clean at the border and locked in place.',short:'Pavers'},
  {name:'Joint sand & sealer',txt:'Polymeric sand locks the joints; sealing protects colour from the Florida sun.',short:'Sealer'}
];
/* Paver styles: real Tremron collections and colour blends (images in assets/pavers -> dist/img/pavers) */
const COLLS=[
  {id:'olde-towne',name:'Olde Towne',d:'Tumbled, multi-size pavers with softened edges. A timeless look.',c:[['sand-dune','Sand Dune'],['sierra','Sierra'],['autumn-blend','Autumn Blend'],['lions-bridge','Lions Bridge'],['glacier','Glacier'],['granite','Granite'],['heritage','Heritage']]},
  {id:'mega-olde-towne',name:'Mega Olde Towne',d:'The Olde Towne look in larger units, for broad patios and pool decks.',c:[['sand-dune','Sand Dune'],['sierra','Sierra'],['autumn-blend','Autumn Blend'],['glacier','Glacier']]},
  {id:'park-plaza',name:'Park Plaza',d:'Smooth, crisp-edged pavers for a clean, contemporary finish.',c:[['sandstone','Sandstone'],['tan','Tan'],['white','White'],['sierra','Sierra'],['autumn-blend','Autumn Blend'],['glacier','Glacier'],['charcoal','Charcoal']]},
  {id:'stonehurst',name:'Stonehurst',d:'A textured surface with the character of natural cut stone.',c:[['sand-dune','Sand Dune'],['sierra','Sierra'],['autumn-blend','Autumn Blend'],['glacier','Glacier']]},
  {id:'brick',name:'4×8 Brick',d:'The classic brick shape, ideal for herringbone driveways and borders.',c:[['tan','Tan'],['taupe','Taupe'],['sandstone','Sandstone'],['natural','Natural'],['granite','Granite'],['charcoal','Charcoal'],['heritage','Heritage'],['santa-fe','Santa Fe']]}
];
const BORD=[{id:'charcoal',name:'Charcoal',tex:['brick','charcoal']},{id:'match',name:'Matching',tex:null},{id:'tan',name:'Tan',tex:['brick','tan']}];
const design={coll:COLLS[0],color:COLLS[0].c[0],border:BORD[0],used:false};
const designText=()=>`${design.coll.name} · ${design.color[1]} · ${design.border.name} border`;
const sx3d={};
const texSrc=(cid,col,t)=>`img/pavers/${cid}-${col}${t?'-t':''}.webp`;

/* ================= paver layouts (unit = paver width; paver = 2×1) ================= */
function layout(kind,x0,x1,y0,y1){
  const out=[], m=1.6, keep=(x,y)=>x>x0-m&&x<x1+m&&y>y0-m&&y<y1+m;
  if(kind==='h45'||kind==='h90'){
    const rot=kind==='h45', c=Math.SQRT1_2;
    let R=Math.max(Math.abs(x0),Math.abs(x1),Math.abs(y0),Math.abs(y1))+4; if(rot)R*=1.5; R=Math.ceil(R);
    const sR=Math.ceil(R/2)+1;
    for(let s=-sR;s<=sR;s++)for(let k=-R-2;k<=R+2;k++){
      const ox=k+2*s, oy=k-2*s;
      for(let q=0;q<2;q++){
        const x=q?ox+.5:ox+1, y=q?oy+2:oy+.5, r=q?Math.PI/2:0;
        let X=x,Y=y,Rr=r; if(rot){X=c*(x-y);Y=c*(x+y);Rr=r+Math.PI/4;}
        if(keep(X,Y))out.push({x:X,y:Y,rot:Rr});
      }
    }
  }else if(kind==='bond'){
    for(let r=Math.floor(y0)-2;r<=Math.ceil(y1)+2;r++){const off=((r%2)+2)%2;
      for(let c=Math.floor(x0/2)-2;c<=Math.ceil(x1/2)+2;c++){const x=2*c+off+1,y=r+.5;if(keep(x,y))out.push({x,y,rot:0});}}
  }else{
    for(let i=Math.floor(x0/2)-2;i<=Math.ceil(x1/2)+2;i++)for(let j=Math.floor(y0/2)-2;j<=Math.ceil(y1/2)+2;j++){
      const P=((i+j)%2+2)%2===0?[[2*i+1,2*j+.5,0],[2*i+1,2*j+1.5,0]]:[[2*i+.5,2*j+1,Math.PI/2],[2*i+1.5,2*j+1,Math.PI/2]];
      for(const [x,y,r] of P) if(keep(x,y))out.push({x,y,rot:r});
    }
  }
  return out;
}

/* ================= 2D pattern thumbnails ================= */
function shadeRGB(hex,f){const n=parseInt(hex.slice(1),16);const t=v=>clamp(Math.round(v*f),0,255);return `rgb(${t(n>>16)},${t(n>>8&255)},${t(n&255)})`;}
function drawPattern(cv){
  const w=cv.clientWidth, h=cv.clientHeight; if(!w||!h)return;
  const dpr=Math.min(devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
  const u=+cv.dataset.u||11, col=cv.dataset.col;
  g.fillStyle=shadeRGB(col,.5); g.fillRect(0,0,w,h);
  const pts=layout(cv.dataset.pat,-w/u/2-1,w/u/2+1,-h/u/2-1,h/u/2+1);
  let seed=7; const rnd=()=>((seed=(seed*16807)%2147483647)/2147483647);
  g.save(); g.translate(w/2,h/2);
  for(const p of pts){g.save();g.translate(p.x*u,p.y*u);g.rotate(p.rot);const x=-u+.7,y=-u/2+.7,pw=2*u-1.4,ph=u-1.4;
    g.fillStyle=shadeRGB(col,.86+rnd()*.2);g.fillRect(x,y,pw,ph);
    g.fillStyle='rgba(255,255,255,.14)';g.fillRect(x,y,pw,1);g.fillRect(x,y,1,ph);
    g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x,y+ph-1,pw,1);g.fillRect(x+pw-1,y,1,ph);g.restore();}
  g.restore();
  for(let i=0;i<w*h/12;i++){g.fillStyle=rnd()<.5?`rgba(255,255,255,${.04+rnd()*.06})`:`rgba(0,0,0,${.05+rnd()*.08})`;g.fillRect(rnd()*w,rnd()*h,1,1);}
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'rgba(255,255,255,.07)');gr.addColorStop(1,'rgba(0,0,0,.22)');g.fillStyle=gr;g.fillRect(0,0,w,h);
}
const redrawPatterns=()=>$$('canvas[data-pat]').forEach(drawPattern);
redrawPatterns();
let rpT; addEventListener('resize',()=>{clearTimeout(rpT);rpT=setTimeout(redrawPatterns,150);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(redrawPatterns);

/* ================= navigation ================= */
const hdr=$('#hdr'), scrim=$('.scrim');
let openId=null, closeT=null, openT=null;
const btnFor=id=>document.querySelector('[data-mega="'+id+'"]');
function openMega(id){
  clearTimeout(closeT); if(openId===id)return;
  if(openId){$('#'+openId).classList.remove('open');btnFor(openId).setAttribute('aria-expanded','false');}
  openId=id; $('#'+id).classList.add('open'); btnFor(id).setAttribute('aria-expanded','true');
  hdr.classList.add('mega-open'); scrim.classList.add('on');
}
function closeMega(){
  clearTimeout(openT); if(!openId)return;
  $('#'+openId).classList.remove('open'); btnFor(openId).setAttribute('aria-expanded','false');
  openId=null; hdr.classList.remove('mega-open'); scrim.classList.remove('on');
}
$$('[data-mega]').forEach(b=>{
  b.addEventListener('click',()=>{openId===b.dataset.mega?closeMega():openMega(b.dataset.mega);});
  b.parentElement.addEventListener('mouseenter',()=>{if(!fine.matches)return;clearTimeout(openT);openT=setTimeout(()=>openMega(b.dataset.mega),openId?0:90);});
  b.parentElement.addEventListener('mouseleave',()=>clearTimeout(openT));
});
$$('.menu>li:not(.has-mega), .bar .brand, .bar-r').forEach(el=>el.addEventListener('mouseenter',()=>{if(fine.matches)closeMega();}));
hdr.addEventListener('mouseleave',()=>{if(fine.matches)closeT=setTimeout(closeMega,200);});
hdr.addEventListener('mouseenter',()=>clearTimeout(closeT));
hdr.addEventListener('focusout',e=>{if(!hdr.contains(e.relatedTarget))closeMega();});
$$('.mega a').forEach(a=>a.addEventListener('click',closeMega));
scrim.addEventListener('click',closeMega);
const burger=$('.burger'), mnav=$('#mnav');
function setMenu(on){
  burger.setAttribute('aria-expanded',on); burger.setAttribute('aria-label',on?'Close menu':'Open menu');
  if(on){document.documentElement.style.setProperty('--hb',hdr.getBoundingClientRect().bottom+'px');closeMega();}
  mnav.classList.toggle('open',on); document.documentElement.classList.toggle('lock',on);
}
burger.addEventListener('click',()=>setMenu(burger.getAttribute('aria-expanded')!=='true'));
mnav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
addEventListener('resize',()=>{if(innerWidth>1200&&mnav.classList.contains('open'))setMenu(false);});
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(openId){const b=btnFor(openId);closeMega();b.focus();}
  if(mnav.classList.contains('open')){setMenu(false);burger.focus();}
});
if('IntersectionObserver' in window){
  const links=$$('.nl[data-sec]');
  const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(l=>l.dataset.active=(l.dataset.sec===e.target.id)?'1':'0');}),{rootMargin:'-40% 0px -55% 0px'});
  ['studio','build','services','process','projects','reviews','quote'].forEach(id=>{const el=document.getElementById(id);el&&sio.observe(el);});
  sio.observe($('.hero'));
}

/* sliding nav indicator: follows hover/focus, rests on the open menu or the section in view */
(function(){
  const ind=$('.nl-ind'), mn=$('.mainnav'); if(!ind||!mn)return;
  let hover=false;
  const to=el=>{if(!el||!el.offsetWidth){ind.classList.remove('on');return;}const r=el.getBoundingClientRect(),m=mn.getBoundingClientRect();ind.style.width=r.width+'px';ind.style.transform=`translateX(${(r.left-m.left).toFixed(1)}px)`;ind.classList.add('on');};
  const rest=()=>to($('.nl[aria-expanded="true"]')||$('.nl[data-active="1"]'));
  $$('.menu .nl').forEach(l=>{l.addEventListener('mouseenter',()=>{hover=true;to(l);});l.addEventListener('focus',()=>to(l));});
  mn.addEventListener('mouseleave',()=>{hover=false;rest();});
  new MutationObserver(()=>{if(!hover)rest();}).observe(mn,{subtree:true,attributes:true,attributeFilter:['data-active','aria-expanded']});
  addEventListener('resize',()=>{if(!hover)rest();});
})();

/* scroll-linked bits */
const scrollers=[];
let ticking=false;
function onScroll(){
  ticking=false; const y=scrollY;
  hdr.classList.toggle('scrolled',y>40);
  const max=document.documentElement.scrollHeight-innerHeight;
  hdr.style.setProperty('--p',max>0?Math.min(1,y/max).toFixed(4):0);
  scrollers.forEach(f=>f());
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
addEventListener('resize',()=>requestAnimationFrame(onScroll));

const stepsEl=$('#steps');
scrollers.push(()=>{const r=stepsEl.getBoundingClientRect();stepsEl.style.setProperty('--sp',clamp((innerHeight*.85-r.top)/(r.height+innerHeight*.35),0,1).toFixed(3));});

/* reveal */
if(!reduce&&'IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pre');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});
  $$('.sec-head, .svc, .step, .card, .adv, .sx, .proj-grid, .proj-more, .filters, .qcard, .quote .wrap>div:first-child, .build-copy').forEach((el,i)=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('reveal','pre');el.style.transitionDelay=(i%5)*60+'ms';io.observe(el);}});
}

/* service card preselect */
$$('.svc').forEach(c=>c.addEventListener('click',()=>selectType(c.dataset.type)));

/* ================= projects ================= */
/* Real iTOP job photos from the client's site and Instagram (assets/photos -> dist/img). `full` = larger file for the lightbox. */
const PROJ=[
  {t:'Driveway',img:'driveway-gated',full:1,big:1,title:'Gated entry driveway',sub:'Tumbled pavers with a charcoal soldier course'},
  {t:'Patio',img:'patio-firepit-lake',title:'Lakeside fire pit & seat wall',sub:'Built-in fire pit wrapped by a curved seat wall'},
  {t:'Pool deck',img:'pool-deck',title:'Pool deck & coping',sub:'Blended pavers with bullnose coping'},
  {t:'Patio',img:'front-entry',title:'Front entry & steps',sub:'Curved paver steps up to the front porch'},
  {t:'Outdoor living',img:'screen-enclosure',full:1,title:'Screen enclosure & patio',sub:'Screened outdoor room over a new paver patio'},
  {t:'Driveway',img:'driveway-curved',title:'Curved driveway',sub:'Charcoal border following the curve'},
  {t:'Pool deck',img:'pool-deck-travertine',title:'Travertine pool deck & spa',sub:'Natural travertine around a raised spa'},
  {t:'Patio',img:'patio-circle',full:1,title:'Circular garden patio',sub:'Round patio with a soldier-course edge'},
  {t:'Driveway',img:'driveway-long',title:'Long driveway with border',sub:'Light blend framed in charcoal'},
  {t:'Driveway',img:'driveway-terracotta',title:'Terracotta-blend driveway',sub:'Warm tones to match a tile roof'},
  {t:'Driveway',img:'driveway-3car',title:'Three-car driveway',sub:'Full replacement in a tan blend'},
  {t:'Driveway',img:'driveway-border',title:'Driveway with soldier border',sub:'Clean lines from the street to the door'}
];
const FILT=[['All','All work'],['Driveway','Driveways'],['Patio','Patios & entries'],['Pool deck','Pool decks'],['Outdoor living','Outdoor living']];
const filters=$('#filters'), grid=$('#projGrid');
filters.innerHTML=FILT.map(([k,l],i)=>`<button class="chip" type="button" data-f="${k}" aria-pressed="${i===0}">${l}<span>${k==='All'?PROJ.length:PROJ.filter(p=>p.t===k).length}</span></button>`).join('');
let shown=[];
function renderProj(f){
  shown=PROJ.filter(p=>f==='All'||p.t===f);
  grid.innerHTML=shown.map((p,i)=>`<button type="button" class="proj${p.big&&f==='All'?' big':''}" data-i="${i}" aria-label="View photo: ${esc(p.title)}"><img src="img/${p.img}-sm.webp" alt="${esc(p.title)} by iTOP Pavers" loading="lazy" decoding="async"><span class="pc"><small>${esc(p.t)}</small><b>${esc(p.title)}</b><span>${esc(p.sub)}</span></span><svg class="zoom" aria-hidden="true"><use href="#i-arrow"/></svg></button>`).join('');
}
renderProj('All');
filters.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filters.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderProj(b.dataset.f);});

/* lightbox */
const lb=$('#lightbox'), lbImg=$('#lbImg'), lbCap=$('#lbCap');
let lbI=0, lbFrom=null;
function lbShow(i){lbI=(i+shown.length)%shown.length;const p=shown[lbI];lbImg.src=`img/${p.img}${p.full?'':'-sm'}.webp`;lbImg.alt=p.title+' by iTOP Pavers';lbCap.innerHTML=`<small>${esc(p.t)} · ${lbI+1} / ${shown.length}</small><b>${esc(p.title)}</b><span>${esc(p.sub)}</span>`;}
function lbOpen(i){lbFrom=document.activeElement;lbShow(i);lb.hidden=false;document.documentElement.classList.add('lock');$('#lbClose').focus();}
function lbClose(){lb.hidden=true;document.documentElement.classList.remove('lock');lbFrom&&lbFrom.focus();}
grid.addEventListener('click',e=>{const b=e.target.closest('.proj');if(b)lbOpen(+b.dataset.i);});
$('#lbClose').addEventListener('click',lbClose);
$('#lbPrev').addEventListener('click',()=>lbShow(lbI-1));
$('#lbNext').addEventListener('click',()=>lbShow(lbI+1));
lb.addEventListener('click',e=>{if(e.target===lb)lbClose();});
document.addEventListener('keydown',e=>{if(lb.hidden)return;if(e.key==='Escape')lbClose();else if(e.key==='ArrowLeft')lbShow(lbI-1);else if(e.key==='ArrowRight')lbShow(lbI+1);});

/* ================= service-area map (schematic, tilted) ================= */
(function(){
  const TOWNS=[['Jacksonville',30.332,-81.656,1,'r'],['Fernandina Beach',30.669,-81.462,1,'r'],['Atlantic Beach',30.334,-81.399,0,'r'],['Neptune Beach',30.312,-81.396,0,'r'],['Jacksonville Beach',30.288,-81.393,1,'r'],['Ponte Vedra Beach',30.240,-81.386,1,'r'],['Nocatee',30.105,-81.420,1,'r'],['St. Johns',30.081,-81.548,1,'r'],['Fruit Cove',30.111,-81.642,0,'l'],['Orange Park',30.166,-81.706,1,'l'],['Fleming Island',30.093,-81.719,0,'l'],['St. Augustine',29.895,-81.315,1,'r']];
  const OFFICE=[30.19,-81.565];
  const W=640,H=400, L0=-81.88,L1=-81.16, A0=29.82,A1=30.74;
  const P=(lat,lon)=>{const bx=(lon-L0)/(L1-L0), by=(A1-lat)/(A1-A0); const sc=.74+.26*by; return [W/2+(bx-.5)*560*sc, 34+by*300];};
  const coast=[[30.74,-81.452],[30.62,-81.432],[30.52,-81.42],[30.40,-81.403],[30.33,-81.393],[30.28,-81.385],[30.20,-81.37],[30.10,-81.35],[30.00,-81.322],[29.90,-81.292],[29.82,-81.262]];
  const river=[[30.40,-81.42],[30.39,-81.52],[30.36,-81.60],[30.32,-81.65],[30.27,-81.675],[30.18,-81.69],[30.08,-81.68],[29.98,-81.645],[29.86,-81.61]];
  const pts=a=>a.map(([la,lo])=>P(la,lo).map(v=>v.toFixed(1)).join(',')).join(' ');
  const nw=P(A1,L0), sw=P(A0,L0), ne=P(A1,L1), se=P(A0,L1);
  const land=[nw,...coast.map(([a,b])=>P(a,b)),sw];
  let grid='';
  for(let i=1;i<10;i++){const lo=L0+(L1-L0)*i/10;const a=P(A1,lo),b=P(A0,lo);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;}
  for(let i=1;i<8;i++){const la=A0+(A1-A0)*i/8;const a=P(la,L0),b=P(la,L1);grid+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;}
  const T=14;
  let pins=[...TOWNS.map(t=>({name:t[0],p:P(t[1],t[2]),show:t[3],side:t[4]})),{name:'iTOP office',p:P(...OFFICE),office:true,show:1,side:'r'}].sort((a,b)=>a.p[1]-b.p[1]);
  const pinSvg=pins.map(o=>{const [x,y]=o.p, hgt=o.office?44:24;
    const lab=`<text class="${o.show?'':'hidel'}" x="${o.side==='l'?x-9:x+9}" y="${y-hgt+4}" text-anchor="${o.side==='l'?'end':'start'}">${esc(o.name)}</text>`;
    const head=o.office?`<use href="#mark" x="${x-12}" y="${y-hgt-14}" width="24" height="24" style="color:#EA680F"/>`:`<rect class="head" x="${x-4.5}" y="${y-hgt-4.5}" width="9" height="9" transform="rotate(45 ${x} ${y-hgt})" fill="#EA680F"/>`;
    const ring=o.office&&!reduce?`<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" fill="none" stroke="#EA680F" stroke-width="2"><animate attributeName="rx" values="6;30" dur="2.2s" repeatCount="indefinite"/><animate attributeName="ry" values="2.6;12" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.2s" repeatCount="indefinite"/></ellipse>`:'';
    return `<g class="town${o.office?' office':''}" data-town="${esc(o.name)}">${ring}<ellipse cx="${x}" cy="${y}" rx="6" ry="2.6" fill="rgba(0,0,0,.55)"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y-hgt}" stroke="${o.office?'#EA680F':'#e8e3dc'}" stroke-width="${o.office?2.5:1.5}"/>${head}${lab}</g>`;}).join('');
  $('#map').innerHTML=`<svg viewBox="0 0 ${W} ${H+T+10}" role="img" aria-label="Map of the iTOP Pavers service area in Northeast Florida, from Fernandina Beach to St. Augustine, with the office in Jacksonville.">
    <defs><linearGradient id="og" x1="0" x2="1"><stop offset="0" stop-color="#16232a"/><stop offset="1" stop-color="#0f171b"/></linearGradient>
    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a18"/><stop offset="1" stop-color="#262320"/></linearGradient></defs>
    <polygon points="${sw[0]},${sw[1]} ${se[0]},${se[1]} ${se[0]},${se[1]+T} ${sw[0]},${sw[1]+T}" fill="#0a0a0a"/>
    <polygon points="${pts([[A1,L0],[A1,L1],[A0,L1],[A0,L0]])}" fill="url(#og)"/>
    <polygon points="${land.map(p=>p.map(v=>v.toFixed(1)).join(',')).join(' ')}" fill="url(#lg)" stroke="#4a443d" stroke-width="1.2"/>
    <g stroke="rgba(234,104,15,.08)" stroke-width="1">${grid}</g>
    <polyline points="${pts(river)}" fill="none" stroke="#1e3a45" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${pts(river)}" fill="none" stroke="#2c5866" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${P(30.47,-81.27)[0]}" y="${P(30.47,-81.27)[1]}" fill="#3d5560" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle" font-family="Poppins, sans-serif">ATLANTIC</text>
    <text x="${P(30.43,-81.27)[0]}" y="${P(30.43,-81.27)[1]}" fill="#3d5560" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle" font-family="Poppins, sans-serif">OCEAN</text>
    <text x="${P(29.96,-81.70)[0]}" y="${P(29.96,-81.70)[1]}" fill="#4f6d78" font-size="10" font-style="italic" text-anchor="middle" font-family="Poppins, sans-serif">St. Johns River</text>
    ${pinSvg}
  </svg>`;
  const towns=$('#towns');
  towns.innerHTML=TOWNS.map(t=>`<li class="${t[0]==='Jacksonville'?'hq':''}" data-town="${esc(t[0])}" tabindex="0">${esc(t[0])}</li>`).join('');
  const hl=(name,on)=>{$$(`#map [data-town="${name}"], #towns [data-town="${name}"]`).forEach(e=>e.classList.toggle('hl',on));};
  $$('#towns li, #map .town').forEach(el=>{const n=el.dataset.town;['mouseenter','focus'].forEach(ev=>el.addEventListener(ev,()=>hl(n,true)));['mouseleave','blur'].forEach(ev=>el.addEventListener(ev,()=>hl(n,false)));});
})();

/* ================= paver styles explorer ================= */
const sxColls=$('#sxColls'), sxSw=$('#sxSw'), sxTex=$('#sxTex'), sxInst=$('#sxInst');
sxColls.innerHTML=COLLS.map((c,i)=>`<button type="button" class="sx-coll" role="radio" aria-checked="${i===0}" tabindex="${i===0?0:-1}" data-i="${i}"><img src="${texSrc(c.id,c.c[0][0],1)}" alt="" loading="lazy"><span><b>${esc(c.name)}</b><span>${esc(c.d)}</span></span></button>`).join('');
function radioKeys(group,sel,cb){group.addEventListener('keydown',e=>{const k={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];if(!k)return;e.preventDefault();const bs=[...group.querySelectorAll(sel)];const i=(bs.findIndex(b=>b.getAttribute('aria-checked')==='true')+k+bs.length)%bs.length;cb(i);bs[i].focus();});}
function sxRender(){
  const c=design.coll, col=design.color;
  sxColls.querySelectorAll('.sx-coll').forEach((b,i)=>{const on=COLLS[i]===c;b.setAttribute('aria-checked',on);b.tabIndex=on?0:-1;});
  sxSw.innerHTML=c.c.map(x=>`<button type="button" class="sx-c" role="radio" aria-checked="${x===col}" tabindex="${x===col?0:-1}" aria-label="${esc(x[1])}" title="${esc(x[1])}"><img src="${texSrc(c.id,x[0],1)}" alt=""></button>`).join('');
  sxTex.classList.add('ld');
  const im=new Image(); im.onload=()=>{sxTex.src=im.src;sxTex.alt=`${c.name} pavers in ${col[1]}, close-up`;sxTex.classList.remove('ld');}; im.src=texSrc(c.id,col[0]);
  if(sxInst.dataset.c!==c.id){sxInst.dataset.c=c.id;sxInst.src=`img/pavers/installed-${c.id}.webp`;sxInst.alt=`${c.name} pavers installed`;}
  $('#sxColl').textContent=c.name; $('#sxColor').textContent=col[1]; $('#sxColorName').textContent=col[1];
  $('#sxInstCap').textContent=`${c.name}, installed · Photo: Tremron`;
  const bt=b=>b.tex?texSrc(b.tex[0],b.tex[1],1):texSrc(c.id,col[0],1);
  $('#sxBord').innerHTML=BORD.map(b=>`<button type="button" class="sx-c" role="radio" aria-checked="${b===design.border}" tabindex="${b===design.border?0:-1}" aria-label="${b.name} border" title="${b.name}"><img src="${bt(b)}" alt=""><i>${b.name}</i></button>`).join('');
  $('#sxBordName').textContent=design.border.name;
  $('#sumText').textContent=designText();
  sx3d.set&&sx3d.set();
  if(design.used)renderDesignBox();
}
function sxBord(i){design.border=BORD[i];sxRender();}
$('#sxBord').addEventListener('click',e=>{const b=e.target.closest('.sx-c');if(b)sxBord([...$('#sxBord').children].indexOf(b));});
radioKeys($('#sxBord'),'.sx-c',sxBord);
$$('[data-sxv]').forEach(b=>b.addEventListener('click',()=>{$$('[data-sxv]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('.sx-stage').classList.toggle('m3d',b.dataset.sxv==='3d');sx3d.kick&&sx3d.kick();}));
function sxColl(i){const c=COLLS[i];if(c===design.coll)return;const keep=c.c.find(x=>x[1]===design.color[1]);design.coll=c;design.color=keep||c.c[0];sxRender();}
function sxColor(i){design.color=design.coll.c[i];sxRender();}
sxColls.addEventListener('click',e=>{const b=e.target.closest('.sx-coll');if(b)sxColl(+b.dataset.i);});
sxSw.addEventListener('click',e=>{const b=e.target.closest('.sx-c');if(b)sxColor([...sxSw.children].indexOf(b));});
radioKeys(sxColls,'.sx-coll',sxColl); radioKeys(sxSw,'.sx-c',i=>sxColor(i));
sxRender();
$('#useDesign').addEventListener('click',()=>{design.used=true;renderDesignBox();});

/* ================= quote form (3 steps) ================= */
$('#typeOpts').setAttribute('role','radiogroup');
$('#typeOpts').setAttribute('aria-label','Project type');
$('#typeOpts').innerHTML=TYPES.map(t=>`<label class="opt"><input type="radio" name="type" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('');
function selectType(t){const r=$$('input[name="type"]').find(i=>i.value===t);if(r)r.checked=true;}
function renderDesignBox(){
  const box=$('#designBox');
  box.innerHTML=design.used
    ?`<div class="design-chip"><img src="${texSrc(design.coll.id,design.color[0],1)}" alt=""><div><small>Paver selection</small><b>${esc(designText())}</b><a href="#studio">Change</a></div></div>`
    :`<div class="design-chip"><div><small>No paver style yet</small><b>Want to pick a style and colour first?</b><a href="#studio">Browse paver styles</a></div></div>`;
}
renderDesignBox();
let qStep=1;
const qform=$('#qform'), qBack=$('#qBack'), qNext=$('#qNext');
function showStep(n,focus){
  qStep=n;
  $$('#qform fieldset').forEach(f=>f.hidden=+f.dataset.step!==n);
  $$('#qsteps li').forEach((li,i)=>{li.className=i+1<n?'done':i+1===n?'on':'';});
  qBack.hidden=n===1;
  qNext.innerHTML=n===3?'Request my estimate <svg><use href="#i-arrow"/></svg>':'Next <svg><use href="#i-right"/></svg>';
  if(n===2)renderDesignBox();
  if(focus){const el=$(`#qform fieldset[data-step="${n}"]`).querySelector('input,textarea');el&&el.focus({preventScroll:true});}
}
const setErr=(id,msg)=>{const e=$('#e-'+id);if(e)e.textContent=msg;return !msg;};
function validate(n){
  const v=id=>$('#'+id).value.trim();
  if(n===1)return setErr('type',$('input[name="type"]:checked')?'':'Choose the project closest to yours.');
  if(n===2)return setErr('time',$('input[name="time"]:checked')?'':'Pick a rough start time. “Just exploring” is fine.');
  let ok=true, first=null;
  const chk=(id,cond,msg)=>{if(!setErr(id,cond?'':msg)){ok=false;first=first||$('#f-'+id);}};
  chk('name',v('f-name'),'Enter your name so we know who to ask for.');
  /* International: optional leading +, then 7–15 digits (E.164 max); spaces, dashes, dots and brackets allowed */
  const ph=v('f-phone'), d=ph.replace(/\D/g,'');
  chk('phone',/^\+?[\d\s().-]+$/.test(ph)&&d.length>=7&&d.length<=15,'Enter a valid phone number, including country code if outside the US.');
  chk('email',/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('f-email')),'Enter an email like name@example.com.');
  chk('zip',/^[A-Za-z0-9][A-Za-z0-9 -]{1,9}$/.test(v('f-zip')),'Enter your ZIP or postal code.');
  if(first)first.focus();
  return ok;
}
qform.addEventListener('submit',e=>{
  e.preventDefault();
  if(!validate(qStep))return;
  if(qStep<3){showStep(qStep+1,true);return;}
  const full=$('#f-name').value.trim(), name=full.split(' ')[0];
  const type=$('input[name="type"]:checked').value;
  const val=n=>{const r=$(`input[name="${n}"]:checked`);return r?r.value:'Not given';};
  /* Until the form is connected to the CRM, the request is sent by the visitor's own email app so no lead is lost. */
  const body=[`Project: ${type}`,`Size: ${val('size')}`,`Start: ${val('time')}`,design.used?`Pavers: ${designText()}`:'',`Notes: ${$('#f-msg').value.trim()||'None'}`,'',`Name: ${full}`,`Phone: ${$('#f-phone').value.trim()}`,`Email: ${$('#f-email').value.trim()}`,`ZIP / postal code: ${$('#f-zip').value.trim()}`].filter(Boolean).join('\n');
  const mail=`mailto:info@itoppavers.com?subject=${encodeURIComponent('Free estimate request: '+type)}&body=${encodeURIComponent(body)}`;
  $('#qcard').innerHTML=`<div class="done" aria-live="polite"><div class="eyebrow">Almost done</div><h3>Thanks, ${esc(name)}. One last step.</h3><p>Send your request to our office and we’ll call you within one business day to book your free on-site visit.</p>
    <div class="done-sum"><b>${esc(type)}</b>${design.used?`<span>${esc(designText())}</span>`:''}</div>
    <div class="ctas"><a class="btn btn-primary" href="${mail}">Send my request <svg><use href="#i-arrow"/></svg></a><a class="btn btn-ghost" href="tel:+19045259191"><svg><use href="#i-phone"/></svg>Call (904) 525-9191</a></div></div>`;
});
qBack.addEventListener('click',()=>showStep(qStep-1,true));

/* ================= hero showcase: big real project photos, 3D depth layers ================= */
const HC=[
  {img:'driveway-gated',full:1,t:'Driveway',q:'Driveway',title:'Gated entry driveway',sub:'Tumbled pavers with a charcoal soldier course'},
  {img:'patio-firepit-lake',t:'Patio',q:'Patio',title:'Lakeside fire pit & seat wall',sub:'Built-in fire pit wrapped by a curved seat wall'},
  {img:'pool-deck',t:'Pool deck',q:'Pool deck',title:'Pool deck & coping',sub:'Blended pavers with bullnose coping'},
  {img:'screen-enclosure',full:1,t:'Screen enclosure',q:'Screen enclosure',title:'Screen enclosure & patio',sub:'Screened outdoor room over a new paver patio'},
  {img:'front-entry',t:'Entry',q:'Walkway',title:'Front entry & steps',sub:'Curved paver steps up to the front porch'},
  {img:'patio-circle',full:1,t:'Patio',q:'Patio',title:'Circular garden patio',sub:'Round patio with a soldier-course edge'}
];
const shSlides=$('#showSlides'), shBars=$('#showBars'), shCap=$('#showCap'), shThumbs=$('#showThumbs'), shLive=$('#showLive'), sh3d=$('#show3d'), shStage=$('#showStage'), show=$('#show');
const src=c=>`img/${c.img}${c.full?'':'-sm'}.webp`;
shSlides.innerHTML=HC.map((c,i)=>`<figure class="show-slide" aria-hidden="${i!==0}"><img src="${src(c)}" alt="${esc(c.title)} by iTOP Pavers" ${i?'loading="lazy"':'fetchpriority="high"'} decoding="async" draggable="false"></figure>`).join('');
shBars.innerHTML=HC.map(()=>'<i><b></b></i>').join('');
shThumbs.innerHTML=HC.map((c,i)=>`<button type="button" aria-label="Show ${esc(c.title)}" aria-pressed="${i===0}"><img src="img/${c.img}-sm.webp" alt="" loading="lazy" decoding="async"><span>${esc(c.t)}</span></button>`).join('');
const shEls=[...shSlides.children], shBarEls=[...shBars.children], shThumbEls=[...shThumbs.children];
const SH_DUR=6000; let shI=0, shTimer=null, shPaused=false;
function shShow(i,user){
  shI=(i+HC.length)%HC.length; const c=HC[shI];
  shEls.forEach((el,k)=>{el.classList.toggle('on',k===shI);el.setAttribute('aria-hidden',k!==shI);});
  shBarEls.forEach((el,k)=>{el.className=k<shI?'done':(k===shI?'on':'');});
  if(!shPaused&&!reduce){const b=shBarEls[shI];void b.offsetWidth;b.classList.add('run');}
  shThumbEls.forEach((el,k)=>el.setAttribute('aria-pressed',k===shI));
  shCap.innerHTML=`<small>${esc(c.t)} · Recent iTOP job</small><b>${esc(c.title)}</b><span>${esc(c.sub)}</span><a class="btn btn-primary" href="#quote" data-q="${esc(c.q)}">Get an estimate like this <svg><use href="#i-arrow"/></svg></a>`;
  shLive.textContent=`${c.title}, ${shI+1} of ${HC.length}`;
  if(user)shRestart();
}
function shRestart(){clearInterval(shTimer);if(reduce||shPaused)return;shTimer=setInterval(()=>shShow(shI+1),SH_DUR);}
show.style.setProperty('--dur',SH_DUR+'ms');
shShow(0); shRestart();
$('#showPrev').addEventListener('click',()=>shShow(shI-1,true));
$('#showNext').addEventListener('click',()=>shShow(shI+1,true));
shThumbs.addEventListener('click',e=>{const b=e.target.closest('button');if(b)shShow(shThumbEls.indexOf(b),true);});
shCap.addEventListener('click',e=>{const a=e.target.closest('a[data-q]');if(a)selectType(a.dataset.q);});
show.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if(e.key==='ArrowLeft'){shShow(shI-1,true);}else if(e.key==='ArrowRight'){shShow(shI+1,true);}});
// swipe
let shX=null;
shStage.addEventListener('pointerdown',e=>{if(e.target.closest('a,button'))return;shX=e.clientX;});
shStage.addEventListener('pointerup',e=>{if(shX===null)return;const dx=e.clientX-shX;shX=null;if(Math.abs(dx)>40)shShow(shI+(dx<0?1:-1),true);});
shStage.addEventListener('pointercancel',()=>{shX=null;});
// pause while the pointer or focus is inside; 3D depth tilt follows the pointer
const shPause=v=>{shPaused=v;if(v){clearInterval(shTimer);shBarEls[shI].classList.add('hold');}else{shBarEls[shI].classList.remove('hold');shShow(shI);shRestart();}};
show.addEventListener('mouseenter',()=>shPause(true));
show.addEventListener('mouseleave',()=>{shPause(false);sh3d.style.setProperty('--rx','0deg');sh3d.style.setProperty('--ry','0deg');});
show.addEventListener('focusin',()=>shPause(true));
show.addEventListener('focusout',e=>{if(!show.contains(e.relatedTarget))shPause(false);});
if(fine.matches&&!reduce)sh3d.addEventListener('pointermove',e=>{const r=sh3d.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;sh3d.style.setProperty('--ry',(x*7).toFixed(2)+'deg');sh3d.style.setProperty('--rx',(-y*6).toFixed(2)+'deg');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInterval(shTimer);else shRestart();});

/* layers list */
$('#layers').innerHTML=LAYERS.map((l,i)=>`<li><span class="ln">0${i+1}</span><div><b>${esc(l.name)}</b><small>${esc(l.txt)}</small></div></li>`).join('');

/* ================= 3D ================= */
const T=window.THREE;
function no3d(){document.documentElement.classList.add('no3d');$$('#buildCanvas,#sxCanvas').forEach(c=>c.style.visibility='hidden');$('.sx-stage').classList.remove('m3d');}
if(!T){no3d();return;}
try{const t=document.createElement('canvas');if(!(t.getContext('webgl')||t.getContext('experimental-webgl')))throw 0;}catch(e){no3d();return;}

const stages=[];
class Stage{
  constructor(canvas,{shadows=false,lazy=false,exposure=1}={}){
    Object.assign(this,{canvas,shadows,exposure,visible:false,running:false,ready:false,t0:0,w:1,h:1});
    if(!lazy)this.init();
    new IntersectionObserver(es=>{const e=es[es.length-1];if(e.isIntersecting&&!this.ready)this.init();this.visible=e.isIntersecting;if(this.visible){this.t0=performance.now();this.kick();}},{rootMargin:'300px 0px'}).observe(canvas);
    if('ResizeObserver' in window)new ResizeObserver(()=>{if(this.ready){this.resize();this.kick();}}).observe(canvas);
    else addEventListener('resize',()=>{if(this.ready){this.resize();this.kick();}});
    stages.push(this);
  }
  init(){
    if(this.ready)return;
    const r=this.renderer=new T.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    r.setPixelRatio(Math.min(devicePixelRatio||1,2));
    r.outputEncoding=T.sRGBEncoding; r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=this.exposure;
    r.localClippingEnabled=true;
    if(this.shadows){r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;}
    this.ready=true; this.onInit&&this.onInit(); this.resize();
  }
  resize(){const b=this.canvas.getBoundingClientRect();this.w=Math.max(1,b.width);this.h=Math.max(1,b.height);this.renderer.setSize(this.w,this.h,false);this.onResize&&this.onResize(this.w,this.h);}
  kick(){if(this.ready&&this.visible&&!this.running&&!document.hidden){this.running=true;requestAnimationFrame(this._f||(this._f=n=>this.frame(n)));}}
  frame(now){this.running=false;if(!this.visible)return;const dt=Math.min(.05,(now-this.t0)/1000||0);this.t0=now;if(this.onFrame(dt,now))this.kick();}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)stages.forEach(s=>{s.t0=performance.now();s.kick();});});

function Orbit(canvas,o){
  const s={t:new T.Vector3(...o.t),r:o.r,az:o.az,el:o.el,tAz:o.az,tEl:o.el,drag:false,idle:0,lx:0,ly:0,minEl:o.minEl||.15,maxEl:o.maxEl||1.2,onUser:null,kick:null};
  canvas.addEventListener('pointerdown',e=>{s.drag=true;s.lx=e.clientX;s.ly=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch(_){}s.onUser&&s.onUser();});
  canvas.addEventListener('pointermove',e=>{if(!s.drag)return;s.tAz-=(e.clientX-s.lx)*.006;s.tEl=clamp(s.tEl+(e.clientY-s.ly)*.004,s.minEl,s.maxEl);s.lx=e.clientX;s.ly=e.clientY;s.idle=0;s.kick&&s.kick();});
  const end=()=>{s.drag=false;s.idle=0;}; canvas.addEventListener('pointerup',end); canvas.addEventListener('pointercancel',end);
  s.apply=(cam,dt)=>{const k=Math.min(1,dt*6);s.az+=(s.tAz-s.az)*k;s.el+=(s.tEl-s.el)*k;
    cam.position.set(s.t.x+Math.sin(s.az)*Math.cos(s.el)*s.r,s.t.y+Math.sin(s.el)*s.r,s.t.z+Math.cos(s.az)*Math.cos(s.el)*s.r);cam.lookAt(s.t);
    return Math.abs(s.tAz-s.az)>1e-4||Math.abs(s.tEl-s.el)>1e-4;};
  return s;
}

/* shared materials & geometry helpers */
const std=(c,r=.9,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function linScene(scene){const seen=new Set();scene.traverse(o=>{if(o.isLight){o.color&&o.color.convertSRGBToLinear();o.groundColor&&o.groundColor.convertSRGBToLinear();}const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>{if(seen.has(m)||m.userData.lin)return;seen.add(m);m.userData.lin=true;m.color&&m.color.convertSRGBToLinear();m.emissive&&m.emissive.convertSRGBToLinear();});});}
function speckle({base=232,spread=22,n=2600,size=128,dot=1.6,tint=null,rep=1}={}){
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  g.fillStyle=`rgb(${base},${base},${base})`;g.fillRect(0,0,size,size);
  for(let i=0;i<n;i++){const v=clamp(base+(Math.random()-.5)*2*spread,0,255)|0;g.fillStyle=tint?tint(v):`rgb(${v},${v},${v})`;const d=.6+Math.random()*dot;g.fillRect(Math.random()*size,Math.random()*size,d,d);}
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.repeat.set(rep,rep);t.anisotropy=4;return t;
}
function paverGeo(u,h){
  const L=2*u*.95, Wd=u*.92, b=Math.min(u*.09,.028), hw=L/2-b, hd=Wd/2-b;
  const s=new T.Shape(); s.moveTo(-hw,-hd); s.lineTo(hw,-hd); s.lineTo(hw,hd); s.lineTo(-hw,hd); s.lineTo(-hw,-hd);
  const g=new T.ExtrudeGeometry(s,{depth:Math.max(.002,h-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:1});
  g.rotateX(-Math.PI/2); g.translate(0,b,0); return g;
}
function PaverField(parent,{x0,x1,z0,z1,u,h,order,y=0}){
  const planes=[new T.Plane(new T.Vector3(1,0,0),-x0),new T.Plane(new T.Vector3(-1,0,0),x1),new T.Plane(new T.Vector3(0,0,1),-z0),new T.Plane(new T.Vector3(0,0,-1),z1)];
  const tex=speckle({rep:1.7/(u/.3)});
  const mat=new T.MeshStandardMaterial({color:0xffffff,map:tex,roughness:.86,metalness:0,clippingPlanes:planes});
  const geo=paverGeo(u,h), c=new T.Color(), dm=new T.Object3D();
  const f={mesh:null,items:[],start:0,mat};
  f.build=(pat,hex,delay=0,animate=true)=>{
    if(f.mesh)parent.remove(f.mesh);
    const pts=layout(pat,x0/u,x1/u,z0/u,z1/u);
    f.items=pts.map(p=>{const it={x:p.x*u,z:p.y*u,rot:p.rot,j:Math.random()};it.d=order(it)+it.j*.12;return it;});
    f.mesh=new T.InstancedMesh(geo,mat,Math.max(1,f.items.length));
    f.mesh.castShadow=true; f.mesh.receiveShadow=true;
    f.recolor(hex); parent.add(f.mesh);
    f.start=performance.now()+delay*1000; f.place(animate&&!reduce?-1:99);
  };
  f.recolor=hex=>{for(let k=0;k<f.items.length;k++){c.set(hex).convertSRGBToLinear();const v=.84+f.items[k].j*.26;c.r*=v;c.g*=v;c.b*=v;f.mesh.setColorAt(k,c);}if(f.mesh.instanceColor)f.mesh.instanceColor.needsUpdate=true;};
  f.place=el=>{let moving=false;
    for(let k=0;k<f.items.length;k++){const it=f.items[k],t=(el-it.d)/.5;if(t<1)moving=true;const tt=clamp(t,0,1),e=1-Math.pow(1-tt,3);
      dm.position.set(it.x,y+(t<=0?40:(1-e)*2.2),it.z);dm.rotation.set(0,-it.rot+(1-tt)*.5,0);dm.scale.setScalar(t<=0?1e-4:1);dm.updateMatrix();f.mesh.setMatrixAt(k,dm.matrix);}
    f.mesh.instanceMatrix.needsUpdate=true;return moving;};
  f.tick=now=>f.place((now-f.start)/1000);
  return f;
}
function soldierRing(parent,segs,u,h,mat,y){
  // segs: [{x0,x1,z,axis:'x'}|{z0,z1,x,axis:'z'}]
  const geo=paverGeo(u,h), list=[];
  segs.forEach(s=>{if(s.axis==='x'){for(let x=s.x0+u/2;x<s.x1;x+=u)list.push([x,s.z,Math.PI/2]);}else{for(let z=s.z0+u/2;z<s.z1;z+=u)list.push([s.x,z,0]);}});
  const m=new T.InstancedMesh(geo,mat,list.length), d=new T.Object3D();
  list.forEach((p,i)=>{d.position.set(p[0],y,p[1]);d.rotation.set(0,p[2],0);d.updateMatrix();m.setMatrixAt(i,d.matrix);});
  m.castShadow=m.receiveShadow=true; parent.add(m); return m;
}
function addBox(parent,w,h,d,mat,x,y,z,cast=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;}
let _flameTex=null,_glowTex=null;
function flameTex(){if(_flameTex)return _flameTex;const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');
  const gr=g.createRadialGradient(32,100,2,32,84,64);gr.addColorStop(0,'rgba(255,248,215,1)');gr.addColorStop(.22,'rgba(255,205,95,.95)');gr.addColorStop(.55,'rgba(255,115,25,.55)');gr.addColorStop(1,'rgba(255,60,0,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(32,2);g.bezierCurveTo(60,52,62,94,32,126);g.bezierCurveTo(2,94,4,52,32,2);g.fill();
  _flameTex=new T.CanvasTexture(c);_flameTex.encoding=T.sRGBEncoding;return _flameTex;}
function glowTex(){if(_glowTex)return _glowTex;const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,170,80,1)');gr.addColorStop(.4,'rgba(255,110,30,.4)');gr.addColorStop(1,'rgba(255,80,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);_glowTex=new T.CanvasTexture(c);_glowTex.encoding=T.sRGBEncoding;return _glowTex;}
function firePit(parent,x,z,r,mat,capMat){
  const g=new T.Group(); g.position.set(x,0,z); parent.add(g);
  const n=14, bl=2*Math.PI*r/n*.92;
  for(let row=0;row<2;row++)for(let i=0;i<n;i++){const a=(i+(row?.5:0))/n*Math.PI*2;const m=addBox(g,bl,.3,.34,mat,Math.cos(a)*r,.2+.15+row*.31,Math.sin(a)*r);m.rotation.y=-a+Math.PI/2;}
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const m=addBox(g,bl*1.08,.06,.44,capMat,Math.cos(a)*(r+.02),.84,Math.sin(a)*(r+.02));m.rotation.y=-a+Math.PI/2;}
  const em=new T.Mesh(new T.CylinderGeometry(r-.12,r-.12,.08,24),new T.MeshStandardMaterial({color:0x140a05,emissive:0xff4a00,emissiveIntensity:.55,roughness:1}));em.position.y=.58;g.add(em);
  const logM=new T.MeshStandardMaterial({color:0x2a1d14,emissive:0xff5a10,emissiveIntensity:.25,roughness:1});
  [0,1.05,2.1].forEach(a=>{const l=new T.Mesh(new T.CylinderGeometry(.055,.065,r*1.1,8),logM);l.rotation.z=Math.PI/2;l.rotation.y=a;l.position.y=.67;g.add(l);});
  const sprites=[];
  for(let i=0;i<7;i++){const m=new T.SpriteMaterial({map:flameTex(),blending:T.AdditiveBlending,depthWrite:false,transparent:true});const s=new T.Sprite(m);
    const a=Math.random()*Math.PI*2,rr=Math.random()*r*.32;s.position.set(Math.cos(a)*rr,0,Math.sin(a)*rr);
    s.userData={sx:r*(.32+Math.random()*.18),sy:r*(.65+Math.random()*.45),y:.66,p:Math.random()*6};g.add(s);sprites.push(s);}
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex(),color:0xff8a3a,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:.45}));glow.scale.set(r*3.4,r*2.4,1);glow.position.y=.8;g.add(glow);
  const update=t=>{sprites.forEach((s,i)=>{const d=s.userData,f=1+Math.sin(t*(8+i*1.7)+d.p)*.18+Math.sin(t*(19+i*2.3)+d.p)*.08;s.scale.set(d.sx*(1.08-.08*f),d.sy*f,1);s.position.y=d.y+d.sy*f*.5;s.material.opacity=.7+.3*Math.sin(t*(11+i)+d.p);});glow.material.opacity=.38+.08*Math.sin(t*9);};
  update(0);
  return {g,update};
}
function canvasTex(size,draw,{rep=1,wrap=true}={}){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);if(wrap){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep,rep);}t.encoding=T.sRGBEncoding;t.anisotropy=8;return t;}
function grassTex(dry,rep){return canvasTex(512,(g,S)=>{g.fillStyle=dry?'#5f6a3e':'#3a4f2d';g.fillRect(0,0,S,S);
  for(let i=0;i<34000;i++){const x=Math.random()*S,y=Math.random()*S,l=2+Math.random()*5,a=-Math.PI/2+(Math.random()-.5)*1.1;
    const r=dry?78+Math.random()*62:42+Math.random()*34,gg=dry?88+Math.random()*46:62+Math.random()*44,b=dry?44+Math.random()*22:30+Math.random()*18;
    g.strokeStyle=`rgba(${r|0},${gg|0},${b|0},.6)`;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}},{rep});}
function grassClump(parent,x,z,h,n,mat,spread=.12,lean0=.25){
  const pos=[];for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.random()*spread,bx=Math.cos(a)*r,bz=Math.sin(a)*r,hh=h*(.55+Math.random()*.45),lean=lean0*(.6+Math.random()*.9),la=a+(Math.random()-.5)*.8,w=.016+Math.random()*.012;
    const tx=bx+Math.cos(la)*hh*lean,tz=bz+Math.sin(la)*hh*lean,px=-Math.sin(la)*w,pz=Math.cos(la)*w;pos.push(bx-px,0,bz-pz,bx+px,0,bz+pz,tx,hh,tz);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
  const m=new T.Mesh(geo,mat);m.position.set(x,0,z);m.castShadow=true;parent.add(m);return m;}

function arcWall(parent,cx,cz,R,a0,a1,mat,capMat){
  const len=R*(a1-a0), n=Math.round(len/.56), step=(a1-a0)/n;
  for(let row=0;row<2;row++)for(let i=0;i<n-(row?1:0);i++){const a=a0+step*(i+.5+(row?.5:0));const m=addBox(parent,step*R*.95,.34,.42,mat,cx+Math.cos(a)*R,.2+.17+row*.35,cz+Math.sin(a)*R);m.rotation.y=-a+Math.PI/2;}
  for(let i=0;i<n;i++){const a=a0+step*(i+.5);const m=addBox(parent,step*R*1.02,.07,.56,capMat,cx+Math.cos(a)*R,.93,cz+Math.sin(a)*R);m.rotation.y=-a+Math.PI/2;}
}
function shrub(parent,x,z,s,mat){const m=new T.Mesh(new T.IcosahedronGeometry(s,1),mat);m.position.set(x,s*.75,z);m.scale.y=.8;m.castShadow=true;m.receiveShadow=true;m.rotation.y=Math.random()*3;parent.add(m);return m;}
function palm(parent,x,z,h,lean,rotY,trunkMat,leafMats){
  const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotY;parent.add(g);
  const seg=8;let px=0,py=0;
  for(let i=0;i<seg;i++){const t1=i/seg,t2=(i+1)/seg,y1=h*t1,y2=h*t2,x1=lean*h*t1*t1,x2=lean*h*t2*t2,len=Math.hypot(x2-x1,y2-y1);
    const m=new T.Mesh(new T.CylinderGeometry(.17-.06*t2,.17-.06*t1,len*1.04,7),trunkMat);m.position.set((x1+x2)/2,(y1+y2)/2,0);m.rotation.z=-Math.atan2(x2-x1,y2-y1);m.castShadow=true;g.add(m);px=x2;py=y2;}
  for(let i=0;i<10;i++){
    const geo=new T.PlaneGeometry(.6,2.7,1,7),pos=geo.attributes.position;
    for(let v=0;v<pos.count;v++){const yy=pos.getY(v)+1.35,t=yy/2.7,xx=pos.getX(v);pos.setXYZ(v,yy,.5*t-1.5*t*t,xx*(1-t*.8));}
    geo.computeVertexNormals();
    const f=new T.Mesh(geo,leafMats[i%2]);f.castShadow=true;f.position.set(px,py,0);f.rotation.y=i/10*Math.PI*2+Math.random()*.2;f.rotation.z=(Math.random()-.5)*.25;g.add(f);
  }
}

/* ============ PAVER STYLES: 3D sample block built from the real product photo ============ */
(function sxBlock(){
  const canvas=$('#sxCanvas'), stage=$('.sx-stage');
  const st=new Stage(canvas,{lazy:true,shadows:true,exposure:.9});
  const scene=new T.Scene(), cam=new T.PerspectiveCamera(30,1,.1,100);
  scene.add(new T.HemisphereLight(0xfff6ec,0x2a2219,.5));
  const key=new T.DirectionalLight(0xfff1e0,1.3);key.position.set(5,9,4);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:1,far:30});key.shadow.bias=-.0004;key.shadow.radius=4;scene.add(key);
  const rim=new T.DirectionalLight(0xffd2a8,.45);rim.position.set(-6,3,-5);scene.add(rim);
  // dimensions (metres): paved field + soldier border + layers below
  const W=3.0,D=2.2,B=.2,PH=.08,SAND=.035,BASE=.16,SOIL=.26,TILE=.95;
  const loader=new T.TextureLoader(), cache={};
  const tex=(src,rx,ry,rot)=>{const k=src+rx+ry+(rot||0);if(cache[k])return cache[k];const t=loader.load(src,()=>st.kick());t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.repeat.set(rx,ry);if(rot){t.center.set(.5,.5);t.rotation=rot;}t.anisotropy=Math.min(8,st.renderer?st.renderer.capabilities.getMaxAnisotropy():4);return cache[k]=t;};
  const surf=new T.MeshStandardMaterial({roughness:.86,metalness:0,bumpScale:.018});
  const side=new T.MeshStandardMaterial({roughness:.9,color:0xb9b2a8});
  const bordX=new T.MeshStandardMaterial({roughness:.84,bumpScale:.014}), bordZ=bordX.clone();
  const field=new T.Mesh(new T.BoxGeometry(W,PH,D),[side,side,surf,side,side,side]);field.position.y=-PH/2;field.castShadow=field.receiveShadow=true;scene.add(field);
  const edges=[[W+2*B,B,0,(D+B)/2,bordX],[W+2*B,B,0,-(D+B)/2,bordX],[B,D,(W+B)/2,0,bordZ],[B,D,-(W+B)/2,0,bordZ]];
  edges.forEach(([w,d,x,z,m])=>{const e=new T.Mesh(new T.BoxGeometry(w,PH+.004,d),[side,side,m,side,side,side]);e.position.set(x,-PH/2+.002,z);e.castShadow=e.receiveShadow=true;scene.add(e);});
  const TW=W+2*B,TD=D+2*B;let y=-PH;
  [[SAND,speckle({base:222,spread:26,n:7000,dot:1,rep:3}),0xd6c08f],[BASE,speckle({base:185,spread:70,n:3000,dot:5,rep:2}),0x9a958e],[SOIL,speckle({base:190,spread:50,n:5000,dot:2.5,rep:2}),0x6f4f35]].forEach(([h,t,c])=>{
    const m=new T.Mesh(new T.BoxGeometry(TW,h,TD),new T.MeshStandardMaterial({color:c,map:t,roughness:.97}));m.position.y=y-h/2;m.castShadow=m.receiveShadow=true;scene.add(m);y-=h;});
  const ground=new T.Mesh(new T.PlaneGeometry(40,40),new T.ShadowMaterial({opacity:.42}));ground.rotation.x=-Math.PI/2;ground.position.y=y-.001;ground.receiveShadow=true;scene.add(ground);
  linScene(scene);
  const orb=Orbit(canvas,{t:[0,-.25,.15],r:6.5,az:.62,el:.52,minEl:.22,maxEl:1.15});
  let auto=true; orb.onUser=()=>{auto=false;stage.classList.add('touched');}; orb.kick=()=>st.kick();
  sx3d.set=()=>{
    const c=design.coll,col=design.color,b=design.border;
    const s=texSrc(c.id,col[0]);
    const t=tex(s,W/TILE,D/TILE); surf.map=t; surf.bumpMap=t; surf.needsUpdate=true;
    const bs=b.tex?texSrc(b.tex[0],b.tex[1]):s;
    bordX.map=bordX.bumpMap=tex(bs,(W+2*B)/.9,B/.9*1.6); bordZ.map=bordZ.bumpMap=tex(bs,D/.9,B/.9*1.6,Math.PI/2);
    bordX.needsUpdate=bordZ.needsUpdate=true; st.kick();
  };
  st.onInit=()=>sx3d.set();
  sx3d.kick=()=>st.kick();
  st.onResize=(w,h)=>{cam.aspect=w/h;cam.fov=w/h<1.05?38:30;orb.r=w/h<1.05?7.8:6.5;cam.updateProjectionMatrix();};
  st.onFrame=(dt)=>{
    if(!stage.classList.contains('m3d'))return false;
    if(auto&&!reduce)orb.tAz+=dt*.12;
    const moving=orb.apply(cam,dt);
    st.renderer.render(scene,cam);
    return moving||(auto&&!reduce);
  };
})();

/* ============ BUILD-UP: exploded cross-section ============ */
(function build(){
  const canvas=$('#buildCanvas'), track=$('#buildTrack'), tagsEl=$('#ltags'), lis=$$('#layers li');
  const st=new Stage(canvas,{lazy:true,exposure:1.05});
  const scene=new T.Scene(), cam=new T.PerspectiveCamera(30,1,.1,100);
  scene.add(new T.HemisphereLight(0xfff3e6,0x1a1410,.7));
  const k1=new T.DirectionalLight(0xffffff,1.6);k1.position.set(6,9,7);scene.add(k1);
  const k2=new T.DirectionalLight(0xea680f,.7);k2.position.set(-8,3,-4);scene.add(k2);
  const S=4.4,hs=S/2,gap=.72;
  const orange=new T.Color(0xea680f);
  const mk=(c,tex,r=.95)=>{const m=new T.MeshStandardMaterial({color:c,roughness:r,emissive:orange,emissiveIntensity:0});if(tex)m.map=tex;return m;};
  const defs=[
    {h:1.0,mat:mk(0x7a5638,speckle({base:200,spread:50,n:5000,dot:2.5,rep:2}))},
    {h:.05,mat:mk(0xe9e4da,speckle({base:240,spread:10,rep:4}))},
    {h:.7,mat:mk(0x9a958e,speckle({base:190,spread:70,n:2600,dot:5,rep:1.5}))},
    {h:.16,mat:mk(0xd8c290,speckle({base:225,spread:25,n:6000,dot:1,rep:2}))},
    {h:.24,pavers:true},
    {h:.03,sheet:true}
  ];
  const groups=[];let base=0;
  defs.forEach((d,i)=>{
    const g=new T.Group();scene.add(g);d.base=base;base+=d.h;
    if(d.pavers){
      const f=PaverField(g,{x0:-hs,x1:hs,z0:-hs,z1:hs,u:.2,h:.24,order:()=>0,y:0});f.build('h45','#cdbb9c',0,false);
      f.mat.emissive.set(0xea680f);f.mat.emissiveIntensity=0;d.mat=f.mat;
      const er=mk(0x1d1d1d,null,.6);addBox(g,S+.16,.2,.08,er,0,.1,hs+.04,false);addBox(g,.08,.2,S,er,hs+.04,.1,0,false);d.extra=er;
    }else if(d.sheet){
      d.mat=new T.MeshStandardMaterial({color:0xfff0dc,roughness:.04,metalness:.2,transparent:true,opacity:.14,emissive:orange,emissiveIntensity:0});
      const bg=new T.BoxGeometry(S,d.h,S),m=new T.Mesh(bg,d.mat);m.position.y=d.h/2;g.add(m);
      const ed=new T.LineSegments(new T.EdgesGeometry(bg),new T.LineBasicMaterial({color:0xffd7b0,transparent:true,opacity:.8}));ed.position.y=d.h/2;g.add(ed);
    }else{const m=new T.Mesh(new T.BoxGeometry(S,d.h,S),d.mat);m.position.y=d.h/2;g.add(m);}
    groups.push(g);
  });
  linScene(scene);
  const tags=LAYERS.map((l,i)=>{const e=document.createElement('span');e.className='ltag';e.textContent=`0${i+1} ${l.short}`;tagsEl.appendChild(e);return e;});
  let tT=0,tS=0,narrow=false,active=-2;
  const measure=()=>{if(narrow){tT=1;return;}const r=track.getBoundingClientRect();tT=clamp(-r.top/Math.max(1,r.height-innerHeight),0,1);};
  scrollers.push(()=>{measure();st.kick();});
  st.onResize=(w,h)=>{narrow=innerWidth<=980;cam.aspect=w/h;cam.updateProjectionMatrix();measure();if(narrow){tS=1;lis.forEach(l=>l.classList.add('on'));}};
  const pv=new T.Vector3();
  st.onFrame=(dt)=>{
    tS+=(tT-tS)*Math.min(1,dt*7); const moving=Math.abs(tT-tS)>.0005;
    const e=smooth(0,.32,tS);
    const idx=narrow?-1:(tS<.32?-1:Math.min(5,Math.floor((tS-.32)/.68*6)));
    groups.forEach((g,i)=>{g.position.y=defs[i].base+i*gap*e;});
    if(idx!==active){active=idx;defs.forEach((d,i)=>{d.mat.emissiveIntensity=i===idx?.28:0;if(d.extra)d.extra.emissiveIntensity=i===idx?.28:0;});defs[5].mat.opacity=idx===5?.3:.14;
      if(!narrow)lis.forEach((l,i)=>l.classList.toggle('on',idx===-1?false:i<=idx));tags.forEach((t,i)=>t.classList.toggle('on',i===idx));}
    const cy=lerp(1.1,2.9,e), r=narrow?14.5:13, az=.62+tS*.9, el=.4+.08*(1-e);
    cam.position.set(Math.sin(az)*Math.cos(el)*r,cy+Math.sin(el)*r,Math.cos(az)*Math.cos(el)*r);cam.lookAt(0,cy,0);
    st.renderer.render(scene,cam);
    tags.forEach((t,i)=>{const sx=Math.sin(az)>0?hs:-hs;pv.set(sx,groups[i].position.y+defs[i].h/2,hs).project(cam);const x=(pv.x+1)/2*st.w,y=(1-pv.y)/2*st.h;t.style.opacity=e>.6?1:0;t.style.transform=`translate3d(${(x+14).toFixed(1)}px,${(y-11).toFixed(1)}px,0)`;});
    $('#bprog').style.setProperty('--bp',tS.toFixed(3));
    return moving;
  };
})();

requestAnimationFrame(onScroll);
})();
