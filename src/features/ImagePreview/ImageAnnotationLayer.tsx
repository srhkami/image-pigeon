import {useEffect, useId, useRef, useState, type DragEvent, type PointerEvent} from 'react'
import type {AnnotationEditor, ImageAnnotation, MagnificationTool, ProjectItemViewModel} from '@/types/project.ts'
import {
  ANNOTATION_DRAG_TYPE, EMPTY_ANNOTATIONS, annotationHandles, buildAnnotationPrimitives,
  createAnnotation, createMagnification, decodeAnnotationDrag, imageScene, isImagePoint, moveAnnotation, resizeAnnotation,
  type AnnotationPrimitive, type HandleId, type Point,
} from './annotationGeometry.ts'

type Props = {
  readonly viewModel: ProjectItemViewModel
  readonly editor?: AnnotationEditor
  readonly onLoad?: () => void
  readonly onError?: () => void
}
type Gesture = {
  identity: string
  base: readonly ImageAnnotation[]
  original: ImageAnnotation | null
  id: string
  create?: MagnificationTool
  start: Point
  pointerId: number
  handle?: HandleId
}
const LABELS = {ellipse: '圓形框', rectangle: '矩形框', line: '線條', arrow: '單箭頭', 'double-arrow': '雙箭頭', 'magnify-circle': '圓形放大', 'magnify-rectangle': '矩形放大'}

function primitiveElement(primitive: AnnotationPrimitive, key: number, hit = false, sourceId = '', clipId = '') {
  if (primitive.type === 'image') {
    if (hit) return null
    return <g key={key} pointerEvents='none'>
      <defs><clipPath id={clipId}>
        {primitive.clipShape === 'ellipse'
          ? <ellipse cx={primitive.x + primitive.width / 2} cy={primitive.y + primitive.height / 2} rx={primitive.width / 2} ry={primitive.height / 2}/>
          : <rect x={primitive.x} y={primitive.y} width={primitive.width} height={primitive.height}/>}
      </clipPath></defs>
      <g clipPath={`url(#${clipId})`}>
        <svg x={primitive.x} y={primitive.y} width={primitive.width} height={primitive.height}
          viewBox={`${primitive.sourceX} ${primitive.sourceY} ${primitive.sourceWidth} ${primitive.sourceHeight}`}
          preserveAspectRatio='none' overflow='hidden'>
          <use href={`#${sourceId}`}/>
        </svg>
      </g>
    </g>
  }
  const paint = {
    stroke: hit ? 'transparent' : primitive.stroke, fill: hit ? 'transparent' : (primitive.fill ?? 'none'),
    strokeWidth: hit ? 14 : primitive.strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    ...(hit ? {vectorEffect: 'non-scaling-stroke', pointerEvents: 'all'} : {pointerEvents: 'none'}),
  }
  if (primitive.type === 'ellipse') return <ellipse key={key} {...paint} cx={primitive.cx} cy={primitive.cy} rx={primitive.rx} ry={primitive.ry}/>
  if (primitive.type === 'rectangle') return <rect key={key} {...paint} x={primitive.x} y={primitive.y} width={primitive.width} height={primitive.height}/>
  if (primitive.type === 'line') return <line key={key} {...paint} x1={primitive.x1} y1={primitive.y1} x2={primitive.x2} y2={primitive.y2}/>
  return <polygon key={key} {...paint} points={primitive.points.map(point => `${point.x},${point.y}`).join(' ')}/>
}

