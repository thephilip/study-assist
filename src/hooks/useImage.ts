import { useReducer, useCallback } from 'react'

export type LoadedImage = {
  bitmap: ImageBitmap
  name: string
  width: number
  height: number
}

type State = {
  image: LoadedImage | null
  stack: LoadedImage[]
  error: string | null
}

type Action =
  | { type: 'LOAD'; image: LoadedImage }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'PUSH'; bitmap: ImageBitmap }
  | { type: 'UNDO' }
  | { type: 'CLEAR' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD':
      state.image?.bitmap.close()
      state.stack.forEach(s => s.bitmap.close())
      return { image: action.image, stack: [], error: null }
    case 'LOAD_ERROR':
      return { ...state, error: action.error }
    case 'PUSH': {
      if (!state.image) {
        action.bitmap.close()
        return state
      }
      const newImage: LoadedImage = {
        bitmap: action.bitmap,
        name: state.image.name,
        width: action.bitmap.width,
        height: action.bitmap.height,
      }
      return { ...state, image: newImage, stack: [...state.stack, state.image] }
    }
    case 'UNDO': {
      if (state.stack.length === 0) return state
      const stack = [...state.stack]
      const restored = stack.pop()!
      state.image?.bitmap.close()
      return { ...state, image: restored, stack }
    }
    case 'CLEAR':
      state.image?.bitmap.close()
      state.stack.forEach(s => s.bitmap.close())
      return { image: null, stack: [], error: null }
    default:
      return state
  }
}

export function useImage() {
  const [state, dispatch] = useReducer(reducer, { image: null, stack: [], error: null })

  const load = useCallback(async (file: File) => {
    dispatch({ type: 'LOAD_ERROR', error: '' })
    try {
      const bitmap = await createImageBitmap(file)
      dispatch({ type: 'LOAD', image: { bitmap, name: file.name, width: bitmap.width, height: bitmap.height } })
    } catch {
      dispatch({ type: 'LOAD_ERROR', error: 'Could not load image. Try a JPEG, PNG, or WebP file.' })
    }
  }, [])

  const push = useCallback(async (canvas: HTMLCanvasElement) => {
    const bitmap = await createImageBitmap(canvas)
    dispatch({ type: 'PUSH', bitmap })
  }, [])

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const clear = useCallback(() => dispatch({ type: 'CLEAR' }), [])

  return {
    image: state.image,
    originalImage: state.stack.length > 0 ? state.stack[0] : state.image,
    error: state.error || null,
    canUndo: state.stack.length > 0,
    undoDepth: state.stack.length,
    load,
    push,
    undo,
    clear,
  }
}
