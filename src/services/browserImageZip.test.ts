import assert from 'node:assert/strict'
import test from 'node:test'
import {unzipSync} from 'fflate'

import {BrowserAssetStore} from './browserAssetStore.ts'
import {BrowserOperationError} from './browserRuntimeContract.ts'
import {
  browserJpegConverter,
  createImageExportZip,
  normalizeImageExportFilename,
  type BrowserJpegConverter,
} from './browserImageZip.ts'
import type {ProjectV2} from '../types/project.ts'

const urlApi = {
  createObjectURL: (blob: Blob) => `blob:${blob.size}`,
  revokeObjectURL() {},
}

const makeProject = (): ProjectV2 => ({
  schema: 'image-pigeon.project',
  version: 2,
  document: {title: '測試'},
  assets: [
    {id: 'asset-a', file: 'images/asset-a.webp', mime: 'image/webp', width: 2, height: 1, originalName: 'a.webp', size: 1},
    {id: 'asset-b', file: 'images/asset-b.webp', mime: 'image/webp', width: 1, height: 2, originalName: 'b.webp', size: 1},
    {id: 'asset-c', file: 'images/asset-c.webp', mime: 'image/webp', width: 2, height: 2, originalName: 'c.webp', size: 1},
  ],
  items: [
    {id: 'item-a', type: 'image', assetId: 'asset-a', remark: '同名', rotation: 90, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}},
    {id: 'item-b', type: 'image', assetId: 'asset-b', remark: '同名', rotation: 270, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}},
    {id: 'item-c', type: 'image', assetId: 'asset-c', remark: '', rotation: 0, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}},
  ],
  layouts: [{id: 'layout_word_default', type: 'word-compatible-grid', itemOrder: ['item-b', 'item-a', 'item-c']}],
})

test('輸出檔名正規化換行、Windows 非法字元與空白', () => {
  assert.equal(normalizeImageExportFilename(' 甲\n乙<丙>:"/\\|?* '), '甲_乙_丙________')
  assert.equal(normalizeImageExportFilename('   \n\t '), '')
})

test('瀏覽器 JPEG converter 依旋轉角交換 Canvas 尺寸並繪製 JPEG', async () => {
  const originalCreateImageBitmap = globalThis.createImageBitmap
  const originalDocument = globalThis.document
  const calls: Array<{name: string; values: number[]}> = []
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      fillRect: (...values: number[]) => calls.push({name: 'fillRect', values}),
      translate: (...values: number[]) => calls.push({name: 'translate', values}),
      rotate: (...values: number[]) => calls.push({name: 'rotate', values}),
      drawImage: (...args: unknown[]) => calls.push({name: 'drawImage', values: args.slice(1) as number[]}),
    }),
    toBlob: (callback: BlobCallback) => callback(new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {type: 'image/jpeg'})),
  }
  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async () => ({width: 4, height: 2, close() {}}),
  })
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {createElement: () => canvas},
  })

  try {
    const result = await browserJpegConverter.convert(new Blob([new Uint8Array([1])]), 90)
    assert.equal(result.type, 'image/jpeg')
    assert.deepEqual(calls.find(call => call.name === 'translate')?.values, [1, 2])
    assert.equal(calls.find(call => call.name === 'rotate')?.values[0], Math.PI / 2)
    assert.deepEqual(calls.find(call => call.name === 'drawImage')?.values, [-2, -1])
    assert.equal(canvas.width, 0)
    assert.equal(canvas.height, 0)
  } finally {
    Object.defineProperty(globalThis, 'createImageBitmap', {configurable: true, value: originalCreateImageBitmap})
    Object.defineProperty(globalThis, 'document', {configurable: true, value: originalDocument})
  }
})

