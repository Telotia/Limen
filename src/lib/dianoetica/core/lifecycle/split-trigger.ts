import type { Particle } from '../particle'
import type { World } from '../world'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'

const RADIUS_READY_FRACTION = 0.995

/**
 * A particle is ready to split when it has grown to (essentially) its
 * maxRadius and has lived long enough that splitting again feels organic
 * rather than runaway.
 */
export const isReadyToSplit = (p: Particle, world: World): boolean => {
  const lifecycle = TELOS_PATTERN_CONFIG[world.telosPattern].particleLifecycle
  return p.state === 'alive' &&
    !p.isTelos && // Telos never splits — he's the unmoved center
    p.age >= lifecycle.minAgeBeforeSplitSeconds &&
    p.radius >= p.maxRadius * RADIUS_READY_FRACTION
}
