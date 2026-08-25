import assert from 'node:assert/strict'
import test from 'node:test'
import {zipSync} from 'fflate'

import {BrowserAssetStore} from './browserAssetStore.ts'
import {BROWSER_RUNTIME_LIMITS, BrowserOperationError} from './browserRuntimeContract.ts'
import {
  createProjectArchive,
  migrateLegacyProjectJson,
  openProjectArchive,
  openProjectFolder,
} from './browserProjectArchive.ts'
import type {ProjectV2} from '../types/project.ts'

const encoder = new TextEncoder()
const LEGACY_PNG_DATA_URL = 'data:image/png;base64,iVBORw0KGgo='
const LEGACY_JPEG_DATA_URL = 'data:image/jpeg;base64,/9j/'
const LEGACY_WEBP_DATA_URL = 'data:image/webp;base64,UklGRgAAAABXRUJQ'
const LEGACY_BMP_DATA_URL = 'data:image/bmp;base64,Qk0='
const WEBP_BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])
const inspectFixtureImage = async () => ({width: 2, height: 1})

const projectFixture = (): ProjectV2 => ({
  schema: 'image-pigeon.project',
  version: 2,
  document: {title: '測試專案'},
  assets: [{
    id: 'asset-1',
    file: 'images/asset-1.webp',
    mime: 'image/webp',
    width: 2,
    height: 1,
    originalName: '原圖.png',
    size: WEBP_BYTES.byteLength,
  }],
  items: [{
    id: 'item-1',
    type: 'image',
    assetId: 'asset-1',
    remark: '備註',
    rotation: 90,
    crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'},
    portraitSize: 'small',
    layoutPreference: 'grid-6',
  }],
  layouts: [{id: 'layout_word_default', type: 'word-compatible-grid', itemOrder: ['item-1']}],
})

const urlApi = {
  next: 0,
  createObjectURL() {
    this.next += 1
    return `blob:test-${this.next}`
  },
  revokeObjectURL() {},
}

const makeArchive = (entries: Record<string, Uint8Array>): Blob => new Blob([
  zipSync(entries, {level: 0}),
], {type: 'application/zip'})

const findZipSignature = (bytes: Uint8Array, signature: number, from = 0): number => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  for (let offset = from; offset <= bytes.length - 4; offset += 1) {
    if (view.getUint32(offset, true) === signature) return offset
  }
  throw new Error(`找不到 ZIP signature ${signature.toString(16)}`)
}

const mutateArchive = async (archive: Blob, mutate: (view: DataView, bytes: Uint8Array) => void): Promise<Blob> => {
  const bytes = new Uint8Array(await archive.arrayBuffer())
  mutate(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), bytes)
  return new Blob([bytes], {type: 'application/zip'})
}

test('單一 .ipigeon roundtrip 保留 ProjectV2、圖片 bytes 與順序', async () => {
  const store = new BrowserAssetStore(urlApi)
  const imageBytes = WEBP_BYTES
  store.register('asset-1', new Blob([imageBytes], {type: 'image/webp'}))

  const archive = await createProjectArchive(projectFixture(), store)
  const opened = await openProjectArchive(archive, undefined, inspectFixtureImage)

  assert.deepEqual(opened.project, projectFixture())
  assert.equal(opened.assets.length, 1)
  assert.equal(opened.assets[0].id, 'asset-1')
  assert.deepEqual(new Uint8Array(await opened.assets[0].blob.arrayBuffer()), imageBytes)
})

