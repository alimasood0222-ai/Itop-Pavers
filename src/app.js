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
const COLORS=[['Travertine','#cdbb9c'],['Shellstone grey','#8f8780'],['Terracotta','#a35b3c'],['Charcoal','#4a4744'],['Coquina white','#e7e0d3']];
const BORDERS=[['Charcoal','#34322f'],['Travertine','#bfae90'],['Terracotta','#8a4a31']];
const TYPES=['Patio','Driveway','Pool deck','Walkway','Paving maintenance','Fiberglass pool','Outdoor kitchen','Pergola or gazebo','Fire pit or retaining wall','Screen enclosure','Not sure yet'];
const SPOTS=[
  {id:'patio',name:'Paver patio',type:'Patio',pos:[-1.2,.35,-4.8],view:{t:[-1.5,0,-4.6],r:20,az:.3,el:.58},
   text:'Herringbone pavers on a compacted base, finished with a soldier-course border and set flush with the sliding doors.'},
  {id:'pool',name:'Pool deck',type:'Pool deck',pos:[6.6,.4,1.8],view:{t:[6.6,0,1.8],r:19,az:.9,el:.55},
   text:'Light, slip-resistant pavers and bullnose coping around a fiberglass pool. One crew builds the pool and the deck.'},
  {id:'kitchen',name:'Outdoor kitchen & pergola',type:'Outdoor kitchen',pos:[-6.8,1.7,-7.4],view:{t:[-7.1,1.1,-7],r:13.5,az:.55,el:.1},
   text:'Stone-clad counters, a built-in grill and a pergola that shades dinner, designed to the inch in 3D first.'},
  {id:'fire',name:'Fire pit & seat wall',type:'Fire pit or retaining wall',pos:[-5.2,1.15,1.8],view:{t:[-5.2,.4,1.4],r:14.5,az:-.45,el:.5},
   text:'A built-in fire pit wrapped by a curved seat wall in matching block. The spot everyone ends up at.'}
];
const LAYERS=[
  {name:'Compacted subgrade',txt:'We dig out the soil and compact it so the patio never settles unevenly.',short:'Subgrade'},
  {name:'Geotextile fabric',txt:'Keeps soil and stone apart so the base stays clean and strong.',short:'Fabric'},
  {name:'Crushed-stone base',txt:'Laid and compacted in layers. This is what carries the load.',short:'Stone base'},
  {name:'Bedding sand',txt:'A screeded, level bed that the pavers settle into.',short:'Sand bed'},
  {name:'Pavers & edge restraint',txt:'Laid to pattern, cut clean at the border and locked in place.',short:'Pavers'},
  {name:'Joint sand & sealer',txt:'Polymeric sand locks the joints; sealing protects colour from the Florida sun.',short:'Sealer'}
];
const design={pattern:'h45',color:COLORS[0],border:BORDERS[0],used:false};
const designText=()=>`${PATTERNS[design.pattern].name} · ${design.color[0]} · ${design.border[0]} border`;

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
  $$('.svc, .step, .card, .adv').forEach((el,i)=>{if(el.getBoundingClientRect().top>innerHeight){el.classList.add('reveal','pre');el.style.transitionDelay=(i%5)*60+'ms';io.observe(el);}});
}

