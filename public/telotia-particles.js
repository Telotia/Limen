/* ============================================================================
 * Telotia — particle / canvas effects (standalone, no framework)
 * ----------------------------------------------------------------------------
 * Four self-contained effects lifted from the Telotia site, rewritten as plain
 * functions. Each takes a <canvas> element (it sizes itself to the canvas's
 * PARENT, so wrap the canvas in a positioned container) and returns a handle
 * with .destroy() to stop the animation and detach listeners.
 *
 *   const stop = TelotiaParticles.hero(canvasEl);
 *   // ...later
 *   stop.destroy();
 *
 * Effects:
 *   hero(canvas)              constellation — drifting nodes + proximity lines
 *   glossary(canvas)          morphing point-cloud (molecule → dna → cell → capsule)
 *   consult(canvas)           orbiting nebula clusters + scattered dust
 *   verdictSphere(canvas, opts) draggable 3D fibonacci sphere with inertia
 *
 * Palette (warm ink-wash — matches Limen dev tokens):
 *   #2F6FB0 teal   #5990C0 tealglow   #1F4E86 teal2 (dark)
 *   #5C6680 slate  #a8bcd8 silver     #CCA273 sand (warm gold accent)
 * ==========================================================================*/
(function (global) {
  'use strict';

  // --- shared helpers -------------------------------------------------------

  // Size a canvas to its parent box (DPR-aware) and return a 2D context whose
  // units are CSS pixels. Call again on resize.
  function fit(cv) {
    const p = cv.parentElement, r = p.getBoundingClientRect();
    const dpr = Math.min(1.5, global.devicePixelRatio || 1);   // cap retina fill: soft particle art doesn't need 2x
    cv.width = Math.max(1, r.width * dpr);
    cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  // Pointer events arrive in rendered viewport pixels. A resizable/zoomable
  // window can temporarily render a canvas at a different size from the
  // logical CSS-pixel dimensions used by its simulation, so always map the
  // event back into that logical coordinate space.
  function pointerXY(cv, dim, event) {
    const r = cv.getBoundingClientRect();
    const renderedWidth = Math.max(1, r.width);
    const renderedHeight = Math.max(1, r.height);
    return [
      (event.clientX - r.left) * dim.w / renderedWidth,
      (event.clientY - r.top) * dim.h / renderedHeight
    ];
  }

  // "#2F6FB0", 0.5  ->  "rgba(47,111,176,0.500)"
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  // Honour the OS "reduce motion" setting: animations render one static frame, no loop.
  var REDUCED = !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Freeze all canvas work WHILE the page is scrolling — the single biggest scroll-
  // smoothness win. rAF keeps ticking but the expensive draw is skipped until the
  // user stops (150ms idle), so the main thread is free exactly when scrolling needs it.
  var _scrolling = false, _scrollTimer = 0;
  var _root = global.document && global.document.documentElement;
  if (global.addEventListener) global.addEventListener('scroll', function () {
    if (!_scrolling && _root) _root.classList.add('tl-scrolling');   // CSS drops backdrop-filters during scroll
    _scrolling = true;
    if (_scrollTimer) clearTimeout(_scrollTimer);
    _scrollTimer = setTimeout(function () { _scrolling = false; if (_root) _root.classList.remove('tl-scrolling'); }, 150);
  }, { passive: true });

  // Run `tick` on rAF only while the canvas is on-screen — off-screen canvases pause (the perf win).
  function gated(cv, tick) {
    var raf = 0, vis = true, el = cv.parentElement || cv, last = -1e9;
    if (REDUCED) { tick(); return { stop: function () {} }; }
    function loop(t) {                                  // ~30fps cap + freeze during scroll (both invisible, big CPU cut)
      if (!_scrolling && (t || 0) - last >= 32) { last = t || 0; tick(); }
      if (vis) raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);                 // draw immediately; don't wait on the observer
    var io = ('IntersectionObserver' in global) ? new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (on && !vis) { vis = true; raf = requestAnimationFrame(loop); }   // resume on-screen
      else if (!on && vis) { vis = false; cancelAnimationFrame(raf); }     // pause off-screen (the perf win)
    }, { rootMargin: '200px' }) : null;
    if (io) io.observe(el);
    return { stop: function () { vis = false; cancelAnimationFrame(raf); if (io) io.disconnect(); } };
  }

  // Pre-rendered radial-glow sprite, cached per colour. drawImage of a cached bitmap
  // is far cheaper than allocating a createRadialGradient every frame per node.
  var _glowCache = {};
  function glowSprite(hex, peak) {
    var key = hex + '|' + peak;
    if (_glowCache[key]) return _glowCache[key];
    var S = 64, oc = (typeof OffscreenCanvas !== 'undefined')
      ? new OffscreenCanvas(S, S) : global.document.createElement('canvas');
    oc.width = S; oc.height = S;
    var g = oc.getContext('2d'), grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grd.addColorStop(0, hexA(hex, peak)); grd.addColorStop(1, hexA(hex, 0));
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    _glowCache[key] = oc; return oc;
  }

  // ==========================================================================
  // 1. HERO — constellation: drifting nodes joined by fading proximity lines
  // ==========================================================================
  function hero(cv) {
    if (!cv) return { destroy: function () {} };
    let dim = fit(cv), ctx = dim.ctx, raf = 0;
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; };

    const N = Math.max(28, Math.min(56, Math.round(dim.w / 28)));
    const pts = [];
    for (let i = 0; i < N; i++) pts.push({
      x: Math.random() * dim.w, y: Math.random() * dim.h,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.6
    });

    const tick = function () {
      const w = dim.w, h = dim.h;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d < 120) {
          ctx.strokeStyle = 'rgba(89,144,192,' + ((1 - d / 120) * 0.26).toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = 'rgba(168,188,216,0.5)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
    };
    var _g = gated(cv, tick);
    global.addEventListener('resize', onResize);
    return { destroy: function () { _g.stop(); global.removeEventListener('resize', onResize); } };
  }

  // ==========================================================================
  // 2. GLOSSARY — point cloud that morphs between four silhouettes
  // ==========================================================================
  function glossary(cv, opts) {
    if (!cv) return { destroy: function () {} };
    opts = opts || {};
    const cxf = opts.cx != null ? opts.cx : 0.5;
    const cyf = opts.cy != null ? opts.cy : 0.5;
    const scl = opts.scale != null ? opts.scale : 1;
    let dim = fit(cv), ctx = dim.ctx, raf = 0;
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; };

    const N = 260, TAU = Math.PI * 2;
    const mk = function (fn) { const a = []; for (let i = 0; i < N; i++) a.push(fn(i, i / N)); return a; };
    const rot = function (x, y, r) { return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)]; };

    const molecule = mk(function (i, f) {
      if (f < 0.3) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.2; return [Math.cos(a) * r, Math.sin(a) * r]; }
      const ang = f * TAU * 5; return rot(Math.cos(ang) * 0.95, Math.sin(ang) * 0.34, (i % 3) * Math.PI / 3);
    });
    const dna = mk(function (i, f) {
      const t = f * 2 - 1, ph = t * Math.PI * 2.6;
      if (i % 4 === 0) return [t, (Math.random() * 2 - 1) * 0.62 * Math.sin(ph)];
      return [t, 0.62 * Math.sin(ph + (i % 2) * Math.PI)];
    });
    const cell = mk(function (i, f) {
      if (f < 0.6) { const a = f / 0.6 * TAU, n = 1 + (Math.random() - 0.5) * 0.05; return [Math.cos(a) * 0.96 * n, Math.sin(a) * 0.96 * n]; }
      if (f < 0.82) { const a = (f - 0.6) / 0.22 * TAU; return [Math.cos(a) * 0.36, Math.sin(a) * 0.36]; }
      const a = Math.random() * TAU, r = 0.45 + Math.random() * 0.4; return [Math.cos(a) * r, Math.sin(a) * r];
    });
    const capsule = mk(function () {
      let x = 0, y = 0, ok = false, g = 0;
      while (!ok && g < 14) {
        x = (Math.random() * 2 - 1) * 1.05; y = (Math.random() * 2 - 1) * 0.46;
        if (Math.abs(x) <= 0.62) ok = Math.abs(y) <= 0.44;
        else { const cxp = x > 0 ? 0.62 : -0.62; ok = ((x - cxp) * (x - cxp) + y * y) <= 0.1936; }
        g++;
      }
      return [x, y];
    });

    const shapes = [molecule, dna, cell, capsule];
    // Batched draw setup (2026-07-02): was 260 individual beginPath+arc+fill triples per
    // frame (one canvas state change + path reset per particle -- MDN's canvas perf guide
    // flags exactly this pattern: "batch canvas calls together" instead of many small ones).
    // Group particles by color x a quantized twinkle-alpha level, so each frame does at most
    // colors(4) x levels(8) = 32 beginPath/fill calls instead of 260, each drawing every
    // particle that currently shares that fillStyle in one path. 8 alpha levels is visually
    // indistinguishable from the old continuous alpha at this particle size (1.4-2.9px).
    const PALETTE = ['#CCA273', '#5990C0', '#2F6FB0', '#1F4E86'];
    const ALEVELS = 8;
    const fillCache = PALETTE.map(function (hex) {
      const a = []; for (let i = 0; i < ALEVELS; i++) a.push(hexA(hex, 0.26 + (i / (ALEVELS - 1)) * 0.44)); return a;
    });
    const buckets = PALETTE.map(function () { const b = []; for (let i = 0; i < ALEVELS; i++) b.push([]); return b; });
    const parts = [];
    for (let i = 0; i < N; i++) parts.push({
      x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
      colIdx: Math.random() < 0.22 ? 0 : 1 + (i % 3), tw: Math.random() * TAU
    });

    let cur = 0, frame = 0;
    const draw = function () {
      const w = dim.w, h = dim.h, cx = w * cxf, cy = h * cyf, S = Math.min(w * 0.56, h * 0.42) * scl;
      ctx.clearRect(0, 0, w, h);
      // Shape hold + per-particle ease speed, tuned 2026-07-02 (was 560/0.034 ->
      // ~18s hold + ~2.8s settle at the 30fps gate, reported as too slow/static).
      // 280/0.06 -> ~9s hold + ~1.6s settle: noticeably livelier, still unhurried.
      frame++; if (frame % 280 === 0) cur = (cur + 1) % shapes.length;
      const tgt = shapes[cur];
      for (let c = 0; c < buckets.length; c++) for (let a = 0; a < ALEVELS; a++) buckets[c][a].length = 0;
      for (let i = 0; i < N; i++) {
        const p = parts[i], t = tgt[i];
        p.x += (t[0] - p.x) * 0.06; p.y += (t[1] - p.y) * 0.06;
        const tw = 0.5 + 0.5 * Math.sin(p.tw + frame * 0.03);
        const alv = Math.min(ALEVELS - 1, (tw * ALEVELS) | 0);
        buckets[p.colIdx][alv].push(cx + p.x * S, cy + p.y * S, 1.4 + tw * 1.5);
      }
      for (let c = 0; c < buckets.length; c++) {
        for (let a = 0; a < ALEVELS; a++) {
          const arr = buckets[c][a];
          if (!arr.length) continue;
          ctx.fillStyle = fillCache[c][a];
          ctx.beginPath();
          for (let k = 0; k < arr.length; k += 3) { ctx.moveTo(arr[k] + arr[k + 2], arr[k + 1]); ctx.arc(arr[k], arr[k + 1], arr[k + 2], 0, TAU); }
          ctx.fill();
        }
      }
    };
    var _g = gated(cv, draw);
    global.addEventListener('resize', onResize);
    return { destroy: function () { _g.stop(); global.removeEventListener('resize', onResize); } };
  }

  // ==========================================================================
  // 3. CONSULT — orbiting nebula clusters + scattered background dust
  // ==========================================================================
  function consult(cv) {
    if (!cv) return { destroy: function () {} };
    let dim = fit(cv), ctx = dim.ctx, blooms = [], strokes = [];

    const build = function () {
      const w = dim.w, h = dim.h, m = Math.min(w, h);
      blooms = [];
      strokes = [];
      const pools = [
        { x: -.02, y: .30, rx: .18, ry: .25, col: '#263832', a: .095 },
        { x: .18, y: .87, rx: .30, ry: .16, col: '#263832', a: .085 },
        { x: .42, y: .04, rx: .19, ry: .11, col: '#2A55A5', a: .075 },
        { x: .76, y: .18, rx: .17, ry: .12, col: '#2A55A5', a: .055 },
        { x: .99, y: .76, rx: .16, ry: .24, col: '#263832', a: .09 },
        { x: .93, y: .91, rx: .065, ry: .08, col: '#C13B33', a: .18 },
        { x: .13, y: .55, rx: .055, ry: .075, col: '#E3A32C', a: .10 }
      ];
      pools.forEach(function (p) {
        const points = [];
        for (let i = 0; i < 30; i++) points.push(.84 + Math.random() * .28);
        blooms.push({ x:p.x*w, y:p.y*h, rx:p.rx*m, ry:p.ry*m, col:p.col, alpha:p.a, phase:Math.random()*6.28, points:points });
      });
      strokes.push({x1:-.04*w,y1:.66*h,c1x:.12*w,c1y:.57*h,c2x:.28*w,c2y:.78*h,x2:.47*w,y2:.70*h,col:'#263832',width:Math.max(7,m*.013),alpha:.10,phase:.4});
      strokes.push({x1:.58*w,y1:.08*h,c1x:.70*w,c1y:.14*h,c2x:.83*w,c2y:.06*h,x2:1.04*w,y2:.18*h,col:'#2A55A5',width:Math.max(4,m*.008),alpha:.07,phase:2.1});
      strokes.push({x1:.82*w,y1:.96*h,c1x:.88*w,c1y:.82*h,c2x:.96*w,c2y:.90*h,x2:1.03*w,y2:.72*h,col:'#263832',width:Math.max(8,m*.015),alpha:.10,phase:4.2});
    };
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; build(); };
    build();

    let t = 0;
    const blobPath = function (b, scale) {
      const n = b.points.length;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const j = i % n, a = j / n * Math.PI * 2;
        const wobble = b.points[j] * scale;
        const x = b.x + Math.cos(a) * b.rx * wobble;
        const y = b.y + Math.sin(a) * b.ry * wobble;
        if (!i) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
    };
    const draw = function () {
      ctx.clearRect(0, 0, dim.w, dim.h);
      t += .012;
      for (const b of blooms) {
        const breath = 1 + Math.sin(t + b.phase) * .018;
        for (let layer = 3; layer >= 0; layer--) {
          blobPath(b, breath * (1 + layer * .055));
          ctx.fillStyle = hexA(b.col, b.alpha * (layer ? .23 : .48));
          ctx.fill();
        }
        blobPath(b, breath * .96);
        ctx.strokeStyle = hexA(b.col, b.alpha * .48);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (const s of strokes) {
        const breathe = .86 + .14 * Math.sin(t * .7 + s.phase);
        for (let pass = 0; pass < 5; pass++) {
          const off = (pass - 2) * Math.max(1,s.width*.14);
          ctx.beginPath(); ctx.moveTo(s.x1,s.y1+off);
          ctx.bezierCurveTo(s.c1x,s.c1y+off*.55,s.c2x,s.c2y-off*.35,s.x2,s.y2+off*.18);
          ctx.strokeStyle = hexA(s.col,s.alpha*breathe*(1-pass*.11));
          ctx.lineWidth = Math.max(.7,s.width*(1-pass*.16));
          ctx.lineCap = 'round';
          ctx.setLineDash(pass > 2 ? [s.width*1.7,s.width*.9] : []);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    };
    var _g = gated(cv, draw);
    global.addEventListener('resize', onResize);
    return { destroy: function () { _g.stop(); global.removeEventListener('resize', onResize); } };
  }

  // ==========================================================================
  // 4. VERDICT SPHERE — fibonacci point sphere, slow auto-spin, drag w/ inertia
  // --------------------------------------------------------------------------
  // opts.dragTarget : element that captures pointer drags (default: canvas's
  //                   parent). Drag horizontally to spin, vertically to tilt;
  //                   release to fling with momentum that decays to idle spin.
  // ==========================================================================
  function verdictSphere(cv, opts) {
    if (!cv) return { destroy: function () {} };
    opts = opts || {};
    const AMBER = '#B88423';
    const fine = !!(global.matchMedia && global.matchMedia('(pointer: fine)').matches);
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    // Sumi first, mineral pigments second: blue carries evidence, red/yellow punctuate.
    function nodeCol() { const r = Math.random(); return r < 0.66 ? '#263832' : (r < 0.88 ? '#2A55A5' : (r < 0.95 ? '#C13B33' : '#B88423')); }
    function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

    // -- Renderer: WebGL (GPU) when available, else the 2D-canvas path (fallback). --
    // Nodes = GL point-sprites with a glow fragment shader; edges = GL lines. The
    // GPU draws them in parallel so the main thread stays free (that's the win).
    const dpr = Math.min(1.5, global.devicePixelRatio || 1);
    // The verdict graph intentionally stays 2D: layered washes need canvas
    // gradients and irregular paths rather than luminous WebGL point sprites.
    let useGL = false;

    let gl = null, ctx = null, dim = { w: 1, h: 1 };
    let pProg, lProg, pPos, pSize, pCol, lPos, lCol, maxPt = 255;
    const uP = {}, uL = {};
    function sh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    function prog(vs, fs) { const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs); if (!v || !f) return null; const p = gl.createProgram(); gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p); return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null; }
    if (useGL) {
      try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true, depth: false }); } catch (e) { gl = null; }
      if (gl) {
        const VP = 'attribute vec2 aPos;attribute float aSize;attribute vec4 aColor;uniform vec2 uCam;uniform vec2 uView;uniform float uDpr;varying vec4 vColor;void main(){vec2 p=aPos+uCam;vec2 c=(p/uView)*2.0-1.0;c.y=-c.y;gl_Position=vec4(c,0.0,1.0);gl_PointSize=aSize*uDpr;vColor=aColor;}';
        const FP = 'precision mediump float;varying vec4 vColor;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d)*2.0;float core=smoothstep(0.44,0.30,r);float glow=smoothstep(1.0,0.0,r);float a=(core+glow*0.42)*vColor.a;if(a<=0.003)discard;gl_FragColor=vec4(vColor.rgb,a);}';
        const VL = 'attribute vec2 aPos;attribute vec4 aColor;uniform vec2 uCam;uniform vec2 uView;varying vec4 vColor;void main(){vec2 p=aPos+uCam;vec2 c=(p/uView)*2.0-1.0;c.y=-c.y;gl_Position=vec4(c,0.0,1.0);vColor=aColor;}';
        const FL = 'precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}';
        pProg = prog(VP, FP); lProg = prog(VL, FL);
        if (pProg && lProg) {
          pPos = gl.createBuffer(); pSize = gl.createBuffer(); pCol = gl.createBuffer();
          lPos = gl.createBuffer(); lCol = gl.createBuffer();
          uP.cam = gl.getUniformLocation(pProg, 'uCam'); uP.view = gl.getUniformLocation(pProg, 'uView'); uP.dpr = gl.getUniformLocation(pProg, 'uDpr');
          uL.cam = gl.getUniformLocation(lProg, 'uCam'); uL.view = gl.getUniformLocation(lProg, 'uView');
          gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          const rng = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); if (rng && rng[1]) maxPt = rng[1];
        } else { useGL = false; }
      } else { useGL = false; }
    }
    function resize() {
      const p = cv.parentElement, r = p.getBoundingClientRect();
      if (useGL) { dim = { w: r.width, h: r.height }; cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); gl.viewport(0, 0, cv.width, cv.height); }
      else { const f = fit(cv); ctx = f.ctx; dim = { w: f.w, h: f.h }; }
    }
    resize();
    const onResize = function () { resize(); };

    // A claim graph that GROWS: nodes spawn and spread outward, links creep in,
    // and falsified branches turn amber and are pruned. Positions are fixed once
    // placed (no force jitter) — recursive.com-style spread, not a physics sim.
    let uid = 0, seeding = true;
    const nodes = [];        // {x,y,r,rt,col,parent,fade,front,arm,level}
    const edges = [];        // {a,b,grow}
    const blooms = [];       // transient ink diffusion born with every node/action
    const MAX = 28;

    // Keep the composition inside a generous mat so no node or wash appears cut off.
    let ox = 0, oy = 0;
    const safeX = function () { return Math.max(46, Math.min(72, dim.w * 0.09)); };
    const safeTop = function () { return 52; };
    const safeBottom = function () { return 76; };

    function bloomAt(x, y, col, force) {
      const lobes = [], curls = [], satellites = [], variant = (Math.random() * 4) | 0;
      for (let i = 0; i < 20; i++) lobes.push(0.88 + Math.random() * 0.20);
      const curlCount = variant === 1 ? 8 : (variant === 0 ? 2 : 4);
      for (let i = 0; i < curlCount; i++) curls.push({ a: Math.random() * Math.PI * 2, d: 0.24 + Math.random() * 0.48, s: Math.random() < 0.5 ? -1 : 1 });
      const speckCount = variant === 2 ? 6 + ((Math.random() * 5) | 0) : (variant === 3 ? 3 : 0);
      for (let i = 0; i < speckCount; i++) satellites.push({ a: Math.random() * Math.PI * 2,
        d: 0.72 + Math.random() * 0.74, r: 0.6 + Math.random() * 1.9, o: 0.35 + Math.random() * 0.55 });
      blooms.push({ x: x, y: y, col: col, age: seeding ? -Math.min(0.62, blooms.length * 0.11) : 0, life: force ? 2.15 : 1.75,
        radius: (force ? 45 : 29) + Math.random() * (force ? 13 : 15), density: 0.72 + Math.random() * 0.50,
        sx: 0.82 + Math.random() * 0.34, sy: 0.82 + Math.random() * 0.34,
        phase: Math.random() * Math.PI * 2, variant: variant, lobes: lobes, curls: curls, satellites: satellites });
    }

    const MIN_NODE_GAP = 30;
    let growthPlan = [], growthCursor = 0, planPhase = Math.random() * Math.PI * 2;

    function clearPosition(x, y) {
      const minGap = Math.max(26, Math.min(MIN_NODE_GAP, Math.min(dim.w, dim.h) * 0.07));
      const baseX = clamp(x, safeX(), dim.w - safeX()), baseY = clamp(y, safeTop(), dim.h - safeBottom());
      let best = [baseX, baseY], bestClear = -1;
      for (let k = 0; k < 24; k++) {
        const ring = k === 0 ? 0 : minGap * (0.88 + Math.floor((k - 1) / 8) * 0.62);
        const angle = k * 2.399963 + growthCursor * 0.17;
        const px = clamp(baseX + Math.cos(angle) * ring, safeX(), dim.w - safeX());
        const py = clamp(baseY + Math.sin(angle) * ring, safeTop(), dim.h - safeBottom());
        let nearestGap = 1e9;
        for (const n of nodes) {
          if (n.fade) continue;
          const dx = n.x - px, dy = n.y - py;
          nearestGap = Math.min(nearestGap, Math.sqrt(dx * dx + dy * dy));
        }
        const score = nearestGap - ring * 0.12;
        if (score > bestClear) { bestClear = score; best = [px, py]; }
        if (nearestGap >= minGap) return [px, py];
      }
      return best;
    }

    function buildGrowthPlan() {
      const arms = dim.w < 620 ? 5 : 7;
      const levels = 4, cx = dim.w * 0.5, cy = dim.h * 0.51;
      const rx = Math.max(88, Math.min(dim.w * 0.37, 250));
      const ry = Math.max(68, Math.min(dim.h * 0.34, 180));
      growthPlan = [];
      for (let level = 1; level <= levels; level++) {
        const radius = level / levels;
        for (let arm = 0; arm < arms; arm++) {
          const angle = planPhase + arm * Math.PI * 2 / arms + (level - 1) * 0.055;
          const breathing = 0.94 + 0.06 * Math.sin(arm * 1.7 + level);
          growthPlan.push({
            x: cx + Math.cos(angle) * rx * radius * breathing,
            y: cy + Math.sin(angle) * ry * radius,
            arm: arm,
            level: level
          });
        }
      }
      growthCursor = 0;
    }

    function nextGrowthTarget() {
      if (!growthPlan.length || growthCursor >= growthPlan.length) {
        planPhase += Math.PI / 7;
        buildGrowthPlan();
      }
      return growthPlan[growthCursor++];
    }

    function parentForTarget(target, list) {
      let parent = null, best = 1e9;
      for (const n of list) {
        if (target.level > 1 && (n.arm !== target.arm || n.level !== target.level - 1)) continue;
        const dx = n.x - target.x, dy = n.y - target.y, d = dx * dx + dy * dy;
        if (d < best) { best = d; parent = n; }
      }
      if (!parent) {
        for (const n of list) {
          const dx = n.x - target.x, dy = n.y - target.y, d = dx * dx + dy * dy;
          if (d < best) { best = d; parent = n; }
        }
      }
      return parent;
    }

    function spawnAt(x, y, parent, meta) {
      const clear = clearPosition(x, y);
      const n = { id: uid++, x: clear[0], y: clear[1], r: 0.1, rt: 2.4 + Math.random() * 4.4,
        col: nodeCol(), parent: parent || null, fade: 0, front: 14,
        arm: meta && meta.arm != null ? meta.arm : (parent ? parent.arm : -1),
        level: meta && meta.level != null ? meta.level : (parent ? parent.level + 1 : 0) };
      nodes.push(n);
      if (parent) edges.push({ a: parent, b: n, grow: 0,
        delay: 0.10 + (seeding ? Math.min(0.62, blooms.length * 0.11) : 0),
        speed: 0.009 + Math.random() * 0.009, bend: (Math.random() - 0.5) * 44,
        width: 0.72 + Math.random() * 0.68, phase: Math.random() * Math.PI * 2 });
      bloomAt(n.x, n.y, n.col, !parent);
      return n;
    }
    function nearest(x, y) {
      let best = null, bd = 1e9;
      for (const n of nodes) { if (n.fade) continue; const dx = n.x - x, dy = n.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = n; } }
      return best;
    }
    function live() { return nodes.filter(function (n) { return !n.fade; }); }
    function grow() {
      const L = live();
      if (!L.length) { spawnAt(dim.w * 0.5, dim.h * 0.5, null, { arm: -1, level: 0 }); return; }
      const target = nextGrowthTarget();
      const parent = parentForTarget(target, L);
      spawnAt(target.x, target.y, parent, target);
      if (parent) parent.front = Math.max(0, parent.front - 7);
    }
    function subtree(n) {
      const set = new Set([n]); let grew = true;
      while (grew) { grew = false; for (const m of nodes) if (!set.has(m) && m.parent && set.has(m.parent)) { set.add(m); grew = true; } }
      return set;
    }
    function falsify(n) {
      bloomAt(n.x, n.y, '#C13B33', true);
      subtree(n).forEach(function (m) { if (!m.fade) { m.fade = 0.0001; m.col = AMBER; } });
    }

    buildGrowthPlan();
    const root = spawnAt(dim.w * 0.5, dim.h * 0.52, null, { arm: -1, level: 0 }); root.rt = 6; root.col = '#263832'; if (blooms[0]) blooms[0].col = root.col;
    for (let i = 0; i < 5; i++) grow();
    seeding = false;

    let hover = null, gt = 0, ft = 0, _ph, _pox = null, _poy = null;
    // pointer state: a short tap adds/prunes; movement cancels the action.
    let down = false, panning = false, sx = 0, sy = 0, hitNode = null;
    let activePointerId = null, touchPointer = false;
    function localXY(e) { return pointerXY(cv, dim, e); }
    function hit(wx, wy, pad) { let best = null, bd = 1e9; for (const n of nodes) { if (n.fade) continue; const r = n.rt + (pad == null ? 11 : pad), dx = wx - n.x, dy = wy - n.y, d = dx * dx + dy * dy; if (d < r * r && d < bd) { bd = d; best = n; } } return best; }
    function insideCanvas(xy) { return xy[0] >= 0 && xy[0] <= dim.w && xy[1] >= 0 && xy[1] <= dim.h; }
    function resetPointer() {
      down = false; panning = false; hitNode = null; activePointerId = null; touchPointer = false;
      if (fine) cv.style.cursor = 'crosshair';
    }
    function onMove(e) {
      const xy = localXY(e);
      if (down) {
        if (e.pointerId !== activePointerId) return;
        const dx = xy[0] - sx, dy = xy[1] - sy;
        const dragThreshold = touchPointer ? 144 : 36;
        if (!panning && dx * dx + dy * dy > dragThreshold) panning = true;
        if (panning && fine) cv.style.cursor = 'default';
        return;
      }
      if (!fine || e.pointerType === 'touch') return;
      hover = hit(xy[0] - ox, xy[1] - oy, 11);
      cv.style.cursor = hover ? 'pointer' : 'crosshair';
    }
    function onDown(e) {
      if (activePointerId !== null || e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const xy = localXY(e);
      activePointerId = e.pointerId;
      touchPointer = e.pointerType === 'touch';
      down = true; panning = false; sx = xy[0]; sy = xy[1];
      hitNode = hit(xy[0] - ox, xy[1] - oy, touchPointer ? 24 : 11);
      if (fine) cv.style.cursor = hitNode ? 'pointer' : 'crosshair';
      // Keep one-finger vertical scrolling native on phones. A real scroll fires
      // pointercancel; a stationary finger still produces the tap action below.
      if (e.pointerType === 'mouse') e.preventDefault();
    }
    function onUp(e) {
      if (!down || e.pointerId !== activePointerId) return;
      const xy = localXY(e);
      if (!panning && insideCanvas(xy)) {                  // a tap, not a drag/scroll
        if (hitNode) falsify(hitNode);                    // tap a chain -> amber -> pruned
        else { const wx = xy[0] - ox, wy = xy[1] - oy; spawnAt(wx, wy, nearest(wx, wy)); }
      }
      resetPointer();
    }
    function onCancel(e) { if (e.pointerId === activePointerId) resetPointer(); }
    function onLeave() { if (!down) { hover = null; if (fine) cv.style.cursor = 'crosshair'; } }
    if (fine) cv.style.cursor = 'crosshair';
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerdown', onDown);
    global.addEventListener('pointerup', onUp);
    global.addEventListener('pointercancel', onCancel);
    cv.addEventListener('pointerleave', onLeave);

    // advance the simulation one tick (shared by both renderers)
    function step() {
      if (++gt > 60) { gt = 0; if (live().length < MAX) grow(); else { var L0 = live(); if (L0.length) falsify(L0[(Math.random() * L0.length) | 0]); } }
      if (++ft > 240) { ft = 0; var L1 = live(); if (L1.length > 10) falsify(L1[(Math.random() * L1.length) | 0]); }
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i];
        n.r += (n.rt - n.r) * 0.12;
        if (n.front > 0) n.front -= 0.14;
        if (n.fade) { n.fade += 0.05; if (n.fade >= 1) nodes.splice(i, 1); }
      }
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (nodes.indexOf(e.a) < 0 || nodes.indexOf(e.b) < 0) { edges.splice(i, 1); continue; }
        if (e.delay > 0) e.delay -= 0.018;
        else if (e.grow < 1) e.grow = Math.min(1, e.grow + e.speed);
      }
      for (let i = blooms.length - 1; i >= 0; i--) {
        blooms[i].age += 0.018;
        if (blooms[i].age >= blooms[i].life) blooms.splice(i, 1);
      }
    }

    function inkBlobPath(b, R, wobble) {
      const count = b.lobes.length, pts = [];
      for (let i = 0; i < count; i++) {
        const a = b.phase + i / count * Math.PI * 2;
        const rr = R * (b.lobes[i] + Math.sin(a * 3 + b.phase) * wobble);
        pts.push([b.x + ox + Math.cos(a) * rr * b.sx, b.y + oy + Math.sin(a) * rr * b.sy]);
      }
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const p = pts[i], q = pts[(i + 1) % count];
        const mx = (p[0] + q[0]) * 0.5, my = (p[1] + q[1]) * 0.5;
        if (!i) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p[0], p[1], mx, my);
      }
      ctx.closePath();
    }

    function paintBloom(b) {
      if (b.age < 0) return;
      const t = Math.min(1, b.age / b.life);
      const open = 1 - Math.pow(1 - Math.min(1, t * 1.55), 3);
      const fade = t < 0.68 ? 1 : 1 - (t - 0.68) / 0.32;
      const R = 4 + b.radius * open;
      const X = b.x + ox, Y = b.y + oy;
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.filter = 'blur(.45px)';

      const halo = ctx.createRadialGradient(X, Y, R * 0.08, X, Y, R * 1.18);
      halo.addColorStop(0, hexA(b.col, 0.17 * fade * b.density));
      halo.addColorStop(0.38, hexA(b.col, 0.085 * fade * b.density));
      halo.addColorStop(0.78, hexA(b.col, 0.026 * fade * b.density));
      halo.addColorStop(1, hexA(b.col, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(X, Y, R * 1.18, 0, 7); ctx.fill();

      inkBlobPath(b, R * (b.variant === 0 ? 0.92 : 0.84), b.variant === 1 ? 0.045 : 0.025);
      ctx.fillStyle = hexA(b.col, (0.022 + (1 - t) * 0.042) * fade * b.density); ctx.fill();
      ctx.strokeStyle = hexA(b.col, (b.variant === 3 ? 0.12 : 0.065) * fade * b.density);
      ctx.lineWidth = Math.max(.55, R * (b.variant === 3 ? .026 : .016)); ctx.stroke();

      inkBlobPath(b, R * 0.58, 0.018);
      ctx.fillStyle = hexA(b.col, (0.030 + (1 - t) * 0.036) * fade * b.density); ctx.fill();

      if (b.variant === 3) {
        inkBlobPath(b, R * 0.70, 0.012);
        ctx.strokeStyle = hexA(b.col, 0.055 * fade * b.density); ctx.lineWidth = Math.max(.45, R * .011); ctx.stroke();
      }

      for (let i = 0; i < b.curls.length; i++) {
        const c = b.curls[i], rr = R * c.d, cx = X + Math.cos(c.a) * R * 0.45, cy = Y + Math.sin(c.a) * R * 0.36;
        ctx.strokeStyle = hexA(b.col, (0.038 + i * 0.004) * fade);
        ctx.lineWidth = Math.max(0.55, R * (0.035 - i * 0.002));
        ctx.beginPath(); ctx.arc(cx, cy, rr, c.a - 1.55 * c.s, c.a + 1.15 * c.s, c.s < 0); ctx.stroke();
      }

      for (let i = 0; i < b.satellites.length; i++) {
        const s = b.satellites[i], rr = R * s.d;
        const sx = X + Math.cos(s.a) * rr * b.sx, sy = Y + Math.sin(s.a) * rr * b.sy;
        ctx.fillStyle = hexA(b.col, 0.19 * s.o * fade * b.density);
        ctx.beginPath(); ctx.arc(sx, sy, Math.max(.45, s.r * open), 0, 7); ctx.fill();
      }

      ctx.filter = 'none';
      const core = ctx.createRadialGradient(X, Y, 0, X, Y, Math.max(3, R * 0.32));
      core.addColorStop(0, hexA(b.col, 0.34 * fade * b.density));
      core.addColorStop(0.48, hexA(b.col, 0.13 * fade * b.density));
      core.addColorStop(1, hexA(b.col, 0));
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(X, Y, Math.max(3, R * 0.34), 0, 7); ctx.fill();
      ctx.restore();
    }

    function paint2D() {
      ctx.clearRect(0, 0, dim.w, dim.h);
      for (const b of blooms) paintBloom(b);
      for (const e of edges) {
        const a = e.a, b = e.b, g = e.grow < 1 ? e.grow : 1;
        if (e.delay > 0 || g <= 0) continue;
        const ax = a.x + ox, ay = a.y + oy, bx = b.x + ox, by = b.y + oy;
        const dx = bx - ax, dy = by - ay, len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const nx = -dy / len, ny = dx / len;
        const cx = (ax + bx) * .5 + nx * e.bend, cy = (ay + by) * .5 + ny * e.bend;
        const fade = a.fade > b.fade ? a.fade : b.fade, amber = a.col === AMBER || b.col === AMBER;
        const al = (amber ? 0.36 : 0.22) * (1 - fade);
        const steps = Math.max(5, Math.ceil(24 * g));
        ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let pass = 0; pass < 3; pass++) {
          ctx.strokeStyle = amber ? 'rgba(184,132,35,' + (al * (pass ? .30 : 1)).toFixed(3) + ')' :
            'rgba(38,56,50,' + (al * (pass ? .28 : 1)).toFixed(3) + ')';
          ctx.lineWidth = (amber ? 1.25 : e.width) * (pass === 0 ? 1 : (pass === 1 ? .62 : .34));
          ctx.beginPath();
          for (let i = 0; i <= steps; i++) {
            const t = g * i / steps, mt = 1 - t;
            let x = mt * mt * ax + 2 * mt * t * cx + t * t * bx;
            let y = mt * mt * ay + 2 * mt * t * cy + t * t * by;
            if (pass) { const rough = Math.sin(t * 29 + e.phase + pass * 1.7) * (pass === 1 ? .62 : .38); x += nx * rough; y += ny * rough; }
            if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        if (g < 1) {
          const mt = 1 - g, hx = mt * mt * ax + 2 * mt * g * cx + g * g * bx, hy = mt * mt * ay + 2 * mt * g * cy + g * g * by;
          const tip = ctx.createRadialGradient(hx, hy, 0, hx, hy, 4.5);
          tip.addColorStop(0, amber ? 'rgba(184,132,35,.30)' : 'rgba(38,56,50,.28)');
          tip.addColorStop(1, 'rgba(38,56,50,0)');
          ctx.fillStyle = tip; ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, 7); ctx.fill();
        }
        ctx.restore();
      }
      for (const n of nodes) {
        const vis = 1 - n.fade, hot = n === hover, X = n.x + ox, Y = n.y + oy;
        const gs = (n.r + 2) * 2.15, peak = (n.front > 4 ? 0.20 : 0.10) * vis;
        ctx.drawImage(glowSprite(n.col, peak), X - gs, Y - gs, gs * 2, gs * 2);
        ctx.fillStyle = hexA(n.col, (n.front > 4 || hot ? 0.95 : 0.78) * vis);
        ctx.beginPath(); ctx.arc(X, Y, n.r < 0.5 ? 0.5 : n.r, 0, 7); ctx.fill();
      }
    }

    const _lp = [], _lc = [], _pp = [], _ps = [], _pc = [];
    function bindAttr(prog, buf, name, size, data) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    function paintGL() {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      _lp.length = 0; _lc.length = 0;
      for (const e of edges) {
        const a = e.a, b = e.b, g = e.grow < 1 ? e.grow : 1;
        const ex = a.x + (b.x - a.x) * g, ey = a.y + (b.y - a.y) * g;
        const fade = a.fade > b.fade ? a.fade : b.fade, amber = a.col === AMBER || b.col === AMBER;
        const al = (amber ? 0.5 : 0.2) * (1 - fade), c = amber ? [0.800, 0.635, 0.451] : [0.361, 0.400, 0.502];
        _lp.push(a.x, a.y, ex, ey); _lc.push(c[0], c[1], c[2], al, c[0], c[1], c[2], al);
      }
      if (_lp.length) {
        gl.useProgram(lProg); gl.uniform2f(uL.cam, ox, oy); gl.uniform2f(uL.view, dim.w, dim.h);
        bindAttr(lProg, lPos, 'aPos', 2, _lp); bindAttr(lProg, lCol, 'aColor', 4, _lc);
        gl.drawArrays(gl.LINES, 0, _lp.length / 2);
      }
      _pp.length = 0; _ps.length = 0; _pc.length = 0;
      for (const n of nodes) {
        const vis = 1 - n.fade, hot = n === hover, c = rgb(n.col);
        const size = Math.min(maxPt / dpr, (n.r + 2) * 6.4), a = (n.front > 4 || hot ? 0.95 : 0.78) * vis;
        _pp.push(n.x, n.y); _ps.push(size); _pc.push(c[0], c[1], c[2], a);
      }
      if (_pp.length) {
        gl.useProgram(pProg); gl.uniform2f(uP.cam, ox, oy); gl.uniform2f(uP.view, dim.w, dim.h); gl.uniform1f(uP.dpr, dpr);
        bindAttr(pProg, pPos, 'aPos', 2, _pp); bindAttr(pProg, pSize, 'aSize', 1, _ps); bindAttr(pProg, pCol, 'aColor', 4, _pc);
        gl.drawArrays(gl.POINTS, 0, _pp.length / 2);
      }
    }

    const draw = function () {
      step();
      // idle-skip: only repaint when something actually changed (spawn/grow-in/fade,
      // hover, or camera pan). Between spawns the graph is static -> zero canvas work.
      let active = (hover !== _ph) || (ox !== _pox) || (oy !== _poy);
      if (blooms.length) active = true;
      if (!active) { for (const n of nodes) { if (n.fade || Math.abs(n.rt - n.r) > 0.2) { active = true; break; } } }
      if (!active) { for (const e of edges) { if (e.grow < 1) { active = true; break; } } }
      if (!active) return;
      _ph = hover; _pox = ox; _poy = oy;
      if (useGL) paintGL(); else paint2D();
    };
    var _g = gated(cv, draw);

    global.addEventListener('resize', onResize);
    // Window resizing changes this canvas without necessarily changing the
    // browser viewport. Observe its containing panel so the backing store,
    // simulation bounds, and pointer coordinates stay synchronized.
    var resizeObserver = ('ResizeObserver' in global)
      ? new global.ResizeObserver(onResize)
      : null;
    if (resizeObserver) resizeObserver.observe(cv.parentElement || cv);
    return {
      destroy: function () {
        _g.stop();
        global.removeEventListener('resize', onResize);
        if (resizeObserver) resizeObserver.disconnect();
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerdown', onDown);
        global.removeEventListener('pointerup', onUp);
        global.removeEventListener('pointercancel', onCancel);
        cv.removeEventListener('pointerleave', onLeave);
      }
    };
  }

  global.TelotiaParticles = { hero: hero, glossary: glossary, consult: consult, verdictSphere: verdictSphere, fit: fit, hexA: hexA };
})(typeof window !== 'undefined' ? window : this);
