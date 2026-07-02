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
    var raf = 0, vis = true, el = cv.parentElement || cv;
    if (REDUCED) { tick(); return { stop: function () {} }; }
    function loop() {                                   // 60fps; still freezes while scrolling (invisible, defensive)
      if (!_scrolling) tick();
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

    const N = Math.max(40, Math.min(80, Math.round(dim.w / 20)));
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
          ctx.strokeStyle = 'rgba(100,177,239,' + ((1 - d / 120) * 0.26).toFixed(3) + ')';
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

    const N = 360, TAU = Math.PI * 2;
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
    const cols = ['#5990C0', '#2F6FB0', '#1F4E86'];
    const parts = [];
    for (let i = 0; i < N; i++) parts.push({
      x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
      c: Math.random() < 0.22 ? '#CCA273' : cols[i % 3], tw: Math.random() * TAU
    });

    let cur = 0, frame = 0;
    const draw = function () {
      const w = dim.w, h = dim.h, cx = w * cxf, cy = h * cyf, S = Math.min(w * 0.56, h * 0.42) * scl;
      ctx.clearRect(0, 0, w, h);
      frame++; if (frame % 560 === 0) cur = (cur + 1) % shapes.length;
      const tgt = shapes[cur];
      for (let i = 0; i < N; i++) {
        const p = parts[i], t = tgt[i];
        p.x += (t[0] - p.x) * 0.034; p.y += (t[1] - p.y) * 0.034;
        const tw = 0.5 + 0.5 * Math.sin(p.tw + frame * 0.03);
        ctx.fillStyle = hexA(p.c, 0.26 + tw * 0.44);
        ctx.beginPath(); ctx.arc(cx + p.x * S, cy + p.y * S, 1.4 + tw * 1.5, 0, TAU); ctx.fill();
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
    let dim = fit(cv), ctx = dim.ctx, raf = 0, parts = [];

    const build = function () {
      const w = dim.w, h = dim.h, m = Math.min(w, h);
      parts = [];
      const clusters = [
        { x: w * 0.24, y: h * 0.48, r: m * 0.40, n: 140 },
        { x: w * 0.10, y: h * 0.78, r: m * 0.16, n: 40 },
        { x: w * 0.40, y: h * 0.20, r: m * 0.14, n: 55 },
        { x: w * 0.06, y: h * 0.30, r: m * 0.12, n: 45 },
        { x: w * 0.80, y: h * 0.44, r: m * 0.24, n: 70 },
        { x: w * 0.92, y: h * 0.82, r: m * 0.12, n: 60 }
      ];
      clusters.forEach(function (c) {
        for (let i = 0; i < c.n; i++) {
          const a = Math.random() * Math.PI * 2;
          const band = c.r * (0.44 + 0.56 * Math.pow(Math.random(), 0.55));
          const col = Math.random() < 0.24 ? '#CCA273' : (Math.random() < 0.5 ? '#5990C0' : '#1F4E86');
          parts.push({ cx: c.x, cy: c.y, a: a, base: band, tw: Math.random() * 6.28, sp: 0.00018 + Math.random() * 0.0006, col: col, sz: 0.6 + Math.random() * 1.9 });
        }
      });
      for (let i = 0; i < 80; i++) parts.push({ scatter: true, sx: Math.random() * w, sy: Math.random() * h, tw: Math.random() * 6.28, col: '#1F4E86', sz: 0.5 + Math.random() * 1.0 });
    };
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; build(); };
    build();

    let t = 0;
    const draw = function () {
      const w = dim.w, h = dim.h;
      ctx.clearRect(0, 0, w, h);
      t += 1;
      for (const p of parts) {
        let x, y;
        if (p.scatter) { x = p.sx; y = p.sy; }
        else { const ang = p.a + t * p.sp; x = p.cx + Math.cos(ang) * p.base; y = p.cy + Math.sin(ang) * p.base * 0.92; }
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(p.tw + t * 0.03));
        ctx.fillStyle = hexA(p.col, (p.scatter ? 0.28 : 0.82) * tw);
        ctx.beginPath(); ctx.arc(x, y, p.sz, 0, 7); ctx.fill();
      }
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
    const AMBER = '#CCA273';
    const fine = !!(global.matchMedia && global.matchMedia('(pointer: fine)').matches);
    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
    function nodeCol() { const r = Math.random(); return r < 0.5 ? '#1F4E86' : (r < 0.85 ? '#5990C0' : '#5990C0'); }
    function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

    // -- Renderer: WebGL (GPU) when available, else the 2D-canvas path (fallback). --
    // Nodes = GL point-sprites with a glow fragment shader; edges = GL lines. The
    // GPU draws them in parallel so the main thread stays free (that's the win).
    const dpr = Math.min(1.5, global.devicePixelRatio || 1);
    let glOK = false;
    try { const _t = global.document.createElement('canvas'); glOK = !!(_t.getContext('webgl') || _t.getContext('experimental-webgl')); } catch (e) { glOK = false; }
    let useGL = glOK && !REDUCED;

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
    let uid = 0;
    const nodes = [];        // {x,y,r,rt,col,parent,fade,front}  (x,y in WORLD space)
    const edges = [];        // {a,b,grow}
    const MAX = 52;

    // The graph lives in a WORLD larger than the card. A draggable camera (ox,oy)
    // pans it like a map, so nodes that grew past the frame can be brought into view.
    let ox = 0, oy = 0;
    const padX = function () { return dim.w * 0.55; }, padY = function () { return dim.h * 0.7; };
    function clampCam() { ox = clamp(ox, -padX(), padX()); oy = clamp(oy, -padY(), padY()); }

    function spawnAt(x, y, parent) {
      const n = { id: uid++, x: clamp(x, -padX(), dim.w + padX()), y: clamp(y, -padY(), dim.h + padY()),
        r: 0.1, rt: 2.4 + Math.random() * 4.4, col: nodeCol(), parent: parent || null, fade: 0, front: 14 };
      nodes.push(n);
      if (parent) edges.push({ a: parent, b: n, grow: 0 });
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
      if (!L.length) { spawnAt(dim.w * 0.5, dim.h * 0.5, null); return; }
      let bx = 0, by = 0; for (const n of L) { bx += n.x; by += n.y; } bx /= L.length; by /= L.length;
      L.sort(function (a, b) { return b.front - a.front || b.id - a.id; });     // spread from the frontier
      const parent = L[(Math.random() * Math.min(6, L.length)) | 0];
      const away = Math.atan2(parent.y - by, parent.x - bx) + (Math.random() - 0.5) * 2.2;
      const dist = 44 + Math.random() * 42;
      spawnAt(parent.x + Math.cos(away) * dist, parent.y + Math.sin(away) * dist, parent);
      parent.front = Math.max(0, parent.front - 7);
    }
    function subtree(n) {
      const set = new Set([n]); let grew = true;
      while (grew) { grew = false; for (const m of nodes) if (!set.has(m) && m.parent && set.has(m.parent)) { set.add(m); grew = true; } }
      return set;
    }
    function falsify(n) { subtree(n).forEach(function (m) { if (!m.fade) { m.fade = 0.0001; m.col = AMBER; } }); }

    const root = spawnAt(dim.w * 0.5, dim.h * 0.52, null); root.rt = 6;
    for (let i = 0; i < 5; i++) grow();

    let hover = null, gt = 0, ft = 0;
    // pointer state: distinguish a tap (add / falsify) from a drag (pan the camera)
    let down = false, panning = false, sx = 0, sy = 0, sox = 0, soy = 0, hitNode = null;
    function localXY(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    function hit(wx, wy) { let best = null, bd = 1e9; for (const n of nodes) { if (n.fade) continue; const r = n.rt + 11, dx = wx - n.x, dy = wy - n.y, d = dx * dx + dy * dy; if (d < r * r && d < bd) { bd = d; best = n; } } return best; }
    function onMove(e) {
      const xy = localXY(e);
      if (down) {
        const dx = xy[0] - sx, dy = xy[1] - sy;
        if (!panning && dx * dx + dy * dy > 36) panning = true;   // >6px -> it's a drag
        if (panning) { ox = sox + dx; oy = soy + dy; clampCam(); cv.style.cursor = 'grabbing'; }
        return;
      }
      hover = hit(xy[0] - ox, xy[1] - oy);
      cv.style.cursor = hover ? 'pointer' : 'grab';
    }
    function onDown(e) {
      const xy = localXY(e);
      down = true; panning = false; sx = xy[0]; sy = xy[1]; sox = ox; soy = oy;
      hitNode = hit(xy[0] - ox, xy[1] - oy);
      cv.style.cursor = hitNode ? 'pointer' : 'grabbing';
      e.preventDefault();
    }
    function onUp(e) {
      if (!down) return;
      down = false;
      if (!panning) {                                     // a tap, not a drag
        if (hitNode) falsify(hitNode);                    // tap a chain -> amber -> pruned
        else { const xy = localXY(e), wx = xy[0] - ox, wy = xy[1] - oy; spawnAt(wx, wy, nearest(wx, wy)); }
      }
      panning = false; hitNode = null; cv.style.cursor = 'grab';
    }
    function onLeave() { if (!down) { hover = null; cv.style.cursor = 'grab'; } }
    if (fine) {
      cv.style.cursor = 'grab';
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerdown', onDown);
      global.addEventListener('pointermove', onMove);
      global.addEventListener('pointerup', onUp);
      cv.addEventListener('pointerleave', onLeave);
    }

    // advance the simulation one tick (shared by both renderers)
    function step() {
      if (++gt > 32) { gt = 0; if (live().length < MAX) grow(); else { var L0 = live(); if (L0.length) falsify(L0[(Math.random() * L0.length) | 0]); } }
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
        if (e.grow < 1) e.grow += 0.055;
      }
    }

    function paint2D() {
      ctx.clearRect(0, 0, dim.w, dim.h);
      for (const e of edges) {
        const a = e.a, b = e.b, g = e.grow < 1 ? e.grow : 1;
        const ax = a.x + ox, ay = a.y + oy, ex = ax + (b.x - a.x) * g, ey = ay + (b.y - a.y) * g;
        const fade = a.fade > b.fade ? a.fade : b.fade, amber = a.col === AMBER || b.col === AMBER;
        const al = (amber ? 0.5 : 0.2) * (1 - fade);
        ctx.strokeStyle = amber ? 'rgba(204,162,115,' + al.toFixed(3) + ')' : 'rgba(92,102,128,' + al.toFixed(3) + ')';
        ctx.lineWidth = amber ? 1.2 : 0.8;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
      }
      for (const n of nodes) {
        const vis = 1 - n.fade, hot = n === hover, X = n.x + ox, Y = n.y + oy;
        const gs = (n.r + 2) * 3.0, peak = (n.front > 4 ? 0.44 : 0.26) * vis;
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

    const draw = function () { step(); if (useGL) paintGL(); else paint2D(); };
    var _g = gated(cv, draw);

    global.addEventListener('resize', onResize);
    return {
      destroy: function () {
        _g.stop();
        global.removeEventListener('resize', onResize);
        cv.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerdown', onDown);
        global.removeEventListener('pointerup', onUp);
        cv.removeEventListener('pointerleave', onLeave);
      }
    };
  }

  global.TelotiaParticles = { hero: hero, glossary: glossary, consult: consult, verdictSphere: verdictSphere, fit: fit, hexA: hexA };
})(typeof window !== 'undefined' ? window : this);
