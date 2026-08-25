import {
  BROWSER_RUNTIME_LIMITS,
  BrowserOperationError,
  throwIfAborted,
} from './browserRuntimeContract.ts'

export type ProcessedBrowserImage = {
  blob: Blob
  width: number
  height: number
  mime: 'image/webp'
}

export type LongScreenSegment = {
  index: number
  sourceStartY: number
  sourceEndY: number
  destinationY: number
  rawWidth: number
  rawHeight: number
  outputWidth: number
  outputHeight: number
}

export function getLongScreenSourceRow(segment: LongScreenSegment, rawRow: number): number | null {
  if (!Number.isInteger(rawRow) || rawRow < 0 || rawRow >= segment.rawHeight) return null
  const sourceRow = segment.sourceStartY + rawRow - segment.destinationY
  return sourceRow >= segment.sourceStartY && sourceRow < segment.sourceEndY ? sourceRow : null
}

type DecodedImage = {
  source: CanvasImageSource
  width: number
  height: number
  close(): void
}

export function normalizeQuality(quality: number): number {
  if (quality !== 50 && quality !== 75 && quality !== 90 && quality !== 100) {
    throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', `不支援的圖片品質：${quality}`)
  }
  return quality / 100
}

export function normalizeMinSize(value: number): 500 | 1000 | 2000 {
  if (value === 500 || value === 1000 || value === 2000) return value
  throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', '圖片最小尺寸必須是 500、1000 或 2000')
}

export function calculateContainedSize(width: number, height: number, minSize: number): {width: number; height: number} {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || minSize <= 0) {
    throw new BrowserOperationError('IMAGE_DECODE_FAILED', '圖片尺寸不合法')
  }
  const shortest = Math.min(width, height)
  if (shortest <= minSize) return {width, height}
  const ratio = minSize / shortest
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

export function isLongScreen(width: number, height: number): boolean {
  return width / height <= 9 / 21
}

export function calculateLongScreenSegments(
  width: number,
  height: number,
  quality: number,
  minSize: number,
): LongScreenSegment[] {
  if (!isLongScreen(width, height)) {
    throw new BrowserOperationError('IMAGE_DECODE_FAILED', '圖片比例不符合長截圖條件')
  }
  const segmentHeight = width * 2
  const overlap = Math.round(segmentHeight * 0.03)
  const rawHeight = segmentHeight + 2 * overlap
  const segmentCount = Math.ceil(height / segmentHeight)
  if (segmentCount > BROWSER_RUNTIME_LIMITS.longScreen.maxSegments) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `單張長截圖最多切割 ${BROWSER_RUNTIME_LIMITS.longScreen.maxSegments} 段`)
  }

  const compact = quality !== 100 && (width >= minSize * 2 || rawHeight >= minSize * 2)
  return Array.from({length: segmentCount}, (_, index) => {
    const desiredStart = index === 0 ? 0 : index * segmentHeight - overlap
    const desiredEnd = index === 0
      ? segmentHeight + 2 * overlap
      : (index + 1) * segmentHeight + overlap
    const sourceStartY = Math.max(0, desiredStart)
    const sourceEndY = Math.min(height, desiredEnd)
    return {
      index,
      sourceStartY,
      sourceEndY,
      destinationY: sourceStartY - desiredStart,
      rawWidth: width,
      rawHeight,
      outputWidth: compact ? Math.floor(width / 2) : width,
      outputHeight: compact ? Math.floor(rawHeight / 2) : rawHeight,
    }
  })
}

