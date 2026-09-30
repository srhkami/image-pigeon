import {
  AlignmentType,
  convertMillimetersToTwip,
  Document,
  Header,
  HeightRule,
  ImageRun,
  Packer,
  PageBreak,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import {buildAutoCollageLayout, type AutoCollagePage} from '../features/ImagePreview/autoCollageLayout.ts'
import type {LayoutPreference} from '../types/project.ts'
import {BROWSER_RUNTIME_LIMITS} from './browserRuntimeContract.ts'

export const WORD_MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const WORD_MAX_TOTAL_BYTES = 80 * 1024 * 1024
export const WORD_MAX_ITEM_COUNT = BROWSER_RUNTIME_LIMITS.assetStore.maxAssets

export type BrowserWordExportErrorCode =
  | 'IMAGE_TOO_LARGE'
  | 'TOTAL_TOO_LARGE'
  | 'TOO_MANY_ITEMS'
  | 'EMPTY_EXPORT'
  | 'MISSING_IMAGE'

export class BrowserWordExportError extends Error {
  readonly code: BrowserWordExportErrorCode

  constructor(code: BrowserWordExportErrorCode, message: string) {
    super(message)
    this.name = 'BrowserWordExportError'
    this.code = code
  }
}

export type BrowserWordItem = {
  itemId: string
  layoutPreference: LayoutPreference
  remark: string
  /** 已套用旋轉的 JPEG 顯示寬度，必須與 imageData 一致。 */
  width: number
  /** 已套用旋轉的 JPEG 顯示高度，必須與 imageData 一致。 */
  height: number
  /** 已完成旋轉與 JPEG 編碼的圖片；exporter 不接受待旋轉的原始圖片。 */
  imageData: Uint8Array
  sha256: string
}

export type BrowserWordDocumentOptions = {
  title: string
  alignVertical: 'top' | 'center'
  fontSize: number
  items: readonly BrowserWordItem[]
}

const CM_TO_PX = 96 / 2.54
const TABLE_WIDTH_MM = 170
const GRID_IMAGE_INSET_MM = 2
const GRID4_IMAGE_WIDTH_MM = TABLE_WIDTH_MM / 2 - GRID_IMAGE_INSET_MM * 2
const GRID6_IMAGE_WIDTH_MM = TABLE_WIDTH_MM / 3 - GRID_IMAGE_INSET_MM * 2
const cellWidth = (millimeters: number) => ({size: convertMillimetersToTwip(millimeters), type: WidthType.DXA})
const rowHeight = (millimeters: number) => ({value: convertMillimetersToTwip(millimeters), rule: HeightRule.EXACT})
const blankParagraph = () => new Paragraph({children: []})

function textChildren(text: string, size: number): TextRun[] {
  return text.split('\n').map((line, index) => new TextRun({text: line, size: size * 2, break: index === 0 ? undefined : 1}))
}

function fitImage(width: number, height: number, maxWidthMm: number, maxHeightMm: number) {
  const maxWidth = maxWidthMm * CM_TO_PX / 10
  const maxHeight = maxHeightMm * CM_TO_PX / 10
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  }
}

type CellContext = {
  readonly byId: ReadonlyMap<string, BrowserWordItem>
  readonly numberById: ReadonlyMap<string, number>
  readonly alignVertical: 'top' | 'center'
  readonly fontSize: number
}

function imageCell(context: CellContext, itemId: string | null, maxWidthMm: number, maxHeightMm: number, columnSpan?: number, horizontalInsetMm?: number) {
  const item = itemId ? context.byId.get(itemId) : undefined
  const children = item
    ? [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({
          type: 'jpg',
          data: item.imageData,
          transformation: fitImage(item.width, item.height, maxWidthMm, maxHeightMm),
          altText: {title: item.itemId, description: item.remark || item.itemId, name: item.itemId},
        })],
      })]
    : [blankParagraph()]
  return new TableCell({
    children, columnSpan, verticalAlign: VerticalAlign.CENTER,
    margins: horizontalInsetMm === undefined ? undefined : {
      marginUnitType: WidthType.DXA,
      left: convertMillimetersToTwip(horizontalInsetMm),
      right: convertMillimetersToTwip(horizontalInsetMm),
    },
  })
}

