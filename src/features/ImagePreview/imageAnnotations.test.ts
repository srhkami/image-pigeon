import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {runInNewContext} from 'node:vm'
import {createElement, isValidElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import ts from 'typescript'
import type {AnnotationEditor, ImageAnnotation, MagnificationTool, ProjectItemViewModel} from '../../types/project.ts'
import test from 'node:test'

async function geometry() {
  assert.ok(existsSync(new URL('./annotationGeometry.ts', import.meta.url)), '尚未建立共用標記幾何與驗證')
  return import('./annotationGeometry.ts')
}

test('五段粗細保留於七種物件，標準沿用原外觀並共用預覽及箭頭幾何', async () => {
  const g = await geometry()
  const basics = (['ellipse', 'rectangle', 'line', 'arrow', 'double-arrow'] as const)
    .map(kind => g.createAnnotation(kind, {x: 0.5, y: 0.5}, {stroke: '#123456', fill: null}, 800, 400, kind))
  const copies = (['magnify-circle', 'magnify-rectangle'] as const)
    .map(kind => g.createMagnification(kind, {x: 0.1, y: 0.1}, {x: 0.4, y: 0.4}, '#123456', kind)!)
  for (const annotation of [...basics, ...copies]) {
    assert.equal(g.buildAnnotationPrimitives(annotation, 800, 400)[0].strokeWidth, 400 * 0.006)
    for (const level of [1, 2, 3, 4, 5] as const) {
      const styled = {...annotation, strokeWidthLevel: level}
      assert.deepEqual(g.validateAnnotations([styled]), [styled])
      for (const primitive of g.buildAnnotationPrimitives(styled, 800, 400)) {
        assert.ok(Math.abs(primitive.strokeWidth - 400 * 0.006 * [0.4, 0.7, 1, 1.6, 2.4][level - 1]) < 1e-10)
      }
    }
    assert.deepEqual(g.validateAnnotations([annotation]), [annotation], '舊物件不應被強行加上新欄位')
  }
})

test('粗細只接受一到五的整數，拖曳及建立副本保留合法檔位', async () => {
  const g = await geometry()
  const original = g.createAnnotation('rectangle', {x: 0.5, y: 0.5}, {stroke: '#123456', fill: null}, 800, 400, 'box')
  for (const value of [0, 6, 1.5, '3', null, NaN, Infinity]) {
    assert.throws(() => g.validateAnnotations([{...original, strokeWidthLevel: value}]))
    assert.equal(g.decodeAnnotationDrag(JSON.stringify({kind: 'rectangle', style: {stroke: '#123456', fill: null, strokeWidthLevel: value}})), null)
  }
  const style = {stroke: '#123456', fill: null, strokeWidthLevel: 4 as const}
  assert.deepEqual(g.decodeAnnotationDrag(g.encodeAnnotationDrag('ellipse', style)), {kind: 'ellipse', style})
  const created = g.createAnnotation('ellipse', {x: 0.5, y: 0.5}, style, 800, 400, 'one')
  assert.equal(created.strokeWidthLevel, 4)
  const copy = g.createMagnification('magnify-circle', {x: 0.1, y: 0.1}, {x: 0.3, y: 0.3}, '#123456', 'copy', 5)!
  assert.equal(copy.strokeWidthLevel, 5)
  assert.equal(g.moveAnnotation(created, {x: 0.01, y: 0.02}).strokeWidthLevel, 4)
  assert.equal(g.resizeAnnotation(copy, 'se', {x: 0.5, y: 0.5}).strokeWidthLevel, 5)
})

test('標記狀態依完整集合選取 version 2／3／4，不以原版本掩蓋粗細', async () => {
  const state = await import('../../state/projectState.ts')
  const g = await geometry()
  const project = state.createEmptyProject()
  project.items = [{id: 'one', type: 'image', assetId: 'asset', rotation: 0, remark: '', crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}}]
  const old = g.createAnnotation('ellipse', {x: 0.5, y: 0.5}, {stroke: '#123456', fill: null}, 800, 400, 'mark')
  const styled = {...old, strokeWidthLevel: 5 as const}
  const next = state.updateItemAnnotations(project, 'one', [styled], g.EMPTY_ANNOTATIONS)
  assert.equal(next.version, 4)
  assert.deepEqual(next.items[0].annotations, [styled])
  const legacy = state.updateItemAnnotations(next, 'one', [old], next.items[0].annotations!)
  assert.equal(legacy.version, 3)
  assert.equal(state.updateItemAnnotations(legacy, 'one', [], legacy.items[0].annotations!).version, 2)
})

