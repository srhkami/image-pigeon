import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {BrowserAssetStore} from './browserAssetStore.ts'

const createUrlApi = () => {
  const created: string[] = []
  const revoked: string[] = []
  return {
    created,
    revoked,
    api: {
      createObjectURL: () => {
        const url = `blob:test-${created.length + 1}`
        created.push(url)
        return url
      },
      revokeObjectURL: (url: string) => revoked.push(url),
    },
  }
}

test('註冊 Blob 後可依 asset id 取得 Blob 與 object URL', () => {
  const urls = createUrlApi()
  const store = new BrowserAssetStore(urls.api)
  const blob = new Blob(['image'])

  const url = store.register('asset-1', blob)

  assert.equal(url, 'blob:test-1')
  assert.equal(store.getBlob('asset-1'), blob)
  assert.equal(store.getUrl('asset-1'), url)
  assert.equal(store.size, 1)
  assert.equal(store.totalBytes, blob.size)
})

test('替換、刪除與 clear 都會回收 object URL', () => {
  const urls = createUrlApi()
  const store = new BrowserAssetStore(urls.api)
  store.register('asset-1', new Blob(['old']))
  store.register('asset-1', new Blob(['new']))
  store.register('asset-2', new Blob(['other']))

  assert.deepEqual(urls.revoked, ['blob:test-1'])
  assert.equal(store.delete('asset-1'), true)
  assert.deepEqual(urls.revoked, ['blob:test-1', 'blob:test-2'])

  store.clear()
  assert.deepEqual(urls.revoked, ['blob:test-1', 'blob:test-2', 'blob:test-3'])
  assert.equal(store.size, 0)
  assert.equal(store.totalBytes, 0)
})

test('批次容量預檢失敗時不修改既有資產', () => {
  const urls = createUrlApi()
  const store = new BrowserAssetStore(urls.api, {maxAssets: 1, maxBytes: 8})
  store.register('asset-1', new Blob(['1234']))

  assert.throws(() => store.assertCanRegisterBatch([{id: 'asset-2', blob: new Blob(['12'])}]))
  assert.equal(store.size, 1)
  assert.equal(store.getUrl('asset-1'), 'blob:test-1')
  assert.deepEqual(urls.revoked, [])
})

test('replaceAll 驗證完成後原子替換全部資產並回收舊網址', () => {
  const urls = createUrlApi()
  const store = new BrowserAssetStore(urls.api, {maxAssets: 2, maxBytes: 8})
  store.register('old', new Blob(['old']))

  store.replaceAll([
    {id: 'new-1', blob: new Blob(['12'])},
    {id: 'new-2', blob: new Blob(['345'])},
  ])

  assert.equal(store.has('old'), false)
  assert.equal(store.getUrl('new-1'), 'blob:test-2')
  assert.equal(store.getUrl('new-2'), 'blob:test-3')
  assert.equal(store.totalBytes, 5)
  assert.deepEqual(urls.revoked, ['blob:test-1'])
})

test('replaceAll 容量失敗時完整保留既有資產', () => {
  const urls = createUrlApi()
  const store = new BrowserAssetStore(urls.api, {maxAssets: 1, maxBytes: 4})
  store.register('old', new Blob(['old']))

  assert.throws(() => store.replaceAll([{id: 'new', blob: new Blob(['12345'])}]))

  assert.equal(store.getUrl('old'), 'blob:test-1')
  assert.equal(store.has('new'), false)
  assert.deepEqual(urls.revoked, [])
})

test('刪除、全部清除與 App 卸載都接上 URL 回收', () => {
  const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')
  const cardSource = readFileSync(new URL('../features/ImagePreview/FocusImageCard.tsx', import.meta.url), 'utf8')

  assert.match(appSource, /useEffect\(\(\) => \(\) => \{\s*browserImportOperationCoordinator\.cancel\(\)\s*browserProjectOperationCoordinator\.cancel\(\)\s*browserAssetStore\.clear\(\)\s*\}, \[\]\)/)
  assert.match(appSource, /onClearProject=\{\(\) => \{\s*browserImportOperationCoordinator\.cancel\(\)\s*browserProjectOperationCoordinator\.cancel\(\)\s*browserAssetStore\.clear\(\)/)
  assert.match(cardSource, /browserAssetStore\.delete\(removedItem\.assetId\)/)
})
