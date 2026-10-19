import { expect, test } from 'bun:test';
import { cinematicFrame, cinematicTask, playbackPosition } from '../src/scripts/task-loop-cinematic';
test('one tracked task keeps its source through every continuous camera transition', () => {
  let previous = cinematicFrame(0);
  for (let i = 0; i <= 1000; i++) {
    const frame = cinematicFrame(i / 1000);
    expect(frame.taskId).toBe('T-01'); expect(frame.origin).toBe('Pharmacy A');
    expect(frame.reviewed).toBe(i / 1000 >= 6 / 7);
    expect(frame.particles.length).toBe(180);
    expect(Math.hypot(frame.task.x - previous.task.x, frame.task.y - previous.task.y)).toBeLessThan(.12);
    expect(Math.abs(frame.camera.zoom - previous.camera.zoom)).toBeLessThan(.03);
    previous = frame;
  }
  expect(cinematicTask(0)).toEqual(cinematicTask(1));
  for (const t of [.12, .29, .40, .43, .455, .50, 4 / 7, 5 / 7]) {
    const a = cinematicTask(t - 1e-7), b = cinematicTask(t + 1e-7);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(.0001);
  }
});
test('reduced motion keeps a fixed camera and preserves all review states', () => {
  for (const t of [0, .3, .5, .7, 1]) {
    const frame = cinematicFrame(t, true);
    expect(frame.camera).toEqual({ x: .5, y: .49, zoom: 1 });
    expect(frame.taskId).toBe('T-01');
  }
});

test('particle identities interpolate without a jump at scene boundaries', () => {
  for (const t of [.12, .29, .43, .55, .66, 5 / 7, .87]) {
    const a = cinematicFrame(t - 1e-7), b = cinematicFrame(t + 1e-7);
    a.particles.forEach((q, i) => expect(Math.hypot(q.x - b.particles[i].x, q.y - b.particles[i].y)).toBeLessThan(.0001));
  }
});

test('playback keeps the pool hold brief and gives selection a clear departure', () => {
  expect(playbackPosition(.25)).toBeCloseTo(.29);
  expect(playbackPosition(.39)).toBeCloseTo(.40);
  for (const p of [.26, .30, .35, .38]) {
    const frame = cinematicFrame(playbackPosition(p));
    expect(frame.pool).toBeGreaterThan(.95);
    expect(frame.camera.zoom).toBeCloseTo(1.17);
    expect(frame.camera.x).toBeCloseTo(.5);
  }
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const t = playbackPosition(i / 1000);
    expect(t).toBeGreaterThanOrEqual(previous); previous = t;
  }
  expect(playbackPosition(1)).toBe(1);
  const selected = cinematicTask(.43);
  expect(Math.hypot(selected.x - .5, selected.y - .48)).toBeGreaterThan(.38);
  expect(cinematicTask(.445)).toEqual(selected);
});

test('illustrative category membership remains attached across every scene', () => {
  for (const t of [0, .29, .35, .43, .55, .7, 1]) {
    const frame = cinematicFrame(t);
    expect(frame.taskCategory).toBe('B');
    for (const category of ['A', 'B', 'C']) {
      const members = frame.particles.map((p, i) => ({ ...p, index: i })).filter(p => p.category === category);
      expect(members.length).toBe(60);
      expect(members.some(p => p.index % 3 === 0)).toBe(true);
      expect(members.some(p => p.index % 3 !== 0)).toBe(true);
    }
  }
});