test('五種標記建立於底圖比例座標；圓形初始為正圓，可自由拉成橢圓', async () => {
  const g = await geometry()
  for (const kind of ['ellipse', 'rectangle', 'line', 'arrow', 'double-arrow'] as const) {
    const annotation = g.createAnnotation(kind, {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, kind)
    assert.equal(annotation.kind, kind)
    assert.deepEqual(g.validateAnnotations([annotation]), [annotation])
  }
  const circle = g.createAnnotation('ellipse', {x: 0.5, y: 0.5}, {stroke: '#123456', fill: '#654321'}, 800, 400, 'one')
  assert.ok('width' in circle)
  assert.equal(circle.width * 800, circle.height * 400)
  const ellipse = g.resizeAnnotation(circle, 'e', {x: 0.9, y: 0.5})
  assert.ok('width' in ellipse)
  assert.equal(ellipse.height, circle.height)
  assert.notEqual(ellipse.width, circle.width)
})

test('框形八控制點、線形兩端控制點；移動與跨邊縮放不出圖片範圍', async () => {
  const g = await geometry()
  const box = g.createAnnotation('rectangle', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'one')
  assert.equal(g.annotationHandles(box).length, 8)
  const moved = g.moveAnnotation(box, {x: 5, y: -5})
  assert.ok('width' in moved)
  assert.ok(Math.abs(moved.x + moved.width - 1) < 1e-10)
  assert.equal(moved.y, 0)
  for (const handle of g.annotationHandles(box)) {
    assert.equal(g.validateAnnotations([g.resizeAnnotation(box, handle.id, {x: -2, y: 5})]).length, 1)
  }
  const arrow = g.createAnnotation('double-arrow', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'two')
  assert.equal(g.annotationHandles(arrow).length, 2)
  assert.equal(g.buildAnnotationPrimitives(arrow, 800, 400).filter(p => p.type === 'polygon').length, 2)
})

test('四向旋轉共用尺寸與座標轉換；留白不被接受為圖片座標', async () => {
  const g = await geometry()
  for (const rotation of [0, 90, 180, 270] as const) {
    const scene = g.imageScene(800, 400, rotation)
    assert.deepEqual([scene.width, scene.height], rotation % 180 ? [400, 800] : [800, 400])
    const point = {x: 0.2, y: 0.7}
    const restored = g.unrotatePoint(g.rotatePoint(point, rotation), rotation)
    assert.ok(Math.abs(restored.x - point.x) < 1e-10)
    assert.ok(Math.abs(restored.y - point.y) < 1e-10)
  }
  assert.equal(g.isImagePoint({x: -0.01, y: 0.5}), false)
  assert.equal(g.isImagePoint({x: 0.5, y: 1.01}), false)
  assert.equal(g.isImagePoint({x: 0.5, y: 0.5}), true)
})

test('驗證拒絕未知工具、重複識別、非法顏色、尺寸與非有限座標', async () => {
  const g = await geometry()
  const box = g.createAnnotation('rectangle', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'one')
  for (const value of [null, {}, [{...box, kind: 'magnify-circle'}], [box, box], [{...box, x: NaN}], [{...box, width: 0}], [{...box, height: Infinity}], [{...box, x: 1}], [{...box, stroke: 'url(evil)'}], [{...box, fill: 'red'}]]) {
    assert.throws(() => g.validateAnnotations(value))
  }
  const line = g.createAnnotation('line', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'line')
  assert.ok('x2' in line)
  assert.throws(() => g.validateAnnotations([{...line, x2: line.x1, y2: line.y1}]))
})

test('內部拖曳內容只接受五種工具與合法顏色，不接受外部圖片及局部放大', async () => {
  const g = await geometry()
  const payload = g.encodeAnnotationDrag('ellipse', {stroke: '#123456', fill: null})
  assert.deepEqual(g.decodeAnnotationDrag(payload), {kind: 'ellipse', style: {stroke: '#123456', fill: null}})
  for (const value of ['', 'file:///image.png', '{}', '{bad', JSON.stringify({kind: 'magnify-circle', style: {stroke: '#123456', fill: null}})]) {
    assert.equal(g.decodeAnnotationDrag(value), null)
  }
})

const magnification = (kind: 'magnify-circle' | 'magnify-rectangle' = 'magnify-circle') => ({
  id: 'copy', kind, stroke: '#123456', x: 0.5, y: 0.25, width: 0.5, height: 0.5,
  source: {x: 0.125, y: 0.25, width: 0.25, height: 0.25},
})

test('局部副本從選區建立等大小範圍，反向拖曳、邊界與無面積都安全處理', async () => {
  const g = await geometry()
  assert.equal(typeof g.createMagnification, 'function', '尚未提供範圍選取建立副本')
  for (const kind of ['magnify-circle', 'magnify-rectangle'] as const) {
    const copy = g.createMagnification(kind, {x: 0.375, y: 0.5}, {x: 0.125, y: 0.25}, '#123456', 'copy')
    assert.ok(copy)
    assert.deepEqual(copy.source, {x: 0.125, y: 0.25, width: 0.25, height: 0.25})
    assert.deepEqual([copy.x, copy.y, copy.width, copy.height], [0.125, 0.25, 0.25, 0.25])
    assert.deepEqual(g.validateAnnotations([copy]), [copy])
    assert.equal(g.createMagnification(kind, {x: 0.2, y: 0.2}, {x: 0.2, y: 0.8}, '#123456', 'copy'), null)
    const bounded = g.createMagnification(kind, {x: 0.5, y: 0.5}, {x: 5, y: -5}, '#123456', 'copy')!
    assert.deepEqual(bounded.source, {x: 0.5, y: 0, width: 0.5, height: 0.5})
  }
})

test('副本只有四個角落控制點；各角落縮放與移動維持來源及長寬比例', async () => {
  const g = await geometry()
  for (const kind of ['magnify-circle', 'magnify-rectangle'] as const) {
    const copy = magnification(kind)
    assert.deepEqual(g.annotationHandles(copy).map(handle => handle.id), ['nw', 'ne', 'se', 'sw'])
    for (const handle of ['nw', 'ne', 'se', 'sw'] as const) {
      for (const point of [{x: 0, y: 0}, {x: 1, y: 1}, {x: 0.8, y: 0.3}]) {
        const resized = g.resizeAnnotation(copy, handle, point)
        assert.ok('source' in resized)
        assert.deepEqual(resized.source, copy.source)
        assert.ok(Math.abs(resized.width / copy.width - resized.height / copy.height) < 1e-8)
        assert.equal(g.validateAnnotations([resized]).length, 1)
      }
    }
    assert.deepEqual(g.resizeAnnotation(copy, 'e', {x: 0.9, y: 0.2}), copy)
    const moved = g.moveAnnotation(copy, {x: -5, y: 5})
    assert.ok('source' in moved)
    assert.deepEqual(moved.source, copy.source)
    assert.deepEqual([moved.width, moved.height], [copy.width, copy.height])
    assert.equal(g.validateAnnotations([moved]).length, 1)
  }
})

test('副本嚴格驗證來源、輸出範圍與等比例，不接受額外填滿或畸形來源', async () => {
  const g = await geometry()
  const copy = magnification()
  assert.deepEqual(g.validateAnnotations([copy]), [copy])
  for (const invalid of [
    {...copy, source: undefined}, {...copy, source: {...copy.source, x: NaN}},
    {...copy, source: {...copy.source, width: 0}}, {...copy, source: {...copy.source, y: 1}},
    {...copy, source: {...copy.source, width: Infinity}}, {...copy, height: 0.3},
    {...copy, x: 0.8}, {...copy, fill: null}, {...copy, source: []},
  ]) assert.throws(() => g.validateAnnotations([invalid]))
})

test('副本共用圖元先取原圖區域再畫外框，圓形與矩形保留相同來源與像素映射', async () => {
  const g = await geometry()
  for (const kind of ['magnify-circle', 'magnify-rectangle'] as const) {
    const primitives = g.buildAnnotationPrimitives(magnification(kind), 800, 400)
    const image = primitives[0]
    assert.equal(image.type, 'image')
    assert.ok(image.type === 'image')
    assert.deepEqual([image.sourceX, image.sourceY, image.sourceWidth, image.sourceHeight], [100, 100, 200, 100])
    assert.deepEqual([image.x, image.y, image.width, image.height], [400, 100, 400, 200])
    assert.equal(primitives[1].type, kind === 'magnify-circle' ? 'ellipse' : 'rectangle')
  }
})

test('標記更新只改指定圖片；舊集合、已移除圖片及非法資料不得覆寫新狀態', async () => {
  const state = await import('../../state/projectState.ts')
  assert.equal(typeof state.updateItemAnnotations, 'function', '尚未接上標記狀態更新')
  const g = await geometry()
  const project = state.createEmptyProject()
  project.items = ['a', 'b'].map(id => ({id, type: 'image', assetId: id, rotation: 0, remark: '保留備註', crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}}))
  const mark = g.createAnnotation('ellipse', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'one')
  const next = state.updateItemAnnotations(project, 'a', [mark], g.EMPTY_ANNOTATIONS)
  assert.deepEqual(next.items[0].annotations, [mark])
  assert.equal(next.items[1], project.items[1])
  assert.equal(next.items[0].remark, '保留備註')
  assert.equal(next.version, 3)
  assert.equal(state.updateItemAnnotations(next, 'a', [], g.EMPTY_ANNOTATIONS), next)
  assert.equal(state.updateItemAnnotations(next, 'removed', [], g.EMPTY_ANNOTATIONS), next)
  assert.throws(() => state.updateItemAnnotations(next, 'a', [{...mark, stroke: 'url(x)'}], next.items[0].annotations!))
  assert.equal(state.updateItemAnnotations(next, 'a', [], next.items[0].annotations!).version, 2)
})

