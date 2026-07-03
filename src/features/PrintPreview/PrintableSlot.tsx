import {CSSProperties, useEffect, useRef} from 'react'
import {ProjectItemViewModel} from '@/types/project.ts'
import {twMerge} from 'tailwind-merge'
import clsx from 'clsx'
import {AutoCollageSlot} from '@/features/ImagePreview/autoCollageLayout.ts'
import {formatPrintImageNumber} from './printLayout.ts'

type Props = {
  readonly slot: AutoCollageSlot
  readonly indexInPrint: number | null
  readonly item: ProjectItemViewModel | undefined
  readonly fontSize: '16' | '18' | '20'
  readonly alignVertical: 'top' | 'center'
  readonly onImageLoaded: (itemId: string) => void
  readonly onImageErrored: (itemId: string) => void
}

const SLOT_CLASS_BY_ROLE: Record<AutoCollageSlot['role'], string> = {
  'landscape-top': 'print-slot-grid-landscape-top',
  'landscape-bottom': 'print-slot-grid-landscape-bottom',
  'portrait-large-left': 'print-slot-grid-portrait-large-left',
  'portrait-large-right': 'print-slot-grid-portrait-large-right',
  'portrait-small-1': 'print-slot-grid-portrait-small-1',
  'portrait-small-2': 'print-slot-grid-portrait-small-2',
  'portrait-small-3': 'print-slot-grid-portrait-small-3',
  'portrait-small-4': 'print-slot-grid-portrait-small-4',
  'portrait-small-5': 'print-slot-grid-portrait-small-5',
  'portrait-small-6': 'print-slot-grid-portrait-small-6',
  'mixed-landscape-top': 'print-slot-grid-mixed-landscape-top',
  'mixed-small-top-left': 'print-slot-grid-mixed-small-top-left',
  'mixed-small-top-middle': 'print-slot-grid-mixed-small-top-middle',
  'mixed-small-top-right': 'print-slot-grid-mixed-small-top-right',
  'mixed-small-bottom-left': 'print-slot-grid-mixed-small-bottom-left',
  'mixed-small-bottom-middle': 'print-slot-grid-mixed-small-bottom-middle',
  'mixed-small-bottom-right': 'print-slot-grid-mixed-small-bottom-right',
  'mixed-landscape-bottom': 'print-slot-grid-mixed-landscape-bottom',
}

export default function PrintableSlot({
  slot,
  indexInPrint,
  item,
  fontSize,
  alignVertical,
  onImageLoaded,
  onImageErrored,
}: Props) {

  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!item) {
      return
    }

    const img = imageRef.current
    if (!img) {
      return
    }

    if (!img.complete) {
      return
    }

    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      onImageErrored(item.itemId)
      return
    }

    onImageLoaded(item.itemId)
  }, [item?.itemId, onImageLoaded, onImageErrored, item])

  const slotClassName = twMerge(
    'print-slot group relative overflow-hidden',
    'rounded-md border border-base-300/80 bg-base-200/45',
    SLOT_CLASS_BY_ROLE[slot.role],
  )

  if (!item) {
    return (
      <div className={slotClassName}>
        <div className='print-slot-empty'>空格</div>
      </div>
    )
  }

  const remarkStyleClass = twMerge(
    'print-slot-remark',
    clsx({'items-start': alignVertical === 'top', 'items-center': alignVertical === 'center'}),
  )

  const slotStyle = {'--print-font-size': `${fontSize}px`} as CSSProperties

  return (
    <div className={slotClassName} style={slotStyle}>
      <div className='print-slot-media'>
        <img
          ref={imageRef}
          src={item.previewUrl}
          alt={item.remark || `圖片 ${slot.itemId}`}
          className='print-slot-image'
          style={{transform: `rotate(${item.rotation}deg)`}}
          onLoad={() => onImageLoaded(item.itemId)}
          onError={() => onImageErrored(item.itemId)}
          loading='eager'
        />
      </div>
      <div className={remarkStyleClass}>
        <div className='print-slot-number'>
          {formatPrintImageNumber(indexInPrint ?? 0)}
        </div>
        <div
          className='print-slot-remark-text'
          title={item.remark || `圖片 ${slot.slotId}`}
        >
          {item.remark || '未填備註'}
        </div>
      </div>
    </div>
  )
}
