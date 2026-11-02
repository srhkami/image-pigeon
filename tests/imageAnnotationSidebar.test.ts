import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import test from 'node:test'
import {runInNewContext} from 'node:vm'
import {createElement, isValidElement, type ComponentType} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import ts from 'typescript'
import type {ImageAnnotation, MagnificationTool} from '../src/types/project.ts'

const require = createRequire(import.meta.url)
const toolbarUrl = new URL('../src/features/ImagePreview/ImageAnnotationToolbar.tsx', import.meta.url)
const panelUrl = new URL('../src/features/ImagePreview/ImageAnnotationStylePanel.tsx', import.meta.url)
const sidebarUrl = new URL('../src/layout/Sidebar.tsx', import.meta.url)
const toolLabels = ['圓形框', '矩形框', '線條', '單箭頭', '雙箭頭', '圓形放大', '矩形放大']
type ElementNode = {type: unknown; props: Record<string, unknown>}
type Props = {disabled?: boolean; selectedAnnotation?: ImageAnnotation; onUpdateAnnotation?: (annotation: ImageAnnotation) => void; onDeleteAnnotation?: () => void; magnificationTool?: MagnificationTool | null; onMagnificationToolChange?: (tool: MagnificationTool | null) => void; onClearSelection?: () => void}

function readToolbar() {
  assert.ok(existsSync(toolbarUrl), '第一階段的標記工具介面尚未建立')
  return readFileSync(toolbarUrl, 'utf8')
}

function readPanel() {
  assert.ok(existsSync(panelUrl), '尚未建立正式橫向懸浮樣式面板')
  return readFileSync(panelUrl, 'utf8')
}

