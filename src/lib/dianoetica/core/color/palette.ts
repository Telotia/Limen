/**
 * Curated companion palette for telos's rose-gold warmth. The sub-particles
 * stay in blue/teal/lavender territory so telos remains the only warm accent,
 * but the colors are less neon-random than a continuous hue range.
 */
export const COOL_HUE_MIN = 168
export const COOL_HUE_MAX = 268
export const COOL_SAT_MIN = 46
export const COOL_SAT_MAX = 78
export const COOL_LIGHT_MIN = 58
export const COOL_LIGHT_MAX = 72

export const DEATH_HUE = 0
export const DEATH_SAT = 100
export const DEATH_LIGHT = 60

export const PROVEN_HUE = 128
export const PROVEN_SAT = 78
export const PROVEN_LIGHT = 58

/** telos (the central immortal particle) — a warm muted rose-gold,
 *  matching the Dianoetica brand palette (logo ring / star / wordmark).
 *  Deliberately desaturated and warm-toward-peach rather than a bright
 *  yellow gold. */
export const TELOS_HUE = 32
export const TELOS_SAT = 55
export const TELOS_LIGHT = 70

export interface Hsl {
  h: number
  s: number
  l: number
}

const SUB_PARTICLE_PALETTE: Hsl[] = [
  { h: 172, s: 52, l: 62 }, // sea-glass teal
  { h: 188, s: 66, l: 64 }, // icy cyan
  { h: 207, s: 60, l: 66 }, // dusty sapphire
  { h: 226, s: 56, l: 68 }, // periwinkle blue
  { h: 248, s: 50, l: 69 }, // soft wisteria
  { h: 264, s: 48, l: 67 }, // restrained lavender
]

export const pickInitialCoolColor = (): Hsl => {
  const base = SUB_PARTICLE_PALETTE[Math.floor(Math.random() * SUB_PARTICLE_PALETTE.length)]
  return {
    h: clamp(base.h + randomJitter(4), COOL_HUE_MIN, COOL_HUE_MAX),
    s: clamp(base.s + randomJitter(5), COOL_SAT_MIN, COOL_SAT_MAX),
    l: clamp(base.l + randomJitter(4), COOL_LIGHT_MIN, COOL_LIGHT_MAX),
  }
}

export const goldColor = (): Hsl => ({
  h: TELOS_HUE,
  s: TELOS_SAT,
  l: TELOS_LIGHT,
})

export const hslString = (c: Hsl, alpha = 1): string =>
  `hsla(${c.h.toFixed(1)}, ${c.s.toFixed(1)}%, ${c.l.toFixed(1)}%, ${alpha.toFixed(3)})`

const randomJitter = (amount: number): number => (Math.random() * 2 - 1) * amount

const clamp = (v: number, min: number, max: number): number =>
  v < min ? min : v > max ? max : v