const require = createRequire(import.meta.url)
const layerUrl = new URL('./ImageAnnotationLayer.tsx', import.meta.url)
type LayerProps = {viewModel: ProjectItemViewModel; editor?: AnnotationEditor}
type ElementNode = {type: unknown; props: Record<string, unknown>}
function nodes(root: unknown): ElementNode[] {
  if (Array.isArray(root)) return root.flatMap(nodes)
  if (!isValidElement<Record<string, unknown>>(root)) return []
  return [root, ...nodes(root.props.children)]
}
function loadLayer(reactOverride?: unknown) {
  assert.ok(existsSync(layerUrl), '尚未建立可編輯與唯讀標記覆蓋層')
  const output = ts.transpileModule(readFileSync(layerUrl, 'utf8'), {
    fileName: 'ImageAnnotationLayer.tsx',
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
  }).outputText
  const exports: Record<string, unknown> = {}
  runInNewContext(output, {exports, crypto: globalThis.crypto, DOMPoint: class {
    x: number; y: number
    constructor(x: number, y: number) { this.x = x; this.y = y }
    matrixTransform(matrix: {apply?: (x: number, y: number) => {x: number; y: number}}) { return matrix?.apply?.(this.x, this.y) ?? {x: this.x, y: this.y} }
  }, require: (name: string) => name === 'react' && reactOverride ? reactOverride
    : name === './annotationGeometry.ts' ? require('./annotationGeometry.ts') : require(name)})
  return exports.default as (props: LayerProps) => ReturnType<typeof createElement>
}
const viewModel = (): ProjectItemViewModel => ({
  itemId: 'a', itemType: 'image', assetId: 'base', previewUrl: 'blob:base', remark: '底圖',
  rotation: 0, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}, orientation: 'landscape',
  portraitSize: 'large', layoutPreference: 'stacked-2', assetWidth: 800, assetHeight: 400,
  assetSize: 1, mime: 'image/webp', originalName: null,
  annotations: [{id: 'one', kind: 'ellipse', x: 0.2, y: 0.2, width: 0.3, height: 0.4, stroke: '#123456', fill: null}],
})