export default function ImageAnnotationLayer({viewModel, editor, onLoad, onError}: Props) {
  const clipId = useId()
  const editable = Boolean(editor)
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneRef = useRef<SVGGElement>(null)
  const gestureRef = useRef<Gesture | null>(null)
  const [draftState, setDraftState] = useState<{annotation: ImageAnnotation | null} | null>(null)
  const draft = draftState?.annotation ?? null
  const [scale, setScale] = useState<number | null>(null)
  const annotations = viewModel.annotations ?? EMPTY_ANNOTATIONS
  const swapped = viewModel.rotation === 90 || viewModel.rotation === 270
  const width = swapped ? viewModel.assetHeight : viewModel.assetWidth
  const height = swapped ? viewModel.assetWidth : viewModel.assetHeight
  const scene = imageScene(width, height, viewModel.rotation)
  const identity = JSON.stringify([editor?.scope, viewModel.itemId, viewModel.assetId, viewModel.rotation, Boolean(editor), editor?.magnificationTool?.kind, editor?.magnificationTool?.stroke, editor?.magnificationTool?.strokeWidthLevel])
  const currentRef = useRef({identity, annotations, editor})
  currentRef.current = {identity, annotations, editor}
  const owns = (gesture: Gesture) => currentRef.current.identity === gesture.identity
    && currentRef.current.annotations === gesture.base && Boolean(currentRef.current.editor)
  const activeGesture = gestureRef.current && owns(gestureRef.current) ? gestureRef.current : null
  const visible = annotations.map(annotation => activeGesture && draft?.id === annotation.id ? draft : annotation)
  if (activeGesture?.create && draft) visible.push(draft)
  const selected = editor ? visible.find(annotation => annotation.id === editor.selectedId) : undefined
  const controlRadius = scale ? 5 / scale : Math.min(width, height) * 0.02

  useEffect(() => {
    if (!editable || !svgRef.current || typeof ResizeObserver === 'undefined') return
    const svg = svgRef.current
    const update = () => {
      const rect = svg.getBoundingClientRect()
      const next = Math.min(rect.width / scene.width, rect.height / scene.height)
      if (next > 0) setScale(next)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(svg)
    return () => observer.disconnect()
  }, [editable, scene.width, scene.height])

  useEffect(() => {
    gestureRef.current = null
    setDraftState(null)
    return () => { gestureRef.current = null }
  }, [identity, annotations])

  const imagePoint = (event: {clientX: number; clientY: number}): Point | null => {
    const matrix = sceneRef.current?.getScreenCTM()
    if (!matrix) return null
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    const normalized = {x: point.x / width, y: point.y / height}
    return Number.isFinite(normalized.x) && Number.isFinite(normalized.y) ? normalized : null
  }
  const cancelGesture = () => {
    const gesture = gestureRef.current
    gestureRef.current = null
    setDraftState(null)
    if (gesture && svgRef.current?.hasPointerCapture(gesture.pointerId)) svgRef.current.releasePointerCapture(gesture.pointerId)
  }
  const startGesture = (event: PointerEvent<SVGElement>, annotation: ImageAnnotation, handle?: HandleId) => {
    if (!editor || editor.magnificationTool || event.button !== 0 || gestureRef.current) return
    const point = imagePoint(event)
    if (!point || !isImagePoint(point)) return
    event.preventDefault()
    event.stopPropagation()
    editor.onSelect(annotation.id)
    svgRef.current?.focus()
    svgRef.current?.setPointerCapture(event.pointerId)
    gestureRef.current = {identity, base: annotations, original: annotation, id: annotation.id, start: point, pointerId: event.pointerId, handle}
    setDraftState({annotation})
  }
  const gestureValue = (event: PointerEvent<SVGSVGElement>): ImageAnnotation | null => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId || !owns(gesture)) return null
    const point = imagePoint(event)
    if (!point) return null
    if (gesture.create) return createMagnification(gesture.create.kind, gesture.start, point, gesture.create.stroke, gesture.id, gesture.create.strokeWidthLevel)
    if (!gesture.original) return null
    return gesture.handle ? resizeAnnotation(gesture.original, gesture.handle, point, width, height)
      : moveAnnotation(gesture.original, {x: point.x - gesture.start.x, y: point.y - gesture.start.y})
  }
  const internalDrag = (event: DragEvent<SVGSVGElement>) => Boolean(editor)
    && !event.dataTransfer.types.includes('Files') && event.dataTransfer.types.includes(ANNOTATION_DRAG_TYPE)

  return <svg ref={svgRef} xmlns='http://www.w3.org/2000/svg' viewBox={`0 0 ${scene.width} ${scene.height}`}
              preserveAspectRatio='xMidYMid meet' role={editor ? 'group' : 'img'} aria-label={viewModel.remark || '圖片'}
              tabIndex={editor ? 0 : undefined} data-annotation-editing={editor ? 'true' : undefined}
              data-annotation-gesture={activeGesture ? 'true' : undefined}
              style={{display: 'block', width: '100%', height: '100%', minHeight: 0, touchAction: editor ? 'none' : undefined, cursor: editor?.magnificationTool ? 'crosshair' : undefined}}
              onDragOver={event => {
                if (!internalDrag(event)) return
                event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={event => {
                if (!internalDrag(event) || !editor || currentRef.current.identity !== identity) return
                event.preventDefault(); event.stopPropagation()
                const data = decodeAnnotationDrag(event.dataTransfer.getData(ANNOTATION_DRAG_TYPE))
                const point = imagePoint(event)
                if (!data || !point || !isImagePoint(point)) return
                cancelGesture()
                const annotation = createAnnotation(data.kind, point, data.style, width, height, crypto.randomUUID())
                editor.onChange([...annotations, annotation], annotations)
                editor.onSelect(annotation.id)
                svgRef.current?.focus()
              }}
              onPointerDown={event => {
                if (!editor || event.button !== 0 || gestureRef.current) return
                if (editor.magnificationTool) {
                  const point = imagePoint(event)
                  if (!point || !isImagePoint(point)) return
                  event.preventDefault(); event.stopPropagation()
                  editor.onSelect(null)
                  svgRef.current?.focus()
                  svgRef.current?.setPointerCapture(event.pointerId)
                  gestureRef.current = {identity, base: annotations, original: null, id: crypto.randomUUID(), create: editor.magnificationTool, start: point, pointerId: event.pointerId}
                  setDraftState({annotation: null})
                  return
                }
                cancelGesture(); editor.onSelect(null)
              }}
              onPointerMove={event => {
                if (!gestureRef.current || gestureRef.current.pointerId !== event.pointerId) return
                const value = gestureValue(event)
                if (value) { event.preventDefault(); event.stopPropagation(); setDraftState({annotation: value}) }
                else if (gestureRef.current?.create && owns(gestureRef.current)) setDraftState({annotation: null})
                else cancelGesture()
              }}
              onPointerUp={event => {
                const gesture = gestureRef.current
                if (!gesture || gesture.pointerId !== event.pointerId) return
                const value = gestureValue(event)
                cancelGesture()
                if (!gesture || !value || !owns(gesture)) return
                event.preventDefault(); event.stopPropagation()
                currentRef.current.editor?.onChange(gesture.create ? [...gesture.base, value]
                  : gesture.base.map(annotation => annotation.id === value.id ? value : annotation), gesture.base)
                if (gesture.create) currentRef.current.editor?.onSelect(value.id)
              }}
              onPointerCancel={event => { if (gestureRef.current?.pointerId === event.pointerId) cancelGesture() }}
              onLostPointerCapture={event => { if (gestureRef.current?.pointerId === event.pointerId) cancelGesture() }}
              onKeyDown={event => {
                if (!editor) return
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelGesture(); editor.onMagnificationToolChange?.(null); editor.onSelect(null) }
                else if ((event.key === 'Delete' || event.key === 'Backspace') && selected) {
                  event.preventDefault(); event.stopPropagation(); cancelGesture()
                  editor.onChange(annotations.filter(annotation => annotation.id !== selected.id), annotations)
                  editor.onSelect(null)
                } else if (event.key.startsWith('Arrow')) { event.preventDefault(); event.stopPropagation() }
              }}>
    <defs><clipPath id={clipId}><rect width={width} height={height}/></clipPath></defs>
    <g ref={sceneRef} transform={scene.transform}>
      <g clipPath={`url(#${clipId})`}>
        <image id={`${clipId}-source`} href={viewModel.previewUrl} width={width} height={height} onLoad={onLoad} onError={onError} pointerEvents='none'/>
        {editor && <rect width={width} height={height} fill='transparent'/>}
        {visible.map((annotation, index) => {
          const primitives = buildAnnotationPrimitives(annotation, width, height)
          return <g key={annotation.id} data-annotation-id={annotation.id}
                    role={editor ? 'button' : undefined} tabIndex={editor ? 0 : undefined}
                    aria-label={editor ? `${LABELS[annotation.kind]} ${index + 1}` : undefined}
                    aria-pressed={editor ? editor.selectedId === annotation.id : undefined}
                    style={editor ? {cursor: editor.magnificationTool ? 'crosshair' : 'move'} : undefined}
                    onFocus={() => editor?.onSelect(annotation.id)}
                    onPointerDown={event => startGesture(event, annotation)}>
            {primitives.map((primitive, key) => primitiveElement(primitive, key, false, `${clipId}-source`, `${clipId}-copy-${index}`))}
            {editor && primitives.map((primitive, key) => primitiveElement(primitive, key + primitives.length, true))}
          </g>
        })}
      </g>
      {selected && <g aria-hidden='true'>
        {'x' in selected && <rect x={selected.x * width} y={selected.y * height} width={selected.width * width} height={selected.height * height}
                                fill='none' stroke='#0284c7' strokeWidth={1} strokeDasharray='4 3' vectorEffect='non-scaling-stroke' pointerEvents='none'/>}
        {annotationHandles(selected).map(handle => <circle key={handle.id} data-annotation-handle={handle.id}
          cx={handle.x * width} cy={handle.y * height} r={controlRadius} fill='#ffffff' stroke='#0284c7' strokeWidth={1.5}
          vectorEffect='non-scaling-stroke' style={{cursor: 'crosshair'}} onPointerDown={event => startGesture(event, selected, handle.id)}/>)}
      </g>}
    </g>
  </svg>
}
