import { ease } from './task-loop-model';
export type Point = { x: number; y: number };
export const mixPoint = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const seed = (i: number) => { const n = Math.sin(i * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const poolEntry = { x: .48, y: .45 }, poolExit = { x: .56, y: .45 };
function poolTask(fraction: number): Point {
  const t = ease(fraction);
  return { x: poolEntry.x + (poolExit.x - poolEntry.x) * t, y: poolEntry.y + Math.sin(Math.PI * t) * .016 };
}
const cardTask = { x: .31, y: .29 }, queueTask = { x: .5, y: .38 }, worker = { x: .72, y: .43 };
const arc = (a: Point, b: Point, t: number, lift: number) => { const p = mixPoint(a, b, ease(t)); p.y -= Math.sin(Math.PI * ease(t)) * lift; return p; };
// Give the shared pool the longest uninterrupted view in the 30-second story.
export function playbackPosition(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const clock = [0, .12, .23, .50, .59, .68, .80, .90, 1];
  const story = [0, .12, .29, .40, .43, .55, 5 / 7, 6 / 7, 1];
  let i = 0;
  while (i < clock.length - 2 && p > clock[i + 1]) i++;
  return story[i] + (story[i + 1] - story[i]) * (p - clock[i]) / (clock[i + 1] - clock[i]);
}
export function cinematicTask(time: number): Point {
  const t = Math.max(0, Math.min(1, time));
  if (t < .12) return mixPoint(cardTask, queueTask, ease(t / .12));
  if (t < .29) return arc(queueTask, poolEntry, (t - .12) / .17, .12);
  if (t < .40) return poolTask((t - .29) / .11);
  if (t < .43) return arc(poolExit, worker, (t - .40) / .03, .04);
  if (t < .50) return arc(worker, cardTask, (t - .43) / .07, .06);
  if (t < 4 / 7) return cardTask;
  if (t < 5 / 7) {
    const f = ease((t - 4 / 7) * 7), z = 1 - f;
    return { x: z ** 3 * cardTask.x + 3 * z * z * f * .92 + 3 * z * f * f * .12 + f ** 3 * cardTask.x,
      y: z ** 3 * cardTask.y + 3 * z * z * f * .02 + 3 * z * f * f * .87 + f ** 3 * cardTask.y };
  }
  return cardTask;
}
// The same particle indices persist through every composition. Scene changes
// interpolate layouts; they never destroy and replace one diagram with another.
function layout(kind: number, i: number, t: number): Point {
  if (kind === 0 || kind === 4 || kind >= 6) {
    // Lines of a document, with five status cells across its top.
    if (i < 20) return { x: .31 + (i % 5) * .095, y: .29 + Math.floor(i / 5) * .009 };
    const r = Math.floor((i - 20) / 25), c = (i - 20) % 25;
    return { x: .31 + c * .015 * (r % 3 === 0 ? .8 : 1), y: .43 + r * .055 };
  }
  if (kind === 1) {
    const lane = i % 5, n = Math.floor(i / 5), h = [1, .55, .85, .40, 1.15][lane];
    return { x: .16 + lane * .17 + (n % 3) * .019, y: .76 - Math.floor(n / 3) * .034 * h };
  }
  if (kind === 2) {
    // A shared, gently moving queue. Colors and spacing carry no status meaning.
    const col = i % 15, row = Math.floor(i / 15);
    return { x: .25 + col * .036 + (seed(i + 100) - .5) * .012 + Math.sin(t * 10 + row * .4) * .005,
      y: .31 + row * .030 + (seed(i + 120) - .5) * .012 + Math.sin(t * 6 + i * .2) * .003 };
  }
  if (kind === 3) {
    const angle = seed(i + 10) * Math.PI * 2, radius = .10 + seed(i + 20) * .38;
    return { x: worker.x + Math.cos(angle) * radius, y: worker.y + Math.sin(angle) * radius * .78 };
  }
  const f = i / 180, phase = t * 3 + f * 7;
  return { x: .15 + f * .72, y: .48 + Math.sin(phase) * .16 + Math.sin(f * Math.PI) * .14 };
}
const keys = [0, .12, .29, .43, .55, .66, 5 / 7, .87, 1];
const cameras = [
  { x: .5, y: .49, zoom: 1.22 }, { x: .5, y: .49, zoom: .92 },
  { x: .5, y: .49, zoom: 1.45 }, { x: .67, y: .44, zoom: 1.22 },
  { x: .5, y: .49, zoom: 1.14 }, { x: .5, y: .49, zoom: .87 },
  { x: .5, y: .49, zoom: 1.10 }, { x: .5, y: .49, zoom: 1.20 },
  { x: .5, y: .49, zoom: 1.14 },
];
export function cinematicFrame(progress: number, reduced = false) {
  const t = Math.max(0, Math.min(1, progress));
  let k = 0;
  while (k < keys.length - 2 && t > keys[k + 1]) k++;
  const f = (t - keys[k]) / (keys[k + 1] - keys[k]);
  const transition = k === 2 ? Math.max(0, (f - .70) / .30) : f;
  const blend = ease(transition);
  const camera = { ...mixPoint(cameras[k], cameras[k + 1], blend), zoom: cameras[k].zoom + (cameras[k + 1].zoom - cameras[k].zoom) * blend };
  const particles = Array.from({ length: 180 }, (_, i) => {
    const morph = reduced ? blend : ease((transition - seed(i + 80) * .12) / .88);
    const q = mixPoint(layout(k, i, t), layout(k + 1, i, t), morph);
    const roundA = k === 3 ? 1 : 0, roundB = k + 1 === 3 ? 1 : 0;
    return { ...q, round: roundA + (roundB - roundA) * morph, opacity: .48 + seed(i + 40) * .34 };
  });
  return { pool: ease((t - .16) / .10) * (1 - ease((t - .388) / .042)), particles, task: cinematicTask(t), camera: reduced ? { x: .5, y: .49, zoom: 1 } : camera,
    document: (1 - ease(t / .12)) + ease((t - .43) / .09) * (1 - ease((t - .56) / .07)) + ease((t - .67) / .045),
    taskId: 'T-01', origin: 'Pharmacy A', reviewed: t >= 6 / 7 };
}