function assertDecodedDimensions(width: number, height: number, mode: 'general' | 'long'): void {
  const dimensionExceeded = mode === 'general'
    ? width > BROWSER_RUNTIME_LIMITS.generalImage.maxDimension || height > BROWSER_RUNTIME_LIMITS.generalImage.maxDimension
    : width > BROWSER_RUNTIME_LIMITS.longScreen.maxWidth || height > BROWSER_RUNTIME_LIMITS.longScreen.maxHeight
  const maxPixels = mode === 'general'
    ? BROWSER_RUNTIME_LIMITS.generalImage.maxPixels
    : BROWSER_RUNTIME_LIMITS.longScreen.maxPixels
  if (dimensionExceeded || width * height > maxPixels) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片解碼尺寸超過純前端 ${mode === 'general' ? '一般圖片' : '長截圖'}上限`)
  }
}

async function decodeImage(file: File, signal?: AbortSignal): Promise<DecodedImage> {
  throwIfAborted(signal)
  try {
    const bitmap = await createImageBitmap(file)
    throwIfAborted(signal)
    return {source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close()}
  } catch (error) {
    if (error instanceof BrowserOperationError) throw error
    throw new BrowserOperationError('IMAGE_DECODE_FAILED', `無法解碼圖片：${file.name}`, error)
  }
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  } catch (error) {
    throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '無法建立圖片處理 Canvas', error)
  }
}

function encodeCanvas(canvas: HTMLCanvasElement, quality: number, signal?: AbortSignal): Promise<Blob> {
  throwIfAborted(signal)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      try {
        throwIfAborted(signal)
        if (!blob) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法產生 WebP 圖片')
        resolve(blob)
      } catch (error) {
        reject(error)
      }
    }, 'image/webp', normalizeQuality(quality))
  })
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

export const browserImageProcessor = {
  async processImage(file: File, options: {quality: number; minSize: number; signal?: AbortSignal}): Promise<ProcessedBrowserImage> {
    const decoded = await decodeImage(file, options.signal)
    try {
      assertDecodedDimensions(decoded.width, decoded.height, 'general')
      const outputSize = calculateContainedSize(decoded.width, decoded.height, options.minSize)
      throwIfAborted(options.signal)
      const canvas = createCanvas(outputSize.width, outputSize.height)
      try {
        const context = canvas.getContext('2d')
        if (!context) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法取得 2D Canvas')
        context.drawImage(decoded.source, 0, 0, outputSize.width, outputSize.height)
        throwIfAborted(options.signal)
        const blob = await encodeCanvas(canvas, options.quality, options.signal)
        return {blob, width: outputSize.width, height: outputSize.height, mime: 'image/webp'}
      } finally {
        releaseCanvas(canvas)
      }
    } finally {
      decoded.close()
    }
  },


  async processLongScreen(file: File, options: {
    quality: number
    minSize: number
    signal?: AbortSignal
    maxOutputAssets?: number
    maxOutputBytes?: number
  }): Promise<ProcessedBrowserImage[]> {
    const decoded = await decodeImage(file, options.signal)
    const output: ProcessedBrowserImage[] = []
    try {
      assertDecodedDimensions(decoded.width, decoded.height, 'long')
      const segments = calculateLongScreenSegments(decoded.width, decoded.height, options.quality, options.minSize)
      let outputBytes = 0
      for (const segment of segments) {
        if (output.length >= (options.maxOutputAssets ?? BROWSER_RUNTIME_LIMITS.assetStore.maxAssets)) {
          throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', '長截圖切割張數超過目前可用的瀏覽器資產容量')
        }
        throwIfAborted(options.signal)
        const rawCanvas = createCanvas(segment.rawWidth, segment.rawHeight)
        try {
          const rawContext = rawCanvas.getContext('2d')
          if (!rawContext) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法取得長截圖 Canvas')
          rawContext.fillStyle = '#000000'
          rawContext.fillRect(0, 0, segment.rawWidth, segment.rawHeight)
          rawContext.drawImage(
            decoded.source,
            0,
            segment.sourceStartY,
            decoded.width,
            segment.sourceEndY - segment.sourceStartY,
            0,
            segment.destinationY,
            segment.rawWidth,
            segment.sourceEndY - segment.sourceStartY,
          )

          let outputCanvas = rawCanvas
          if (segment.outputWidth !== segment.rawWidth || segment.outputHeight !== segment.rawHeight) {
            outputCanvas = createCanvas(segment.outputWidth, segment.outputHeight)
            const outputContext = outputCanvas.getContext('2d')
            if (!outputContext) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法取得長截圖縮放 Canvas')
            outputContext.drawImage(rawCanvas, 0, 0, segment.outputWidth, segment.outputHeight)
          }
          try {
            const blob = await encodeCanvas(outputCanvas, options.quality, options.signal)
            outputBytes += blob.size
            if (outputBytes > (options.maxOutputBytes ?? BROWSER_RUNTIME_LIMITS.assetStore.maxBytes)) {
              throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', '單張長截圖的切割產物超過瀏覽器記憶體上限')
            }
            output.push({blob, width: segment.outputWidth, height: segment.outputHeight, mime: 'image/webp'})
          } finally {
            if (outputCanvas !== rawCanvas) releaseCanvas(outputCanvas)
          }
        } finally {
          releaseCanvas(rawCanvas)
        }
      }
      return output
    } finally {
      decoded.close()
    }
  },
}
