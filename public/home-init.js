// A single, quiet title-adjacent ink gesture for each chapter. The subject,
// side and mineral pigment are chosen once per load; they never animate or
// compete with the copy. The generated set is deliberately sampled as an
// occasional edge study, so the page keeps one continuous xuan-paper field.
(function initSectionTitleInk(){
  var chapters=Array.prototype.slice.call(document.querySelectorAll('.home-hero,#process,#verdict,#glossary,#workspace,#demo,#research,#consult'));
  if(!chapters.length) return;
  var forms={
    ridge:{images:['/assets/ink-wash/01-mountain-lower-right.webp','/assets/ink-wash/02-mountain-upper-left.webp'],pos:['center 68%','center 36%']},
    brush:{images:['/assets/ink-wash/03-brush-lower-left.webp','/assets/ink-wash/04-brush-upper-right.webp'],pos:['center 64%','center 36%']},
    bamboo:{images:['/assets/ink-wash/05-bamboo-right.webp','/assets/ink-wash/06-bamboo-upper-left.webp'],pos:['right center','left center']},
    water:{images:['/assets/ink-wash/07-water-bottom.webp','/assets/ink-wash/08-water-left.webp'],pos:['center 70%','left center']},
    mineral:{images:['/assets/ink-wash/09-vermilion-divider.webp','/assets/ink-wash/10-azurite-divider.webp','/assets/ink-wash/11-gamboge-divider.webp'],pos:['center','center','center']},
    generated:{images:[
      '/assets/ink-wash/generated/abstract-gamboge-02.svg',
      '/assets/ink-wash/generated/abstract-vermilion-03.svg',
      '/assets/ink-wash/generated/abstract-indigo-03.svg',
      '/assets/ink-wash/generated/flora-fauna-vermilion-01.svg',
      '/assets/ink-wash/generated/flora-fauna-indigo-04.svg',
      '/assets/ink-wash/generated/landscape-indigo-01.svg',
      '/assets/ink-wash/generated/landscape-black-03.svg'
    ],pos:['center','center','center','center','center','center','center']}
  };
  var relevant={
    hero:['ridge','brush'],process:['brush','water','generated'],verdict:['mineral','water','generated'],glossary:['bamboo','brush','generated'],
    workspace:['brush','ridge','generated'],demo:['water','mineral','generated'],research:['ridge','bamboo','generated'],consult:['brush','mineral','generated']
  };
  var pigments=[['blue','42 85 165'],['red','193 59 51'],['yellow','211 151 36'],['sumi','38 56 50']];
  var masks=['a','b','c'],previousPigment='',previousForm='';
  function pick(list){return list[Math.floor(Math.random()*list.length)];}
  chapters.forEach(function(chapter,index){
    if(chapter.querySelector(':scope > .section-title-ink')) return;
    var key=chapter.id||'hero',pool=(relevant[key]||Object.keys(forms)).slice();
    if(Math.random()>.68) pool=Object.keys(forms); // occasional abstract, non-literal gesture
    var form=pick(pool.filter(function(item){return item!==previousForm;}).length?pool.filter(function(item){return item!==previousForm;}):pool);
    var pigmentPool=pigments.filter(function(item){return item[0]!==previousPigment;});
    var pigment=pick(pigmentPool),side=((index+Math.round(Math.random()))%2?'right':'left');
    /* Directional paintings keep their subject on the inward edge of the page,
       so a bamboo leaf or mountain ridge never disappears beyond the viewport. */
    var inward={ridge:{left:0,right:1},brush:{left:1,right:0},bamboo:{left:0,right:1},water:{left:0,right:1}};
    var variant=inward[form]?inward[form][side]:Math.floor(Math.random()*forms[form].images.length);
    var ink=document.createElement('span');
    ink.className='section-title-ink section-title-ink-'+form+' section-title-ink-'+side;
    ink.dataset.inkForm=form;ink.dataset.inkPigment=pigment[0];ink.setAttribute('aria-hidden','true');
    ink.style.setProperty('--title-ink-image','url("'+forms[form].images[variant]+'")');
    ink.style.setProperty('--title-ink-position',forms[form].pos[variant]||'center');
    ink.style.setProperty('--title-ink-rgb',pigment[1]);
    ink.style.setProperty('--title-ink-mask','url("/assets/ink-wash/textures/ink-cloud-'+pick(masks)+'.svg")');
    ink.style.setProperty('--title-ink-rotate',(-4+Math.random()*8).toFixed(2)+'deg');
    ink.style.setProperty('--title-ink-accent-x',(8+Math.random()*54).toFixed(1)+'%');
    ink.style.setProperty('--title-ink-accent-y',(10+Math.random()*42).toFixed(1)+'%');
    chapter.prepend(ink);previousPigment=pigment[0];previousForm=form;
  });
})();

