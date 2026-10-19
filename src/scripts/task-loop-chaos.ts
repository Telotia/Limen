// A bounded, precomputed Lorenz attractor: no integration in the render loop.
export function createAttractor() {
  let x = .1, y = 0, z = 0;
  const points: { x: number; y: number }[] = [];
  const derivative = (a: number, b: number, c: number) => [10 * (b - a), a * (28 - c) - b, a * b - (8 / 3) * c];
  const dt = .006;
  for (let i = 0; i < 7400; i++) {
    const a = derivative(x, y, z);
    const b = derivative(x + a[0] * dt / 2, y + a[1] * dt / 2, z + a[2] * dt / 2);
    const c = derivative(x + b[0] * dt / 2, y + b[1] * dt / 2, z + b[2] * dt / 2);
    const d = derivative(x + c[0] * dt, y + c[1] * dt, z + c[2] * dt);
    x += dt * (a[0] + 2 * b[0] + 2 * c[0] + d[0]) / 6;
    y += dt * (a[1] + 2 * b[1] + 2 * c[1] + d[1]) / 6;
    z += dt * (a[2] + 2 * b[2] + 2 * c[2] + d[2]) / 6;
    if (i >= 1400) points.push({ x: (x * .8 + y * .2) / 24, y: (26 - z) / 27 });
  }
  return points;
}
export const attractor = createAttractor();
export function sampleAttractor(position: number) {
  const cursor = Math.max(0, Math.min(attractor.length - 1, position));
  const i = Math.floor(cursor), a = attractor[i], b = attractor[Math.min(i + 1, attractor.length - 1)], f = cursor - i;
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}
