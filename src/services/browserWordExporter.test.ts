import assert from 'node:assert/strict'
import {test} from 'node:test'
import {unzipSync, strFromU8} from 'fflate'
import {convertMillimetersToTwip} from 'docx'
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
import type {LayoutPreference} from '../types/project.ts'

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

test('Word 四張六張圖片使用儲存格內寬且保留等比例高度上限', async () => {
  const portraitJpeg = Uint8Array.from(Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAIBAQEBAQIBAQECAgICAgQDAgICAgUEBAMEBgUGBgYFBgYGBwkIBgcJBwYGCAsICQoKCgoKBggLDAsKDAkKCgr/2wBDAQICAgICAgUDAwUKBwYHCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgr/wAARCAAEAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD4B/4UR8J/+hSH/gdcf/HKKKK/Jv8AiO3jf/0VGY/+FuJ/+Wn+1/8AxBnwf/6JzAf+EeH/APlZ/9k=',
    'base64',
  ))
  assert.deepEqual(readJpegDimensions(VALID_JPEG), [4, 2])
  assert.deepEqual(readJpegDimensions(portraitJpeg), [2, 4])
  const cases: LayoutPreference[][] = [
    Array<LayoutPreference>(4).fill('grid-4'),
    Array<LayoutPreference>(6).fill('grid-6'),
    ['grid-4', 'grid-4', 'grid-6', 'grid-6', 'grid-6'],
    ['grid-6', 'grid-6', 'grid-6', 'grid-4', 'grid-4'],
    ['grid-4', 'grid-4', 'stacked-2'],
    ['stacked-2', 'grid-4', 'grid-4'],
    ['grid-6', 'grid-6', 'grid-6', 'stacked-2'],
    ['stacked-2', 'grid-6', 'grid-6', 'grid-6'],
  ]
  for (const preferences of cases) {
    const items = preferences.map((layoutPreference, index) => ({
      itemId: `width-${index}`, layoutPreference, remark: `備註${index}`,
      width: index % 2 === 0 ? 4 : 2, height: index % 2 === 0 ? 2 : 4,
      imageData: index % 2 === 0 ? VALID_JPEG : portraitJpeg,
      sha256: String(index).padStart(64, '0'),
    }))
    const {blob, layout} = await createBrowserWordBlob({title: '內寬驗證', alignVertical: 'top', fontSize: 14, items})
    assert.equal(layout.length, 1)
    const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml'])
    const imageCells = [...xml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]).filter((cell) => cell.includes('<w:drawing>'))
    const occupied = layout[0].slots.filter((slot) => slot.itemId !== null)
    assert.equal(imageCells.length, occupied.length)
    occupied.forEach((slot, index) => {
      const item = items.find((entry) => entry.itemId === slot.itemId)!
      if (item.layoutPreference !== 'grid-4' && item.layoutPreference !== 'grid-6') {
        assert.doesNotMatch(imageCells[index], /<w:tcMar>/)
        return
      }
      const margin = convertMillimetersToTwip(2)
      assert.match(imageCells[index], new RegExp(`<w:left\\b(?=[^>]*w:w="${margin}")(?=[^>]*w:type="dxa")[^>]*/>`))
      assert.match(imageCells[index], new RegExp(`<w:right\\b(?=[^>]*w:w="${margin}")(?=[^>]*w:type="dxa")[^>]*/>`))
      const maxWidth = (170 / (item.layoutPreference === 'grid-4' ? 2 : 3) - 4) * 96 / 25.4
      const maxHeightMm = item.layoutPreference === 'grid-4' ? 82
        : layout[0].template === 'portrait-small-6' ? 70
        : layout[0].template === 'mixed-grid2-small3' || layout[0].template === 'mixed-small3-grid2' ? 82 : 74
      const maxHeight = maxHeightMm * 96 / 25.4
      const scale = Math.min(maxWidth / item.width, maxHeight / item.height)
      const extent = imageCells[index].match(/<wp:extent cx="(\d+)" cy="(\d+)"/)
      assert.ok(extent)
      assert.deepEqual(extent.slice(1).map(Number), [Math.floor(item.width * scale), Math.floor(item.height * scale)].map((px) => px * 9525))
    })
  }
})

