export function blurActiveElement(activeElement: unknown): void {
  if (!activeElement || typeof activeElement !== 'object' || !('blur' in activeElement)) {
    return
  }

  if (typeof activeElement.blur === 'function') {
    activeElement.blur()
  }
}

type ActivateItemByOffsetOptions = {
  activeItemIndex: number
  itemIds: readonly string[]
  offset: number
  activeElement: unknown
  setActiveItemId: (itemId: string) => void
}

export function activateItemByOffset({
  activeItemIndex,
  itemIds,
  offset,
  activeElement,
  setActiveItemId,
}: ActivateItemByOffsetOptions): boolean {
  if (activeItemIndex < 0 || !itemIds.length) {
    return false
  }

  const nextIndex = Math.min(itemIds.length - 1, Math.max(0, activeItemIndex + offset))
  const nextItemId = itemIds[nextIndex]
  if (nextIndex === activeItemIndex || !nextItemId) {
    return false
  }

  blurActiveElement(activeElement)
  setActiveItemId(nextItemId)
  return true
}