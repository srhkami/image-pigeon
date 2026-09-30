import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import ts from 'typescript'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {createElement} from 'react'
import type {ComponentType} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import type {LayoutPreference, ProjectItemViewModel} from '../../types/project.ts'

import {buildAutoCollageLayout} from '../ImagePreview/autoCollageLayout.ts'
import {derivePrintImageReadiness} from './usePrintImageReadiness.ts'
import {formatPrintImageNumber} from './printLayout.ts'

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8')
const layoutItem = (itemId: string, layoutPreference: LayoutPreference) => ({
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

test('四張排版提供單張與批次入口，並以一致的 2x2 縮圖與列印格位呈現', () => {
  const focusSource = readSource('../ImagePreview/FocusImageCard.tsx')
  const moveCardSource = readSource('../ImagePreview/ImageCardForMove.tsx')
  const sidebarSource = readSource('../../layout/Sidebar.tsx')
  const appSource = readSource('../../App.tsx')
  const thumbnailSource = readSource('../ImagePreview/CollagePageThumbnail.tsx')
  const pageSource = readSource('./PrintablePage.tsx')
  const slotSource = readSource('./PrintableSlot.tsx')
  const css = readSource('./printPreview.css')

  assert.match(focusSource, /\['grid-4', '四張'\]/)
  assert.match(moveCardSource, /'grid-4': \{label: '四張', style: 'badge-/)
  assert.match(sidebarSource, /onBatchLayout: \(layout: LayoutPreference\) => void/)
  assert.match(sidebarSource, /onBatchLayout\('grid-4'\)[\s\S]*?>四張/)
  assert.match(sidebarSource, /grid-cols-2 gap-1/)
  assert.match(appSource, /const batchLayout = \(layout: LayoutPreference\)/)

  assert.match(thumbnailSource, /'grid-4': '4格\(2x2\)'/)
  assert.match(thumbnailSource, /role === 'grid-4-top-left'[\s\S]*?row-start-1 row-end-2 col-start-1 col-end-2/)
  assert.match(thumbnailSource, /role === 'grid-4-top-right'[\s\S]*?row-start-1 row-end-2 col-start-2 col-end-3/)
  assert.match(thumbnailSource, /role === 'grid-4-bottom-left'[\s\S]*?row-start-2 row-end-3 col-start-1 col-end-2/)
  assert.match(thumbnailSource, /role === 'grid-4-bottom-right'[\s\S]*?row-start-2 row-end-3 col-start-2 col-end-3/)
  assert.match(thumbnailSource, /template === 'grid-4'[\s\S]*?grid grid-cols-2 grid-rows-2 gap-1/)

  assert.match(pageSource, /template === 'grid-4'[\s\S]*?print-page-grid-grid-4/)
  for (const role of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
    assert.match(slotSource, new RegExp(`'grid-4-${role}': 'print-slot-grid-4-${role}'`))
  }
  assert.match(css, /\.print-page-grid-grid-4\s*{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows:\s*repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(css, /\.print-slot-grid-4-top-left\s*{[\s\S]*?grid-row:\s*1 \/ 2;[\s\S]*?grid-column:\s*1 \/ 2;/)
  assert.match(css, /\.print-slot-grid-4-top-right\s*{[\s\S]*?grid-row:\s*1 \/ 2;[\s\S]*?grid-column:\s*2 \/ 3;/)
  assert.match(css, /\.print-slot-grid-4-bottom-left\s*{[\s\S]*?grid-row:\s*2 \/ 3;[\s\S]*?grid-column:\s*1 \/ 2;/)
  assert.match(css, /\.print-slot-grid-4-bottom-right\s*{[\s\S]*?grid-row:\s*2 \/ 3;[\s\S]*?grid-column:\s*2 \/ 3;/)
})

test('四張批次按鈕的語法樹確認四個選項同屬兩欄容器且未選取時禁用', () => {
  const tree = ts.createSourceFile('Sidebar.tsx', readSource('../../layout/Sidebar.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const containers: ts.JsxElement[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'div') {
      const buttons = node.children.filter(ts.isJsxElement).filter((child) => child.openingElement.tagName.getText(tree) === 'button')
      if (buttons.some((button) => button.getText(tree).includes("onBatchLayout('grid-4')"))) containers.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.equal(containers.length, 1)
  const attributes = containers[0].openingElement.attributes.properties.filter(ts.isJsxAttribute)
  const className = attributes.find((attribute) => attribute.name.getText(tree) === 'className')?.initializer
  assert.ok(className && ts.isStringLiteral(className))
  assert.ok(className.text.split(/\s+/).includes('grid-cols-2'))
  const buttons = containers[0].children.filter(ts.isJsxElement)
  assert.equal(buttons.length, 4)
  assert.deepEqual(buttons.map((button) => button.children.filter(ts.isJsxText).map((text) => text.text.trim()).join('')), ['上下', '左右', '四張', '六張'])
  for (const button of buttons) {
    const disabled = button.openingElement.attributes.properties.filter(ts.isJsxAttribute).find((attribute) => attribute.name.getText(tree) === 'disabled')?.initializer
    assert.ok(disabled && ts.isJsxExpression(disabled) && disabled.expression)
    assert.equal(disabled.expression.getText(tree), '!hasSelection')
  }
})

function loadLayoutComponents() {
  const require = createRequire(import.meta.url)
  const loadComponent = (relativePath: string, overrides: Record<string, unknown> = {}): ComponentType<Record<string, unknown>> => {
    const output = ts.transpileModule(readSource(relativePath), {
      fileName: relativePath,
      compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
    }).outputText
    const exports: Record<string, unknown> = {}
    runInNewContext(output, {exports, require: (name: string) => Object.prototype.hasOwnProperty.call(overrides, name) ? overrides[name] : require(name)})
    return exports.default as ComponentType<Record<string, unknown>>
  }
  const PrintableSlot = loadComponent('./PrintableSlot.tsx', {'./printLayout.ts': {formatPrintImageNumber}})
  const PrintablePage = loadComponent('./PrintablePage.tsx', {'@/features/PrintPreview/PrintableSlot.tsx': {__esModule: true, default: PrintableSlot}})
  const Thumbnail = loadComponent('../ImagePreview/CollagePageThumbnail.tsx')
  return {PrintablePage, Thumbnail}
}

test('四張縮圖與列印實際元件渲染保留四格順序、末頁空格、編號、備註與旋轉', () => {
  const {PrintablePage, Thumbnail} = loadLayoutComponents()
  const ids = ['first', 'second', 'third']
  const page = buildAutoCollageLayout(ids.map((id) => layoutItem(id, 'grid-4')))[0]
  const items = new Map(ids.map((id, index) => [id, {
    itemId: id, previewUrl: `blob:${id}`, remark: `備註${index + 1}\n第二行`, rotation: index === 1 ? 90 : 0,
  } as ProjectItemViewModel]))
  const thumbnail = renderToStaticMarkup(createElement(Thumbnail, {
    page, pageIndex: 0, activeItemId: 'second', itemById: (id: string) => items.get(id), isActivePage: true, onPageActivate: () => {},
  }))
  assert.match(thumbnail, /grid-cols-2 grid-rows-2/)
  assert.deepEqual([...thumbnail.matchAll(/src="blob:([^"]+)"/g)].map((match) => match[1]), ids)
  assert.match(thumbnail, /rotate\(90deg\)/)
  assert.match(thumbnail, />空<\/span>/)
  for (const alignVertical of ['top', 'center']) {
    const printed = renderToStaticMarkup(createElement(PrintablePage, {
      page, title: '四張合成驗證', pageIndex: 0, totalPages: 1,
      slotIndexMap: Object.fromEntries(page.slots.map((slot, index) => [slot.slotId, slot.itemId ? index + 1 : null])),
      itemById: items, fontSize: '18', alignVertical, onImageLoaded: () => {}, onImageErrored: () => {},
    }))
    assert.match(printed, /print-page-grid-grid-4/)
    assert.deepEqual([...printed.matchAll(/class="[^"]*print-slot-grid-4-([^" ]+)/g)].map((match) => match[1]), ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
    assert.deepEqual([...printed.matchAll(/src="blob:([^"]+)"/g)].map((match) => match[1]), ids)
    for (const index of [1, 2, 3]) {
      assert.ok(printed.includes(formatPrintImageNumber(index)))
      assert.ok(printed.includes(`備註${index}\n第二行`))
    }
    assert.match(printed, /rotate\(90deg\)/)
    assert.match(printed, /print-slot-empty/)
  }
})

test('四張六張縮圖與列印兩方向半頁兩格三格、留空及內容', () => {
  const {PrintablePage, Thumbnail} = loadLayoutComponents()
  const css = readSource('./printPreview.css')
  for (const fourFirst of [true, false]) {
    const template = fourFirst ? 'mixed-grid2-small3' : 'mixed-small3-grid2'
    const roles = fourFirst
      ? ['grid-4-top-left', 'grid-4-top-right', 'portrait-small-4', 'portrait-small-5', 'portrait-small-6']
      : ['portrait-small-1', 'portrait-small-2', 'portrait-small-3', 'grid-4-bottom-left', 'grid-4-bottom-right']
    const ids = fourFirst ? ['four', null, 'six', null, null] : ['six', null, null, 'four', null]
    const page = {pageId: 'page-01', template, slots: roles.map((role, i) => ({role, itemId: ids[i], slotId: `slot-${i}`, order: i + 1}))}
    const items = new Map(['four', 'six'].map((id) => [id, {itemId: id, previewUrl: `blob:${id}`, remark: `備註${id}\n第二行`, rotation: id === 'four' ? 90 : 0} as ProjectItemViewModel]))
    const thumbnail = renderToStaticMarkup(createElement(Thumbnail, {
      page, pageIndex: 0, activeItemId: 'four', itemById: (id: string) => items.get(id), isActivePage: true, onPageActivate: () => {},
    }))
    assert.match(thumbnail, /grid-cols-6 grid-rows-2/)
    const classes = [...thumbnail.matchAll(/<div class="([^"]+)"/g)].map((m) => m[1]).filter((c) => c.includes('min-h-0'))
    const columns = fourFirst ? [[1, 4], [4, 7], [1, 3], [3, 5], [5, 7]] : [[1, 3], [3, 5], [5, 7], [1, 4], [4, 7]]
    const nonempty = ids.filter((id): id is string => Boolean(id))
    assert.equal(classes.length, 5)
    classes.forEach((c, i) => {
      const row = i < (fourFirst ? 2 : 3) ? 1 : 2
      assert.ok(c.includes(`row-start-${row} row-end-${row + 1}`))
      assert.ok(c.includes(`col-start-${columns[i][0]} col-end-${columns[i][1]}`))
    })
    const printed = renderToStaticMarkup(createElement(PrintablePage, {
      page, title: '四張六張混排', pageIndex: 0, totalPages: 1,
      slotIndexMap: Object.fromEntries(page.slots.map((slot) => [slot.slotId, slot.itemId ? nonempty.indexOf(slot.itemId) + 1 : null])),
      itemById: items, fontSize: '18', alignVertical: 'top', onImageLoaded: () => {}, onImageErrored: () => {},
    }))
    assert.ok(printed.includes(`print-page-grid-${template}`))
    const printedRoles = [...printed.matchAll(/class="[^"]* (print-slot-(?:grid-4-[^" ]+|grid-portrait-small-\d))/g)].map((m) => m[1])
    assert.equal(printedRoles.length, 5)
    printedRoles.forEach((role, i) => {
      const style = css.match(new RegExp(`\\.print-page-grid-${template} \\.${role}\\s*\\{([^}]+)\\}`))?.[1] ?? ''
      assert.match(style, new RegExp(`grid-column:\\s*${columns[i][0]} / ${columns[i][1]};`))
    })
    assert.match(css, new RegExp(`\\.print-page-grid-${template}[^{]*\\{[^}]*grid-template-columns:\\s*repeat\\(6, minmax\\(0, 1fr\\)\\);[^}]*grid-template-rows:\\s*repeat\\(2, minmax\\(0, 1fr\\)\\);`))
    for (const html of [thumbnail, printed]) {
      assert.deepEqual([...html.matchAll(/src="blob:([^"]+)"/g)].map((m) => m[1]), nonempty)
      assert.match(html, /rotate\(90deg\)/)
    }
    assert.equal((thumbnail.match(/>空<\/span>/g) ?? []).length, 3)
    assert.equal((printed.match(/print-slot-empty/g) ?? []).length, 3)
    for (const id of nonempty) assert.ok(printed.includes(`備註${id}\n第二行`))
    assert.ok(printed.includes(formatPrintImageNumber(1)) && printed.includes(formatPrintImageNumber(2)))
  }
})

test('四張混排縮圖與列印兩方向呈現跨兩欄半頁、留空及原有內容', () => {
  const {PrintablePage, Thumbnail} = loadLayoutComponents()
  const css = readSource('./printPreview.css')
  for (const landscapeFirst of [true, false]) {
    const template = landscapeFirst ? 'mixed-landscape1-grid2' : 'mixed-grid2-landscape1'
    const roles = landscapeFirst
      ? ['mixed-grid4-landscape-top', 'grid-4-bottom-left', 'grid-4-bottom-right']
      : ['grid-4-top-left', 'grid-4-top-right', 'mixed-grid4-landscape-bottom']
    const ids = landscapeFirst ? ['landscape', 'grid', null] : ['grid', null, 'landscape']
    const page = {pageId: 'page-01', template, slots: roles.map((role, index) => ({role, itemId: ids[index], slotId: `slot-${index}`, order: index + 1}))}
    const nonempty = ids.filter((id): id is string => Boolean(id))
    const items = new Map(nonempty.map((id, index) => [id, {
      itemId: id, previewUrl: `blob:${id}`, remark: `備註${index + 1}\n第二行`, rotation: id === 'grid' ? 90 : 0,
    } as ProjectItemViewModel]))
    const thumbnail = renderToStaticMarkup(createElement(Thumbnail, {
      page, pageIndex: 0, activeItemId: 'grid', itemById: (id: string) => items.get(id), isActivePage: true, onPageActivate: () => {},
    }))
    assert.match(thumbnail, /grid-cols-2 grid-rows-2/)
    const slotClasses = [...thumbnail.matchAll(/<div class="([^"]+)"/g)].map((m) => m[1]).filter((className) => className.includes('min-h-0'))
    assert.equal(slotClasses.length, 3)
    const wideIndex = landscapeFirst ? 0 : 2
    assert.ok(slotClasses[wideIndex].includes(landscapeFirst ? 'row-start-1 row-end-2' : 'row-start-2 row-end-3'))
    assert.ok(slotClasses[wideIndex].includes('col-start-1 col-end-3'))
    assert.deepEqual([...thumbnail.matchAll(/src="blob:([^"]+)"/g)].map((m) => m[1]), nonempty)
    assert.match(thumbnail, />空<\/span>/)
    const printed = renderToStaticMarkup(createElement(PrintablePage, {
      page, title: '四張混排', pageIndex: 0, totalPages: 1,
      slotIndexMap: Object.fromEntries(page.slots.map((slot) => [slot.slotId, slot.itemId ? nonempty.indexOf(slot.itemId) + 1 : null])),
      itemById: items, fontSize: '18', alignVertical: 'top', onImageLoaded: () => {}, onImageErrored: () => {},
    }))
    assert.ok(printed.includes(`print-page-grid-${template}`))
    const wideRole = landscapeFirst ? 'mixed-grid4-landscape-top' : 'mixed-grid4-landscape-bottom'
    assert.ok(printed.includes(`print-slot-${wideRole}`))
    assert.deepEqual([...printed.matchAll(/src="blob:([^"]+)"/g)].map((m) => m[1]), nonempty)
    assert.match(printed, /print-slot-empty/)
    assert.match(printed, /rotate\(90deg\)/)
    assert.ok(printed.includes('備註1\n第二行') && printed.includes('備註2\n第二行'))
    assert.ok(printed.includes(formatPrintImageNumber(1)) && printed.includes(formatPrintImageNumber(2)))
    const wideStyle = css.match(new RegExp(`\\.print-slot-${wideRole}\\s*\\{([^}]+)\\}`))?.[1] ?? ''
    assert.match(wideStyle, /grid-column:\s*1 \/ 3;/)
    assert.match(wideStyle, landscapeFirst ? /grid-row:\s*1 \/ 2;/ : /grid-row:\s*2 \/ 3;/)
    assert.match(css, new RegExp(`\\.print-page-grid-${template}[^{]*\\{[^}]*grid-template-columns:\\s*repeat\\(2, minmax\\(0, 1fr\\)\\);[^}]*grid-template-rows:\\s*repeat\\(2, minmax\\(0, 1fr\\)\\);`))
  }
})
