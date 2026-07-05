export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/** Hermite smoothstep: C¹ continuous at 0 and 1. */
export const smoothstep = (x: number): number => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}

export const easeInOutCubic = (x: number): number => {
  const c = clamp01(x)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

export const easeOutCubic = (x: number): number => {
  const c = clamp01(x)
  return 1 - Math.pow(1 - c, 3)
}

export const easeInQuad = (x: number): number => {
  const c = clamp01(x)
  return c * c
}
