import type {BrowserWordItem} from './browserWordExporter.ts'
import {BrowserAssetStore} from './browserAssetStore.ts'
import {browserJpegConverter, type BrowserJpegConverter} from './browserImageZip.ts'
import {throwIfAborted} from './browserRuntimeContract.ts'
import type {Item, ProjectV2} from '../types/project.ts'

export type BrowserWordProjectOptions = {
  signal?: AbortSignal
  onProgress?: (completed: number) => void
}

function orderedItems(project: ProjectV2): Item[] {
  const itemMap = new Map(project.items.map(item => [item.id, item]))
  const order = project.layouts.find(layout => layout.id === 'layout_word_default')?.itemOrder
    ?? project.layouts.find(layout => layout.type === 'word-compatible-grid')?.itemOrder
    ?? []
  return [
    ...order.map(itemId => itemMap.get(itemId)).filter((item): item is Item => Boolean(item)),
    ...project.items.filter(item => !order.includes(item.id)),
  ]
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function createBrowserWordItems(
  project: ProjectV2,
  assetStore: BrowserAssetStore,
  options: BrowserWordProjectOptions = {},
  converter: BrowserJpegConverter = browserJpegConverter,
): Promise<BrowserWordItem[]> {
  const result: BrowserWordItem[] = []
  for (const item of orderedItems(project)) {
    throwIfAborted(options.signal)
    const asset = project.assets.find(candidate => candidate.id === item.assetId)
    if (!asset) throw new Error(`找不到圖片資產資訊：${item.assetId}`)
    const jpeg = await converter.convert(assetStore.getBlob(item.assetId), item.rotation, options.signal)
    throwIfAborted(options.signal)
    if (jpeg.type && jpeg.type !== 'image/jpeg') throw new Error('圖片轉換器未產生 JPEG')
    const imageData = new Uint8Array(await jpeg.arrayBuffer())
    throwIfAborted(options.signal)
    const rotated = item.rotation === 90 || item.rotation === 270
    result.push({
      itemId: item.id,
      layoutPreference: item.layoutPreference ?? 'grid-6',
      remark: item.remark,
      width: rotated ? asset.height : asset.width,
      height: rotated ? asset.width : asset.height,
      imageData,
      sha256: await sha256(imageData),
    })
    throwIfAborted(options.signal)
    options.onProgress?.(result.length)
  }
  throwIfAborted(options.signal)
  return result
}
