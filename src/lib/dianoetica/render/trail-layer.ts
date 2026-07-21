import type { World } from '../core/world'
import type { Particle } from '../core/particle'
import { resolutionDisplay } from '../core/lifecycle/claim-resolution'
import {
  TELOS_PATTERN_CONFIG,
  TELOS_TRAIL_RENDER_CAPACITY,
  type TelosTrailConfig,
} from '../core/patterns/telos-pattern-config'

// Sub-particle taper: width = radius × (frac + (1-frac) × t)
const TAIL_MIN_WIDTH_FRACTION = 0.03
const TAIL_OPACITY = 0.07
const MID_OPACITY = 0.5
const HEAD_OPACITY = 1.0
const TELOS_SEGMENT_BREAK_MIN_PX = 80
const TELOS_SEGMENT_BREAK_RADIUS_FACTOR = 0.75

/**
 * Telos's trail is a slim, near-uniform gold streak. The widths are
 * ABSOLUTE px (not scaled to particle radius) so the streak is much
 * thinner than the star's silhouette at every point — the trail head
 * fits inside the star's body so the star covers the join cleanly.
 *
 * Visually: an elegant golden arc closing on Telos's position with no
 * visible "the trail is fatter than the star it emerges from" mismatch.
 */
const MAX_SAMPLES = TELOS_TRAIL_RENDER_CAPACITY
const sx = new Float32Array(MAX_SAMPLES)
const sy = new Float32Array(MAX_SAMPLES)
const st = new Float32Array(MAX_SAMPLES)
const ux = new Float32Array(MAX_SAMPLES)
const uy = new Float32Array(MAX_SAMPLES)
const lx = new Float32Array(MAX_SAMPLES)
const ly = new Float32Array(MAX_SAMPLES)

export function drawTrails(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.globalCompositeOperation = 'lighter'
  for (const p of world.particles) drawOneTrail(ctx, p, world)
}

function widthAt(
  p: Particle,
  t: number,
  radiusScale: number,
  telosTrail?: TelosTrailConfig,
): number {
  if (p.isTelos) {
    if (!telosTrail) return 0
    return telosTrail.tailWidth + (telosTrail.headWidth - telosTrail.tailWidth) * t
  }
  return p.radius * radiusScale * (TAIL_MIN_WIDTH_FRACTION + (1 - TAIL_MIN_WIDTH_FRACTION) * t)
}

function drawOneTrail(ctx: CanvasRenderingContext2D, p: Particle, world: World): void {
  if (p.trail.length < 3) return
  const telosTrail = p.isTelos
    ? TELOS_PATTERN_CONFIG[world.telosPattern].trail
    : undefined

  let h: number, sat: number, lt: number, baseAlpha: number
  let radiusScale = 1
  let trailStartT = 0
  if (p.state === 'resolving') {
    const d = resolutionDisplay(p, world)
    h = d.h
    sat = d.s
    lt = d.l
    baseAlpha = d.alpha
    radiusScale = d.radiusScale
    trailStartT = 1 - clamp(d.radiusScale, 0.36, 1)
    if (baseAlpha <= 0) return
  } else {
    h = p.displayColor.h
    sat = p.displayColor.s
    lt = p.displayColor.l
    baseAlpha = 1
  }
  if (telosTrail) {
    trailStartT = Math.max(
      trailStartT,
      visibleTrailStartT(p, scaledTelosTrailSamples(world, telosTrail.visibleSamples, telosTrail)),
    )
  }

  // The chaotic path begins like wet ink touching paper: a faint, narrow
  // trace that gains body as the two Lorenz wings are drawn. This preserves
  // the final geometry without flashing a fully seeded history on screen.
  const reveal = chaoticIntroReveal(p, world)
  baseAlpha *= 0.14 + 0.86 * reveal

  // Copy samples into scratch buffers. Telos can keep a much longer memory
  // than we render; sampled iteration preserves old lobes without building a
  // giant polygon every frame.
  let idx = 0
  const maxRenderSamples = telosTrail
    ? scaledTelosTrailSamples(world, telosTrail.renderSamples, telosTrail)
    : MAX_SAMPLES
  p.trail.forEachSampled(trailStartT, maxRenderSamples, (x, y, t) => {
    if (idx >= MAX_SAMPLES) return
    sx[idx] = x
    sy[idx] = y
    st[idx] = t
    idx++
  })
  const N = idx
  if (N < 3) return

  if (p.isTelos) {
    if (!telosTrail) return
    drawChunkedTelosStroke(ctx, N, h, sat, lt, baseAlpha, telosTrail, world, 0.48 + 0.52 * reveal)
    return
  }

  // Build perpendicular-offset upper/lower boundary points per sample.
  for (let j = 0; j < N; j++) {
    let dx: number, dy: number
    if (j === 0) {
      dx = sx[1] - sx[0]
      dy = sy[1] - sy[0]
    } else if (j === N - 1) {
      dx = sx[N - 1] - sx[N - 2]
      dy = sy[N - 1] - sy[N - 2]
    } else {
      dx = sx[j + 1] - sx[j - 1]
      dy = sy[j + 1] - sy[j - 1]
    }
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    const w = widthAt(p, st[j], radiusScale, telosTrail)
    ux[j] = sx[j] + nx * w
    uy[j] = sy[j] + ny * w
    lx[j] = sx[j] - nx * w
    ly[j] = sy[j] - ny * w
  }

  drawSingleRibbon(ctx, N, h, sat, lt, baseAlpha)
}

