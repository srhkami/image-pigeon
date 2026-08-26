import {ProjectItemViewModel} from '@/types/project.ts'
import ImageCardForMove from '@/features/ImagePreview/ImageCardForMove.tsx'
import {Intro} from "@/features";

type Props = {
  readonly viewModels: ProjectItemViewModel[]
  readonly selectedItemIds: ReadonlySet<string>
  readonly onToggleSelectedItem: (itemId: string) => void
}

export default function SortableImageList({viewModels, selectedItemIds, onToggleSelectedItem}: Props) {
  if (!viewModels.length) {
    return <Intro/>
  }

  return (
    <div className='flex h-full min-h-0 w-full max-w-3xl flex-col gap-2 overflow-y-auto overscroll-contain pr-2 pt-3'>
      {viewModels.map((viewModel, index) => (
        <ImageCardForMove
          key={viewModel.itemId}
          viewModel={viewModel}
          index={index}
          isSelected={selectedItemIds.has(viewModel.itemId)}
          onToggleSelectedItem={onToggleSelectedItem}
        />
      ))}
    </div>
  )
}
