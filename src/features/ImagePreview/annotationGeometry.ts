import type {AnnotationKind, AnnotationRect, AnnotationStrokeWidthLevel, AnnotationStyle, BasicAnnotationKind, ImageAnnotation, Item, MagnificationAnnotation, MagnificationKind} from '../../types/project.ts'

export type Point = {x: number; y: number}
export type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end'
export const EMPTY_ANNOTATIONS: readonly ImageAnnotation[] = Object.freeze([])
export const ANNOTATION_DRAG_TYPE = 'application/x-image-pigeon-annotation'
export const ANNOTATION_STROKE_WIDTHS = [
  {level: 1, label: '極細', factor: 0.4},
  {level: 2, label: '細', factor: 0.7},
  {level: 3, label: '標準', factor: 1},
  {level: 4, label: '粗', factor: 1.6},
  {level: 5, label: '極粗', factor: 2.4},
] as const
const BASIC_KINDS: readonly BasicAnnotationKind[] = ['ellipse', 'rectangle', 'line', 'arrow', 'double-arrow']
const KINDS: readonly AnnotationKind[] = [...BASIC_KINDS, 'magnify-circle', 'magnify-rectangle']
const COLOR = /^#[0-9a-fA-F]{6}$/
const MIN_SIZE = 0.000001
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const ratio = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const color = (value: unknown): value is string => typeof value === 'string' && COLOR.test(value)
const imageRect = (value: unknown): value is AnnotationRect => record(value)
  && ratio(value.x) && ratio(value.y) && ratio(value.width) && ratio(value.height)
  && value.width > 0 && value.height > 0 && value.x + value.width <= 1 + 1e-10 && value.y + value.height <= 1 + 1e-10

export function isImagePoint(point: Point): boolean {
  return ratio(point.x) && ratio(point.y)
}

export function isAnnotationStrokeWidthLevel(value: unknown): value is AnnotationStrokeWidthLevel {
  return ANNOTATION_STROKE_WIDTHS.some(option => option.level === value)
}

export function getAnnotationProjectVersion(items: readonly Pick<Item, 'annotations'>[]): 2 | 3 | 4 {
  if (items.some(item => item.annotations?.some(annotation => annotation.strokeWidthLevel !== undefined))) return 4
  return items.some(item => item.annotations?.length) ? 3 : 2
}

export function validateAnnotations(value: unknown): ImageAnnotation[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('標記集合格式不合法')
  const ids = new Set<string>()
  return value.map((entry): ImageAnnotation => {
    if (!record(entry) || typeof entry.id !== 'string' || !entry.id.trim() || entry.id.length > 128 || ids.has(entry.id)
      || !KINDS.includes(entry.kind as AnnotationKind) || !color(entry.stroke)) throw new Error('標記種類、識別碼或框線顏色不合法')
    ids.add(entry.id)
    if (entry.strokeWidthLevel !== undefined && !isAnnotationStrokeWidthLevel(entry.strokeWidthLevel)) throw new Error('框線粗細必須是一到五的整數')
    const common = {id: entry.id, stroke: entry.stroke,
      ...(entry.strokeWidthLevel === undefined ? {} : {strokeWidthLevel: entry.strokeWidthLevel})}
    if (entry.kind === 'magnify-circle' || entry.kind === 'magnify-rectangle') {
      const {kind, source: rawSource} = entry
      if (!imageRect(entry) || !imageRect(rawSource) || 'fill' in entry) throw new Error('局部副本的來源或範圍不合法')
      const scaleX = entry.width / rawSource.width, scaleY = entry.height / rawSource.height
      if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY) || scaleX <= 0 || scaleY <= 0
        || Math.abs(scaleX - scaleY) > Math.max(scaleX, scaleY) * 1e-8) throw new Error('局部副本必須等比例縮放')
      const {x, y, width, height} = entry
      const source = {x: rawSource.x, y: rawSource.y, width: rawSource.width, height: rawSource.height}
      return {...common, kind, x, y, width, height, source}
    }
    if (entry.kind === 'ellipse' || entry.kind === 'rectangle') {
      const {x, y, width, height, fill} = entry
      if (!ratio(x) || !ratio(y) || !ratio(width) || !ratio(height) || width <= 0 || height <= 0
        || x + width > 1 + 1e-10 || y + height > 1 + 1e-10 || (fill !== null && !color(fill))) throw new Error('框形標記的範圍或填滿顏色不合法')
      return {...common, kind: entry.kind, x, y, width, height, fill}
    }
    const {x1, y1, x2, y2} = entry
    if (!ratio(x1) || !ratio(y1) || !ratio(x2) || !ratio(y2) || (x1 === x2 && y1 === y2)
      || 'fill' in entry) throw new Error('線形標記的端點不合法')
    return {...common, kind: entry.kind as 'line' | 'arrow' | 'double-arrow', x1, y1, x2, y2}
  })
}

