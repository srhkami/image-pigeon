import assert from 'node:assert/strict'
import {existsSync, readFileSync, readdirSync} from 'node:fs'
import test from 'node:test'

const root = new URL('../../', import.meta.url)

const retiredPaths = [
  'main.py',
  'main.spec',
  'Logo.ico',
  'pyproject.toml',
  'uv.lock',
  'core/',
  '.venv/',
]

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules'])
const retiredFilenames = new Set([
  '.python-version',
  'Pipfile',
  'Pipfile.lock',
  'poetry.lock',
  'pyproject.toml',
  'setup.cfg',
  'setup.py',
  'tox.ini',
  'uv.lock',
])

function pythonRuntimeFiles(directory: URL = root): string[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return []
    const path = new URL(entry.name, `${directory.href}/`)
    if (entry.isDirectory()) return pythonRuntimeFiles(path)
    const retired = /\.pyi?$|\.spec$|^requirements.*\.txt$/i.test(entry.name)
      || retiredFilenames.has(entry.name)
    return retired ? [decodeURIComponent(path.pathname)] : []
  })
}

test('現行儲存庫不含 Python 執行階段、依賴或桌面打包資產', () => {
  for (const path of retiredPaths) {
    assert.equal(existsSync(new URL(path, root)), false, `${path} must be retired`)
  }
  assert.deepEqual(pythonRuntimeFiles(), [])
})

test('前端指令不呼叫 Python 工具鏈', () => {
  const packageJson = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
    scripts?: Record<string, string>
  }
  const scripts = Object.values(packageJson.scripts ?? {}).join('\n')

  assert.doesNotMatch(scripts, /\b(?:python|python3|uv|pytest|pyinstaller|pywebview)\b/i)
})
