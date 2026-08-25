import {Zip, ZipPassThrough} from 'fflate'

import type {Item, ProjectV2} from '../types/project.ts'
import {BrowserAssetStore} from './browserAssetStore.ts'
import {
  BROWSER_RUNTIME_LIMITS,
  BrowserOperationError,
  throwIfAborted,
} from './browserRuntimeContract.ts'

type ImageExportLimits = {
  maxImages: number
  maxSourceBytes: number
  maxOutputBytes: number
}

export type ImageExportOptions = {
  title: string
  isRemarkMode: boolean
  signal?: AbortSignal
  onProgress?: (completed: number) => void
  limits?: ImageExportLimits
}

export type BrowserJpegConverter = {
  convert(source: Blob, rotation: Item['rotation'], signal?: AbortSignal): Promise<Blob>
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

function encodeJpeg(canvas: HTMLCanvasElement, signal?: AbortSignal): Promise<Blob> {
  throwIfAborted(signal)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      try {
        throwIfAborted(signal)
        if (!blob) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法產生 JPEG 圖片')
        resolve(blob)
      } catch (error) {
        reject(error)
      }
    }, 'image/jpeg', 0.92)
  })
}

export const browserJpegConverter: BrowserJpegConverter = {
  async convert(source, rotation, signal) {
    throwIfAborted(signal)
    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(source)
    } catch (error) {
      throw new BrowserOperationError('IMAGE_DECODE_FAILED', '無法解碼待輸出的圖片', error)
    }

    try {
      throwIfAborted(signal)
      const swapDimensions = rotation === 90 || rotation === 270
      const canvas = document.createElement('canvas')
      canvas.width = swapDimensions ? bitmap.height : bitmap.width
      canvas.height = swapDimensions ? bitmap.width : bitmap.height
      try {
        const context = canvas.getContext('2d')
        if (!context) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '瀏覽器無法取得圖片輸出 Canvas')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.translate(canvas.width / 2, canvas.height / 2)
        context.rotate(rotation * Math.PI / 180)
        context.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
        return await encodeJpeg(canvas, signal)
      } finally {
        releaseCanvas(canvas)
      }
    } finally {
      bitmap.close()
    }
  },
}

export function normalizeImageExportFilename(value: string): string {
  const normalizedControls = Array.from(value.trim(), character => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127 ? '_' : character
  }).join('')
  return normalizedControls
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[. ]+$/g, '')
}

function uniqueFilename(baseName: string, used: Set<string>): string {
  let candidate = `${baseName}.jpg`
  let suffix = 2
  while (used.has(candidate.toLocaleLowerCase())) {
    candidate = `${baseName}_${suffix}.jpg`
    suffix += 1
  }
  used.add(candidate.toLocaleLowerCase())
  return candidate
}

function createBoundedZip(
  entries: readonly {filename: string; bytes: Uint8Array}[],
  maxBytes: number,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  throwIfAborted(signal)
  return new Promise((resolve, reject) => {
    let settled = false
    let totalBytes = 0
    const chunks: Uint8Array[] = []
    const zipper = new Zip((error, data, final) => {
      if (settled) return
      if (error) {
        settled = true
        signal?.removeEventListener('abort', onAbort)
        reject(new BrowserOperationError('INVALID_PROJECT_ARCHIVE', '建立圖片 ZIP 失敗', error))
        return
      }
      if (totalBytes + data.byteLength > maxBytes) {
        settled = true
        signal?.removeEventListener('abort', onAbort)
        zipper.terminate()
        reject(new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `完成的圖片 ZIP 不得超過 ${maxBytes} bytes`))
        return
      }
      totalBytes += data.byteLength
      chunks.push(data)
      if (!final) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      const archive = new Uint8Array(totalBytes)
      let offset = 0
      for (const chunk of chunks) {
        archive.set(chunk, offset)
        offset += chunk.byteLength
      }
      resolve(archive)
    })
    const onAbort = () => {
      if (settled) return
      settled = true
      zipper.terminate()
      reject(new BrowserOperationError('OPERATION_CANCELLED', '操作已取消'))
    }
    signal?.addEventListener('abort', onAbort, {once: true})
    try {
      for (const entry of entries) {
        throwIfAborted(signal)
        const file = new ZipPassThrough(entry.filename)
        zipper.add(file)
        file.push(entry.bytes, true)
      }
      zipper.end()
    } catch (error) {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      zipper.terminate()
      if (error instanceof BrowserOperationError) reject(error)
      else reject(new BrowserOperationError('INVALID_PROJECT_ARCHIVE', '建立圖片 ZIP 失敗', error))
    }
  })
}

export async function createImageExportZip(
  project: ProjectV2,
  assetStore: BrowserAssetStore,
  options: ImageExportOptions,
  converter: BrowserJpegConverter = browserJpegConverter,
): Promise<Blob> {
  const limits = options.limits ?? BROWSER_RUNTIME_LIMITS.imageExport
  const itemMap = new Map(project.items.map(item => [item.id, item]))
  const layoutOrder = project.layouts.find(layout => layout.id === 'layout_word_default')?.itemOrder
    ?? project.layouts.find(layout => layout.type === 'word-compatible-grid')?.itemOrder
    ?? []
  const orderedItems = [
    ...layoutOrder.map(itemId => itemMap.get(itemId)).filter((item): item is Item => Boolean(item)),
    ...project.items.filter(item => !layoutOrder.includes(item.id)),
  ]

  throwIfAborted(options.signal)
  if (orderedItems.length === 0) {
    throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', '沒有可輸出的圖片')
  }
  if (orderedItems.length > limits.maxImages) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片 ZIP 最多包含 ${limits.maxImages} 張圖片`)
  }

  const sourceEntries = orderedItems.map(item => ({item, blob: assetStore.getBlob(item.assetId)}))
  const sourceBytes = sourceEntries.reduce((total, entry) => total + entry.blob.size, 0)
  if (sourceBytes > limits.maxSourceBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片 ZIP 來源合計不得超過 ${limits.maxSourceBytes} bytes`)
  }

  const title = normalizeImageExportFilename(options.title) || 'Photo'
  const usedNames = new Set<string>()
  const entries: Array<{filename: string; bytes: Uint8Array}> = []
  let outputBytes = 0
  for (let index = 0; index < sourceEntries.length; index += 1) {
    throwIfAborted(options.signal)
    const {item, blob} = sourceEntries[index]
    const remark = normalizeImageExportFilename(item.remark)
    const baseName = options.isRemarkMode && remark ? remark : `${title}_${index + 1}`
    const filename = uniqueFilename(baseName, usedNames)
    const jpeg = await converter.convert(blob, item.rotation, options.signal)
    throwIfAborted(options.signal)
    if (jpeg.type && jpeg.type !== 'image/jpeg') {
      throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '圖片轉換器未產生 JPEG')
    }
    outputBytes += jpeg.size
    if (outputBytes > limits.maxOutputBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片 ZIP 產物合計不得超過 ${limits.maxOutputBytes} bytes`)
    }
    entries.push({filename, bytes: new Uint8Array(await jpeg.arrayBuffer())})
    options.onProgress?.(index + 1)
  }

  throwIfAborted(options.signal)
  const archive = await createBoundedZip(entries, limits.maxOutputBytes, options.signal)
  throwIfAborted(options.signal)
  return new Blob([archive], {type: 'application/zip'})
}
