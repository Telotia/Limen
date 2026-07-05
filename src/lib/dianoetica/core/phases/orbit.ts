import type { Vec2 } from '../physics/vector'
import type { World } from '../world'
import type { Particle } from '../particle'
import { smoothNoise } from '../../utils/random'
import { telosChaoticPathSample } from './telos'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'

const TAU = Math.PI * 2

/**
 * Orbit-phase force field — the steady-state animation.
 *
 * Decomposes the particle's velocity into radial and tangential components
 * and applies independent springs:
 *   - radial:     pulls |p − C| toward R_target (slightly noisy per-particle)
 *                 with damping on the radial velocity to allow soft "breathing"
 *   - tangential: pulls v_t toward ω · r (also slightly noisy per-particle)
 *
 * Because tangential and radial forces are independent, the orbit never has
 * to "fight" itself — radial drift just relaxes back to R while tangential
 * speed stays clean.
 */
export function orbitForce(world: World, p: Particle): Vec2 {
  if (world.telosPattern === 'chaotic pattern') {
    return chaoticFollowerForce(world, p)
  }
  const config = TELOS_PATTERN_CONFIG.circle.circleFollower

  const dx = p.position.x - world.center.x
  const dy = p.position.y - world.center.y
  const r = Math.hypot(dx, dy)

  if (r < 1) {
    // Degenerate case (particle near center). Push outward arbitrarily;
    // shouldn't happen in steady state.
    return { x: 120, y: 0 }
  }

  const rHatX = dx / r
  const rHatY = dy / r
  // perp((rHatX, rHatY)) = (-rHatY, rHatX) — CCW math, which is CW on a
  // screen-y-down canvas. Either rotation direction is acceptable per spec.
  const tHatX = -rHatY
  const tHatY = rHatX

  const nR = smoothNoise(world.time, p.orbitRadiusPhase, config.radiusNoiseFrequency)
  const nV = smoothNoise(world.time, p.orbitSpeedPhase, config.speedNoiseFrequency)

  const r_target = world.baseRadius * (1 + config.radiusNoiseAmplitude * nR)
  const omega_target = followerOmegaTarget(world, p, Math.atan2(dy, dx), nV)
  const v_t_target = omega_target * r

  const v_t_current = p.velocity.x * tHatX + p.velocity.y * tHatY
  const v_r_current = p.velocity.x * rHatX + p.velocity.y * rHatY

  const f_r_mag = config.radialSpring * (r_target - r) - config.radialDamping * v_r_current
  const f_t_mag = config.tangentialVelocityCorrection * (v_t_target - v_t_current)

  return {
    x: f_r_mag * rHatX + f_t_mag * tHatX,
    y: f_r_mag * rHatY + f_t_mag * tHatY,
  }
}

function chaoticFollowerForce(world: World, p: Particle): Vec2 {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticFollower
  const t = world.telosPathTime
  const lagSlot = p.orbitSpeedPhase / 100
  const lag =
    config.minLagSeconds +
    config.lagSpreadSeconds * lagSlot +
    config.lagNoiseAmplitude *
      smoothNoise(
        world.time,
        p.orbitSpeedPhase + config.lagNoisePhaseOffset,
        config.lagNoiseFrequency,
      )
  const sample = telosChaoticPathSample(world, Math.max(0, t - lag))

  const speed = Math.hypot(sample.velocity.x, sample.velocity.y) || 1
  const normalX = -sample.velocity.y / speed
  const normalY = sample.velocity.x / speed
  const side = p.id % 2 === 0 ? 1 : -1
  const offset =
    world.baseRadius *
    (config.offsetMinRadiusFactor + config.offsetSpreadRadiusFactor * lagSlot) *
    side
  const tx = sample.position.x + normalX * offset
  const ty = sample.position.y + normalY * offset

  return {
    x: config.kP * (tx - p.position.x) +
      config.kD * (sample.velocity.x - p.velocity.x),
    y: config.kP * (ty - p.position.y) +
      config.kD * (sample.velocity.y - p.velocity.y),
  }
}

function followerOmegaTarget(
  world: World,
  p: Particle,
  currentAngle: number,
  speedNoise: number,
): number {
  const config = TELOS_PATTERN_CONFIG.circle.circleFollower
  const telosAngle = currentTelosAngle(world)
  const lagSlot = p.orbitSpeedPhase / 100
  const lag =
    config.minLagRad +
    config.lagSpreadRad * lagSlot +
    config.lagWobbleRad * smoothNoise(world.time, p.orbitSpeedPhase + 41.3, 0.2)
  const targetAngle = telosAngle - lag
  const angleError = signedAngleDelta(currentAngle, targetAngle)
  const softenedError = softenAngleError(angleError)
  const noisyOmega = world.baseAngularVelocity * (1 + config.speedNoiseAmplitude * speedNoise)
  const omega = noisyOmega + softenedError * config.catchupRate

  return clamp(
    omega,
    world.baseAngularVelocity * config.minOmegaFactor,
    world.baseAngularVelocity * config.maxOmegaFactor,
  )
}

function currentTelosAngle(world: World): number {
  const telos = world.particles.find((candidate) => candidate.isTelos)
  if (telos) {
    const dx = telos.position.x - world.center.x
    const dy = telos.position.y - world.center.y
    if (Math.hypot(dx, dy) > 1) return Math.atan2(dy, dx)
  }
  return Math.max(0, world.time - world.orbitStartedAt) * world.baseAngularVelocity
}

function signedAngleDelta(from: number, to: number): number {
  return ((((to - from) % TAU) + Math.PI + TAU) % TAU) - Math.PI
}

function softenAngleError(error: number): number {
  const { errorSoftness } = TELOS_PATTERN_CONFIG.circle.circleFollower
  return error / (1 + Math.abs(error) * errorSoftness)
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
