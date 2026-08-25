import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {
  IGNORED_UPDATE_DATE_KEY,
  ignoreLatestVersion,
  shouldShowLatestVersion,
  toRocSevenDigitDate,
} from '../src/features/Intro/newVersionDismissal.ts'

const modalSource = readFileSync(
  new URL('../src/features/Intro/ModalNewVersion.tsx', import.meta.url),
  'utf8',
)

test('遠端更新日期會轉成七碼民國日期', () => {
  assert.equal(toRocSevenDigitDate('2026-07-15'), '1150715')
  assert.equal(toRocSevenDigitDate('2026-08-04T12:30:00Z'), '1150804')
})

test('無效或民國前日期不會產生忽略值', () => {
  assert.equal(toRocSevenDigitDate('not-a-date'), null)
  assert.equal(toRocSevenDigitDate('1911-12-31'), null)
})

test('忽略動作只會把最新版本的七碼日期寫入儲存空間', () => {
  const values = new Map<string, string>()
  const storage = {
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }

  assert.equal(ignoreLatestVersion(storage, '2026-07-15'), true)
  assert.equal(values.get(IGNORED_UPDATE_DATE_KEY), '1150715')
})

test('相同日期不再提示，但下個更新日期會重新顯示', () => {
  const base = {
    currentVersion: '2.2.0',
    latestVersion: '2.3.0',
    sessionDismissedVersion: null,
  }

  assert.equal(shouldShowLatestVersion({...base, updatedAt: '2026-07-15', ignoredDate: '1150715'}), false)
  assert.equal(shouldShowLatestVersion({...base, updatedAt: '2026-08-04', ignoredDate: '1150715'}), true)
})

test('既有版本與工作階段關閉規則仍會抑制提示', () => {
  assert.equal(shouldShowLatestVersion({
    currentVersion: '2.2.0',
    latestVersion: '2.2.0',
    updatedAt: '2026-08-04',
    ignoredDate: null,
    sessionDismissedVersion: null,
  }), false)
  assert.equal(shouldShowLatestVersion({
    currentVersion: '2.2.0',
    latestVersion: '2.3.0',
    updatedAt: '2026-08-04',
    ignoredDate: null,
    sessionDismissedVersion: '2.3.0',
  }), false)
})

test('提示視窗提供明確的忽略此版本按鈕', () => {
  assert.match(modalSource, /ignoreLatestVersion\(localStorage, data\.updated_at\)/)
  assert.match(modalSource, />忽略此版本<\/Button>/)
})
