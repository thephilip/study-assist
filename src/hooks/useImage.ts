import { useState, useCallback } from 'react'

export type LoadedImage = {
  bitmap: ImageBitmap
  name: string
  width: number
  height: number
}

export function useImage() {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (file: File) => {
    setError(null)
    try {
      const bitmap = await createImageBitmap(file)
      setImage(prev => {
        prev?.bitmap.close()
        return { bitmap, name: file.name, width: bitmap.width, height: bitmap.height }
      })
    } catch {
      setError('Could not load image. Try a JPEG, PNG, or WebP file.')
    }
  }, [])

  const clear = useCallback(() => {
    setImage(prev => {
      prev?.bitmap.close()
      return null
    })
  }, [])

  return { image, error, load, clear }
}
