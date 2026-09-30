import {ProjectItemViewModel} from '@/types/project.ts'
import {twMerge} from 'tailwind-merge'
import clsx from 'clsx'
import type {
  AutoCollagePage,
  AutoCollageSlot
} from '@/features/ImagePreview/autoCollageLayout.ts'

type Props = {
  readonly page: AutoCollagePage
  readonly pageIndex: number
  readonly activeItemId: string | null
  readonly itemById: (itemId: string) => ProjectItemViewModel | undefined
  readonly isActivePage: boolean
  readonly pageRef?: (node: HTMLButtonElement | null) => void
  readonly onPageActivate: () => void
}

const TEMPLATE_LABEL: Record<AutoCollagePage['template'], string> = {
  'landscape-2': '2張橫圖(上下)',
  'portrait-large-2': '2張直圖(左右)',
  'portrait-small-6': '6格直圖(3x2)',
  'grid-4': '4格(2x2)',
  'mixed-landscape1-grid2': '上下 + 四張(1+2)',
  'mixed-grid2-landscape1': '四張 + 上下(2+1)',
  'mixed-grid2-small3': '四張 + 六張(2+3)',
  'mixed-small3-grid2': '六張 + 四張(3+2)',
  'mixed-landscape1-small3': '橫圖 + 小直(1+3)',
  'mixed-small3-landscape1': '小直 + 橫圖(3+1)',
}

const MIXED_GRID_SLOT_CLASS: Partial<Record<AutoCollageSlot['role'], string>> = {
  'grid-4-top-left': 'row-start-1 row-end-2 col-start-1 col-end-4',
  'grid-4-top-right': 'row-start-1 row-end-2 col-start-4 col-end-7',
  'grid-4-bottom-left': 'row-start-2 row-end-3 col-start-1 col-end-4',
  'grid-4-bottom-right': 'row-start-2 row-end-3 col-start-4 col-end-7',
  'portrait-small-1': 'row-start-1 row-end-2 col-start-1 col-end-3',
  'portrait-small-2': 'row-start-1 row-end-2 col-start-3 col-end-5',
  'portrait-small-3': 'row-start-1 row-end-2 col-start-5 col-end-7',
  'portrait-small-4': 'row-start-2 row-end-3 col-start-1 col-end-3',
  'portrait-small-5': 'row-start-2 row-end-3 col-start-3 col-end-5',
  'portrait-small-6': 'row-start-2 row-end-3 col-start-5 col-end-7',
}

const getSlotClass = (role: AutoCollageSlot['role'], template: AutoCollagePage['template']) => {
  if (template === 'mixed-grid2-small3' || template === 'mixed-small3-grid2') {
    return MIXED_GRID_SLOT_CLASS[role] ?? ''
  }
  if (role === 'mixed-grid4-landscape-top') {
    return 'row-start-1 row-end-2 col-start-1 col-end-3'
  }
  if (role === 'mixed-grid4-landscape-bottom') {
    return 'row-start-2 row-end-3 col-start-1 col-end-3'
  }
  if (role === 'grid-4-top-left') {
    return 'row-start-1 row-end-2 col-start-1 col-end-2'
  }
  if (role === 'grid-4-top-right') {
    return 'row-start-1 row-end-2 col-start-2 col-end-3'
  }
  if (role === 'grid-4-bottom-left') {
    return 'row-start-2 row-end-3 col-start-1 col-end-2'
  }
  if (role === 'grid-4-bottom-right') {
    return 'row-start-2 row-end-3 col-start-2 col-end-3'
  }
  if (role === 'landscape-top') {
    return 'row-start-1 row-end-2 col-span-3'
  }
  if (role === 'mixed-landscape-top') {
    return 'row-start-1 row-end-2 col-span-3'
  }
  if (role === 'mixed-landscape-bottom') {
    return 'row-start-2 row-end-3 col-span-3'
  }
  if (role === 'mixed-small-top-left') {
    return 'row-start-2 row-end-3 col-start-1 col-end-2'
  }
  if (role === 'mixed-small-top-middle') {
    return 'row-start-2 row-end-3 col-start-2 col-end-3'
  }
  if (role === 'mixed-small-top-right') {
    return 'row-start-2 row-end-3 col-start-3 col-end-4'
  }
  if (role === 'mixed-small-bottom-left') {
    return 'row-start-1 row-end-2 col-start-1 col-end-2'
  }
  if (role === 'mixed-small-bottom-middle') {
    return 'row-start-1 row-end-2 col-start-2 col-end-3'
  }
  if (role === 'mixed-small-bottom-right') {
    return 'row-start-1 row-end-2 col-start-3 col-end-4'
  }

  return ''
}