export function encodeAnnotationDrag(kind: BasicAnnotationKind, style: AnnotationStyle): string {
  return JSON.stringify({kind, style})
}

export function decodeAnnotationDrag(value: string): {kind: BasicAnnotationKind; style: AnnotationStyle} | null {
  if (value.length > 4096) return null
  try {
    const data: unknown = JSON.parse(value)
    if (!record(data) || !BASIC_KINDS.includes(data.kind as BasicAnnotationKind) || !record(data.style)
      || !color(data.style.stroke) || (data.style.fill !== null && !color(data.style.fill))
      || (data.style.strokeWidthLevel !== undefined && !isAnnotationStrokeWidthLevel(data.style.strokeWidthLevel))) return null
    return {kind: data.kind as BasicAnnotationKind, style: {stroke: data.style.stroke, fill: data.style.fill,
      ...(data.style.strokeWidthLevel === undefined ? {} : {strokeWidthLevel: data.style.strokeWidthLevel})}}
  } catch {
    return null
  }
}

export function createAnnotation(kind: BasicAnnotationKind, point: Point, style: AnnotationStyle, width: number, height: number, id: string): ImageAnnotation {
  const size = Math.min(width, height) * 0.24
  const w = size / width
  const h = size / height
  const common = {id, kind, stroke: style.stroke, ...(style.strokeWidthLevel === undefined ? {} : {strokeWidthLevel: style.strokeWidthLevel})}
  if (kind === 'ellipse' || kind === 'rectangle') {
    return {...common, kind, fill: style.fill, x: clamp(point.x - w / 2, 0, 1 - w), y: clamp(point.y - h / 2, 0, 1 - h), width: w, height: h}
  }
  const x1 = clamp(point.x - w / 2, 0, 1 - w)
  return {...common, kind, x1, y1: clamp(point.y), x2: x1 + w, y2: clamp(point.y)}
}

export function createMagnification(kind: MagnificationKind, start: Point, end: Point, stroke: string, id: string, strokeWidthLevel?: AnnotationStrokeWidthLevel): MagnificationAnnotation | null {
  const x = Math.min(clamp(start.x), clamp(end.x)), y = Math.min(clamp(start.y), clamp(end.y))
  const width = Math.abs(clamp(end.x) - clamp(start.x)), height = Math.abs(clamp(end.y) - clamp(start.y))
  if (width < MIN_SIZE || height < MIN_SIZE) return null
  return {id, kind, stroke, ...(strokeWidthLevel === undefined ? {} : {strokeWidthLevel}), x, y, width, height, source: {x, y, width, height}}
}

