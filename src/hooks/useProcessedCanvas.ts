import { useRef, useEffect, type RefObject } from 'react'
import { drawImageToCanvas, getPixelData, putPixelData } from '@/lib/canvas'
import type { LoadedImage } from './useImage'

export function useProcessedCanvas(
  image: LoadedImage | null,
  processData: (data: ImageData) => ImageData,
): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const tmp = document.createElement('canvas')
    drawImageToCanvas(tmp, image.bitmap)
    const srcData = getPixelData(tmp)
    const outData = processData(srcData)

    canvas.width = tmp.width
    canvas.height = tmp.height
    putPixelData(canvas, outData)
  }, [image, processData])

  return canvasRef
}
