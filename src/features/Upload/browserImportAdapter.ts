import type {Asset, Item, ProjectImportData} from '../../types/project.ts'
import {BrowserAssetStore} from '../../services/browserAssetStore.ts'
import {
  BROWSER_RUNTIME_LIMITS,
  BrowserOperationError,
  assertGeneralImageBatch,
  assertLongScreenBatch,
  assertLongScreenFile,
  throwIfAborted,
} from '../../services/browserRuntimeContract.ts'
import type {ProcessedBrowserImage} from '../../services/browserImageProcessor.ts'
import {browserImageProcessor, normalizeMinSize, normalizeQuality} from '../../services/browserImageProcessor.ts'
import {SUPPORTED_IMAGE_FILE_EXTENSIONS} from './fileAccept.ts'

export type BrowserImageProcessor = {
  processImage(file: File, options: {quality: number; minSize: number; signal?: AbortSignal}): Promise<ProcessedBrowserImage>
  processLongScreen(file: File, options: {
    quality: number
    minSize: number
    signal?: AbortSignal
    maxOutputAssets?: number
    maxOutputBytes?: number
  }): Promise<ProcessedBrowserImage[]>
}

type RemarkMode = {
  isFileNameMode: boolean
  defaultRemark: string
}

type BaseImportOptions = {
  files: File[]
  quality: number
  minSize: number
  store: BrowserAssetStore
  processor?: BrowserImageProcessor
  signal?: AbortSignal
  onProgress?: (completed: number, total: number) => void
}

type PendingAsset = {
  asset: Asset
  item: Item
  blob: Blob
}

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot).toLowerCase()
}

const createPendingAsset = (
  file: File,
  processed: ProcessedBrowserImage,
  remark: string,
  suffix = '',
): PendingAsset => {
  const assetId = crypto.randomUUID()
  const itemId = crypto.randomUUID()
  return {
    asset: {
      id: assetId,
      file: `images/${assetId}.webp`,
      mime: processed.mime,
      width: processed.width,
      height: processed.height,
      originalName: file.name,
      size: processed.blob.size,
    },
    item: {
      id: itemId,
      type: 'image',
      assetId,
      remark: suffix ? `${remark}${suffix}` : remark,
      rotation: 0,
      crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'},
      layoutPreference: processed.width >= processed.height ? 'stacked-2' : 'side-by-side-2',
      portraitSize: 'large',
    },
    blob: processed.blob,
  }
}

const commitPendingAssets = (store: BrowserAssetStore, pending: readonly PendingAsset[]) => {
  const entries = pending.map(entry => ({id: entry.asset.id, blob: entry.blob}))
  store.assertCanRegisterBatch(entries)
  const registered: string[] = []
  try {
    for (const entry of entries) {
      store.register(entry.id, entry.blob)
      registered.push(entry.id)
    }
  } catch (error) {
    for (const assetId of registered) store.delete(assetId)
    throw error
  }
}

const assertPendingFitsStore = (store: BrowserAssetStore, pending: readonly PendingAsset[]) => {
  store.assertCanRegisterBatch(pending.map(entry => ({id: entry.asset.id, blob: entry.blob})))
}

const toImportData = (pending: readonly PendingAsset[], skipped: string[], errors: Array<{filename: string; message: string}>): ProjectImportData => ({
  assets: pending.map(entry => entry.asset),
  items: pending.map(entry => entry.item),
  layoutPatch: {appendItemOrder: pending.map(entry => entry.item.id)},
  skipped,
  errors,
})

const safeErrorMessage = (error: unknown) => error instanceof BrowserOperationError
  ? error.message
  : '圖片無法處理'

export function formatImportSummary(importData: ProjectImportData): string {
  const successText = `新增 ${importData.items.length} 張圖片成功`
  const errors = importData.errors ?? []
  const skipped = importData.skipped ?? []
  if (!errors.length) return successText
  const visibleErrors = errors.slice(0, 5)
    .map(error => `${error.filename}（${error.message}）`)
    .join('、')
  const remaining = errors.length - visibleErrors.length
  return `${successText}；略過 ${skipped.length} 個檔案：${visibleErrors}${remaining > 0 ? `，另 ${remaining} 個` : ''}`
}

