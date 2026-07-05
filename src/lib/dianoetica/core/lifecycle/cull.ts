import type { World } from '../world'
import type { ClaimVerdict, Particle } from '../particle'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'

const LOW_COUNT_FLOOR = 4
const PROVEN_CHANCE = 0.52

/**
 * Weighted toward claims that have grown past their first fragile moments,
 * so verdicts feel like observed knowledge rather than arbitrary deletion.
 */
const MATURITY_WEIGHT_EXPONENT = 1.4
const YOUTH_FLOOR_WEIGHT = 0.08

export interface ClaimResolutionChoice {
  particle: Particle
  verdict: ClaimVerdict
}

export function maybeChooseResolvedClaim(
  world: World,
  dt: number,
): ClaimResolutionChoice | null {
  const lifecycle = TELOS_PATTERN_CONFIG[world.telosPattern].particleLifecycle
  world.cullCooldown -= dt
  if (world.cullCooldown > 0) return null

  const alive = world.particles.filter((p) => p.state === 'alive' && !p.isTelos)
  if (alive.length <= LOW_COUNT_FLOOR) {
    world.cullCooldown = 1.0
    return null
  }

  // Weighted-random selection.
  let totalWeight = 0
  const weights: number[] = new Array(alive.length)
  for (let i = 0; i < alive.length; i++) {
    const p = alive[i]
    const progress = Math.min(1, p.age / p.growthDuration)
    const w = Math.pow(progress, MATURITY_WEIGHT_EXPONENT) + YOUTH_FLOOR_WEIGHT
    weights[i] = w
    totalWeight += w
  }

  let r = Math.random() * totalWeight
  let target = alive[0]
  for (let i = 0; i < alive.length; i++) {
    r -= weights[i]
    if (r <= 0) {
      target = alive[i]
      break
    }
  }

  const scale = LOW_COUNT_FLOOR / alive.length
  world.cullCooldown = lifecycle.cullBaseIntervalSeconds * scale * (0.7 + Math.random() * 0.6)
  return {
    particle: target,
    verdict: Math.random() < PROVEN_CHANCE ? 'proven' : 'falsified',
  }
}
