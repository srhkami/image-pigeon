import {Dispatch, SetStateAction} from 'react'
import {ProjectItemViewModel} from '@/types/project.ts'
import ImageCardForMove from '@/features/ImagePreview/ImageCardForMove.tsx'

type Props = {
  readonly viewModels: ProjectItemViewModel[]
  readonly activeItemId: string | null
  readonly setActiveItemId: Dispatch<SetStateAction<string | null>>
}

export default function SortableImageList({viewModels, activeItemId, setActiveItemId}: Props) {
  if (!viewModels.length) {
    return (
      <div className='text-sm text-base-content/65'>尚未加入圖片，請先匯入後再進行排序。</div>
    )
  }

  return (
    <div className='flex h-full min-h-0 w-full max-w-3xl flex-col gap-2 overflow-y-auto overscroll-contain pr-2'>
      {viewModels.map((viewModel, index) => (
        <ImageCardForMove
          key={viewModel.itemId}
          viewModel={viewModel}
          index={index}
          activeItemId={activeItemId}
          setActiveItemId={setActiveItemId}
        />
      ))}
    </div>
  )
}
