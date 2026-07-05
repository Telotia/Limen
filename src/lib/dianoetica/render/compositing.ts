export function clearWithBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor: string,
): void {
  ctx.globalCompositeOperation = 'source-over'
  if (backgroundColor === 'transparent') {
    ctx.clearRect(0, 0, width, height)
    return
  }

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
}
