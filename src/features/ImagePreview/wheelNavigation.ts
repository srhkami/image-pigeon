export function blurActiveElement(activeElement: unknown): void {
  if (!activeElement || typeof activeElement !== 'object' || !('blur' in activeElement)) {
    return
  }

  if (typeof activeElement.blur === 'function') {
    activeElement.blur()
  }
}

export function getActiveItemIdAfterRemoval(itemIds: readonly string[], removedItemId: string): string | null {
  const removedIndex = itemIds.indexOf(removedItemId)
  if (removedIndex < 0) return null
  return itemIds[removedIndex + 1] ?? itemIds[removedIndex - 1] ?? null
}

export function getActiveItemIdAfterRemovingItems(
  itemIds: readonly string[],
  activeItemId: string | null,
  removedItemIds: ReadonlySet<string>,
): string | null {
  if (activeItemId && !removedItemIds.has(activeItemId) && itemIds.includes(activeItemId)) {
    return activeItemId
  }

  const activeIndex = activeItemId ? itemIds.indexOf(activeItemId) : -1
  const remainingItemIds = itemIds.filter((itemId) => !removedItemIds.has(itemId))
  if (!remainingItemIds.length) return null
  if (activeIndex < 0) return remainingItemIds[0] ?? null

  return itemIds.slice(activeIndex + 1).find((itemId) => !removedItemIds.has(itemId))
    ?? itemIds.slice(0, activeIndex).reverse().find((itemId) => !removedItemIds.has(itemId))
    ?? null
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