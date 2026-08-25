import assert from 'node:assert/strict'
import test from 'node:test'

import {VERSION_CHECK_URL} from './browserNetworkPolicy.ts'
import {checkBrowserVersion} from './browserVersionCheck.ts'

test('版本檢查只送固定最小 GET，並在失敗時靜默降級', async () => {
  const requests: RequestInit[] = []
  const data = await checkBrowserVersion(async (url, init) => {
    assert.equal(url, VERSION_CHECK_URL)
    requests.push(init ?? {})
    return new Response(JSON.stringify({app_version: '2.0.0', whats_new: '更新', download_link: 'https://download', updated_at: '2026-08-24'}))
  })
  assert.equal(data?.app_version, '2.0.0')
  assert.deepEqual(requests, [{method: 'GET', credentials: 'omit', signal: requests[0]?.signal}])
  assert.ok(requests[0]?.signal instanceof AbortSignal)

  assert.equal(await checkBrowserVersion(async () => { throw new Error('offline') }), null)
})

test('版本檢查拒絕格式錯誤與不安全下載網址', async () => {
  const response = (payload: unknown) => new Response(JSON.stringify(payload))

  assert.equal(await checkBrowserVersion(async () => response(null)), null)
  assert.equal(await checkBrowserVersion(async () => response({
    app_version: '2.0.0',
    whats_new: '更新',
    download_link: 'javascript:alert(1)',
    updated_at: '2026-08-24',
  })), null)
  assert.equal(await checkBrowserVersion(async () => response({
    app_version: 2,
    whats_new: '更新',
    download_link: 'https://download.example/app',
    updated_at: 'not-a-date',
  })), null)
})