test('唯讀覆蓋層真實靜態渲染保留底圖、旋轉與標記，不包含控制點及編輯入口', () => {
  const Layer = loadLayer()
  const item = viewModel()
  item.rotation = 90; item.assetWidth = 400; item.assetHeight = 800
  const html = renderToStaticMarkup(createElement(Layer, {viewModel: item}))
  assert.match(html, /viewBox="0 0 400 800"/)
  assert.match(html, /href="blob:base"/)
  assert.match(html, /rotate\(90\)/)
  assert.match(html, /<ellipse[^>]*stroke="#123456"/)
  assert.doesNotMatch(html, /data-annotation-handle|tabindex|role="button"/)
})

// 執行真實 TSX 事件與狀態鉤子；座標矩陣及指標捕捉為隔離替身，不是瀏覽器手勢驗收。
function layerHarness(options: {tool?: MagnificationTool | null; annotations?: ImageAnnotation[]; rotation?: 0 | 90 | 180 | 270} = {}) {
  const values: unknown[] = []
  let cursor = 0
  let renderRequests = 0
  const slot = (initial: unknown) => { const index = cursor++; if (!(index in values)) values[index] = initial; return index }
  const Layer = loadLayer({...require('react'), useId: () => 'test-clip', useEffect() {},
    useRef: (initial: unknown) => { const index = slot({current: initial}); return values[index] },
    useState: (initial: unknown) => { const index = slot(initial); return [values[index], (value: unknown) => {
      const next = typeof value === 'function' ? value(values[index]) : value
      if (!Object.is(values[index], next)) renderRequests++
      values[index] = next
    }] },
  })
  let item = viewModel()
  if (options.annotations) item.annotations = options.annotations
  if (options.rotation) {
    item.rotation = options.rotation
    if (options.rotation % 180) { item.assetWidth = 400; item.assetHeight = 800 }
  }
  let tool = options.tool ?? null
  let scope = 'initial'
  let selectedId: string | null = tool ? null : 'one'
  const commits: Array<Parameters<AnnotationEditor['onChange']>> = []
  let props: LayerProps
  const svg = {focus() {}, setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture: () => true}
  const render = () => {
    cursor = 0
    props = {viewModel: item, editor: {scope: `${scope}:${item.itemId}`, selectedId, magnificationTool: tool,
      onMagnificationToolChange: value => { tool = value },
      onSelect: id => { selectedId = id; if (id) tool = null }, onChange: (...args) => { commits.push(args) }}}
    const tree = Layer(props)
    for (const node of nodes(tree)) {
      const ref = node.props.ref as {current: unknown} | undefined
      if (ref && typeof ref === 'object') ref.current = node.type === 'svg' ? svg : {getScreenCTM: () => ({inverse: () => ({
        apply: (clientX: number, clientY: number) => {
          const g = require('./annotationGeometry.ts') as typeof import('./annotationGeometry.ts')
          const point = g.unrotatePoint({x: clientX / item.assetWidth, y: clientY / item.assetHeight}, item.rotation)
          return {x: point.x * 800, y: point.y * 400}
        },
      })})}
    }
    return tree
  }
  const find = (predicate: (node: ElementNode) => boolean) => {
    const node = nodes(render()).find(predicate); assert.ok(node); return node
  }
  const event = (clientX = 400, clientY = 200) => ({clientX, clientY, pointerId: 1, button: 0, currentTarget: svg, preventDefault() {}, stopPropagation() {}})
  const call = (node: ElementNode, name: string, value: unknown) => {
    const handler = node.props[name] as ((event: unknown) => void) | undefined
    assert.equal(typeof handler, 'function', `缺少 ${name}`); handler!(value)
  }
  return {commits, event, call, render, svg: () => find(node => node.type === 'svg'),
    mark: () => find(node => node.props['data-annotation-id'] === 'one'),
    handle: (id: string) => find(node => node.props['data-annotation-handle'] === id),
    changeImage: () => { item = {...viewModel(), itemId: 'b'}; render() },
    changeScope: () => { scope = 'another-project'; render() },
    changeTool: () => { tool = null; render() },
    changeAnnotations: () => { item = {...item, annotations: [...(item.annotations ?? [])]}; render() },
    getTool: () => tool,
    getRenderRequests: () => renderRequests,
  }
}

