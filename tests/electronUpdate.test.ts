import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {EventEmitter} from 'node:events'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import test from 'node:test'
import {createDesktopUpdateService, type DesktopUpdateBridge, type DesktopUpdateResult} from '../src/services/desktopUpdate.ts'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const require = createRequire(import.meta.url)
const endpoint = 'https://api.pigeonhand.tw/web/apps/1/'
const payload = {app_version: '3.3.0', whats_new: '新增功能\n修正問題', updated_at: '2026-09-30T08:00:00Z', download_link: 'https://evil.example/not-opened'}

function transport({body = JSON.stringify(payload), status = 200, mode = 'ok'} = {}) {
  const calls: Array<{url: string, options: Record<string, unknown>}> = []
  let destroyed = false
  const get = (url: string, options: Record<string, unknown>, callback: (response: EventEmitter & {statusCode: number, resume: () => void}) => void) => {
    calls.push({url, options})
    const request = new EventEmitter() as EventEmitter & {destroy: () => void}
    request.destroy = () => { destroyed = true }
    queueMicrotask(() => {
      if (mode === 'timeout') return
      if (mode === 'error') { request.emit('error', new Error('離線')); return }
      const response = Object.assign(new EventEmitter(), {statusCode: status, resume() {}})
      callback(response)
      if (mode === 'body-timeout') return
      if (mode === 'aborted') { response.emit('aborted'); return }
      response.emit('data', Buffer.from(body))
      response.emit('end')
    })
    return request
  }
  return {get, calls, destroyed: () => destroyed}
}

function updateModule() {
  return require(new URL('../electron/update-check.cjs', import.meta.url).pathname)
}

