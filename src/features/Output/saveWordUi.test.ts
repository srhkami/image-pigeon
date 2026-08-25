import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./SaveWord.tsx', import.meta.url), 'utf8')

test('Word UI 直接建立 browser DOCX Blob 並下載，沒有 session 或 pywebview bridge', () => {
  assert.match(source, /createBrowserWordItems\(/)
  assert.match(source, /createBrowserWordBlob\(/)
  assert.match(source, /anchor\.download\s*=\s*.*\.docx/)
  assert.doesNotMatch(source, /sessionId|pywebview|select_path|save_docx|projectOutputAdapter|handleError/)
})

test('Word UI 提供本機逐張進度與取消，並在完成前不下載', () => {
  assert.match(source, /new AbortController\(\)/)
  assert.match(source, /onProgress:/)
  assert.match(source, /controllerRef\.current\?\.abort\(\)/)
  assert.match(source, /const \{blob\} = await createBrowserWordBlob/)
})
