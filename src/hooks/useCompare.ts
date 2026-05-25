import { useRef, useEffect, useState, useCallback, type RefObject } from 'react'
import { drawImageToCanvas, getPixelData, putPixelData } from '@/lib/canvas'
import type { LoadedImage } from './useImage'

export function useCompare(
  image: LoadedImage | null,
  processData: (data: ImageData) => ImageData,
  originalImage?: LoadedImage | null,
): {
  processedRef: RefObject<HTMLCanvasElement | null>
  originalRef: RefObject<HTMLCanvasElement | null>
  compare: boolean
  toggleCompare: () => void
} {
  const processedRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const [compare, setCompare] = useState(false)

  // Render the processed output whenever the source image or settings change
  useEffect(() => {
    const processed = processedRef.current
    if (!processed || !image) return

    const tmp = document.createElement('canvas')
    drawImageToCanvas(tmp, image.bitmap)
    const srcData = getPixelData(tmp)
    const outData = processData(srcData)

    processed.width = tmp.width
    processed.height = tmp.height
    putPixelData(processed, outData)
  }, [image, processData])

  // Render the compare baseline — the root original if provided, otherwise the current source
  useEffect(() => {
    const original = originalRef.current
    const src = originalImage ?? image
    if (!original || !src) return

    original.width = src.width
    original.height = src.height
    original.getContext('2d')!.drawImage(src.bitmap, 0, 0)
  }, [originalImage, image])

  const toggleCompare = useCallback(() => setCompare(v => !v), [])

  return { processedRef, originalRef, compare, toggleCompare }
}
