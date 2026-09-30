import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  createDesktopUpdateService,
  isRemoteVersionNewer,
  toMinguoUpdateDate,
  type DesktopUpdateResult,
  type StorageLike,
} from './desktopUpdate.ts'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const update: DesktopUpdateResult = {
  status: 'ok',
  currentVersion: '3.2.0',
  app_version: '3.10.0',
  whats_new: '第一項\n第二項',
  updated_at: '2026-09-30T08:00:00Z',
}

function createStorage(values = new Map<string, string>()): StorageLike {
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
  }
}

test('Intro 的版本資訊旁固定提供檢查新版入口', () => {
  const intro = readSource('../features/Intro/Intro.tsx')

  assert.match(intro, /EXTERNAL_NAVIGATION_URLS\.updateFolder/)
  assert.match(intro, /<a[^>]+col-span-2[^>]+target='_blank'[^>]+rel='noopener noreferrer'/)
  assert.match(intro, />\s*檢查新版\s*</)
})

test('只接受三段數字且遠端版本必須較新', () => {
  assert.equal(isRemoteVersionNewer('3.10.0', '3.2.0'), true)
  assert.equal(isRemoteVersionNewer('3.2.1', '3.2.0'), true)
  assert.equal(isRemoteVersionNewer('3.2.0', '3.2.0'), false)
  assert.equal(isRemoteVersionNewer('3.1.9', '3.2.0'), false)
  assert.equal(isRemoteVersionNewer('3.2', '3.2.0'), false)
  assert.equal(isRemoteVersionNewer('3.2.0-beta', '3.2.0'), false)
})

test('更新日期轉為民國七碼並由忽略狀態阻止提示', () => {
  const values = new Map<string, string>()
  const storage = createStorage(values)
  const service = createDesktopUpdateService({storage})

  assert.equal(toMinguoUpdateDate(update.updated_at), '1150930')
  assert.equal(toMinguoUpdateDate('2911-01-01'), null)
  assert.equal(service.shouldPrompt(update), true)
  service.ignore(update)

  assert.equal(values.get('image-pigeon.ignored-update-date'), '1150930')
  assert.equal(values.get('image-pigeon.dismissed-new-version'), '1')
  assert.equal(service.shouldPrompt(update), false)
  assert.equal(createDesktopUpdateService({storage}).shouldPrompt(update), false)
})

test('關閉提示只在本次工作階段生效', () => {
  const storage = createStorage()
  const service = createDesktopUpdateService({storage})

  service.dismiss()

  assert.equal(storage.getItem('image-pigeon.dismissed-new-version'), '1')
  assert.equal(service.shouldPrompt(update), false)
})

test('儲存空間讀寫失敗不阻斷提示關閉', () => {
  const unavailableStorage: StorageLike = {
    getItem: () => { throw new Error('storage unavailable') },
    setItem: () => { throw new Error('storage unavailable') },
  }
  const service = createDesktopUpdateService({storage: unavailableStorage})

  assert.equal(service.shouldPrompt(update), true)
  assert.doesNotThrow(() => service.ignore(update))
  assert.equal(service.shouldPrompt(update), false)
})

test('網頁沒有 bridge 時不查詢且安靜退回 unavailable', async () => {
  const service = createDesktopUpdateService({})

  assert.deepEqual(await service.checkForUpdates(), {status: 'unavailable'})
})

test('bridge reject 與重複呼叫只進行一輪查詢', async () => {
  let calls = 0
  const service = createDesktopUpdateService({
    desktop: {
      checkForUpdates: () => {
        calls += 1
        return Promise.reject(new Error('offline'))
      },
    },
  })

  const first = service.checkForUpdates()
  const second = service.checkForUpdates()

  assert.strictEqual(first, second)
  assert.deepEqual(await first, {status: 'unavailable'})
  assert.equal(calls, 1)
})

test('前端服務不含 Electron、Node、HTTP 或 API URL', () => {
  const source = readSource('./desktopUpdate.ts')

  assert.doesNotMatch(source, /from ['"](?:electron|node:|axios)/)
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest)\b/)
  assert.doesNotMatch(source, /https?:\/\//)
})

test('桌面提示有取消晚到結果與固定下載入口', () => {
  const modal = readSource('../features/Intro/ModalDesktopUpdate.tsx')

  assert.match(modal, /let active = true/)
  assert.match(modal, /return \(\) => \{\s*active = false/)
  assert.match(modal, /有新版本可供下載！/)
  assert.match(modal, /最新版本/)
  assert.match(modal, /whitespace-pre-wrap/)
  assert.match(modal, /忽略此版本/)
  assert.match(modal, /立即更新/)
  assert.match(modal, /EXTERNAL_NAVIGATION_URLS\.updateFolder/)
})
