import {arrayMove} from '@dnd-kit/sortable'
import {Dispatch, SetStateAction, useEffect, useMemo, useState} from 'react'
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
  restrictToFirstScrollableAncestor
} from '@dnd-kit/modifiers'
import {CustomImage} from '@/utils/type.ts'
import FocusImageEditor from '@/features/ImagePreview/FocusImageEditor.tsx'
import SortableImageList from '@/features/ImagePreview/SortableImageList.tsx'
import {ProjectItemViewModel, ProjectV2} from '@/types/project.ts'
import {getOrderedItemViewModels, reorderItem} from '@/state/projectState.ts'
import CollagePagePreviewRail from '@/features/ImagePreview/CollagePagePreviewRail.tsx'
import {buildAutoCollageLayout, findPageIndexByItemId} from '@/features/ImagePreview/autoCollageLayout.ts'

type Props = {
  readonly project: ProjectV2,
  readonly setProject: Dispatch<SetStateAction<ProjectV2>>,
  readonly sessionId: string | null,
  readonly setImages: Dispatch<SetStateAction<Array<CustomImage>>>,
  readonly isMoveMode: boolean,
}

export default function ImagePreview({project, setProject, sessionId, setImages, isMoveMode}: Props) {

  const viewModels: ProjectItemViewModel[] = getOrderedItemViewModels(project, sessionId ?? "")
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const collageLayout = useMemo(() => buildAutoCollageLayout(viewModels), [viewModels])
  const sortableItemIds = useMemo(() => viewModels.map(item => item.itemId), [viewModels])
  const activePageIndex = useMemo(() => {
    if (!activeItemId) return -1
    return findPageIndexByItemId(collageLayout, activeItemId)
  }, [collageLayout, activeItemId])

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 8}})
  )

  const previewLayoutClassName = 'flex h-full min-h-0 flex-col gap-3 overflow-hidden px-3 py-3 lg:flex-row lg:items-stretch'
  const editorColumnClassName = 'flex min-h-0 w-full flex-1 justify-center overflow-hidden'

  useEffect(() => {
    if (!viewModels.length) {
      setActiveItemId(null)
      return
    }

    if (activeItemId && viewModels.some((item) => item.itemId === activeItemId)) {
      return
    }

    setActiveItemId(viewModels[0]?.itemId ?? null)
  }, [viewModels, activeItemId])

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setProject(prev => reorderItem(prev, activeId, overId))
    setActiveItemId(activeId)

    setImages((prev) => {
      const oldIndex = prev.findIndex(item => item.id === activeId)
      const newIndex = prev.findIndex(item => item.id === overId)
      if (oldIndex === -1 || newIndex === -1) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  if (isMoveMode) {
    return (
      <div className={previewLayoutClassName}>
        <div className={editorColumnClassName}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
          >
            <SortableContext
              items={sortableItemIds}
              strategy={verticalListSortingStrategy}
            >
              <SortableImageList
                viewModels={viewModels}
                activeItemId={activeItemId}
                setActiveItemId={setActiveItemId}
              />
            </SortableContext>
          </DndContext>
        </div>
        <CollagePagePreviewRail
          pages={collageLayout}
          viewModels={viewModels}
          activeItemId={activeItemId}
          activePageIndex={activePageIndex}
          setActiveItemId={setActiveItemId}
        />
      </div>
    )
  }

  return (
    <div className={previewLayoutClassName}>
      <div className={editorColumnClassName}>
        <FocusImageEditor
          viewModels={viewModels}
          activeItemId={activeItemId}
          setActiveItemId={setActiveItemId}
          setProject={setProject}
          setImages={setImages}
        />
      </div>
      <CollagePagePreviewRail
        pages={collageLayout}
        viewModels={viewModels}
        activeItemId={activeItemId}
        activePageIndex={activePageIndex}
        setActiveItemId={setActiveItemId}
      />
    </div>
  )
}
