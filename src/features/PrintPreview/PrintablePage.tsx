import {AutoCollagePage, AutoCollageSlot} from '@/features/ImagePreview/autoCollageLayout.ts'
import {twMerge} from 'tailwind-merge'
import PrintableSlot from '@/features/PrintPreview/PrintableSlot.tsx'
import {ProjectItemViewModel} from '@/types/project.ts'

type Props = {
  readonly page: AutoCollagePage
  readonly pageIndex: number
  readonly slotIndexMap: Record<string, number | null>
  readonly itemById: ReadonlyMap<string, ProjectItemViewModel>
  readonly fontSize: '10' | '11' | '12' | '13' | '14'
  readonly alignVertical: 'top' | 'center'
  readonly onImageLoaded: (itemId: string) => void
  readonly onImageErrored: (itemId: string) => void
}

const getGridClass = (template: AutoCollagePage['template']) => {
  if (template === 'landscape-2') {
    return 'print-page-grid print-page-grid-landscape-2'
  }

  if (template === 'portrait-large-2') {
    return 'print-page-grid print-page-grid-portrait-large-2'
  }

  if (template === 'portrait-small-6') {
    return 'print-page-grid print-page-grid-portrait-small-6'
  }

  if (template === 'mixed-landscape1-small3') {
    return 'print-page-grid print-page-grid-mixed-landscape1-small3'
  }

  return 'print-page-grid print-page-grid-mixed-small3-landscape1'
}

const TEMPLATES: Record<AutoCollagePage['template'], string> = {
  'landscape-2': '橫圖頁（上下）',
  'portrait-large-2': '直圖頁（左右）',
  'portrait-small-6': '小直圖頁（3x2）',
  'mixed-landscape1-small3': '混合頁（上橫下3小）',
  'mixed-small3-landscape1': '混合頁（上3小下橫）',
}

export default function PrintablePage({
  page,
  pageIndex,
  slotIndexMap,
  itemById,
  fontSize,
  alignVertical,
  onImageLoaded,
  onImageErrored,
}: Props) {
  const renderSlot = (slot: AutoCollageSlot) => {
    const item = slot.itemId ? itemById.get(slot.itemId) : undefined

    return (
      <PrintableSlot
        key={slot.slotId}
        pageTitle={TEMPLATES[page.template]}
        slot={slot}
        item={item}
        indexInPrint={slotIndexMap[slot.slotId] ?? null}
        fontSize={fontSize}
        alignVertical={alignVertical}
        onImageLoaded={onImageLoaded}
        onImageErrored={onImageErrored}
      />
    )
  }

  return (
    <section className='print-page'>
      <div className='print-page-header'>
        <div>
          <div className='print-page-title'>第 {pageIndex + 1} 頁</div>
          <div className='text-xs text-base-content/70'>{TEMPLATES[page.template]}</div>
        </div>
      </div>
      <div className={twMerge('print-page-body', getGridClass(page.template))}>
        {page.slots.map(renderSlot)}
      </div>
      <div className='print-page-footer' style={{fontSize: `${fontSize}px`}}>
        共 {page.slots.length} 個欄位 · 本頁版型：{TEMPLATES[page.template]}
      </div>
    </section>
  )
}
