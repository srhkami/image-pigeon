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
    <div className='columns-1 flex flex-col items-center'>
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