function visibleTrailStartT(p: Particle, visibleSamples: number): number {
  if (p.trail.length <= visibleSamples) return 0
  return 1 - visibleSamples / p.trail.length
}

function scaledTelosTrailSamples(
  world: World,
  samples: number,
  telosTrail: TelosTrailConfig,
): number {
  const scale = telosTrailLengthScale(world, telosTrail)
  return Math.min(MAX_SAMPLES, telosTrail.bufferCapacity, Math.ceil(samples * scale))
}

function telosTrailLengthScale(world: World, telosTrail: TelosTrailConfig): number {
  const referenceRadius = telosTrail.radiusScaleReference
  if (!referenceRadius) return 1
  const maxScale = telosTrail.radiusScaleMax ?? 1
  return clamp(world.baseRadius / referenceRadius, 1, maxScale)
}

/** Sub-particle: one polygon, one linearGradient (tail → head chord). */
function drawSingleRibbon(
  ctx: CanvasRenderingContext2D,
  N: number,
  h: number,
  sat: number,
  lt: number,
  baseAlpha: number,
): void {
  const grad = ctx.createLinearGradient(sx[0], sy[0], sx[N - 1], sy[N - 1])
  grad.addColorStop(0, `hsla(${h},${sat}%,${lt}%,${(TAIL_OPACITY * baseAlpha).toFixed(3)})`)
  grad.addColorStop(
    0.5,
    `hsla(${h},${sat}%,${lt}%,${(MID_OPACITY * baseAlpha).toFixed(3)})`,
  )
  grad.addColorStop(
    1,
    `hsla(${h},${sat}%,${lt}%,${(HEAD_OPACITY * baseAlpha).toFixed(3)})`,
  )
  ctx.fillStyle = grad

  ctx.beginPath()
  ctx.moveTo(ux[0], uy[0])
  for (let j = 1; j < N; j++) ctx.lineTo(ux[j], uy[j])
  for (let j = N - 1; j >= 0; j--) ctx.lineTo(lx[j], ly[j])
  ctx.closePath()
  ctx.fill()
}

function drawChunkedTelosStroke(
  ctx: CanvasRenderingContext2D,
  N: number,
  h: number,
  sat: number,
  lt: number,
  baseAlpha: number,
  telosTrail: TelosTrailConfig,
  world: World,
  widthScale: number,
): void {
  const numChunks = Math.max(2, Math.min(telosTrail.chunkCount, Math.floor(N / 8)))
  const maxSegmentLength = Math.max(
    TELOS_SEGMENT_BREAK_MIN_PX,
    world.baseRadius * TELOS_SEGMENT_BREAK_RADIUS_FACTOR,
  )
  const previousLineCap = ctx.lineCap
  const previousLineJoin = ctx.lineJoin

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let chunk = 0; chunk < numChunks; chunk++) {
    const startIdx = Math.floor((chunk * N) / numChunks)
    const endIdx = Math.min(N, Math.floor(((chunk + 1) * N) / numChunks) + 1)
    if (endIdx - startIdx < 2) continue

    const tStart = startIdx / (N - 1)
    const tEnd = (endIdx - 1) / (N - 1)

    const grad = ctx.createLinearGradient(
      sx[startIdx],
      sy[startIdx],
      sx[endIdx - 1],
      sy[endIdx - 1],
    )
    grad.addColorStop(0, `hsla(${h},${sat}%,${lt}%,${telosAlpha(tStart, baseAlpha, telosTrail)})`)
    grad.addColorStop(1, `hsla(${h},${sat}%,${lt}%,${telosAlpha(tEnd, baseAlpha, telosTrail)})`)
    ctx.strokeStyle = grad
    ctx.lineWidth = telosLineWidth((tStart + tEnd) * 0.5, telosTrail) * widthScale

    ctx.beginPath()
    ctx.moveTo(sx[startIdx], sy[startIdx])
    for (let j = startIdx + 1; j < endIdx; j++) {
      const distance = Math.hypot(sx[j] - sx[j - 1], sy[j] - sy[j - 1])
      if (distance > maxSegmentLength) {
        ctx.moveTo(sx[j], sy[j])
      } else {
        ctx.lineTo(sx[j], sy[j])
      }
    }
    ctx.stroke()
  }

  ctx.lineCap = previousLineCap
  ctx.lineJoin = previousLineJoin
}

function chaoticIntroReveal(p: Particle, world: World): number {
  if (!p.isTelos || world.telosPattern !== 'chaotic pattern' || world.chaoticIntroComplete) {
    return 1
  }

  const duration = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticIntro.durationSeconds
  const progress = clamp(world.phaseTime / duration, 0, 1)
  return progress * progress * (3 - 2 * progress)
}

function telosAlpha(t: number, baseAlpha: number, telosTrail: TelosTrailConfig): string {
  const alpha = (telosTrail.tailAlpha + (1 - telosTrail.tailAlpha) * t) * baseAlpha
  return alpha.toFixed(3)
}

function telosLineWidth(t: number, telosTrail: TelosTrailConfig): number {
  const radius = telosTrail.tailWidth + (telosTrail.headWidth - telosTrail.tailWidth) * t
  return radius * 2
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v
}
