import {useCallback, useEffect, useMemo, useState} from 'react'

export type ImageLoadState = 'loading' | 'loaded' | 'error'

type DerivedPrintImageReadiness = {
  totalImages: number
  loadedImages: number
  erroredImages: number
  isReady: boolean
}

export function derivePrintImageReadiness(
  imageItemIds: readonly string[],
  imageStates: Readonly<Record<string, ImageLoadState>>,
): DerivedPrintImageReadiness {
  const uniqueIds = [...new Set(imageItemIds)]
  let loadedImages = 0
  let erroredImages = 0

  for (const itemId of uniqueIds) {
    const state = imageStates[itemId] ?? 'loading'
    if (state === 'loaded') loadedImages += 1
    if (state === 'error') erroredImages += 1
  }

  return {
    totalImages: uniqueIds.length,
    loadedImages,
    erroredImages,
    isReady: uniqueIds.length === 0 || loadedImages + erroredImages === uniqueIds.length,
  }
}

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

  const {totalImages, loadedImages, erroredImages, isReady} = useMemo(
    () => derivePrintImageReadiness(imageItemIds, imageStates),
    [imageItemIds, imageStates],
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
