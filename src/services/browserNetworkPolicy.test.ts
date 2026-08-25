import assert from 'node:assert/strict'
import test from 'node:test'

import {VERSION_CHECK_URL, decideBrowserNetworkRequest} from './browserNetworkPolicy.ts'

const origin = 'https://intranet.example.gov.tw'

test('同源靜態 GET、blob URL 與固定版本 GET 是唯一允許範圍', () => {
  assert.deepEqual(decideBrowserNetworkRequest({url: '/assets/app.js'}, origin), {allowed: true, kind: 'static-get'})
  assert.deepEqual(decideBrowserNetworkRequest({url: 'blob:https://intranet.example.gov.tw/asset'}, origin), {allowed: true, kind: 'local-blob'})
  assert.deepEqual(decideBrowserNetworkRequest({url: VERSION_CHECK_URL, credentials: 'omit'}, origin), {allowed: true, kind: 'version-get'})
})

test('圖片、專案與輸出的 mutation 一律拒絕', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.deepEqual(
      decideBrowserNetworkRequest({url: '/api/images/import', method}, origin),
      {allowed: false, reason: 'METHOD_NOT_ALLOWED'},
    )
  }
})

test('版本 GET 不得攜帶 body、credentials 或專案 header', () => {
  assert.deepEqual(
    decideBrowserNetworkRequest({url: VERSION_CHECK_URL, body: '{}'}, origin),
    {allowed: false, reason: 'VERSION_REQUEST_NOT_MINIMAL'},
  )
  assert.deepEqual(
    decideBrowserNetworkRequest({url: VERSION_CHECK_URL, credentials: 'include'}, origin),
    {allowed: false, reason: 'VERSION_REQUEST_NOT_MINIMAL'},
  )
  assert.deepEqual(
    decideBrowserNetworkRequest({url: VERSION_CHECK_URL, headers: {'x-project-id': 'private'}}, origin),
    {allowed: false, reason: 'VERSION_REQUEST_NOT_MINIMAL'},
  )
  assert.deepEqual(
    decideBrowserNetworkRequest({url: 'https://other.example/upload'}, origin),
    {allowed: false, reason: 'ORIGIN_NOT_ALLOWED'},
  )
})
