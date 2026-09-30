import type {ProjectItemViewModel} from '@/types/project.ts'
import type {AutoCollageWordSlotRole} from '@/utils/type.ts'

export type AutoCollageTemplate =
  | 'landscape-2'
  | 'portrait-large-2'
  | 'grid-4'
  | 'mixed-landscape1-grid2'
  | 'mixed-grid2-landscape1'
  | 'mixed-grid2-small3'
  | 'mixed-small3-grid2'
  | 'portrait-small-6'
  | 'mixed-landscape1-small3'
  | 'mixed-small3-landscape1'

export type AutoCollageSlot = {slotId: string; itemId: string | null; role: AutoCollageWordSlotRole; order: number}
export type AutoCollagePage = {pageId: string; template: AutoCollageTemplate; slots: AutoCollageSlot[]}
export type AutoCollageSourceItem = Pick<ProjectItemViewModel, 'itemId' | 'layoutPreference'>

const ROLES: Record<'stacked' | 'side' | 'grid4' | 'grid' | 'mixedStackedGrid4' | 'mixedGrid4Stacked' | 'mixedGrid4Grid6' | 'mixedGrid6Grid4' | 'mixedStackedGrid' | 'mixedGridStacked', readonly AutoCollageWordSlotRole[]> = {
  stacked: ['landscape-top', 'landscape-bottom'],
  side: ['portrait-large-left', 'portrait-large-right'],
  grid4: ['grid-4-top-left', 'grid-4-top-right', 'grid-4-bottom-left', 'grid-4-bottom-right'],
  mixedStackedGrid4: ['mixed-grid4-landscape-top', 'grid-4-bottom-left', 'grid-4-bottom-right'],
  mixedGrid4Stacked: ['grid-4-top-left', 'grid-4-top-right', 'mixed-grid4-landscape-bottom'],
  mixedGrid4Grid6: ['grid-4-top-left', 'grid-4-top-right', 'portrait-small-4', 'portrait-small-5', 'portrait-small-6'],
  mixedGrid6Grid4: ['portrait-small-1', 'portrait-small-2', 'portrait-small-3', 'grid-4-bottom-left', 'grid-4-bottom-right'],
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

    if (current.layoutPreference === 'grid-4') {
      const count = consecutive(viewModels, pointer, 'grid-4', 4)
      const nextAfter = viewModels[pointer + count]
      const ids = viewModels.slice(pointer, pointer + count).map((item) => item.itemId)
      if (count <= 2 && nextAfter?.layoutPreference === 'stacked-2') {
        add('mixed-grid2-landscape1', ROLES.mixedGrid4Stacked, [...padded(ids, 2), nextAfter.itemId], count + 1)
      } else if (count <= 2 && nextAfter?.layoutPreference === 'grid-6') {
        const sixCount = consecutive(viewModels, pointer + count, 'grid-6', 3)
        const sixIds = viewModels.slice(pointer + count, pointer + count + sixCount).map((item) => item.itemId)
        add('mixed-grid2-small3', ROLES.mixedGrid4Grid6, [...padded(ids, 2), ...padded(sixIds, 3)], count + sixCount)
      } else add('grid-4', ROLES.grid4, padded(ids, 4), count)
      continue
    }

    if (current.layoutPreference === 'stacked-2') {
      if (next?.layoutPreference === 'stacked-2') add('landscape-2', ROLES.stacked, [current.itemId, next.itemId], 2)
      else if (next?.layoutPreference === 'grid-4') {
        const count = consecutive(viewModels, pointer + 1, 'grid-4', 2)
        add('mixed-landscape1-grid2', ROLES.mixedStackedGrid4, padded([current.itemId, ...viewModels.slice(pointer + 1, pointer + 1 + count).map((item) => item.itemId)], 3), count + 1)
      } else if (next?.layoutPreference === 'grid-6') {
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
      } else if (count <= 3 && nextAfter?.layoutPreference === 'grid-4') {
        const fourCount = consecutive(viewModels, pointer + count, 'grid-4', 2)
        const sixIds = viewModels.slice(pointer, pointer + count).map((item) => item.itemId)
        const fourIds = viewModels.slice(pointer + count, pointer + count + fourCount).map((item) => item.itemId)
        add('mixed-small3-grid2', ROLES.mixedGrid6Grid4, [...padded(sixIds, 3), ...padded(fourIds, 2)], count + fourCount)
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
