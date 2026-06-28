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
 * Palette (blue / rose-gold):
 *   #3a7cc4 blue   #64b1ef bright blue   #3676b8 mid blue
 *   #5e6d87 slate  #a8bcd8 silver        #e8a98f rose gold
 * ==========================================================================*/
(function (global) {
  'use strict';

  // --- shared helpers -------------------------------------------------------

  // Size a canvas to its parent box (DPR-aware) and return a 2D context whose
  // units are CSS pixels. Call again on resize.
  function fit(cv) {
    const p = cv.parentElement, r = p.getBoundingClientRect();
    const dpr = Math.min(2, global.devicePixelRatio || 1);
    cv.width = Math.max(1, r.width * dpr);
    cv.height = Math.max(1, r.height * dpr);
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  // "#3a7cc4", 0.5  ->  "rgba(58,124,196,0.500)"
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }

  // ==========================================================================
  // 1. HERO — constellation: drifting nodes joined by fading proximity lines
  // ==========================================================================
  function hero(cv) {
    if (!cv) return { destroy: function () {} };
    let dim = fit(cv), ctx = dim.ctx, raf = 0;
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; };

    const N = Math.max(40, Math.round(dim.w / 16));
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
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    global.addEventListener('resize', onResize);
    return { destroy: function () { cancelAnimationFrame(raf); global.removeEventListener('resize', onResize); } };
  }

  // ==========================================================================
  // 2. GLOSSARY — point cloud that morphs between four silhouettes
  // ==========================================================================
  function glossary(cv) {
    if (!cv) return { destroy: function () {} };
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
    const cols = ['#64b1ef', '#3a7cc4', '#3676b8'];
    const parts = [];
    for (let i = 0; i < N; i++) parts.push({
      x: Math.random() * 2 - 1, y: Math.random() * 2 - 1,
      c: Math.random() < 0.22 ? '#e8a98f' : cols[i % 3], tw: Math.random() * TAU
    });

    let cur = 0, frame = 0;
    const draw = function () {
      const w = dim.w, h = dim.h, cx = w / 2, cy = h / 2, S = Math.min(w * 0.56, h * 0.42);
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
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    global.addEventListener('resize', onResize);
    return { destroy: function () { cancelAnimationFrame(raf); global.removeEventListener('resize', onResize); } };
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
        { x: w * 0.24, y: h * 0.48, r: m * 0.40, n: 240 },
        { x: w * 0.10, y: h * 0.78, r: m * 0.16, n: 100 },
        { x: w * 0.40, y: h * 0.20, r: m * 0.14, n: 90 },
        { x: w * 0.06, y: h * 0.30, r: m * 0.12, n: 70 },
        { x: w * 0.80, y: h * 0.44, r: m * 0.24, n: 120 },
        { x: w * 0.92, y: h * 0.82, r: m * 0.12, n: 60 }
      ];
      clusters.forEach(function (c) {
        for (let i = 0; i < c.n; i++) {
          const a = Math.random() * Math.PI * 2;
          const band = c.r * (0.44 + 0.56 * Math.pow(Math.random(), 0.55));
          const col = Math.random() < 0.24 ? '#e8a98f' : (Math.random() < 0.5 ? '#64b1ef' : '#3676b8');
          parts.push({ cx: c.x, cy: c.y, a: a, base: band, tw: Math.random() * 6.28, sp: 0.00018 + Math.random() * 0.0006, col: col, sz: 0.6 + Math.random() * 1.9 });
        }
      });
      for (let i = 0; i < 130; i++) parts.push({ scatter: true, sx: Math.random() * w, sy: Math.random() * h, tw: Math.random() * 6.28, col: '#3676b8', sz: 0.5 + Math.random() * 1.0 });
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
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    global.addEventListener('resize', onResize);
    return { destroy: function () { cancelAnimationFrame(raf); global.removeEventListener('resize', onResize); } };
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
    let dim = fit(cv), ctx = dim.ctx, raf = 0;
    const onResize = function () { dim = fit(cv); ctx = dim.ctx; };

    const M = 120, pts = [];
    for (let i = 0; i < M; i++) {
      const y = 1 - (i / (M - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y * y)), phi = i * 2.399963;
      const c = i % 5 === 0 ? '#e8a98f' : (i % 2 === 0 ? '#3a7cc4' : '#5e6d87');
      pts.push({ x: Math.cos(phi) * rr, y: y, z: Math.sin(phi) * rr, c: c });
    }

    let ay = 0, vel = 0.0015, dragging = false, lastX = 0, lastV = 0;
    let tilt = 0, tvel = 0, lastY = 0, lastVT = 0;
    const baseVel = 0.0015;

    const rot = function (p) {
      const ax = 0.34 + Math.sin(ay * 0.5) * 0.05 + tilt;
      const x1 = p[0] * Math.cos(ay) - p[2] * Math.sin(ay), z1 = p[0] * Math.sin(ay) + p[2] * Math.cos(ay);
      const y1 = p[1] * Math.cos(ax) - z1 * Math.sin(ax), z2 = p[1] * Math.sin(ax) + z1 * Math.cos(ax);
      return [x1, y1, z2];
    };

    const draw = function () {
      const w = dim.w, h = dim.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.40;
      ctx.clearRect(0, 0, w, h);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
      core.addColorStop(0, 'rgba(58,124,196,0.16)'); core.addColorStop(1, 'rgba(58,124,196,0)');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, R * 1.1, 0, 7); ctx.fill();
      const proj = pts.map(function (p) {
        const r = rot([p.x, p.y, p.z]);
        return { sx: cx + r[0] * R, sy: cy + r[1] * R, ix: cx + r[0] * R * 0.5, iy: cy + r[1] * R * 0.5, d: r[2], c: p.c };
      }).sort(function (a, b) { return a.d - b.d; });
      for (const q of proj) {
        const f = (q.d + 1) / 2, al = 0.22 + f * 0.78;
        ctx.strokeStyle = hexA(q.c, al * 0.7); ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(q.ix, q.iy); ctx.lineTo(q.sx, q.sy); ctx.stroke();
        ctx.fillStyle = hexA(q.c, al); ctx.beginPath(); ctx.arc(q.sx, q.sy, 1.8 + f * 3.4, 0, 7); ctx.fill();
      }
      if (!dragging) {
        ay += vel; vel += (baseVel - vel) * 0.02;
        tilt += tvel; tvel *= 0.92; tilt += (0 - tilt) * 0.012;
      }
      tilt = Math.max(-1.05, Math.min(1.05, tilt));
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // drag-to-spin with inertia
    const wrap = opts.dragTarget || cv.parentElement;
    const onDown = function (e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY; lastV = 0; lastVT = 0;
      if (wrap.style) wrap.style.cursor = 'grabbing';
      if (e.pointerId != null && wrap.setPointerCapture) { try { wrap.setPointerCapture(e.pointerId); } catch (_) {} }
      e.preventDefault();
    };
    const onMove = function (e) {
      if (!dragging) return;
      const dx = e.clientX - lastX; lastX = e.clientX;
      const dy = e.clientY - lastY; lastY = e.clientY;
      const dAy = dx * -0.006; ay += dAy; lastV = dAy;
      const dT = dy * -0.005; tilt += dT; lastVT = dT;
    };
    const onUp = function () {
      if (!dragging) return;
      dragging = false; if (wrap.style) wrap.style.cursor = 'grab';
      vel = Math.max(-0.07, Math.min(0.07, lastV));
      tvel = Math.max(-0.06, Math.min(0.06, lastVT));
    };
    if (wrap) {
      if (wrap.style) { wrap.style.cursor = 'grab'; wrap.style.touchAction = 'pan-y'; }
      wrap.addEventListener('pointerdown', onDown);
      global.addEventListener('pointermove', onMove);
      global.addEventListener('pointerup', onUp);
    }

    global.addEventListener('resize', onResize);
    return {
      destroy: function () {
        cancelAnimationFrame(raf);
        global.removeEventListener('resize', onResize);
        global.removeEventListener('pointermove', onMove);
        global.removeEventListener('pointerup', onUp);
        if (wrap) wrap.removeEventListener('pointerdown', onDown);
      }
    };
  }

  global.TelotiaParticles = { hero: hero, glossary: glossary, consult: consult, verdictSphere: verdictSphere, fit: fit, hexA: hexA };
})(typeof window !== 'undefined' ? window : this);
