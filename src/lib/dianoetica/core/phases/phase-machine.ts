import type { World } from '../world'
import { createParticle, type Particle } from '../particle'
import { createBurst } from '../effects/burst'
import { randomRange } from '../../utils/random'
import { TELOS_PATTERN_CONFIG } from '../patterns/telos-pattern-config'
import {
  telosChaoticCycleDuration,
  telosChaoticPathSample,
  telosChaoticPathTimeForDistance,
} from './telos'

const ENTRY_TO_HELIX_TRANSITION_S = 0.5
const HELIX_TO_ORBIT_TRANSITION_S = 1.0

/**
 * Y-component impulse at the entry→helix split. Small enough not to look
 * like a hard kick; the helix force completes the divergence over the next
 * fraction of a second.
 */
const HELIX_BIRTH_KICK_Y = 60

export interface PhaseMachine {
  update(dt: number): void
}

export function createPhaseMachine(world: World): PhaseMachine {
  if (world.telosPattern === 'chaotic pattern') {
    seedChaoticIntro(world)
  } else {
    seedCircleEntry(world)
  }

  return {
    update(dt: number): void {
      world.time += dt
      world.phaseTime += dt
      advancePatternClock(world, dt)

      if (world.transition) {
        world.transition.elapsed += dt
        if (world.transition.elapsed >= world.transition.duration) {
          world.transition = null
        }
        return
      }

      checkPhaseEnd(world)
    },
  }
}

function seedCircleEntry(world: World): void {
  // Skip entry + helix; start directly in orbit so no intro animation plays.
  const R = world.baseRadius
  const omega = world.baseAngularVelocity
  const startAngle = -Math.PI / 2  // top of orbit

  // Telos placed on orbit circle, tangential velocity (CCW)
  const telos = createParticle({
    position: {
      x: world.center.x + R * Math.cos(startAngle),
      y: world.center.y + R * Math.sin(startAngle),
    },
    velocity: {
      x: omega * R * -Math.sin(startAngle),
      y: omega * R * Math.cos(startAngle),
    },
    isTelos: true,
  })
  world.particles.push(telos)

  // Two sub-particles at ±0.5 rad offset; orbit force establishes natural lags
  const lifecycle = TELOS_PATTERN_CONFIG.circle.particleLifecycle
  for (const offsetRad of [0.6, -0.6]) {
    const angle = startAngle + offsetRad
    world.particles.push(createParticle({
      position: {
        x: world.center.x + R * Math.cos(angle),
        y: world.center.y + R * Math.sin(angle),
      },
      velocity: {
        x: omega * R * -Math.sin(angle),
        y: omega * R * Math.cos(angle),
      },
      bornRadius: 4,
      growthDuration: randomRange(lifecycle.growthDurationMinSeconds, lifecycle.growthDurationMaxSeconds),
    }))
  }

  world.phase = 'orbit'
  world.phaseTime = 0
  world.transition = null
  world.chaoticIntroComplete = true
  world.telosPathTime = 0
  world.telosPathSpeedMultiplier = 1
  world.helixStartedAt = 0
  world.orbitStartedAt = 0
}

function seedChaoticIntro(world: World): void {
  const intro = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticIntro
  const cycleDuration = telosChaoticCycleDuration(world)
  const responsivePathDistance = Math.min(
    intro.pathDistancePx,
    world.baseRadius * intro.pathDistanceRadiusFactor,
  )
  const introPathTime = telosChaoticPathTimeForDistance(world, responsivePathDistance)
  const introSpeedMultiplier = introPathTime / intro.durationSeconds
  const randomizedStartWindow = Math.max(0, cycleDuration - introPathTime)
  world.chaoticIntroPathTime = introPathTime
  world.telosPathStartOffset = Math.random() * randomizedStartWindow
  world.telosPathTime = world.telosPathStartOffset
  world.telosPathSpeedMultiplier = introSpeedMultiplier
  const sample = telosChaoticPathSample(world, world.telosPathTime)
  const telos = createParticle({
    position: sample.position,
    velocity: {
      x: sample.velocity.x * introSpeedMultiplier,
      y: sample.velocity.y * introSpeedMultiplier,
    },
    isTelos: true,
  })
  world.particles.push(telos)
  world.phase = 'orbit'
  world.phaseTime = 0
  world.transition = null
  world.orbitStartedAt = world.time
  world.chaoticIntroComplete = false
}

function advancePatternClock(world: World, dt: number): void {
  if (world.telosPattern !== 'chaotic pattern' || world.phase !== 'orbit') return

  const config = TELOS_PATTERN_CONFIG['chaotic pattern']
  const intro = config.chaoticIntro
  if (!world.chaoticIntroComplete) {
    const progress = Math.min(1, world.phaseTime / intro.durationSeconds)
    const introSpeedMultiplier = world.chaoticIntroPathTime / intro.durationSeconds
    world.telosPathSpeedMultiplier = introSpeedMultiplier
    world.telosPathTime =
      world.telosPathStartOffset + world.chaoticIntroPathTime * progress
    return
  }

  world.telosPathSpeedMultiplier = 1
  world.telosPathTime += dt
}

