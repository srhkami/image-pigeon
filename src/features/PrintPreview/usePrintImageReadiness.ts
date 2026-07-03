import {useCallback, useEffect, useMemo, useState} from 'react'

type ImageLoadState = 'loading' | 'loaded' | 'error'

type PrintImageReadiness = {
  totalImages: number
  loadedImages: number
  erroredImages: number
  isReady: boolean
  registerImageItemIds: (imageItemIds: readonly string[]) => void
  notifyImageLoaded: (itemId: string) => void
  notifyImageErrored: (itemId: string) => void
}

export function usePrintImageReadiness(imageItemIds: readonly string[]): PrintImageReadiness {
  const [imageStates, setImageStates] = useState<Record<string, ImageLoadState>>({})

  useEffect(() => {
    setImageStates((previousStates) => {
      const nextStates: Record<string, ImageLoadState> = {}

      for (const itemId of imageItemIds) {
        nextStates[itemId] = previousStates[itemId] ?? 'loading'
      }

      return nextStates
    })
  }, [imageItemIds])

  const registerImageItemIds = useCallback((nextImageItemIds: readonly string[]) => {
    const uniqueIds = [...new Set(nextImageItemIds)]

    setImageStates((previousStates) => {
      const nextStates: Record<string, ImageLoadState> = {}

      for (const itemId of uniqueIds) {
        nextStates[itemId] = previousStates[itemId] ?? 'loading'
      }

      return nextStates
    })
  }, [])

  const setStateByItemId = useCallback((itemId: string, nextState: ImageLoadState) => {
    setImageStates((previousStates) => {
      if (previousStates[itemId] === nextState) {
        return previousStates
      }

      return {
        ...previousStates,
        [itemId]: nextState,
      }
    })
  }, [])

  const notifyImageLoaded = useCallback((itemId: string) => {
    setStateByItemId(itemId, 'loaded')
  }, [setStateByItemId])

  const notifyImageErrored = useCallback((itemId: string) => {
    setStateByItemId(itemId, 'error')
  }, [setStateByItemId])

  const {totalImages, loadedImages, erroredImages} = useMemo(() => {
    let loadedCount = 0
    let erroredCount = 0

    for (const state of Object.values(imageStates)) {
      if (state === 'loaded') {
        loadedCount += 1
      }

      if (state === 'error') {
        erroredCount += 1
      }
    }

    return {
      totalImages: Object.keys(imageStates).length,
      loadedImages: loadedCount,
      erroredImages: erroredCount,
    }
  }, [imageStates])

  const isReady = useMemo(
    () => totalImages === 0 || Object.values(imageStates).every((state) => state !== 'loading'),
    [totalImages, imageStates],
  )

  return {
    totalImages,
    loadedImages,
    erroredImages,
    isReady,
    registerImageItemIds,
    notifyImageLoaded,
    notifyImageErrored,
  }
}
