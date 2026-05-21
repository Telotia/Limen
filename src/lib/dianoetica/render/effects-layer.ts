import type { World } from '../core/world'
import { easeOutCubic, smoothstep } from '../utils/easings'

const RING_MAX_RADIUS = 75
const RING_BASE_LINE_WIDTH = 3
const FLASH_RADIUS = 38
const KNOWLEDGE_RING_MAX_RADIUS = 120
const KNOWLEDGE_FLASH_RADIUS = 56

/**
 * Render every active split burst as:
 *   - an expanding hollow ring (eased outward, thinning, fading)
 *   - a central radial-gradient flash that shrinks and fades faster
 *
 * Drawn with 'lighter' compositing so the burst reads as a bright energy
 * release on top of the dark background.
 */
export function drawBursts(ctx: CanvasRenderingContext2D, world: World): void {
  if (world.bursts.length === 0) return
  ctx.globalCompositeOperation = 'lighter'
  const telos = world.particles.find((p) => p.isTelos)

  for (const b of world.bursts) {
    if (b.kind === 'knowledge') {
      const x = telos?.position.x ?? b.position.x
      const y = telos?.position.y ?? b.position.y
      drawKnowledgeBurst(ctx, b.age / b.duration, x, y, b.color.h, b.color.s)
      continue
    }

    const t = b.age / b.duration // 0 → 1
    const h = b.color.h
    const s = b.color.s

    // Expanding ring
    const ringR = easeOutCubic(t) * RING_MAX_RADIUS
    const ringAlpha = Math.max(0, 1 - t) * 0.85
    if (ringAlpha > 0.01 && ringR > 0.5) {
      ctx.strokeStyle = `hsla(${h},${s}%,90%,${ringAlpha.toFixed(3)})`
      ctx.lineWidth = RING_BASE_LINE_WIDTH * (1 - t * 0.55)
      ctx.beginPath()
      ctx.arc(b.position.x, b.position.y, ringR, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Central flash — shrinks within first half, fades within first ~2/3
    const flashShrink = Math.min(1, t * 2)
    const flashR = Math.max(0, 1 - flashShrink) * FLASH_RADIUS
    const flashAlpha = Math.max(0, 1 - t * 1.5) * 0.95
    if (flashAlpha > 0.01 && flashR > 0.5) {
      const grad = ctx.createRadialGradient(
        b.position.x,
        b.position.y,
        0,
        b.position.x,
        b.position.y,
        flashR,
      )
      grad.addColorStop(0, `hsla(${h},${s}%,98%,${flashAlpha.toFixed(3)})`)
      grad.addColorStop(0.45, `hsla(${h},${s}%,90%,${(flashAlpha * 0.5).toFixed(3)})`)
      grad.addColorStop(1, `hsla(${h},${s}%,85%,0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(b.position.x, b.position.y, flashR, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawKnowledgeBurst(
  ctx: CanvasRenderingContext2D,
  t: number,
  x: number,
  y: number,
  h: number,
  s: number,
): void {
  const eased = easeOutCubic(t)
  const ringR = eased * KNOWLEDGE_RING_MAX_RADIUS
  const ringAlpha = Math.max(0, 1 - t) * 0.9

  if (ringAlpha > 0.01 && ringR > 0.5) {
    ctx.strokeStyle = `hsla(${h},${s}%,82%,${ringAlpha.toFixed(3)})`
    ctx.lineWidth = 4 * (1 - t * 0.55)
    ctx.beginPath()
    ctx.arc(x, y, ringR, 0, Math.PI * 2)
    ctx.stroke()
  }

  const pulse = Math.sin(Math.PI * smoothstep(t))
  const flashR = KNOWLEDGE_FLASH_RADIUS * (0.35 + pulse * 0.65)
  const flashAlpha = Math.max(0, 1 - t * 1.25) * 0.8
  if (flashAlpha > 0.01) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, flashR)
    grad.addColorStop(0, `hsla(32,85%,96%,${flashAlpha.toFixed(3)})`)
    grad.addColorStop(0.34, `hsla(${h},${s}%,82%,${(flashAlpha * 0.55).toFixed(3)})`)
    grad.addColorStop(1, `hsla(${h},${s}%,72%,0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, flashR, 0, Math.PI * 2)
    ctx.fill()
  }
}
