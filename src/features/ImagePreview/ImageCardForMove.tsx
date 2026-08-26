import {ChangeEvent, KeyboardEvent} from 'react'
import {CgMenuGridR} from 'react-icons/cg'
import {useSortable} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import clsx from 'clsx'
import {twMerge} from 'tailwind-merge'
import {ProjectItemViewModel} from '@/types/project.ts'

type Props = {
  readonly viewModel: ProjectItemViewModel
  readonly index: number
  readonly isSelected: boolean
  readonly onToggleSelectedItem: (itemId: string) => void
}

export default function ImageCardForMove({viewModel, index, isSelected, onToggleSelectedItem}: Props) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: viewModel.itemId})
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    willChange: isDragging ? 'transform' : undefined
  }
  const layoutTag = {
    'stacked-2': {label: '上下', style: 'badge-info'},
    'side-by-side-2': {label: '左右', style: 'badge-success'},
    'grid-6': {label: '六張', style: 'badge-warning'},
  }[viewModel.layoutPreference]
  const toggle = () => onToggleSelectedItem(viewModel.itemId)
  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    toggle()
  }
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    toggle()
  }

  return (
    <div ref={setNodeRef} style={style}
         className={twMerge('relative flex w-full items-center justify-center rounded-xl border bg-base-100 px-14 py-3 shadow-sm cursor-pointer select-none transition-colors', clsx({
           'border-accent/40 bg-accent/5 ring-2 ring-accent': isSelected,
           'border-warning/40 opacity-90 shadow-lg z-20 bg-accent/10': isDragging,
           'hover:border-accent/60': !isSelected,
         }))}
         tabIndex={0} onClick={toggle} onKeyDown={handleCardKeyDown}>
      <span className='absolute left-3 top-3 z-10 badge badge-outline'>#{index + 1}</span>
      <label className='absolute bottom-3 left-3 z-10 cursor-pointer label' onClick={(event) => event.stopPropagation()}>
        <input type='checkbox' className='checkbox checkbox-primary' checked={isSelected}
               onChange={handleCheckboxChange} aria-label={`選取圖片 ${index + 1}`}/>
        選取
      </label>
      <button type='button'
              className={twMerge('absolute left-3 top-1/2 -translate-y-1/2 z-10 btn btn-ghost btn-sm touch-none cursor-grab', clsx({'cursor-grabbing': isDragging}))}
              {...attributes} {...listeners} onClick={(event) => event.stopPropagation()} title='拖曳排序'>
        <CgMenuGridR className='text-lg'/> 拖曳排序
      </button>

      <figure
        className='mx-auto flex aspect-video h-72 w-[32rem] max-w-full items-center justify-center overflow-hidden rounded-lg bg-base-200/50'>
        <div className='flex h-full w-full items-center justify-center'
             style={{transform: `rotate(${viewModel.rotation}deg)`, transformOrigin: 'center'}}>
          <img src={viewModel.previewUrl} alt={`圖片 ${index + 1}`} className='object-contain w-full h-full'/>
        </div>
      </figure>
      <span className={`absolute bottom-3 right-3 z-10 badge ${layoutTag.style}`}>{layoutTag.label}</span>
    </div>
  )
}
