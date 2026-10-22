import type { CurvePoint } from './lorenz-curve';

export const THREAD_POINTS = 720;
export const THREAD_CYCLE = 19000;
export type ThreadShapes = { bridge: CurvePoint[]; orbit: CurvePoint[]; star: CurvePoint[]; handshake: CurvePoint[] };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };

// Two complete passes through both Lorenz wings, with two sparse loops per wing.
// This is a finite pen stroke, rather than a dense, fully revealed attractor.
export function shortOrbit(count = THREAD_POINTS): CurvePoint[] {
  type V = [number, number, number];
  const f = ([x, y, z]: V): V => [10 * (y - x), x * (28 - z) - y, x * y - 8 * z / 3];
  const add = (p: V, d: V, t: number) => p.map((v, i) => v + d[i] * t) as V;
  let state: V = [.1, 0, 0];
  const raw: V[] = [];
  for (let i = 0; i < 12000; i++) {
    const a = f(state), b = f(add(state, a, .0025)), c = f(add(state, b, .0025)), d = f(add(state, c, .005));
    state = state.map((v, j) => v + .005 / 6 * (a[j] + 2 * b[j] + 2 * c[j] + d[j])) as V;
    if (i >= 2000) raw.push(state);
  }
  const valleys: number[] = [];
  for (let i = 1; i < raw.length - 1; i++)
    if (raw[i - 1][2] > raw[i][2] && raw[i + 1][2] > raw[i][2]) valleys.push(i);
  let stroke: V[] | undefined, bestGap = Infinity;
  for (let i = 0; i + 4 < valleys.length; i++) {
    const candidate = raw.slice(valleys[i], valleys[i + 4] + 1);
    const wingVisits = Array.from({ length: 4 }, (_, turn) => {
      const segment = raw.slice(valleys[i + turn], valleys[i + turn + 1]);
      return segment.reduce((peak, p) => p[2] > peak[2] ? p : peak)[0];
    });
    if (wingVisits.filter(x => x < 0).length !== 2) continue;
    const first = candidate[0], last = candidate.at(-1)!;
    const gap = Math.hypot(first[0] - last[0], first[1] - last[1], first[2] - last[2]);
    if (gap < bestGap) { stroke = candidate; bestGap = gap; }
  }
  if (!stroke) throw new Error('Balanced two-wing motion orbit unavailable');
  const projected = stroke.map(([x, y, z]) => {
    const u = 1.25 * x + .2 * y, v = (28 - z) * .8;
    return { x: u * Math.cos(-.18) - v * Math.sin(-.18), y: u * Math.sin(-.18) + v * Math.cos(-.18) };
  });
  // Select a near-returning two-wing orbit and gently remove its tiny residual
  // gap. The pen finishes exactly where it began, with no dangling half-lobe.
  const delta = { x: projected[0].x - projected.at(-1)!.x, y: projected[0].y - projected.at(-1)!.y };
  projected.forEach((p, i) => { const t = ease(i / (projected.length - 1)); p.x += delta.x * t; p.y += delta.y * t; });
  const xs = projected.map(p => p.x), ys = projected.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = .78 / Math.max(maxX - minX, maxY - minY), cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const lengths = [0];
  for (let i = 1; i < projected.length; i++) lengths.push(lengths[i - 1] + Math.hypot(projected[i].x - projected[i - 1].x, projected[i].y - projected[i - 1].y));
  let cursor = 1;
  return Array.from({ length: count }, (_, i) => {
    const distance = i / (count - 1) * lengths.at(-1)!;
    while (cursor < projected.length - 1 && lengths[cursor] < distance) cursor++;
    const t = (distance - lengths[cursor - 1]) / (lengths[cursor] - lengths[cursor - 1]);
    return { x: (projected[cursor - 1].x * (1 - t) + projected[cursor].x * t - cx) * scale,
      y: (projected[cursor - 1].y * (1 - t) + projected[cursor].y * t - cy) * scale };
  });
}

export type InkPoint = CurvePoint & { join?: number };