test('真實指標回呼延至放開才提交；取消、遺失捕捉或圖片切換均丟棄草稿', () => {
  for (const cancel of ['onPointerCancel', 'onLostPointerCapture', 'switch', 'commit']) {
    const h = layerHarness()
    h.call(h.mark(), 'onPointerDown', h.event(200, 100))
    h.call(h.svg(), 'onPointerMove', h.event(300, 150))
    assert.equal(h.commits.length, 0)
    if (cancel === 'switch') h.changeImage()
    else if (cancel !== 'commit') h.call(h.svg(), cancel, h.event())
    h.call(h.svg(), 'onPointerUp', h.event(300, 150))
    assert.equal(h.commits.length, cancel === 'commit' ? 1 : 0, cancel)
    if (cancel === 'commit') {
      const result = h.commits[0][0][0]
      assert.ok('x' in result)
      assert.equal(result.x, 0.325)
      assert.equal(result.y, 0.325)
    }
  }
})

test('真實縮放及拖入回呼可建立多物件；留白與外部檔案拖曳不被接收', async () => {
  const h = layerHarness()
  h.call(h.handle('e'), 'onPointerDown', h.event(400, 160))
  h.call(h.svg(), 'onPointerUp', h.event(560, 160))
  const resized = h.commits[0][0][0]
  assert.ok('width' in resized)
  assert.ok(Math.abs(resized.width - 0.5) < 1e-10)
  assert.equal(resized.height, 0.4)
  const g = await geometry()
  const payload = g.encodeAnnotationDrag('arrow', {stroke: '#654321', fill: null})
  const drop = (x: number, types = [g.ANNOTATION_DRAG_TYPE]) => ({...h.event(x, 200), dataTransfer: {types, getData: () => payload}})
  h.call(h.svg(), 'onDrop', drop(-1))
  h.call(h.svg(), 'onDrop', drop(400, ['Files']))
  assert.equal(h.commits.length, 1)
  h.call(h.svg(), 'onDrop', drop(400))
  assert.equal(h.commits.length, 2)
  assert.equal(h.commits[1][0].length, 2)
  assert.equal(h.commits[1][0][1].kind, 'arrow')
})

