import {Dispatch, SetStateAction} from 'react'
import {CgMenuGridR} from 'react-icons/cg'
import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import clsx from 'clsx'
import {twMerge} from 'tailwind-merge'
import {ProjectItemViewModel} from '@/types/project.ts'

type Props = {
  readonly viewModel: ProjectItemViewModel,
  readonly index: number,
  readonly activeItemId: string | null,
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>,
}

export default function ImageCardForMove({
  viewModel,
  index,
  activeItemId,
  setActiveItemId,
}: Props) {

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({id: viewModel.itemId})

  const isActive = viewModel.itemId === activeItemId

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const typeTag = viewModel.orientation === 'landscape'
    ? {label: '橫向', style: 'badge-info'}
    : viewModel.portraitSize === 'small'
      ? {label: '直向小圖', style: 'badge-warning'}
      : {label: '直向大圖', style: 'badge-success'}

  const summaryText = viewModel.remark.trim() || viewModel.originalName || '未命名'

  const classes = twMerge(
    'relative rounded-xl border bg-base-100 shadow-sm p-2',
    'flex items-center gap-2 cursor-pointer transition-all',
    clsx({
      'border-accent/40 bg-accent/5 ring-2 ring-accent': isActive,
      'border-warning/40 shadow-lg z-20 bg-accent/10': isDragging,
      'hover:border-accent/60': !isActive,
    })
  )

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={classes}
      role='button'
      onClick={() => setActiveItemId(viewModel.itemId)}
    >
      <div className='rounded-tr flex flex-col z-10'>
        <button
          type='button'
          className='btn btn-ghost btn-sm btn-circle cursor-grab'
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          {...listeners}
          title='拖曳排序'
        >
          <CgMenuGridR className='text-lg'/>
        </button>
      </div>

      <span className='badge badge-outline'>#{index + 1}</span>

      <figure className='aspect-video h-20 w-36 overflow-hidden rounded-lg bg-base-200/50 shrink-0'>
        <div className='inset-0 flex items-center justify-center'
             style={{
               transform: `rotate(${viewModel.rotation}deg)`,
               transformOrigin: 'center',
             }}>
          <img
            src={viewModel.previewUrl}
            alt={summaryText}
            className="object-cover w-full h-full"
          />
        </div>
      </figure>

      <div className='flex-1 min-w-0 flex items-center justify-between'>
        <span className={`badge ${typeTag.style}`}>{typeTag.label}</span>
        <span className='text-sm text-base-content/70 truncate ml-3' title={summaryText}>
          {summaryText}
        </span>
      </div>
    </div>
  )
}
