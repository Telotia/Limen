import type { TelosPattern } from '../world'

interface SpringConfig {
  kP: number
  kD: number
}

interface CircleFollowerConfig {
  radialSpring: number
  radialDamping: number
  tangentialVelocityCorrection: number
  radiusNoiseAmplitude: number
  speedNoiseAmplitude: number
  radiusNoiseFrequency: number
  speedNoiseFrequency: number
  minLagRad: number
  lagSpreadRad: number
  lagWobbleRad: number
  catchupRate: number
  errorSoftness: number
  minOmegaFactor: number
  maxOmegaFactor: number
}

interface ChaoticPathConfig {
  derivativeStepSeconds: number
  cycleOrbits: number
  xScale: number
  yScale: number
  lorenzSampleCount: number
  lorenzBurnInSteps: number
  lorenzDt: number
  lorenzSigma: number
  lorenzRho: number
  lorenzBeta: number
}

interface ChaoticIntroConfig {
  durationSeconds: number
  pathDistancePx: number
  pathDistanceRadiusFactor: number
}

interface ParticleLifecycleConfig {
  growthDurationMinSeconds: number
  growthDurationMaxSeconds: number
  minAgeBeforeSplitSeconds: number
  cullBaseIntervalSeconds: number
}

interface ChaoticFollowerConfig {
  kP: number
  kD: number
  minLagSeconds: number
  lagSpreadSeconds: number
  lagNoiseAmplitude: number
  lagNoiseFrequency: number
  lagNoisePhaseOffset: number
  offsetMinRadiusFactor: number
  offsetSpreadRadiusFactor: number
}

interface CircleResolutionConfig {
  durationSeconds: number
  verdictRevealProgress: number
  minAngularSpeedFactor: number
  maxAngularSpeedFactor: number
  angularSteerRate: number
  radialSteerRate: number
  maxRadialSpeedFactor: number
  maxRadiusOffsetFactor: number
  telosContactRadiusFactor: number
  claimContactRadiusFactor: number
}

interface ChaoticResolutionConfig {
  durationSeconds: number
  verdictRevealProgress: number
  kP: number
  kD: number
  minLagSeconds: number
  lagSpreadSeconds: number
  offsetMinRadiusFactor: number
  offsetSpreadRadiusFactor: number
  liveTelosBlendStartProgress: number
  telosContactRadiusFactor: number
  claimContactRadiusFactor: number
}

interface TelosTrailConfig {
  headWidth: number
  tailWidth: number
  tailAlpha: number
  chunkCount: number
  renderSamples: number
  visibleSamples: number
  bufferCapacity: number
  radiusScaleReference?: number
  radiusScaleMax?: number
}

interface TelosPatternConfig {
  telosSpring: SpringConfig
  trail: TelosTrailConfig
  particleLifecycle: ParticleLifecycleConfig
  maxParticles: number
  circleFollower?: CircleFollowerConfig
  chaoticIntro?: ChaoticIntroConfig
  chaoticPath?: ChaoticPathConfig
  chaoticFollower?: ChaoticFollowerConfig
  circleResolution?: CircleResolutionConfig
  chaoticResolution?: ChaoticResolutionConfig
}