export async function importGeneralImages(options: BaseImportOptions & {remarkMode: RemarkMode}): Promise<ProjectImportData> {
  assertGeneralImageBatch(options.files)
  throwIfAborted(options.signal)
  normalizeQuality(options.quality)
  const minSize = normalizeMinSize(options.minSize)
  const processor = options.processor ?? browserImageProcessor
  const pending: PendingAsset[] = []
  const skipped: string[] = []
  const errors: Array<{filename: string; message: string}> = []

  for (const [index, file] of options.files.entries()) {
    throwIfAborted(options.signal)
    try {
      if (!SUPPORTED_IMAGE_FILE_EXTENSIONS.has(extensionOf(file.name))) {
        throw new BrowserOperationError('IMAGE_DECODE_FAILED', '不支援的圖片副檔名')
      }
      const processed = await processor.processImage(file, {...options, minSize})
      throwIfAborted(options.signal)
      const remark = options.remarkMode.isFileNameMode ? file.name : options.remarkMode.defaultRemark
      const nextEntry = createPendingAsset(file, processed, remark)
      assertPendingFitsStore(options.store, [...pending, nextEntry])
      pending.push(nextEntry)
    } catch (error) {
      if (error instanceof BrowserOperationError && (error.code === 'OPERATION_CANCELLED' || error.code === 'RESOURCE_LIMIT_EXCEEDED')) throw error
      skipped.push(file.name)
      errors.push({filename: file.name, message: safeErrorMessage(error)})
    } finally {
      options.onProgress?.(index + 1, options.files.length)
    }
  }

  throwIfAborted(options.signal)
  if (!pending.length) throw new BrowserOperationError('NO_IMAGES_IMPORTED', '沒有可匯入的圖片')
  commitPendingAssets(options.store, pending)
  return toImportData(pending, skipped, errors)
}

export async function importLongScreens(options: BaseImportOptions & {defaultRemark: string}): Promise<ProjectImportData> {
  throwIfAborted(options.signal)
  assertLongScreenBatch(options.files, options.store.size)
  normalizeQuality(options.quality)
  normalizeMinSize(options.minSize)
  const processor = options.processor ?? browserImageProcessor
  const pending: PendingAsset[] = []
  const skipped: string[] = []
  const errors: Array<{filename: string; message: string}> = []

  for (const [index, file] of options.files.entries()) {
    throwIfAborted(options.signal)
    try {
      assertLongScreenFile(file)
      if (!SUPPORTED_IMAGE_FILE_EXTENSIONS.has(extensionOf(file.name))) {
        throw new BrowserOperationError('IMAGE_DECODE_FAILED', '不支援的圖片副檔名')
      }
      throwIfAborted(options.signal)
      const pendingBytes = pending.reduce((total, entry) => total + entry.blob.size, 0)
      const segments = await processor.processLongScreen(file, {
        ...options,
        maxOutputAssets: BROWSER_RUNTIME_LIMITS.assetStore.maxAssets - options.store.size - pending.length,
        maxOutputBytes: BROWSER_RUNTIME_LIMITS.assetStore.maxBytes - options.store.totalBytes - pendingBytes,
      })
      throwIfAborted(options.signal)
      const sourcePending = segments.map((segment, segmentIndex) => createPendingAsset(
        file,
        segment,
        options.defaultRemark,
        segments.length > 1 ? `（${segmentIndex + 1}/${segments.length}）` : '',
      ))
      assertPendingFitsStore(options.store, [...pending, ...sourcePending])
      pending.push(...sourcePending)
    } catch (error) {
      if (error instanceof BrowserOperationError && (error.code === 'OPERATION_CANCELLED' || error.code === 'RESOURCE_LIMIT_EXCEEDED')) throw error
      skipped.push(file.name)
      errors.push({filename: file.name, message: safeErrorMessage(error)})
    } finally {
      options.onProgress?.(index + 1, options.files.length)
    }
  }

  throwIfAborted(options.signal)
  if (!pending.length) throw new BrowserOperationError('NO_IMAGES_IMPORTED', '沒有可匯入的長截圖')
  commitPendingAssets(options.store, pending)
  return {...toImportData(pending, skipped, errors), segments: pending.length}
}
