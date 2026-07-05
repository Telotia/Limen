import type { World } from '../world'
import { computeForce } from './forces'
import { telosChaoticPathSample } from '../phases/telos'

/**
 * Semi-implicit (symplectic) Euler step:
 *   v ← v + (F/m)·dt
 *   p ← p + v·dt
 *
 * Mass is currently 1 for all particles. dt is assumed pre-clamped by the
 * engine loop to a sane upper bound.
 */
export function stepPhysics(world: World, dt: number): void {
  for (const p of world.particles) {
    if (p.state === 'resolving') continue
    if (p.isTelos && world.telosPattern === 'chaotic pattern' && !world.chaoticIntroComplete) {
      const sample = telosChaoticPathSample(world, world.telosPathTime)
      p.position.x = sample.position.x
      p.position.y = sample.position.y
      p.velocity.x = sample.velocity.x * world.telosPathSpeedMultiplier
      p.velocity.y = sample.velocity.y * world.telosPathSpeedMultiplier
      continue
    }

    const F = computeForce(world, p)
    p.velocity.x += F.x * dt
    p.velocity.y += F.y * dt
    p.position.x += p.velocity.x * dt
    p.position.y += p.velocity.y * dt
  }
}
