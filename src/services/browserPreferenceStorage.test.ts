import assert from 'node:assert/strict'
import {existsSync, readFileSync} from 'node:fs'
import test from 'node:test'

const helper = new URL('./browserPreferenceStorage.ts', import.meta.url)

async function preferences() {
  assert.ok(existsSync(helper), '必須提供瀏覽器偏好設定的安全存取')
  return import('./browserPreferenceStorage.ts')
}

async function withWindow(value: object | undefined, run: () => Promise<void>) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {configurable: true, value})
  try {
    await run()
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else Reflect.deleteProperty(globalThis, 'window')
  }
}

test('偏好設定保留正常儲存的讀寫語意', async () => {
  const values = new Map<string, string>([['theme', 'light']])
  await withWindow({localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }}, async () => {
    const service = await preferences()
    assert.equal(service.readBrowserPreference('theme'), 'light')
    assert.equal(service.readBrowserPreference('missing'), null)
    assert.equal(service.writeBrowserPreference('readme', '3.3.0'), true)
    assert.equal(values.get('readme'), '3.3.0')
  })
})

test('取得儲存空間被拒絕時回退且不拋錯', async () => {
  await withWindow({get localStorage() { throw new Error('SecurityError') }}, async () => {
    const service = await preferences()
    assert.equal(service.readBrowserPreference('theme'), null)
    assert.equal(service.writeBrowserPreference('theme', 'dark'), false)
  })
})

test('儲存讀寫拋錯時安全回退且不拋錯', async () => {
  await withWindow({localStorage: {
    getItem: () => { throw new Error('SecurityError') },
    setItem: () => { throw new Error('QuotaExceededError') },
  }}, async () => {
    const service = await preferences()
    assert.equal(service.readBrowserPreference('readme'), null)
    assert.equal(service.writeBrowserPreference('readme', '3.3.0'), false)
  })
})

test('沒有視窗時偏好設定安全回退', async () => {
  await withWindow(undefined, async () => {
    const service = await preferences()
    assert.equal(service.readBrowserPreference('theme'), null)
    assert.equal(service.writeBrowserPreference('theme', 'dark'), false)
  })
})

test('主題與功能介紹都接上安全偏好設定，不直接存取localStorage', () => {
  for (const path of ['../layout/BtnThemeToggle.tsx', '../features/About/ModalReadme.tsx']) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    assert.match(source, /import\s*\{readBrowserPreference, writeBrowserPreference\}/)
    assert.doesNotMatch(source, /\blocalStorage\s*\./)
    assert.match(source, /readBrowserPreference\(/)
    assert.match(source, /writeBrowserPreference\(/)
  }
})
