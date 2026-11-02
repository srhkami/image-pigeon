import {useState} from 'react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {LuArrowLeftRight, LuArrowUpRight, LuCircle, LuMinus, LuRectangleHorizontal, LuScan, LuZoomIn} from 'react-icons/lu'
import type {BasicAnnotationKind, ImageAnnotation, MagnificationKind, MagnificationTool} from '@/types/project.ts'
import {ANNOTATION_DRAG_TYPE, encodeAnnotationDrag} from './annotationGeometry.ts'

const TOOLS = [
  {id: 'ellipse', label: '圓形框', group: 'mark', Icon: LuCircle, supportsFill: true},
  {id: 'rectangle', label: '矩形框', group: 'mark', Icon: LuRectangleHorizontal, supportsFill: true},
  {id: 'line', label: '線條', group: 'mark', Icon: LuMinus, supportsFill: false},
  {id: 'arrow', label: '單箭頭', group: 'mark', Icon: LuArrowUpRight, supportsFill: false},
  {id: 'double-arrow', label: '雙箭頭', group: 'mark', Icon: LuArrowLeftRight, supportsFill: false},
  {id: 'magnify-circle', label: '圓形放大', group: 'magnify', Icon: LuZoomIn, supportsFill: false},
  {id: 'magnify-rectangle', label: '矩形放大', group: 'magnify', Icon: LuScan, supportsFill: false},
] as const
const GROUPS = [{id: 'mark', label: '圖片標記'}, {id: 'magnify', label: '局部放大'}] as const


type Props = {
  readonly disabled?: boolean
  readonly selectedAnnotation?: ImageAnnotation
  readonly magnificationTool?: MagnificationTool | null
  readonly onMagnificationToolChange?: (tool: MagnificationTool | null) => void
  readonly onClearSelection?: () => void

}
type ToolId = (typeof TOOLS)[number]['id']

export default function ImageAnnotationToolbar({disabled = false, selectedAnnotation, magnificationTool, onMagnificationToolChange, onClearSelection}: Props) {
  const [selectedTool, setSelectedTool] = useState<ToolId | null>(null)
  const activeTool = TOOLS.find(tool => tool.id === (selectedAnnotation?.kind ?? magnificationTool?.kind ?? selectedTool))

  return <section aria-label='圖片標記工具' className='border-t border-base-300 pt-3'
    onKeyDown={event => {
      if (event.key !== 'Escape' || !magnificationTool) return
      event.preventDefault(); event.stopPropagation(); onMagnificationToolChange?.(null)
    }}>
    <fieldset disabled={disabled}
              className='m-0 min-w-0 space-y-4 border-0 p-0 disabled:opacity-50'>
      <legend className='sr-only'>圖片標記工具</legend>
      {GROUPS.map(group => <div key={group.id}>
        <h3 className='mb-2 text-xs font-medium text-base-content/60'>{group.label}</h3>
        <div className='grid grid-cols-2 gap-1.5'>
          {TOOLS.filter(tool => tool.group === group.id).map(({id: toolId, label, Icon}) => <button
            key={toolId} type='button' aria-label={label} aria-pressed={activeTool?.id === toolId}
            disabled={disabled} draggable={!disabled && group.id === 'mark'}
            className={clsx('btn btn-sm h-10 min-h-10 w-full justify-start gap-1.5 px-2 text-xs',
              activeTool?.id === toolId ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 bg-base-100 text-base-content')}
            onClick={() => {
              if (disabled) return
              onClearSelection?.()
              setSelectedTool(group.id === 'mark' ? toolId : null)
              onMagnificationToolChange?.(group.id === 'magnify' ? {kind: toolId as MagnificationKind, stroke: '#ef4444'} : null)
              toast(group.id === 'mark' ? '請直接拖曳到圖片上' : '請在圖片上圈選範圍', {id: 'image-annotation-tool-hint', duration: 2400})
            }}
            onDragStart={event => {
              if (disabled || group.id !== 'mark') { event.preventDefault(); return }
              event.dataTransfer.setData(ANNOTATION_DRAG_TYPE, encodeAnnotationDrag(toolId as BasicAnnotationKind, {stroke: '#ef4444', fill: null}))
              event.dataTransfer.effectAllowed = 'copy'
              onClearSelection?.(); onMagnificationToolChange?.(null); setSelectedTool(toolId)
            }}>
            <Icon className='size-4 shrink-0' aria-hidden='true'/><span>{label}</span>
          </button>)}
        </div>
      </div>)}

    </fieldset>
  </section>
}
