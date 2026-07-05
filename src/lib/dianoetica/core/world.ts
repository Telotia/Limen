import type { Vec2 } from './physics/vector'
import type { Particle } from './particle'
import type { Burst } from './effects/burst'
import { TELOS_PATTERN_CONFIG } from './patterns/telos-pattern-config'

export type Phase = 'entry' | 'helix' | 'orbit'

export interface PhaseTransition {
  from: Phase
  to: Phase
  /** Elapsed seconds since transition started. */
  elapsed: number
  /** Total duration of the transition window (seconds). */
  duration: number
}

export interface World {
  /** CSS pixel dimensions (matches canvas.clientWidth/Height). */
  width: number
  height: number
  center: Vec2
  backgroundColor: string
  telosPattern: TelosPattern
  telosPathTime: number
  telosPathStartOffset: number
  chaoticIntroPathTime: number
  telosPathSpeedMultiplier: number
  chaoticIntroComplete: boolean

  /** Reference orbital radius (CSS px). */
  baseRadius: number
  /** Reference angular velocity (rad/s); positive = counter-clockwise. */
  baseAngularVelocity: number

  particles: Particle[]
  maxParticles: number

  bursts: Burst[]

  phase: Phase
  /** Seconds spent in the current phase. */
  phaseTime: number
  transition: PhaseTransition | null

  /** Absolute simulation time in seconds. */
  time: number

  /** world.time at which helix phase began. Used by helix-phase forces so
   *  that "time since helix start" stays correct even while the orbit-phase
   *  transition is blending. Set when entry→helix begins. */
  helixStartedAt: number

  /** world.time at which orbit phase began. Used by telos-orbit force so
   *  the gold particle's stately motion has a stable phase reference even
   *  during the helix→orbit transition. Set when helix→orbit begins. */
  orbitStartedAt: number

  /** Cooldown timer for terminal claim verdicts (seconds until next attempt). */
  cullCooldown: number
}

export interface CanvasMetrics {
  width: number
  height: number
}

export const DEFAULT_BACKGROUND_COLOR = '#050a1f'
export const DEFAULT_TELOS_PATTERN: TelosPattern = 'circle'

export type WorldCenter = Vec2 | ((metrics: CanvasMetrics) => Vec2)
export type WorldRadius = number | ((metrics: CanvasMetrics) => number)
export type TelosPattern = 'circle' | 'chaotic pattern'

export function createWorld(
  metrics: CanvasMetrics,
  centerOption?: WorldCenter,
  radiusOption?: WorldRadius,
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  telosPattern: TelosPattern = DEFAULT_TELOS_PATTERN,
): World {
  const center = resolveCenter(metrics, centerOption)
  const baseRadius = resolveRadius(metrics, radiusOption)

  return {
    width: metrics.width,
    height: metrics.height,
    center,
    backgroundColor,
    telosPattern,
    telosPathTime: 0,
    telosPathStartOffset: 0,
    chaoticIntroPathTime: 0,
    telosPathSpeedMultiplier: 1,
    chaoticIntroComplete: telosPattern !== 'chaotic pattern',
    baseRadius,
    baseAngularVelocity: 0.55, // rad/s, ~11.4s per full orbit
    particles: [],
    maxParticles: TELOS_PATTERN_CONFIG[telosPattern].maxParticles,
    bursts: [],
    phase: 'entry',
    phaseTime: 0,
    transition: null,
    time: 0,
    helixStartedAt: Infinity,
    orbitStartedAt: Infinity,
    cullCooldown: 3,
  }
}

export function resizeWorld(
  world: World,
  metrics: CanvasMetrics,
  centerOption?: WorldCenter,
  radiusOption?: WorldRadius,
): void {
  world.width = metrics.width
  world.height = metrics.height
  const center = resolveCenter(metrics, centerOption)
  world.center.x = center.x
  world.center.y = center.y
  world.baseRadius = resolveRadius(metrics, radiusOption)
}

function resolveCenter(metrics: CanvasMetrics, centerOption?: WorldCenter): Vec2 {
  if (!centerOption) return { x: metrics.width / 2, y: metrics.height / 2 }
  return typeof centerOption === 'function'
    ? centerOption(metrics)
    : { x: centerOption.x, y: centerOption.y }
}

function resolveRadius(metrics: CanvasMetrics, radiusOption?: WorldRadius): number {
  const radius = typeof radiusOption === 'function'
    ? radiusOption(metrics)
    : radiusOption ?? Math.min(metrics.width, metrics.height) * 0.28
  return Math.max(1, radius)
}
