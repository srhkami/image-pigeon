export const BROWSER_RUNTIME_LIMITS = {
  generalImage: {
    maxFileBytes: 33_554_432,
    maxBatchFiles: 50,
    maxBatchBytes: 536_870_912,
    maxDimension: 16_384,
    maxPixels: 64_000_000,
  },
  longScreen: {
    maxFileBytes: 67_108_864,
    maxWidth: 8_192,
    maxHeight: 65_535,
    maxPixels: 96_000_000,
    maxSegments: 100,
  },
  assetStore: {
    maxAssets: 200,
    maxBytes: 536_870_912,
  },
  projectArchive: {
    maxCompressedBytes: 536_870_912,
    maxEntries: 201,
    maxProjectJsonBytes: 2_097_152,
    maxImageEntryBytes: 67_108_864,
    maxExpandedBytes: 536_870_912,
    maxCompressionRatio: 100,
    maxAssets: 200,
    maxItems: 200,
  },
  imageExport: {
    maxImages: 200,
    maxSourceBytes: 536_870_912,
    maxOutputBytes: 536_870_912,
  },
} as const

export type BrowserOperationErrorCode =
  | 'RESOURCE_LIMIT_EXCEEDED'
  | 'IMAGE_DECODE_FAILED'
  | 'CANVAS_OPERATION_FAILED'
  | 'INVALID_PROJECT_ARCHIVE'
  | 'INVALID_PROJECT_SCHEMA'
  | 'DUPLICATE_ARCHIVE_ENTRY'
  | 'OPERATION_CANCELLED'
  | 'NO_IMAGES_IMPORTED'

export class BrowserOperationError extends Error {
  readonly code: BrowserOperationErrorCode
  readonly cause?: unknown

  constructor(code: BrowserOperationErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'BrowserOperationError'
    this.code = code
    this.cause = cause
  }
}

type FileMetadata = {name: string; size: number}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new BrowserOperationError('OPERATION_CANCELLED', '操作已取消')
  }
}

export function assertGeneralImageBatch(files: readonly FileMetadata[]): void {
  const limits = BROWSER_RUNTIME_LIMITS.generalImage
  if (files.length > limits.maxBatchFiles) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `一次最多處理 ${limits.maxBatchFiles} 張一般圖片`)
  }

  let totalBytes = 0
  for (const file of files) {
    if (file.size > limits.maxFileBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `一般圖片單檔不得超過 ${limits.maxFileBytes} bytes：${file.name}`)
    }
    totalBytes += file.size
    if (totalBytes > limits.maxBatchBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `一般圖片批次合計不得超過 ${limits.maxBatchBytes} bytes`)
    }
  }
}

export function assertLongScreenFile(file: FileMetadata): void {
  if (file.size > BROWSER_RUNTIME_LIMITS.longScreen.maxFileBytes) {
    throw new BrowserOperationError(
      'RESOURCE_LIMIT_EXCEEDED',
      `長截圖單檔不得超過 ${BROWSER_RUNTIME_LIMITS.longScreen.maxFileBytes} bytes：${file.name}`,
    )
  }
}

export function assertLongScreenBatch(files: readonly FileMetadata[], existingAssetCount = 0): void {
  const availableAssets = BROWSER_RUNTIME_LIMITS.assetStore.maxAssets - existingAssetCount
  if (files.length > availableAssets) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `目前最多可再處理 ${Math.max(0, availableAssets)} 張長截圖`)
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0)
  if (totalBytes > BROWSER_RUNTIME_LIMITS.assetStore.maxBytes) {
    throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `長截圖批次合計不得超過 ${BROWSER_RUNTIME_LIMITS.assetStore.maxBytes} bytes`)
  }
}
