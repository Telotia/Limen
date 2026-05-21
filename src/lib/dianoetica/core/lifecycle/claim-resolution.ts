import type { ClaimVerdict, Particle } from '../particle'
import type { World } from '../world'
import { DEATH_HUE, DEATH_LIGHT, DEATH_SAT, PROVEN_HUE, PROVEN_LIGHT, PROVEN_SAT } from '../color/palette'
import { smoothstep } from '../../utils/easings'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'
import { telosChaoticPathSample } from '../phases/telos'

const TAU = Math.PI * 2

export function beginResolving(p: Particle, verdict: ClaimVerdict, world: World): void {
  if (p.state === 'resolving') return
  const duration = world.telosPattern === 'chaotic pattern'
    ? TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticResolution.durationSeconds
    : TELOS_PATTERN_CONFIG.circle.circleResolution.durationSeconds
  p.state = 'resolving'
  p.verdict = verdict
  p.resolutionProgress = 0
  p.resolutionDuration = duration
  p.absorbFrom = { x: p.position.x, y: p.position.y }
  p.absorbTangent = { x: p.velocity.x, y: p.velocity.y }
  p.absorbAngularVelocity = null
}

export function advanceResolution(
  p: Particle,
  telos: Particle,
  world: World,
  dt: number,
): boolean {
  if (p.state !== 'resolving') return false
  p.resolutionProgress = Math.min(1, p.resolutionProgress + dt / p.resolutionDuration)
  if (world.telosPattern === 'chaotic pattern') {
    return advanceChaoticResolution(p, telos, world, dt)
  }

  const config = TELOS_PATTERN_CONFIG.circle.circleResolution

  const dx = p.position.x - world.center.x
  const dy = p.position.y - world.center.y
  const r = Math.hypot(dx, dy) || 1
  const rHatX = dx / r
  const rHatY = dy / r
  const angle = Math.atan2(dy, dx)
  const currentOmega = angularVelocity(p, rHatX, rHatY, r)
  const originalOmega = initializeOriginalOmega(p, rHatX, rHatY, r, world)
  const direction: 1 | -1 = originalOmega < 0 ? -1 : 1

  const telosDx = telos.position.x - world.center.x
  const telosDy = telos.position.y - world.center.y
  const telosRadius = Math.hypot(telosDx, telosDy) || world.baseRadius
  const telosAngle = Math.atan2(telosDy, telosDx)
  const telosOmega = angularVelocity(telos, telosDx / telosRadius, telosDy / telosRadius, telosRadius)
  const angularGap = angleDeltaAlongDirection(
    angle,
    telosAngle,
    direction,
  )
  const radialGap = telosRadius - r

  if (isTouchingTelos(p, telos, config.telosContactRadiusFactor, config.claimContactRadiusFactor)) {
    return true
  }

  const pullT = smoothstep(
    (p.resolutionProgress - config.verdictRevealProgress) / (1 - config.verdictRevealProgress),
  )
  const originalAbsOmega = Math.abs(originalOmega)
  const telosAbsOmega = Math.max(Math.abs(telosOmega), world.baseAngularVelocity)
  const remainingTime = Math.max(0.16, (1 - p.resolutionProgress) * p.resolutionDuration)
  const targetAbsOmega = clamp(
    telosAbsOmega + angularGap / remainingTime,
    originalAbsOmega * (config.minAngularSpeedFactor + 0.35 * pullT),
    originalAbsOmega * config.maxAngularSpeedFactor,
  )
  const targetOmega = direction * targetAbsOmega
  const omegaSteer = Math.min(1, config.angularSteerRate * pullT * dt)
  const nextOmega = currentOmega + (targetOmega - currentOmega) * omegaSteer

  const currentRadialSpeed = p.velocity.x * rHatX + p.velocity.y * rHatY
  const maxRadialSpeed = Math.max(
    world.baseRadius * 0.18,
    Math.abs(nextOmega) * r * config.maxRadialSpeedFactor,
  )
  const targetRadialSpeed = clamp(
    radialGap * config.radialSteerRate * pullT,
    -maxRadialSpeed,
    maxRadialSpeed,
  )
  const radialSteer = Math.min(1, config.radialSteerRate * pullT * dt)
  const nextRadialSpeed =
    currentRadialSpeed + (targetRadialSpeed - currentRadialSpeed) * radialSteer

  const maxRadiusOffset = world.baseRadius * config.maxRadiusOffsetFactor
  const nextRadius = clamp(
    r + nextRadialSpeed * dt,
    telosRadius - maxRadiusOffset,
    telosRadius + maxRadiusOffset,
  )
  const nextAngle = angle + nextOmega * dt
  const nextRHatX = Math.cos(nextAngle)
  const nextRHatY = Math.sin(nextAngle)
  const nextTHatX = -nextRHatY
  const nextTHatY = nextRHatX
  const nextTangentialSpeed = nextOmega * nextRadius

  p.position.x = world.center.x + nextRHatX * nextRadius
  p.position.y = world.center.y + nextRHatY * nextRadius
  p.velocity.x = nextRHatX * nextRadialSpeed + nextTHatX * nextTangentialSpeed
  p.velocity.y = nextRHatY * nextRadialSpeed + nextTHatY * nextTangentialSpeed

  return isTouchingTelos(p, telos, config.telosContactRadiusFactor, config.claimContactRadiusFactor)
}

