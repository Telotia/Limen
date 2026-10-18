// Real Lorenz trajectory (sigma=10, rho=28, beta=8/3), integrated with RK4.
// The projection is tilted and widened to match the supplied two-wing reference.
export type CurvePoint = { x: number; y: number; move?: boolean };
export function lorenzCurve(count: number): CurvePoint[] {
  type V = [number, number, number];
  const derivative = ([x, y, z]: V): V => [
    10 * (y - x),
    x * (28 - z) - y,
    x * y - (8 / 3) * z,
  ];
  const add = (p: V, d: V, t: number): V => p.map((v, i) => v + d[i] * t) as V;
  let state: V = [0.1, 0, 0];
  const raw: CurvePoint[] = [];
  const dt = 0.005;
  for (let i = 0; i < 17000; i++) {
    const a = derivative(state),
      b = derivative(add(state, a, dt / 2));
    const c = derivative(add(state, b, dt / 2)),
      d = derivative(add(state, c, dt));
    state = state.map(
      (v, j) => v + (dt / 6) * (a[j] + 2 * b[j] + 2 * c[j] + d[j]),
    ) as V;
    if (i < 2000) continue;
    const u = 1.25 * state[0] + 0.2 * state[1],
      v = (28 - state[2]) * 0.8;
    raw.push({
      x: u * Math.cos(-0.18) - v * Math.sin(-0.18),
      y: u * Math.sin(-0.18) + v * Math.cos(-0.18),
    });
  }
  const xs = raw.map((p) => p.x),
    ys = raw.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = 0.88 / Math.max(maxX - minX, maxY - minY),
    cx = (minX + maxX) / 2,
    cy = (minY + maxY) / 2;
  const lengths = [0];
  for (let i = 1; i < raw.length; i++)
    lengths.push(
      lengths[i - 1] +
        Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y),
    );
  let cursor = 1;
  return Array.from({ length: count }, (_, i) => {
    const distance = (i / (count - 1)) * lengths[lengths.length - 1];
    while (cursor < raw.length - 1 && lengths[cursor] < distance) cursor++;
    const t =
      (distance - lengths[cursor - 1]) /
      (lengths[cursor] - lengths[cursor - 1]);
    return {
      x:
        (raw[cursor - 1].x + (raw[cursor].x - raw[cursor - 1].x) * t - cx) *
        scale,
      y:
        (raw[cursor - 1].y + (raw[cursor].y - raw[cursor - 1].y) * t - cy) *
        scale,
    };
  });
}