test('archive 開啟時拒絕非 WebP bytes 與實際尺寸不符', async () => {
  let inspectCalls = 0
  const invalidBytes = new Uint8Array(WEBP_BYTES.byteLength)
  const invalidMimeArchive = makeArchive({
    'project.json': encoder.encode(JSON.stringify(projectFixture())),
    'images/asset-1.webp': invalidBytes,
  })
  await assert.rejects(
    () => openProjectArchive(invalidMimeArchive, undefined, async () => {
      inspectCalls += 1
      return {width: 2, height: 1}
    }),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA',
  )
  assert.equal(inspectCalls, 0)

  const wrongDimensionsArchive = makeArchive({
    'project.json': encoder.encode(JSON.stringify(projectFixture())),
    'images/asset-1.webp': WEBP_BYTES,
  })
  await assert.rejects(
    () => openProjectArchive(wrongDimensionsArchive, undefined, async () => ({width: 1, height: 1})),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA',
  )
})

test('archive 拒絕 traversal、絕對路徑與重複 canonical path', async () => {
  const projectJson = encoder.encode(JSON.stringify(projectFixture()))
  const unsafeArchives = [
    makeArchive({'project.json': projectJson, '../images/asset-1.webp': new Uint8Array([1])}),
    makeArchive({'project.json': projectJson, '/images/asset-1.webp': new Uint8Array([1])}),
    makeArchive({
      'project.json': projectJson,
      'images/asset-1.webp': new Uint8Array([1]),
      'images\\asset-1.webp': new Uint8Array([1]),
    }),
  ]

  for (const archive of unsafeArchives) {
    await assert.rejects(
      () => openProjectArchive(archive),
      (error: unknown) => error instanceof BrowserOperationError
        && ['INVALID_PROJECT_ARCHIVE', 'DUPLICATE_ARCHIVE_ENTRY'].includes(error.code),
    )
  }
})

test('archive 拒絕損壞 JSON、未知版本、遺失與多餘圖片、重複 ID', async () => {
  const validImage = WEBP_BYTES
  const variants: Array<Record<string, Uint8Array>> = [
    {'project.json': encoder.encode('{broken'), 'images/asset-1.webp': validImage},
    {
      'project.json': encoder.encode(JSON.stringify({...projectFixture(), version: 99})),
      'images/asset-1.webp': validImage,
    },
    {'project.json': encoder.encode(JSON.stringify(projectFixture()))},
    {
      'project.json': encoder.encode(JSON.stringify(projectFixture())),
      'images/asset-1.webp': validImage,
      'images/extra.webp': validImage,
    },
    {
      'project.json': encoder.encode(JSON.stringify({
        ...projectFixture(),
        assets: [projectFixture().assets[0], projectFixture().assets[0]],
      })),
      'images/asset-1.webp': validImage,
    },
    {
      'project.json': encoder.encode(JSON.stringify({
        ...projectFixture(),
        items: [{...projectFixture().items[0], rotation: '90'}],
      })),
      'images/asset-1.webp': validImage,
    },
  ]

  for (const entries of variants) {
    await assert.rejects(
      () => openProjectArchive(makeArchive(entries)),
      (error: unknown) => error instanceof BrowserOperationError
        && ['INVALID_PROJECT_ARCHIVE', 'INVALID_PROJECT_SCHEMA'].includes(error.code),
    )
  }
})