test('圖片 ZIP 依 canonical order 逐張轉為 JPEG 並穩定消歧重複與空備註', async () => {
  const project = makeProject()
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-a', new Blob([new Uint8Array([0xa])], {type: 'image/webp'}))
  store.register('asset-b', new Blob([new Uint8Array([0xb])], {type: 'image/webp'}))
  store.register('asset-c', new Blob([new Uint8Array([0xc])], {type: 'image/webp'}))
  const calls: Array<{source: number; rotation: number}> = []
  const converter: BrowserJpegConverter = {
    async convert(source, rotation) {
      const [sourceByte] = new Uint8Array(await source.arrayBuffer())
      calls.push({source: sourceByte, rotation})
      return new Blob([new Uint8Array([0xff, 0xd8, sourceByte, 0xff, 0xd9])], {type: 'image/jpeg'})
    },
  }
  const progress: number[] = []

  const archive = await createImageExportZip(project, store, {
    title: 'Photo',
    isRemarkMode: true,
    onProgress: value => progress.push(value),
  }, converter)
  const entries = unzipSync(new Uint8Array(await archive.arrayBuffer()))

  assert.deepEqual(Object.keys(entries), ['同名.jpg', '同名_2.jpg', 'Photo_3.jpg'])
  assert.deepEqual(calls, [
    {source: 0xb, rotation: 270},
    {source: 0xa, rotation: 90},
    {source: 0xc, rotation: 0},
  ])
  assert.deepEqual(progress, [1, 2, 3])
  for (const bytes of Object.values(entries)) {
    assert.equal(bytes[0], 0xff)
    assert.equal(bytes[1], 0xd8)
    assert.equal(bytes[bytes.length - 2], 0xff)
    assert.equal(bytes[bytes.length - 1], 0xd9)
  }
})

test('預設命名依 canonical order 使用正規化標題與連續序號', async () => {
  const project = makeProject()
  const store = new BrowserAssetStore(urlApi)
  for (const asset of project.assets) store.register(asset.id, new Blob([asset.id]))
  const converter: BrowserJpegConverter = {
    async convert() {
      return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {type: 'image/jpeg'})
    },
  }

  const archive = await createImageExportZip(project, store, {
    title: '案件/照片\n',
    isRemarkMode: false,
  }, converter)

  assert.deepEqual(
    Object.keys(unzipSync(new Uint8Array(await archive.arrayBuffer()))),
    ['案件_照片_1.jpg', '案件_照片_2.jpg', '案件_照片_3.jpg'],
  )
})

test('取消或任一 JPEG 轉換失敗時整批拒絕且不回傳半成品', async () => {
  const project = makeProject()
  const store = new BrowserAssetStore(urlApi)
  for (const asset of project.assets) store.register(asset.id, new Blob([asset.id]))
  let calls = 0
  const converter: BrowserJpegConverter = {
    async convert() {
      calls += 1
      if (calls === 2) throw new BrowserOperationError('CANVAS_OPERATION_FAILED', '測試轉換失敗')
      return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {type: 'image/jpeg'})
    },
  }

  await assert.rejects(
    () => createImageExportZip(project, store, {title: 'Photo', isRemarkMode: false}, converter),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'CANVAS_OPERATION_FAILED',
  )
  assert.equal(calls, 2)

  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    () => createImageExportZip(project, store, {title: 'Photo', isRemarkMode: false, signal: controller.signal}, converter),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
})

test('圖片 ZIP 在配置與每筆產物累積階段執行資源上限', async () => {
  const project = makeProject()
  const sourceLimitedStore = new BrowserAssetStore(urlApi, {maxAssets: 3, maxBytes: 10})
  sourceLimitedStore.register('asset-a', new Blob([new Uint8Array([1, 2])]))
  sourceLimitedStore.register('asset-b', new Blob([new Uint8Array([3, 4])]))
  sourceLimitedStore.register('asset-c', new Blob([new Uint8Array([5])]))
  const converter: BrowserJpegConverter = {
    async convert() {
      return new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {type: 'image/jpeg'})
    },
  }

  await assert.rejects(
    () => createImageExportZip(project, sourceLimitedStore, {
      title: 'Photo',
      isRemarkMode: false,
      limits: {maxImages: 3, maxSourceBytes: 4, maxOutputBytes: 100},
    }, converter),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
  )

  const store = new BrowserAssetStore(urlApi)
  for (const asset of project.assets) store.register(asset.id, new Blob([asset.id]))
  await assert.rejects(
    () => createImageExportZip(project, store, {
      title: 'Photo',
      isRemarkMode: false,
      limits: {maxImages: 3, maxSourceBytes: 100, maxOutputBytes: 8},
    }, converter),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
  )

  await assert.rejects(
    () => createImageExportZip(project, store, {
      title: 'Photo',
      isRemarkMode: false,
      limits: {maxImages: 3, maxSourceBytes: 100, maxOutputBytes: 20},
    }, converter),
    (error: unknown) => error instanceof BrowserOperationError
      && error.code === 'RESOURCE_LIMIT_EXCEEDED'
      && error.message.includes('完成的圖片 ZIP'),
  )
})
