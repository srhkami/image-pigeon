import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {buildAutoCollageLayout} from '../ImagePreview/autoCollageLayout.ts'
import {derivePrintImageReadiness} from './usePrintImageReadiness.ts'

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const layoutItem = (itemId: string, layoutPreference: 'stacked-2' | 'side-by-side-2' | 'grid-6') => ({
  itemId,
  layoutPreference,
})

test('圖片狀態尚未回報時不可列印，載入失敗完成後可列印並回報警告數', () => {
  const loading = derivePrintImageReadiness(['item-1', 'item-2'], {'item-1': 'loaded'})
  assert.deepEqual(loading, {
    totalImages: 2,
    loadedImages: 1,
    erroredImages: 0,
    isReady: false,
  })

  const settled = derivePrintImageReadiness(
    ['item-1', 'item-2'],
    {'item-1': 'loaded', 'item-2': 'error'},
  )
  assert.deepEqual(settled, {
    totalImages: 2,
    loadedImages: 1,
    erroredImages: 1,
    isReady: true,
  })
})

test('列印預覽不依賴後端 session 並明確說明系統列印另存 PDF 邊界', () => {
  const appSource = readSource('../../App.tsx')
  const modalSource = readSource('../Output/ModalOutput.tsx')
  const outputSource = readSource('../Output/PrintPreviewOutput.tsx')
  const viewSource = readSource('./PrintPreviewView.tsx')
  const documentSource = readSource('./PrintableDocument.tsx')
  const outputUsage = modalSource.match(/<PrintPreviewOutput[\s\S]*?\/>/)?.[0] ?? ''
  const viewUsage = appSource.match(/<PrintPreviewView[\s\S]*?\/>/)?.[0] ?? ''

  assert.doesNotMatch(outputSource, /readonly sessionId:/)
  assert.doesNotMatch(outputSource, /!sessionId/)
  assert.notEqual(outputUsage, '')
  assert.notEqual(viewUsage, '')
  assert.doesNotMatch(outputUsage, /sessionId=/)
  assert.doesNotMatch(viewUsage, /sessionId=/)
  assert.doesNotMatch(viewSource, /readonly sessionId:/)
  assert.doesNotMatch(documentSource, /readonly sessionId:/)
  assert.match(outputSource, /可透過系統列印對話框另存 PDF/)
  assert.match(outputSource, /無法控制儲存路徑或繞過機關列印政策/)
})

test('列印圖片來源由瀏覽器資產儲存區提供 object URL', () => {
  const stateSource = readSource('../../state/projectState.ts')
  const slotSource = readSource('./PrintableSlot.tsx')

  assert.match(stateSource, /previewUrl: browserAssetStore\.getUrl\(asset\.id\)/)
  assert.match(slotSource, /src=\{item\.previewUrl\}/)
  assert.doesNotMatch(slotSource, /requestJson|\/api\/|window\.pywebview/)
})

test('列印維持五種既有自動排版模板', () => {
  const templates = [
    buildAutoCollageLayout([
      layoutItem('a1', 'stacked-2'),
      layoutItem('a2', 'stacked-2'),
    ])[0]?.template,
    buildAutoCollageLayout([
      layoutItem('b1', 'side-by-side-2'),
      layoutItem('b2', 'side-by-side-2'),
    ])[0]?.template,
    buildAutoCollageLayout(Array.from({length: 6}, (_, index) => layoutItem(`c${index}`, 'grid-6')))[0]?.template,
    buildAutoCollageLayout([
      layoutItem('d1', 'stacked-2'),
      ...Array.from({length: 3}, (_, index) => layoutItem(`d${index + 2}`, 'grid-6')),
    ])[0]?.template,
    buildAutoCollageLayout([
      ...Array.from({length: 3}, (_, index) => layoutItem(`e${index + 1}`, 'grid-6')),
      layoutItem('e4', 'stacked-2'),
    ])[0]?.template,
  ]

  assert.deepEqual(templates, [
    'landscape-2',
    'portrait-large-2',
    'portrait-small-6',
    'mixed-landscape1-small3',
    'mixed-small3-landscape1',
  ])
})

test('列印樣式固定 A4 直式、頁面尺寸、分頁與備註換行', () => {
  const css = readSource('./printPreview.css')

  assert.match(css, /@media print/)
  assert.match(css, /@page\s*{[\s\S]*?size:\s*A4 portrait;/)
  assert.match(css, /\.print-page\s*{[\s\S]*?width:\s*210mm;[\s\S]*?height:\s*297mm;/)
  assert.match(css, /page-break-inside:\s*avoid;/)
  assert.match(css, /\.print-slot-remark-text\s*{[\s\S]*?white-space:\s*pre-wrap;/)
})
