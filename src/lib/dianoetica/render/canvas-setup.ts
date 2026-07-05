export interface CanvasState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  /** CSS-pixel width (what the simulation thinks of as "width"). */
  width: number
  height: number
  dpr: number
  /** Re-read CSS rect + devicePixelRatio and re-size the backing store. */
  syncSize(): void
}

/**
 * Wrap an HTMLCanvasElement with DPR-aware sizing. The backing store is
 * sized to clientRect × devicePixelRatio so high-DPI screens stay crisp,
 * but the 2D context is pre-scaled so all simulation math operates in CSS
 * pixels (no per-call DPR multiplication).
 */
export function setupCanvas(canvas: HTMLCanvasElement): CanvasState {
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) throw new Error('Could not acquire 2D context')

  const state: CanvasState = {
    canvas,
    ctx,
    width: 0,
    height: 0,
    dpr: 1,
    syncSize() {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const cssW = Math.max(1, rect.width)
      const cssH = Math.max(1, rect.height)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      // setTransform replaces (not concatenates) — safe to call every resize
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      state.width = cssW
      state.height = cssH
      state.dpr = dpr
    },
  }
  state.syncSize()
  return state
}
