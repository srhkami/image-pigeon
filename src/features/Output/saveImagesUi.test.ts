import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

const source = readFileSync(new URL('./SaveImages.tsx', import.meta.url), 'utf8')

test('另存圖片只建立並下載單一 ZIP，不呼叫 pywebview 或選擇資料夾', () => {
  assert.match(source, /createImageExportZip\(/)
  assert.match(source, /anchor\.download\s*=\s*.*\.zip/)
  assert.match(source, /下載圖片 ZIP/)
  assert.doesNotMatch(source, /pywebview|select_path|save_images|buildLegacyOutputImages/)
})

test('圖片 ZIP UI 提供本機進度與整批取消生命週期', () => {
  assert.match(source, /new AbortController\(\)/)
  assert.match(source, /controllerRef\.current\?\.abort\(\)/)
  assert.match(source, /onProgress:/)
  assert.match(source, /<progress/)
})

test('備註命名模式仍保留預設名稱輸入供空備註 fallback', () => {
  assert.doesNotMatch(source, /disabled=\{isRemarkMode\s*\|\|\s*isLoading\}/)
  assert.match(source, /disabled=\{isLoading\}/)
})