const getGridClass = (template: AutoCollagePage['template']) => {
  if (template === 'mixed-grid2-small3' || template === 'mixed-small3-grid2') {
    return 'grid grid-cols-6 grid-rows-2 gap-1'
  }
  if (template === 'landscape-2') {
    return 'grid grid-rows-2 gap-1'
  }
  if (template === 'portrait-large-2') {
    return 'grid grid-cols-2 gap-1'
  }
  if (template === 'grid-4' || template === 'mixed-landscape1-grid2' || template === 'mixed-grid2-landscape1') {
    return 'grid grid-cols-2 grid-rows-2 gap-1'
  }
  return 'grid grid-cols-3 grid-rows-2 gap-1'
}

export default function CollagePageThumbnail({
  page,
  pageIndex,
  activeItemId,
  itemById,
  isActivePage,
  pageRef,
  onPageActivate,
}: Props) {
  const firstNonEmptyItemId = page.slots.find((slot) => slot.itemId)?.itemId ?? null

  const renderSlot = (slot: AutoCollageSlot) => {
    const item = slot.itemId ? itemById(slot.itemId) : undefined
    const isActiveSlot = slot.itemId === activeItemId && Boolean(activeItemId)
    const slotClassName = twMerge(
      'relative overflow-hidden rounded-lg border bg-base-200/70',
      'flex items-center justify-center min-h-0',
      clsx({
        'ring-2 ring-info border-info': isActiveSlot,
        'border-base-300/80': !isActiveSlot,
      }),
      getSlotClass(slot.role, page.template)
    )

    if (!item) {
      return (
        <div key={slot.slotId} className={slotClassName}>
          <span className='text-xs text-base-content/45'>空</span>
        </div>
      )
    }

    const slotItemId = slot.itemId ?? ''
    const slotTitle = item.remark ? `${slotItemId}: ${item.remark}` : slotItemId
    return (
      <div key={slot.slotId} className={slotClassName} title={slotTitle}>
        <img
          src={item.previewUrl}
          alt={slotTitle}
          className='h-full w-full object-contain'
          style={{
            transform: `rotate(${item.rotation}deg)`,
          }}
        />
      </div>
    )
  }

  const pageClassName = twMerge(
    'card card-compact mx-auto w-full max-w-[11rem] bg-base-100 border transition-all',
    clsx({
      'border-accent bg-accent/5 shadow-md': isActivePage,
      'border-base-300/50': !isActivePage,
    })
  )

  return (
    <button
      type='button'
      ref={pageRef}
      className={pageClassName}
      onClick={() => firstNonEmptyItemId && onPageActivate()}
      title='點選這一頁後，左側焦點會跳到頁面第一張圖片'
    >
      <div className='card-body px-2 py-2 space-y-1'>
        <div className='flex items-center justify-between'>
          <span className='badge badge-xs badge-outline'>第 {pageIndex + 1} 頁</span>
          <span className='badge badge-xs badge-soft'>{TEMPLATE_LABEL[page.template]}</span>
        </div>
        <div className='divider my-0'></div>
        <div className={twMerge('aspect-[210/297] rounded-sm border border-base-300 bg-white p-1 shadow-inner', getGridClass(page.template))}>
          {page.slots.map(renderSlot)}
        </div>
      </div>
    </button>
  )
}
