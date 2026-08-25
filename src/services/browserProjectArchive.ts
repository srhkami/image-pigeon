import {unzip, zip, type AsyncZippable, type Unzipped} from 'fflate'

import type {Asset, Item, LayoutPreference, ProjectV2, WordCompatibleGridLayout} from '../types/project.ts'
import {BrowserAssetStore} from './browserAssetStore.ts'
import {
  BROWSER_RUNTIME_LIMITS,
  BrowserOperationError,
  throwIfAborted,
} from './browserRuntimeContract.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', {fatal: true})
const ZIP_EOCD_SIGNATURE = 0x06054b50
const ZIP_CENTRAL_SIGNATURE = 0x02014b50
const PROJECT_JSON_PATH = 'project.json'
const ROTATIONS = new Set([0, 90, 180, 270])
const LAYOUT_PREFERENCES = new Set<LayoutPreference>(['stacked-2', 'side-by-side-2', 'grid-6'])

type ArchiveLimits = typeof BROWSER_RUNTIME_LIMITS.projectArchive

type ArchiveAsset = {
  id: string
  blob: Blob
}

export type OpenedBrowserProject = {
  project: ProjectV2
  assets: ArchiveAsset[]
}

export type ProjectImageInspector = (
  blob: Blob,
  signal?: AbortSignal,
) => Promise<{width: number; height: number}>

type ZipEntryMetadata = {
  rawName: string
  canonicalName: string
  compressedSize: number
  expandedSize: number
}


const failArchive = (message: string, cause?: unknown): never => {
  throw new BrowserOperationError('INVALID_PROJECT_ARCHIVE', message, cause)
}

const failSchema = (message: string, cause?: unknown): never => {
  throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', message, cause)
}

function isWebPBytes(bytes: Uint8Array): boolean {
  return bytes.length >= 12
    && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
}

const inspectProjectImageInBrowser: ProjectImageInspector = async (blob, signal) => {
  throwIfAborted(signal)
  const bitmap = await createImageBitmap(blob).catch(cause => failSchema('專案圖片無法解碼', cause))
  try {
    throwIfAborted(signal)
    return {width: bitmap.width, height: bitmap.height}
  } finally {
    bitmap.close()
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
)

function assertRecord(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) failSchema(message)
}

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isPositiveInteger = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) > 0

function canonicalizeArchivePath(rawName: string): string {
  if (!rawName || rawName.includes('\0') || /^[a-zA-Z]:/.test(rawName) || /^[\\/]/.test(rawName)) {
    failArchive('專案檔包含不安全的絕對路徑')
  }
  const normalized = rawName.split('\\').join('/')
  const parts = normalized.split('/')
  if (parts.some(part => part === '' || part === '.' || part === '..')) {
    failArchive('專案檔包含不安全的相對路徑')
  }
  return parts.join('/')
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const minimumOffset = Math.max(0, bytes.length - 65_557)
  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === ZIP_EOCD_SIGNATURE) return offset
  }
  return failArchive('找不到 ZIP 中央目錄')
}

