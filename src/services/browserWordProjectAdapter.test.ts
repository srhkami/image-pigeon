import assert from 'node:assert/strict'
import test from 'node:test'

import {BrowserAssetStore} from './browserAssetStore.ts'
import {createBrowserWordItems} from './browserWordProjectAdapter.ts'

const project = {
  schema: 'image-pigeon.project' as const,
  version: 2,
  document: {title: '測試'},
  assets: [
    {id: 'asset-a', file: 'a.webp', mime: 'image/webp', width: 640, height: 480, originalName: 'a.webp', size: 1},
    {id: 'asset-b', file: 'b.webp', mime: 'image/webp', width: 400, height: 900, originalName: 'b.webp', size: 1},
  ],
  items: [
    {id: 'item-a', type: 'image' as const, assetId: 'asset-a', remark: '第一張', rotation: 90 as const, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio' as const}, layoutPreference: 'stacked-2' as const},
    {id: 'item-b', type: 'image' as const, assetId: 'asset-b', remark: '第二張', rotation: 0 as const, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio' as const}, layoutPreference: 'grid-6' as const},
  ],
  layouts: [{id: 'layout_word_default', type: 'word-compatible-grid' as const, itemOrder: ['item-b', 'item-a']}],
}

test('Word project adapter 依 project order 轉 JPEG、保留備註與 layout，並回報完成張數', async () => {
  const store = new BrowserAssetStore({createObjectURL: () => 'blob:test', revokeObjectURL: () => {}})
  store.register('asset-a', new Blob([Uint8Array.of(1)]))
  store.register('asset-b', new Blob([Uint8Array.of(2)]))
  const calls: Array<{source: number; rotation: number}> = []

  const items = await createBrowserWordItems(project, store, {
    onProgress: completed => calls.push({source: completed, rotation: -1}),
  }, {
    async convert(source, rotation) {
      calls.push({source: new Uint8Array(await source.arrayBuffer())[0]!, rotation})
      return new Blob([Uint8Array.of(0xff, 0xd8, rotation, 0xff, 0xd9)], {type: 'image/jpeg'})
    },
  })

  assert.deepEqual(calls, [
    {source: 2, rotation: 0}, {source: 1, rotation: -1},
    {source: 1, rotation: 90}, {source: 2, rotation: -1},
  ])
  assert.deepEqual(items.map(item => [item.itemId, item.width, item.height, item.remark, item.layoutPreference]), [
    ['item-b', 400, 900, '第二張', 'grid-6'],
    ['item-a', 480, 640, '第一張', 'stacked-2'],
  ])
  assert.ok(items.every(item => /^[0-9a-f]{64}$/.test(item.sha256)))
})

test('Word project adapter 在轉換前後與生成前可取消，且不回傳半成品', async () => {
  const store = new BrowserAssetStore({createObjectURL: () => 'blob:test', revokeObjectURL: () => {}})
  store.register('asset-a', new Blob([Uint8Array.of(1)]))
  store.register('asset-b', new Blob([Uint8Array.of(2)]))
  const controller = new AbortController()

  await assert.rejects(
    createBrowserWordItems(project, store, {signal: controller.signal}, {
      async convert(source) {
        controller.abort()
        return new Blob([await source.arrayBuffer()], {type: 'image/jpeg'})
      },
    }),
    (error: unknown) => typeof error === 'object' && error !== null && 'code' in error && error.code === 'OPERATION_CANCELLED',
  )
})
