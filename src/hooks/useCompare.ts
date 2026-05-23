import { useRef, useEffect, useState, useCallback, type RefObject } from 'react'
import { drawImageToCanvas, getPixelData, putPixelData } from '@/lib/canvas'
import type { LoadedImage } from './useImage'

export function useCompare(
  image: LoadedImage | null,
  processData: (data: ImageData) => ImageData,
): {
  processedRef: RefObject<HTMLCanvasElement | null>
  originalRef: RefObject<HTMLCanvasElement | null>
  compare: boolean
  toggleCompare: () => void
} {
  const processedRef = useRef<HTMLCanvasElement | null>(null)
  const originalRef = useRef<HTMLCanvasElement | null>(null)
  const [compare, setCompare] = useState(false)

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

    // Always draw to originalRef so it's ready when compare is toggled
    const original = originalRef.current
    if (original) {
      original.width = tmp.width
      original.height = tmp.height
      original.getContext('2d')!.drawImage(tmp, 0, 0)
    }
  }, [image, processData])

  const toggleCompare = useCallback(() => setCompare(v => !v), [])

  return { processedRef, originalRef, compare, toggleCompare }
}
