import type { Vec2 } from './vector'
import type { World, Phase } from '../world'
import type { Particle } from '../particle'
import { smoothstep } from '../../utils/easings'
import { entryForce } from '../phases/entry'
import { helixForce } from '../phases/helix'
import { orbitForce } from '../phases/orbit'
import { telosHelixForce, telosOrbitForce } from '../phases/telos'

/**
 * Top-level force composition. During a phase transition, the force on each
 * particle is a smoothstep-blended sum of the two phases' forces, which
 * keeps acceleration (and therefore velocity and position) continuous.
 */
export function computeForce(world: World, p: Particle): Vec2 {
  if (world.transition) {
    const blend = smoothstep(world.transition.elapsed / world.transition.duration)
    const fFrom = forceForPhase(world.transition.from, world, p)
    const fTo = forceForPhase(world.transition.to, world, p)
    return {
      x: fFrom.x + (fTo.x - fFrom.x) * blend,
      y: fFrom.y + (fTo.y - fFrom.y) * blend,
    }
  }
  return forceForPhase(world.phase, world, p)
}

function forceForPhase(phase: Phase, world: World, p: Particle): Vec2 {
  if (p.isTelos) {
    switch (phase) {
      case 'entry':
        return entryForce(world, p)
      case 'helix':
        return telosHelixForce(world, p)
      case 'orbit':
        return telosOrbitForce(world, p)
    }
  }
  switch (phase) {
    case 'entry':
      return entryForce(world, p)
    case 'helix':
      return helixForce(world, p)
    case 'orbit':
      return orbitForce(world, p)
  }
}
