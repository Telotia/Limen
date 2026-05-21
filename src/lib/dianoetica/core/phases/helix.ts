import type { Vec2 } from '../physics/vector'
import type { World } from '../world'
import type { Particle } from '../particle'
import { smoothstep } from '../../utils/easings'

const HELIX_OMEGA = Math.PI // rad/s — ~1 full cycle every 2s
const AMPLITUDE_RAMP_S = 0.6
const K_P = 16
const K_D = 7

export const helixSpeed = (world: World): number => world.width / 10
export const helixStartX = (world: World): number => world.width / 3

/**
 * Helix-phase force field. Each particle tracks a moving target on a
 * sinusoidal curve; helixSign (+1 or -1) selects which strand. Both strands
 * move rightward at the same x speed; their y components oscillate in
 * antiphase, giving a DNA-projection look.
 *
 * Implemented as a critically-damped second-order tracker:
 *   F = K_P · (target_pos - p.pos) + K_D · (target_vel - p.vel)
 * which keeps acceleration smooth and position/velocity continuous across
 * the entry → helix transition.
 */
export function helixForce(world: World, p: Particle): Vec2 {
  // Use the world-time reference so the helix curve keeps progressing even
  // while the helix→orbit transition is blending. (world.phaseTime resets
  // to zero the moment 'orbit' becomes the active phase, which would
  // restart the sine from t=0 and pull particles back to the midline.)
  const t = Math.max(0, world.time - world.helixStartedAt)
  const ampRamp = smoothstep(t / AMPLITUDE_RAMP_S)
  const A = world.baseRadius * ampRamp
  const V = helixSpeed(world)
  const sign = p.helixSign

  const omegaT = HELIX_OMEGA * t
  const sinTerm = Math.sin(omegaT)
  const cosTerm = Math.cos(omegaT)

  const target_x = helixStartX(world) + V * t
  const target_y = world.center.y + sign * A * sinTerm
  const target_vx = V
  const target_vy = sign * A * HELIX_OMEGA * cosTerm

  const fx = K_P * (target_x - p.position.x) + K_D * (target_vx - p.velocity.x)
  const fy = K_P * (target_y - p.position.y) + K_D * (target_vy - p.velocity.y)

  return { x: fx, y: fy }
}
