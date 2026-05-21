import type { World } from '../core/world'
import type { CanvasState } from './canvas-setup'
import { clearWithBackground } from './compositing'
import { drawTrails } from './trail-layer'
import { drawParticles } from './particle-layer'
import { drawBursts } from './effects-layer'

/**
 * Render orchestrator. Strictly read-only on `world`: this function never
 * mutates particle state. All simulation updates happen earlier in the
 * frame (phases → lifecycle → physics → colors → trail buffer).
 *
 * Draw order: background → trails → particles → bursts.
 * Bursts last so the split flash sits visually on top of everything else.
 */
export function renderFrame(canvas: CanvasState, world: World): void {
  clearWithBackground(canvas.ctx, canvas.width, canvas.height, world.backgroundColor)
  drawTrails(canvas.ctx, world)
  drawParticles(canvas.ctx, world)
  drawBursts(canvas.ctx, world)
}
