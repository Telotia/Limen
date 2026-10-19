import { expect, test } from 'bun:test';
import { cinematicFrame, cinematicTask } from '../src/scripts/task-loop-cinematic';
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
  for (const t of [.12, .29, .40, .43, .50, 4 / 7, 5 / 7]) {
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
