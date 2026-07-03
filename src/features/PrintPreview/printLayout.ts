import type {AutoCollagePage} from '@/features/ImagePreview/autoCollageLayout.ts'

export type PrintFontSize = '16' | '18' | '20'
export type PrintAlignVertical = 'top' | 'center'

export type PrintPreviewOptions = {
  title: string
  fontSize: PrintFontSize
  alignVertical: PrintAlignVertical
}

export function formatPrintImageNumber(index: number): string {
  return `編號 ${String(index).padStart(2, '0')}`
}

export function buildPrintableSlotIndexMap(pages: readonly AutoCollagePage[]): Record<string, number | null> {
  const slotIndexMap: Record<string, number | null> = {}

  let nextNumber = 1
  for (const page of pages) {
    for (const slot of page.slots) {
      slotIndexMap[slot.slotId] = slot.itemId ? nextNumber++ : null
    }
  }

  return slotIndexMap
}

export function getPrintableImageItemIds(pages: readonly AutoCollagePage[]): string[] {
  const ids = new Set<string>()

  for (const page of pages) {
    for (const slot of page.slots) {
      if (slot.itemId) {
        ids.add(slot.itemId)
      }
    }
  }

  return [...ids]
}