function inspectZip(bytes: Uint8Array, limits: ArchiveLimits): ZipEntryMetadata[] {
  if (bytes.byteLength > limits.maxCompressedBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案檔不得超過 ${limits.maxCompressedBytes} bytes`)
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEndOfCentralDirectory(bytes)
  const diskNumber = view.getUint16(eocd + 4, true)
  const centralDisk = view.getUint16(eocd + 6, true)
  const diskEntries = view.getUint16(eocd + 8, true)
  const totalEntries = view.getUint16(eocd + 10, true)
  const centralSize = view.getUint32(eocd + 12, true)
  const centralOffset = view.getUint32(eocd + 16, true)
  const commentLength = view.getUint16(eocd + 20, true)

  if (diskNumber !== 0 || centralDisk !== 0 || diskEntries !== totalEntries) failArchive('不支援多磁碟 ZIP')
  if (totalEntries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) failArchive('不支援 ZIP64 專案檔')
  if (totalEntries > limits.maxEntries) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案檔最多 ${limits.maxEntries} 個項目`)
  }
  if (eocd + 22 + commentLength !== bytes.length || centralOffset + centralSize !== eocd) {
    failArchive('ZIP 中央目錄範圍不合法')
  }

  const entries: ZipEntryMetadata[] = []
  const canonicalNames = new Set<string>()
  let expandedTotal = 0
  let offset = centralOffset
  for (let index = 0; index < totalEntries; index += 1) {
    if (offset + 46 > eocd || view.getUint32(offset, true) !== ZIP_CENTRAL_SIGNATURE) {
      failArchive('ZIP 中央目錄項目損壞')
    }
    const flags = view.getUint16(offset + 8, true)
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const expandedSize = view.getUint32(offset + 24, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const entryCommentLength = view.getUint16(offset + 32, true)
    const nextOffset = offset + 46 + nameLength + extraLength + entryCommentLength
    if (nextOffset > eocd || compressedSize === 0xffffffff || expandedSize === 0xffffffff) {
      failArchive('ZIP 項目範圍不合法或需要 ZIP64')
    }
    if ((flags & 1) !== 0) failArchive('不支援加密 ZIP 項目')
    if (method !== 0 && method !== 8) failArchive('ZIP 項目使用不支援的壓縮方法')

    let rawName = ''
    try {
      rawName = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    } catch (error) {
      failArchive('ZIP 項目名稱不是合法 UTF-8', error)
    }
    const canonicalName = canonicalizeArchivePath(rawName)
    if (canonicalNames.has(canonicalName)) {
      throw new BrowserOperationError('DUPLICATE_ARCHIVE_ENTRY', `專案檔包含重複項目：${canonicalName}`)
    }
    canonicalNames.add(canonicalName)

    if (expandedSize > 0 && expandedSize / Math.max(1, compressedSize) > limits.maxCompressionRatio) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `ZIP 項目壓縮比超過 ${limits.maxCompressionRatio}：${canonicalName}`)
    }
    if (canonicalName === PROJECT_JSON_PATH && expandedSize > limits.maxProjectJsonBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `project.json 不得超過 ${limits.maxProjectJsonBytes} bytes`)
    }
    if (canonicalName !== PROJECT_JSON_PATH && expandedSize > limits.maxImageEntryBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片項目不得超過 ${limits.maxImageEntryBytes} bytes`)
    }
    expandedTotal += expandedSize
    if (expandedTotal > limits.maxExpandedBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案解壓後不得超過 ${limits.maxExpandedBytes} bytes`)
    }
    entries.push({rawName, canonicalName, compressedSize, expandedSize})
    offset = nextOffset
  }
  if (offset !== eocd) failArchive('ZIP 中央目錄長度不符')
  return entries
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(decoder.decode(bytes))
  } catch (error) {
    return failSchema('project.json 不是合法 UTF-8 JSON', error)
  }
}

function validateCrop(value: unknown): Item['crop'] {
  assertRecord(value, 'crop 格式不合法')
  if (value.unit !== 'ratio') failSchema('crop 格式不合法')
  const {x, y, width, height} = value
  if (![x, y, width, height].every(isFiniteNumber)
    || Number(x) < 0 || Number(y) < 0 || Number(width) <= 0 || Number(height) <= 0
    || Number(x) + Number(width) > 1 || Number(y) + Number(height) > 1) {
    failSchema('crop 比例範圍不合法')
  }
  return {x: Number(x), y: Number(y), width: Number(width), height: Number(height), unit: 'ratio'}
}

function deriveLayoutPreference(asset: Asset, rotation: Item['rotation'], portraitSize: 'large' | 'small'): LayoutPreference {
  const rotated = rotation === 90 || rotation === 270
  const width = rotated ? asset.height : asset.width
  const height = rotated ? asset.width : asset.height
  if (width >= height) return 'stacked-2'
  return portraitSize === 'small' ? 'grid-6' : 'side-by-side-2'
}

