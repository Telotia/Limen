// Ink page init (particles, workspace, footer ink, nav-hide) — extracted from source
requestAnimationFrame(function(){if(!window.TelotiaParticles)return;var T=window.TelotiaParticles;
var h=document.getElementById('tlHeroCanvas');if(h)T.hero(h);
var g=document.getElementById('tlGlossCanvas');if(g)T.glossary(g);
var c=document.getElementById('tlConsultCanvas');if(c)T.consult(c);
var s=document.getElementById('tlSpikeCanvas');if(s)T.verdictSphere(s,{dragTarget:s.parentElement});});

(function(){
  function hexA(hex,a){ if(!hex) return 'rgba(0,0,0,'+a+')'; var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; return 'rgba('+r+','+g+','+b+','+a+')'; }
  var rows=Array.prototype.slice.call(document.querySelectorAll('[data-ws-row]'));
  if(!rows.length) return;
  var railBtns=Array.prototype.slice.call(document.querySelectorAll('#tlWsRail [data-wpage]'));
  var pages=Array.prototype.slice.call(document.querySelectorAll('#tlWsPages [data-wpage]'));
  function setPage(idx){
    pages.forEach(function(pg){ var a=pg.dataset.wpage===String(idx); pg.style.display=a?(pg.dataset.wpage==='0'?'grid':'block'):'none'; });
    railBtns.forEach(function(b){ var a=b.dataset.wpage===String(idx); b.style.background=a?'rgba(58,124,196,.16)':'none'; b.style.borderColor=a?'var(--teal2)':'transparent'; b.style.color=a?'var(--teal)':'var(--t4)'; });
  }
  function setActive(row){
    rows.forEach(function(r){ r.style.background = r===row ? hexA(r.dataset.color,0.1) : '#EEF1F7'; });
    var t=document.getElementById('tlWsClaimTitle'); if(t) t.textContent=row.dataset.claim;
    var v=document.getElementById('tlWsVerdict'); if(v){ v.textContent=row.dataset.verdict; v.style.color=row.dataset.color; }
    var p=document.getElementById('tlWsPassage'); if(p) p.textContent=row.dataset.passage;
    var sc=document.getElementById('tlWsSource'); if(sc) sc.textContent=row.dataset.source;
    var col=row.dataset.color;
    var vn=document.getElementById('tlGraphVerdict'); if(vn){ vn.setAttribute('fill',col); vn.setAttribute('stroke',col); }
    var et=document.getElementById('tlEdgeTop'); if(et) et.setAttribute('stroke',col);
    var es=document.getElementById('tlEdgeSource'); if(es) es.setAttribute('stroke',col);
  }
  var statusMap={ '#3a7cc4':'Cited · supported by corpus', '#e8a98f':'Reviewer note required', '#9fadc8':'Flagged · no cited passage' };
  var minis=Array.prototype.slice.call(document.querySelectorAll('.dwmini'));
  function hiMini(id){ minis.forEach(function(x){ var on=x.dataset.id===id; x.style.borderColor=on?x.dataset.color:'var(--rulesoft)'; x.style.background=on?hexA(x.dataset.color,0.08):'none'; }); }
  function openDw(row){
    function set(id,txt){ var e=document.getElementById(id); if(e) e.textContent=txt; }
    var col=row.dataset.color;
    set('tlDwId',row.dataset.id||''); set('tlDwClaim',row.dataset.claim); set('tlDwNote',row.dataset.note||'');
    set('tlDwCorpus',row.dataset.passage); set('tlDwVerdict',row.dataset.verdict); set('tlDwSource',row.dataset.source);
    set('tlDwStatus',statusMap[col]||'');
    var pill=document.getElementById('tlDwPill'); if(pill){ pill.textContent=row.dataset.verdict; pill.style.color=col; pill.style.borderColor=col; }
    var cl=document.getElementById('tlDwClaim'); if(cl) cl.style.borderLeftColor=col;
    setPage(4); hiMini(row.dataset.id||'');
  }
  var backBtn=document.getElementById('tlDwBack'); if(backBtn) backBtn.onclick=function(){ setPage(0); };
  var copyBtn=document.getElementById('tlDwCopy');
  if(copyBtn) copyBtn.onclick=function(){ try{ navigator.clipboard.writeText((document.getElementById('tlDwId')||{}).textContent||''); copyBtn.textContent='Copied'; setTimeout(function(){ copyBtn.textContent='Copy id'; },1400); }catch(e){} };
  rows.forEach(function(r){ r.addEventListener('click',function(){ setActive(r); openDw(r); }); });
  minis.forEach(function(m){ m.addEventListener('click',function(){ openDw(m); }); });
  setActive(rows[0]);
  railBtns.forEach(function(b){ b.addEventListener('click',function(){ setPage(parseInt(b.dataset.wpage,10)); }); });
  if(railBtns.length) setPage(0);
})();