// Homepage interactions. Non-critical canvases initialize near the viewport.
requestAnimationFrame(function () {
  if (!window.TelotiaParticles) return;
  var T = window.TelotiaParticles;
  var hero = document.getElementById('tlHeroCanvas');
  if (hero) T.hero(hero);

  function near(id, init) {
    var element = document.getElementById(id);
    if (!element) return;
    if (!('IntersectionObserver' in window)) { init(element); return; }
    var observer = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      init(element);
    }, { rootMargin: '320px 0px' });
    observer.observe(element);
  }

  near('tlGlossCanvas', function (canvas) { T.glossary(canvas, { scale: 0.9 }); });
  near('tlConsultCanvas', function (canvas) { T.consult(canvas); });
  near('tlSpikeCanvas', function (canvas) {
    var terms = ['Atomic claim','Evidence base','Decomposition','Corpus','Verdict','Supported','Partial','Unsupported','Citation','Source passage','Proof package','Audit trail','Claim graph','Reviewer note','Grade','Search','Decompose','Proposition','Passage','Conformity','Declaration','Lot','Model','Bilingual label','Human review','Trusted corpus','Cite','Match','Silent','Scoped','Provenance','Coverage','Completeness','Factual claim','Procedural claim','Index','Import package','Citation path','Graded verdict','Sign-off'];
    T.verdictSphere(canvas, { dragTarget: canvas.parentElement, labels: terms });
  });
});