function validateProject(raw: unknown, limits: ArchiveLimits): ProjectV2 {
  assertRecord(raw, 'project.json 必須是 object')
  if (raw.schema !== 'image-pigeon.project' || raw.version !== 2) {
    failSchema('只支援 image-pigeon.project version 2')
  }
  assertRecord(raw.document, 'document 不合法')
  if (typeof raw.document.title !== 'string') failSchema('document.title 不合法')
  if (!Array.isArray(raw.assets) || raw.assets.length > limits.maxAssets) failSchema('assets 數量不合法')
  if (!Array.isArray(raw.items) || raw.items.length > limits.maxItems) failSchema('items 數量不合法')
  if (!Array.isArray(raw.layouts) || raw.layouts.length === 0 || raw.layouts.length > 20) failSchema('layouts 數量不合法')

  const rawAssets = raw.assets as unknown[]
  const rawItems = raw.items as unknown[]
  const rawLayouts = raw.layouts as unknown[]

  const assetIds = new Set<string>()
  const assets = rawAssets.map((value): Asset => {
    assertRecord(value, 'asset 必須是 object')
    if (!isNonEmptyString(value.id) || assetIds.has(value.id)) failSchema('asset id 不合法或重複')
    const id = value.id as string
    assetIds.add(id)
    const expectedFile = `images/${id}.webp`
    if (value.file !== expectedFile || value.mime !== 'image/webp') failSchema(`asset 路徑或 MIME 不合法：${value.id}`)
    if (!isPositiveInteger(value.width) || !isPositiveInteger(value.height)
      || value.width > BROWSER_RUNTIME_LIMITS.generalImage.maxDimension
      || value.height > BROWSER_RUNTIME_LIMITS.longScreen.maxHeight
      || value.width * value.height > BROWSER_RUNTIME_LIMITS.longScreen.maxPixels) {
      failSchema(`asset 尺寸不合法：${value.id}`)
    }
    if (!Number.isSafeInteger(value.size) || Number(value.size) < 0 || Number(value.size) > limits.maxImageEntryBytes) {
      failSchema(`asset size 不合法：${value.id}`)
    }
    if (value.originalName !== null && typeof value.originalName !== 'string') failSchema(`asset originalName 不合法：${value.id}`)
    return {
      id,
      file: expectedFile,
      mime: 'image/webp',
      width: Number(value.width),
      height: Number(value.height),
      originalName: value.originalName as string | null,
      size: Number(value.size),
    }
  })
  const assetMap = new Map(assets.map(asset => [asset.id, asset]))

  const itemIds = new Set<string>()
  const items = rawItems.map((value): Item => {
    assertRecord(value, 'item 必須是 object')
    if (!isNonEmptyString(value.id) || itemIds.has(value.id)) failSchema('item id 不合法或重複')
    const id = value.id as string
    itemIds.add(id)
    if (value.type !== 'image' || !isNonEmptyString(value.assetId) || !assetMap.has(value.assetId)) failSchema(`item asset 關聯不合法：${value.id}`)
    if (typeof value.remark !== 'string' || value.remark.length > 10_000) failSchema(`item remark 不合法：${value.id}`)
    if (typeof value.rotation !== 'number' || !ROTATIONS.has(value.rotation)) failSchema(`item rotation 不合法：${value.id}`)
    const portraitSize = (value.portraitSize === undefined ? 'large' : value.portraitSize) as 'large' | 'small'
    if (portraitSize !== 'large' && portraitSize !== 'small') failSchema(`item portraitSize 不合法：${value.id}`)
    const assetId = value.assetId as string
    const asset = assetMap.get(assetId)!
    const layoutPreference = value.layoutPreference === undefined
      ? deriveLayoutPreference(asset, value.rotation as Item['rotation'], portraitSize)
      : value.layoutPreference
    if (!LAYOUT_PREFERENCES.has(layoutPreference as LayoutPreference)) failSchema(`item layoutPreference 不合法：${value.id}`)
    return {
      id,
      type: 'image',
      assetId,
      remark: value.remark as string,
      rotation: value.rotation as Item['rotation'],
      crop: validateCrop(value.crop),
      portraitSize,
      layoutPreference: layoutPreference as LayoutPreference,
    }
  })

  const layoutIds = new Set<string>()
  const layouts = rawLayouts.map((value): WordCompatibleGridLayout => {
    assertRecord(value, 'layout 必須是 object')
    if (!isNonEmptyString(value.id) || layoutIds.has(value.id) || value.type !== 'word-compatible-grid') {
      failSchema('layout id 或 type 不合法')
    }
    const id = value.id as string
    layoutIds.add(id)
    if (!Array.isArray(value.itemOrder) || value.itemOrder.some(id => typeof id !== 'string')) failSchema(`layout itemOrder 不合法：${value.id}`)
    const order = value.itemOrder as string[]
    if (new Set(order).size !== order.length || order.some(id => !itemIds.has(id))) failSchema(`layout itemOrder 包含重複或未知 item：${value.id}`)
    return {id, type: 'word-compatible-grid', itemOrder: [...order]}
  })
  const defaultOrder = layouts[0].itemOrder
  if (defaultOrder.length !== items.length || items.some(item => !defaultOrder.includes(item.id))) {
    failSchema('default layout 必須完整且只包含所有 items')
  }

  return {
    schema: 'image-pigeon.project',
    version: 2,
    document: {title: raw.document.title as string},
    assets,
    items,
    layouts,
  }
}

