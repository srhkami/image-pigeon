import assert from 'node:assert/strict'
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const verifier = new URL('./verify-singlefile-build.mjs', import.meta.url)

const clean = '<!doctype html><html><head><link rel="icon" href="data:image/svg+xml;base64,PHN2Zy8+"><style>body{color:black}</style></head><body><div id="root"></div><div id="modal-root"></div><a href="https://pigeonhand.tw">網站</a><script type="module">const image="data:image/png;base64,AA==";console.log(image)</script></body></html>'

async function verify(directory: string) {
  assert.ok(existsSync(verifier), '必須提供單檔產物驗證器')
  const module = await import('./verify-singlefile-build.mjs')
  return module.verifySinglefileBuild(directory)
}

test('獨立單檔命令保留網站建置且不依賴已退役的桌面打包', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts.build, 'tsc -b && vite build')
  assert.equal(pkg.scripts['build:electron'], undefined)
  assert.equal(pkg.scripts['package:electron:win'], undefined)
  assert.equal(pkg.devDependencies['vite-plugin-singlefile'], '2.3.4')
  assert.match(pkg.scripts['build:singlefile'] ?? '', /vite build --config vite\.singlefile\.config\.ts/)
  assert.match(pkg.scripts['build:singlefile'] ?? '', /verify-singlefile-build\.mjs/)
  assert.ok(existsSync(new URL('vite.singlefile.config.ts', root)))
})

test('自足HTML允許內嵌資源、XML中繼資料與使用者主動導覽', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-singlefile-'))
  try {
    writeFileSync(join(directory, 'image-pigeon-3.3.0.html'), clean.replace('console.log(image)', 'console.log(image,"http://www.w3.org/2000/svg")'))
    const report = await verify(directory)
    assert.equal(report.files, 1)
    assert.equal(report.externalResources, 0)
    assert.equal(report.inlineScripts, 1)
    assert.equal(report.inlineStyles, 1)
    assert.ok(report.bytes > 0)
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})

test('污染產物逐案重設，拒絕額外檔案、缺漏資產及外部載入', async () => {
  const cases = [
    ['外部腳本', clean.replace('<script type="module">', '<script src="https://evil.example/app.js">')],
    ['未加引號的腳本', clean.replace('<script type="module">', '<script src=//evil.example/app.js>')],
    ['外部樣式', clean.replace('<style>', '<link rel="stylesheet" href="./app.css"><style>')],
    ['圖片缺檔', clean.replace('<div id="root">', '<img src="./missing.png"><div id="root">')],
    ['圖片多來源', clean.replace('<div id="root">', '<img srcset="./missing.png 1x"><div id="root">')],
    ['SVG外部圖像', clean.replace('<div id="root">', '<svg><image href="//evil.example/a.svg"/></svg><div id="root">')],
    ['樣式背景', clean.replace('color:black', 'background:url(//evil.example/a.png)')],
    ['樣式匯入', clean.replace('body{color:black}', '@import "./missing.css";body{color:black}')],
    ['可選外部請求', clean.replace('console.log(image)', 'fetch?.("https://pigeonhand.tw")')],
    ['相對檔案請求', clean.replace('console.log(image)', 'fetch("./missing.json")')],
    ['背景工作載入', clean.replace('console.log(image)', 'new Worker("./worker.js")')],
    ['動態模組', clean.replace('console.log(image)', 'import("./chunk.js")')],
    ['JavaScript圖片路徑', clean.replace('console.log(image)', 'const props={src:"./missing.png"}')],
    ['JavaScript遠端圖片', clean.replace('console.log(image)', 'const props={src:"https://evil.example/a.png"}')],
    ['損壞的內嵌程式', clean.replace('console.log(image)', 'const = ;')],
    ['缺少掛載點', clean.replace('<div id="root"></div>', '')],
  ]
  for (const [name, html] of cases) {
    const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-singlefile-'))
    try {
      writeFileSync(join(directory, 'image-pigeon-3.3.0.html'), clean)
      await verify(directory)
      writeFileSync(join(directory, 'image-pigeon-3.3.0.html'), html)
      await assert.rejects(() => verify(directory), name)
    } finally {
      rmSync(directory, {recursive: true, force: true})
    }
  }
  const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-singlefile-'))
  try {
    writeFileSync(join(directory, 'image-pigeon-3.3.0.html'), clean)
    await verify(directory)
    writeFileSync(join(directory, 'leftover.js'), 'console.log(1)')
    await assert.rejects(() => verify(directory), '不允許旁邊另放資產')
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})

test('命令列驗證接受完整圖片內嵌，並以非零退出碼拒絕污染', () => {
  const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-singlefile-'))
  try {
    const images = [
      ['public/Logo.svg', 'image/svg+xml'],
      ['public/Logo_PH.png', 'image/png'],
      ['public/Logo_TP.png', 'image/png'],
      ['src/assets/line_qrcode.jpg', 'image/jpeg'],
    ].map(([path, mime]) => `<img src="data:${mime};base64,${readFileSync(new URL(path, root)).toString('base64')}">`).join('')
    const baseline = clean.replace('</body>', `${images}</body>`)
    const file = join(directory, 'image-pigeon-3.3.0.html')
    writeFileSync(file, baseline)
    const pass = spawnSync(process.execPath, [verifier.pathname, directory], {encoding: 'utf8'})
    assert.equal(pass.status, 0, pass.stderr)
    assert.equal(JSON.parse(pass.stdout).embeddedImages, 4)
    writeFileSync(file, baseline.replace('</body>', '<img src="./missing.png"></body>'))
    const fail = spawnSync(process.execPath, [verifier.pathname, directory], {encoding: 'utf8'})
    assert.equal(fail.status, 1)
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})
