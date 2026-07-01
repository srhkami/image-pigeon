import {arrayMove} from '@dnd-kit/sortable'
import {Dispatch, ReactNode, SetStateAction} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges
} from '@dnd-kit/modifiers'
import {CustomImage} from "@/utils/type.ts";
import ImageCard from "@/features/ImagePreview/ImageCard.tsx";
import ImageCardForMove from "@/features/ImagePreview/ImageCardForMove.tsx";
import {ProjectItemViewModel} from "@/types/project.ts";
import {getOrderedItemViewModels, reorderItem} from "@/state/projectState.ts";
import {ProjectV2} from "@/types/project.ts";

type Props = {
  readonly project: ProjectV2,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly sessionId: string | null,
  readonly setImages: Dispatch<SetStateAction<Array<CustomImage>>>,
  readonly isMoveMode: boolean,
}

export default function ImagePreview({project, setProject, sessionId, setImages, isMoveMode}: Props) {

  const viewModels: ProjectItemViewModel[] = getOrderedItemViewModels(project, sessionId ?? "")

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}})
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setProject(prev => reorderItem(prev, activeId, overId))

    setImages((prev) => {
      const oldIndex = prev.findIndex(item => item.id === activeId)
      const newIndex = prev.findIndex(item => item.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const imageList: ReactNode[] = viewModels.map((viewModel, index) => {
    const commonProps = {
      viewModel,
      setProject,
      index,
      setImages,
    }
    if (isMoveMode) {
      return <ImageCardForMove key={viewModel.itemId} {...commonProps} />
    }
    return <ImageCard key={viewModel.itemId} {...commonProps} />
  })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={viewModels.map(item => item.itemId)}
        strategy={verticalListSortingStrategy}
      >
        <div className='columns-1 px-3 py-5 flex flex-col items-center'>
          {imageList}
        </div>
      </SortableContext>
    </DndContext>
  )
}
