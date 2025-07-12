import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges
} from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import {Button} from "@/component";

type Item = {
  id: string
  label: string
}

const initialItems: Item[] = [
  { id: 'a', label: '項目 A' },
  { id: 'b', label: '項目 B' },
  { id: 'c', label: '項目 C' },
  { id: 'd', label: '項目 D' }
]

export default function Test() {
  const [items, setItems] = useState<Item[]>(initialItems)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      setItems(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 px-4">
          {items.map(item => (
            <SortableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
      </SortableContext>
      <Button onClick={()=>console.log(items)}>
        輸出
      </Button>
    </DndContext>
  )
}

function SortableItem({ id, label }: { id: string; label: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={style}
      className={`rounded border p-4 shadow-sm ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <button {...listeners} className="btn btn-sm btn-ghost cursor-grab">
        ⠿
      </button>
      {label}

    </div>
  )
}