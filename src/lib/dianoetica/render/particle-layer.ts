import type { World } from '../core/world'
import type { Particle } from '../core/particle'
import { resolutionDisplay } from '../core/lifecycle/claim-resolution'
import { TELOS_PATTERN_CONFIG } from '../core/patterns/telos-pattern-config'

const HALO_RADIUS_MULTIPLIER = 4.5
const HALO_INNER_ALPHA = 0.75
const HALO_MIDPOINT_STOP = 0.3
const HALO_MIDPOINT_ALPHA = 0.4

// Telos as a symmetric 4-point star: equal N/S and E/W rays,
// white-hot core, soft warm halo.
const TELOS_HALO_MULTIPLIER = 5.5
const TELOS_RAY_LONG_MULTIPLIER = 2.4 // N and S ray length, in units of p.radius
const TELOS_RAY_SHORT_MULTIPLIER = 2.4 // E and W ray length
const TELOS_INNER_WAIST_MULTIPLIER = 0.16 // concave waist between rays
const TELOS_CORE_MULTIPLIER = 0.55
const TELOS_PULSE_AMPLITUDE = 0.05
const TELOS_PULSE_FREQ = 1.4 // rad/s

/**
 * Render each particle as glow halo + bright core. The halo is a radial
 * gradient so the particle has a soft outer light; the core is a solid
 * brighter disc on top.
 *
 * Telos gets its own visual treatment — a four-pointed star with a
 * white-hot heart and warm rose-gold rays — so it always reads as the
 * "axis-mundi" object of the composition rather than just another orbital
 * particle.
 */
export function drawParticles(ctx: CanvasRenderingContext2D, world: World): void {
  ctx.globalCompositeOperation = 'lighter'

  for (const p of world.particles) {
    if (p.isTelos) {
      drawTelos(ctx, p, world)
    } else {
      drawSubParticle(ctx, p, world)
    }
  }
}

function drawSubParticle(ctx: CanvasRenderingContext2D, p: Particle, world: World): void {
  let h: number, s: number, l: number, alpha: number
  let radiusScale = 1
  if (p.state === 'resolving') {
    const d = resolutionDisplay(p, world)
    h = d.h
    s = d.s
    l = d.l
    alpha = d.alpha
    radiusScale = d.radiusScale
    if (alpha <= 0) return
  } else {
    h = p.displayColor.h
    s = p.displayColor.s
    l = p.displayColor.l
    alpha = 1
  }

  const radius = p.radius * radiusScale
  const haloR = radius * HALO_RADIUS_MULTIPLIER
  const grad = ctx.createRadialGradient(
    p.position.x,
    p.position.y,
    0,
    p.position.x,
    p.position.y,
    haloR,
  )
  grad.addColorStop(0, `hsla(${h},${s}%,${l}%,${(alpha * HALO_INNER_ALPHA).toFixed(3)})`)
  grad.addColorStop(
    HALO_MIDPOINT_STOP,
    `hsla(${h},${s}%,${l}%,${(alpha * HALO_MIDPOINT_ALPHA).toFixed(3)})`,
  )
  grad.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(p.position.x, p.position.y, haloR, 0, Math.PI * 2)
  ctx.fill()

  const coreL = Math.min(95, l + 20)
  ctx.fillStyle = `hsla(${h},${s}%,${coreL}%,${alpha.toFixed(3)})`
  ctx.beginPath()
  ctx.arc(p.position.x, p.position.y, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawTelos(ctx: CanvasRenderingContext2D, p: Particle, world: World): void {
  const h = p.displayColor.h
  const s = p.displayColor.s
  const l = p.displayColor.l
  const time = world.time
  const knowledgePulse = telosKnowledgePulse(world)
  const pulse = 1 + TELOS_PULSE_AMPLITUDE * Math.sin(time * TELOS_PULSE_FREQ)
  const reveal = chaoticIntroReveal(world)
  const r = p.radius * (pulse + knowledgePulse) * (0.5 + reveal * 0.5)
  const cx = p.position.x
  const cy = p.position.y
  const previousAlpha = ctx.globalAlpha
  ctx.globalAlpha = previousAlpha * (0.04 + reveal * 0.96)

  // Soft warm halo
  const haloR = r * TELOS_HALO_MULTIPLIER
  const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR)
  haloGrad.addColorStop(0, `hsla(${h},${s}%,${l}%,0.70)`)
  haloGrad.addColorStop(0.22, `hsla(${h},${s}%,${l}%,0.36)`)
  haloGrad.addColorStop(0.55, `hsla(${h},${s}%,${l}%,0.12)`)
  haloGrad.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`)
  ctx.fillStyle = haloGrad
  ctx.beginPath()
  ctx.arc(cx, cy, haloR, 0, Math.PI * 2)
  ctx.fill()

  // 4-point star body. Eight vertices: equal outer tips (N/E/S/W)
  // alternating with concave inner waist points on the 45° diagonals.
  const rLong = r * TELOS_RAY_LONG_MULTIPLIER
  const rShort = r * TELOS_RAY_SHORT_MULTIPLIER
  const rInner = r * TELOS_INNER_WAIST_MULTIPLIER

  // Radial gradient fills the star with a white-hot heart fading toward
  // the long ray tips, so the rays read as light streaking outward.
  const starGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rLong)
  starGrad.addColorStop(0, `hsla(${h},100%,98%,1.0)`) // near-white core
  starGrad.addColorStop(0.12, `hsla(${h},85%,92%,0.95)`) // pale warm
  starGrad.addColorStop(0.42, `hsla(${h},${s}%,${Math.min(85, l + 15)}%,0.7)`) // gold body
  starGrad.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`) // fade at ray tips
  ctx.fillStyle = starGrad

  ctx.beginPath()
  ctx.moveTo(cx, cy - rLong) // N tip
  ctx.lineTo(cx + rInner, cy - rInner) // NE inner waist
  ctx.lineTo(cx + rShort, cy) // E tip
  ctx.lineTo(cx + rInner, cy + rInner) // SE waist
  ctx.lineTo(cx, cy + rLong) // S tip
  ctx.lineTo(cx - rInner, cy + rInner) // SW waist
  ctx.lineTo(cx - rShort, cy) // W tip
  ctx.lineTo(cx - rInner, cy - rInner) // NW waist
  ctx.closePath()
  ctx.fill()

  // Bright pinpoint at dead center so the star has a sharp twinkle
  const coreR = r * TELOS_CORE_MULTIPLIER
  const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
  coreGrad.addColorStop(0, `hsla(${h},100%,99%,1)`)
  coreGrad.addColorStop(0.45, `hsla(${h},90%,90%,0.85)`)
  coreGrad.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`)
  ctx.fillStyle = coreGrad
  ctx.beginPath()
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = previousAlpha
}

function chaoticIntroReveal(world: World): number {
  if (world.telosPattern !== 'chaotic pattern' || world.chaoticIntroComplete) return 1
  const duration = TELOS_PATTERN_CONFIG['chaotic pattern'].chaoticIntro.durationSeconds
  const progress = Math.max(0, Math.min(1, world.phaseTime / duration))
  return progress * progress * (3 - 2 * progress)
}

function telosKnowledgePulse(world: World): number {
  let pulse = 0
  for (const b of world.bursts) {
    if (b.kind !== 'knowledge') continue
    const t = b.age / b.duration
    pulse += Math.sin(Math.PI * t) * 0.18
  }
  return Math.min(0.32, pulse)
}
