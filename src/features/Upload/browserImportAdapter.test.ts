import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {BrowserAssetStore} from '../../services/browserAssetStore.ts'
import {
  formatImportSummary,
  importGeneralImages,
  importLongScreens,
  type BrowserImageProcessor,
} from './browserImportAdapter.ts'

const urlApi = {
  next: 0,
  createObjectURL() {
    this.next += 1
    return `blob:import-${this.next}`
  },
  revokeObjectURL() {},
}

const processor: BrowserImageProcessor = {
  async processImage(file) {
    if (file.name.includes('bad')) throw new Error('無法解碼')
    return {blob: new Blob([file.name]), width: 1200, height: 800, mime: 'image/webp'}
  },
  async processLongScreen(file) {
    if (file.name.includes('bad')) throw new Error('切割失敗')
    return [
      {blob: new Blob([`${file.name}-1`]), width: 600, height: 1060, mime: 'image/webp'},
      {blob: new Blob([`${file.name}-2`]), width: 600, height: 1060, mime: 'image/webp'},
    ]
  },
}

const namedBlob = (name: string, bytes = 'x') => Object.assign(new Blob([bytes]), {name}) as File

const uploadMultipleSource = readFileSync(new URL('./UploadMultiple.tsx', import.meta.url), 'utf8')
const uploadLongScreenSource = readFileSync(new URL('./UploadLongScreen.tsx', import.meta.url), 'utf8')

test('一般圖片依序處理、部分失敗後一次 commit 並保留備註模式', async () => {
  const store = new BrowserAssetStore(urlApi)
  const progress: number[] = []
  const result = await importGeneralImages({
    files: [namedBlob('first.jpg'), namedBlob('bad.png'), namedBlob('third.webp')],
    quality: 75,
    minSize: 1000,
    remarkMode: {isFileNameMode: true, defaultRemark: '預設'},
    store,
    processor,
    onProgress: value => progress.push(value),
  })

  assert.equal(result.assets.length, 2)
  assert.deepEqual(result.items.map(item => item.remark), ['first.jpg', 'third.webp'])
  assert.deepEqual(result.skipped, ['bad.png'])
  assert.deepEqual(progress, [1, 2, 3])
  assert.equal(store.size, 2)
})

test('一般圖片全數失敗或取消時不污染既有 store', async () => {
  const store = new BrowserAssetStore(urlApi)
  store.register('existing', new Blob(['old']))
  await assert.rejects(() => importGeneralImages({
    files: [namedBlob('bad.jpg')],
    quality: 75,
    minSize: 1000,
    remarkMode: {isFileNameMode: false, defaultRemark: ''},
    store,
    processor,
  }))
  assert.equal(store.size, 1)

  const controller = new AbortController()
  controller.abort()
  await assert.rejects(() => importGeneralImages({
    files: [namedBlob('ok.jpg')],
    quality: 75,
    minSize: 1000,
    remarkMode: {isFileNameMode: false, defaultRemark: ''},
    store,
    processor,
    signal: controller.signal,
  }), /已取消/)
  assert.equal(store.size, 1)
})

test('長截圖以來源為原子單位，不留下失敗來源的部分 segments', async () => {
  const store = new BrowserAssetStore(urlApi)
  const result = await importLongScreens({
    files: [namedBlob('long.png'), namedBlob('bad.png')],
    quality: 75,
    minSize: 1000,
    defaultRemark: '說明',
    store,
    processor,
  })

  assert.equal(result.assets.length, 2)
  assert.equal(result.items.length, 2)
  assert.deepEqual(result.skipped, ['bad.png'])
  assert.equal(store.size, 2)
})

test('長截圖 processor 每個來源都取得扣除既有與 pending 後的容量', async () => {
  const store = new BrowserAssetStore(urlApi)
  store.register('existing', new Blob(['old']))
  const capacities: Array<{assets?: number; bytes?: number}> = []
  const boundedProcessor: BrowserImageProcessor = {
    ...processor,
    async processLongScreen(file: File, options: {quality: number; minSize: number; signal?: AbortSignal; maxOutputAssets?: number; maxOutputBytes?: number}) {
      capacities.push({assets: options.maxOutputAssets, bytes: options.maxOutputBytes})
      return [{blob: new Blob([file.name]), width: 600, height: 1060, mime: 'image/webp'}]
    },
  }

  await importLongScreens({
    files: [namedBlob('one.png'), namedBlob('two.png')],
    quality: 75,
    minSize: 1000,
    defaultRemark: '',
    store,
    processor: boundedProcessor,
  })

  assert.deepEqual(capacities.map(value => value.assets), [999, 998])
  assert.ok(capacities[1].bytes! < capacities[0].bytes!)
})

test('一般圖片與長截圖 UI 都只接純前端 adapter', () => {
  assert.match(uploadMultipleSource, /importGeneralImages/)
  assert.match(uploadLongScreenSource, /importLongScreens/)
  assert.doesNotMatch(uploadMultipleSource, /imageApi|window\.pywebview|\/api\/images/)
  assert.doesNotMatch(uploadLongScreenSource, /imageApi|window\.pywebview|\/api\/images/)
  assert.match(uploadMultipleSource, /signal,/)
  assert.match(uploadLongScreenSource, /signal,/)
  assert.match(uploadMultipleSource, /formatImportSummary\(importData\)/)
  assert.match(uploadLongScreenSource, /formatImportSummary\(importData\)/)
  for (const value of ['50', '75', '90', '100']) {
    assert.match(uploadMultipleSource, new RegExp(`option value='${value}'`))
  }
  for (const minSize of ['500', '1000', '2000']) {
    assert.match(uploadMultipleSource, new RegExp(`option value='${minSize}'`))
  }
})

test('pending 產物逐步超限時立即中止且不 commit', async () => {
  const generalStore = new BrowserAssetStore(urlApi, {maxAssets: 1, maxBytes: 100})
  await assert.rejects(() => importGeneralImages({
    files: [namedBlob('one.jpg'), namedBlob('two.jpg')],
    quality: 75,
    minSize: 1000,
    remarkMode: {isFileNameMode: false, defaultRemark: ''},
    store: generalStore,
    processor,
  }), /最多保存 1 個/)
  assert.equal(generalStore.size, 0)

  const longStore = new BrowserAssetStore(urlApi, {maxAssets: 1, maxBytes: 100})
  await assert.rejects(() => importLongScreens({
    files: [namedBlob('long.png')],
    quality: 75,
    minSize: 1000,
    defaultRemark: '',
    store: longStore,
    processor,
  }), /最多保存 1 個/)
  assert.equal(longStore.size, 0)
})

test('部分成功摘要列出成功數、略過檔名與安全錯誤', () => {
  const summary = formatImportSummary({
    assets: [{id: 'a', file: 'images/a.webp', mime: 'image/webp', width: 1, height: 1, originalName: 'ok.jpg', size: 1}],
    items: [{id: 'i', type: 'image', assetId: 'a', remark: '', rotation: 0, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}}],
    layoutPatch: {appendItemOrder: ['i']},
    skipped: ['bad.png'],
    errors: [{filename: 'bad.png', message: '圖片無法處理'}],
  })
  assert.equal(summary, '新增 1 張圖片成功；略過 1 個檔案：bad.png（圖片無法處理）')
})
