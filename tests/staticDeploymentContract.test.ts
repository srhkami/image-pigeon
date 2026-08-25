import assert from 'node:assert/strict'
import {cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')

function productionSources(directory = new URL('src/', root)): URL[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    if (entry.isDirectory()) return productionSources(url)
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [url] : []
  })
}

const verifierPath = new URL('scripts/verify-static-build.mjs', root).pathname

function createSyntheticBuild(): string {
  const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-static-'))
  mkdirSync(join(directory, 'dist/assets'), {recursive: true})
  writeFileSync(join(directory, 'dist/index.html'), '<link rel="stylesheet" href="./assets/app-abcdefgh.css"><script type="module" src="./assets/app-abcdefgh.js"></script><img src="./Logo.svg">')
  writeFileSync(join(directory, 'dist/assets/app-abcdefgh.css'), 'body { color: black; }')
  writeFileSync(join(directory, 'dist/assets/app-abcdefgh.js'), 'console.log("ok")')
  writeFileSync(join(directory, 'dist/Logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
  return directory
}

function verifySyntheticBuild(directory: string) {
  return spawnSync(process.execPath, [verifierPath], {cwd: directory, encoding: 'utf8'})
}

test('production build 使用可攜式靜態 base，且開發設定沒有退役 API proxy', () => {
  const vite = read('vite.config.ts')
  assert.match(vite, /base:\s*['"]\.\/['"]/)
  assert.doesNotMatch(vite, /proxy\s*:/)
  assert.doesNotMatch(vite, /127\.0\.0\.1:18765/)
})

test('HTML 不載入第三方字型、腳本或樣式', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/)
  assert.doesNotMatch(html, /<(?:script|link)[^>]+https?:\/\//i)
})

test('正式來源沒有 fetch 或 XMLHttpRequest', () => {
  const fetchFiles: string[] = []
  const xhrFiles: string[] = []
  for (const url of productionSources()) {
    const source = readFileSync(url, 'utf8')
    if (/\bfetch\b/.test(source)) fetchFiles.push(url.pathname)
    if (/\bXMLHttpRequest\b/.test(source)) xhrFiles.push(url.pathname)
  }
  assert.deepEqual(fetchFiles, [])
  assert.deepEqual(xhrFiles, [])
})

test('專案、圖片 ZIP 與 Word 都由 Blob URL 下載', () => {
  for (const path of [
    'src/features/Output/SaveProject.tsx',
    'src/features/Output/SaveImages.tsx',
    'src/features/Output/SaveWord.tsx',
  ]) {
    const source = read(path)
    assert.match(source, /URL\.createObjectURL\(/, `${path} 必須建立 Blob URL`)
    assert.match(source, /anchor\.click\(\)/, `${path} 必須由瀏覽器觸發下載`)
    assert.match(source, /URL\.revokeObjectURL\(/, `${path} 必須回收 Blob URL`)
  }
})

test('部署文件涵蓋靜態主機、快取、壓縮、HTTPS、CSP 與零上傳邊界', () => {
  const path = new URL('docs/deployment/pure-frontend-static-hosting.md', root)
  assert.equal(existsSync(path), true, '缺少 C9 靜態部署文件')
  const doc = readFileSync(path, 'utf8')
  for (const required of [
    'text/html',
    'text/css',
    'application/javascript',
    'image/svg+xml',
    'Brotli',
    'gzip',
    'index.html',
    'Cache-Control',
    'HTTPS',
    'Content-Security-Policy',
    "connect-src 'self'",
    "font-src 'self'",
    'file://',
    'Python',
    'Node',
    '零上傳',
  ]) assert.match(doc, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `文件缺少：${required}`)
  assert.match(doc, /尾端斜線/)
  assert.match(doc, /使用者明確點擊/)
  assert.match(doc, /不包含專案、圖片、備註或應用程式狀態/)
})

test('既有外部導覽集中於明確允許清單並隔離 opener', () => {
  const policy = read('src/services/browserExternalNavigation.ts')
  const sources = read('src/features/Intro/Intro.tsx') + read('src/features/Intro/ModalFeedback.tsx') + read('src/features/About/ModalReadme.tsx')
  for (const expected of [
    'https://line.me/ti/p/mvI1aBkiy6',
    'https://pigeonhand.tw/feedback/web',
    'https://pigeonhand.tw',
    'https://traffic.pigeonhand.tw',
    'https://github.com/srhkami/image-pigeon.git',
  ]) assert.match(policy, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(sources, /window\.open\(/)
  assert.doesNotMatch(sources, /href=['"]https?:\/\//)
  assert.equal(sources.match(/rel=['"]noopener noreferrer['"]/g)?.length, 5)
})

test('產物探針拒絕第三方資源、絕對路徑、缺檔與未 hash 執行資產', () => {
  const directory = createSyntheticBuild()
  try {
    assert.equal(verifySyntheticBuild(directory).status, 0)
    const clean = join(directory, 'clean')
    cpSync(join(directory, 'dist'), clean, {recursive: true})
    const reset = () => {
      rmSync(join(directory, 'dist'), {recursive: true, force: true})
      cpSync(clean, join(directory, 'dist'), {recursive: true})
    }
    const cases: Array<() => void> = [
      () => writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8') + '<img src="https://evil.example/pixel.png">'),
      () => writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8') + '<img src="//evil.example/pixel.png">'),
      () => writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8') + '<img src=//evil.example/pixel.png>'),
      () => writeFileSync(join(directory, 'dist/assets/app-abcdefgh.css'), 'body { background: url(https://evil.example/pixel.png); }'),
      () => writeFileSync(join(directory, 'dist/assets/app-abcdefgh.js'), 'fetch("https://evil.example/upload")'),
      () => writeFileSync(join(directory, 'dist/assets/app-abcdefgh.js'), 'fetch("//evil.example/upload")'),
      () => writeFileSync(join(directory, 'dist/assets/app-abcdefgh.js'), 'fetch("https://github.com/untrusted/resource.js")'),
      () => writeFileSync(join(directory, 'dist/assets/app-abcdefgh.js'), 'fetch?.("https://pigeonhand.tw")'),
      () => writeFileSync(join(directory, 'dist/Logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><image href="//evil.example/pixel.png"/></svg>'),
      () => writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8').replace('./Logo.svg', '/Logo.svg')),
      () => writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8').replace('./Logo.svg', './missing.svg')),
      () => {
        writeFileSync(join(directory, 'dist/assets/lazy-module.js'), 'console.log("lazy")')
        writeFileSync(join(directory, 'dist/index.html'), readFileSync(join(directory, 'dist/index.html'), 'utf8') + '<script src="./assets/lazy-module.js"></script>')
      },
    ]
    for (const mutate of cases) {
      reset()
      mutate()
      assert.notEqual(verifySyntheticBuild(directory).status, 0)
    }
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})