export function resolutionDisplay(p: Particle, world: World): {
  h: number
  s: number
  l: number
  alpha: number
  radiusScale: number
} {
  const revealProgress = world.telosPattern === 'chaotic pattern'
    ? TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticResolution.verdictRevealProgress
    : TELOS_PATTERN_CONFIG.circle.circleResolution.verdictRevealProgress
  const verdict = p.verdict ?? 'falsified'
  const target = verdict === 'proven'
    ? { h: PROVEN_HUE, s: PROVEN_SAT, l: PROVEN_LIGHT }
    : { h: DEATH_HUE, s: DEATH_SAT, l: DEATH_LIGHT }

  const t = p.resolutionProgress
  const colorT = smoothstep(t / revealProgress)
  const shrinkT = smoothstep(
    (t - revealProgress) / (1 - revealProgress),
  )
  const minRadiusScale = clamp(p.bornRadius / Math.max(p.radius, 0.001), 0, 1)
  const radiusScale = lerp(1, minRadiusScale, shrinkT)

  return {
    h: lerpHue(p.displayColor.h, target.h, colorT),
    s: lerp(p.displayColor.s, target.s, colorT),
    l: lerp(p.displayColor.l, target.l, colorT),
    alpha: 1,
    radiusScale,
  }
}

function advanceChaoticResolution(
  p: Particle,
  telos: Particle,
  world: World,
  dt: number,
): boolean {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticResolution
  if (isTouchingTelos(p, telos, config.telosContactRadiusFactor, config.claimContactRadiusFactor)) {
    return true
  }

  const pullT = smoothstep(
    (p.resolutionProgress - config.verdictRevealProgress) / (1 - config.verdictRevealProgress),
  )
  const liveTelosT = smoothstep(
    (p.resolutionProgress - config.liveTelosBlendStartProgress) /
      (1 - config.liveTelosBlendStartProgress),
  )
  const t = world.telosPathTime
  const lagSlot = p.orbitSpeedPhase / 100
  const initialLag = config.minLagSeconds + config.lagSpreadSeconds * lagSlot
  const lag = initialLag * (1 - pullT)
  const sample = telosChaoticPathSample(world, Math.max(0, t - lag))
  const speed = Math.hypot(sample.velocity.x, sample.velocity.y) || 1
  const normalX = -sample.velocity.y / speed
  const normalY = sample.velocity.x / speed
  const side = p.id % 2 === 0 ? 1 : -1
  const offset =
    world.baseRadius *
    (config.offsetMinRadiusFactor + config.offsetSpreadRadiusFactor * lagSlot) *
    (1 - pullT) *
    side

  const pathTargetX = sample.position.x + normalX * offset
  const pathTargetY = sample.position.y + normalY * offset
  const targetX = lerp(pathTargetX, telos.position.x, liveTelosT)
  const targetY = lerp(pathTargetY, telos.position.y, liveTelosT)
  const targetVx = lerp(sample.velocity.x, telos.velocity.x, liveTelosT)
  const targetVy = lerp(sample.velocity.y, telos.velocity.y, liveTelosT)

  const ax = config.kP * (targetX - p.position.x) + config.kD * (targetVx - p.velocity.x)
  const ay = config.kP * (targetY - p.position.y) + config.kD * (targetVy - p.velocity.y)
  p.velocity.x += ax * dt
  p.velocity.y += ay * dt
  p.position.x += p.velocity.x * dt
  p.position.y += p.velocity.y * dt

  return p.resolutionProgress >= 1 ||
    isTouchingTelos(p, telos, config.telosContactRadiusFactor, config.claimContactRadiusFactor)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpHue(from: number, to: number, t: number): number {
  const delta = ((((to - from) % 360) + 540) % 360) - 180
  return (from + delta * t + 360) % 360
}

function angleDeltaAlongDirection(from: number, to: number, direction: 1 | -1): number {
  const positive = ((to - from) % TAU + TAU) % TAU
  return direction === 1 ? positive : (TAU - positive) % TAU
}

function initializeOriginalOmega(
  p: Particle,
  rHatX: number,
  rHatY: number,
  r: number,
  world: World,
): number {
  if (p.absorbAngularVelocity !== null) return p.absorbAngularVelocity
  const tangent = p.absorbTangent ?? p.velocity
  const omega = (tangent.x * -rHatY + tangent.y * rHatX) / r
  const fallback = world.baseAngularVelocity
  p.absorbAngularVelocity = Math.abs(omega) < fallback * 0.35 ? fallback : omega
  return p.absorbAngularVelocity
}

function angularVelocity(
  p: Particle,
  rHatX: number,
  rHatY: number,
  r: number,
): number {
  return (p.velocity.x * -rHatY + p.velocity.y * rHatX) / r
}

function isTouchingTelos(
  p: Particle,
  telos: Particle,
  telosContactRadiusFactor: number,
  claimContactRadiusFactor: number,
): boolean {
  const dx = telos.position.x - p.position.x
  const dy = telos.position.y - p.position.y
  const visualContactDistance =
    telos.radius * telosContactRadiusFactor + p.radius * claimContactRadiusFactor
  return Math.hypot(dx, dy) <= visualContactDistance
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
