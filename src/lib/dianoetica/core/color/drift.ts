import type { Particle } from '../particle'
import {
  COOL_HUE_MAX,
  COOL_HUE_MIN,
  COOL_LIGHT_MAX,
  COOL_LIGHT_MIN,
  COOL_SAT_MAX,
  COOL_SAT_MIN,
} from './palette'
import { smoothNoise } from '../../utils/random'

const HUE_DRIFT_AMPLITUDE = 25
const SAT_DRIFT_AMPLITUDE = 6
const LIGHT_DRIFT_AMPLITUDE = 5

const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v

/**
 * Update each particle's displayed color slowly within the cool-tone range.
 * Drift is breathing-slow, no flicker.
 */
export function updateColors(particles: Particle[], now: number): void {
  for (const p of particles) {
    if (p.state === 'resolving') continue // verdict color overrides
    if (p.isTelos) continue // Telos's gold is constant, never drifts

    const hueDrift = smoothNoise(now, p.colorPhase, 0.08) * HUE_DRIFT_AMPLITUDE
    const satDrift = smoothNoise(now, p.colorPhase + 13.7, 0.06) * SAT_DRIFT_AMPLITUDE
    const lightDrift = smoothNoise(now, p.colorPhase + 27.4, 0.07) * LIGHT_DRIFT_AMPLITUDE

    p.displayColor.h = clamp(p.baseColor.h + hueDrift, COOL_HUE_MIN, COOL_HUE_MAX)
    p.displayColor.s = clamp(p.baseColor.s + satDrift, COOL_SAT_MIN, COOL_SAT_MAX)
    p.displayColor.l = clamp(p.baseColor.l + lightDrift, COOL_LIGHT_MIN, COOL_LIGHT_MAX)
  }
}
