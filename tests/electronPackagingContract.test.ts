import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path: string) => readFileSync(new URL(path, root), 'utf8')
const require = createRequire(import.meta.url)

function productionSources(directory = new URL('src/', root)): URL[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
    if (entry.isDirectory()) return productionSources(url)
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [url] : []
  })
}

function writePortableCandidate(directory: string, name = 'image-pigeon-3.1.1-win-x64-portable.exe', machine = 0x8664) {
  const candidate = join(directory, name)
  const payload = Buffer.alloc(1024 * 1024 + 1)
  payload.write('MZ')
  payload.writeUInt32LE(128, 0x3c)
  payload.write('PE\u0000\u0000', 128, 'binary')
  payload.writeUInt16LE(machine, 132)
  writeFileSync(candidate, payload)
  return candidate
}

test('Electron 使用獨立命令且不改變既有純前端 build', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.version, '3.1.1')
  assert.equal(pkg.scripts.build, 'tsc -b && vite build')
  assert.equal(pkg.scripts['build:electron'], 'pnpm run build && pnpm run verify:static')
  assert.equal(pkg.scripts['package:electron:win'], 'pnpm run build:electron && electron-builder --win portable --x64')
  assert.equal(pkg.scripts['verify:electron:package'], 'node scripts/verify-electron-package.mjs')
  assert.equal(pkg.devDependencies.electron, '44.0.0')
  assert.equal(pkg.devDependencies['electron-builder'], '26.15.3')
  assert.equal(pkg.dependencies?.electron, undefined)
  assert.equal(pkg.dependencies?.['electron-builder'], undefined)
})

test('React 正式來源不依賴 Electron 或 Node.js API', () => {
  const violations: string[] = []
  for (const url of productionSources()) {
    const source = readFileSync(url, 'utf8')
    if (/from\s+['"](?:electron|node:[^'"]+|fs(?:\/[^'"]*)?|path(?:\/[^'"]*)?)['"]/m.test(source) || /require\(\s*['"](?:electron|node:[^'"]+|fs(?:\/[^'"]*)?|path(?:\/[^'"]*)?)['"]/m.test(source)) {
      violations.push(url.pathname)
    }
  }
  assert.deepEqual(violations, [])
})

test('Electron 主程序採最小沙箱與拒絕權限策略', () => {
  const main = read('electron/main.cjs')
  assert.match(main, /nodeIntegration:\s*false/)
  assert.match(main, /contextIsolation:\s*true/)
  assert.match(main, /sandbox:\s*true/)
  assert.doesNotMatch(main, /\bpreload\s*:/)
  assert.match(main, /setPermissionRequestHandler\(\([^)]*callback\)\s*=>\s*callback\(false\)\)/)
  assert.match(main, /setPermissionCheckHandler\(\(\)\s*=>\s*false\)/)
  assert.match(main, /setWindowOpenHandler/)
  assert.match(main, /will-navigate/)
  assert.match(main, /will-attach-webview/)
  assert.match(main, /loadFile\(/)
  assert.match(main, /if\s*\(process\.platform\s*!==\s*['"]darwin['"]\)\s*app\.quit\(\)/)
})

test('外部導覽只允許現有固定網址，未知或變形網址一律拒絕', () => {
  const policyPath = new URL('../electron/navigation-policy.cjs', import.meta.url)
  delete require.cache[policyPath.pathname]
  const policy = require(policyPath.pathname)
  const allowed = [
    'https://line.me/ti/p/mvI1aBkiy6',
    'https://pigeonhand.tw/feedback/web',
    'https://pigeonhand.tw',
    'https://traffic.pigeonhand.tw',
    'https://github.com/srhkami/image-pigeon.git',
  ]
  assert.deepEqual([...policy.ALLOWED_EXTERNAL_URLS], allowed)
  const browserPolicy = read('src/services/browserExternalNavigation.ts')
  const browserAllowed = [...browserPolicy.matchAll(/:\s*'(https:\/\/[^']+)'/g)].map(match => match[1])
  assert.deepEqual(browserAllowed, allowed)
  for (const url of allowed) assert.equal(policy.isAllowedExternalUrl(url), true, url)
  for (const url of [
    'http://pigeonhand.tw',
    'https://pigeonhand.tw/',
    'https://pigeonhand.tw.evil.example',
    'https://github.com/srhkami/image-pigeon',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'not a url',
  ]) assert.equal(policy.isAllowedExternalUrl(url), false, url)
})

test('electron-builder 僅封裝靜態產物、桌面殼與 package metadata', () => {
  const config = read('electron-builder.yml')
  for (const required of [
    'appId: tw.pigeonhand.imagepigeon',
    'productName: 貼圖小鴿手',
    'asar: true',
    '- dist/**',
    '- electron/**',
    '- package.json',
    'target: portable',
  ]) assert.match(config, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(config, /arch:\s*\n\s*- x64/)
  assert.match(config, /- '!node_modules\/\*\*'/)
  assert.doesNotMatch(config, /^\s*-\s*node_modules\/\*\*/m)
  assert.doesNotMatch(config, /^\s*-\s*\*\*\/\*/m)
})

test('封裝產物探針接受單一 portable exe 與 metadata，但拒絕額外 exe', () => {
  const verifier = new URL('scripts/verify-electron-package.mjs', root).pathname
  const directory = mkdtempSync(join(tmpdir(), 'image-pigeon-electron-'))
  try {
    const candidate = writePortableCandidate(directory, 'image-pigeon-3.1.1-win-x64-portable.exe', 0x014c)
    writeFileSync(join(directory, 'builder-effective-config.yaml'), 'metadata: true')
    mkdirSync(join(directory, 'win-unpacked', 'resources'), {recursive: true})
    writePortableCandidate(directory, 'win-unpacked/貼圖小鴿手.exe')
    writePortableCandidate(directory, 'win-unpacked/resources/elevate.exe')
    const pass = spawnSync(process.execPath, [verifier, directory], {encoding: 'utf8'})
    assert.equal(pass.status, 0, pass.stderr)
    const report = JSON.parse(pass.stdout)
    assert.equal(report.candidate, candidate)
    assert.equal(report.architecture, 'x64')
    assert.equal(report.portable, true)
    assert.equal(statSync(candidate).size, report.bytes)

    writePortableCandidate(directory, 'image-pigeon-3.1.1-win-x64-setup.exe')
    const fail = spawnSync(process.execPath, [verifier, directory], {encoding: 'utf8'})
    assert.notEqual(fail.status, 0)
  } finally {
    rmSync(directory, {recursive: true, force: true})
  }
})
