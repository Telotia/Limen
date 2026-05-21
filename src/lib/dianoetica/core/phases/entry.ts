import type { Vec2 } from '../physics/vector'
import type { World } from '../world'
import type { Particle } from '../particle'
import { smoothNoise } from '../../utils/random'

const PERTURB_AMPLITUDE = 35
const K_VX = 5
const K_PY = 18
const K_DY = 7

export const entrySpeed = (world: World): number => world.width / 7

/**
 * Entry-phase force field for a single particle.
 *
 * - x: damped pull toward a constant rightward target velocity.
 * - y: damped spring toward an irregularly-perturbed target y position.
 *
 * The perturbation is slow smooth noise — the particle wobbles vertically
 * around the centerline as it crosses to x = width/3.
 */
export function entryForce(world: World, p: Particle): Vec2 {
  const V_entry = entrySpeed(world)
  const yTarget =
    world.center.y +
    PERTURB_AMPLITUDE * smoothNoise(world.time, p.colorPhase + 7.2, 0.9)

  const fx = K_VX * (V_entry - p.velocity.x)
  const fy = K_PY * (yTarget - p.position.y) - K_DY * p.velocity.y

  return { x: fx, y: fy }
}
