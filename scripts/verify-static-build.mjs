import assert from 'node:assert/strict'
import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {dirname, isAbsolute, relative, resolve, sep} from 'node:path'

const dist = resolve('dist')
const indexPath = resolve(dist, 'index.html')
assert.equal(existsSync(indexPath), true, '缺少 dist/index.html；請先執行 pnpm run build')

function walk(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = resolve(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

function isInsideDist(path) {
  const pathFromDist = relative(dist, path)
  return pathFromDist !== '..' && !pathFromDist.startsWith(`..${sep}`) && !isAbsolute(pathFromDist)
}

function cleanReference(reference) {
  return reference.trim().replace(/^['"]|['"]$/g, '').split(/[?#]/, 1)[0]
}

function assertLocalReference(reference, owner, additionalRoots = []) {
  const value = cleanReference(reference)
  if (!value || /^(?:data:|blob:|#|%23)/i.test(value)) return
  assert.doesNotMatch(value, /^(?:https?:)?\/\//i, `正式產物不得載入第三方資源：${value}`)
  assert.equal(value.startsWith('/'), false, `靜態資產不得使用站台根絕對路徑：${value}`)
  const targets = [dirname(owner), ...additionalRoots].map(root => resolve(root, value))
  const inDistTargets = targets.filter(isInsideDist)
  assert.ok(inDistTargets.length > 0, `靜態資產不得離開 dist：${value}`)
  assert.equal(inDistTargets.some(existsSync), true, `靜態資產不存在：${value}`)
}

const allowedExternalUrls = [
  /^https:\/\/api\.pigeonhand\.tw\/web\/apps\/1\/$/,
  /^https:\/\/line\.me\/ti\/p\/mvI1aBkiy6$/,
  /^https:\/\/pigeonhand\.tw(?:\/feedback\/web)?$/,
  /^https:\/\/traffic\.pigeonhand\.tw$/,
  /^https:\/\/drive\.google\.com\/drive\/folders\/1VRCiQbSn09LS3aWd4mgw_Eczls9wJsRm\?usp=drive_link$/,
  /^https:\/\/github\.com\/srhkami\/image-pigeon\.git$/,
]
const metadataExternalUrls = [
  /^https?:\/\/(?:purl\.org|schemas\.microsoft\.com|schemas\.openxmlformats\.org|www\.w3\.org)\//,
  /^https:\/\/answers\.microsoft\.com\/en-us\/msoffice\/forum\/all\/does-word-support-more-than-9-list-levels\/d130fdcd-1781-446d-8c84-c6c79124e4d7$/,
  /^https:\/\/github\.com\/remarkjs\/react-markdown\/blob\/main\/changelog\.md$/,
  /^https:\/\/github\.com\/syntax-tree\/hast-util-to-jsx-runtime$/,
  /^https:\/\/react\.dev\/errors\/$/,
  /^https:\/\/rolldown\.rs\/in-depth\/bundling-cjs#require-external-modules$/,
  /^https:\/\/stuk\.github\.io\/jszip\/documentation\/howto\/read_zip\.html$/,
]

const files = walk(dist)
const textFiles = files.filter(path => /\.(?:html|css|js|svg)$/i.test(path))
const references = []

for (const path of textFiles) {
  const content = readFileSync(path, 'utf8')
  assert.doesNotMatch(content, /["'`]\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:[/:?#][^"'`]*)?["'`]/, `正式產物含 protocol-relative URL：${relative(dist, path)}`)
  for (const match of content.matchAll(/https?:\/\/[^\s"'<>`\\)]+/g)) {
    assert.equal([...allowedExternalUrls, ...metadataExternalUrls].some(pattern => pattern.test(match[0])), true, `正式產物含未允許的外部 URL：${match[0]}`)
  }

  if (/\.(?:html|svg)$/i.test(path)) {
    for (const tagMatch of content.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
      const tag = tagMatch[1].toLowerCase()
      for (const attrMatch of tagMatch[0].matchAll(/\b(?:src|href|poster)\s*=\s*(?:(["'])(.*?)\1|([^\s"'=<>`]+))/gi)) {
        const reference = attrMatch[2] ?? attrMatch[3]
        references.push(reference)
        if (tag === 'a' && /^https?:\/\//i.test(reference)) {
          assert.equal(allowedExternalUrls.some(pattern => pattern.test(reference)), true, `外部導覽不在允許清單：${reference}`)
          continue
        }
        assertLocalReference(reference, path)
      }
    }
  }

  if (/\.css$/i.test(path)) {
    for (const match of content.matchAll(/(?:url\(\s*|@import\s+)(["']?)([^"')\s;]+)\1/gi)) {
      references.push(match[2])
      assertLocalReference(match[2], path)
    }
  }

  if (/\.js$/i.test(path)) {
    for (const match of content.matchAll(/\b(?:fetch|WebSocket|EventSource|importScripts|Worker|SharedWorker|import)\s*(?:\?\.)?\(\s*(["'`])((?:https?:)?\/\/[^"'`]*)\1/gi)) {
      assert.equal(match[2], 'https://api.pigeonhand.tw/web/apps/1/', `JavaScript 含未允許的外部請求：${match[2]}`)
    }
    for (const match of content.matchAll(/\b(?:sendBeacon|open)\s*(?:\?\.)?\([^)]*?(["'`])((?:https?:)?\/\/[^"'`]*)\1/gi)) {
      assert.fail(`JavaScript 含未允許的外部請求：${match[2]}`)
    }
    for (const match of content.matchAll(/(?:\.\.\/|\.\/|\/)(?:assets\/)?[A-Za-z0-9_.-]+\.(?:css|js|mjs|svg|png|jpe?g|webp|woff2?)/g)) {
      references.push(match[0])
      assertLocalReference(match[0], path, [dist])
    }
  }
}

const index = readFileSync(indexPath, 'utf8')
const indexReferences = [...index.matchAll(/\b(?:src|href)=(["'])(.*?)\1/gi)].map(match => match[2])
assert.ok(indexReferences.length > 0, 'dist/index.html 沒有靜態資產參照')
for (const reference of indexReferences) {
  if (/^(?:data:|blob:|#|https?:\/\/)/i.test(reference)) continue
  assert.equal(reference.startsWith('./'), true, `入口靜態資產必須使用可攜式相對路徑：${reference}`)
}

const forbidden = [
  '127.0.0.1:18765',
  '/api/images/import',
  '/api/project/save',
  'window.pywebview',
  'requestJson',
  'save_docx',
  'save_images',
]
for (const value of forbidden) {
  const hits = textFiles.filter(path => readFileSync(path, 'utf8').includes(value))
  assert.deepEqual(hits, [], `正式產物含退役執行階段字串：${value}`)
}

const executableAssets = files.filter(path => path.startsWith(`${resolve(dist, 'assets')}${sep}`) && /\.(?:js|css)$/i.test(path))
assert.ok(executableAssets.some(path => /-[A-Za-z0-9_-]{8,}\.js$/i.test(path)), 'JavaScript 產物缺少內容 hash')
assert.ok(executableAssets.some(path => /-[A-Za-z0-9_-]{8,}\.css$/i.test(path)), 'CSS 產物缺少內容 hash')
for (const path of executableAssets) {
  assert.match(path, /-[A-Za-z0-9_-]{8,}\.(?:js|css)$/i, `執行或樣式資產缺少內容 hash：${relative(dist, path)}`)
}

console.log(JSON.stringify({
  index: 'dist/index.html',
  relativeReferences: indexReferences,
  files: files.length,
  verifiedReferences: references.length,
  forbiddenHits: 0,
}, null, 2))