(function(){
  var cv=document.getElementById('tlFooterInk'); if(!cv) return;
  var footer=cv.closest('footer'); if(!footer) return;
  // high-res image buffer (sharp) decoupled from the coarse ripple grid
  var IW=1500, IH=200; cv.width=IW; cv.height=IH;
  var SW=560, SH=74;           // finer simulation lattice -> small, smooth ripples (no mosaic)
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var R=Math.random;
  var img=new Image(), ext=new Image(), nload=0;
  img.onload=ext.onload=ext.onerror=function(){ if(++nload<2) return;
    var off=document.createElement('canvas'); off.width=IW; off.height=IH;
    var octx=off.getContext('2d');
    octx.clearRect(0,0,IW,IH);
    // stadium at left (cropped vertical band), aspect preserved
    var sy=Math.round(img.height*0.24), sh=Math.round(img.height*0.62);
    var stW=Math.round(IH*(img.width/sh));
    octx.drawImage(img,0,sy,img.width,sh, 0,0, stW,IH);
    // ink-wash watercolor extension (turbulence-displaced), blends with the tail and fades right
    try{ if(ext.complete && ext.naturalWidth) octx.drawImage(ext,0,0,IW,IH); }catch(e){}
    var src=octx.getImageData(0,0,IW,IH), sd=src.data;
    var out=ctx.createImageData(IW,IH), od=out.data;
    ctx.putImageData(src,0,0); if(reduce) return;
    var cur=new Float32Array(SW*SH), prev=new Float32Array(SW*SH), damping=0.9;
    var RAD=4, frameMod=0;
    footer.addEventListener('pointermove',function(e){
      var r=cv.getBoundingClientRect();
      var _s=Math.max(r.width/IW,r.height/IH),_oy=(r.height-IH*_s)/2;var x=(e.clientX-r.left)/_s/IW*SW|0, y=(e.clientY-r.top-_oy)/_s/IH*SH|0;
      if(x<RAD+1||x>SW-RAD-2||y<RAD+1||y>SH-RAD-2) return;
      var P=42, rr2=RAD*RAD+1;
      for(var oy=-RAD;oy<=RAD;oy++)for(var ox=-RAD;ox<=RAD;ox++){
        var dd=ox*ox+oy*oy; if(dd>RAD*RAD) continue;
        prev[(y+oy)*SW+(x+ox)] += P*(1-dd/rr2);
      }
    });
    var SCALE=2.2;               // displacement strength (sim units -> image px)
    function loop(){
      var x,y,yi,i;
      frameMod=(frameMod+1)%2;   // step physics at half speed -> slow, calm ripple
      if(frameMod===0){
        for(y=1;y<SH-1;y++){ yi=y*SW;
          for(x=1;x<SW-1;x++){ i=yi+x;
            cur[i]=(((prev[i-1]+prev[i+1]+prev[i-SW]+prev[i+SW])*0.5)-cur[i])*damping;
          }
        }
        // render high-res image, displaced by the coarse field (bilinear-sampled gradient)
        od.set(sd);
        var fx=SW/IW, fy=SH/IH;
        for(y=0;y<IH;y++){
          var gy=y*fy, sy0=gy|0; if(sy0<1)sy0=1; else if(sy0>SH-2)sy0=SH-2;
          var ty=gy-sy0;
          for(x=0;x<IW;x++){
            var gx=x*fx, sx0=gx|0; if(sx0<1)sx0=1; else if(sx0>SW-2)sx0=SW-2;
            var tx=gx-sx0, b=sy0*SW+sx0;
            // bilinear gradient of the wave field
            var gxv=((cur[b-1]-cur[b+1])*(1-ty)+(cur[b-1+SW]-cur[b+1+SW])*ty);
            var gyv=((cur[b-SW]-cur[b+SW])*(1-tx)+(cur[b-SW+1]-cur[b+SW+1])*tx);
            var dx=(gxv*SCALE)|0, dy=(gyv*SCALE)|0;
            var ix=x+dx; if(ix<0)ix=0; else if(ix>=IW)ix=IW-1;
            var iy=y+dy; if(iy<0)iy=0; else if(iy>=IH)iy=IH-1;
            var si=(iy*IW+ix)<<2, di=(y*IW+x)<<2;
            var ae=gxv<0?-gxv:gxv, tint=ae*0.05; if(tint>0.5)tint=0.5;
            var rr=sd[si],gg=sd[si+1],bb=sd[si+2],aa=sd[si+3];
            if(tint>0.004){
              rr=rr*(1-tint)+34*tint; gg=gg*(1-tint)+70*tint; bb=bb*(1-tint)+142*tint;
              var na=aa+tint*235; aa=na>255?255:na;
            }
            od[di]=rr; od[di+1]=gg; od[di+2]=bb; od[di+3]=aa;
          }
        }
        ctx.putImageData(out,0,0);
        var t=prev; prev=cur; cur=t;
      }
      if(visible) requestAnimationFrame(loop); else ticking=false;
    }
    var visible=true, ticking=false;
    function start(){ if(!ticking){ ticking=true; requestAnimationFrame(loop); } }
    if(window.IntersectionObserver){
      new IntersectionObserver(function(es){ visible=es[0].isIntersecting; if(visible) start(); },{threshold:0}).observe(footer);
    }
    start();
  };
  ext.src=(window.__FOOTER_INK_EXT||'footer-ink-ext.svg');
  img.src=(window.__FOOTER_INK_IMG||'montreal-ink.png');
})();

