import { expect, test } from 'bun:test';
import { attractor, sampleAttractor } from '../src/scripts/task-loop-chaos';
test('Lorenz geometry stays finite, bounded and continuous across its sampled trajectory', () => {
  expect(attractor.length).toBe(6000);
  for (let i = 0; i < attractor.length; i++) {
    const q = attractor[i];
    expect(Number.isFinite(q.x) && Number.isFinite(q.y)).toBe(true);
    expect(Math.abs(q.x)).toBeLessThan(1.2);
    expect(Math.abs(q.y)).toBeLessThan(1.2);
    if (i) expect(Math.hypot(q.x - attractor[i - 1].x, q.y - attractor[i - 1].y)).toBeLessThan(.15);
  }
  expect(sampleAttractor(-10)).toEqual(attractor[0]);
  expect(sampleAttractor(99999)).toEqual(attractor.at(-1)!);
  const a = attractor[100], b = attractor[101];
  expect(sampleAttractor(100.5)).toEqual({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
});
