import assert from 'node:assert/strict'
import test from 'node:test'

import {
  calculateContainedSize,
  calculateLongScreenSegments,
  getLongScreenSourceRow,
  isLongScreen,
  normalizeMinSize,
  normalizeQuality,
} from './browserImageProcessor.ts'

test('一般圖片依最小尺寸等比例縮小但不放大', () => {
  assert.deepEqual(calculateContainedSize(4000, 2000, 1000), {width: 2000, height: 1000})
  assert.deepEqual(calculateContainedSize(800, 600, 1000), {width: 800, height: 600})
  assert.deepEqual(calculateContainedSize(2000, 4000, 1000), {width: 1000, height: 2000})
})

test('壓縮品質只接受 50、75、90、100', () => {
  assert.equal(normalizeQuality(50), 0.5)
  assert.equal(normalizeQuality(75), 0.75)
  assert.equal(normalizeQuality(90), 0.9)
  assert.equal(normalizeQuality(100), 1)
  assert.throws(() => normalizeQuality(80))
})

test('最小尺寸只接受 500、1000、2000', () => {
  assert.equal(normalizeMinSize(500), 500)
  assert.equal(normalizeMinSize(1000), 1000)
  assert.equal(normalizeMinSize(2000), 2000)
  assert.throws(() => normalizeMinSize(1500))
})

test('長截圖判定與切割公式符合 Python 契約', () => {
  assert.equal(isLongScreen(1000, 2334), true)
  assert.equal(isLongScreen(1000, 2333), false)

  const segments = calculateLongScreenSegments(1000, 4500, 75, 1000)
  assert.equal(segments.length, 3)
  assert.deepEqual(segments.map(segment => ({
    sourceStartY: segment.sourceStartY,
    sourceEndY: segment.sourceEndY,
    destinationY: segment.destinationY,
    rawWidth: segment.rawWidth,
    rawHeight: segment.rawHeight,
    outputWidth: segment.outputWidth,
    outputHeight: segment.outputHeight,
  })), [
    {sourceStartY: 0, sourceEndY: 2120, destinationY: 0, rawWidth: 1000, rawHeight: 2120, outputWidth: 500, outputHeight: 1060},
    {sourceStartY: 1940, sourceEndY: 4060, destinationY: 0, rawWidth: 1000, rawHeight: 2120, outputWidth: 500, outputHeight: 1060},
    {sourceStartY: 3940, sourceEndY: 4500, destinationY: 0, rawWidth: 1000, rawHeight: 2120, outputWidth: 500, outputHeight: 1060},
  ])
})

test('品質 100 不 compact，且段數超限固定拒絕', () => {
  const [segment] = calculateLongScreenSegments(1000, 2500, 100, 1000)
  assert.equal(segment?.outputWidth, 1000)
  assert.equal(segment?.outputHeight, 2120)
  assert.throws(() => calculateLongScreenSegments(1, 202, 75, 1))
})

test('synthetic 色帶列映射證明重疊、順序與尾端黑色 padding', () => {
  const segments = calculateLongScreenSegments(1000, 4500, 75, 1000)
  const colorAt = (sourceRow: number | null) => sourceRow === null ? 'black' : `band-${Math.floor(sourceRow / 1000)}`

  assert.equal(colorAt(getLongScreenSourceRow(segments[0]!, 0)), 'band-0')
  assert.equal(colorAt(getLongScreenSourceRow(segments[0]!, 2000)), 'band-2')
  assert.equal(getLongScreenSourceRow(segments[0]!, 1940), getLongScreenSourceRow(segments[1]!, 0))
  assert.equal(getLongScreenSourceRow(segments[1]!, 2000), getLongScreenSourceRow(segments[2]!, 0))
  assert.equal(colorAt(getLongScreenSourceRow(segments[2]!, 559)), 'band-4')
  assert.equal(colorAt(getLongScreenSourceRow(segments[2]!, 560)), 'black')
  assert.equal(colorAt(getLongScreenSourceRow(segments[2]!, 2119)), 'black')
})
