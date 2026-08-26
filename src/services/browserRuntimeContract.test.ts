import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BROWSER_RUNTIME_LIMITS,
  BrowserOperationError,
  assertGeneralImageBatch,
  assertLongScreenBatch,
  assertLongScreenFile,
} from './browserRuntimeContract.ts'

test('純前端 v1 資源限制使用固定 bytes 與數量', () => {
  assert.equal(BROWSER_RUNTIME_LIMITS.generalImage.maxFileBytes, 33_554_432)
  assert.equal(BROWSER_RUNTIME_LIMITS.generalImage.maxBatchFiles, 100)
  assert.equal(BROWSER_RUNTIME_LIMITS.assetStore.maxAssets, 1000)
  assert.equal(BROWSER_RUNTIME_LIMITS.assetStore.maxBytes, 209_715_200)
  assert.equal(BROWSER_RUNTIME_LIMITS.projectArchive.maxEntries, 1001)
  assert.equal(BROWSER_RUNTIME_LIMITS.projectArchive.maxAssets, 1000)
  assert.equal(BROWSER_RUNTIME_LIMITS.projectArchive.maxItems, 1000)
  assert.equal(BROWSER_RUNTIME_LIMITS.projectArchive.maxCompressedBytes, 209_715_200)
  assert.equal(BROWSER_RUNTIME_LIMITS.projectArchive.maxExpandedBytes, 209_715_200)
  assert.equal(BROWSER_RUNTIME_LIMITS.imageExport.maxImages, 1000)
  assert.equal(BROWSER_RUNTIME_LIMITS.imageExport.maxSourceBytes, 209_715_200)
  assert.equal(BROWSER_RUNTIME_LIMITS.imageExport.maxOutputBytes, 209_715_200)
  assert.equal(BROWSER_RUNTIME_LIMITS.longScreen.maxSegments, 100)
})

test('一般圖片批次超過檔數或總 bytes 時固定拒絕', () => {
  assert.throws(
    () => assertGeneralImageBatch(Array.from(
      {length: BROWSER_RUNTIME_LIMITS.generalImage.maxBatchFiles + 1},
      (_, index) => ({name: `${index}.jpg`, size: 1}),
    )),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
  )
  assert.throws(
    () => assertGeneralImageBatch([{name: 'large.jpg', size: 536_870_913}]),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
  )
})

test('長截圖檔案上限與取消使用固定錯誤碼', () => {
  assert.throws(
    () => assertLongScreenFile({name: 'long.png', size: 67_108_865}),
    (error: unknown) => error instanceof BrowserOperationError && error.code === 'RESOURCE_LIMIT_EXCEEDED',
  )
  const error = new BrowserOperationError('OPERATION_CANCELLED', '已取消')
  assert.equal(error.code, 'OPERATION_CANCELLED')
})

test('長截圖批次在解碼前受資產數量與輸入 bytes 上限約束', () => {
  assert.throws(
    () => assertLongScreenBatch(Array.from({length: 201}, (_, index) => ({name: `${index}.png`, size: 1}))),
    (error: unknown) => (error as {code?: string}).code === 'RESOURCE_LIMIT_EXCEEDED',
  )
  assert.throws(
    () => assertLongScreenBatch([{name: 'large.png', size: BROWSER_RUNTIME_LIMITS.assetStore.maxBytes + 1}]),
    (error: unknown) => (error as {code?: string}).code === 'RESOURCE_LIMIT_EXCEEDED',
  )
  assert.doesNotThrow(() => assertLongScreenBatch([{name: 'ok.png', size: 1}], 999))
})
