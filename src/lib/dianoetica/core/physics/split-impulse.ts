import { add, dot, length, perp, scale, sub } from './vector'
import type { World } from '../world'
import type { Particle } from '../particle'
import { createParticle } from '../particle'
import { randomRange } from '../../utils/random'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'

/**
 * Build the two children that replace a splitting mother in orbit.
 *
 * Hard invariant — the only place this is enforced:
 *
 *     |Δv| = α · |v_t|     with     α ∈ [0.35, 0.55]
 *
 * Both children's tangential velocity stays strictly along the mother's
 * tangent direction, so neither can reverse course. Δv is applied purely
 * along ±t̂; no radial component, no perpendicular kick — that's how we
 * forbid right-angle splits at the math level.
 */
export function splitOrbital(
  mother: Particle,
  world: World,
): { a: Particle; b: Particle } {
  const lifecycle = TELOS_PATTERN_CONFIG[world.telosPattern].particleLifecycle
  const radialFromCenter = sub(mother.position, world.center)
  const r = length(radialFromCenter) || 1
  const rHat = { x: radialFromCenter.x / r, y: radialFromCenter.y / r }
  const tHat = perp(rHat)

  const v_t = dot(mother.velocity, tHat)
  const sign: 1 | -1 = v_t >= 0 ? 1 : -1
  const v_t_abs = Math.abs(v_t)

  const alpha = randomRange(0.35, 0.55)
  const deltaV = alpha * v_t_abs
  const impulse = scale(tHat, deltaV * sign)

  const inheritedColor = { ...mother.displayColor }

  const a = createParticle({
    position: mother.position,
    velocity: add(mother.velocity, impulse), // (1+α)·v_t — faster, same direction
    bornRadius: mother.maxRadius * 0.4,
    growthDuration: randomRange(
      lifecycle.growthDurationMinSeconds,
      lifecycle.growthDurationMaxSeconds,
    ),
    color: inheritedColor,
  })
  const b = createParticle({
    position: mother.position,
    velocity: sub(mother.velocity, impulse), // (1−α)·v_t — slower, same direction
    bornRadius: mother.maxRadius * 0.4,
    growthDuration: randomRange(
      lifecycle.growthDurationMinSeconds,
      lifecycle.growthDurationMaxSeconds,
    ),
    color: { ...inheritedColor },
  })

  // Forward child carries the mother's history; rear child starts a new trail.
  a.trail.copyFrom(mother.trail)

  return { a, b }
}