function checkPhaseEnd(world: World): void {
  if (world.telosPattern === 'chaotic pattern') {
    maybeFinishChaoticIntro(world)
    return
  }

  if (world.phase === 'entry') {
    const triggerX = world.width / 3
    const telos = world.particles.find((p) => p.isTelos)
    if (telos && telos.position.x >= triggerX) {
      world.bursts.push(createBurst(telos.position, telos.displayColor))
      // Telos persists. We just add two new sub-particles next to him.
      const [subA, subB] = spawnHelixSubParticles(telos)
      world.particles.push(subA, subB)
      world.phase = 'helix'
      world.phaseTime = 0
      world.helixStartedAt = world.time
      world.transition = {
        from: 'entry',
        to: 'helix',
        elapsed: 0,
        duration: ENTRY_TO_HELIX_TRANSITION_S,
      }
    }
    return
  }

  if (world.phase === 'helix') {
    const subs = world.particles.filter((p) => !p.isTelos)
    if (subs.length >= 2) {
      const midX = (subs[0].position.x + subs[1].position.x) / 2
      if (midX >= world.center.x) {
        world.phase = 'orbit'
        world.phaseTime = 0
        world.orbitStartedAt = world.time
        world.transition = {
          from: 'helix',
          to: 'orbit',
          elapsed: 0,
          duration: HELIX_TO_ORBIT_TRANSITION_S,
        }
      }
    }
    return
  }

  // 'orbit' phase has no end condition — it loops forever.
}

function maybeFinishChaoticIntro(world: World): void {
  if (world.chaoticIntroComplete) return

  const config = TELOS_PATTERN_CONFIG['chaotic pattern']
  const telos = world.particles.find((p) => p.isTelos)
  if (!telos || world.phaseTime < config.chaoticIntro.durationSeconds) return

  world.chaoticIntroComplete = true
  world.telosPathSpeedMultiplier = 1
  const sample = telosChaoticPathSample(world, world.telosPathTime)
  telos.position.x = sample.position.x
  telos.position.y = sample.position.y
  telos.velocity.x = sample.velocity.x
  telos.velocity.y = sample.velocity.y
  world.bursts.push(createBurst(telos.position, telos.displayColor))
  const [subA, subB] = spawnChaoticSubParticles(telos, world)
  world.particles.push(subA, subB)
  world.cullCooldown = config.particleLifecycle.cullBaseIntervalSeconds
}

/**
 * Spawn the two helix sub-particles next to Telos. They inherit his
 * x-velocity (so the helix axis continues forward at his pace) and get
 * opposite small ±y kicks to seed the DNA-style oscillation. Their
 * colors are fresh cool tones — they do NOT inherit Telos's gold.
 */
function spawnHelixSubParticles(telos: Particle): [Particle, Particle] {
  const subA = createParticle({
    position: telos.position,
    velocity: { x: telos.velocity.x, y: HELIX_BIRTH_KICK_Y },
    helixSign: 1,
    bornRadius: 4,
  })
  const subB = createParticle({
    position: telos.position,
    velocity: { x: telos.velocity.x, y: -HELIX_BIRTH_KICK_Y },
    helixSign: -1,
    bornRadius: 4,
  })
  return [subA, subB]
}

function spawnChaoticSubParticles(telos: Particle, world: World): [Particle, Particle] {
  const lifecycle = TELOS_PATTERN_CONFIG['chaotic pattern'].particleLifecycle
  const speed = Math.hypot(telos.velocity.x, telos.velocity.y) || 1
  const normalX = -telos.velocity.y / speed
  const normalY = telos.velocity.x / speed
  const offset = world.baseRadius * 0.04

  const subA = createParticle({
    position: {
      x: telos.position.x + normalX * offset,
      y: telos.position.y + normalY * offset,
    },
    velocity: { x: telos.velocity.x, y: telos.velocity.y },
    bornRadius: 4,
    growthDuration: randomRange(
      lifecycle.growthDurationMinSeconds,
      lifecycle.growthDurationMaxSeconds,
    ),
  })
  const subB = createParticle({
    position: {
      x: telos.position.x - normalX * offset,
      y: telos.position.y - normalY * offset,
    },
    velocity: { x: telos.velocity.x, y: telos.velocity.y },
    bornRadius: 4,
    growthDuration: randomRange(
      lifecycle.growthDurationMinSeconds,
      lifecycle.growthDurationMaxSeconds,
    ),
  })

  return [subA, subB]
}
