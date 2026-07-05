import type { Vec2 } from './physics/vector'
import { clone, zero } from './physics/vector'
import { type Hsl, pickInitialCoolColor, goldColor } from './color/palette'
import { TrailBuffer } from './trail/trail-buffer'
import { randomRange } from '../utils/random'
import { TELOS_TRAIL_BUFFER_CAPACITY } from './patterns/telos-pattern-config'

export type ClaimVerdict = 'falsified' | 'proven'
export type ParticleState = 'alive' | 'resolving'

export interface Particle {
  id: number
  position: Vec2
  velocity: Vec2
  /** Constant 1 for prototype; included for future-proofing. */
  mass: number

  /** True for the unique central "Telos" particle. Excluded from the
   *  lifecycle entirely (no growth, no split, no terminal verdict, no color drift). */
  isTelos: boolean

  /** Current displayed radius (CSS px). Grows over time toward maxRadius. */
  radius: number
  /** Birth size. */
  bornRadius: number
  /** Size at which the particle is eligible to split. */
  maxRadius: number
  /** Seconds-of-age over which the particle grows from bornRadius to maxRadius. */
  growthDuration: number

  age: number

  baseColor: Hsl
  displayColor: Hsl
  /** Phase offset for color-drift noise; unique per particle. */
  colorPhase: number

  /** Phase offsets for orbital noise (speed and radius); unique per particle. */
  orbitSpeedPhase: number
  orbitRadiusPhase: number

  /** +1 or -1: used during helix phase to oscillate above/below midline. */
  helixSign: 1 | -1

  state: ParticleState
  /** Final verdict when the claim is being absorbed into Telos. */
  verdict: ClaimVerdict | null
  /** 0 → 1 progress through the absorption animation. */
  resolutionProgress: number
  /** Seconds the absorption animation lasts. */
  resolutionDuration: number
  /** Position where the absorption began; target is the live Telos position. */
  absorbFrom: Vec2 | null
  /** Tangent velocity captured when the inward absorption curve begins. */
  absorbTangent: Vec2 | null
  /** Signed angular velocity captured when claim absorption begins. */
  absorbAngularVelocity: number | null

  trail: TrailBuffer
}

const TRAIL_CAPACITY_SUB = 520
/**
 * Telos uses the maximum pattern buffer capacity so the animation can switch
 * between circle and chaotic modes without reallocating the particle.
 */
const TRAIL_CAPACITY_TELOS = TELOS_TRAIL_BUFFER_CAPACITY

let _nextId = 1

export interface CreateParticleOptions {
  position: Vec2
  velocity?: Vec2
  bornRadius?: number
  maxRadius?: number
  growthDuration?: number
  helixSign?: 1 | -1
  color?: Hsl
  isTelos?: boolean
}

export function createParticle(opts: CreateParticleOptions): Particle {
  const isTelos = opts.isTelos ?? false
  const baseColor =
    opts.color ?? (isTelos ? goldColor() : pickInitialCoolColor())
  const bornRadius = opts.bornRadius ?? (isTelos ? 11 : 2)
  const maxRadius = opts.maxRadius ?? (isTelos ? 11 : randomRange(7, 10))
  const growthDuration = opts.growthDuration ?? (isTelos ? 1 : randomRange(2.5, 5))

  return {
    id: _nextId++,
    position: clone(opts.position),
    velocity: opts.velocity ? clone(opts.velocity) : zero(),
    mass: 1,
    isTelos,
    radius: bornRadius,
    bornRadius,
    maxRadius,
    growthDuration,
    age: 0,
    baseColor,
    displayColor: { ...baseColor },
    colorPhase: Math.random() * 100,
    orbitSpeedPhase: Math.random() * 100,
    orbitRadiusPhase: Math.random() * 100,
    helixSign: opts.helixSign ?? 1,
    state: 'alive',
    verdict: null,
    resolutionProgress: 0,
    resolutionDuration: 0.95,
    absorbFrom: null,
    absorbTangent: null,
    absorbAngularVelocity: null,
    trail: new TrailBuffer(isTelos ? TRAIL_CAPACITY_TELOS : TRAIL_CAPACITY_SUB),
  }
}
