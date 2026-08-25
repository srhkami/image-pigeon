import {BROWSER_RUNTIME_LIMITS, BrowserOperationError} from './browserRuntimeContract.ts'

type ObjectUrlApi = {
  createObjectURL(blob: Blob): string
  revokeObjectURL(url: string): void
}

type AssetStoreLimits = {
  maxAssets: number
  maxBytes: number
}

type StoredAsset = {
  blob: Blob
  url: string
}

const defaultUrlApi: ObjectUrlApi = {
  createObjectURL: blob => URL.createObjectURL(blob),
  revokeObjectURL: url => URL.revokeObjectURL(url),
}

export class BrowserAssetStore {
  readonly #assets = new Map<string, StoredAsset>()
  readonly #urlApi: ObjectUrlApi
  readonly #limits: AssetStoreLimits
  #totalBytes = 0

  constructor(
    urlApi: ObjectUrlApi = defaultUrlApi,
    limits: AssetStoreLimits = BROWSER_RUNTIME_LIMITS.assetStore,
  ) {
    this.#urlApi = urlApi
    this.#limits = limits
  }

  get size(): number {
    return this.#assets.size
  }

  get totalBytes(): number {
    return this.#totalBytes
  }

  has(assetId: string): boolean {
    return this.#assets.has(assetId)
  }

  getBlob(assetId: string): Blob {
    const asset = this.#assets.get(assetId)
    if (!asset) throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', `找不到圖片資產：${assetId}`)
    return asset.blob
  }

  getUrl(assetId: string): string {
    const asset = this.#assets.get(assetId)
    if (!asset) throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', `找不到圖片資產：${assetId}`)
    return asset.url
  }

  assertCanRegisterBatch(entries: readonly {id: string; blob: Blob}[]): void {
    const sizes = new Map<string, number>()
    for (const [id, asset] of this.#assets) sizes.set(id, asset.blob.size)
    for (const entry of entries) sizes.set(entry.id, entry.blob.size)

    const totalBytes = [...sizes.values()].reduce((total, size) => total + size, 0)
    if (sizes.size > this.#limits.maxAssets) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `頁面最多保存 ${this.#limits.maxAssets} 個圖片資產`)
    }
    if (totalBytes > this.#limits.maxBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `頁面圖片資產合計不得超過 ${this.#limits.maxBytes} bytes`)
    }
  }

  register(assetId: string, blob: Blob): string {
    this.assertCanRegisterBatch([{id: assetId, blob}])
    const previous = this.#assets.get(assetId)
    const url = this.#urlApi.createObjectURL(blob)

    this.#assets.set(assetId, {blob, url})
    this.#totalBytes += blob.size - (previous?.blob.size ?? 0)
    if (previous) this.#urlApi.revokeObjectURL(previous.url)
    return url
  }

  replaceAll(entries: readonly {id: string; blob: Blob}[]): void {
    const ids = new Set(entries.map(entry => entry.id))
    const totalBytes = entries.reduce((total, entry) => total + entry.blob.size, 0)
    if (ids.size !== entries.length) {
      throw new BrowserOperationError('INVALID_PROJECT_SCHEMA', '圖片資產 ID 不得重複')
    }
    if (ids.size > this.#limits.maxAssets) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `頁面最多保存 ${this.#limits.maxAssets} 個圖片資產`)
    }
    if (totalBytes > this.#limits.maxBytes) {
      throw new BrowserOperationError('RESOURCE_LIMIT_EXCEEDED', `頁面圖片資產合計不得超過 ${this.#limits.maxBytes} bytes`)
    }

    const replacements = new Map<string, StoredAsset>()
    try {
      for (const entry of entries) {
        replacements.set(entry.id, {
          blob: entry.blob,
          url: this.#urlApi.createObjectURL(entry.blob),
        })
      }
    } catch (error) {
      for (const replacement of replacements.values()) this.#urlApi.revokeObjectURL(replacement.url)
      throw error
    }

    const previousAssets = [...this.#assets.values()]
    this.#assets.clear()
    for (const [id, replacement] of replacements) this.#assets.set(id, replacement)
    this.#totalBytes = totalBytes
    for (const previous of previousAssets) this.#urlApi.revokeObjectURL(previous.url)
  }

  delete(assetId: string): boolean {
    const asset = this.#assets.get(assetId)
    if (!asset) return false
    this.#assets.delete(assetId)
    this.#totalBytes -= asset.blob.size
    this.#urlApi.revokeObjectURL(asset.url)
    return true
  }

  clear(): void {
    for (const asset of this.#assets.values()) this.#urlApi.revokeObjectURL(asset.url)
    this.#assets.clear()
    this.#totalBytes = 0
  }
}

export const browserAssetStore = new BrowserAssetStore()
