import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('../src/utils/log.ts', import.meta.url), 'utf8')

test('3.0.0 是目前應用程式版本且位於內建更新日誌首筆', () => {
  const firstVersion = source.match(/CHANGELOG_LIST[^[]*\[\s*\{\s*version:\s*'([^']+)'/s)?.[1]
  const firstDate = source.match(/CHANGELOG_LIST[^[]*\[\s*\{[\s\S]*?date:\s*'([^']+)'/)?.[1]

  assert.equal(firstVersion, '3.0.0')
  assert.equal(firstDate, '1150825')
  assert.match(source, /單一 `?\.ipigeon`?/)
  assert.match(source, /export const AppVersion = CHANGELOG_LIST\[0\]\.version/)
})
