import assert from 'node:assert/strict'
import {test} from 'node:test'
import {unzipSync, strFromU8} from 'fflate'
import {
  buildWordFeasibilityFixtureSpecs,
  createWordFeasibilityFixture,
  sha256WordFixtureSpecs,
  WORD_FIXTURE_SPEC_SHA256,
} from './browserWordFixture.ts'
import {
  createBrowserWordBlob,
  createBrowserWordDocument,
  WORD_MAX_ITEM_COUNT,
} from './browserWordExporter.ts'

const VALID_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAACAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4W8ef8jXff9s//Ra0UUV/o1wJ/wAknlP/AGDUP/TUTDjP/kp8z/6/1v8A05I//9k=',
  'base64',
))

const renderDistinctJpeg = async (_spec: unknown, index: number) => ({
  imageData: Uint8Array.from([
    ...VALID_JPEG.slice(0, -2),
    0xff, 0xfe, 0x00, 0x03, index,
    ...VALID_JPEG.slice(-2),
  ]),
  width: 4,
  height: 2,
})

function readJpegDimensions(data: Uint8Array): [number, number] {
  assert.deepEqual(Array.from(data.slice(0, 2)), [0xff, 0xd8])
  assert.deepEqual(Array.from(data.slice(-2)), [0xff, 0xd9])
  assert.ok(data.some((byte, index) => byte === 0xff && data[index + 1] === 0xda))
  for (let offset = 2; offset + 8 < data.length; offset += 1) {
    if (data[offset] === 0xff && (data[offset + 1] === 0xc0 || data[offset + 1] === 0xc2)) {
      return [data[offset + 7] * 256 + data[offset + 8], data[offset + 5] * 256 + data[offset + 6]]
    }
  }
  throw new Error('找不到 JPEG SOF marker')
}

const hasErrorCode = (code: string) => (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false
  return error.code === code
}

test('C7 固定 fixture 有 20 張、五種版型與有界資源規格', async () => {
  const specs = buildWordFeasibilityFixtureSpecs()
  assert.equal(specs.length, 20)
  assert.deepEqual(
    specs.map(({width, height}) => [width, height]),
    specs.map(({layoutPreference}) => layoutPreference === 'stacked-2' ? [1600, 900] : [900, 1600]),
  )
  assert.ok(specs.some(({remark}) => remark.includes('\n')))
  assert.ok(specs.some(({remark}) => remark === ''))
  assert.ok(specs.some(({rotation}) => rotation !== 0))
  assert.equal(await sha256WordFixtureSpecs(specs), WORD_FIXTURE_SPEC_SHA256)

  const fixture = await createWordFeasibilityFixture(renderDistinctJpeg)
  assert.equal(fixture.items.length, 20)
  assert.equal(fixture.totalBytes, (VALID_JPEG.byteLength + 5) * 20)
  assert.ok(fixture.items.every(({sha256}) => /^[0-9a-f]{64}$/.test(sha256)))
  assert.ok(fixture.items.every(({imageData}) => readJpegDimensions(imageData).join('x') === '4x2'))

  const result = createBrowserWordDocument({
    title: '照片黏貼表－中文驗證',
    alignVertical: 'center',
    fontSize: 12,
    items: fixture.items,
  })
  assert.equal(result.imageCount, 20)
  assert.deepEqual(
    result.layout.map(({template}) => template),
    [
      'landscape-2',
      'portrait-large-2',
      'portrait-small-6',
      'mixed-landscape1-small3',
      'mixed-small3-landscape1',
      'portrait-large-2',
    ],
  )
})

test('C7 exporter 寫出 A4、固定表格、合併儲存格、跨頁連號、備註與 20 張圖片', async () => {
  const fixture = await createWordFeasibilityFixture(renderDistinctJpeg)
  const {blob} = await createBrowserWordBlob({
    title: '照片黏貼表－中文驗證',
    alignVertical: 'top',
    fontSize: 14,
    items: fixture.items,
  })
  assert.equal(blob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()))
  const documentXml = strFromU8(archive['word/document.xml'])
  const headerXml = strFromU8(archive['word/header1.xml'])
  const contentTypesXml = strFromU8(archive['[Content_Types].xml'])
  const relationshipsXml = strFromU8(archive['word/_rels/document.xml.rels'])
  const mediaPaths = Object.keys(archive).filter((path) => /^word\/media\/[^/]+\.(?:jpg|jpeg|png)$/.test(path))

  assert.match(headerXml, /照片黏貼表－中文驗證/)
  const pageSize = documentXml.match(/<w:pgSz[^>]*w:w="(\d+)"[^>]*w:h="(\d+)"/)
  assert.ok(pageSize)
  assert.ok(Math.abs(Number(pageSize[1]) - 11906) <= 1)
  assert.ok(Math.abs(Number(pageSize[2]) - 16838) <= 1)
  assert.match(documentXml, /<w:tblLayout w:type="fixed"/)
  assert.match(documentXml, /<w:gridSpan w:val="3"/)
  assert.match(documentXml, /<w:gridSpan w:val="2"/)
  assert.match(documentXml, /編號01/)
  assert.match(documentXml, /編號20/)
  assert.match(documentXml, /中文備註/)
  assert.match(documentXml, /<w:br\/>/)
  assert.equal(mediaPaths.length, 20)
  assert.match(contentTypesXml, /ContentType="image\/jpeg"/)
  assert.match(relationshipsXml, /relationships\/image/)
  assert.ok(mediaPaths.every((path) => readJpegDimensions(archive[path]).join('x') === '4x2'))
})

test('C7 fixture 在單張或總量超限時固定失敗且不產生半成品', async () => {
  await assert.rejects(
    createWordFeasibilityFixture(async (_spec: unknown, index: number) => ({
      imageData: new Uint8Array(index === 0 ? 8 * 1024 * 1024 + 1 : 1),
      width: 1,
      height: 1,
    })),
    hasErrorCode('IMAGE_TOO_LARGE'),
  )

  await assert.rejects(
    createWordFeasibilityFixture(async () => ({imageData: new Uint8Array(5 * 1024 * 1024), width: 1, height: 1})),
    hasErrorCode('TOTAL_TOO_LARGE'),
  )

  const fixture = await createWordFeasibilityFixture(renderDistinctJpeg)
  const tooManyItems = Array.from({length: WORD_MAX_ITEM_COUNT + 1}, (_, index) => ({
    ...fixture.items[index % fixture.items.length],
    itemId: `bulk-${index}`,
  }))
  assert.throws(
    () => createBrowserWordDocument({title: '超量', alignVertical: 'top', fontSize: 12, items: tooManyItems}),
    hasErrorCode('TOO_MANY_ITEMS'),
  )
})