// Match the same closed star outline to both neighbours without rotating the
// visible symbol. Only the traversal's start point and direction change.
export function alignStar(star: CurvePoint[], orbit: CurvePoint[], hand: CurvePoint[]) {
  const period = star.length - 1;
  let bestShift = 0, bestDirection = 1, bestCost = Infinity;
  for (const direction of [1, -1]) for (let shift = 0; shift < period; shift++) {
    let cost = 0;
    for (let i = 0; i < period; i += 4) {
      const p = star[(shift + direction * i + period) % period];
      cost += .55 * ((p.x - orbit[i].x) ** 2 + (p.y - orbit[i].y) ** 2)
        + .45 * ((p.x - hand[i].x) ** 2 + (p.y - hand[i].y) ** 2);
    }
    if (cost < bestCost) { bestCost = cost; bestShift = shift; bestDirection = direction; }
  }
  return star.map((_, i) => ({ ...star[(bestShift + bestDirection * i + period) % period], move: i === 0 }));
}

export function threadFrame(time: number, shapes: ThreadShapes, buffer?: InkPoint[]) {
  const count = shapes.bridge.length, t = ((time % THREAD_CYCLE) + THREAD_CYCLE) % THREAD_CYCLE;
  const points: InkPoint[] = buffer ?? Array.from({ length: count }, () => ({ x: 0, y: 0, move: false, join: 1 }));
  let stage = 'bridge', visible = count, closed = false;
  const setJoin = (i: number, join: number) => { points[i].join = join; points[i].move = join < .999999; };
  const blend = (from: CurvePoint[], to: CurvePoint[], amount: number) => {
    const a = ease(amount);
    for (let i = 0; i < count; i++) {
      points[i].x = from[i].x * (1 - a) + to[i].x * a;
      points[i].y = from[i].y * (1 - a) + to[i].y * a;
      // A contour opens with a gradual pen lift, rather than switching moveTo
      // flags in one frame and cutting holes into the star.
      setJoin(i, (from[i].move ? 0 : 1) * (1 - a) + (to[i].move ? 0 : 1) * a);
    }
  };
  const thread = (i: number) => {
    const u = i / (count - 1);
    return { x: -.37 + .74 * u, y: .025 * Math.sin(u * Math.PI * 2) };
  };
  if (t < 1400) blend(shapes.bridge, shapes.bridge, 0);
  else if (t < 3300) {
    stage = 'gather'; const amount = ease((t - 1400) / 1900), lift = Math.sin(Math.PI * amount);
    for (let i = 0; i < count; i++) {
      const target = thread(i), p = shapes.bridge[i], u = i / (count - 1);
      points[i].x = p.x * (1 - amount) + target.x * amount + .035 * Math.sin(u * Math.PI * 2) * lift;
      points[i].y = p.y * (1 - amount) + target.y * amount - .06 * Math.sin(u * Math.PI * 3) * lift;
      setJoin(i, p.move ? amount : 1);
    }
  } else if (t < 4000) {
    stage = 'thread'; const amount = ease((t - 3300) / 700), seed = shapes.orbit[0];
    for (let i = 0; i < count; i++) {
      const p = thread(i);
      points[i].x = p.x * (1 - amount) + seed.x * amount;
      points[i].y = p.y * (1 - amount) + seed.y * amount - Math.sin(Math.PI * amount) * .045 * Math.sin(i / count * Math.PI);
      setJoin(i, 1);
    }
  } else if (t < 8300) {
    const amount = clamp((t - 4000) / 3600);
    stage = amount < 1 ? 'orbit' : 'orbit-hold';
    // Fractional pen position prevents visible jumps between sampled vertices.
    visible = 1 + ease(amount) * (count - 1);
    const flutter = .007 * Math.sin(Math.PI * amount);
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      points[i].x = shapes.orbit[i].x + flutter * Math.sin(u * Math.PI * 4 + amount * 4);
      points[i].y = shapes.orbit[i].y + flutter * Math.sin(u * Math.PI * 6 - amount * 4);
      setJoin(i, 1);
    }
    closed = amount === 1;
  } else if (t < 11200) {
    stage = 'form-star'; blend(shapes.orbit, shapes.star, (t - 8300) / 2900); closed = true;
  } else if (t < 12300) {
    stage = 'star'; blend(shapes.star, shapes.star, 0); closed = true;
  } else if (t < 15300) {
    stage = 'handshake-morph'; blend(shapes.star, shapes.handshake, (t - 12300) / 3000);
  } else if (t < 16600) {
    stage = 'handshake'; blend(shapes.handshake, shapes.handshake, 0);
  } else {
    stage = 'bridge-morph'; blend(shapes.handshake, shapes.bridge, (t - 16600) / 2400);
  }
  return { points, visible, closed, stage };
}
