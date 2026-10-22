import { expect, test } from 'bun:test';
import { shortOrbit, threadFrame, THREAD_CYCLE, THREAD_POINTS, type ThreadShapes } from '../src/scripts/thread-motion';

const contour = (radius: number, breaks = false) => Array.from({ length: THREAD_POINTS }, (_, i) => {
  const angle = i / (THREAD_POINTS - 1) * Math.PI * 2;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle), move: breaks && i % 120 === 0 };
});
const shapes: ThreadShapes = { bridge: contour(.4, true), handshake: contour(.35, true), star: contour(.4), orbit: shortOrbit() };

test('orbit remains a short, continuous pen stroke regardless of sampling density', () => {
  const length = (points: ReturnType<typeof shortOrbit>) => points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.y - points[i].y), 0);
  const orbit = shortOrbit();
  expect(length(orbit)).toBeGreaterThan(2);
  expect(length(orbit)).toBeLessThan(4.5);
  expect(Math.abs(length(shortOrbit(960)) - length(orbit))).toBeLessThan(.02);
  expect(orbit.every(p => !p.move && Math.abs(p.x) < .5 && Math.abs(p.y) < .5)).toBe(true);
  expect(Math.max(...orbit.slice(1).map((p, i) => Math.hypot(p.x - orbit[i].x, p.y - orbit[i].y)))).toBeLessThan(.01);
});

test('a single connected line grows progressively, without revealing a complete attractor at once', () => {
  let visible = 0;
  for (let time = 4400; time < 7400; time += 25) {
    const frame = threadFrame(time, shapes);
    expect(frame.visible).toBeGreaterThanOrEqual(visible);
    expect(frame.points.every(p => !p.move)).toBe(true);
    expect(frame.fill).toBe(0);
    visible = frame.visible;
  }
  expect(threadFrame(4400, shapes).visible).toBe(1);
  expect(threadFrame(7399, shapes).visible).toBeGreaterThan(THREAD_POINTS - 3);
});

test('visible ink stays continuous across phase boundaries and the loop seam', () => {
  for (const time of [1500, 3500, 4400, 7400, 9400, 10600, 12600, 14100, THREAD_CYCLE]) {
    const before = threadFrame(time - .1, shapes), after = threadFrame(time + .1, shapes);
    for (let i = 0; i < Math.min(before.visible, after.visible); i++)
      expect(Math.hypot(before.points[i].x - after.points[i].x, before.points[i].y - after.points[i].y)).toBeLessThan(.002);
    expect(Math.abs(before.fill - after.fill)).toBeLessThan(.002);
  }
});

test('the star fills only after the stroke has almost reached its closed contour', () => {
  expect(threadFrame(8700, shapes).fill).toBe(0);
  const filled = threadFrame(10000, shapes);
  expect(filled.closed).toBe(true);
  expect(filled.fill).toBe(1);
  expect(filled.points).toEqual(shapes.star.map(p => ({ ...p, move: false })));
  expect(threadFrame(13000, shapes).fill).toBe(0);
  expect(threadFrame(13000, shapes).stage).toBe('handshake');
});