export function moveAnnotation(annotation: ImageAnnotation, delta: Point): ImageAnnotation {
  const minX = 'x' in annotation ? annotation.x : Math.min(annotation.x1, annotation.x2)
  const maxX = 'x' in annotation ? annotation.x + annotation.width : Math.max(annotation.x1, annotation.x2)
  const minY = 'y' in annotation ? annotation.y : Math.min(annotation.y1, annotation.y2)
  const maxY = 'y' in annotation ? annotation.y + annotation.height : Math.max(annotation.y1, annotation.y2)
  const dx = clamp(delta.x, -minX, 1 - maxX)
  const dy = clamp(delta.y, -minY, 1 - maxY)
  return 'x' in annotation
    ? {...annotation, x: annotation.x + dx, y: annotation.y + dy}
    : {...annotation, x1: annotation.x1 + dx, x2: annotation.x2 + dx, y1: annotation.y1 + dy, y2: annotation.y2 + dy}
}

export function annotationHandles(annotation: ImageAnnotation): Array<Point & {id: HandleId}> {
  if ('x1' in annotation) return [{id: 'start', x: annotation.x1, y: annotation.y1}, {id: 'end', x: annotation.x2, y: annotation.y2}]
  const {x, y, width: w, height: h} = annotation
  if ('source' in annotation) return [{id: 'nw', x, y}, {id: 'ne', x: x + w, y}, {id: 'se', x: x + w, y: y + h}, {id: 'sw', x, y: y + h}]
  return [
    {id: 'nw', x, y}, {id: 'n', x: x + w / 2, y}, {id: 'ne', x: x + w, y},
    {id: 'e', x: x + w, y: y + h / 2}, {id: 'se', x: x + w, y: y + h},
    {id: 's', x: x + w / 2, y: y + h}, {id: 'sw', x, y: y + h}, {id: 'w', x, y: y + h / 2},
  ]
}

export function resizeAnnotation(annotation: ImageAnnotation, handle: HandleId, point: Point, imageWidth = 1, imageHeight = 1): ImageAnnotation {
  const px = clamp(point.x), py = clamp(point.y)
  if ('x1' in annotation) {
    const next = handle === 'start' ? {...annotation, x1: px, y1: py} : {...annotation, x2: px, y2: py}
    return next.x1 === next.x2 && next.y1 === next.y2 ? annotation : next
  }
  if ('source' in annotation) {
    if (!['nw', 'ne', 'se', 'sw'].includes(handle)) return annotation
    const sx = handle.includes('w') ? -1 : 1, sy = handle.includes('n') ? -1 : 1
    const anchorX = sx < 0 ? annotation.x + annotation.width : annotation.x
    const anchorY = sy < 0 ? annotation.y + annotation.height : annotation.y
    const diagonal = Math.hypot(annotation.width * imageWidth, annotation.height * imageHeight)
    const weightX = (annotation.width * imageWidth / diagonal) ** 2
    const requested = (px - anchorX) * sx / annotation.width * weightX
      + (py - anchorY) * sy / annotation.height * (1 - weightX)
    const maximum = Math.min((sx > 0 ? 1 - anchorX : anchorX) / annotation.width, (sy > 0 ? 1 - anchorY : anchorY) / annotation.height)
    const scale = clamp(requested, Math.min(1, MIN_SIZE / Math.max(annotation.width, annotation.height)), maximum)
    const width = annotation.width * scale, height = annotation.height * scale
    return {...annotation, x: sx < 0 ? anchorX - width : anchorX, y: sy < 0 ? anchorY - height : anchorY, width, height}
  }
  let {x, y, width, height} = annotation
  if (handle.includes('w') || handle.includes('e')) {
    const anchor = handle.includes('w') ? x + width : x
    const edge = Math.abs(px - anchor) < MIN_SIZE ? clamp(anchor + (anchor > 0.5 ? -MIN_SIZE : MIN_SIZE)) : px
    x = Math.min(anchor, edge)
    width = Math.abs(anchor - edge)
  }
  if (handle.includes('n') || handle.includes('s')) {
    const anchor = handle.includes('n') ? y + height : y
    const edge = Math.abs(py - anchor) < MIN_SIZE ? clamp(anchor + (anchor > 0.5 ? -MIN_SIZE : MIN_SIZE)) : py
    y = Math.min(anchor, edge)
    height = Math.abs(anchor - edge)
  }
  return {...annotation, x, y, width, height}
}

