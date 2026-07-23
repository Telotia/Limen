import { setupCanvas, type CanvasState } from '../render/canvas-setup'
import { renderFrame } from '../render/renderer'
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TELOS_PATTERN,
  createWorld,
  resizeWorld,
  type TelosPattern,
  type World,
  type WorldCenter,
  type WorldRadius,
} from './world'
import { createPhaseMachine, type PhaseMachine } from './phases/phase-machine'
import { stepPhysics } from './physics/integrator'
import { updateLifecycle } from './lifecycle/lifecycle'
import { updateColors } from './color/drift'
import { updateBursts } from './effects/burst'
import { setupVisibilityPause } from '../utils/visibility'
import { TELOS_PATTERN_CONFIG } from './patterns/telos-pattern-config'
import { telosChaoticPathSample } from './phases/telos'

export interface AnimationHandle {
  setCenter(center?: WorldCenter): void
  setRadius(radius?: WorldRadius): void
  setBackgroundColor(backgroundColor?: string): void
  setTelosPattern(telosPattern?: TelosPattern): void
  destroy(): void
}

export interface AnimationOptions {
  center?: WorldCenter
  radius?: WorldRadius
  backgroundColor?: string
  telosPattern?: TelosPattern
}

const MAX_DT = 0.05 // 50 ms clamp prevents huge jumps after a stall

/**
 * Mount the animation on a canvas element. Returns a handle whose .destroy()
 * tears down all listeners, the render loop, and any retained references.
 */
export function createAnimation(
  canvas: HTMLCanvasElement,
  options: AnimationOptions = {},
): AnimationHandle {
  const canvasState: CanvasState = setupCanvas(canvas)
  let centerOption = options.center
  let radiusOption = options.radius
  const world: World = createWorld(
    { width: canvasState.width, height: canvasState.height },
    centerOption,
    radiusOption,
    options.backgroundColor,
    options.telosPattern,
  )
  const phaseMachine: PhaseMachine = createPhaseMachine(world)

  const handleResize = (): void => {
    canvasState.syncSize()
    resizeWorld(
      world,
      { width: canvasState.width, height: canvasState.height },
      centerOption,
      radiusOption,
    )
  }
  window.addEventListener('resize', handleResize)
  // Also observe the canvas element directly so layout changes that DON'T
  // trigger window.resize (CSS-driven container resizing, HMR-time mutations,
  // mobile address-bar collapse, etc.) still re-sync the canvas backing store.
  // Without this, the canvas's CSS dimensions can grow past its internal pixel
  // buffer, and the browser stretches the rendered frame — turning the orbit
  // circle into an ellipse.
  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(handleResize)
    : null
  resizeObserver?.observe(canvas)

  let rafId = 0
  let lastTime = 0
  let started = false
  let paused = false

  const tick = (now: number): void => {
    rafId = requestAnimationFrame(tick)

    if (!started) {
      lastTime = now
      started = true
      return
    }
    if (paused) {
      lastTime = now
      return
    }

    let dt = (now - lastTime) / 1000
    lastTime = now
    if (!Number.isFinite(dt) || dt < 0) dt = 0
    if (dt > MAX_DT) dt = MAX_DT

    const previousTelosPathTime = world.telosPathTime
    phaseMachine.update(dt)
    updateLifecycle(world, dt)
    stepPhysics(world, dt)
    updateColors(world.particles, world.time)
    appendTrails(world, previousTelosPathTime)
    world.bursts = updateBursts(world.bursts, dt)
    renderFrame(canvasState, world)
  }

  rafId = requestAnimationFrame(tick)

  const stopVisibility = setupVisibilityPause(
    () => {
      paused = true
    },
    () => {
      paused = false
    },
  )

  return {
    setCenter(center?: WorldCenter): void {
      centerOption = center
      resizeWorld(
        world,
        { width: canvasState.width, height: canvasState.height },
        centerOption,
        radiusOption,
      )
    },
    setRadius(radius?: WorldRadius): void {
      radiusOption = radius
      resizeWorld(
        world,
        { width: canvasState.width, height: canvasState.height },
        centerOption,
        radiusOption,
      )
    },
    setBackgroundColor(backgroundColor?: string): void {
      world.backgroundColor = backgroundColor ?? DEFAULT_BACKGROUND_COLOR
    },
    setTelosPattern(telosPattern?: TelosPattern): void {
      const nextPattern = telosPattern ?? DEFAULT_TELOS_PATTERN
      if (world.telosPattern === nextPattern) return
      world.telosPattern = nextPattern
      world.maxParticles = TELOS_PATTERN_CONFIG[nextPattern].maxParticles
      for (const p of world.particles) {
        if (p.isTelos) p.trail.clear()
      }
    },
    destroy(): void {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      resizeObserver?.disconnect()
      stopVisibility()
    },
  }
}

/**
 * Append each particle's current position to its trail buffer, including
 * resolving claims as they move inward to be absorbed by Telos.
 */
function appendTrails(world: World, previousTelosPathTime: number): void {
  for (const p of world.particles) {
    if (
      p.isTelos &&
      world.telosPattern === 'chaotic pattern' &&
      !world.chaoticIntroComplete
    ) {
      appendChaoticIntroTrail(world, p, previousTelosPathTime)
      continue
    }
    p.trail.append(p.position)
  }
}

/**
 * Sample the real Lorenz path between animation frames during the reveal.
 * Mobile browsers often render at 30 Hz; appending only one position per
 * frame turns a mathematically smooth path into visible straight chords.
 */
function appendChaoticIntroTrail(
  world: World,
  particle: World['particles'][number],
  previousPathTime: number,
): void {
  const currentPathTime = world.telosPathTime
  const start = telosChaoticPathSample(world, previousPathTime).position
  const end = telosChaoticPathSample(world, currentPathTime).position
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const discontinuity = Math.max(80, world.baseRadius * 0.75)

  if (!Number.isFinite(distance) || distance > discontinuity) {
    particle.trail.append(particle.position)
    return
  }

  const spacingPx = world.width <= 820 ? 1.8 : 2.4
  const steps = Math.max(1, Math.ceil(distance / spacingPx))
  for (let step = 1; step <= steps; step++) {
    const amount = step / steps
    const pathTime = previousPathTime + (currentPathTime - previousPathTime) * amount
    particle.trail.append(telosChaoticPathSample(world, pathTime).position)
  }
}