function numberCell(context: CellContext, itemId: string | null, widthMm?: number, columnSpan?: number) {
  const number = itemId ? context.numberById.get(itemId) : undefined
  return new TableCell({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: number ? [new TextRun({text: `編號${String(number).padStart(2, '0')}`, size: context.fontSize * 2})] : [],
    })],
    verticalAlign: VerticalAlign.CENTER,
    width: widthMm ? cellWidth(widthMm) : undefined,
    columnSpan,
  })
}

function remarkCell(context: CellContext, itemId: string | null, widthMm?: number, columnSpan?: number) {
  const item = itemId ? context.byId.get(itemId) : undefined
  return new TableCell({
    children: [new Paragraph({children: item ? textChildren(item.remark, context.fontSize) : []})],
    columnSpan,
    verticalAlign: context.alignVertical === 'top' ? VerticalAlign.TOP : VerticalAlign.CENTER,
    width: widthMm ? cellWidth(widthMm) : undefined,
  })
}

function exactRow(children: TableCell[], heightMm: number) {
  return new TableRow({children, height: rowHeight(heightMm), cantSplit: true})
}

function slotId(page: AutoCollagePage, index: number) {
  return page.slots[index]?.itemId ?? null
}

function landscapeTable(page: AutoCollagePage, context: CellContext) {
  const first = slotId(page, 0)
  const second = slotId(page, 1)
  return new Table({
    rows: [
      exactRow([imageCell(context, first, 150, 90, 2)], 90),
      exactRow([numberCell(context, first, 18), remarkCell(context, first, 152)], 20),
      exactRow([imageCell(context, second, 150, 90, 2)], 90),
      exactRow([numberCell(context, second, 18), remarkCell(context, second, 152)], 20),
    ],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: [convertMillimetersToTwip(18), convertMillimetersToTwip(152)],
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function portraitLargeTable(page: AutoCollagePage, context: CellContext) {
  const first = slotId(page, 0)
  const second = slotId(page, 1)
  return new Table({
    rows: [
      exactRow([imageCell(context, first, GRID4_IMAGE_WIDTH_MM, 180, undefined, GRID_IMAGE_INSET_MM), imageCell(context, second, GRID4_IMAGE_WIDTH_MM, 180, undefined, GRID_IMAGE_INSET_MM)], 182),
      exactRow([numberCell(context, first), numberCell(context, second)], 8),
      exactRow([remarkCell(context, first), remarkCell(context, second)], 35),
    ],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: [convertMillimetersToTwip(85), convertMillimetersToTwip(85)],
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function gridRows(page: AutoCollagePage, context: CellContext, offset: number) {
  const ids = [0, 1, 2].map((index) => slotId(page, offset + index))
  return [
    exactRow(ids.map((id) => imageCell(context, id, GRID6_IMAGE_WIDTH_MM, 70, undefined, GRID_IMAGE_INSET_MM)), 72),
    exactRow(ids.map((id) => numberCell(context, id)), 6),
    exactRow(ids.map((id) => remarkCell(context, id)), 32),
  ]
}

function portraitSmallTable(page: AutoCollagePage, context: CellContext) {
  return new Table({
    rows: [...gridRows(page, context, 0), ...gridRows(page, context, 3)],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: Array.from({length: 3}, () => convertMillimetersToTwip(TABLE_WIDTH_MM / 3)),
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function grid4Rows(page: AutoCollagePage, context: CellContext, offset: number) {
  const ids = [0, 1].map((index) => slotId(page, offset + index))
  return [
    exactRow(ids.map((id) => imageCell(context, id, GRID4_IMAGE_WIDTH_MM, 82, undefined, GRID_IMAGE_INSET_MM)), 84),
    exactRow(ids.map((id) => numberCell(context, id)), 8),
    exactRow(ids.map((id) => remarkCell(context, id)), 28),
  ]
}

function grid4Table(page: AutoCollagePage, context: CellContext) {
  return new Table({
    rows: [...grid4Rows(page, context, 0), ...grid4Rows(page, context, 2)],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: Array.from({length: 2}, () => convertMillimetersToTwip(TABLE_WIDTH_MM / 2)),
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function mixedGrid4Table(page: AutoCollagePage, context: CellContext, landscapeFirst: boolean) {
  const landscape = slotId(page, landscapeFirst ? 0 : 2)
  const landscapeRows = [
    exactRow([imageCell(context, landscape, 150, 82, 2)], 84),
    exactRow([numberCell(context, landscape, undefined, 2)], 8),
    exactRow([remarkCell(context, landscape, undefined, 2)], 28),
  ]
  const pairRows = grid4Rows(page, context, landscapeFirst ? 1 : 0)
  return new Table({
    rows: landscapeFirst ? [...landscapeRows, ...pairRows] : [...pairRows, ...landscapeRows],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: [convertMillimetersToTwip(85), convertMillimetersToTwip(85)],
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function mixedGridPairTable(page: AutoCollagePage, context: CellContext, fourFirst: boolean) {
  const halfRows = (offset: number, count: number, span: number, imageWidth: number) => {
    const ids = Array.from({length: count}, (_, i) => slotId(page, offset + i))
    return [
      exactRow(ids.map((id) => imageCell(context, id, imageWidth, 82, span, GRID_IMAGE_INSET_MM)), 84),
      exactRow(ids.map((id) => numberCell(context, id, undefined, span)), 8),
      exactRow(ids.map((id) => remarkCell(context, id, undefined, span)), 28),
    ]
  }
  const fourRows = halfRows(fourFirst ? 0 : 3, 2, 3, GRID4_IMAGE_WIDTH_MM)
  const sixRows = halfRows(fourFirst ? 2 : 0, 3, 2, GRID6_IMAGE_WIDTH_MM)
  return new Table({
    rows: fourFirst ? [...fourRows, ...sixRows] : [...sixRows, ...fourRows],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: Array.from({length: 6}, () => convertMillimetersToTwip(TABLE_WIDTH_MM / 6)),
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function mixedStackedGridColumns() {
  const width = convertMillimetersToTwip(TABLE_WIDTH_MM)
  const third = convertMillimetersToTwip(TABLE_WIDTH_MM / 3)
  const number = convertMillimetersToTwip(18)
  // 拆開第一個三等分格位，讓上下的編號窄欄與六張共用同一份基準欄。
  return [number, third - number, third, width - third * 2]
}

function mixedSmallRows(page: AutoCollagePage, context: CellContext, offset: number) {
  const ids = [0, 1, 2].map((index) => slotId(page, offset + index))
  const span = (index: number) => index === 0 ? 2 : 1
  return [
    exactRow(ids.map((id, index) => imageCell(context, id, GRID6_IMAGE_WIDTH_MM, 74, span(index), GRID_IMAGE_INSET_MM)), 76),
    exactRow(ids.map((id, index) => numberCell(context, id, undefined, span(index))), 6),
    exactRow(ids.map((id, index) => remarkCell(context, id, undefined, span(index))), 32),
  ]
}

function mixedLandscapeFirstTable(page: AutoCollagePage, context: CellContext) {
  const landscape = slotId(page, 0)
  return new Table({
    rows: [
      exactRow([imageCell(context, landscape, 150, 80, 4)], 82),
      exactRow([numberCell(context, landscape, 18), remarkCell(context, landscape, 152, 3)], 32),
      ...mixedSmallRows(page, context, 1),
    ],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: mixedStackedGridColumns(),
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function mixedLandscapeLastTable(page: AutoCollagePage, context: CellContext) {
  const landscape = slotId(page, 3)
  return new Table({
    rows: [
      ...mixedSmallRows(page, context, 0),
      exactRow([imageCell(context, landscape, 150, 80, 4)], 82),
      exactRow([numberCell(context, landscape, 18), remarkCell(context, landscape, 152, 3)], 32),
    ],
    width: cellWidth(TABLE_WIDTH_MM),
    columnWidths: mixedStackedGridColumns(),
    layout: TableLayoutType.FIXED,
    style: 'TableGrid',
  })
}

function tableForPage(page: AutoCollagePage, context: CellContext) {
  switch (page.template) {
    case 'landscape-2': return landscapeTable(page, context)
    case 'portrait-large-2': return portraitLargeTable(page, context)
    case 'portrait-small-6': return portraitSmallTable(page, context)
    case 'grid-4': return grid4Table(page, context)
    case 'mixed-landscape1-grid2': return mixedGrid4Table(page, context, true)
    case 'mixed-grid2-landscape1': return mixedGrid4Table(page, context, false)
    case 'mixed-grid2-small3': return mixedGridPairTable(page, context, true)
    case 'mixed-small3-grid2': return mixedGridPairTable(page, context, false)
    case 'mixed-landscape1-small3': return mixedLandscapeFirstTable(page, context)
    case 'mixed-small3-landscape1': return mixedLandscapeLastTable(page, context)
    default: throw new Error(`不支援的 Word 排版模板：${page.template}`)
  }
}

function assertResourceBounds(items: readonly BrowserWordItem[]) {
  if (items.length === 0) throw new BrowserWordExportError('EMPTY_EXPORT', '沒有可輸出的圖片')
  if (items.length > WORD_MAX_ITEM_COUNT) {
    throw new BrowserWordExportError('TOO_MANY_ITEMS', `圖片數量超過 ${WORD_MAX_ITEM_COUNT} 張上限`)
  }
  let total = 0
  for (const item of items) {
    if (item.imageData.byteLength > WORD_MAX_IMAGE_BYTES) {
      throw new BrowserWordExportError('IMAGE_TOO_LARGE', `圖片 ${item.itemId} 超過 8 MiB 上限`)
    }
    total += item.imageData.byteLength
    if (total > WORD_MAX_TOTAL_BYTES) {
      throw new BrowserWordExportError('TOTAL_TOO_LARGE', '圖片總量超過 80 MiB 上限')
    }
  }
}

export function createBrowserWordDocument(options: BrowserWordDocumentOptions) {
  assertResourceBounds(options.items)
  const layout = buildAutoCollageLayout(options.items)
  const byId = new Map(options.items.map((item) => [item.itemId, item]))
  const numberById = new Map(options.items.map((item, index) => [item.itemId, index + 1]))
  const context: CellContext = {byId, numberById, alignVertical: options.alignVertical, fontSize: options.fontSize}
  const children = layout.flatMap((page, index) => [
    tableForPage(page, context),
    ...(index < layout.length - 1 ? [new Paragraph({children: [new PageBreak()]})] : []),
  ])
  const document = new Document({
    styles: {
      default: {
        document: {run: {font: '標楷體', size: options.fontSize * 2, color: '000000'}},
      },
    },
    sections: [{
      properties: {
        page: {
          size: {
            width: convertMillimetersToTwip(210),
            height: convertMillimetersToTwip(297),
            orientation: PageOrientation.PORTRAIT,
          },
          margin: {
            top: convertMillimetersToTwip(15),
            right: convertMillimetersToTwip(20),
            bottom: convertMillimetersToTwip(15),
            left: convertMillimetersToTwip(20),
            header: convertMillimetersToTwip(5),
          },
        },
      },
      headers: {
        default: new Header({children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({text: options.title, bold: true, size: 40})],
        })]}),
      },
      children,
    }],
  })
  return {document, layout, imageCount: options.items.length}
}

export async function createBrowserWordBlob(options: BrowserWordDocumentOptions) {
  const {document, layout, imageCount} = createBrowserWordDocument(options)
  const blob = await Packer.toBlob(document)
  return {blob, layout, imageCount}
}