async function validateProjectEntries(
  project: ProjectV2,
  entries: Map<string, Uint8Array>,
  limits: ArchiveLimits,
  signal: AbortSignal | undefined,
  inspectImage: ProjectImageInspector,
): Promise<OpenedBrowserProject> {
  const expectedPaths = new Set([PROJECT_JSON_PATH, ...project.assets.map(asset => asset.file)])
  if (entries.size !== expectedPaths.size || [...entries.keys()].some(path => !expectedPaths.has(path))) {
    failArchive('專案檔包含遺失或多餘項目')
  }
  const assets: ArchiveAsset[] = []
  for (const asset of project.assets) {
    throwIfAborted(signal)
    const bytes = entries.get(asset.file) ?? failSchema(`找不到 asset 檔案：${asset.id}`)
    if (bytes.byteLength !== asset.size) failSchema(`asset size 與實際檔案不符：${asset.id}`)
    if (!isWebPBytes(bytes)) failSchema(`asset 不是有效的 WebP：${asset.id}`)
    const blob = new Blob([bytes], {type: asset.mime})
    const dimensions = await inspectImage(blob, signal)
    throwIfAborted(signal)
    if (dimensions.width !== asset.width || dimensions.height !== asset.height) {
      failSchema(`asset 尺寸與 manifest 不符：${asset.id}`)
    }
    assets.push({id: asset.id, blob})
  }
  const totalBytes = assets.reduce((sum, asset) => sum + asset.blob.size, 0)
  if (totalBytes > limits.maxExpandedBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `圖片合計不得超過 ${limits.maxExpandedBytes} bytes`)
  }
  return {project, assets}
}

function zipAsync(entries: AsyncZippable, signal?: AbortSignal): Promise<Uint8Array> {
  throwIfAborted(signal)
  return new Promise((resolve, reject) => {
    let settled = false
    let terminate = () => {}
    const onAbort = () => {
      if (settled) return
      settled = true
      terminate()
      reject(new BrowserOperationError('OPERATION_CANCELLED', '操作已取消'))
    }
    signal?.addEventListener('abort', onAbort, {once: true})
    terminate = zip(entries, {level: 6}, (error, data) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      if (error) reject(new BrowserOperationError('INVALID_PROJECT_ARCHIVE', '建立專案 ZIP 失敗', error))
      else resolve(data)
    })
    if (signal?.aborted) onAbort()
  })
}