test('archive 在解壓前拒絕 entry 數量、宣告大小與壓縮比超限', async () => {
  const archive = makeArchive({
    'project.json': encoder.encode(JSON.stringify(projectFixture())),
    'images/asset-1.webp': WEBP_BYTES,
  })
  const tooManyEntries = await mutateArchive(archive, (view, bytes) => {
    const eocd = findZipSignature(bytes, 0x06054b50)
    const count = BROWSER_RUNTIME_LIMITS.projectArchive.maxEntries + 1
    view.setUint16(eocd + 8, count, true)
    view.setUint16(eocd + 10, count, true)
  })
  const oversizedProject = await mutateArchive(archive, (view, bytes) => {
    const central = findZipSignature(bytes, 0x02014b50)
    const size = BROWSER_RUNTIME_LIMITS.projectArchive.maxProjectJsonBytes + 1
    view.setUint32(central + 20, size, true)
    view.setUint32(central + 24, size, true)
  })
  const excessiveRatio = await mutateArchive(archive, (view, bytes) => {
    const central = findZipSignature(bytes, 0x02014b50)
    view.setUint32(central + 20, 1, true)
    view.setUint32(central + 24, BROWSER_RUNTIME_LIMITS.projectArchive.maxCompressionRatio + 1, true)
  })

  for (const unsafeArchive of [tooManyEntries, oversizedProject, excessiveRatio]) {
    await assert.rejects(
      () => openProjectArchive(unsafeArchive),
      (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
    )
  }
})

test('archive 拒絕中央目錄偽造較小解壓尺寸造成的截斷資產', async () => {
  const archive = new Blob([zipSync({
    'project.json': encoder.encode(JSON.stringify(projectFixture())),
    'images/asset-1.webp': WEBP_BYTES,
  }, {level: 9})], {type: 'application/zip'})
  const forged = await mutateArchive(archive, (view, bytes) => {
    const projectCentral = findZipSignature(bytes, 0x02014b50)
    const imageCentral = findZipSignature(bytes, 0x02014b50, projectCentral + 4)
    view.setUint32(imageCentral + 24, 1, true)
  })

  await assert.rejects(
    () => openProjectArchive(forged, undefined, inspectFixtureImage),
    (error: unknown) => error instanceof BrowserOperationError
      && ['INVALID_PROJECT_ARCHIVE', 'INVALID_PROJECT_SCHEMA'].includes(error.code),
  )
})

test('archive 在取消時不繼續建立或開啟', async () => {
  const controller = new AbortController()
  controller.abort()
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-1', new Blob([WEBP_BYTES], {type: 'image/webp'}))

  await assert.rejects(
    () => createProjectArchive(projectFixture(), store, controller.signal),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
  await assert.rejects(
    () => openProjectArchive(new Blob(), controller.signal),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'OPERATION_CANCELLED',
  )
})

test('現行 .ipigeon 資料夾依 webkitRelativePath 匯入相同 ProjectV2', async () => {
  const projectFile = new File([JSON.stringify(projectFixture())], 'project.json', {type: 'application/json'})
  const imageFile = new File([WEBP_BYTES], 'asset-1.webp', {type: 'image/webp'})
  Object.defineProperty(projectFile, 'webkitRelativePath', {value: 'sample.ipigeon/project.json'})
  Object.defineProperty(imageFile, 'webkitRelativePath', {value: 'sample.ipigeon/images/asset-1.webp'})

  const opened = await openProjectFolder([projectFile, imageFile], undefined, inspectFixtureImage)

  assert.deepEqual(opened.project, projectFixture())
  assert.deepEqual(new Uint8Array(await opened.assets[0].blob.arrayBuffer()), WEBP_BYTES)
})

test('專案資料夾拒絕混合根目錄與 traversal 相對路徑', async () => {
  const projectFile = new File([JSON.stringify(projectFixture())], 'project.json', {type: 'application/json'})
  const imageFile = new File([WEBP_BYTES], 'asset-1.webp', {type: 'image/webp'})
  Object.defineProperty(projectFile, 'webkitRelativePath', {value: 'first.ipigeon/project.json'})
  Object.defineProperty(imageFile, 'webkitRelativePath', {value: 'second.ipigeon/images/asset-1.webp'})

  await assert.rejects(
    () => openProjectFolder([projectFile, imageFile]),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_ARCHIVE',
  )

  const traversal = new File([JSON.stringify(projectFixture())], 'project.json', {type: 'application/json'})
  Object.defineProperty(traversal, 'webkitRelativePath', {value: '../project.json'})
  await assert.rejects(
    () => openProjectFolder([traversal]),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_ARCHIVE',
  )
})

test('1.x JSON 全數驗證後才轉換成完整 ProjectV2', async () => {
  const legacy = JSON.stringify({
    title: '舊專案',
    path: '/private/ignored',
    images: [
      {
        id: 12,
        file: '/private/ignored.png',
        preview: 'blob:ignored',
        base64: LEGACY_PNG_DATA_URL,
        width: 2,
        height: 1,
        remark: '',
        rotation: null,
      },
      {
        base64: LEGACY_JPEG_DATA_URL,
        width: 1,
        height: 2,
        remark: '第二張',
        rotation: 90,
      },
      {
        base64: LEGACY_WEBP_DATA_URL,
        width: 3,
        height: 1,
        remark: '第三張',
        rotation: 180,
      },
      {
        base64: LEGACY_BMP_DATA_URL,
        width: 2,
        height: 1,
        remark: '第四張',
        rotation: 270,
      },
    ],
  })
  const seen: Array<{type: string; bytes: number}> = []
  const migrated = await migrateLegacyProjectJson(legacy, {
    process: async (file) => {
      seen.push({type: file.type, bytes: file.size})
      const dimensions: Record<string, readonly [number, number]> = {
        'image/png': [2, 1],
        'image/jpeg': [1, 2],
        'image/webp': [3, 1],
        'image/bmp': [2, 1],
      }
      const [width, height] = dimensions[file.type]
      return {blob: new Blob([new Uint8Array([9])], {type: 'image/webp'}), width, height, mime: 'image/webp' as const}
    },
  })

  assert.deepEqual(seen, [
    {type: 'image/png', bytes: 8},
    {type: 'image/jpeg', bytes: 3},
    {type: 'image/webp', bytes: 12},
    {type: 'image/bmp', bytes: 2},
  ])
  assert.equal(migrated.project.document.title, '舊專案')
  assert.equal(migrated.project.assets.length, 4)
  assert.deepEqual(migrated.project.items.map(item => [item.remark, item.rotation]), [
    ['', 0],
    ['第二張', 90],
    ['第三張', 180],
    ['第四張', 270],
  ])
  assert.deepEqual(migrated.project.layouts[0].itemOrder, migrated.project.items.map(item => item.id))
  assert.equal(migrated.assets.length, 4)
})

test('1.x JSON 任一資料錯誤會整批拒絕且不呼叫 processor', async () => {
  const invalidImages = [
    {base64: 'not-a-data-url', width: 1, height: 1, remark: ''},
    {base64: 'data:image/gif;base64,AQID', width: 1, height: 1, remark: ''},
    {base64: 'data:image/png;base64,%%%%', width: 1, height: 1, remark: ''},
    {base64: 'data:image/png;base64,/9j/', width: 1, height: 1, remark: ''},
    {base64: LEGACY_PNG_DATA_URL, width: 0, height: 1, remark: ''},
    {base64: LEGACY_PNG_DATA_URL, width: 1, height: 1, remark: 1},
    {base64: LEGACY_PNG_DATA_URL, width: 1, height: 1, remark: '', rotation: 45},
    {base64: LEGACY_PNG_DATA_URL, width: 1, height: 1, remark: '', rotation: ''},
    {base64: LEGACY_PNG_DATA_URL, width: 1, height: 1, remark: '', rotation: '90'},
  ]

  for (const invalid of invalidImages) {
    let calls = 0
    await assert.rejects(
      () => migrateLegacyProjectJson(JSON.stringify({images: [
        {base64: LEGACY_PNG_DATA_URL, width: 1, height: 1, remark: ''},
        invalid,
      ]}), {process: async () => {
        calls += 1
        return {blob: new Blob(), width: 1, height: 1, mime: 'image/webp' as const}
      }}),
      (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA',
    )
    assert.equal(calls, 0)
  }
})

test('1.x JSON 宣告尺寸與實際解碼不符時整批拒絕', async () => {
  await assert.rejects(
    () => migrateLegacyProjectJson(JSON.stringify({images: [
      {base64: LEGACY_PNG_DATA_URL, width: 2, height: 1, remark: ''},
    ]}), {process: async () => ({
      blob: new Blob([new Uint8Array([1])], {type: 'image/webp'}),
      width: 1,
      height: 1,
      mime: 'image/webp' as const,
    })}),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA',
  )
})
