export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cols: number,
  rows: number,
  opacity: number,
  color: 'light' | 'dark',
) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color === 'light' ? '#ffffff' : '#000000'
  ctx.lineWidth = 1

  for (let c = 1; c < cols; c++) {
    const x = Math.round((width / cols) * c) + 0.5
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  for (let r = 1; r < rows; r++) {
    const y = Math.round((height / rows) * r) + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  ctx.restore()
}