test('正式接線涵蓋工具、目前圖片與四種唯讀預覽，手勢期間保護原有換圖', () => {
  const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
  for (const path of ['../../App.tsx', '../../layout/Sidebar.tsx', './ImagePreview.tsx', './FocusImageEditor.tsx', './FocusImageCard.tsx']) {
    assert.match(source(path), /annotationEditor/, `${path} 尚未接上共用標記編輯狀態`)
  }
  for (const path of ['./FocusImageCard.tsx', './ImageCardForMove.tsx', './CollagePageThumbnail.tsx', '../PrintPreview/PrintableSlot.tsx']) {
    assert.match(source(path), /<ImageAnnotationLayer/, `${path} 尚未接上標記呈現`)
  }
  assert.match(source('./ImagePreview.tsx'), /data-annotation-gesture/)
  assert.match(source('./FocusImageEditor.tsx'), /data-annotation-gesture/)
  assert.match(source('../../App.tsx'), /annotationScopeRef\.current !== annotationScope/)
})

test('其他指標的移動、放開與取消不會中止正在操作的標記', () => {
  const h = layerHarness()
  h.call(h.mark(), 'onPointerDown', h.event(200, 100))
  for (const name of ['onPointerMove', 'onPointerUp', 'onPointerCancel', 'onLostPointerCapture']) {
    h.call(h.svg(), name, {...h.event(300, 150), pointerId: 2})
  }
  h.call(h.svg(), 'onPointerUp', h.event(300, 150))
  assert.equal(h.commits.length, 1)
})

test('範圍選取放開只新增一次等大小副本；取消、換圖、同 ID 換專案、工具或集合改變不提交', () => {
  for (const action of ['commit', 'cancel', 'lost', 'image', 'scope', 'tool', 'annotations', 'escape', 'zero', 'outside']) {
    const h = layerHarness({tool: {kind: 'magnify-circle', stroke: '#123456'}})
    h.call(h.svg(), 'onPointerDown', h.event(action === 'outside' ? -1 : 100, 100))
    h.call(h.svg(), 'onPointerMove', h.event(300, 200))
    assert.equal(h.commits.length, 0)
    if (action === 'cancel') h.call(h.svg(), 'onPointerCancel', h.event())
    if (action === 'lost') h.call(h.svg(), 'onLostPointerCapture', h.event())
    if (action === 'image') h.changeImage()
    if (action === 'scope') h.changeScope()
    if (action === 'tool') h.changeTool()
    if (action === 'annotations') h.changeAnnotations()
    if (action === 'escape') h.call(h.svg(), 'onKeyDown', {...h.event(), key: 'Escape'})
    h.call(h.svg(), 'onPointerUp', h.event(300, action === 'zero' ? 100 : 200))
    h.call(h.svg(), 'onPointerUp', h.event(300, 200))
    assert.equal(h.commits.length, action === 'commit' ? 1 : 0, action)
    if (action === 'commit') {
      assert.equal(h.commits[0][0].length, 2)
      const copy = h.commits[0][0][1]
      assert.ok('source' in copy)
      assert.deepEqual(JSON.parse(JSON.stringify(copy.source)), {x: 0.125, y: 0.25, width: 0.25, height: 0.25})
      assert.deepEqual([copy.x, copy.y, copy.width, copy.height], [0.125, 0.25, 0.25, 0.25])
      assert.equal(h.getTool(), null)
    }
  }
})

