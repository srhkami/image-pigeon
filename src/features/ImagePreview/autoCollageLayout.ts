import type {ProjectItemViewModel} from '@/types/project.ts'
import type {AutoCollageWordSlotRole} from '@/utils/type.ts'

export type AutoCollageTemplate =
  | 'landscape-2'
  | 'portrait-large-2'
  | 'portrait-small-6'
  | 'mixed-landscape1-small3'
  | 'mixed-small3-landscape1'

export type AutoCollageSlot = {slotId: string; itemId: string | null; role: AutoCollageWordSlotRole; order: number}
export type AutoCollagePage = {pageId: string; template: AutoCollageTemplate; slots: AutoCollageSlot[]}
export type AutoCollageSourceItem = Pick<ProjectItemViewModel, 'itemId' | 'layoutPreference'>

const ROLES: Record<'stacked' | 'side' | 'grid' | 'mixedStackedGrid' | 'mixedGridStacked', readonly AutoCollageWordSlotRole[]> = {
  stacked: ['landscape-top', 'landscape-bottom'],
  side: ['portrait-large-left', 'portrait-large-right'],
  grid: ['portrait-small-1', 'portrait-small-2', 'portrait-small-3', 'portrait-small-4', 'portrait-small-5', 'portrait-small-6'],
  mixedStackedGrid: ['mixed-landscape-top', 'mixed-small-top-left', 'mixed-small-top-middle', 'mixed-small-top-right'],
  mixedGridStacked: ['mixed-small-bottom-left', 'mixed-small-bottom-middle', 'mixed-small-bottom-right', 'mixed-landscape-bottom'],
} as const

const slots = (pageId: string, roles: readonly AutoCollageWordSlotRole[], itemIds: readonly (string | null)[]): AutoCollageSlot[] =>
  roles.map((role, index) => ({slotId: `${pageId}-slot-${index + 1}`, itemId: itemIds[index] ?? null, role, order: index + 1}))

const consecutive = (items: readonly AutoCollageSourceItem[], start: number, preference: AutoCollageSourceItem['layoutPreference'], max: number) => {
  let count = 0
  while (count < max && items[start + count]?.layoutPreference === preference) count += 1
  return count
}

const padded = (items: readonly string[], length: number): Array<string | null> => [...items, ...Array.from({length: Math.max(0, length - items.length)}, () => null)]

export function buildAutoCollageLayout(viewModels: readonly AutoCollageSourceItem[]): AutoCollagePage[] {
  const layout: AutoCollagePage[] = []
  let pointer = 0
  let pageNo = 1

  while (pointer < viewModels.length) {
    const current = viewModels[pointer]
    const next = viewModels[pointer + 1]
    const pageId = `page-${String(pageNo).padStart(2, '0')}`
    const add = (template: AutoCollageTemplate, roles: readonly AutoCollageWordSlotRole[], itemIds: readonly (string | null)[], consumed: number) => {
      layout.push({pageId, template, slots: slots(pageId, roles, itemIds)})
      pointer += consumed
      pageNo += 1
    }

    if (current.layoutPreference === 'stacked-2') {
      if (next?.layoutPreference === 'stacked-2') add('landscape-2', ROLES.stacked, [current.itemId, next.itemId], 2)
      else if (next?.layoutPreference === 'grid-6') {
        const count = consecutive(viewModels, pointer + 1, 'grid-6', 3)
        add('mixed-landscape1-small3', ROLES.mixedStackedGrid, padded([current.itemId, ...viewModels.slice(pointer + 1, pointer + 1 + count).map((item) => item.itemId)], 4), count + 1)
      } else add('landscape-2', ROLES.stacked, [current.itemId, null], 1)
      continue
    }

    if (current.layoutPreference === 'grid-6') {
      const count = consecutive(viewModels, pointer, 'grid-6', 6)
      const nextAfter = viewModels[pointer + count]
      if (count <= 3 && nextAfter?.layoutPreference === 'stacked-2') {
        const gridItemIds = viewModels.slice(pointer, pointer + count).map((item) => item.itemId)
        add('mixed-small3-landscape1', ROLES.mixedGridStacked, [...padded(gridItemIds, 3), nextAfter.itemId], count + 1)
      } else add('portrait-small-6', ROLES.grid, padded(viewModels.slice(pointer, pointer + count).map((item) => item.itemId), 6), count)
      continue
    }

    if (next?.layoutPreference === 'side-by-side-2') add('portrait-large-2', ROLES.side, [current.itemId, next.itemId], 2)
    else add('portrait-large-2', ROLES.side, [current.itemId, null], 1)
  }
  return layout
}

export function findPageIndexByItemId(layout: readonly AutoCollagePage[], itemId: string): number {
  return layout.findIndex((page) => page.slots.some((slot) => slot.itemId === itemId))
}

export function countBlankSlots(layout: readonly AutoCollagePage[]): number {
  return layout.reduce((total, page) => total + page.slots.reduce((pageTotal, slot) => pageTotal + (slot.itemId ? 0 : 1), 0), 0)
}