test('Word 左右橫式照片填滿可用內寬並保留末頁空格', async () => {
  const items = Array.from({length: 3}, (_, index) => ({
    itemId: `side-${index}`, layoutPreference: 'side-by-side-2' as LayoutPreference,
    remark: `左右備註${index}`, width: 4, height: 2, imageData: VALID_JPEG,
    sha256: String(index).padStart(64, '0'),
  }))
  const {blob, layout} = await createBrowserWordBlob({title: '左右內寬', alignVertical: 'top', fontSize: 14, items})
  assert.deepEqual(layout.map(({template}) => template), ['portrait-large-2', 'portrait-large-2'])
  const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml'])
  const imageCells = [...xml.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((m) => m[0]).filter((cell) => cell.includes('<w:drawing>'))
  assert.equal(imageCells.length, 3)
  const widthPx = Math.floor(81 * 96 / 25.4)
  const heightPx = Math.floor(81 * 96 / 25.4 / 2)
  for (const cell of imageCells) {
    const extent = cell.match(/<wp:extent cx="(\d+)" cy="(\d+)"/)
    assert.ok(extent)
    assert.deepEqual(extent.slice(1).map(Number), [widthPx, heightPx].map((px) => px * 9525))
    for (const side of ['left', 'right']) {
      assert.match(cell, new RegExp(`<w:${side}\\b(?=[^>]*w:w="${convertMillimetersToTwip(2)}")(?=[^>]*w:type="dxa")[^>]*/>`))
    }
  }
  assert.deepEqual(layout[1].slots.map(({itemId}) => itemId), ['side-2', null])
  assert.deepEqual([...xml.matchAll(/編號(\d+)/g)].map((m) => m[1]), ['01', '02', '03'])
  const tables = [...xml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((m) => m[0])
  for (const table of tables) {
    assert.deepEqual([...table.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => Number(m[1])), [85, 85].map(convertMillimetersToTwip))
    assert.deepEqual([...table.matchAll(/<w:trHeight w:val="(\d+)" w:hRule="exact"/g)].map((m) => Number(m[1])), [182, 8, 35].map(convertMillimetersToTwip))
  }
})

test('Word 六張上下混排三格等寬且上下編號保持窄欄', async () => {
  for (const stackedFirst of [true, false]) {
    for (const sixCount of [1, 2, 3]) {
      const preferences: LayoutPreference[] = stackedFirst
        ? ['stacked-2', ...Array<LayoutPreference>(sixCount).fill('grid-6'), 'side-by-side-2']
        : [...Array<LayoutPreference>(sixCount).fill('grid-6'), 'stacked-2', 'side-by-side-2']
      const items = preferences.map((layoutPreference, index) => ({
        itemId: `mixed-width-${index}`, layoutPreference, remark: `混排備註${index}\n第二行`,
        width: 4, height: 2, imageData: VALID_JPEG, sha256: String(index).padStart(64, '0'),
      }))
      const {blob, layout} = await createBrowserWordBlob({title: '六張上下欄寬', alignVertical: 'top', fontSize: 14, items})
      assert.deepEqual(layout.map(({template}) => template), [stackedFirst ? 'mixed-landscape1-small3' : 'mixed-small3-landscape1', 'portrait-large-2'])
      const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml'])
      const table = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)?.[0] ?? ''
      const columns = [...table.matchAll(/<w:gridCol w:w="(\d+)"/g)].map((m) => Number(m[1]))
      const rows = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map((m) => m[0])
      const widthsForRow = (row: string, requireExplicitWidth = false) => {
        let cursor = 0
        const widths = [...row.matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((match) => {
          const cell = match[0]
          const span = Number(cell.match(/<w:gridSpan w:val="(\d+)"/)?.[1] ?? 1)
          const width = columns.slice(cursor, cursor + span).reduce((sum, value) => sum + value, 0)
          cursor += span
          const explicit = cell.match(/<w:tcW\b[^>]*w:w="(\d+)"/)
          if (requireExplicitWidth) assert.ok(explicit, '上下編號與備註必須明示欄寬')
          if (explicit) assert.ok(Math.abs(Number(explicit[1]) - width) <= 1, '儲存格寬度不可與基準欄衝突')
          return width
        })
        assert.equal(cursor, columns.length, '每列必須使用同一份完整基準欄')
        return widths
      }
      const metadataIndex = stackedFirst ? 1 : 4
      assert.deepEqual(widthsForRow(rows[metadataIndex], true), [18, 152].map(convertMillimetersToTwip))
      const metadataCells = [...rows[metadataIndex].matchAll(/<w:tc>[\s\S]*?<\/w:tc>/g)].map((match) => match[0])
      for (const cell of metadataCells) {
        const withoutWidth = rows[metadataIndex].replace(cell, cell.replace(/<w:tcW\b[^>]*\/>/, ''))
        assert.throws(() => widthsForRow(withoutWidth, true), /上下編號與備註必須明示欄寬/)
      }
      const imageIndex = stackedFirst ? 0 : 3
      assert.equal(widthsForRow(rows[imageIndex]).length, 1)
      const gridOffset = stackedFirst ? 2 : 0
      for (const row of rows.slice(gridOffset, gridOffset + 3)) {
        const widths = widthsForRow(row)
        assert.equal(widths.length, 3)
        assert.ok(Math.max(...widths) - Math.min(...widths) <= 1, '六張的圖片、編號及備註均須三等分')
        assert.ok(widths.every((width) => Math.abs(width - convertMillimetersToTwip(170 / 3)) <= 1))
      }
      assert.deepEqual(rows.map((row) => Number(row.match(/<w:trHeight w:val="(\d+)" w:hRule="exact"/)?.[1])), (stackedFirst ? [82, 32, 76, 6, 32] : [76, 6, 32, 82, 32]).map(convertMillimetersToTwip))
      assert.ok(rows.every((row) => row.includes('<w:cantSplit/>')))
      assert.equal((table.match(/<w:drawing>/g) ?? []).length, sixCount + 1)
      assert.deepEqual([...xml.matchAll(/編號(\d+)/g)].map((m) => m[1]), items.map((_, i) => String(i + 1).padStart(2, '0')))
      assert.match(table, /第二行/)
      assert.equal((xml.match(/<w:br w:type="page"\/>/g) ?? []).length, 1)
    }
  }
})

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

test('grid-4 Word 固定兩等寬欄、上下等高並保留末頁空格與多行備註', async () => {
  const items = Array.from({length: 5}, (_, index) => ({
    itemId: `grid-${index + 1}`,
    layoutPreference: 'grid-4' as LayoutPreference,
    remark: index === 0 ? '第一行\n第二行' : `備註 ${index + 1}`,
    width: 4,
    height: 2,
    imageData: VALID_JPEG,
    sha256: String(index + 1).padStart(64, '0'),
  }))
  const result = createBrowserWordDocument({title: '四張', alignVertical: 'top', fontSize: 12, items})

  assert.deepEqual(result.layout.map(({template}) => template), ['grid-4', 'grid-4'])
  assert.deepEqual(result.layout[0].slots.map(({itemId}) => itemId), ['grid-1', 'grid-2', 'grid-3', 'grid-4'])
  assert.deepEqual(result.layout[1].slots.map(({itemId}) => itemId), ['grid-5', null, null, null])

  for (const fontSize of [10, 11, 12, 13, 14]) {
    for (const alignVertical of ['top', 'center'] as const) {
      const {blob} = await createBrowserWordBlob({title: '四張', alignVertical, fontSize, items})
      const archive = unzipSync(new Uint8Array(await blob.arrayBuffer()))
      const documentXml = strFromU8(archive['word/document.xml'])
      const tables = [...documentXml.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>/g)].map((match) => match[0])
      assert.equal(tables.length, 2)
      for (const table of tables) {
        const widths = [...table.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((match) => Number(match[1]))
        assert.deepEqual(widths, [convertMillimetersToTwip(85), convertMillimetersToTwip(85)])
        const heights = [...table.matchAll(/<w:trHeight w:val="(\d+)" w:hRule="exact"\/>/g)].map((match) => Number(match[1]))
        assert.deepEqual(heights, [84, 8, 28, 84, 8, 28].map(convertMillimetersToTwip))
        assert.ok(heights.reduce((sum, height) => sum + height, 0) < convertMillimetersToTwip(297 - 15 - 15 - 20))
        assert.equal((table.match(/<w:cantSplit\/>/g) ?? []).length, 6)
        assert.equal((table.match(/<w:tc>/g) ?? []).length, 12)
        assert.match(table, /<w:tblLayout w:type="fixed"/)
        assert.match(table, new RegExp(`<w:vAlign w:val="${alignVertical}"`))
      }
      assert.equal((documentXml.match(/<w:drawing>/g) ?? []).length, 5)
      assert.equal((documentXml.match(/<w:br w:type="page"\/>/g) ?? []).length, 1)
      assert.deepEqual([...documentXml.matchAll(/編號(\d+)/g)].map((match) => match[1]), ['01', '02', '03', '04', '05'])
      assert.match(documentXml, /第一行/)
      assert.match(documentXml, /第二行/)
      assert.match(documentXml, /<w:br\/>/)
      assert.match(documentXml, new RegExp(`<w:sz w:val="${fontSize * 2}"`))
    }
  }
})

test('四張六張 Word 兩方向半頁等高、兩格三格跨欄與留空', async () => {
  for (const fourFirst of [true, false]) {
    for (const four of [1, 2]) {
      for (const six of [1, 3]) {
        const preferences: LayoutPreference[] = fourFirst
          ? [...Array<LayoutPreference>(four).fill('grid-4'), ...Array<LayoutPreference>(six).fill('grid-6'), 'side-by-side-2']
          : [...Array<LayoutPreference>(six).fill('grid-6'), ...Array<LayoutPreference>(four).fill('grid-4'), 'side-by-side-2']
        const items = preferences.map((layoutPreference, i) => ({itemId: `item-${i}`, layoutPreference, remark: `備註${i}\n第二行`, width: 4, height: 2, imageData: VALID_JPEG, sha256: String(i).padStart(64, '0')}))
        for (const alignVertical of ['top', 'center'] as const) {
          const {blob, layout} = await createBrowserWordBlob({title: '四張六張混排', fontSize: 14, alignVertical, items})
          assert.equal(layout.length, 2)
          assert.equal(layout[0].template, fourFirst ? 'mixed-grid2-small3' : 'mixed-small3-grid2')
          const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml'])
          const table = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)?.[0] ?? ''
          const widths = [...table.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((m) => Number(m[1]))
          assert.deepEqual(widths, Array(6).fill(convertMillimetersToTwip(170 / 6)))
          assert.ok(Math.abs(widths.reduce((sum, w) => sum + w, 0) - convertMillimetersToTwip(170)) <= 3)
          const rows = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map((m) => m[0])
          const heights = rows.map((row) => Number(row.match(/<w:trHeight w:val="(\d+)" w:hRule="exact"/)?.[1]))
          assert.deepEqual(heights, [84, 8, 28, 84, 8, 28].map(convertMillimetersToTwip))
          assert.ok(heights.reduce((sum, h) => sum + h, 0) < convertMillimetersToTwip(247))
          rows.forEach((row, i) => {
            const isFour = fourFirst ? i < 3 : i >= 3
            assert.ok(row.includes('<w:cantSplit/>'))
            assert.equal((row.match(/<w:tc>/g) ?? []).length, isFour ? 2 : 3)
            assert.deepEqual([...row.matchAll(/<w:gridSpan w:val="(\d+)"/g)].map((m) => Number(m[1])), Array(isFour ? 2 : 3).fill(isFour ? 3 : 2))
          })
          assert.match(table, /<w:tblLayout w:type="fixed"/)
          assert.equal((table.match(/<w:tc>/g) ?? []).length, 15)
          assert.equal((table.match(/<w:drawing>/g) ?? []).length, four + six)
          assert.equal((xml.match(/<w:br w:type="page"\/>/g) ?? []).length, 1)
          assert.deepEqual([...xml.matchAll(/編號(\d+)/g)].map((m) => m[1]), items.map((_, i) => String(i + 1).padStart(2, '0')))
          for (const item of items) assert.ok(xml.includes(item.remark.split('\n')[0]))
          assert.match(xml, /第二行/)
          assert.match(table, new RegExp(`<w:vAlign w:val="${alignVertical}"`))
        }
      }
    }
  }
})

test('四張混排 Word 兩方向跨欄、半頁等高、留空與跨頁連號', async () => {
  for (const preferences of [
    ['stacked-2', 'grid-4', 'grid-4', 'side-by-side-2'],
    ['grid-4', 'stacked-2', 'side-by-side-2'],
    ['stacked-2', 'grid-4', 'side-by-side-2'],
    ['grid-4', 'grid-4', 'stacked-2', 'side-by-side-2'],
  ] as LayoutPreference[][]) {
    const items = preferences.map((layoutPreference, index) => ({
      itemId: `mixed-${index}`, layoutPreference, remark: `備註${index + 1}\n第二行`,
      width: 4, height: 2, imageData: VALID_JPEG, sha256: String(index + 1).padStart(64, '0'),
    }))
    for (const alignVertical of ['top', 'center'] as const) {
      const {blob, layout} = await createBrowserWordBlob({title: '四張混排', fontSize: 14, alignVertical, items})
      assert.equal(layout.length, 2)
      assert.equal(layout[0].template, preferences[0] === 'stacked-2' ? 'mixed-landscape1-grid2' : 'mixed-grid2-landscape1')
      const xml = strFromU8(unzipSync(new Uint8Array(await blob.arrayBuffer()))['word/document.xml'])
      const table = xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/)?.[0] ?? ''
      assert.deepEqual([...table.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((m) => Number(m[1])), [85, 85].map(convertMillimetersToTwip))
      const rows = [...table.matchAll(/<w:tr>[\s\S]*?<\/w:tr>/g)].map((m) => m[0])
      const heights = rows.map((row) => Number(row.match(/<w:trHeight w:val="(\d+)" w:hRule="exact"/)?.[1]))
      assert.deepEqual(heights, [84, 8, 28, 84, 8, 28].map(convertMillimetersToTwip))
      assert.ok(heights.reduce((sum, height) => sum + height, 0) < convertMillimetersToTwip(247))
      assert.ok(rows.every((row) => row.includes('<w:cantSplit/>')))
      const wideOffset = preferences[0] === 'stacked-2' ? 0 : 3
      rows.forEach((row, index) => {
        const isWide = index >= wideOffset && index < wideOffset + 3
        assert.equal((row.match(/<w:tc>/g) ?? []).length, isWide ? 1 : 2)
        assert.equal((row.match(/<w:gridSpan w:val="2"/g) ?? []).length, isWide ? 1 : 0)
      })
      assert.equal((table.match(/<w:drawing>/g) ?? []).length, items.length - 1)
      assert.equal((xml.match(/<w:br w:type="page"\/>/g) ?? []).length, 1)
      assert.deepEqual([...xml.matchAll(/編號(\d+)/g)].map((m) => m[1]), items.map((_, index) => String(index + 1).padStart(2, '0')))
      for (const item of items) assert.ok(xml.includes(item.remark.split('\n')[0]))
      assert.match(xml, /第二行/)
      assert.match(table, new RegExp(`<w:vAlign w:val="${alignVertical}"`))
    }
  }
})
