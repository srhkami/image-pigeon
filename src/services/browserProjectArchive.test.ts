import assert from 'node:assert/strict'
import test from 'node:test'
import {unzipSync, zipSync} from 'fflate'

import {BrowserAssetStore} from './browserAssetStore.ts'
import {BROWSER_RUNTIME_LIMITS, BrowserOperationError} from './browserRuntimeContract.ts'
import {
  createProjectArchive,
  openProjectArchive,
} from './browserProjectArchive.ts'
import type {ProjectV2} from '../types/project.ts'

const encoder = new TextEncoder()

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

const grid4LayoutPreference = 'grid-4' as const

const annotations = [
  {id: 'box', kind: 'ellipse' as const, x: 0.1, y: 0.2, width: 0.3, height: 0.4, stroke: '#123456', fill: '#654321'},
  {id: 'line', kind: 'double-arrow' as const, x1: 0.2, y1: 0.8, x2: 0.7, y2: 0.3, stroke: '#ef4444'},
]

test('標記專案保存為 version 3 並完整往返；刪除全部標記後回存 version 2', async () => {
  const project = projectFixture()
  project.items[0].annotations = annotations
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-1', new Blob([WEBP_BYTES], {type: 'image/webp'}))
  const archive = await createProjectArchive(project, store)
  const raw = JSON.parse(new TextDecoder().decode(unzipSync(new Uint8Array(await archive.arrayBuffer()))['project.json']))
  assert.equal(raw.version, 3, '含標記的專案不得仍包成 version 2')
  assert.deepEqual(raw.items[0].annotations, annotations)
  const opened = await openProjectArchive(archive, undefined, inspectFixtureImage)
  assert.deepEqual(opened.project.items[0].annotations, annotations)
  assert.equal(opened.project.version, 3)
  opened.project.items[0].annotations = []
  const empty = await createProjectArchive(opened.project, store)
  const reopened = await openProjectArchive(empty, undefined, inspectFixtureImage)
  assert.equal(reopened.project.version, 2)
  assert.deepEqual(reopened.project.items[0].annotations ?? [], [])
})

