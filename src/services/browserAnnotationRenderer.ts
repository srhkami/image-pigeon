import type {ImageAnnotation} from '../types/project.ts'
import {buildAnnotationPrimitives, validateAnnotations} from '../features/ImagePreview/annotationGeometry.ts'
import {BrowserOperationError, throwIfAborted} from './browserRuntimeContract.ts'

export function drawAnnotations(context: CanvasRenderingContext2D, annotations: readonly ImageAnnotation[], width: number, height: number, signal?: AbortSignal, source?: CanvasImageSource): void {
  throwIfAborted(signal)
  let validated: ImageAnnotation[]
  try {
    validated = validateAnnotations(annotations)
  } catch (cause) {
    throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', '圖片標記資料不合法，無法輸出', cause)
  }
  if (!validated.length) return
  context.save()
  try {
    context.beginPath()
    context.rect(0, 0, width, height)
    context.clip()
    context.lineCap = 'round'
    context.lineJoin = 'round'
    for (const annotation of validated) {
      throwIfAborted(signal)
      for (const primitive of buildAnnotationPrimitives(annotation, width, height)) {
        if (primitive.type === 'image') {
          if (!source) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '局部副本缺少原圖，無法輸出')
          context.save()
          try {
            context.beginPath()
            if (primitive.clipShape === 'ellipse') context.ellipse(primitive.x + primitive.width / 2, primitive.y + primitive.height / 2, primitive.width / 2, primitive.height / 2, 0, 0, Math.PI * 2)
            else context.rect(primitive.x, primitive.y, primitive.width, primitive.height)
            context.clip()
            context.drawImage(source, primitive.sourceX, primitive.sourceY, primitive.sourceWidth, primitive.sourceHeight,
              primitive.x, primitive.y, primitive.width, primitive.height)
          } finally {
            context.restore()
          }
          continue
        }
        context.strokeStyle = primitive.stroke
        context.lineWidth = primitive.strokeWidth
        context.beginPath()
        if (primitive.type === 'rectangle') context.rect(primitive.x, primitive.y, primitive.width, primitive.height)
        else if (primitive.type === 'ellipse') context.ellipse(primitive.cx, primitive.cy, primitive.rx, primitive.ry, 0, 0, Math.PI * 2)
        else if (primitive.type === 'line') {
          context.moveTo(primitive.x1, primitive.y1)
          context.lineTo(primitive.x2, primitive.y2)
        } else {
          context.moveTo(primitive.points[0].x, primitive.points[0].y)
          for (const point of primitive.points.slice(1)) context.lineTo(point.x, point.y)
          context.closePath()
        }
        if (primitive.fill !== null) {
          context.fillStyle = primitive.fill
          context.fill()
        }
        context.stroke()
      }
    }
  } finally {
    context.restore()
  }
}
