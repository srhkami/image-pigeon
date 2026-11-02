import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import test from 'node:test'
import {browserJpegConverter} from './browserImageZip.ts'
import type {ImageAnnotation} from '../types/project.ts'

const annotations: ImageAnnotation[] = [
  {id: 'box', kind: 'rectangle', x: 0.1, y: 0.2, width: 0.3, height: 0.4, stroke: '#123456', fill: '#654321'},
  {id: 'circle', kind: 'ellipse', x: 0.4, y: 0.1, width: 0.4, height: 0.5, stroke: '#ef4444', fill: null},
  {id: 'arrow', kind: 'double-arrow', x1: 0.2, y1: 0.8, x2: 0.8, y2: 0.4, stroke: '#000000'},
]

test('共用合成依序畫出框形、橢圓及雙箭頭，與預覽共用幾何且裁切於底圖', async () => {
  assert.ok(existsSync(new URL('./browserAnnotationRenderer.ts', import.meta.url)), '尚未建立共用標記合成')
  const {drawAnnotations} = await import('./browserAnnotationRenderer.ts')
  const {buildAnnotationPrimitives} = await import('../features/ImagePreview/annotationGeometry.ts')
  const calls: Array<[string, ...unknown[]]> = []
  const context = new Proxy({strokeStyle: '', fillStyle: '', lineWidth: 0}, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : (...args: unknown[]) => calls.push([String(name), ...args]) },
  }) as unknown as CanvasRenderingContext2D
  drawAnnotations(context, annotations, 800, 400)
  assert.deepEqual(calls[0], ['save'])
  assert.ok(calls.some(call => call[0] === 'clip'))
  assert.ok(calls.some(call => call[0] === 'rect' && call[1] === 0 && call[3] === 800))
  const rect = buildAnnotationPrimitives(annotations[0], 800, 400)[0]
  assert.ok(rect.type === 'rectangle')
  assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(['rect', rect.x, rect.y, rect.width, rect.height])))
  assert.equal(calls.filter(call => call[0] === 'ellipse').length, 1)
  assert.equal(calls.filter(call => call[0] === 'closePath').length, 2)
  assert.deepEqual(calls[calls.length - 1], ['restore'])
})

const copies: ImageAnnotation[] = (['magnify-circle', 'magnify-rectangle'] as const).map(kind => ({
  id: kind, kind, stroke: '#123456', x: 0.5, y: 0.25, width: 0.5, height: 0.5,
  source: {x: 0.125, y: 0.25, width: 0.25, height: 0.25},
}))

test('Canvas 合成保留個別粗細，局部副本仍只取原圖且不使用預設線寬覆蓋', async () => {
  const {drawAnnotations} = await import('./browserAnnotationRenderer.ts')
  const widths: number[] = []
  const images: unknown[][] = []
  const context = new Proxy({strokeStyle: '', fillStyle: '', lineWidth: 0}, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : (...args: unknown[]) => { if (name === 'drawImage') images.push(args) } },
    set(target, name, value) { if (name === 'lineWidth') widths.push(value); Reflect.set(target, name, value); return true },
  }) as unknown as CanvasRenderingContext2D
  const bitmap = {width: 800, height: 400} as ImageBitmap
  drawAnnotations(context, [{...annotations[0], strokeWidthLevel: 1}, {...copies[0], strokeWidthLevel: 5}], 800, 400, undefined, bitmap)
  assert.equal(widths.length, 2)
  for (const [index, factor] of [0.4, 2.4].entries()) assert.ok(Math.abs(widths[index] - 400 * 0.006 * factor) < 1e-10)
  assert.equal(images.length, 1)
  assert.equal(images[0][0], bitmap)
})

test('副本合成只從原圖取樣，先裁切區域再畫外框，缺少原圖不得默默輸出', async () => {
  const {drawAnnotations} = await import('./browserAnnotationRenderer.ts')
  const bitmap = {width: 800, height: 400} as ImageBitmap
  const calls: Array<[string, ...unknown[]]> = []
  const context = new Proxy({strokeStyle: '', fillStyle: '', lineWidth: 0}, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : (...args: unknown[]) => calls.push([String(name), ...args]) },
  }) as unknown as CanvasRenderingContext2D
  drawAnnotations(context, [...annotations, ...copies], 800, 400, undefined, bitmap)
  const images = calls.filter(call => call[0] === 'drawImage')
  assert.equal(images.length, 2)
  for (const call of images) {
    assert.equal(call[1], bitmap)
    assert.deepEqual(call.slice(2), [100, 100, 200, 100, 400, 100, 400, 200])
  }
  assert.equal(calls.filter(call => call[0] === 'save').length, calls.filter(call => call[0] === 'restore').length)
  assert.throws(() => drawAnnotations(context, copies, 800, 400), /原圖/)
})

