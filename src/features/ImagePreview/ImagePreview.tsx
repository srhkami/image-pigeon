import {CustomImage} from "@/utils/type.ts";
import {Dispatch, ReactNode, SetStateAction} from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges
} from '@dnd-kit/modifiers'
import ImageCard from "@/features/ImagePreview/ImageCard.tsx";

type Props = {
  images: CustomImage[],
  setImages: Dispatch<SetStateAction<CustomImage[]>>
}

export default function ImagePreview({images, setImages}: Props) {

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}})
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex(item => item.id === active.id)
    const newIndex = images.findIndex(item => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      setImages(arrayMove(images, oldIndex, newIndex));
    }
  }

  const imageList: ReactNode[] = images.map((img, index) => (
    <ImageCard key={img.id} id={img.id} img={img} index={index} images={images} setImages={setImages}/>
  ))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={images.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className='columns-1 px-3 py-5'>
          {imageList}
        </div>
      </SortableContext>
    </DndContext>
  )
}