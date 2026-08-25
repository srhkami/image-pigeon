import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  isExternalFileDrag,
  notifyOptionalProgress,
  partitionSupportedImageFiles,
  updateDragDepth,
} from '../src/features/Upload/externalImageDrop.ts'
import {SUPPORTED_IMAGE_FILE_EXTENSIONS} from '../src/features/Upload/fileAccept.ts'

const modalImportSource = readFileSync(
  new URL('../src/features/Upload/ModalImport.tsx', import.meta.url),
  'utf8',
)
const uploadMultipleSource = readFileSync(
  new URL('../src/features/Upload/UploadMultiple.tsx', import.meta.url),
  'utf8',
)
const appSource = readFileSync(
  new URL('../src/App.tsx', import.meta.url),
  'utf8',
)
const alertLoadingSource = readFileSync(
  new URL('../src/layout/AlertLoading.tsx', import.meta.url),
  'utf8',
)
const sidebarSource = readFileSync(
  new URL('../src/layout/Sidebar.tsx', import.meta.url),
  'utf8',
)

test('只有外部檔案拖曳會啟用拖放提示', () => {
  assert.equal(isExternalFileDrag(['Files']), true)
  assert.equal(isExternalFileDrag(['text/plain']), false)
  assert.equal(isExternalFileDrag(null), false)
})

test('支援副檔名不分大小寫，且混合檔案會被分割', () => {
  const files = [
    {name: '現場.JPG'},
    {name: '說明.txt'},
    {name: '影像.WebP'},
    {name: '沒有副檔名'},
  ]

  const {accepted, rejected} = partitionSupportedImageFiles(files, SUPPORTED_IMAGE_FILE_EXTENSIONS)

  assert.deepEqual(accepted.map(file => file.name), ['現場.JPG', '影像.WebP'])
  assert.deepEqual(rejected.map(file => file.name), ['說明.txt', '沒有副檔名'])
})

test('全部不支援檔案時不會產生可導入清單', () => {
  const {accepted, rejected} = partitionSupportedImageFiles(
    [{name: '文件.pdf'}, {name: '資料夾'}],
    SUPPORTED_IMAGE_FILE_EXTENSIONS,
  )

  assert.equal(accepted.length, 0)
  assert.equal(rejected.length, 2)
})

test('drag-depth 不會因子元素離開而提前變成負數', () => {
  const enteredTwice = updateDragDepth(updateDragDepth(0, 1), 1)
  const leftOnce = updateDragDepth(enteredTwice, -1)

  assert.equal(leftOnce, 1)
  assert.equal(updateDragDepth(0, -1), 0)
})

test('缺少 pywebview bridge 時安全略過進度通知', () => {
  assert.doesNotThrow(() => notifyOptionalProgress(undefined, 3))
})

test('存在 pywebview bridge 時仍會更新進度', () => {
  let progress = 0

  notifyOptionalProgress({updateProgress: value => {
    progress = value
  }}, 3)

  assert.equal(progress, 3)
})

test('導入 modal 每次開啟都以一般圖片受控頁籤開始', () => {
  assert.match(modalImportSource, /const \[activeTab, setActiveTab\] = useState<ImportTab>\('multiple'\)/)
  assert.match(modalImportSource, /if \(isShow\) \{\s*setActiveTab\('multiple'\)/)
  assert.match(modalImportSource, /checked=\{activeTab === 'multiple'\}/)
})

test('多檔導入在使用者送出後才交給純前端 adapter', () => {
  assert.match(uploadMultipleSource, /const files = selectedFiles/)
  assert.match(uploadMultipleSource, /if \(!files\.length\) \{/)
  assert.match(uploadMultipleSource, /await importGeneralImages\(\{/)
  assert.match(uploadMultipleSource, /store: browserAssetStore/)
  assert.doesNotMatch(uploadMultipleSource, /window\.pywebview|importImages\(/)
})

test('drop path 只開啟受控 modal，不直接呼叫匯入 API', () => {
  const onDropStart = appSource.indexOf('const onDrop')
  const onDropEnd = appSource.indexOf('\n\n  if (viewMode', onDropStart)
  const onDropSource = appSource.slice(onDropStart, onDropEnd)

  assert.match(onDropSource, /onOpenImport\(accepted\)/)
  assert.doesNotMatch(onDropSource, /importImages|axios|fetch\(/)
})

test('關閉 modal 時會清除拖放暫存檔案，手動選檔仍更新 selectedFiles', () => {
  assert.match(appSource, /const onCloseImport = \(\) => \{\s*setIsImportModalOpen\(false\)\s*setPendingImportFiles\(\[\]\)/)
  assert.match(appSource, /onCloseImport=\{onCloseImport\}/)
  assert.match(sidebarSource, /onHide=\{onCloseImport\}/)
  assert.match(uploadMultipleSource, /setSelectedFiles\(Array\.from\(event\.target\.files \?\? \[\]\)\)/)
})

test('loading 是誠實的本機不定進度，沒有 pywebview bridge 或虛構百分比', () => {
  assert.doesNotMatch(alertLoadingSource, /pywebview|updateProgress|<progress/)
  assert.match(alertLoadingSource, /處理中請稍後/)
})