test('範圍選取起手即觸發重繪並鎖住換圖，水平初移仍保留手勢，取消後立即解除', () => {
  const h = layerHarness({tool: {kind: 'magnify-circle', stroke: '#123456'}})
  const svg = h.svg()
  const before = h.getRenderRequests()
  h.call(svg, 'onPointerDown', h.event(100, 100))
  assert.ok(h.getRenderRequests() > before, '起手未改變任何 React state，手勢防護將等到有面積才生效')
  assert.equal(h.svg().props['data-annotation-gesture'], 'true')
  h.call(h.svg(), 'onPointerMove', h.event(300, 100))
  assert.equal(h.svg().props['data-annotation-gesture'], 'true')
  h.call(h.svg(), 'onPointerCancel', h.event())
  assert.equal(h.svg().props['data-annotation-gesture'], undefined)
  assert.equal(h.commits.length, 0)
})

test('範圍選取排除其他指標，四向旋轉都回到相同底圖區域', async () => {
  const g = await geometry()
  for (const rotation of [0, 90, 180, 270] as const) {
    const h = layerHarness({tool: {kind: 'magnify-rectangle', stroke: '#123456'}, rotation})
    const dimensions = rotation % 180 ? [400, 800] : [800, 400]
    const screen = (x: number, y: number) => {
      const point = g.rotatePoint({x, y}, rotation)
      return h.event(point.x * dimensions[0], point.y * dimensions[1])
    }
    h.call(h.svg(), 'onPointerDown', screen(0.125, 0.25))
    for (const name of ['onPointerMove', 'onPointerUp', 'onPointerCancel', 'onLostPointerCapture']) {
      h.call(h.svg(), name, {...screen(0.375, 0.5), pointerId: 2})
    }
    h.call(h.svg(), 'onPointerUp', screen(0.375, 0.5))
    assert.equal(h.commits.length, 1)
    const copy = h.commits[0][0][1]
    assert.ok('source' in copy)
    assert.deepEqual(JSON.parse(JSON.stringify(copy.source)), {x: 0.125, y: 0.25, width: 0.25, height: 0.25})
  }
})

test('副本 SVG 共用唯一可見原圖及載入回呼，唯讀不含選框；既有副本可以角落縮放', () => {
  const Layer = loadLayer()
  const item = {...viewModel(), annotations: [magnification(), {...magnification('magnify-rectangle'), id: 'copy-2'}]}
  const html = renderToStaticMarkup(createElement(Layer, {viewModel: item}))
  assert.equal([...html.matchAll(/<image\b/g)].length, 1)
  assert.equal([...html.matchAll(/<use\b/g)].length, 2)
  assert.match(html, /viewBox="100 100 200 100"/)
  assert.doesNotMatch(html, /data-annotation-handle|tabindex|role="button"/)
  const copy = {...magnification(), id: 'one'}
  const h = layerHarness({annotations: [copy]})
  const controls = nodes(h.render()).filter(node => node.props['data-annotation-handle'])
  assert.equal(controls.length, 4)
  h.call(h.handle('nw'), 'onPointerDown', h.event(400, 100))
  h.call(h.svg(), 'onPointerUp', h.event(300, 50))
  const resized = h.commits[0][0][0]
  assert.ok('source' in resized)
  assert.deepEqual(JSON.parse(JSON.stringify(resized.source)), copy.source)
  assert.ok(Math.abs(resized.width / copy.width - resized.height / copy.height) < 1e-8)
})