test('兩種局部副本與既有標記同存 version 3，重開保留來源與縮放且底圖資產不增生', async () => {
  const project = projectFixture()
  const copies = (['magnify-circle', 'magnify-rectangle'] as const).map(kind => ({
    id: kind, kind, stroke: '#123456', x: 0.5, y: 0.25, width: 0.5, height: 0.5,
    source: {x: 0.125, y: 0.25, width: 0.25, height: 0.25},
  }))
  project.items[0].annotations = [...annotations, ...copies]
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-1', new Blob([WEBP_BYTES], {type: 'image/webp'}))
  const saved = await createProjectArchive(project, store)
  const opened = await openProjectArchive(saved, undefined, inspectFixtureImage)
  assert.equal(opened.project.version, 3)
  assert.deepEqual(opened.project.items[0].annotations, [...annotations, ...copies])
  assert.equal(opened.assets.length, 1)
  assert.deepEqual(new Uint8Array(await opened.assets[0].blob.arrayBuffer()), WEBP_BYTES)
  for (const source of [null, {x: 0, y: 0, width: 0, height: 0.25}, {...copies[0].source, x: 1}]) {
    const raw = {...project, version: 3, items: [{...project.items[0], annotations: [{...copies[0], source}]}]}
    let inspected = false
    await assert.rejects(openProjectArchive(makeArchive({'project.json': encoder.encode(JSON.stringify(raw)), 'images/asset-1.webp': WEBP_BYTES}), undefined,
      async () => { inspected = true; return inspectFixtureImage() }),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA')
    assert.equal(inspected, false)
  }
})

test('拒絕 version 2 偷帶標記、未知版本與非法物件，開啟前不影響現有資產', async () => {
  for (const [version, values] of [
    [2, annotations], [5, []], [3, [...annotations, annotations[0]]],
    [3, [{...annotations[0], kind: 'unknown'}]], [3, [{...annotations[0], width: -1}]],
    [3, [{...annotations[0], x: 0.9}]], [3, [{...annotations[0], stroke: 'url(x)'}]],
  ] as const) {
    const raw = {...projectFixture(), version, items: [{...projectFixture().items[0], annotations: values}]}
    let inspections = 0
    const archive = makeArchive({'project.json': encoder.encode(JSON.stringify(raw)), 'images/asset-1.webp': WEBP_BYTES})
    await assert.rejects(openProjectArchive(archive, undefined, async () => { inspections++; return inspectFixtureImage() }),
      (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA')
    assert.equal(inspections, 0)
  }
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

test('五段粗細與局部副本完整往返 version 4，無粗細及無物件仍保存舊格式', async () => {
  const project = projectFixture()
  const styled = ([1, 2, 3, 4, 5] as const).flatMap(strokeWidthLevel => [
    ...annotations.map(annotation => ({...annotation, id: `${annotation.id}-${strokeWidthLevel}`, strokeWidthLevel})),
    ...(['magnify-circle', 'magnify-rectangle'] as const).map(kind => ({
      id: `${kind}-${strokeWidthLevel}`, kind, stroke: '#123456', strokeWidthLevel,
      x: 0.5, y: 0.25, width: 0.5, height: 0.5, source: {x: 0.125, y: 0.25, width: 0.25, height: 0.25},
    })),
  ])
  project.items[0].annotations = styled
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-1', new Blob([WEBP_BYTES], {type: 'image/webp'}))
  const archive = await createProjectArchive(project, store)
  const opened = await openProjectArchive(archive, undefined, inspectFixtureImage)
  assert.equal(opened.project.version, 4)
  assert.deepEqual(opened.project.items[0].annotations, styled)
  assert.equal(opened.assets.length, 1)
  assert.deepEqual(new Uint8Array(await opened.assets[0].blob.arrayBuffer()), WEBP_BYTES)
  opened.project.items[0].annotations = annotations
  assert.equal((await openProjectArchive(await createProjectArchive(opened.project, store), undefined, inspectFixtureImage)).project.version, 3)
  opened.project.items[0].annotations = []
  assert.equal((await openProjectArchive(await createProjectArchive(opened.project, store), undefined, inspectFixtureImage)).project.version, 2)
})

test('舊版號不得偷帶粗細，version 4 的非法檔位在圖片解碼前拒絕', async () => {
  for (const [version, strokeWidthLevel] of [[2, 5], [3, 5], [4, 0], [4, 6], [4, 1.5], [4, null], [4, '3']] as const) {
    const raw = {...projectFixture(), version, items: [{...projectFixture().items[0], annotations: [{...annotations[0], strokeWidthLevel}]}]}
    let inspections = 0
    const archive = makeArchive({'project.json': encoder.encode(JSON.stringify(raw)), 'images/asset-1.webp': WEBP_BYTES})
    await assert.rejects(openProjectArchive(archive, undefined, async () => { inspections++; return inspectFixtureImage() }),
      (error: unknown) => error instanceof BrowserOperationError && error.code === 'INVALID_PROJECT_SCHEMA')
    assert.equal(inspections, 0)
  }
})

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

test('version 2 archive roundtrip 接受 grid-4，且既有 grid-6 專案維持可讀', async () => {
  const grid4Project: ProjectV2 = {
    ...projectFixture(),
    items: [{...projectFixture().items[0], layoutPreference: grid4LayoutPreference}],
  }
  const store = new BrowserAssetStore(urlApi)
  store.register('asset-1', new Blob([WEBP_BYTES], {type: 'image/webp'}))

  const grid4Archive = await createProjectArchive(grid4Project, store)
  const openedGrid4 = await openProjectArchive(grid4Archive, undefined, inspectFixtureImage)
  const legacyArchive = await createProjectArchive(projectFixture(), store)
  const openedLegacy = await openProjectArchive(legacyArchive, undefined, inspectFixtureImage)

  assert.equal(openedGrid4.project.version, 2)
  assert.equal(openedGrid4.project.items[0].layoutPreference, 'grid-4')
  assert.equal(openedLegacy.project.items[0].layoutPreference, 'grid-6')
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
