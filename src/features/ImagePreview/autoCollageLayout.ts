import type {ProjectItemViewModel} from '@/types/project.ts'

export type AutoCollageTemplate =
  | 'landscape-2'
  | 'portrait-large-2'
  | 'portrait-small-6'
  | 'mixed-landscape1-small3'
  | 'mixed-small3-landscape1'

export type AutoCollageSlot = {
  slotId: string
  itemId: string | null
  role:
    | 'landscape-top'
    | 'landscape-bottom'
    | 'portrait-large-left'
    | 'portrait-large-right'
    | 'portrait-small-1'
    | 'portrait-small-2'
    | 'portrait-small-3'
    | 'portrait-small-4'
    | 'portrait-small-5'
    | 'portrait-small-6'
    | 'mixed-landscape-top'
    | 'mixed-small-top-left'
    | 'mixed-small-top-middle'
    | 'mixed-small-top-right'
    | 'mixed-small-bottom-left'
    | 'mixed-small-bottom-middle'
    | 'mixed-small-bottom-right'
    | 'mixed-landscape-bottom'
  order: number
}

export type AutoCollagePage = {
  pageId: string
  template: AutoCollageTemplate
  slots: AutoCollageSlot[]
}

export type AutoCollageSourceItem = Pick<ProjectItemViewModel, 'itemId' | 'orientation' | 'portraitSize'>

const LANDSCAPE_2_ROLES: AutoCollageSlot['role'][] = ['landscape-top', 'landscape-bottom']
const PORTRAIT_LARGE_ROLES: AutoCollageSlot['role'][] = ['portrait-large-left', 'portrait-large-right']
const PORTRAIT_SMALL_ROLES: AutoCollageSlot['role'][] = [
  'portrait-small-1',
  'portrait-small-2',
  'portrait-small-3',
  'portrait-small-4',
  'portrait-small-5',
  'portrait-small-6',
]
const MIXED_LANDSCAPE1_SMALL3_ROLES: AutoCollageSlot['role'][] = [
  'mixed-landscape-top',
  'mixed-small-top-left',
  'mixed-small-top-middle',
  'mixed-small-top-right',
]
const MIXED_SMALL3_LANDSCAPE1_ROLES: AutoCollageSlot['role'][] = [
  'mixed-small-bottom-left',
  'mixed-small-bottom-middle',
  'mixed-small-bottom-right',
  'mixed-landscape-bottom',
]

const isPortraitSmall = (item: AutoCollageSourceItem): boolean => item.orientation === 'portrait' && item.portraitSize === 'small'

const createSlots = (
  pageId: string,
  roleSet: AutoCollageSlot['role'][],
  itemIds: Array<string | null>,
): AutoCollageSlot[] =>
  roleSet.map((role, index) => ({
    slotId: `${pageId}-slot-${index + 1}`,
    itemId: itemIds[index] ?? null,
    role,
    order: index + 1,
  }))

const collectConsecutiveSmall = (items: readonly AutoCollageSourceItem[], start: number, maxCount: number): number => {
  let count = 0
  while (start + count < items.length && count < maxCount) {
    if (!isPortraitSmall(items[start + count])) {
      break
    }
    count += 1
  }
  return count
}