test('App 真實回呼只寫目前圖片；換圖、同 ID 換專案及旋轉後，舊回呼均失效', async () => {
  const {browserAssetStore} = await import('../../services/browserAssetStore.ts')
  const state = await import('../../state/projectState.ts')
  const g = await geometry()
  const mark = g.createAnnotation('ellipse', {x: 0.5, y: 0.5}, {stroke: '#ef4444', fill: null}, 800, 400, 'one')
  browserAssetStore.register('base', new Blob(['synthetic'], {type: 'image/webp'}))
  const project = state.createEmptyProject()
  project.assets = [{id: 'base', file: 'images/base.webp', mime: 'image/webp', width: 800, height: 400, size: 9, originalName: null}]
  project.items = ['a', 'b'].map(id => ({id, type: 'image', assetId: 'base', remark: '', rotation: 0, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}, annotations: [mark]}))
  const values: unknown[] = []
  let cursor = 0
  const slot = (initial: unknown) => { const index = cursor++; if (!(index in values)) values[index] = initial; return index }
  const react = {...require('react'), useEffect() {},
    useRef: (initial: unknown) => values[slot({current: initial})],
    useState: (initial: unknown) => { const index = slot(typeof initial === 'function' ? initial() : initial); return [values[index], (next: unknown) => { values[index] = typeof next === 'function' ? next(values[index]) : next }] },
  }
  const Sidebar = () => null, Preview = () => null
  const empty = {__esModule: true, default: () => null}
  const overrides: Record<string, unknown> = {
    react, './App.css': {}, './state/projectState.ts': state,
    '@/layout': {Nav: () => null}, '@/features': {ImagePreview: Preview}, '@/features/PrintPreview': {PrintPreviewView: () => null},
    '@/layout/Sidebar.tsx': {__esModule: true, default: Sidebar},
    '@/features/Upload/ExternalImageDropOverlay.tsx': empty,
    '@/features/ImagePreview/annotationGeometry.ts': g,
  }
  const source = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8')
  const output = ts.transpileModule(source, {fileName: 'App.tsx', compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true}}).outputText
  const exports: Record<string, unknown> = {}
  runInNewContext(output, {exports, require: (name: string) => Object.prototype.hasOwnProperty.call(overrides, name) ? overrides[name]
    : name.startsWith('@/') ? require(`../../${name.slice(2)}`) : require(name)})
  const App = exports.default as () => unknown
  const render = () => {
    cursor = 0
    const tree = nodes(App())
    const sidebar = tree.find(node => node.type === Sidebar)!.props
    const preview = tree.find(node => node.type === Preview)!.props
    return {sidebar, preview, editor: preview.annotationEditor as AnnotationEditor}
  }
  try {
    const initial = render()
    const setProject = initial.sidebar.setProject as (value: unknown) => void
    const setActive = initial.preview.setActiveItemId as (value: string) => void
    setProject(project); setActive('a')
    const first = render()
    assert.equal(typeof first.editor.onMagnificationToolChange, 'function')
    first.editor.onMagnificationToolChange!({kind: 'magnify-circle', stroke: '#123456'})
    const selecting = render()
    assert.equal(selecting.editor.magnificationTool?.kind, 'magnify-circle')
    assert.equal(selecting.sidebar.annotationEditor, selecting.editor)
    selecting.editor.onSelect(mark.id)
    assert.equal(render().editor.magnificationTool, null)
    first.editor.onChange([{...mark, stroke: '#123456', strokeWidthLevel: 5}], project.items[0].annotations!)
    const updated = render().sidebar.project as typeof project
    assert.equal(updated.items[0].annotations![0].stroke, '#123456')
    assert.equal(updated.items[0].annotations![0].strokeWidthLevel, 5)
    assert.equal(updated.version, 4)
    assert.equal(updated.items[1].annotations![0].stroke, '#ef4444')
    assert.equal(updated.items[1].annotations![0].strokeWidthLevel, undefined)
    const beforeSwitch = render()
    beforeSwitch.editor.onMagnificationToolChange!({kind: 'magnify-rectangle', stroke: '#123456'})
    setActive('b'); render()
    assert.equal(render().editor.magnificationTool, null)
    beforeSwitch.editor.onMagnificationToolChange!({kind: 'magnify-circle', stroke: '#123456'})
    assert.equal(render().editor.magnificationTool, null)
    beforeSwitch.editor.onChange([], updated.items[0].annotations!)
    assert.equal(render().sidebar.project, updated)
    const beforeOpen = render()
    ;(beforeOpen.sidebar.onProjectOpened as () => void)()
    beforeOpen.editor.onChange([], updated.items[1].annotations!)
    assert.equal(render().sidebar.project, updated)
    setActive('a')
    const beforeRotation = render()
    const rotated = state.updateItemRotation(updated, 'a', 90)
    setProject(rotated)
    beforeRotation.editor.onChange([], updated.items[0].annotations!)
    assert.equal(render().sidebar.project, rotated)
  } finally {
    browserAssetStore.delete('base')
  }
})
