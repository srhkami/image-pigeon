import {Dispatch, KeyboardEvent, SetStateAction} from 'react'
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
    transition,
    touchAction: 'none',
    willChange: isDragging ? 'transform' : undefined,
  }

  const layoutTag = {
    'stacked-2': {label: '上下', style: 'badge-info'},
    'side-by-side-2': {label: '左右', style: 'badge-success'},
    'grid-6': {label: '六張', style: 'badge-warning'},
  }[viewModel.layoutPreference]

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) {
      return
    }
    event.preventDefault()
    setActiveItemId(viewModel.itemId)
  }

  const classes = twMerge(
    'relative w-full rounded-xl border bg-base-100 shadow-sm p-3',
    'flex flex-wrap items-center gap-3 cursor-pointer select-none transition-colors',
    clsx({
      'border-accent/40 bg-accent/5 ring-2 ring-accent': isActive,
      'border-warning/40 opacity-90 shadow-lg z-20 bg-accent/10': isDragging,
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
      tabIndex={0}
      onClick={() => setActiveItemId(viewModel.itemId)}
      onKeyDown={handleCardKeyDown}
    >
      <div className='rounded-tr flex flex-col z-10'>
        <button
          type='button'
          className={twMerge('btn btn-ghost btn-sm btn-circle touch-none cursor-grab', clsx({'cursor-grabbing': isDragging}))}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          {...listeners}
          title='拖曳排序'
        >
          <CgMenuGridR className='text-lg'/>
        </button>
      </div>

      <span className='badge badge-outline'>#{index + 1}</span>

      <figure className='aspect-video h-72 w-[32rem] max-w-full overflow-hidden rounded-lg bg-base-200/50'>
        <div className='flex h-full w-full items-center justify-center'
             style={{
               transform: `rotate(${viewModel.rotation}deg)`,
               transformOrigin: 'center',
             }}>
          <img
            src={viewModel.previewUrl}
            alt={`圖片 ${index + 1}`}
            className='object-contain w-full h-full'
          />
        </div>
      </figure>

      <span className={`badge ${layoutTag.style}`}>{layoutTag.label}</span>
    </div>
  )
}
