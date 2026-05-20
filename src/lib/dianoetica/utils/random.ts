export const randomRange = (min: number, max: number): number =>
  min + Math.random() * (max - min)

export const randomInt = (min: number, max: number): number =>
  Math.floor(min + Math.random() * (max - min + 1))

export const randomSign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1)

/**
 * Smooth low-frequency pseudo-noise in [-1, 1] built from a sum of
 * two sinusoids. Cheap, deterministic given (t, phase), no library needed.
 */
export const smoothNoise = (t: number, phase: number, freq = 0.4): number => {
  const a = Math.sin(t * freq + phase)
  const b = Math.sin(t * freq * 1.73 + phase * 2.1 + 1.3)
  return (a + 0.5 * b) / 1.5
}