(function(){
  function hexA(hex,a){ if(!hex) return 'rgba(0,0,0,'+a+')'; var n=parseInt(hex.slice(1),16),r=(n>>16)&255,g=(n>>8)&255,b=n&255; return 'rgba('+r+','+g+','+b+','+a+')'; }
  function set(id,txt){ var e=document.getElementById(id); if(e) e.textContent=txt; }
  var rows=Array.prototype.slice.call(document.querySelectorAll('[data-ws-row]'));
  if(!rows.length) return;
  var railBtns=Array.prototype.slice.call(document.querySelectorAll('#tlWsRail [data-wpage]'));
  var pages=Array.prototype.slice.call(document.querySelectorAll('#tlWsPages [data-wpage]'));
  var workspaceShell=document.getElementById('tlWsShell');
  function setPage(idx){
    if(workspaceShell) workspaceShell.dataset.activeTab=String(idx);
    pages.forEach(function(pg){ var a=pg.dataset.wpage===String(idx); pg.style.display=a?(pg.dataset.wpage==='0'?'grid':'block'):'none'; });
    railBtns.forEach(function(b){ var a=b.dataset.wpage===String(idx); b.style.background=a?'rgba(47,111,176,.16)':'none'; b.style.borderColor=a?'var(--teal2)':'transparent'; b.style.color=a?'var(--teal)':'var(--t4)'; });
  }
  function setActive(row){
    rows.forEach(function(r){ r.style.background = r===row ? hexA(r.dataset.color,0.1) : 'var(--surface-paper)'; });
    var t=document.getElementById('tlWsClaimTitle'); if(t) t.textContent=row.dataset.claim;
    var v=document.getElementById('tlWsVerdict'); if(v){ v.textContent=row.dataset.verdict; v.style.color=row.dataset.color; }
    var p=document.getElementById('tlWsPassage'); if(p) p.textContent=row.dataset.passage;
    var sc=document.getElementById('tlWsSource'); if(sc) sc.textContent=row.dataset.source;
    var col=row.dataset.color;
    var flow=document.querySelector('.claim-flow'); if(flow) flow.style.setProperty('--flow-color',col);
    var vn=document.getElementById('tlGraphVerdict'); if(vn){ vn.style.setProperty('--flow-color',col); vn.style.borderColor=col; }
    var et=document.getElementById('tlEdgeTop'); if(et) et.style.setProperty('--flow-color',col);
    var es=document.getElementById('tlEdgeSource'); if(es) es.style.setProperty('--flow-color',col);
    set('tlFlowVerdictLabel',row.dataset.verdict); set('tlFlowSourceLabel',row.dataset.source);
  }
  var statusMap={ '#2A55A5':'Cited · supported by corpus', '#E3A32C':'Reviewer note required', '#C13B33':'Flagged · no cited passage' };
  var minis=Array.prototype.slice.call(document.querySelectorAll('.dwmini'));
  function hiMini(id){ minis.forEach(function(x){ var on=x.dataset.id===id; x.style.borderColor=on?x.dataset.color:'var(--rulesoft)'; x.style.background=on?hexA(x.dataset.color,0.08):'none'; }); }
  function openDw(row){
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

(function initWindowInkBlooms(){
  var edges=['top','right','bottom','left'];
  var pigment={blue:[42,85,165],red:[193,59,51],yellow:[227,163,44],sumi:[38,56,50]};
  function shuffled(list){var copy=list.slice();for(var i=copy.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),tmp=copy[i];copy[i]=copy[j];copy[j]=tmp;}return copy;}
  Array.prototype.slice.call(document.querySelectorAll('.vcard,.rcard,.gloss')).forEach(function(box){box.classList.add('glow-wrap','ink-compact');});
  Array.prototype.slice.call(document.querySelectorAll('.process-window')).forEach(function(box){box.classList.add('glow-wrap');});
  Array.prototype.slice.call(document.querySelectorAll('.home-hero .glow-wrap,.process-window,#tlSpikeWrap,#tlWsShell,#demo .glow-wrap,#consult form.glow-wrap')).forEach(function(wrap){
    if(wrap.querySelector(':scope > .ui-window-clip')) return;
    var clip=document.createElement('div'); clip.className='ui-window-clip';
    while(wrap.firstChild) clip.appendChild(wrap.firstChild);
    wrap.appendChild(clip);
  });
  var wraps=Array.prototype.slice.call(document.querySelectorAll('.glow-wrap'));
  var reduceInk=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function inkCloud(ctx,x,y,rx,ry,rgb,alpha){
    if(rx<=0||ry<=0||alpha<=0) return;
    ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
    var g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,'rgb('+rgb.join(' ')+' / '+alpha+')');
    g.addColorStop(.3,'rgb('+rgb.join(' ')+' / '+(alpha*.68)+')');
    g.addColorStop(.68,'rgb('+rgb.join(' ')+' / '+(alpha*.20)+')');
    g.addColorStop(1,'rgb('+rgb.join(' ')+' / 0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function capillaryEngine(wrap){
    var canvas=document.createElement('canvas');canvas.className='ink-capillary-layer';canvas.setAttribute('aria-hidden','true');wrap.appendChild(canvas);
    var ctx=canvas.getContext('2d'),raf=0,start=0,leaveAt=0,leaving=false,drops=[],lastW=0,lastH=0,pad=32;
    function resize(){
      var w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(2,window.devicePixelRatio||1);
      if(w===lastW&&h===lastH) return;lastW=w;lastH=h;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function anchor(edge,pos){
      var w=lastW,h=lastH,cw=w-pad*2,ch=h-pad*2,x=pad+cw*pos,y=pad+ch*pos;
      if(edge==='top') return {x:x,y:pad,nx:0,ny:-1,tx:1,ty:0};
      if(edge==='bottom') return {x:x,y:h-pad,nx:0,ny:1,tx:1,ty:0};
      if(edge==='left') return {x:pad,y:y,nx:-1,ny:0,tx:0,ty:1};
      return {x:w-pad,y:y,nx:1,ny:0,tx:0,ty:1};
    }
    function seed(){
      var order=shuffled(['blue','blue','red','red','yellow','yellow','sumi']),used=[];drops=[];
      order.forEach(function(color){
        var choices=shuffled(edges.filter(function(edge){return !used.some(function(d){return d.color===color&&d.edge===edge;});}));
        var edge=choices[0],pos=.14+Math.random()*.72,onEdge=used.filter(function(d){return d.edge===edge;});
        onEdge.forEach(function(d){if(Math.abs(d.pos-pos)<.16) pos=Math.max(.12,Math.min(.88,pos+(pos<.5?.19:-.19)));});
        var lobes=4+Math.floor(Math.random()*4),profile=[],band=[],bandCount=8+Math.floor(Math.random()*5);
        for(var j=0;j<lobes;j++) profile.push({t:-.9+Math.random()*1.8,n:.28+Math.random()*.58,rx:.48+Math.random()*.78,ry:.42+Math.random()*.72,a:.58+Math.random()*.42,delay:Math.random()*.14});
        for(var k=0;k<bandCount;k++) band.push({t:-1+k/(bandCount-1)*2+(k&&k<bandCount-1?(Math.random()-.5)*.16:0),j:(Math.random()-.5)*.12,n:.14+Math.random()*.42,rx:.62+Math.random()*.72,ry:.42+Math.random()*.68,a:.66+Math.random()*.34,delay:Math.random()*.1});
        var axis=edge==='top'||edge==='bottom'?lastW-pad*2:lastH-pad*2;
        var reach=Math.max(42,Math.min(axis*.16,138));
        var drop={edge:edge,pos:pos,color:color,rgb:pigment[color],left:reach*(.48+Math.random()*.52),right:reach*(.48+Math.random()*.52),out:16+Math.random()*7,radius:8+Math.random()*7,profile:profile,band:band,phase:Math.random()*.08,lean:(Math.random()-.5)*.24};
        used.push(drop);drops.push(drop);
      });
    }
    function drawDrop(d,progress,fade){
      var p=Math.max(0,Math.min(1,(progress-d.phase)/(1-d.phase))),a=anchor(d.edge,d.pos),attach=1-Math.pow(1-Math.min(1,p/.18),3),spread=p<.05?0:(1-Math.pow(1-Math.min(1,(p-.05)/.95),2)),alpha=fade;
      ctx.save();
      ctx.beginPath();
      if(d.edge==='top')ctx.rect(0,0,lastW,pad+2.4);
      else if(d.edge==='bottom')ctx.rect(0,lastH-pad-2.4,lastW,pad+2.4);
      else if(d.edge==='left')ctx.rect(0,0,pad+2.4,lastH);
      else ctx.rect(lastW-pad-2.4,0,pad+2.4,lastH);
      ctx.clip();ctx.globalCompositeOperation='multiply';ctx.lineCap='round';
      var left=d.left*attach,right=d.right*attach,total=Math.max(1,left+right),peak=left/total,grad=ctx.createLinearGradient(a.x-a.tx*left,a.y-a.ty*left,a.x+a.tx*right,a.y+a.ty*right);
      grad.addColorStop(0,'rgb('+d.rgb.join(' ')+' / 0)');grad.addColorStop(Math.max(.04,peak-.2),'rgb('+d.rgb.join(' ')+' / '+(.15*alpha)+')');grad.addColorStop(peak,'rgb('+d.rgb.join(' ')+' / '+(.46*alpha)+')');grad.addColorStop(Math.min(.96,peak+.22),'rgb('+d.rgb.join(' ')+' / '+(.13*alpha)+')');grad.addColorStop(1,'rgb('+d.rgb.join(' ')+' / 0)');
      ctx.strokeStyle=grad;ctx.lineWidth=1.4+attach*2.5;ctx.beginPath();ctx.moveTo(a.x-a.tx*left,a.y-a.ty*left);ctx.lineTo(a.x+a.tx*right,a.y+a.ty*right);ctx.stroke();
      ctx.strokeStyle='rgb('+d.rgb.join(' ')+' / '+(.13*alpha)+')';ctx.lineWidth=5+spread*3;ctx.filter='blur(2.4px)';ctx.beginPath();ctx.moveTo(a.x-a.tx*left*.9,a.y-a.ty*left*.9);ctx.lineTo(a.x+a.tx*right*.9,a.y+a.ty*right*.9);ctx.stroke();ctx.filter='none';
      /* Each contact grows as a different, asymmetric chain of overlapping
         wet patches. The chain never resolves into a mirrored half-ellipse. */
      d.band.forEach(function(l){
        var sp=Math.max(0,(spread-l.delay)/(1-l.delay)),reachNow=(l.t<0?left:right),tangent=l.t*reachNow+l.j*(left+right)*attach,normal=.5+d.out*sp*(.08+l.n*.34)+d.lean*tangent*sp*.08,tangentR=(7+sp*10)*l.rx,normalR=2.2+d.out*sp*(.12+l.ry*.23),cx=a.x+a.tx*tangent+a.nx*normal,cy=a.y+a.ty*tangent+a.ny*normal;
        if(d.edge==='top'||d.edge==='bottom') inkCloud(ctx,cx,cy,tangentR,normalR,d.rgb,(.15+.09*sp)*alpha*l.a);
        else inkCloud(ctx,cx,cy,normalR,tangentR,d.rgb,(.15+.09*sp)*alpha*l.a);
      });
      d.profile.forEach(function(l){
        var sp=Math.max(0,(spread-l.delay)/(1-l.delay)),reachNow=(l.t<0?left:right),tangent=l.t*reachNow*(.76+Math.abs(l.t)*.16),normal=1.5+d.out*sp*(.12+l.n*.42)+d.lean*tangent*sp*.06,tangentR=d.radius*(.5+sp*.72)*l.rx,normalR=2.5+d.out*sp*(.1+l.ry*.3),cx=a.x+a.tx*tangent+a.nx*normal,cy=a.y+a.ty*tangent+a.ny*normal;
        if(d.edge==='top'||d.edge==='bottom') inkCloud(ctx,cx,cy,tangentR,normalR,d.rgb,(.11+.11*sp)*alpha*l.a);
        else inkCloud(ctx,cx,cy,normalR,tangentR,d.rgb,(.11+.11*sp)*alpha*l.a);
      });
      ctx.restore();
    }
    function frame(now){
      resize();ctx.clearRect(0,0,lastW,lastH);var progress=Math.min(1,(now-start)/3900),fade=leaving?Math.max(0,1-(now-leaveAt)/680):1;drops.forEach(function(d){drawDrop(d,progress,fade);});
      if((!leaving&&progress<1)||(leaving&&fade>0)) raf=requestAnimationFrame(frame);else raf=0;
    }
    function play(){resize();seed();leaving=false;start=performance.now();leaveAt=0;if(raf)cancelAnimationFrame(raf);if(reduceInk){ctx.clearRect(0,0,lastW,lastH);drops.forEach(function(d){drawDrop(d,1,.64);});return;}raf=requestAnimationFrame(frame);}
    function release(){if(reduceInk){ctx.clearRect(0,0,lastW,lastH);return;}leaving=true;leaveAt=performance.now();if(!raf)raf=requestAnimationFrame(frame);}
    wrap.addEventListener('pointerenter',play);wrap.addEventListener('pointerleave',release);wrap.addEventListener('focusin',function(){if(!wrap.matches(':hover'))play();});wrap.addEventListener('focusout',function(e){if(!wrap.contains(e.relatedTarget))release();});
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(wrap);resize();
  }
  wraps.forEach(function(wrap){
    if(wrap.querySelector('.ink-capillary-layer')) return;
    capillaryEngine(wrap);
  });
})();

function initFooterInk(){
  var cv=document.getElementById('tlFooterInk'); if(!cv) return;
  var footer=cv.closest('footer'); if(!footer) return;
  // high-res image buffer (sharp) decoupled from the coarse ripple grid
  var IW=1200, IH=170; cv.width=IW; cv.height=IH;
  var SW=440, SH=62;           // finer simulation lattice -> small, smooth ripples (no mosaic)
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
    var RAD=6, frameMod=0, active=0, armed=true, cycle=0;
    function dropAt(e){
      var r=cv.getBoundingClientRect();
      var _s=Math.max(r.width/IW,r.height/IH),_oy=(r.height-IH*_s)/2;var x=(e.clientX-r.left)/_s/IW*SW|0, y=(e.clientY-r.top-_oy)/_s/IH*SH|0;
      x=Math.max(RAD+1,Math.min(SW-RAD-2,x));
      y=Math.max(RAD+1,Math.min(SH-RAD-2,y));
      cur.fill(0); prev.fill(0);
      var P=155, rr2=RAD*RAD+1;
      for(var oy=-RAD;oy<=RAD;oy++)for(var ox=-RAD;ox<=RAD;ox++){
        var dd=ox*ox+oy*oy; if(dd>RAD*RAD) continue;
        prev[(y+oy)*SW+(x+ox)] += P*(1-dd/rr2);
      }
      active=190;                            // one calm ripple cycle per entry
      start();
    }
    footer.addEventListener('pointerenter',function(e){
      if(!armed) return;
      armed=false;
      footer.dataset.rippleCycle=String(++cycle);
      dropAt(e);
    });
    footer.addEventListener('pointerleave',function(){ armed=true; });
    footer.addEventListener('dblclick',function(e){
      footer.dataset.rippleCycle=String(++cycle);
      dropAt(e);
    });
    var SCALE=3.6;               // displacement strength (sim units -> image px)
    function loop(){
      if(!visible){ ticking=false; return; }
      var x,y,yi,i;
      frameMod=(frameMod+1)%2;   // step physics at half speed -> slow, calm ripple
      if(frameMod===0 && active>0){
        active--;
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
        if(active===0){ ctx.putImageData(src,0,0); }   // settle to the crisp static image, then idle
      }
      if(visible && active>0) requestAnimationFrame(loop); else ticking=false;
    }
    var visible=true, ticking=false;
    function start(){ if(!ticking && visible){ ticking=true; requestAnimationFrame(loop); } }
    document.addEventListener('visibilitychange',function(){ visible=!document.hidden; if(visible && active>0) start(); });
    start();
  };
  ext.src=(window.__FOOTER_INK_EXT||'/footer-ink-ext.svg');
  img.src=(window.__FOOTER_INK_IMG||'/montreal-ink.png');
}
(function () {
  var footer = document.querySelector('footer');
  if (!footer) return;
  if (!('IntersectionObserver' in window)) { initFooterInk(); return; }
  var observer = new IntersectionObserver(function (entries) {
    if (!entries[0].isIntersecting) return;
    observer.disconnect();
    initFooterInk();
  }, { rootMargin: '240px 0px' });
  observer.observe(footer);
})();

(function(){
  var nav=document.querySelector('.navlight'); if(!nav) return;
  nav.style.transition='top .34s ease,opacity .34s ease';
  /* Floating peek logo: the mark spins as a restrained brand signal. */
  var st=document.createElement('style');
  st.textContent='.nav-peek{position:fixed;top:max(10px,env(safe-area-inset-top));left:14px;z-index:60;width:44px;height:44px;padding:6px;border:0;border-radius:50%;background:rgba(255,255,255,.58);backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px);box-shadow:0 5px 16px -8px rgba(16,24,47,.4);opacity:0;transform:scale(.82) translateY(-6px);transform-origin:center;pointer-events:none;transition:opacity .28s ease,transform .42s cubic-bezier(.16,1,.3,1),box-shadow .42s ease;cursor:pointer}.nav-peek.show{opacity:1;transform:scale(1) translateY(0);pointer-events:auto}.nav-peek.show:hover{transform:scale(1.2) translateY(0);box-shadow:0 12px 26px -12px rgba(16,24,47,.46)}.nav-peek img{width:100%;height:100%;object-fit:contain;display:block;transform-origin:center;will-change:transform}.nav-peek.show:not(:hover) img{animation:navPeekIdleCycle 30s linear infinite}.nav-peek.show:hover img{animation:navPeekHoverSpin 1.45s cubic-bezier(.22,.61,.36,1) 1}@keyframes navPeekHoverSpin{from{transform:rotate(0deg)}to{transform:rotate(1080deg)}}@keyframes navPeekIdleCycle{0%,93.666%{transform:rotate(0deg)}100%{transform:rotate(1080deg)}}@media (prefers-reduced-motion:reduce){.nav-peek,.nav-peek.show:hover{transition:opacity .2s ease;transform:scale(1) translateY(0)}.nav-peek img{animation:none!important;will-change:auto}}';
  document.head.appendChild(st);
  var peek=document.createElement('button'); peek.type='button'; peek.className='nav-peek'; peek.setAttribute('aria-label','Show menu');
  peek.innerHTML='<img src="/telotia-mark-tricolor-transparent.webp" alt="">';
  document.body.appendChild(peek);
  var hidden=false, last=0;
  function show(){nav.style.top='0';nav.style.opacity='';nav.style.pointerEvents='';peek.classList.remove('show');hidden=false;}
  function hide(){nav.style.top='-120px';nav.style.opacity='0';nav.style.pointerEvents='none';peek.classList.add('show');hidden=true;}
  peek.addEventListener('click',function(e){e.preventDefault();show();last=window.pageYOffset||document.documentElement.scrollTop||0;}); /* reveal nav + reset baseline so a later scroll-down re-hides */
  window.addEventListener('scroll',function(){
    var y=window.pageYOffset||document.documentElement.scrollTop||0;
    if(y>last+4 && y>80){ if(!hidden) hide(); }            /* scrolling down → hide (peek shows) */
    else if(y<last-4 || y<=80){ if(hidden) show(); }       /* scrolling up or near top → show */
    last=y;
  },{passive:true});
})();