(function(){
  var nav=document.querySelector('.navlight'); if(!nav) return;
  nav.style.transition='top .34s ease,opacity .34s ease';
  var st=document.createElement('style');
  st.textContent='.nav-peek{position:fixed;top:9px;left:13px;z-index:40;width:40px;height:40px;padding:3px;border:none;border-radius:50%;background:transparent;opacity:0;transform:scale(.85);pointer-events:none;transition:opacity .25s ease,transform .25s ease;cursor:pointer;display:flex;align-items:center;justify-content:center}.nav-peek.show{opacity:1;transform:scale(1);pointer-events:auto}.nav-peek img{width:100%;height:100%;object-fit:contain;pointer-events:none}';
  document.head.appendChild(st);
  var peek=document.createElement('button'); peek.type='button'; peek.className='nav-peek'; peek.setAttribute('aria-label','Show menu');
  var logo=nav.querySelector('img'); if(logo) peek.appendChild(logo.cloneNode(true));
  document.body.appendChild(peek);
  var hidden=false;
  function show(){nav.style.top='0';nav.style.opacity='';nav.style.pointerEvents='';peek.classList.remove('show');hidden=false;}
  function hide(){nav.style.top='-120px';nav.style.opacity='0';nav.style.pointerEvents='none';peek.classList.add('show');hidden=true;}
  peek.addEventListener('click',function(e){e.preventDefault();show();});
  var last=0;
  window.addEventListener('scroll',function(){
    var y=window.pageYOffset||document.documentElement.scrollTop||0;
    if(y>last && y>70){ if(!hidden) hide(); } else { if(hidden) show(); }
    last=y;
  },{passive:true});
})();