import type { CurvePoint } from './lorenz-curve';

export const THREAD_POINTS = 480;
export const THREAD_CYCLE = 16000;
export type ThreadShapes = { bridge: CurvePoint[]; orbit: CurvePoint[]; star: CurvePoint[]; handshake: CurvePoint[] };
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };

// Exactly three revolutions of a Lorenz orbit, including a change of wing.
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
  let stroke: V[] | undefined;
  for (let i = 0; i + 3 < valleys.length; i++) {
    const candidate = raw.slice(valleys[i], valleys[i + 3] + 1);
    if (candidate.some(p => p[0] < -5) && candidate.some(p => p[0] > 5)) { stroke = candidate; break; }
  }
  if (!stroke) throw new Error('Three-turn motion orbit unavailable');
  const projected = stroke.map(([x, y, z]) => {
    const u = 1.25 * x + .2 * y, v = (28 - z) * .8;
    return { x: u * Math.cos(-.18) - v * Math.sin(-.18), y: u * Math.sin(-.18) + v * Math.cos(-.18) };
  });
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

export function threadFrame(time: number, shapes: ThreadShapes, buffer?: CurvePoint[]) {
  const count = shapes.bridge.length, t = ((time % THREAD_CYCLE) + THREAD_CYCLE) % THREAD_CYCLE;
  const points = buffer ?? Array.from({ length: count }, () => ({ x: 0, y: 0, move: false }));
  let stage = 'bridge', visible = count, fill = 0, closed = false;
  const blend = (from: CurvePoint[], to: CurvePoint[], amount: number) => {
    const a = ease(amount);
    for (let i = 0; i < count; i++) {
      points[i].x = from[i].x * (1 - a) + to[i].x * a;
      points[i].y = from[i].y * (1 - a) + to[i].y * a;
      points[i].move = Boolean((a < .999 && from[i].move) || (a > .001 && to[i].move));
    }
  };
  const thread = (i: number) => {
    const u = i / (count - 1);
    return { x: -.37 + .74 * u, y: .025 * Math.sin(u * Math.PI * 2) };
  };
  if (t < 1500) blend(shapes.bridge, shapes.bridge, 0);
  else if (t < 3500) {
    stage = 'gather'; const amount = ease((t - 1500) / 2000), lift = Math.sin(Math.PI * amount);
    for (let i = 0; i < count; i++) {
      const target = thread(i), p = shapes.bridge[i], u = i / (count - 1);
      points[i].x = p.x * (1 - amount) + target.x * amount + .035 * Math.sin(u * Math.PI * 2) * lift;
      points[i].y = p.y * (1 - amount) + target.y * amount - .06 * Math.sin(u * Math.PI * 3) * lift;
      points[i].move = Boolean(p.move && amount < .999);
    }
  } else if (t < 4400) {
    stage = 'thread'; const amount = ease((t - 3500) / 900), seed = shapes.orbit[0];
    for (let i = 0; i < count; i++) {
      const p = thread(i);
      points[i].x = p.x * (1 - amount) + seed.x * amount;
      points[i].y = p.y * (1 - amount) + seed.y * amount - Math.sin(Math.PI * amount) * .045 * Math.sin(i / count * Math.PI);
      points[i].move = false;
    }
  } else if (t < 7400) {
    stage = 'orbit'; const amount = (t - 4400) / 3000;
    visible = 1 + Math.floor(ease(amount) * (count - 1));
    const flutter = .009 * Math.sin(Math.PI * amount);
    for (let i = 0; i < count; i++) {
      points[i].x = shapes.orbit[i].x + flutter * Math.sin(i / count * 8 + amount * 4);
      points[i].y = shapes.orbit[i].y + flutter * Math.sin(i / count * 6 - amount * 4);
      points[i].move = false;
    }
  } else if (t < 9400) {
    stage = 'form-star'; const amount = (t - 7400) / 2000;
    blend(shapes.orbit, shapes.star, amount);
    fill = ease((amount - .7) / .3);
    closed = amount > .999;
  } else if (t < 10600) {
    stage = 'star'; blend(shapes.star, shapes.star, 0); fill = 1; closed = true;
  } else if (t < 12600) {
    stage = 'handshake-morph'; const amount = (t - 10600) / 2000;
    blend(shapes.star, shapes.handshake, amount); fill = 1 - ease(amount / .45);
  } else if (t < 14100) {
    stage = 'handshake'; blend(shapes.handshake, shapes.handshake, 0);
  } else {
    stage = 'bridge-morph'; blend(shapes.handshake, shapes.bridge, (t - 14100) / 1900);
  }
  return { points, visible, fill, closed, stage };
}
