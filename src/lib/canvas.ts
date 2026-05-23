export function getPixelData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')!
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

export function putPixelData(canvas: HTMLCanvasElement, data: ImageData): void {
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(data, 0, 0)
}

export function drawImageToCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | ImageBitmap,
  maxWidth = 1200,
  maxHeight = 1200,
): void {
  let { width, height } = image instanceof HTMLImageElement
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : image

  const scale = Math.min(1, maxWidth / width, maxHeight / height)
  width = Math.round(width * scale)
  height = Math.round(height * scale)

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, width, height)
}

export function cloneImageData(data: ImageData): ImageData {
  return new ImageData(new Uint8ClampedArray(data.data), data.width, data.height)
}

export function mapPixels(
  data: ImageData,
  fn: (r: number, g: number, b: number, a: number) => [number, number, number, number],
): ImageData {
  const out = cloneImageData(data)
  for (let i = 0; i < out.data.length; i += 4) {
    const [r, g, b, a] = fn(data.data[i], data.data[i + 1], data.data[i + 2], data.data[i + 3])
    out.data[i] = r
    out.data[i + 1] = g
    out.data[i + 2] = b
    out.data[i + 3] = a
  }
  return out
}
