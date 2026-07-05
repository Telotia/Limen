import type { Vec2 } from '../physics/vector'
import type { World } from '../world'
import type { Particle } from '../particle'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'

const K_P_HELIX = 14
const K_D_HELIX = 7

const LORENZ_PATH = buildLorenzPath()

export interface PathSample {
  position: Vec2
  velocity: Vec2
}

/**
 * Telos in helix phase: glides horizontally from (width/3, midY) to
 * (width/2, midY) at the same x-speed the sub-particles use. No
 * oscillation — the gold axis around which the two strands wrap.
 */
export function telosHelixForce(world: World, p: Particle): Vec2 {
  const t = Math.max(0, world.time - world.helixStartedAt)
  const V = world.width / 10
  const startX = world.width / 3
  const tx = startX + V * t
  const ty = world.center.y

  const fx = K_P_HELIX * (tx - p.position.x) + K_D_HELIX * (V - p.velocity.x)
  const fy = K_P_HELIX * (ty - p.position.y) + K_D_HELIX * (0 - p.velocity.y)
  return { x: fx, y: fy }
}

/**
 * Telos in orbit phase: rides the SAME orbital circle as the sub-particles
 * (same baseRadius, same baseAngularVelocity), but his target is computed
 * directly from a perfect parametric circle — no radial noise, no speed
 * noise. His actual position tracks that target via a position+velocity
 * spring (critically damped), so the trajectory traces out as a clean
 * perfect circle even while sub-particles wobble around their own paths.
 */
export function telosOrbitForce(world: World, p: Particle): Vec2 {
  const t = world.telosPattern === 'chaotic pattern'
    ? world.telosPathTime
    : Math.max(0, world.time - world.orbitStartedAt)
  const sample = telosPathSample(world, t)
  const targetVelocity = world.telosPattern === 'chaotic pattern'
    ? {
        x: sample.velocity.x * world.telosPathSpeedMultiplier,
        y: sample.velocity.y * world.telosPathSpeedMultiplier,
      }
    : sample.velocity
  const spring = TELOS_PATTERN_CONFIG[world.telosPattern].telosSpring

  return springToSample(
    p,
    { position: sample.position, velocity: targetVelocity },
    spring.kP,
    spring.kD,
  )
}

export function telosPathSample(world: World, t: number): PathSample {
  return world.telosPattern === 'chaotic pattern'
    ? telosChaoticPathSample(world, t)
    : circleSample(world, t)
}

export function telosChaoticPathSample(world: World, t: number): PathSample {
  return chaoticPatternSample(world, t)
}

export function telosChaoticCycleDuration(world: World): number {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  return (Math.PI * 2 / world.baseAngularVelocity) * config.cycleOrbits
}

export function telosChaoticPathTimeForDistance(
  world: World,
  distancePx: number,
): number {
  const cycleDuration = telosChaoticCycleDuration(world)
  const cycleDistance = telosChaoticCycleDistance(world)
  const fraction = clamp(distancePx / Math.max(cycleDistance, 1), 0, 0.95)
  return cycleDuration * fraction
}

function circleSample(world: World, t: number): PathSample {
  const omega = world.baseAngularVelocity
  const R = world.baseRadius
  const cx = world.center.x
  const cy = world.center.y

  const angle = t * omega
  const sinA = Math.sin(angle)
  const cosA = Math.cos(angle)

  const tx = cx + R * cosA
  const ty = cy + R * sinA
  const tvx = -R * omega * sinA
  const tvy = R * omega * cosA

  return {
    position: { x: tx, y: ty },
    velocity: { x: tvx, y: tvy },
  }
}

function chaoticPatternSample(world: World, t: number): PathSample {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  const prevT = Math.max(0, t - config.derivativeStepSeconds)
  const nextT = t + config.derivativeStepSeconds
  const position = chaoticPatternPoint(world, t)
  const prev = chaoticPatternPoint(world, prevT)
  const next = chaoticPatternPoint(world, nextT)
  const dt = nextT - prevT

  return {
    position,
    velocity: {
      x: (next.x - prev.x) / dt,
      y: (next.y - prev.y) / dt,
    },
  }
}