function loadComponent(source: string, fileName: string, overrides: Record<string, unknown> = {}) {
  const output = ts.transpileModule(source, {
    fileName,
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText
  const exports: Record<string, unknown> = {}
  runInNewContext(output, {
    exports,
    require: (name: string) => Object.hasOwn(overrides, name) ? overrides[name]
      : name === './annotationGeometry.ts' ? require('../src/features/ImagePreview/annotationGeometry.ts') : require(name),
  })
  return exports.default as ComponentType<Props>
}

function elements(root: unknown): ElementNode[] {
  if (Array.isArray(root)) return root.flatMap(elements)
  if (!isValidElement<Record<string, unknown>>(root)) return []
  return [root, ...elements(root.props.children)]
}

function text(root: unknown): string {
  if (typeof root === 'string' || typeof root === 'number') return String(root)
  if (Array.isArray(root)) return root.map(text).join('')
  if (isValidElement<Record<string, unknown>>(root)) return text(root.props.children)
  return ''
}

// 僅隔離 React 狀態鉤子；執行實際元件與事件回呼，不啟動瀏覽器或應用程式。
function createToolbarHarness(initialDisabled = false, initialSelection?: ImageAnnotation, panel = false) {
  const values: unknown[] = []
  let cursor = 0
  let disabled = initialDisabled
  let selectedAnnotation = initialSelection
  let magnificationTool: MagnificationTool | null = null
  let deletions = 0
  const notices: Array<{message: string; id?: string}> = []
  const Toolbar = loadComponent(panel ? readPanel() : readToolbar(), panel ? 'ImageAnnotationStylePanel.tsx' : 'ImageAnnotationToolbar.tsx', {
    'react-hot-toast': {__esModule: true, default: (message: string, options: {id?: string} = {}) => notices.push({message, id: options.id})},
    react: {
      ...require('react'),
      useId: () => 'annotation-test',
      useState: (initial: unknown) => {
        const index = cursor++
        if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial
        return [values[index], (next: unknown) => {
          values[index] = typeof next === 'function' ? next(values[index]) : next
        }]
      },
    },
  }) as (props: Props) => unknown
  const render = () => {
    cursor = 0
    return Toolbar({disabled, selectedAnnotation, magnificationTool, onMagnificationToolChange: value => { magnificationTool = value },
      onClearSelection: () => { selectedAnnotation = undefined },
      onUpdateAnnotation: value => { selectedAnnotation = value }, onDeleteAnnotation: () => { deletions++ }})
  }
  const find = (label: string) => {
    const found = elements(render()).find(node => node.props['aria-label'] === label)
    assert.ok(found, `找不到控制項：${label}`)
    return found
  }
  return {
    render,
    find,
    setDisabled: (value: boolean) => { disabled = value },
    getAnnotation: () => selectedAnnotation,
    getDeletions: () => deletions,
    getNotices: () => notices,
    getMagnificationTool: () => magnificationTool,
    click: (label: string) => {
      const onClick = find(label).props.onClick as (() => void) | undefined
      assert.ok(onClick)
      onClick()
    },
    change: (label: string, value: string) => {
      const onChange = find(label).props.onChange as ((event: {target: {value: string}}) => void) | undefined
      assert.ok(onChange)
      onChange({target: {value}})
    },
  }
}

function loadSidebar() {
  const stub = (name: string) => ({__esModule: true, default: (props: Record<string, unknown>) =>
    createElement('div', {'data-component': name}, props.children as Parameters<typeof createElement>[2])})
  return loadComponent(readFileSync(sidebarUrl, 'utf8'), 'Sidebar.tsx', {
    '@/features/Output/ModalOutput.tsx': stub('output'),
    '@/features/Upload/ModalImport.tsx': stub('import'),
    '../features/Upload/OpenProject.tsx': stub('open-project'),
    '@/component': {Button: (props: Record<string, unknown>) => createElement('div', {'data-component': 'button'}, props.children as Parameters<typeof createElement>[2])},
    '@/features/ImagePreview/ImageAnnotationToolbar.tsx': {__esModule: true, default: ({disabled}: Props) =>
      createElement('div', {'data-annotation-toolbar': true, 'data-disabled': String(disabled)})},
  }) as ComponentType<Record<string, unknown>>
}

function sidebarProps(isMoveMode: boolean, itemCount = 3) {
  const noop = () => {}
  return {
    isMoveMode, itemCount, project: {items: Array.from({length: itemCount}, () => ({}))},
    selectedItemIds: new Set(), sessionId: null, pendingImportFiles: [], isImportModalOpen: false,
    setImages: noop, setProject: noop, onProjectOpened: noop, setIsMoveMode: noop,
    onSelectAll: noop, onClearSelection: noop, onBatchRotate: noop, onBatchLayout: noop,
    onRemoveSelected: noop, onPrintPreview: noop, onOpenImport: noop, onCloseImport: noop,
  }
}

test('側欄只在編輯模式接入工具並依圖片數量停用，整理模式保留四種批次排版', () => {
  const source = readFileSync(sidebarUrl, 'utf8')
  assert.match(source, /ImageAnnotationToolbar/, '側欄尚未接入新工具介面')
  const Sidebar = loadSidebar()
  const editing = renderToStaticMarkup(createElement(Sidebar, sidebarProps(false)))
  const empty = renderToStaticMarkup(createElement(Sidebar, sidebarProps(false, 0)))
  const sorting = renderToStaticMarkup(createElement(Sidebar, sidebarProps(true)))
  assert.match(editing, /data-annotation-toolbar="true" data-disabled="false"/)
  assert.match(empty, /data-annotation-toolbar="true" data-disabled="true"/)
  assert.doesNotMatch(sorting, /data-annotation-toolbar/)
  for (const label of ['全選', '取消選取', '上下', '左右', '四張', '六張', '刪除已選圖片']) assert.ok(sorting.includes(label))
  for (const html of [editing, empty, sorting]) {
    for (const control of ['open-project', 'import', 'output']) assert.ok(html.includes(`data-component="${control}"`))
  }
})

test('側欄只顯示七種工具，不再顯示樣式表單、空提示或失效說明引用', () => {
  const Toolbar = loadComponent(readToolbar(), 'ImageAnnotationToolbar.tsx')
  const html = renderToStaticMarkup(createElement(Toolbar, {disabled: false}))
  assert.deepEqual([...html.matchAll(/<button[^>]+aria-label="([^"]+)"/g)].map(match => match[1]), toolLabels)
  assert.equal([...html.matchAll(/aria-pressed="false"/g)].length, 7)
  assert.ok(html.indexOf('圖片標記') < html.indexOf('局部放大'))
  assert.ok(!html.includes('選取範圍'))
  assert.ok(!html.includes('局部放大尚未開放'))
  assert.ok(!html.includes('介面預覽，尚未啟用標記'))
  assert.ok(!html.includes('選取工具後顯示顏色設定'))
  assert.doesNotMatch(html, /type="color"|aria-describedby|刪除標記|顏色設定/)
})

test('七種工具保持單選，只以既有通知顯示指定操作提示並共用識別碼', () => {
  const harness = createToolbarHarness()
  for (const label of toolLabels) {
    harness.click(label)
    const nodes = elements(harness.render())
    const tools = nodes.filter(node => node.type === 'button' && toolLabels.includes(String(node.props['aria-label'])))
    assert.equal(tools.filter(node => node.props['aria-pressed'] === true).length, 1)
    assert.equal(harness.find(label).props['aria-pressed'], true)
    const colors = nodes.filter(node => node.type === 'input' && node.props.type === 'color')
    assert.equal(colors.length, 0, label)
    assert.ok(text(harness.render()).includes(label))
    assert.ok(!text(harness.render()).includes('選取工具後顯示顏色設定'))
  }
  for (const label of toolLabels.slice(5)) assert.equal(harness.find(label).props.disabled, false)
  const notices = harness.getNotices()
  assert.equal(notices.length, 7)
  assert.deepEqual(notices.map(notice => notice.message), toolLabels.map((_, index) => index < 5 ? '請直接拖曳到圖片上' : '請在圖片上圈選範圍'))
  assert.equal(new Set(notices.map(notice => notice.id)).size, 1)
  assert.ok(notices[0].id)
})

test('局部放大傳入紅色預設；切回基本工具取消範圍模式，停用時不啟動', () => {
  const h = createToolbarHarness()
  h.click('矩形放大')
  assert.deepEqual(JSON.parse(JSON.stringify(h.getMagnificationTool())), {kind: 'magnify-rectangle', stroke: '#ef4444'})

  assert.equal(h.find('矩形放大').props.draggable, false)
  h.click('圓形框')
  assert.equal(h.getMagnificationTool(), null)
  h.setDisabled(true)
  h.click('圓形放大')
  assert.equal(h.getMagnificationTool(), null)
})

test('點選局部工具後焦點仍在側欄時，Escape 也能取消範圍選取模式', () => {
  const h = createToolbarHarness()
  h.click('圓形放大')
  const section = elements(h.render()).find(node => node.props['aria-label'] === '圖片標記工具')!
  const handler = section.props.onKeyDown as ((event: unknown) => void) | undefined
  assert.equal(typeof handler, 'function', '側欄焦點尚未進入圖片，Escape 不能只掛在圖片上')
  handler!({key: 'Escape', preventDefault() {}, stopPropagation() {}})
  assert.equal(h.getMagnificationTool(), null)
})

test('無圖片時七種工具真正停用，不接受點選、拖曳或操作提示', () => {
  const harness = createToolbarHarness(true)
  const controls = elements(harness.render()).filter(node => node.type === 'button')
  assert.equal(controls.length, 7)
  assert.ok(controls.every(node => node.props.disabled === true))
  for (const label of toolLabels) harness.click(label)
  assert.equal(harness.getNotices().length, 0)
  let prevented = false
  const drag = harness.find('圓形框').props.onDragStart as (event: unknown) => void
  drag({preventDefault() { prevented = true }, dataTransfer: {setData() { assert.fail('停用時不得建立拖曳資料') }}})
  assert.equal(prevented, true)
})

test('新工具與顏色控制使用原生按鈕與標籤，不依賴吞掉停用及可存取屬性的共用 Button', () => {
  const harness = createToolbarHarness()
  harness.click('圓形框')
  const nodes = elements(harness.render())
  const buttons = nodes.filter(node => node.type === 'button')
  assert.ok(buttons.every(node => node.props.type === 'button' && typeof node.props['aria-label'] === 'string' && typeof node.props['aria-pressed'] === 'boolean'))
  for (const input of nodes.filter(node => node.type === 'input')) {
    assert.ok(typeof input.props.id === 'string')
    assert.ok(nodes.some(node => node.type === 'label' && node.props.htmlFor === input.props.id))
  }
  assert.doesNotMatch(readToolbar(), /@\/component|#[fF]{3,8}\b.*background/)
})

test('工具只新增內部拖曳及物件回呼，不自行接觸底圖、專案、網路或儲存', () => {
  const source = readToolbar()
  const tree = ts.createSourceFile('ImageAnnotationToolbar.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const imports = tree.statements.filter(ts.isImportDeclaration).map(node => (node.moduleSpecifier as ts.StringLiteral).text)
  assert.ok(imports.every(name => ['react', 'react-icons/lu', 'react-hot-toast', 'clsx', './annotationGeometry.ts', '@/types/project.ts'].includes(name)))
  assert.doesNotMatch(source, /setProject|setImages|assetStore|previewUrl|localStorage|sessionStorage|fetch\(|XMLHttpRequest|<canvas|<img|onDrop|toast\./)
  assert.match(source, /disabled\??:\s*boolean/)
})

test('基本工具的拖曳回呼保持內部型別及預設紅框、無填滿，側欄仍高亮選取工具', () => {
  const harness = createToolbarHarness()
  harness.click('圓形框')

  const data: Record<string, string> = {}
  const drag = harness.find('圓形框').props.onDragStart as ((event: unknown) => void) | undefined
  assert.equal(typeof drag, 'function', '工具尚未接上拖曳')
  drag!({dataTransfer: {setData: (type: string, value: string) => { data[type] = value }}, preventDefault() {}})
  assert.deepEqual(JSON.parse(data['application/x-image-pigeon-annotation']).style, {stroke: '#ef4444', fill: null})
  const mark: ImageAnnotation = {id: 'one', kind: 'ellipse', x: 0.1, y: 0.2, width: 0.4, height: 0.4, stroke: '#ef4444', fill: null}
  const selected = createToolbarHarness(false, mark)
  assert.equal(selected.find('圓形框').props['aria-pressed'], true)
  assert.equal(elements(selected.render()).some(node => node.props['aria-label'] === '刪除標記'), false)
})

const selectedBox: ImageAnnotation = {id: 'box', kind: 'ellipse', x: 0.1, y: 0.2, width: 0.4, height: 0.4, stroke: '#ef4444', fill: null}

test('正式面板只含樣式控制，不顯示物件名稱；取消最左、刪除最後及五段下拉', () => {
  const h = createToolbarHarness(false, selectedBox, true)
  const nodes = elements(h.render())
  const buttons = nodes.filter(node => node.type === 'button')
  assert.equal(buttons[0].props['aria-label'], '取消選取')
  assert.equal(buttons[buttons.length - 1].props['aria-label'], '刪除標記')
  const width = h.find('框線粗細')
  assert.equal(width.type, 'select')
  assert.equal(width.props.value, 3)
  assert.deepEqual(elements(width).filter(node => node.type === 'option').map(node => text(node.props.children)), ['極細', '細', '標準', '粗', '極粗'])
  for (const name of toolLabels) assert.ok(!text(h.render()).includes(name))
  for (const level of [1, 2, 3, 4, 5]) {
    h.change('框線粗細', String(level))
    assert.equal(h.getAnnotation()?.strokeWidthLevel, level)
  }
  h.change('框線粗細', '6')
  assert.equal(h.getAnnotation()?.strokeWidthLevel, 5)
  h.click('取消選取')
  assert.equal(h.getAnnotation(), undefined)
  assert.equal(h.getDeletions(), 0)
})

test('七種物件都有粗細，只有兩種基本框形顯示填滿選單', async () => {
  const g = await import('../src/features/ImagePreview/annotationGeometry.ts')
  const marks = (['ellipse', 'rectangle', 'line', 'arrow', 'double-arrow'] as const).map(kind => g.createAnnotation(kind, {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, kind))
  const copies = (['magnify-circle', 'magnify-rectangle'] as const).map(kind => g.createMagnification(kind, {x: 0.1, y: 0.1}, {x: 0.3, y: 0.3}, '#ef4444', kind)!)
  for (const mark of [...marks, ...copies]) {
    const h = createToolbarHarness(false, mark, true)
    assert.equal(h.find('框線粗細').type, 'select')
    assert.equal(elements(h.render()).some(node => node.props['aria-label'] === '填滿顏色選單'), mark.kind === 'ellipse' || mark.kind === 'rectangle')
  }
})

test('面板框線及填滿各有六個快速色票，自訂色彩及無填滿立即更新該物件', () => {
  const h = createToolbarHarness(false, selectedBox, true)
  h.click('框線顏色選單')
  assert.equal(elements(h.render()).filter(node => String(node.props['aria-label']).startsWith('框線顏色：')).length, 6)
  h.click('框線顏色：藍色')
  assert.equal(h.getAnnotation()?.stroke, '#3b82f6')
  h.change('框線顏色', '#123456')
  assert.equal(h.getAnnotation()?.stroke, '#123456')
  h.click('填滿顏色選單')
  assert.equal(elements(h.render()).filter(node => String(node.props['aria-label']).startsWith('填滿顏色：')).length, 6)
  h.click('填滿顏色：黃色')
  assert.equal((h.getAnnotation() as {fill: string}).fill, '#f59e0b')
  h.change('填滿顏色', '#336699')
  assert.equal((h.getAnnotation() as {fill: string}).fill, '#336699')
  h.click('無填滿')
  assert.equal((h.getAnnotation() as {fill: null}).fill, null)
  h.click('刪除標記')
  assert.equal(h.getDeletions(), 1)
})

test('面板停用時不寫樣式，方向鍵不換圖；Escape 先收色票再取消選取', () => {
  const h = createToolbarHarness(false, selectedBox, true)
  h.click('框線顏色選單')
  h.setDisabled(true)
  h.change('框線粗細', '5')
  h.change('框線顏色', '#123456')
  h.click('框線顏色：藍色')
  h.click('刪除標記')
  assert.equal(h.getAnnotation()?.stroke, '#ef4444')
  assert.equal(h.getAnnotation()?.strokeWidthLevel, undefined)
  assert.equal(h.getDeletions(), 0)
  h.setDisabled(false)
  const key = (value: string, tagName = 'BUTTON') => {
    let stopped = false, prevented = false
    const root = h.find('標記樣式')
    ;(root.props.onKeyDown as (event: unknown) => void)({key: value, target: {tagName}, stopPropagation() { stopped = true }, preventDefault() { prevented = true }})
    return {stopped, prevented}
  }
  assert.deepEqual(key('ArrowDown', 'SELECT'), {stopped: true, prevented: false})
  assert.deepEqual(key('Escape', 'SELECT'), {stopped: true, prevented: false})
  key('Escape')
  assert.ok(h.getAnnotation())
  assert.equal(h.find('框線顏色選單').props['aria-expanded'], false)
  key('Escape')
  assert.equal(h.getAnnotation(), undefined)
  assert.equal(h.getDeletions(), 0)
})

test('正式編輯區接上單一橫向面板，手勢隱藏及面板滾輪隔離有對應接點', () => {
  const focus = readFileSync(new URL('../src/features/ImagePreview/FocusImageEditor.tsx', import.meta.url), 'utf8')
  const preview = readFileSync(new URL('../src/features/ImagePreview/ImagePreview.tsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')
  assert.match(focus, /<ImageAnnotationStylePanel/)
  assert.match(focus, /annotation-style-overlay/)
  assert.match(css, /\.annotation-editor:has\(\[data-annotation-gesture=['"]true['"]\]\)[\s\S]*\.annotation-style-overlay[\s\S]*display:\s*none/)
  assert.match(preview, /closest\??\.\(['"]\[data-annotation-style-panel\]['"]\)/)
  assert.match(focus, /tagName === 'SELECT'/)
})

test('執行正式編輯區回呼，只更新目前圖片的選取物件並保留原集合防護', () => {
  const Panel = () => null
  const Focus = loadComponent(readFileSync(new URL('../src/features/ImagePreview/FocusImageEditor.tsx', import.meta.url), 'utf8'), 'FocusImageEditor.tsx', {
    react: {...require('react'), useEffect() {}, useRef: (value: unknown) => ({current: value}), useState: (value: unknown) => [value, () => {}], useMemo: (fn: () => unknown) => fn(), useCallback: (fn: unknown) => fn},
    '@/features/ImagePreview/FocusImageCard.tsx': {__esModule: true, default: () => null},
    './ImageAnnotationStylePanel.tsx': {__esModule: true, default: Panel},
    '@/features': {Intro: () => null},
  }) as unknown as (props: Record<string, unknown>) => unknown
  const sibling = {...selectedBox, id: 'sibling'}
  const annotations = [selectedBox, sibling]
  const changes: Array<{next: ImageAnnotation[]; expected: readonly ImageAnnotation[]}> = []
  const selections: Array<string | null> = []
  const editor = {scope: 'current-project-image', selectedId: selectedBox.id,
    onSelect: (id: string | null) => selections.push(id),
    onChange: (next: ImageAnnotation[], expected: readonly ImageAnnotation[]) => changes.push({next, expected})}
  const props = {viewModels: [{itemId: 'a', annotations}, {itemId: 'b', annotations: [{...selectedBox, id: 'other'}]}], activeItemId: 'a', annotationEditor: editor,
    setActiveItemId() {}, setProject() {}, setImages() {}, onRemoveItem() {}}
  const panels = elements(Focus(props)).filter(node => node.type === Panel)
  assert.equal(panels.length, 1)
  const controls = panels[0].props
  ;(controls.onUpdateAnnotation as (mark: ImageAnnotation) => void)({...selectedBox, strokeWidthLevel: 5})
  assert.equal(changes[0].expected, annotations)
  assert.equal(changes[0].next[0].strokeWidthLevel, 5)
  assert.equal(changes[0].next[1], sibling)
  ;(controls.onClearSelection as () => void)()
  assert.equal(changes.length, 1, '取消選取不得寫回物件集合')
  assert.equal(selections[0], null)
  ;(controls.onDeleteAnnotation as () => void)()
  assert.equal(changes[1].expected, annotations)
  assert.deepEqual(changes[1].next, [sibling])
  assert.equal(elements(Focus({...props, activeItemId: 'b'})).some(node => node.type === Panel), false)
  assert.equal(elements(Focus({...props, annotationEditor: undefined})).some(node => node.type === Panel), false)
})

test('側欄布局保留窄版及桌面寬度、可捲動內容與不收縮的輸出區', () => {
  const source = readFileSync(sidebarUrl, 'utf8')
  assert.match(source, /w-49[\s\S]*min-\[521px\]:w-56/)
  assert.match(source, /min-h-0[\s\S]*overflow-y-auto/)
  assert.match(source, /shrink-0[^'\n]*border-t/)
  assert.match(source, /<ModalOutput project=\{project\} setProject=\{setProject\} itemCount=\{itemCount\}/)
  const toolbar = readToolbar()
  assert.match(toolbar, /grid-cols-2/)
  assert.match(toolbar, /border-base-300/)
  assert.doesNotMatch(toolbar, /bg-white|text-black|dark:/)
})

test('可捲動容器保留整理模式批次按鈕群原有的縱向間距', () => {
  const source = readFileSync(sidebarUrl, 'utf8')
  const tree = ts.createSourceFile('Sidebar.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const containers: ts.JsxElement[] = []
  const visit = (node: ts.Node) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'div'
      && node.children.some(child => ts.isJsxExpression(child) && child.getText(tree).startsWith('{isMoveMode &&'))) {
      containers.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  assert.equal(containers.length, 1)
  const className = containers[0].openingElement.attributes.properties.filter(ts.isJsxAttribute)
    .find(attribute => attribute.name.getText(tree) === 'className')?.initializer
  assert.ok(className && ts.isStringLiteral(className))
  const classes = className.text.split(/\s+/)
  for (const token of ['flex', 'flex-col', 'gap-3', 'min-h-0', 'flex-1', 'overflow-y-auto']) {
    assert.ok(classes.includes(token), `捲動容器缺少 ${token}`)
  }
})