test('EXE 使用單用途沙箱預載與主程序更新入口，版本與目前顯示一致', () => {
  const main = read('electron/main.cjs')
  assert.match(main, /preload:\s*path\.join\(__dirname,\s*['"]preload\.cjs['"]\)/)
  assert.match(main, /registerUpdateCheck/)
  assert.equal(JSON.parse(read('package.json')).version, /version:\s*'([^']+)'/.exec(read('src/utils/log.ts'))?.[1])
})

test('版本 GET 固定端點、不傳本機資料且僅回傳必要純文字欄位', async () => {
  const fake = transport()
  const result = await updateModule().checkForUpdates('3.2.0', {get: fake.get})
  assert.deepEqual(result, {status: 'ok', currentVersion: '3.2.0', app_version: '3.3.0', whats_new: payload.whats_new, updated_at: payload.updated_at})
  assert.equal(fake.calls.length, 1)
  assert.equal(fake.calls[0].url, endpoint)
  assert.deepEqual(fake.calls[0].options, {headers: {Accept: 'application/json'}})
  assert.equal('download_link' in result, false)
})

test('錯誤狀態、重導向、無效 JSON／欄位、回應超限與離線皆安全退回', async () => {
  for (const options of [
    {status: 302}, {status: 500}, {body: 'not JSON'},
    {body: JSON.stringify({...payload, app_version: '3.3.invalid'})},
    {body: JSON.stringify({...payload, whats_new: null})},
    {body: JSON.stringify({...payload, updated_at: 'invalid'})},
    {body: 'x'.repeat(64 * 1024 + 1)}, {mode: 'error'}, {mode: 'aborted'},
  ]) {
    const fake = transport(options)
    assert.deepEqual(await updateModule().checkForUpdates('3.2.0', {get: fake.get}), {status: 'unavailable'})
    assert.equal(fake.calls.length, 1)
  }
  assert.deepEqual(await updateModule().checkForUpdates('3.2.0', {get: () => {throw new Error('離線')}}), {status: 'unavailable'})
})

test('總逾時涵蓋連線與回應本文，會中止而不重試', async () => {
  for (const mode of ['timeout', 'body-timeout']) {
    const fake = transport({mode})
    assert.deepEqual(await updateModule().checkForUpdates('3.2.0', {get: fake.get, timeoutMs: 5}), {status: 'unavailable'})
    assert.equal(fake.calls.length, 1)
    assert.equal(fake.destroyed(), true)
  }
})

test('IPC 僅接受受信任主視窗頂層、無參數，合法重入只有一次查詢', async () => {
  const {registerUpdateCheck} = require(new URL('../electron/update-ipc.cjs', import.meta.url).pathname)
  let handler: (...args: unknown[]) => Promise<unknown> = () => Promise.resolve(undefined)
  let calls = 0
  const ipcMain = {handle(channel: string, callback: typeof handler) {assert.equal(channel, 'updates:check'); handler = callback}}
  const frame = {url: 'file:///app/dist/index.html'}
  const contents = {mainFrame: frame}
  const window = {webContents: contents}
  registerUpdateCheck({ipcMain, getWindow: () => window, entryUrl: frame.url, currentVersion: '3.2.0', check: async () => {calls++; return {status: 'unavailable'}}})
  for (const event of [
    {sender: {}, senderFrame: frame},
    {sender: contents, senderFrame: {url: frame.url}},
    {sender: contents, senderFrame: null},
  ]) assert.deepEqual(await handler(event), {status: 'unavailable'})
  const trusted = {sender: contents, senderFrame: frame}
  assert.deepEqual(await handler(trusted, 'https://evil.example'), {status: 'unavailable'})
  frame.url = 'https://evil.example'
  assert.deepEqual(await handler(trusted), {status: 'unavailable'})
  assert.equal(calls, 0)
  frame.url = 'file:///app/dist/index.html'
  await Promise.all([handler(trusted), handler(trusted), handler(trusted)])
  assert.equal(calls, 1)
})

test('沙箱預載只暴露固定零參數函式，不暴露 ipcRenderer 或任意 URL', async () => {
  let exposed: {checkForUpdates: (...args: unknown[]) => Promise<unknown>} | undefined
  const calls: unknown[][] = []
  runInNewContext(read('electron/preload.cjs'), {
    require: (name: string) => {
      assert.equal(name, 'electron')
      return {contextBridge: {exposeInMainWorld(key: string, value: typeof exposed) {assert.equal(key, 'imagePigeonDesktop'); exposed = value}}, ipcRenderer: {invoke(...args: unknown[]) {calls.push(args); return Promise.resolve({status: 'unavailable'})}}}
    },
  })
  assert.ok(exposed)
  assert.deepEqual(Object.keys(exposed), ['checkForUpdates'])
  await exposed.checkForUpdates('https://evil.example')
  assert.deepEqual(calls, [['updates:check']])
})

test('預載至主程序查詢再到前端提示判斷的隔離串接，重入僅一個 GET', async () => {
  const {registerUpdateCheck} = require(new URL('../electron/update-ipc.cjs', import.meta.url).pathname)
  const fake = transport()
  let handler: (...args: unknown[]) => Promise<DesktopUpdateResult> = async () => ({status: 'unavailable'})
  const frame = {url: 'file:///app/dist/index.html'}
  const contents = {mainFrame: frame}
  registerUpdateCheck({
    ipcMain: {handle(_channel: string, callback: typeof handler) {handler = callback}},
    getWindow: () => ({webContents: contents}), entryUrl: frame.url, currentVersion: '3.2.0',
    check: (version: string) => updateModule().checkForUpdates(version, {get: fake.get}),
  })
  let bridge: DesktopUpdateBridge | undefined
  runInNewContext(read('electron/preload.cjs'), {
    require: (name: string) => {
      assert.equal(name, 'electron')
      return {
        contextBridge: {exposeInMainWorld(_name: string, value: DesktopUpdateBridge) {bridge = value}},
        ipcRenderer: {invoke(channel: string, ...args: unknown[]) {
          assert.equal(channel, 'updates:check')
          return handler({sender: contents, senderFrame: frame}, ...args)
        }},
      }
    },
  })
  assert.ok(bridge)
  const service = createDesktopUpdateService({desktop: bridge})
  const result = await service.checkForUpdates()
  assert.equal(service.shouldPrompt(result), true)
  assert.deepEqual(result, {status: 'ok', currentVersion: '3.2.0', app_version: payload.app_version, whats_new: payload.whats_new, updated_at: payload.updated_at})
  await bridge.checkForUpdates()
  await service.checkForUpdates()
  assert.equal(fake.calls.length, 1)
  service.dismiss()
  assert.equal(service.shouldPrompt(result), false)
})
