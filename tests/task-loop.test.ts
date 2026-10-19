import { expect, test } from 'bun:test';
import { ease, loopState } from '../src/scripts/task-loop-model';

test('one task preserves its origin and selected pharmacist throughout the loop', () => {
  for (let i = 0; i <= 100; i++) {
    const state = loopState(i / 100);
    expect([state.task, state.origin, state.pharmacist]).toEqual(['T-01', 'Pharmacy A', 2]);
    expect(state.reviewed).toBe(state.step === 6);
  }
});
test('processing and return never carry the final reviewed state', () => {
  expect(loopState(3.5 / 7).reviewed).toBe(false);
  expect(loopState(4.5 / 7).reviewed).toBe(false);
  expect(loopState(5.5 / 7).reviewed).toBe(false);
  expect(loopState(1).reviewed).toBe(true);
  expect(loopState(-1).step).toBe(0);
  expect(loopState(2).step).toBe(6);
  expect(ease(0)).toBe(0);
  expect(ease(1)).toBe(1);
});