export const TELOS_PATTERN_CONFIG = {
  circle: {
    telosSpring: {
      kP: 4,
      kD: 3.5,
    },
    trail: {
      headWidth: 3.5,
      tailWidth: 0.6,
      tailAlpha: 0.10,     // visible but fades — arc legible without closing into a ring
      chunkCount: 24,
      renderSamples: 900,
      visibleSamples: 590, // ~65% of orbit arc — partial open arc, not a closed ring
      bufferCapacity: 960,
    },
    particleLifecycle: {
      growthDurationMinSeconds: 2.5,
      growthDurationMaxSeconds: 5,
      minAgeBeforeSplitSeconds: 1.2,
      cullBaseIntervalSeconds: 1.35,
    },
    maxParticles: 16,
    circleFollower: {
      radialSpring: 3.2,
      radialDamping: 1.8,
      tangentialVelocityCorrection: 0.95,
      radiusNoiseAmplitude: 0.20,  // organic radius variation, not a perfect circle
      speedNoiseAmplitude: 0.16,   // organic speed variation
      radiusNoiseFrequency: 0.55,
      speedNoiseFrequency: 0.28,
      minLagRad: 0.34,
      lagSpreadRad: 1.1,
      lagWobbleRad: 0.045,
      catchupRate: 0.42,
      errorSoftness: 0.85,
      minOmegaFactor: 0.62,
      maxOmegaFactor: 1.55,
    },
    circleResolution: {
      durationSeconds: 1.75,
      verdictRevealProgress: 0.18,
      minAngularSpeedFactor: 0.95,
      maxAngularSpeedFactor: 3.25,
      angularSteerRate: 2.65,
      radialSteerRate: 2.2,
      maxRadialSpeedFactor: 0.38,
      maxRadiusOffsetFactor: 0.18,
      telosContactRadiusFactor: 2.25,
      claimContactRadiusFactor: 0.65,
    },
  },
  'chaotic pattern': {
    telosSpring: {
      kP: 8.0,
      kD: 5.4,
    },
    trail: {
      headWidth: 3.0,
      tailWidth: 0.7,
      tailAlpha: 0.24,
      chunkCount: 96,
      renderSamples: 9600,
      visibleSamples: 60000,
      bufferCapacity: 180000,
      radiusScaleReference: 160,
      radiusScaleMax: 3,
    },
    particleLifecycle: {
      growthDurationMinSeconds: 6,
      growthDurationMaxSeconds: 10,
      minAgeBeforeSplitSeconds: 3.5,
      cullBaseIntervalSeconds: 4.8,
    },
    maxParticles: 8,
    chaoticIntro: {
      // Let the Lorenz path draw itself. The long distance gives both wings
      // enough time to emerge without flashing a complete attractor on small
      // screens. The lower travel speed also gives 30 Hz mobile displays
      // enough temporal resolution to preserve the wet-ink curve.
      durationSeconds: 7.2,
      pathDistancePx: 4600,
      // Scale the reveal to the actual panel. On a phone, a fixed 4,600 px
      // journey crosses both Lorenz wings almost immediately and reads as a
      // pre-drawn diagram rather than a trace arriving in time.
      pathDistanceRadiusFactor: 12,
    },
    chaoticPath: {
      derivativeStepSeconds: 1 / 120,
      cycleOrbits: 46,
      xScale: 1.62,
      yScale: -1.05,
      lorenzSampleCount: 3600,
      lorenzBurnInSteps: 900,
      lorenzDt: 0.01,
      lorenzSigma: 10,
      lorenzRho: 28,
      lorenzBeta: 8 / 3,
    },
    chaoticFollower: {
      kP: 5.8,
      kD: 4.6,
      minLagSeconds: 0.9,
      lagSpreadSeconds: 4.8,
      lagNoiseAmplitude: 0.3,
      lagNoiseFrequency: 0.18,
      lagNoisePhaseOffset: 83.2,
      offsetMinRadiusFactor: 0.018,
      offsetSpreadRadiusFactor: 0.035,
    },
    chaoticResolution: {
      durationSeconds: 2.6,
      verdictRevealProgress: 0.18,
      kP: 6.4,
      kD: 5.0,
      minLagSeconds: 0.9,
      lagSpreadSeconds: 4.8,
      offsetMinRadiusFactor: 0.018,
      offsetSpreadRadiusFactor: 0.035,
      liveTelosBlendStartProgress: 0.72,
      telosContactRadiusFactor: 2.25,
      claimContactRadiusFactor: 0.65,
    },
  },
} satisfies Record<TelosPattern, TelosPatternConfig>

export type { TelosTrailConfig }

export const TELOS_TRAIL_BUFFER_CAPACITY = Math.max(
  ...Object.values(TELOS_PATTERN_CONFIG).map((config) => config.trail.bufferCapacity),
)

export const TELOS_TRAIL_RENDER_CAPACITY = Math.max(
  ...Object.values(TELOS_PATTERN_CONFIG).map((config) => {
    const trail: TelosTrailConfig = config.trail
    return Math.ceil(trail.renderSamples * (trail.radiusScaleMax ?? 1))
  }),
)