test('真正 JPEG 轉換器四向旋轉皆傳原圖 bitmap；區域繪製失敗不編碼並回收資源', async () => {
  const originalDocument = globalThis.document, originalBitmap = globalThis.createImageBitmap
  const calls: Array<[string, ...unknown[]]> = []
  let encoded = 0, closed = 0, fail = false
  const bitmap = {width: 800, height: 400, close: () => { closed++ }}
  const context = new Proxy({fillStyle: '', strokeStyle: '', lineWidth: 0}, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : (...args: unknown[]) => {
      calls.push([String(name), ...args])
      if (name === 'drawImage' && args.length === 9 && fail) throw new Error('區域取樣失敗')
    } },
  })
  const canvas = {width: 0, height: 0, getContext: () => context, toBlob: (callback: BlobCallback) => { encoded++; callback(new Blob(['jpeg'], {type: 'image/jpeg'})) }}
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {createElement: () => canvas}})
  Object.defineProperty(globalThis, 'createImageBitmap', {configurable: true, value: async () => bitmap})
  try {
    for (const rotation of [0, 90, 180, 270] as const) {
      calls.length = 0
      await browserJpegConverter.convert(new Blob(['base']), rotation, undefined, [...annotations, ...copies])
      assert.equal(calls.filter(call => call[0] === 'drawImage' && call.length === 10 && call[1] === bitmap).length, 2)
      assert.equal(calls.find(call => call[0] === 'rotate')?.[1], rotation * Math.PI / 180)
    }
    assert.equal(encoded, 4)
    fail = true
    await assert.rejects(browserJpegConverter.convert(new Blob(['base']), 90, undefined, copies), /合成失敗/)
    assert.equal(encoded, 4)
    assert.equal(closed, 5)
    assert.deepEqual([canvas.width, canvas.height], [0, 0])
  } finally {
    Object.defineProperty(globalThis, 'document', {configurable: true, value: originalDocument})
    Object.defineProperty(globalThis, 'createImageBitmap', {configurable: true, value: originalBitmap})
  }
})

test('JPEG 轉換在底圖旋轉後合成；失敗與取消都回收 Canvas 及 bitmap，不回傳缺標記產物', async () => {
  const originalDocument = globalThis.document
  const originalBitmap = globalThis.createImageBitmap
  const calls: string[] = []
  let fail = false, encoded = 0, closed = 0
  const controller = new AbortController()
  const context = new Proxy({fillStyle: '', strokeStyle: '', lineWidth: 0}, {
    get(target, name) { return name in target ? target[name as keyof typeof target] : () => {
      calls.push(String(name))
      if (name === 'stroke' && fail) throw new Error('合成失敗')
    } },
  })
  const canvas = {width: 0, height: 0, getContext: () => context,
    toBlob: (callback: BlobCallback) => { encoded++; callback(new Blob(['jpeg'], {type: 'image/jpeg'})) },
  }
  Object.defineProperty(globalThis, 'document', {configurable: true, value: {createElement: () => canvas}})
  Object.defineProperty(globalThis, 'createImageBitmap', {configurable: true, value: async () => ({width: 800, height: 400, close: () => { closed++ }})})
  try {
    await browserJpegConverter.convert(new Blob(['base']), 90, undefined, annotations)
    assert.ok(calls.includes('stroke'), 'JPEG 尚未繪製標記')
    assert.ok(calls.indexOf('drawImage') < calls.indexOf('stroke'))
    assert.ok(calls.indexOf('rotate') < calls.indexOf('drawImage'))
    assert.equal(encoded, 1)
    fail = true
    await assert.rejects(browserJpegConverter.convert(new Blob(['base']), 270, undefined, annotations))
    assert.equal(encoded, 1)
    assert.equal(closed, 2)
    assert.deepEqual([canvas.width, canvas.height], [0, 0])
    controller.abort()
    await assert.rejects(browserJpegConverter.convert(new Blob(['base']), 0, controller.signal, annotations))
    assert.equal(encoded, 1)
  } finally {
    Object.defineProperty(globalThis, 'document', {configurable: true, value: originalDocument})
    Object.defineProperty(globalThis, 'createImageBitmap', {configurable: true, value: originalBitmap})
  }
})