/* service card tilt + preselect */
$$('.svc').forEach(c=>{
  c.addEventListener('click',()=>selectType(c.dataset.type));
  if(!fine.matches||reduce)return;
  c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.setProperty('--rx',(-y*12).toFixed(2)+'deg');c.style.setProperty('--ry',(x*14).toFixed(2)+'deg');});
  c.addEventListener('pointerleave',()=>{c.style.setProperty('--rx','0deg');c.style.setProperty('--ry','0deg');});
});

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
  $('#map').innerHTML=`<svg viewBox="0 0 ${W} ${H+T+10}" role="img" aria-label="Schematic map of the iTOP Pavers service area in Northeast Florida, from Fernandina Beach to St. Augustine, with the office in Jacksonville.">
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

/* ================= studio controls (DOM) ================= */
const studioApi={};
$('#colors').innerHTML=COLORS.map((c,i)=>`<button class="sw" type="button" style="--c:${c[1]}" data-i="${i}" aria-pressed="${i===0}" aria-label="${c[0]}" title="${c[0]}"></button>`).join('');
$('#borders').innerHTML=BORDERS.map((c,i)=>`<button class="sw sm" type="button" style="--c:${c[1]}" data-i="${i}" aria-pressed="${i===0}" aria-label="${c[0]} border" title="${c[0]}"></button>`).join('');
function syncStudioText(){
  $('#patName').textContent=PATTERNS[design.pattern].name;
  $('#patInfo').textContent=PATTERNS[design.pattern].info;
  $('#colName').textContent=design.color[0];
  $('#bordName').textContent=design.border[0];
  $('#sumText').textContent=designText();
  $$('#patterns canvas').forEach(cv=>{cv.dataset.col=design.color[1];drawPattern(cv);});
  if(design.used)renderDesignBox();
}
syncStudioText();
$('#patterns').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.p===design.pattern)return;design.pattern=b.dataset.p;$$('#patterns button').forEach(x=>x.setAttribute('aria-pressed',x===b));syncStudioText();studioApi.pattern&&studioApi.pattern();});
$('#colors').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;design.color=COLORS[+b.dataset.i];$$('#colors button').forEach(x=>x.setAttribute('aria-pressed',x===b));syncStudioText();studioApi.color&&studioApi.color();});
$('#borders').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;design.border=BORDERS[+b.dataset.i];$$('#borders button').forEach(x=>x.setAttribute('aria-pressed',x===b));syncStudioText();studioApi.border&&studioApi.border();});
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{$$('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));setSplit(b.dataset.view==='after'?0:.5,b.dataset.view==='after');}));
$('#useDesign').addEventListener('click',()=>{design.used=true;renderDesignBox();if(!$('input[name="type"]:checked'))selectType('Patio');});

let split=.5;
const splitEl=$('#split'), knob=$('#knob'), card=$('#studioCard');
function setSplit(v,hide){
  split=clamp(v,0,1);
  splitEl.style.left=(split*100)+'%';
  splitEl.classList.toggle('hide',!!hide);
  $('#tagL').classList.toggle('hide',split<.14);
  $('#tagR').classList.toggle('hide',split>.86);
  const pc=Math.round(split*100);
  knob.setAttribute('aria-valuenow',pc); knob.setAttribute('aria-valuetext',`${pc}% today, ${100-pc}% with iTOP`);
  studioApi.kick&&studioApi.kick();
}
setSplit(.5);
knob.addEventListener('pointerdown',e=>{
  knob.setPointerCapture(e.pointerId);
  const move=ev=>{const r=card.getBoundingClientRect();setSplit((ev.clientX-r.left)/r.width);};
  const up=()=>{knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',up);knob.removeEventListener('pointercancel',up);};
  knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',up);knob.addEventListener('pointercancel',up);
});
knob.addEventListener('keydown',e=>{const d={ArrowLeft:-.05,ArrowRight:.05,Home:-1,End:1}[e.key];if(d===undefined)return;e.preventDefault();setSplit(split+d);});

/* ================= quote form (3 steps) ================= */
$('#typeOpts').setAttribute('role','radiogroup');
$('#typeOpts').setAttribute('aria-label','Project type');
$('#typeOpts').innerHTML=TYPES.map(t=>`<label class="opt"><input type="radio" name="type" value="${esc(t)}"><span>${esc(t)}</span></label>`).join('');
function selectType(t){const r=$$('input[name="type"]').find(i=>i.value===t);if(r)r.checked=true;}
function renderDesignBox(){
  const box=$('#designBox');
  if(design.used){
    box.innerHTML=`<div class="design-chip"><canvas data-pat="${design.pattern}" data-col="${design.color[1]}" data-u="5"></canvas><div><small>From the 3D studio</small><b>${esc(designText())}</b><a href="#studio">Change design</a></div></div>`;
    requestAnimationFrame(()=>box.querySelectorAll('canvas').forEach(drawPattern));
  }else{
    box.innerHTML=`<div class="design-chip"><div><small>No design yet</small><b>Want to pick a pattern and colour first?</b><a href="#studio">Open the 3D studio</a></div></div>`;
  }
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
  const d=v('f-phone').replace(/\D/g,'');
  chk('phone',d.length===10||(d.length===11&&d[0]==='1'),'Enter a 10-digit US phone number.');
  chk('email',/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('f-email')),'Enter an email like name@example.com.');
  chk('zip',/^\d{5}$/.test(v('f-zip')),'Enter your 5-digit ZIP code.');
  if(first)first.focus();
  return ok;
}
qform.addEventListener('submit',e=>{
  e.preventDefault();
  if(!validate(qStep))return;
  if(qStep<3){showStep(qStep+1,true);return;}
  const name=$('#f-name').value.trim().split(' ')[0];
  const type=$('input[name="type"]:checked').value;
  $('#qcard').innerHTML=`<div class="done" aria-live="polite"><div class="eyebrow">Request ready</div><h3>Thanks, ${esc(name)}.</h3><p>${esc(type)}${design.used?' · '+esc(designText()):''}</p><p style="margin-top:10px">Concept preview: nothing was sent. On the live site this request goes straight into GoHighLevel with your 3D design attached, and the office calls you within one business day.</p></div>`;
});
qBack.addEventListener('click',()=>showStep(qStep-1,true));

/* ================= hero explore panel (DOM) ================= */
const explore=$('#explore'), exList=$('#exList');
exList.innerHTML=SPOTS.map((s,i)=>`<li><button type="button" data-spot="${s.id}"><span class="n">${i+1}</span>${esc(s.name)}<svg><use href="#i-right"/></svg></button></li>`).join('');
const heroApi={};
const exitView=$('#exitView'), exNext=$('#exNext');
let curSpot=null;
function showSpot(id){
  const s=SPOTS.find(x=>x.id===id);
  curSpot=s||null; exitView.hidden=!s;
  if(!s){explore.classList.remove('detail');heroApi.focus&&heroApi.focus(null);return;}
  explore.classList.add('detail');
  const nx=SPOTS[(SPOTS.indexOf(s)+1)%SPOTS.length];
  exNext.innerHTML=`Next: ${esc(nx.name)} <svg><use href="#i-right"/></svg>`; exNext.dataset.spot=nx.id;
  $('#exTitle').textContent=s.name; $('#exText').textContent=s.text;
  $('#exCta').onclick=()=>selectType(s.type);
  heroApi.focus&&heroApi.focus(s);
}
exList.addEventListener('click',e=>{const b=e.target.closest('button');if(b)showSpot(b.dataset.spot);});
$('#exBack').addEventListener('click',()=>{showSpot(null);const b=exList.querySelector('button');b&&b.focus();});
exNext.addEventListener('click',()=>showSpot(exNext.dataset.spot));
exitView.addEventListener('click',()=>showSpot(null));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&curSpot&&!openId&&lb.hidden&&!mnav.classList.contains('open'))showSpot(null);});
$$('[data-tod]').forEach(b=>b.addEventListener('click',()=>{$$('[data-tod]').forEach(x=>x.setAttribute('aria-pressed',x===b));heroApi.tod&&heroApi.tod(+b.dataset.tod);}));

/* layers list */
$('#layers').innerHTML=LAYERS.map((l,i)=>`<li><span class="ln">0${i+1}</span><div><b>${esc(l.name)}</b><small>${esc(l.txt)}</small></div></li>`).join('');

/* ================= 3D ================= */
const T=window.THREE;
function no3d(){document.documentElement.classList.add('no3d');$$('#heroCanvas,#studioCanvas,#buildCanvas').forEach(c=>c.style.visibility='hidden');}
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

/* ============ HERO: dusk backyard ============ */
(function hero(){
  const canvas=$('#heroCanvas'), pinsEl=$('#heroPins');
  const st=new Stage(canvas,{shadows:true,exposure:1.12});
  const scene=new T.Scene(), cam=new T.PerspectiveCamera(33,1,.1,700);
  const M={stucco:std(0xe7e1d6,.95),trim:std(0x1c1b1a,.55),roof:std(0x2b2927,.8),base:std(0xb3a280,1),lawn:std(0x3e6234,1),metal:std(0x2b2927,.45,.35),
    stone:std(0x8c8174,.95),block:std(0xd6cdbf,.9),cap:std(0x3a3633,.7),granite:std(0x1d1d1d,.3),steel:std(0xc0c4c8,.3,.85),coping:std(0xece6db,.75),
    white:std(0xf1eee8,.8),wood:std(0x7a5a3f,.75),orange:std(0xea680f,.7),trunk:std(0x8a735c,1),border:std(0x34322f,.8),hedge:std(0x2f5129,1),
    leaf:new T.MeshStandardMaterial({color:0x3f6e35,roughness:.9,side:T.DoubleSide}),leaf2:new T.MeshStandardMaterial({color:0x31592b,roughness:.9,side:T.DoubleSide}),
    glass:new T.MeshStandardMaterial({color:0x1f2b31,roughness:.12,metalness:.4,emissive:0xffa75e,emissiveIntensity:0}),
    tile:new T.MeshStandardMaterial({color:0x58b9cf,roughness:.35,emissive:0x12a8cc,emissiveIntensity:0}),
    water:new T.MeshStandardMaterial({color:0x2fb0d0,roughness:.05,metalness:.25,transparent:true,opacity:.8,emissive:0x0a6c88,emissiveIntensity:0}),
    bulb:new T.MeshBasicMaterial({color:0xffd59a}),lamp:new T.MeshStandardMaterial({color:0x2a2826,emissive:0xffc27a,emissiveIntensity:0})};
  M.tile.map=speckle({base:240,spread:14,rep:6});
  M.stone.map=speckle({base:220,spread:40,n:3200,dot:2.6,rep:2});

  /* sky dome */
  const skyU={top:{value:new T.Color()},mid:{value:new T.Color()},bot:{value:new T.Color()}};
  scene.add(new T.Mesh(new T.SphereGeometry(300,32,16),new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
    vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform vec3 top,mid,bot;varying vec3 vP;void main(){float h=vP.y;vec3 c=h>0.?mix(mid,top,pow(smoothstep(0.,.6,h),.7)):mix(mid,bot,smoothstep(0.,-.15,h));gl_FragColor=vec4(c,1.);}'})));
  scene.fog=new T.Fog(0x5a3b33,55,170);

  /* lawn with pool hole */
  const PX0=2.8,PX1=10.4,PZ0=-.2,PZ1=3.8, C=.4;
  const ls=new T.Shape();ls.moveTo(-70,-70);ls.lineTo(70,-70);ls.lineTo(70,70);ls.lineTo(-70,70);ls.lineTo(-70,-70);
  const hole=new T.Path();hole.moveTo(PX0-C,-(PZ0-C));hole.lineTo(PX0-C,-(PZ1+C));hole.lineTo(PX1+C,-(PZ1+C));hole.lineTo(PX1+C,-(PZ0-C));hole.lineTo(PX0-C,-(PZ0-C));ls.holes.push(hole);
  const lawn=new T.Mesh(new T.ShapeGeometry(ls),M.lawn);lawn.rotation.x=-Math.PI/2;lawn.receiveShadow=true;scene.add(lawn);

  /* house */
  const H=new T.Group();scene.add(H);
  addBox(H,26,3.4,6,M.stucco,0,1.7,-12); addBox(H,10,2.8,4.5,M.stucco,-6.5,4.8,-12.75);
  addBox(H,27,.3,7.8,M.roof,0,3.55,-11.7); addBox(H,11,.26,5.4,M.roof,-6.5,6.33,-12.7);
  addBox(H,7,2.7,.08,M.glass,-3,1.37,-8.97,false);
  [-6.5,-4.75,-3,-1.25,.5].forEach(x=>addBox(H,.09,2.75,.14,M.trim,x,1.38,-8.94)); addBox(H,7.1,.1,.16,M.trim,-3,2.75,-8.94);
  addBox(H,6,1.7,.08,M.glass,5.5,1.85,-8.97,false); [2.5,5.5,8.5].forEach(x=>addBox(H,.09,1.75,.14,M.trim,x,1.85,-8.94));
  addBox(H,6.1,.09,.16,M.trim,5.5,2.72,-8.94); addBox(H,6.1,.09,.16,M.trim,5.5,.98,-8.94);
  addBox(H,6,1.4,.08,M.glass,-6.5,4.85,-10.47,false); [-9.5,-6.5,-3.5].forEach(x=>addBox(H,.09,1.45,.14,M.trim,x,4.85,-10.44));
  [-10,-6,-2,2,6,10].forEach(x=>{const d=new T.Mesh(new T.CircleGeometry(.12,12),M.bulb);d.rotation.x=Math.PI/2;d.position.set(x,3.39,-8.3);H.add(d);});

  /* base + pavers + border + coping */
  [[-10.6,13.6,-9.3,-.6],[-10.6,PX0-C,-.6,PZ1+C],[PX1+C,13.6,-.6,PZ1+C],[-10.6,13.6,PZ1+C,7.25]].forEach(([a,b,c,d])=>addBox(scene,b-a,.14,d-c,M.base,(a+b)/2,-.05,(c+d)/2,false));
  const ord=it=>(it.z+9)*.085+Math.abs(it.x-1)*.028;
  const fields=[[-10,13,-9,PZ0-C],[-10,PX0-C,PZ0-C,PZ1+C],[PX1+C,13,PZ0-C,PZ1+C],[-10,13,PZ1+C,6.6]].map(([a,b,c,d])=>PaverField(scene,{x0:a,x1:b,z0:c,z1:d,u:.3,h:.18,order:ord,y:.02}));
  fields.forEach(f=>f.build('h45','#cdbb9c',.25));
  soldierRing(scene,[{axis:'x',x0:-10.6,x1:13.6,z:6.9},{axis:'z',z0:-9,z1:6.6,x:-10.3},{axis:'z',z0:-9,z1:6.6,x:13.3}],.3,.2,M.border,.02);
  (function(){const g=new T.BoxGeometry(.58,.24,.4),g2=new T.BoxGeometry(.4,.24,.58),list=[];
    for(let x=PX0-C+.3;x<PX1+C;x+=.6){list.push([g,x,PZ0-C/2]);list.push([g,x,PZ1+C/2]);}
    for(let z=PZ0+.3;z<PZ1;z+=.6){list.push([g2,PX0-C/2,z]);list.push([g2,PX1+C/2,z]);}
    list.forEach(([geo,x,z])=>{const m=new T.Mesh(geo,M.coping);m.position.set(x,.14,z);m.castShadow=m.receiveShadow=true;scene.add(m);});})();

  /* pool */
  const pcx=(PX0+PX1)/2,pcz=(PZ0+PZ1)/2,pw=PX1-PX0,pd=PZ1-PZ0;
  addBox(scene,pw,1.6,.1,M.tile,pcx,-.6,PZ0+.05,false);addBox(scene,pw,1.6,.1,M.tile,pcx,-.6,PZ1-.05,false);
  addBox(scene,.1,1.6,pd,M.tile,PX0+.05,-.6,pcz,false);addBox(scene,.1,1.6,pd,M.tile,PX1-.05,-.6,pcz,false);
  addBox(scene,pw,.1,pd,M.tile,pcx,-1.4,pcz,false);
  const wGeo=new T.PlaneGeometry(pw,pd,40,22);wGeo.rotateX(-Math.PI/2);
  const water=new T.Mesh(wGeo,M.water);water.position.set(pcx,.1,pcz);water.receiveShadow=true;scene.add(water);
  const wPos=wGeo.attributes.position, wBase=Float32Array.from(wPos.array);
  const poolL=new T.PointLight(0x55d8ff,0,9,1.6);poolL.position.set(pcx,-.4,pcz);scene.add(poolL);

  /* features that rise in during the intro */
  const rising=[];
  function feature(px,pz,delay){const g=new T.Group();g.position.set(px,0,pz);scene.add(g);rising.push({g,delay});g.scale.setScalar(reduce?1:1e-4);return g;}
  /* pergola + kitchen + dining */
  const PG=feature(-6.7,-6.2,1.5), bx=(w,h,d,m,x,y,z,c)=>addBox(PG,w,h,d,m,x+6.7,y,z+6.2,c);
  [[-9.6,-8.6],[-3.8,-8.6],[-9.6,-3.8],[-3.8,-3.8]].forEach(([x,z])=>bx(.22,2.9,.22,M.metal,x,1.65,z));
  bx(6.2,.26,.2,M.metal,-6.7,3.07,-8.6);bx(6.2,.26,.2,M.metal,-6.7,3.07,-3.8);bx(.2,.26,5.2,M.metal,-9.6,3.07,-6.2);bx(.2,.26,5.2,M.metal,-3.8,3.07,-6.2);
  for(let x=-9.4;x<=-3.9;x+=.36)bx(.07,.2,5.4,M.metal,x,3.29,-6.2);
  bx(4.2,.92,.75,M.stone,-7.3,.66,-8.15);bx(4.35,.07,.86,M.granite,-7.3,1.155,-8.15);
  bx(.75,.92,2.4,M.stone,-9.2,.66,-6.6);bx(.86,.07,2.5,M.granite,-9.2,1.155,-6.6);
  bx(1.1,.28,.62,M.steel,-6.8,1.33,-8.15);bx(1.1,.42,.08,M.steel,-6.8,1.55,-8.45);
  bx(2.2,.07,1.05,M.wood,-6.2,.95,-5.3);[[-7.2,-5.7],[-5.2,-5.7],[-7.2,-4.9],[-5.2,-4.9]].forEach(([x,z])=>bx(.07,.75,.07,M.metal,x,.57,z));
  [[-7,-6.15],[-6.2,-6.15],[-5.4,-6.15],[-7,-4.45],[-6.2,-4.45],[-5.4,-4.45]].forEach(([x,z],i)=>{bx(.46,.06,.46,M.trim,x,.66,z);bx(.46,.5,.05,M.trim,x,.92,z+(i<3?-.2:.2));});
  const bulbG=new T.SphereGeometry(.055,8,6);
  [-7.4,-5].forEach(z=>{for(let i=0;i<11;i++){const t=i/10,b=new T.Mesh(bulbG,M.bulb);b.position.set(-9.4+t*5.4+6.7,2.86-.22*Math.sin(Math.PI*t),z+6.2);PG.add(b);}});
  const pergL=new T.PointLight(0xffc27a,0,10,1.6);pergL.position.set(0,2.5,0);PG.add(pergL);
  /* fire pit + seat wall */
  const FX=-5.2,FZ=1.8, FG=feature(FX,FZ,1.9);
  const fp=firePit(FG,0,0,.9,M.block,M.cap);
  arcWall(FG,0,0,2.55,Math.PI*1.08,Math.PI*1.92,M.block,M.cap);
  const fireL=new T.PointLight(0xff7a1a,0,9,1.5);fireL.position.set(0,1.3,0);FG.add(fireL);
  /* loungers + umbrella */
  const LG=feature(6.4,5.5,2.2), lb=(w,h,d,m,x,y,z)=>addBox(LG,w,h,d,m,x-6.4,y,z-5.5);
  [5,7.8].forEach(x=>{lb(.7,.26,1.6,M.trim,x,.33,5.5);lb(.78,.1,1.9,M.white,x,.5,5.45);const b=lb(.78,.08,.85,M.white,x,.8,6.2);b.rotation.x=.75;});
  lb(.05,2.5,.05,M.metal,6.4,1.45,5.6);
  const can=new T.Mesh(new T.ConeGeometry(1.45,.5,8),M.orange);can.position.set(0,2.62,.1);can.castShadow=true;LG.add(can);
  /* landscape */
  addBox(scene,.9,1.1,16,M.hedge,-11.6,.55,-1.2);
  palm(scene,14.6,-8.2,5.8,.16,.3,M.trunk,[M.leaf,M.leaf2]);palm(scene,15.4,2.8,4.9,-.18,2,M.trunk,[M.leaf,M.leaf2]);
  palm(scene,-12.6,-7.8,6.2,.14,1,M.trunk,[M.leaf,M.leaf2]);palm(scene,-13,4.6,5,.2,4,M.trunk,[M.leaf,M.leaf2]);
  [[14.3,-4,.6],[14.6,-1.5,.5],[14.2,6,.55],[-11.6,7.6,.6],[12,8.6,.45],[3,8.4,.4],[-4,8.6,.5]].forEach(([x,z,s])=>shrub(scene,x,z,s,M.hedge));
  [-8,-4,0,4,8,12].forEach(x=>{addBox(scene,.09,.5,.09,M.trim,x,.25,7.6);const c=new T.Mesh(new T.CylinderGeometry(.09,.09,.08,10),M.lamp);c.position.set(x,.54,7.6);scene.add(c);});

  /* lights */
  const hemi=new T.HemisphereLight(0xffffff,0x222222,.5);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffffff,1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-24,right:24,top:22,bottom:-22,near:1,far:140});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
  scene.add(sun);scene.add(sun.target);sun.target.position.set(1,0,-1);
  const insideL=new T.PointLight(0xffb070,0,12,1.6);insideL.position.set(-3,1.7,-7.4);scene.add(insideL);

  linScene(scene);
  /* time of day */
  const col=h=>new T.Color(h).convertSRGBToLinear(), scol=h=>new T.Color(h);
  const TOD=[
    {skyTop:scol('#4f86d1'),skyMid:scol('#dbe7f0'),skyBot:scol('#76876a'),fog:col('#cbd8e0'),fN:80,fF:240,hS:col('#e6f2ff'),hG:col('#5a4a3a'),hI:.8,sC:col('#fff3e0'),sI:2.4,sP:new T.Vector3(18,32,16),lawn:col('#4d7a3c'),hedge:col('#335a2c'),glass:.04,bulb:col('#4a4540'),lamp:0,tile:.05,water:.12,fire:.5,pool:0,perg:0,inside:0},
    {skyTop:scol('#11172e'),skyMid:scol('#e37a3c'),skyBot:scol('#24160f'),fog:col('#6a463a'),fN:60,fF:180,hS:col('#e6c2b0'),hG:col('#2a1d16'),hI:.62,sC:col('#ffa468'),sI:1.55,sP:new T.Vector3(38,9,12),lawn:col('#3d5f31'),hedge:col('#2c4a26'),glass:1.1,bulb:col('#ffd59a'),lamp:1.5,tile:.55,water:.6,fire:3,pool:2.6,perg:1.7,inside:2}
  ];
  const tc=new T.Color();
  function applyTod(v){
    const a=TOD[0],b=TOD[1],m=(k)=>tc.copy(a[k]).lerp(b[k],v);
    skyU.top.value.copy(m('skyTop'));skyU.mid.value.copy(m('skyMid'));skyU.bot.value.copy(m('skyBot'));
    scene.fog.color.copy(m('fog'));scene.fog.near=lerp(a.fN,b.fN,v);scene.fog.far=lerp(a.fF,b.fF,v);
    hemi.color.copy(m('hS'));hemi.groundColor.copy(m('hG'));hemi.intensity=lerp(a.hI,b.hI,v);
    sun.color.copy(m('sC'));sun.intensity=lerp(a.sI,b.sI,v);sun.position.copy(a.sP).lerp(b.sP,v);
    M.lawn.color.copy(m('lawn'));M.hedge.color.copy(m('hedge'));M.bulb.color.copy(m('bulb'));
    M.glass.emissiveIntensity=lerp(a.glass,b.glass,v);M.lamp.emissiveIntensity=lerp(a.lamp,b.lamp,v);
    M.tile.emissiveIntensity=lerp(a.tile,b.tile,v);M.water.emissiveIntensity=lerp(a.water,b.water,v);
    fireBase=lerp(a.fire,b.fire,v);poolL.intensity=lerp(a.pool,b.pool,v);pergL.intensity=lerp(a.perg,b.perg,v);insideL.intensity=lerp(a.inside,b.inside,v);
  }
  let fireBase=0, todV=1, todT=1; applyTod(1);
  heroApi.tod=v=>{todT=v;if(reduce){todV=v;applyTod(v);}st.kick();};

  /* camera */
  let narrow=innerWidth<=980;
  const OV={t:[3.2,0,-2.2],r:41,az:.7,el:.43};
  const orbit=Orbit(canvas,{t:OV.t,r:OV.r,az:OV.az,el:OV.el,minEl:.08,maxEl:1.2});
  orbit.kick=()=>st.kick();
  const overview=()=>({t:new T.Vector3(...(narrow?[1.5,0,-1]:OV.t)),r:narrow?50:OV.r,az:OV.az,el:narrow?.6:OV.el});
  st.onResize=(w,h)=>{
    const was=narrow; narrow=w<720||innerWidth<=980;
    if(!narrow){const k=.44;cam.aspect=w*(1+k)/h;cam.setViewOffset(w*(1+k),h,0,0,w,h);}else{cam.aspect=w/h;cam.clearViewOffset();}
    cam.fov=narrow?38:33; cam.updateProjectionMatrix();
    if(was!==narrow&&!spot&&!tw){const o=overview();orbit.r=o.r;orbit.el=orbit.tEl=o.el;}
  };
  let tw=null, spot=null, introDone=reduce;
  const snap=()=>({t:orbit.t.clone(),r:orbit.r,az:orbit.az,el:orbit.el});
  function flyTo(to,dur,done){const a=snap();let az=to.az;while(az-a.az>Math.PI)az-=Math.PI*2;while(a.az-az>Math.PI)az+=Math.PI*2;
    tw={a,b:{t:to.t.clone?to.t.clone():new T.Vector3(...to.t),r:to.r,az,el:to.el},start:performance.now(),dur:reduce?1:dur,done};st.kick();}
  {const o=overview();
   if(!reduce){orbit.t.copy(o.t);orbit.r=o.r*2;orbit.az=orbit.tAz=o.az+1.1;orbit.el=orbit.tEl=1.12;
     setTimeout(()=>flyTo(o,3200,()=>{introDone=true;pinsEl.classList.add('ready');}),150);}
   else{orbit.r=o.r;orbit.el=orbit.tEl=o.el;}}
  orbit.onUser=()=>{if(tw&&!spot&&introDone)tw=null;};
  heroApi.focus=s=>{
    spot=s; pinEls.forEach(p=>p.classList.toggle('on',!!s&&p.dataset.spot===s.id));
    if(s)flyTo(s.view,1300);else flyTo(overview(),1300);
  };

  /* pins */
  const pinEls=SPOTS.map((s,i)=>{const b=document.createElement('button');b.type='button';b.className='pin off';b.dataset.spot=s.id;b.innerHTML=`${i+1}<span class="pl">${esc(s.name)}</span>`;b.setAttribute('aria-label',`${s.name}: show in 3D (click again to return to the whole yard)`);b.addEventListener('click',()=>showSpot(curSpot&&curSpot.id===s.id?null:s.id));pinsEl.appendChild(b);return b;});
  const pv=new T.Vector3();
  function updatePins(){
    pinEls.forEach((el,i)=>{const s=SPOTS[i];pv.set(...s.pos).project(cam);const x=(pv.x+1)/2*st.w,y=(1-pv.y)/2*st.h;
      const cr=canvas.getBoundingClientRect(),er=explore.getBoundingClientRect(),under=!narrow&&x+cr.left>er.left-24&&y+cr.top>er.top-24;
      const show=introDone&&!under&&pv.z<1&&x>20&&x<st.w-20&&y>20&&y<st.h-20&&(narrow||x>st.w*.47||spot);
      el.classList.toggle('off',!show);if(show)el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;});
  }

  /* frame */
  st.onFrame=(dt,now)=>{
    let more=!reduce;
    if(tw){const k=clamp((now-tw.start)/tw.dur,0,1),e=ease(k);orbit.t.lerpVectors(tw.a.t,tw.b.t,e);orbit.r=lerp(tw.a.r,tw.b.r,e);orbit.az=orbit.tAz=lerp(tw.a.az,tw.b.az,e);orbit.el=orbit.tEl=lerp(tw.a.el,tw.b.el,e);if(k>=1){const cb=tw.done;tw=null;cb&&cb();}more=true;}
    else if(!reduce&&!spot&&!orbit.drag&&introDone){orbit.idle+=dt;if(orbit.idle>2.5)orbit.tAz+=dt*.028;}
    if(orbit.apply(cam,dt))more=true;
    if(Math.abs(todV-todT)>.002){todV+=(todT-todV)*Math.min(1,dt*3.2);applyTod(todV);more=true;}
    fields.forEach(f=>{if(f.tick(now))more=true;});
    rising.forEach(r=>{const t=clamp(((now-fields[0].start)/1000-r.delay)/.7,0,1);if(t<1&&!reduce)more=true;const e=t<1?1+2.2*Math.pow(t-1,3)+1.2*Math.pow(t-1,2):1;r.g.scale.setScalar(reduce?1:Math.max(1e-4,e));});
    if(!reduce){const tt=now/1000;
      for(let i=0;i<wPos.count;i++){const x=wBase[i*3],z=wBase[i*3+2];wPos.setY(i,.028*Math.sin(x*2.1+tt*1.3)+.02*Math.sin(z*3.3-tt*1.7)+.012*Math.sin((x+z)*4.2+tt*2.1));}
      wPos.needsUpdate=true;wGeo.computeVertexNormals();
      const fl=1+Math.sin(tt*11)*.12+Math.sin(tt*27)*.08+Math.sin(tt*5.3)*.06;
      fp.update(tt);fireL.intensity=fireBase*fl;
    }else fireL.intensity=fireBase;
    st.renderer.render(scene,cam);
    updatePins();
    return more;
  };
})();

/* ============ STUDIO: before / after (architectural-render look) ============ */
(function studio(){
  const canvas=$('#studioCanvas');
  const st=new Stage(canvas,{shadows:true,lazy:true,exposure:.95});
  const after=new T.Scene(), before=new T.Scene(), cam=new T.PerspectiveCamera(26,1,.1,300);
  const W=12,D=8,u=.25;
  const fogC=new T.Color(0x0b0b0b).convertSRGBToLinear();
  const woodTex=canvasTex(256,(g,S)=>{g.fillStyle='#3a2e26';g.fillRect(0,0,S,S);for(let i=0;i<260;i++){const y=Math.random()*S;g.strokeStyle=`rgba(${Math.random()<.5?'20,14,10':'90,72,58'},${.15+Math.random()*.3})`;g.lineWidth=.5+Math.random()*1.5;g.beginPath();g.moveTo(0,y);for(let x=0;x<=S;x+=32)g.lineTo(x,y+Math.sin(x*.05+i)*1.5);g.stroke();}},{rep:1});
  woodTex.repeat.set(8,1);
  const fenceMat=new T.MeshStandardMaterial({color:0xffffff,map:woodTex,roughness:.82});
  const planterMat=new T.MeshStandardMaterial({color:0x2b2a28,roughness:.85,map:speckle({base:150,spread:40,n:3000,dot:1.4,rep:1})});
  const reedMat=new T.MeshStandardMaterial({color:0xa39a64,roughness:.85,side:T.DoubleSide});
  const reedMat2=new T.MeshStandardMaterial({color:0x6f7a48,roughness:.85,side:T.DoubleSide});
  function env(scene){
    scene.fog=new T.Fog(fogC,30,60);
    scene.add(new T.HemisphereLight(0xe4ecf4,0x4a3e30,.55));
    const s=new T.DirectionalLight(0xfff0dc,1.85);s.position.set(-9,11,7);s.castShadow=true;s.shadow.mapSize.set(2048,2048);
    Object.assign(s.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:60});s.shadow.bias=-.0004;s.shadow.normalBias=.025;scene.add(s);
    const fz=-D/2-1.7;
    for(let x=-9;x<=9;x+=2.25)addBox(scene,.12,1.6,.12,fenceMat,x,.8,fz-.06);
    for(let y=.16;y<1.6;y+=.24)addBox(scene,18.2,.19,.04,fenceMat,0,y,fz+.02);
    [[-7.6,fz+.9],[7.6,fz+.9]].forEach(([x,z])=>{addBox(scene,1.3,.5,1.3,planterMat,x,.25,z);const c=grassClump(scene,x,z,1.5,220,reedMat,.5,.7);c.position.y=.5;});
    for(let x=-6.3;x<=6.3;x+=.7)grassClump(scene,x+(Math.random()-.5)*.2,fz+.5+(Math.random()-.5)*.15,.75+Math.random()*.25,70,Math.random()<.5?reedMat:reedMat2,.32,.5);
  }
  env(after);env(before);
  /* after: lawn + patio */
  const lawnA=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({map:grassTex(false,22),roughness:1}));lawnA.rotation.x=-Math.PI/2;lawnA.receiveShadow=true;after.add(lawnA);
  addBox(after,W+.9,.14,D+.9,std(0xb3a280,1),0,-.05,0,false);
  const field=PaverField(after,{x0:-W/2,x1:W/2,z0:-D/2,z1:D/2,u,h:.16,order:it=>(it.x+W/2)*.05+(it.z+D/2)*.1,y:.02});
  const borderMat=std(0x34322f,.8);
  soldierRing(after,[{axis:'x',x0:-W/2-.25,x1:W/2+.25,z:-D/2-.25},{axis:'x',x0:-W/2-.25,x1:W/2+.25,z:D/2+.25},{axis:'z',z0:-D/2,z1:D/2,x:-W/2-.25},{axis:'z',z0:-D/2,z1:D/2,x:W/2+.25}],.25,.18,borderMat,.02);
  const blockMat=std(0xd9d1c4,.9), capMat=std(0x2f2c29,.6);
  blockMat.map=speckle({base:225,spread:30,n:2500,dot:1.5,rep:1});
  const fp=firePit(after,2.3,.4,.75,blockMat,capMat);
  arcWall(after,2.3,.4,2.2,Math.PI*1.1,Math.PI*1.9,blockMat,capMat);
  const fireL=new T.PointLight(0xff8a3a,1.6,7,1.6);fireL.position.set(2.3,1.1,.4);after.add(fireL);
  addBox(after,.7,.55,2.8,planterMat,-5.2,.3,-2.2);grassClump(after,-5.2,-3.1,1,70,reedMat,.28,.7);grassClump(after,-5.2,-2.2,1.1,70,reedMat,.28,.7);grassClump(after,-5.2,-1.3,1,70,reedMat,.28,.7);
  const teak=std(0x7a5236,.7), cushion=std(0xd9d5cc,.95), metal=std(0x262524,.5,.3);
  [[1.3,2.75],[3.3,2.75]].forEach(([x,z])=>{addBox(after,.8,.22,.8,teak,x,.24,z);addBox(after,.74,.14,.72,cushion,x,.42,z-.02);const b=addBox(after,.74,.55,.14,cushion,x,.72,z+.32);b.rotation.x=-.18;addBox(after,.8,.06,.08,teak,x,.66,z+.36).rotation.x=-.18;});
  const tbl=new T.Mesh(new T.CylinderGeometry(.24,.24,.42,24),metal);tbl.position.set(2.3,.23,2.85);tbl.castShadow=true;after.add(tbl);
  /* before: tired lawn, stained cracked slab, weed tufts */
  const lawnB=new T.Mesh(new T.PlaneGeometry(70,70),new T.MeshStandardMaterial({map:grassTex(true,22),roughness:1}));lawnB.rotation.x=-Math.PI/2;lawnB.receiveShadow=true;before.add(lawnB);
  const patch=canvasTex(512,(g,S)=>{for(let i=0;i<26;i++){const x=S*(.08+Math.random()*.84),y=S*(.08+Math.random()*.84),r=18+Math.random()*58;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(112,90,60,.85)');gr.addColorStop(.55,'rgba(112,90,60,.4)');gr.addColorStop(1,'rgba(112,90,60,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
    for(let i=0;i<6000;i++){g.fillStyle=`rgba(${70+Math.random()*50|0},${55+Math.random()*35|0},35,${Math.random()*.45})`;g.fillRect(Math.random()*S,Math.random()*S,1.4,1.4);}},{wrap:false});
  const pm=new T.Mesh(new T.PlaneGeometry(24,17),new T.MeshStandardMaterial({map:patch,transparent:true,depthWrite:false,roughness:1}));pm.rotation.x=-Math.PI/2;pm.position.y=.004;pm.receiveShadow=true;before.add(pm);
  const slabTex=canvasTex(512,(g,S)=>{g.fillStyle='#a19d96';g.fillRect(0,0,S,S);
    for(let i=0;i<9000;i++){const v=120+Math.random()*80|0;g.fillStyle=`rgba(${v},${v-4},${v-10},.35)`;g.fillRect(Math.random()*S,Math.random()*S,1.6,1.6);}
    for(let i=0;i<10;i++){const x=Math.random()*S,y=Math.random()*S,r=30+Math.random()*110;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(60,55,45,${.18+Math.random()*.2})`);gr.addColorStop(1,'rgba(60,55,45,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
    g.strokeStyle='rgba(35,32,28,.75)';for(let k=0;k<4;k++){g.lineWidth=1+Math.random()*1.5;let x=Math.random()*S,y=0;g.beginPath();g.moveTo(x,y);while(y<S){x+=(Math.random()-.5)*28;y+=10+Math.random()*16;g.lineTo(x,y);}g.stroke();}},{wrap:false});
  const slab=new T.MeshStandardMaterial({color:0xffffff,map:slabTex,roughness:.95});
  [[-2.55,-1.3,2.7,2.3,.03,.015],[.25,-1.35,2.75,2.25,-.04,-.02],[-2.5,1.08,2.6,2.4,.05,.025],[.32,1.02,2.9,2.3,-.015,.02]].forEach(([x,z,w,d,ry,tilt])=>{const m=addBox(before,w,.12,d,slab,x,.05,z);m.rotation.y=ry;m.rotation.x=tilt;});
  const weed=new T.MeshStandardMaterial({color:0x7d8a46,roughness:.9,side:T.DoubleSide}), weed2=new T.MeshStandardMaterial({color:0x8f8a52,roughness:.9,side:T.DoubleSide});
  for(let i=0;i<16;i++){const x=i<9?-1.2+(Math.random()-.5)*.1:(Math.random()-.5)*5.4,z=i<9?(Math.random()-.5)*4.4:-.15+(Math.random()-.5)*.1;grassClump(before,x,z,.22+Math.random()*.15,18,i%2?weed:weed2,.06);}
  for(let i=0;i<40;i++){const x=(Math.random()-.5)*20,z=(Math.random()-.5)*12;if(Math.abs(x)<3.2&&Math.abs(z)<2.6)continue;grassClump(before,x,z,.28+Math.random()*.2,22,i%2?weed:weed2,.1);}

  linScene(after);linScene(before);
  const orbit=Orbit(canvas,{t:[0,0,.3],r:32,az:.5,el:.6,minEl:.25,maxEl:1.2});
  orbit.kick=()=>st.kick();
  let narrow=false;
  st.onResize=(w,h)=>{narrow=w<640;cam.aspect=w/h;cam.fov=narrow?34:26;cam.updateProjectionMatrix();orbit.r=narrow?36:33;};
  st.onInit=()=>{field.build(design.pattern,design.color[1],.2);};
  studioApi.pattern=()=>{if(!st.ready)return;field.build(design.pattern,design.color[1],0);st.kick();};
  studioApi.color=()=>{if(!st.ready)return;field.recolor(design.color[1]);st.kick();};
  studioApi.border=()=>{borderMat.color.set(design.border[1]).convertSRGBToLinear();st.kick();};
  studioApi.kick=()=>st.kick();
  st.onFrame=(dt,now)=>{
    let more=!reduce;
    if(!reduce&&!orbit.drag){orbit.idle+=dt;if(orbit.idle>2)orbit.tAz+=dt*.04;}
    if(orbit.apply(cam,dt))more=true;
    if(field.mesh&&field.tick(now))more=true;
    if(!reduce){const tt=now/1000;fp.update(tt);fireL.intensity=1.6*(1+Math.sin(tt*11)*.1+Math.sin(tt*27)*.06);}
    const R=st.renderer,w=st.w,h=st.h,sx=Math.round(w*split);
    R.setScissorTest(true);R.setViewport(0,0,w,h);
    if(sx>0){R.setScissor(0,0,sx,h);R.render(before,cam);}
    if(sx<w){R.setScissor(sx,0,w-sx,h);R.render(after,cam);}
    R.setScissorTest(false);
    return more;
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