function unzipAsync(bytes: Uint8Array, signal?: AbortSignal): Promise<Unzipped> {
  throwIfAborted(signal)
  return new Promise((resolve, reject) => {
    let settled = false
    let terminate = () => {}
    const onAbort = () => {
      if (settled) return
      settled = true
      terminate()
      reject(new BrowserOperationError('OPERATION_CANCELLED', '操作已取消'))
    }
    signal?.addEventListener('abort', onAbort, {once: true})
    terminate = unzip(bytes, (error, data) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', onAbort)
      if (error) reject(new BrowserOperationError('INVALID_PROJECT_ARCHIVE', '解壓專案檔失敗', error))
      else resolve(data)
    })
    if (signal?.aborted) onAbort()
  })
}

export async function createProjectArchive(
  projectInput: ProjectV2,
  store: BrowserAssetStore,
  signal?: AbortSignal,
): Promise<Blob> {
  const limits = BROWSER_RUNTIME_LIMITS.projectArchive
  throwIfAborted(signal)
  const project = validateProject(projectInput, limits)
  const projectJson = encoder.encode(JSON.stringify(project))
  if (projectJson.byteLength > limits.maxProjectJsonBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `project.json 不得超過 ${limits.maxProjectJsonBytes} bytes`)
  }
  const entries: AsyncZippable = {[PROJECT_JSON_PATH]: [projectJson, {level: 6}]}
  let expandedBytes = projectJson.byteLength
  for (const asset of project.assets) {
    throwIfAborted(signal)
    const blob = store.getBlob(asset.id)
    if (blob.size !== asset.size) failSchema(`asset size 與記憶體圖片不符：${asset.id}`)
    expandedBytes += blob.size
    if (expandedBytes > limits.maxExpandedBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案內容不得超過 ${limits.maxExpandedBytes} bytes`)
    }
    entries[asset.file] = [new Uint8Array(await blob.arrayBuffer()), {level: 6}]
  }
  throwIfAborted(signal)
  const zipped = await zipAsync(entries, signal)
  if (zipped.byteLength > limits.maxCompressedBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案檔不得超過 ${limits.maxCompressedBytes} bytes`)
  }
  return new Blob([zipped], {type: 'application/vnd.image-pigeon+zip'})
}

export async function openProjectArchive(
  blob: Blob,
  signal?: AbortSignal,
  inspectImage: ProjectImageInspector = inspectProjectImageInBrowser,
): Promise<OpenedBrowserProject> {
  const limits = BROWSER_RUNTIME_LIMITS.projectArchive
  throwIfAborted(signal)
  if (blob.size > limits.maxCompressedBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `專案檔不得超過 ${limits.maxCompressedBytes} bytes`)
  }
  const bytes = new Uint8Array(await blob.arrayBuffer())
  throwIfAborted(signal)
  const metadata = inspectZip(bytes, limits)
  const unzipped = await unzipAsync(bytes, signal)
  throwIfAborted(signal)
  const entries = new Map<string, Uint8Array>()
  for (const entry of metadata) {
    const data = unzipped[entry.rawName]
    if (!data || data.byteLength !== entry.expandedSize) failArchive(`ZIP 項目解壓尺寸不符：${entry.canonicalName}`)
    entries.set(entry.canonicalName, data)
  }
  const projectBytes = entries.get(PROJECT_JSON_PATH)
  if (!projectBytes) failArchive('專案檔缺少 project.json')
  const project = validateProject(parseJson(projectBytes as Uint8Array), limits)
  return validateProjectEntries(project, entries, limits, signal, inspectImage)
}