function chaoticPatternPoint(world: World, t: number): Vec2 {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  const cycleDuration = telosChaoticCycleDuration(world)
  const wrapped = ((t / cycleDuration) % 1 + 1) % 1
  const pathPosition = wrapped * LORENZ_PATH.length
  const index = Math.floor(pathPosition)
  const nextIndex = (index + 1) % LORENZ_PATH.length
  const amount = pathPosition - index
  const current = LORENZ_PATH[index]
  const next = LORENZ_PATH[nextIndex]
  const x = lerp(current.x, next.x, amount) * world.baseRadius * config.xScale
  const y = lerp(current.y, next.y, amount) * world.baseRadius * config.yScale

  return {
    x: world.center.x + x,
    y: world.center.y + y,
  }
}

function telosChaoticCycleDistance(world: World): number {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  let distance = 0

  for (let i = 0; i < LORENZ_PATH.length; i++) {
    const current = LORENZ_PATH[i]
    const next = LORENZ_PATH[(i + 1) % LORENZ_PATH.length]
    const dx = (next.x - current.x) * world.baseRadius * config.xScale
    const dy = (next.y - current.y) * world.baseRadius * config.yScale
    distance += Math.hypot(dx, dy)
  }

  return distance
}

function springToSample(
  p: Particle,
  sample: PathSample,
  kP: number,
  kD: number,
): Vec2 {
  return {
    x: kP * (sample.position.x - p.position.x) + kD * (sample.velocity.x - p.velocity.x),
    y: kP * (sample.position.y - p.position.y) + kD * (sample.velocity.y - p.velocity.y),
  }
}

function buildLorenzPath(): Vec2[] {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  let x = 0.1
  let y = 0
  let z = 0
  const raw: Vec2[] = []

  for (let i = 0; i < config.lorenzBurnInSteps + config.lorenzSampleCount; i++) {
    const next = lorenzStep(x, y, z)
    x = next.x
    y = next.y
    z = next.z
    if (i >= config.lorenzBurnInSteps) raw.push({ x, y: z })
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const point of raw) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }

  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const scaleX = 1 / Math.max(Math.abs(minX - midX), Math.abs(maxX - midX), 1)
  const scaleY = 1 / Math.max(Math.abs(minY - midY), Math.abs(maxY - midY), 1)
  const normalized = raw.map((point) => ({
    x: (point.x - midX) * scaleX,
    y: (point.y - midY) * scaleY,
  }))
  const startIndex = normalized.reduce((bestIndex, point, index) => {
    const best = normalized[bestIndex]
    const score = point.x - Math.abs(point.y) * 0.16
    const bestScore = best.x - Math.abs(best.y) * 0.16
    return score > bestScore ? index : bestIndex
  }, 0)

  return normalized.slice(startIndex).concat(normalized.slice(0, startIndex))
}

function lorenzStep(x: number, y: number, z: number): { x: number; y: number; z: number } {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  const k1 = lorenzDerivative(x, y, z)
  const k2 = lorenzDerivative(
    x + k1.x * config.lorenzDt * 0.5,
    y + k1.y * config.lorenzDt * 0.5,
    z + k1.z * config.lorenzDt * 0.5,
  )
  const k3 = lorenzDerivative(
    x + k2.x * config.lorenzDt * 0.5,
    y + k2.y * config.lorenzDt * 0.5,
    z + k2.z * config.lorenzDt * 0.5,
  )
  const k4 = lorenzDerivative(
    x + k3.x * config.lorenzDt,
    y + k3.y * config.lorenzDt,
    z + k3.z * config.lorenzDt,
  )

  return {
    x: x + (config.lorenzDt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: y + (config.lorenzDt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: z + (config.lorenzDt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  }
}

function lorenzDerivative(x: number, y: number, z: number): { x: number; y: number; z: number } {
  const config = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticPath
  return {
    x: config.lorenzSigma * (y - x),
    y: x * (config.lorenzRho - z) - y,
    z: x * y - config.lorenzBeta * z,
  }
}

function lerp(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