export function buildAutoCollageLayout(viewModels: readonly AutoCollageSourceItem[]): AutoCollagePage[] {
  const layout: AutoCollagePage[] = []

  let pointer = 0
  let pageNo = 1

  while (pointer < viewModels.length) {
    const current = viewModels[pointer]
    const pageId = `page-${String(pageNo).padStart(2, '0')}`
    const next = viewModels[pointer + 1]

    if (current.orientation === 'landscape') {
      if (next && next.orientation === 'landscape') {
        layout.push({
          pageId,
          template: 'landscape-2',
          slots: createSlots(pageId, LANDSCAPE_2_ROLES, [current.itemId, next.itemId]),
        })
        pointer += 2
        pageNo += 1
        continue
      }

      if (next && isPortraitSmall(next)) {
        const smallCount = collectConsecutiveSmall(viewModels, pointer + 1, 3)
        const itemIds: Array<string | null> = [
          current.itemId,
          ...viewModels.slice(pointer + 1, pointer + 1 + smallCount).map((item) => item.itemId),
        ]

        while (itemIds.length < MIXED_LANDSCAPE1_SMALL3_ROLES.length) {
          itemIds.push(null)
        }

        layout.push({
          pageId,
          template: 'mixed-landscape1-small3',
          slots: createSlots(pageId, MIXED_LANDSCAPE1_SMALL3_ROLES, itemIds),
        })
        pointer += 1 + smallCount
        pageNo += 1
        continue
      }

      layout.push({
        pageId,
        template: 'landscape-2',
        slots: createSlots(pageId, LANDSCAPE_2_ROLES, [current.itemId, null]),
      })
      pointer += 1
      pageNo += 1
      continue
    }

    if (current.portraitSize === 'small') {
      const portraitSmallCount = collectConsecutiveSmall(viewModels, pointer, 6)
      const nextAfter = viewModels[pointer + portraitSmallCount]

      if (portraitSmallCount <= 3 && nextAfter?.orientation === 'landscape') {
        const itemIds: Array<string | null> = [
          ...viewModels.slice(pointer, pointer + portraitSmallCount).map((item) => item.itemId),
        ]
        while (itemIds.length < 3) {
          itemIds.push(null)
        }
        itemIds.push(nextAfter.itemId)
        while (itemIds.length < MIXED_SMALL3_LANDSCAPE1_ROLES.length) {
          itemIds.push(null)
        }

        layout.push({
          pageId,
          template: 'mixed-small3-landscape1',
          slots: createSlots(pageId, MIXED_SMALL3_LANDSCAPE1_ROLES, itemIds),
        })
        pointer += portraitSmallCount + 1
        pageNo += 1
        continue
      }

      const itemIds: Array<string | null> = [
        ...viewModels.slice(pointer, pointer + portraitSmallCount).map((item) => item.itemId),
      ]
      while (itemIds.length < PORTRAIT_SMALL_ROLES.length) {
        itemIds.push(null)
      }

      layout.push({
        pageId,
        template: 'portrait-small-6',
        slots: createSlots(pageId, PORTRAIT_SMALL_ROLES, itemIds),
      })
      pointer += portraitSmallCount
      pageNo += 1
      continue
    }

    if (next && (next.orientation === 'landscape' || next.portraitSize === 'small')) {
      layout.push({
        pageId,
        template: 'portrait-large-2',
        slots: createSlots(pageId, PORTRAIT_LARGE_ROLES, [current.itemId, null]),
      })
      pointer += 1
      pageNo += 1
      continue
    }

    if (next && next.orientation === 'portrait' && next.portraitSize === 'large') {
      layout.push({
        pageId,
        template: 'portrait-large-2',
        slots: createSlots(pageId, PORTRAIT_LARGE_ROLES, [current.itemId, next.itemId]),
      })
      pointer += 2
      pageNo += 1
      continue
    }

    layout.push({
      pageId,
      template: 'portrait-large-2',
      slots: createSlots(pageId, PORTRAIT_LARGE_ROLES, [current.itemId, null]),
    })
    pointer += 1
    pageNo += 1
  }

  return layout
}

export function findPageIndexByItemId(layout: readonly AutoCollagePage[], itemId: string): number {
  return layout.findIndex((page) => page.slots.some((slot) => slot.itemId === itemId))
}

export function countBlankSlots(layout: readonly AutoCollagePage[]): number {
  return layout.reduce((total, page) => {
    const blankSlotsOnPage = page.slots.reduce((pageTotal, slot) => pageTotal + (slot.itemId ? 0 : 1), 0)
    return total + blankSlotsOnPage
  }, 0)
}
