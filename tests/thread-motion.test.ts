import { expect, test } from 'bun:test';
import { shortOrbit, alignStar, threadFrame, THREAD_CYCLE, THREAD_POINTS, type ThreadShapes } from '../src/scripts/thread-motion';

const contour = (radius: number, breaks = false) => Array.from({ length: THREAD_POINTS }, (_, i) => {
  const angle = i / (THREAD_POINTS - 1) * Math.PI * 2;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), move: breaks && i % 120 === 0 };
});
const shapes: ThreadShapes = { bridge: contour(.4, true), handshake: contour(.35, true), star: contour(.4), orbit: shortOrbit() };

test('orbit remains a short, continuous pen stroke regardless of sampling density', () => {
  const length = (points: ReturnType<typeof shortOrbit>) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  const orbit = shortOrbit();
  expect(length(orbit)).toBeGreaterThan(2);
  expect(length(orbit)).toBeLessThan(6);
  expect(Math.abs(length(shortOrbit(960)) - length(orbit))).toBeLessThan(.02);
  expect(orbit.every(p => !p.move && Math.abs(p.x) < .5 && Math.abs(p.y) < .5)).toBe(true);
  expect(Math.max(...orbit.slice(1).map((p, i) => Math.hypot(p.x - orbit[i].x, p.y - orbit[i].y)))).toBeLessThan(.012);
});

test('a single connected line grows progressively, without revealing a complete attractor at once', () => {
  let visible = 0;
  for (let time = 4000; time < 7600; time += 25) {
    const frame = threadFrame(time, shapes);
    expect(frame.visible).toBeGreaterThanOrEqual(visible);
    expect(frame.points.every(p => !p.move)).toBe(true);
    visible = frame.visible;
  }
  expect(threadFrame(4000, shapes).visible).toBe(1);
  expect(threadFrame(7599, shapes).visible).toBeGreaterThan(THREAD_POINTS - 3);
});

test('visible ink stays continuous across phase boundaries and the loop seam', () => {
  for (const time of [1400, 3300, 4000, 7600, 8300, 11200, 12300, 15300, 16600, THREAD_CYCLE]) {
    const before = threadFrame(time - .1, shapes), after = threadFrame(time + .1, shapes);
    for (let i = 0; i < Math.floor(Math.min(before.visible, after.visible)); i++)
      expect(Math.hypot(before.points[i].x - after.points[i].x, before.points[i].y - after.points[i].y)).toBeLessThan(.002);
    for (let i = 1; i < Math.floor(Math.min(before.visible, after.visible)); i++)
      expect(Math.abs((before.points[i].join ?? 1) - (after.points[i].join ?? 1))).toBeLessThan(.002);
  }
});

test('the complete orbit closes before the outline starts morphing', () => {
  const orbit = shortOrbit();
  expect(Math.hypot(orbit[0].x - orbit.at(-1)!.x, orbit[0].y - orbit.at(-1)!.y)).toBeLessThan(1e-10);
  for (const time of [7600, 7900, 8299]) {
    const frame = threadFrame(time, shapes);
    expect(frame.visible).toBe(THREAD_POINTS);
    expect(frame.closed).toBe(true);
    expect(frame.stage).toBe('orbit-hold');
  }
});

test('the star opens into separate hand contours through gradual pen lifts', () => {
  const joins = [12300, 12600, 13500, 14100, 15000, 15300].map(time => threadFrame(time, shapes).points[120].join!);
  expect(joins[0]).toBe(1);
  expect(joins.at(-1)).toBe(0);
  for (let i = 1; i < joins.length; i++) expect(joins[i]).toBeLessThan(joins[i - 1]);
  expect(threadFrame(11800, shapes).closed).toBe(true);
  expect(threadFrame(15600, shapes).stage).toBe('handshake');
});

test('contour alignment preserves the star geometry and closed endpoints', () => {
  const aligned = alignStar(shapes.star, shapes.orbit, shapes.handshake);
  expect(aligned).toHaveLength(THREAD_POINTS);
  expect(aligned[0].x).toBe(aligned.at(-1)!.x);
  expect(aligned[0].y).toBe(aligned.at(-1)!.y);
  for (const p of aligned) expect(Math.abs(Math.hypot(p.x, p.y) - .4)).toBeLessThan(1e-10);
});