export function rotatePoint(point: Point, rotation: Item['rotation']): Point {
  if (rotation === 90) return {x: 1 - point.y, y: point.x}
  if (rotation === 180) return {x: 1 - point.x, y: 1 - point.y}
  if (rotation === 270) return {x: point.y, y: 1 - point.x}
  return point
}

export function unrotatePoint(point: Point, rotation: Item['rotation']): Point {
  return rotatePoint(point, ((360 - rotation) % 360) as Item['rotation'])
}

export function imageScene(width: number, height: number, rotation: Item['rotation']) {
  const swapped = rotation === 90 || rotation === 270
  const sceneWidth = swapped ? height : width
  const sceneHeight = swapped ? width : height
  return {width: sceneWidth, height: sceneHeight, transform: `translate(${sceneWidth / 2} ${sceneHeight / 2}) rotate(${rotation}) translate(${-width / 2} ${-height / 2})`}
}

type Paint = {stroke: string; fill: string | null; strokeWidth: number}
export type AnnotationPrimitive = Paint & (
  | {type: 'image'; x: number; y: number; width: number; height: number; sourceX: number; sourceY: number; sourceWidth: number; sourceHeight: number; clipShape: 'ellipse' | 'rectangle'}
  | {type: 'ellipse'; cx: number; cy: number; rx: number; ry: number}
  | {type: 'rectangle'; x: number; y: number; width: number; height: number}
  | {type: 'line'; x1: number; y1: number; x2: number; y2: number}
  | {type: 'polygon'; points: Point[]}
)

export function buildAnnotationPrimitives(annotation: ImageAnnotation, width: number, height: number): AnnotationPrimitive[] {
  const factor = ANNOTATION_STROKE_WIDTHS[(annotation.strokeWidthLevel ?? 3) - 1].factor
  const paint = {stroke: annotation.stroke, strokeWidth: Math.min(width, height) * 0.006 * factor, fill: null as string | null}
  if ('x' in annotation) {
    const x = annotation.x * width, y = annotation.y * height, w = annotation.width * width, h = annotation.height * height
    const clipShape = annotation.kind === 'ellipse' || annotation.kind === 'magnify-circle' ? 'ellipse' : 'rectangle'
    const fill = 'fill' in annotation ? annotation.fill : null
    const border: AnnotationPrimitive = clipShape === 'ellipse'
      ? {...paint, fill, type: 'ellipse', cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2}
      : {...paint, fill, type: 'rectangle', x, y, width: w, height: h}
    return 'source' in annotation ? [{...paint, type: 'image', x, y, width: w, height: h, clipShape,
      sourceX: annotation.source.x * width, sourceY: annotation.source.y * height,
      sourceWidth: annotation.source.width * width, sourceHeight: annotation.source.height * height}, border] : [border]
  }
  const x1 = annotation.x1 * width, y1 = annotation.y1 * height, x2 = annotation.x2 * width, y2 = annotation.y2 * height
  const result: AnnotationPrimitive[] = [{...paint, type: 'line', x1, y1, x2, y2}]
  if (annotation.kind === 'line') return result
  const length = Math.hypot(x2 - x1, y2 - y1)
  const headLength = Math.min(paint.strokeWidth * 4, length * 0.4)
  const ux = (x2 - x1) / length, uy = (y2 - y1) / length
  const head = (x: number, y: number, direction: number): AnnotationPrimitive => ({
    ...paint, fill: paint.stroke, type: 'polygon', points: [
      {x, y},
      {x: x - direction * ux * headLength - uy * headLength * 0.45, y: y - direction * uy * headLength + ux * headLength * 0.45},
      {x: x - direction * ux * headLength + uy * headLength * 0.45, y: y - direction * uy * headLength - ux * headLength * 0.45},
    ],
  })
  result.push(head(x2, y2, 1))
  if (annotation.kind === 'double-arrow') result.push(head(x1, y1, -1))
  return result
}
