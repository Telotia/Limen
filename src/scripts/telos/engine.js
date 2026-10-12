// Telotia homepage story. Phase one is a single link; the end is a whole system, and then Telotia.
//   one world (places, a pool, people) where work is reallocated                  -> phase one
//   the camera pulls back: that world is one unit among many, all unconnected     -> the system as it is
//   Telotia's point runs on and threads one line through every unit; each settles -> handshake, standard, optimisation
//   everything gathers into the line, the line into the point, the point into the 'i' of Telotia
// Deterministic: draw(ctx, t) depends only on t. Design frame 1440 x 810. Browser only (Path2D).
import { WORDMARK } from './wordmark.js';

export function createEngine() {
  const W = 1440, H = 810;
  const LINE_Y = 640, RAIL = LINE_Y - 7, S = 16, TILE = 10, SPEED = 520;
  const LX = 120, LTOP = 150, LR = 32;                         // Telotia's line: a drop at x 120, one turn, then the run
  const L_DROP = LINE_Y - LR - LTOP, L_ARC = Math.PI * LR / 2;
  const runLen = x => L_DROP + L_ARC + (x - LX - LR);

  // ---------- utilities
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, u) => a + (b - a) * u;
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const ease = u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const quad = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const decel = u => 1 - Math.pow(1 - u, 3);
  const expoOut = u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u));
  const sm = u => u * u * (3 - 2 * u);

  // ---------- palette: Telotia neutrals as a tonal ramp
  const INK = '#282D32', TEAL = '#00545A';
  const STOPS = [[0, [222, 230, 228]], [0.3, [181, 193, 190]], [0.55, [138, 151, 148]], [0.75, [97, 112, 117]], [1, [40, 45, 50]]];
  const RAMP = [];
  for (let i = 0; i <= 255; i++) {
    const v = i / 255;
    let k = 0;
    while (k < STOPS.length - 2 && v > STOPS[k + 1][0]) k++;
    const [a, ca] = STOPS[k], [b, cb] = STOPS[k + 1], u = (v - a) / (b - a);
    RAMP.push(`rgb(${ca.map((x, j) => Math.round(lerp(x, cb[j], u))).join(',')})`);
  }
  const shade = v => RAMP[Math.round(clamp(v) * 255)];

  // ---------- one world, in world units (every unit is laid out like the first)
  const VESSELS = 5, SROWS = 18, SRC_X0 = 176;
  const colsOf = v => [v * 3, v * 3 + 1];
  const scx = c => SRC_X0 + (c + 0.5) * S;
  const srow = r => LINE_Y - 14 - r * S;
  const LEVEL_Y = srow(9) + S / 2;                              // a comfortable level
  const homeX = (v, k) => scx(colsOf(v)[0]) - 4 + (k % 4) * 8;
  const homeY = k => srow(0) - 3 - Math.floor(k / 4) * 8;
  const PCOLS = 12, POOL_X0 = 720 - PCOLS * S / 2;
  const pcx = c => POOL_X0 + (c + 0.5) * S;
  const REG = { x0: 940, x1: 1296, y0: 190, y1: 512 };

  // ---------- story times
  const T = {
    reach: [[0, 1.8, 470], [3.8, 5.0, 860], [5.6, 6.8, 1310]],  // the run's end (world x) after each reach
    zoom: [14.6, 17.0], travel: [17.0, 22.2],
    recede: 24.8, gather: [25.9, 27.5], fly: [27.5, 28.5], mark: [28.45, 28.85],
  };
  const TT = 33;

  // The system: six units in two rows; the second row is mirrored so the line can come back through it.
  const UNIT = 1300, ROW = 700, RU = 120;                       // unit pitch, row pitch, radius of the turns
  const XR = 1310 + 2 * UNIT;                                   // where the first row's run ends
  const LAYOUT = [{ ci: 0, row: 0 }, { ci: 1, row: 0 }, { ci: 2, row: 0 }, { ci: 2, row: 1 }, { ci: 1, row: 1 }, { ci: 0, row: 1 }];
  const UNITS = LAYOUT.length;
  const S_FIN = 0.305, Y0_FIN = 332;

  // Telotia's line as one path: drop, turn, first run, down and back, second run.
  const SEG = (() => {
    const a = L_DROP, b = a + L_ARC, c = b + (XR - LX - LR), d = c + Math.PI * RU / 2, e = d + (ROW - 2 * RU), f = e + Math.PI * RU / 2, g = f + (XR - LX - LR);
    return { a, b, c, d, e, f, g };
  })();
  const L_TOTAL = SEG.g;
  const PHASE1 = {
    build: -2.2, drops: [0.8, 3.0], leave: 4.2, step: 0.16, poolWalls: [4.4, 5.2], poolOut: [11.6, 12.6],
    people: [5.6, 6.6], sched0: 5.6, send: 7.0, drain: 0.42, quiet: [6.0, 6.8, 10.4, 11.2],
  };
  const UNIT_TL = { ...PHASE1, people: null, sched0: -12, quiet: null };

  function makeWorld(cfg) {
    const R = rng(cfg.seed);
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const TL = cfg.TL, LV = cfg.LV;
    const w = { cfg, TL, TV: cfg.TV, pieces: [], nodes: [], traces: [], colQueue: Array.from({ length: VESSELS * 3 }, () => []), poolRowsDone: [], stats: { fallbacks: 0, lastHome: 0 } };
    const { pieces, nodes, traces, colQueue } = w;
    const shapeOf = p => { p.sw = TILE * (0.76 + 0.44 * R()); p.sh = TILE * (0.76 + 0.44 * R()); p.rot = (R() - 0.5) * 0.34; p.j = (R() - 0.5) * 0.05; };

    for (let v = 0; v < VESSELS; v++) for (const c of colsOf(v)) {
      const h = clamp(Math.round(LV[v] * SROWS + (R() - 0.5) * 2.2), 2, SROWS - 3);
      for (let r = 0; r < h; r++) { const p = { v, c, r0: r, born: TL.build + 0.02 * c + 0.06 * r }; shapeOf(p); pieces.push(p); colQueue[c].push(p); }
    }
    cfg.DROPS.forEach((n, v) => {
      for (let i = 0; i < n; i++) {
        const tl = lerp(TL.drops[0], TL.drops[1], (i + 0.5) / n) + (R() - 0.5) * 0.3;
        const c = colsOf(v)[Math.floor(R() * 2)], r = colQueue[c].length;
        const p = { v, c, r0: r, born: tl, drop: { ts: tl - (0.45 + 0.3 * r / SROWS), tl } };
        shapeOf(p); pieces.push(p); colQueue[c].push(p);
      }
    });

    // Leaving: each column releases its bottom piece onto the line; the pool fills level.
    const colOff = Array.from({ length: VESSELS * 3 }, () => R() * 0.3);
    colQueue.forEach((q, c) => q.forEach((p, k) => { p.dep = TL.leave + colOff[c] + k * TL.step; }));
    const est = p => p.dep + 0.15 + Math.abs(720 - scx(p.c)) / SPEED + 0.25;
    const perms = [];
    pieces.slice().sort((a, b) => est(a) - est(b)).forEach((p, k) => {
      const pr = Math.floor(k / PCOLS);
      if (!perms[pr]) perms[pr] = shuffle([...Array(PCOLS).keys()]);
      p.pr = pr; p.pc = perms[pr][k % PCOLS];
      p.glide1 = Math.abs(pcx(p.pc) - scx(p.c)) / SPEED;
      p.parr = p.dep + 0.15 + p.glide1 + 0.25 + 0.02 * p.pr;
    });
    const poolRows = Math.ceil(pieces.length / PCOLS);

    // People: irregular, evenly spaced, each on their own hours. They never move.
    let tries = 0;
    while (nodes.length < cfg.people && tries < 40000) {
      tries++;
      const x = lerp(REG.x0, REG.x1, R()), y = lerp(REG.y0, REG.y1, R());
      if (nodes.every(n => Math.hypot(n.x - x, n.y - y) > cfg.minDist)) {
        const sched = [];
        let tt = TL.sched0 - R() * 2, on = R() < 0.6;
        while (tt < 90) { const d = on ? 3.0 + R() * 4.0 : 0.8 + R() * 1.6; sched.push([tt, tt + d, on]); tt += d; on = !on; }
        nodes.push({ x, y, sched, busy: [], h: R() });
      }
    }
    const online = (n, t) => n.sched.some(([s0, s1, on]) => on && t >= s0 && t < s1);

    // The pool drains row by row.
    w.poolRowsDone = Array(poolRows).fill(0);
    const byRow = Array.from({ length: poolRows }, () => []);
    pieces.forEach(p => byRow[p.pr].push(p));
    byRow.forEach((row, pr) => {
      row.sort((a, b) => a.pc - b.pc);
      row.forEach((p, i) => { p.pdep = TL.send + pr * TL.drain + i * 0.03 + R() * 0.02; p.start = p.pdep + 0.12; p.x0 = pcx(p.pc); });
      w.poolRowsDone[pr] = Math.max(...row.map(p => p.pdep));
    });

    // Each piece goes to someone online and free; whoever takes a piece stays until it is ready.
    for (const p of pieces.slice().sort((a, b) => a.start - b.start)) {
      const plan = (n, hold) => {
        const glide = Math.abs(n.x - p.x0) / SPEED, rise = 0.25 + (RAIL - n.y) / 1300;
        return { n, glide, rise, arr: p.start + glide + rise, hold };
      };
      const fits = c => online(c.n, c.arr - c.rise) && c.n.busy.every(([a, b]) => c.arr + c.hold + 0.12 < a || c.arr - c.rise > b + 0.12);
      const cands = shuffle(nodes.slice());
      let chosen = null;
      for (const n of cands) { const c = plan(n, 0.4 + R() * 0.4); if (fits(c)) { chosen = c; break; } }
      if (!chosen) for (const n of cands) { const c = plan(n, 0.35); if (fits(c)) { chosen = c; break; } }
      if (!chosen) { w.stats.fallbacks++; chosen = plan(cands[0], 0.35); }
      const { n, glide, rise, arr, hold } = chosen;
      n.busy.push([arr - rise, arr + hold]);
      Object.assign(p, { node: n, glide2: glide, rise, narr: arr, ndep: arr + hold, down: 0.2 + (RAIL - n.y) / 1500 });
      traces.push({ x: n.x, t: arr - rise * 0.5 });
    }

    // Home again, lighter: small outlines, packed low, under the level.
    for (let v = 0; v < VESSELS; v++) {
      const list = pieces.filter(p => p.v === v);
      list.forEach(p => { p.harr0 = p.ndep + p.down + Math.abs(homeX(v, 0) + 12 - p.node.x) / (SPEED * 1.45); });
      list.sort((a, b) => a.harr0 - b.harr0).forEach((p, k) => {
        p.hx = homeX(v, k); p.hy = homeY(k);
        p.glide3 = Math.abs(p.hx - p.node.x) / (SPEED * 1.45);          // ready work travels home quickly
        p.hland = p.ndep + p.down + p.glide3;
        p.harr = p.hland + 0.25 + 0.01 * Math.floor(k / 4);
        traces.push({ x: p.hx, t: p.hland });
        w.stats.lastHome = Math.max(w.stats.lastHome, p.harr);
      });
    }
    for (const tr of traces) tr.bin = Math.round((tr.x - LX) / 6);
    w.stats.pieces = pieces.length; w.stats.nodes = nodes.length;
    return w;
  }

  // ---------- drawing a world (inside a transform where 1 unit = s screen px)
  function shiftIn(list, t, idx) {
    let s = 0;
    for (let k = 0; k < idx; k++) s += ease(span(t, list[k].dep, list[k].dep + 0.18));
    return s;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

  function drawWorld(ctx, w, t, o) {                             // t: the world's own clock; o: { s, a, quiet }
    const A = o.a;
    if (A <= 0.004) return;
    const { TL, TV, pieces, nodes, traces, colQueue, poolRowsDone } = w;
    const px = 1 / o.s, tiny = o.s < 0.42;
    const poolShift = (tt, pr) => { let s = 0; for (let k = 0; k < pr; k++) s += ease(span(tt, poolRowsDone[k], poolRowsDone[k] + 0.3)); return s; };

    // Places, and the level across them.
    ctx.lineWidth = px; ctx.strokeStyle = '#DEE6E4';
    ctx.globalAlpha = A * 0.9 * o.quiet * (tiny ? 0.7 : 1);
    for (let v = 0; v < VESSELS; v++) {
      const [c0, c1] = colsOf(v);
      const x = scx(c0) - S / 2 - 3, wd = scx(c1) - scx(c0) + S + 6, top = srow(SROWS - 1) - S / 2 - 3;
      rr(ctx, x + px / 2, top + px / 2, wd - px, LINE_Y - 4 - top, tiny ? 2 * px : 5); ctx.stroke();
    }
    ctx.globalAlpha = A * 0.9; ctx.strokeStyle = '#B5C0BD'; ctx.setLineDash([2 * px, 4 * px]);
    ctx.beginPath(); ctx.moveTo(scx(0) - 13, LEVEL_Y); ctx.lineTo(scx(13) + 13, LEVEL_Y); ctx.stroke();
    ctx.setLineDash([]);

    // Pool walls.
    const pw = sm(span(t, ...TL.poolWalls)) * (1 - sm(span(t, ...TL.poolOut)));
    if (pw > 0) {
      ctx.globalAlpha = A * pw; ctx.strokeStyle = '#B5C0BD'; ctx.lineWidth = px;
      const xl = POOL_X0 - 7, xr = POOL_X0 + PCOLS * S + 7, top = srow(11);
      ctx.beginPath(); ctx.moveTo(xl, top); ctx.lineTo(xl, LINE_Y - 6); ctx.arcTo(xl, LINE_Y, xl + 6, LINE_Y, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xr, top); ctx.lineTo(xr, LINE_Y - 6); ctx.arcTo(xr, LINE_Y, xr - 6, LINE_Y, 6); ctx.stroke();
    }

    // People: available or away, on their own hours; they never move.
    const dotR = Math.max(3.6, 1.15 * px);
    for (const n of nodes) {
      const a = A * (TL.people ? sm(span(t, TL.people[0] + n.h * 0.8, TL.people[0] + 0.5 + n.h * 0.8)) : 1);
      if (a <= 0.01) continue;
      let on = 0;
      for (const [s0, s1, isOn] of n.sched) if (isOn && t > s0 - 0.3 && t < s1 + 0.3) on = Math.max(on, sm(span(t, s0, s0 + 0.3)) * (1 - sm(span(t, s1, s1 + 0.3))));
      for (const [b0, b1] of n.busy) on = Math.max(on, sm(span(t, b0 - 0.3, b0)) * (1 - sm(span(t, b1 + 0.4, b1 + 0.7))));
      if (on > 0.02) { ctx.globalAlpha = a; ctx.fillStyle = shade(lerp(0.25, 0.55, on)); ctx.beginPath(); ctx.arc(n.x, n.y, dotR, 0, Math.PI * 2); ctx.fill(); }
      if (on < 0.98) { ctx.globalAlpha = a * (1 - on); ctx.strokeStyle = '#C3CCC9'; ctx.lineWidth = px; ctx.beginPath(); ctx.arc(n.x, n.y, dotR, 0, Math.PI * 2); ctx.stroke(); }
    }

    // The record: a fine mark under the line for every meeting and every return.
    const bins = new Map();
    for (const tr of traces) { const g = span(t, tr.t, tr.t + 0.35); if (g > 0) bins.set(tr.bin, (bins.get(tr.bin) || 0) + g); }
    ctx.globalAlpha = A * 0.75; ctx.fillStyle = '#9AA6A3';
    const hk = Math.max(1, 0.4 * px);                               // marks keep a readable height from afar
    for (const [b, count] of bins) {
      const x = LX + b * 6;
      if (x < LX + LR + 4 || x > 1302) continue;
      ctx.fillRect(x - 0.6 * px, LINE_Y + 7 * Math.max(1, hk), 1.2 * px, (1 + 4 * Math.sqrt(count)) * hk);
    }

    // Work.
    const minW = 1.8 * px;
    for (const p of pieces) {
      if (t < p.born && !(p.drop && t >= p.drop.ts)) continue;
      const tone = TV[p.v] + p.j;
      let x, y, a = 1, hol = 0, std = 1, small = 0;
      if (p.drop && t < p.drop.tl) {                                    // arriving, in its own shape
        const u = span(t, p.drop.ts, p.drop.tl);
        x = scx(p.c); y = lerp(160, srow(p.r0), u * u); a = sm(span(u, 0, 0.25)); std = 0;
      } else if (t < p.dep) {                                           // waiting in its place
        const q = colQueue[p.c];
        x = scx(p.c); y = srow(p.r0 - shiftIn(q, t, q.indexOf(p))); std = 0;
        if (!p.drop) a = decel(span(t, p.born, p.born + 0.3));
      } else if (t < p.parr) {                                          // onto the line: one common shape
        const t1 = p.dep + 0.15, t2 = t1 + p.glide1;
        std = ease(span(t, p.dep, p.dep + 0.3));
        if (t < t1) { const q = colQueue[p.c]; x = scx(p.c); y = lerp(srow(p.r0 - shiftIn(q, p.dep, q.indexOf(p))), RAIL, ease(span(t, p.dep, t1))); }
        else if (t < t2) { x = lerp(scx(p.c), pcx(p.pc), ease(span(t, t1, t2))); y = RAIL; }
        else { x = pcx(p.pc); y = lerp(RAIL, srow(p.pr), decel(span(t, t2, p.parr))); }
      } else if (t < p.pdep) {                                          // in the pool, level
        x = pcx(p.pc); y = srow(p.pr - poolShift(t, p.pr));
      } else if (t < p.narr) {                                          // along the line, then the handshake
        const n = p.node, t1 = p.start, t2 = t1 + p.glide2;
        if (t < t1) { x = p.x0; y = lerp(srow(p.pr - poolShift(p.pdep, p.pr)), RAIL, ease(span(t, p.pdep, t1))); }
        else if (t < t2) { x = lerp(p.x0, n.x, ease(span(t, t1, t2))); y = RAIL; }
        else {
          const u = span(t, t2, p.narr);
          x = n.x; y = lerp(RAIL, n.y, ease(u));
          const reach = decel(clamp(u * 1.6)), len = Math.min(34, (RAIL - n.y) / 2);
          ctx.globalAlpha = A * 0.45 * (1 - sm(span(u, 0.7, 1)));
          ctx.strokeStyle = INK; ctx.lineWidth = px;
          ctx.beginPath(); ctx.moveTo(n.x, n.y + 5); ctx.lineTo(n.x, n.y + 5 + len * reach); ctx.stroke();
        }
      } else if (t < p.ndep) {                                          // held: being prepared
        x = p.node.x; y = p.node.y; hol = sm(span(t, p.narr + 0.08, Math.min(p.ndep - 0.04, p.narr + 0.45)));
      } else if (t < p.harr) {                                          // home, lighter
        const n = p.node, t1 = p.ndep + p.down;
        hol = 1; small = sm(span(t, p.ndep, p.ndep + 0.4));
        if (t < t1) { x = n.x; y = lerp(n.y, RAIL, ease(span(t, p.ndep, t1))); }
        else if (t < p.hland) { x = lerp(n.x, p.hx, ease(span(t, t1, p.hland))); y = RAIL; }
        else { x = p.hx; y = lerp(RAIL, p.hy, decel(span(t, p.hland, p.harr))); }
      } else {                                                          // back, ready, light
        x = p.hx; y = p.hy; hol = 1; small = 1;
      }
      const pa = A * a;
      if (pa <= 0.01) continue;
      let wd = lerp(lerp(p.sw, TILE, std), 6, small), ht = lerp(lerp(p.sh, TILE, std), 6, small);
      if (tiny) {                                                       // far away: plain marks, never smaller than ~2 px
        wd = Math.max(wd, minW); ht = Math.max(ht, minW);
        if (hol < 0.99) { ctx.globalAlpha = pa * (1 - hol); ctx.fillStyle = shade(tone); ctx.fillRect(x - wd / 2, y - ht / 2, wd, ht); }
        if (hol > 0.01) { ctx.globalAlpha = pa * hol; ctx.strokeStyle = shade(tone + 0.14); ctx.lineWidth = 0.9 * px; ctx.strokeRect(x - wd / 2, y - ht / 2, wd, ht); }
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      const rot = p.rot * (1 - std);
      if (rot) ctx.rotate(rot);
      if (hol < 0.99) { ctx.globalAlpha = pa * (1 - hol); ctx.fillStyle = shade(tone); rr(ctx, -wd / 2, -ht / 2, wd, ht, 1.6); ctx.fill(); }
      if (hol > 0.01) {
        ctx.globalAlpha = pa * hol; ctx.strokeStyle = shade(tone + 0.14); ctx.lineWidth = 1.2;
        rr(ctx, -wd / 2 + 0.6, -ht / 2 + 0.6, wd - 1.2, ht - 1.2, Math.min(1.6, wd / 5)); ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ---------- the worlds: the first one, then the units it turns out to belong to
  const worlds = [makeWorld({
    seed: 20261012, TL: PHASE1, people: 64, minDist: 35,
    LV: [0.82, 0.32, 0.64, 0.2, 0.72], TV: [0.66, 0.44, 0.58, 0.34, 0.62], DROPS: [4, 1, 3, 1, 3],
  })];
  const UNIT_LV = [[0.55, 0.9, 0.3, 0.7, 0.45], [0.9, 0.45, 0.75, 0.3, 0.6], [0.35, 0.7, 0.88, 0.55, 0.3], [0.75, 0.3, 0.6, 0.85, 0.5], [0.6, 0.8, 0.4, 0.3, 0.85]];
  const UNIT_TV = [[0.5, 0.64, 0.38, 0.58, 0.46], [0.62, 0.42, 0.56, 0.36, 0.5], [0.4, 0.56, 0.66, 0.5, 0.38], [0.58, 0.38, 0.52, 0.64, 0.46], [0.48, 0.6, 0.4, 0.36, 0.62]];
  for (let u = 1; u < UNITS; u++) {
    worlds.push(makeWorld({ seed: 7919 * u + 31, TL: UNIT_TL, people: 50 + 3 * u, minDist: 36, LV: UNIT_LV[u - 1], TV: UNIT_TV[u - 1], DROPS: [2, 1, 2, 1, 2] }));
  }

  // The line's travel through the units, with soft ends.
  const travelP = u => u - Math.sin(2 * Math.PI * u) / (2 * Math.PI);
  const bTravel = t => lerp(runLen(1310), L_TOTAL, travelP(span(t, ...T.travel)));
  // A unit wakes once the line has run past its places (in the direction of travel).
  const triggerL = ({ ci, row }) => {
    if (row === 0) return SEG.b + (UNIT * ci + 410 - LX - LR);
    return SEG.f + (XR - (UNIT * ci + 1430 - 410));
  };
  const tc = LAYOUT.map((L, u) => {
    if (u === 0) return 0;
    const target = triggerL(L);
    let lo = T.travel[0], hi = T.travel[1];
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (bTravel(mid) < target) lo = mid; else hi = mid; }
    return hi;
  });
  const unitClock = (u, t) => (t < tc[u] ? 3.6 - 0.25 * (tc[u] - t) : 3.6 + 4 * (t - tc[u]));

  // ---------- camera and line
  function camera(t) {
    const u = ease(span(t, ...T.zoom));
    const s = Math.exp(Math.log(S_FIN) * u);
    const Y0 = LTOP + (Y0_FIN - LTOP) * (1 - s) / (1 - S_FIN);
    return { s, Y0 };
  }
  const toScreen = (c, x, y) => [LX + (x - LX) * c.s, c.Y0 + (y - LTOP) * c.s];
  function lineB(t) {                                               // drawn length of the line from its start
    let b = 0, prev = 0;
    for (const [a0, a1, x] of T.reach) {
      const L = runLen(x);
      if (t >= a1) { b = L; prev = L; continue; }
      if (t > a0) b = lerp(prev, L, quad(span(t, a0, a1)));
      return b;
    }
    return bTravel(t);
  }
  function pointAt(L) {
    const { a, b, c, d, e, f } = SEG;
    if (L <= a) return [LX, LTOP + L];
    if (L <= b) { const th = (L - a) / LR; return [LX + LR - LR * Math.cos(th), LINE_Y - LR + LR * Math.sin(th)]; }
    if (L <= c) return [LX + LR + (L - b), LINE_Y];
    if (L <= d) { const th = (L - c) / RU; return [XR + RU * Math.sin(th), LINE_Y + RU - RU * Math.cos(th)]; }
    if (L <= e) return [XR + RU, LINE_Y + RU + (L - d)];
    if (L <= f) { const th = (L - e) / RU; return [XR + RU * Math.cos(th), LINE_Y + ROW - RU + RU * Math.sin(th)]; }
    return [XR - (L - f), LINE_Y + ROW];
  }
  function tracePath(ctx) {
    ctx.beginPath(); ctx.moveTo(LX, LTOP); ctx.lineTo(LX, LINE_Y - LR);
    ctx.arc(LX + LR, LINE_Y - LR, LR, Math.PI, Math.PI / 2, true);
    ctx.lineTo(XR, LINE_Y);
    ctx.arc(XR, LINE_Y + RU, RU, -Math.PI / 2, 0);
    ctx.lineTo(XR + RU, LINE_Y + ROW - RU);
    ctx.arc(XR, LINE_Y + ROW - RU, RU, 0, Math.PI / 2);
    ctx.lineTo(LX + LR, LINE_Y + ROW);
  }

  // ---------- Telotia
  const WMK = WORDMARK, WM_PATH = new Path2D(WMK.d);
  const WMS = 0.86, WML = 720 - WMK.w * WMS / 2, WMT = 262;
  const DOT = [WML + WMK.dot[0] * WMS, WMT + WMK.dot[1] * WMS, WMK.dot[2] * WMS];

  // ---------- one moment
  function draw(ctx, t) {
    const cam = camera(t);

    // Worlds: the first one at its own pace, the others on their own clocks once the line has reached them.
    for (let u = 0; u < UNITS; u++) {
      const { ci, row } = LAYOUT[u], ox = UNIT * ci, oy = ROW * row, mirror = row === 1;
      const sx = LX + (ox - LX) * cam.s, sy = cam.Y0 + (oy - LTOP) * cam.s;
      if (sx > W + 10 || sy + LTOP * cam.s > H + 10) continue;
      let a = 1 - sm(span(t, T.recede + 0.18 * u, T.recede + 0.18 * u + 0.7));
      let quiet = 1, wt = t;
      if (u === 0) {
        const q = PHASE1.quiet;
        quiet = 1 - 0.5 * sm(span(t, q[0], q[1])) * (1 - sm(span(t, q[2], q[3])));
      } else {
        a *= sm(span(t, T.zoom[0] + 0.4 + 0.25 * u, T.zoom[0] + 1.4 + 0.25 * u));
        a *= lerp(0.5, 1, sm(span(t, tc[u], tc[u] + 0.8)));       // unconnected units stay faint
        wt = unitClock(u, t);
      }
      if (a <= 0.004) continue;
      ctx.save();
      if (mirror) ctx.transform(-cam.s, 0, 0, cam.s, LX + (ox + 1430 - LX) * cam.s, sy);
      else ctx.transform(cam.s, 0, 0, cam.s, sx, sy);
      drawWorld(ctx, worlds[u], wt, { s: cam.s, a, quiet });
      ctx.restore();
    }

    // Telotia's line: drawn by its point; at the end it gathers into the point.
    const b = lineB(t);
    const a0 = lerp(0, L_TOTAL, quad(span(t, ...T.gather)));
    if (b - a0 > 0.5) {
      ctx.save();
      ctx.transform(cam.s, 0, 0, cam.s, LX - LX * cam.s, cam.Y0 - LTOP * cam.s);
      ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 1.5 / cam.s; ctx.lineCap = 'round';
      ctx.setLineDash([b - a0, 1e7]); ctx.lineDashOffset = -a0;
      tracePath(ctx); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // The point: it leads the line, then becomes the dot of Telotia's i.
    let [px, py] = toScreen(cam, ...pointAt(b)), r = 5;
    const fu = span(t, ...T.fly);
    if (fu > 0) {
      const e = ease(fu), c = [px, DOT[1]];
      px = (1 - e) * (1 - e) * px + 2 * (1 - e) * e * c[0] + e * e * DOT[0];
      py = (1 - e) * (1 - e) * py + 2 * (1 - e) * e * c[1] + e * e * DOT[1];
      r = lerp(5, DOT[2], sm(fu));
    }
    ctx.globalAlpha = 1; ctx.fillStyle = TEAL;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();

    // Telotia, opening out from its point.
    const wa = expoOut(span(t, ...T.mark));
    if (wa > 0) {
      const sc = 0.93 + 0.07 * wa;
      ctx.save();
      ctx.translate(DOT[0], DOT[1]); ctx.scale(sc, sc); ctx.translate(-DOT[0], -DOT[1]);
      ctx.translate(WML, WMT); ctx.scale(WMS, WMS);
      ctx.globalAlpha = wa; ctx.fillStyle = INK; ctx.fill(WM_PATH, 'evenodd');
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  return { W, H, TT, draw };
}
