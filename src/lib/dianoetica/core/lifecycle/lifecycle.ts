import type { World } from '../world'
import type { Particle } from '../particle'
import { updateGrowth } from './growth'
import { isReadyToSplit } from './split-trigger'
import { maybeChooseResolvedClaim } from './cull'
import { advanceResolution, beginResolving, resolutionDisplay } from './claim-resolution'
import { splitOrbital } from '../physics/split-impulse'
import { createBurst, createKnowledgeBurst } from '../effects/burst'

/**
 * Lifecycle is only active in the steady orbit phase (not during entry,
 * helix, or any phase transition). Entry/helix particles are scripted by
 * the phase machine and shouldn't grow/split/die.
 */
export function updateLifecycle(world: World, dt: number): void {
  const stableOrbit = world.phase === 'orbit' && world.transition === null
  if (!stableOrbit) return
  if (world.telosPattern === 'chaotic pattern' && !world.chaoticIntroComplete) return

  updateGrowth(world.particles, dt)

  const resolution = maybeChooseResolvedClaim(world, dt)
  if (resolution) beginResolving(resolution.particle, resolution.verdict, world)

  // Build the next particles list. We mutate world.particles to this array
  // at the end. Tracking currentCount lets us cap splits at maxParticles.
  let currentCount = world.particles.length
  const next: Particle[] = []
  const telos = world.particles.find((p) => p.isTelos)

  for (const p of world.particles) {
    if (p.state === 'resolving') {
      if (telos && advanceResolution(p, telos, world, dt)) {
        const color = resolutionDisplay(p, world)
        world.bursts.push(createKnowledgeBurst(telos.position, color))
        currentCount -= 1
        continue
      }
      next.push(p)
      continue
    }

    const ready = isReadyToSplit(p, world)
    if (ready) {
      if (currentCount < world.maxParticles) {
        const { a, b } = splitOrbital(p, world)
        next.push(a, b)
        currentCount += 1 // net change: remove 1, add 2
        world.bursts.push(createBurst(p.position, p.displayColor))
        continue
      }
      // At cap: the mother waits at maxRadius until a terminal verdict
      // frees a slot on a later frame and she can split then.
    }

    next.push(p)
  }

  world.particles = next
}
