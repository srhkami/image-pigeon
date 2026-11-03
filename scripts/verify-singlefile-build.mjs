import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version
const navigation = readFileSync(resolve(root, 'src/services/browserExternalNavigation.ts'), 'utf8')
const allowedNavigation = [...navigation.matchAll(/:\s*'(https:\/\/[^']+)'/g)].map(match => match[1])

function assertEmbedded(reference) {
  assert.match(reference.trim(), /^(?:data:|blob:|#)/i, `單檔不得載入外部或鄰近資源：${reference.slice(0, 160)}`)
}

function verifyCss(css) {
  assert.doesNotMatch(css, /@import\s/i, '單檔不得另外匯入樣式')
  for (const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi)) {
    assertEmbedded(match[1] ?? match[2] ?? match[3])
  }
}

function verifyJavaScript(code) {
  const source = ts.createSourceFile('singlefile.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  assert.equal(source.parseDiagnostics.length, 0, '內嵌JavaScript必須可解析')
  const resourceProperties = new Set(['src', 'srcSet', 'poster'])
  const networkCalls = new Set(['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'importScripts'])
  const workerCalls = new Set(['Worker', 'SharedWorker'])
  const nameOf = node => ts.isIdentifier(node) ? node.text
    : ts.isPropertyAccessExpression(node) ? node.name.text
      : ts.isElementAccessExpression(node) && node.argumentExpression && ts.isStringLiteral(node.argumentExpression) ? node.argumentExpression.text : ''
  const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined
  const visit = node => {
    assert.equal(ts.isImportDeclaration(node) || ts.isExportDeclaration(node) && !!node.moduleSpecifier, false, '單檔不得依賴其他模組')
    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const name = nameOf(node.expression)
      assert.equal(node.expression.kind === ts.SyntaxKind.ImportKeyword, false, '單檔不得動態匯入模組')
      assert.equal(networkCalls.has(name), false, `單檔含背景網路呼叫：${name}`)
      const reference = literal(node.arguments?.[0])
      if (workerCalls.has(name) && reference !== undefined) assertEmbedded(reference)
    }
    if (ts.isPropertyAssignment(node) && resourceProperties.has(nameOf(node.name) || literal(node.name))) {
      const reference = literal(node.initializer)
      if (reference) assertEmbedded(reference)
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isPropertyAccessExpression(node.left) && resourceProperties.has(node.left.name.text)) {
      const reference = literal(node.right)
      if (reference) assertEmbedded(reference)
    }
    const text = literal(node)
    if (text && /^(?:\.\.?\/|\/(?!\/)|assets\/|Logo)/.test(text)
      && /\.(?:css|[cm]?js|svg|png|jpe?g|webp|woff2?)(?:[?#].*)?$/i.test(text)) {
      assert.fail(`內嵌程式仍引用鄰近資產：${text}`)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}

export function verifySinglefileBuild(directory) {
  const entries = readdirSync(directory, {withFileTypes: true})
  assert.equal(entries.length, 1, '輸出目錄只能有一個HTML，不能帶資產資料夾或其他檔案')
  assert.ok(entries[0].isFile())
  assert.equal(entries[0].name, `image-pigeon-${version}.html`, '單檔名稱與版本不一致')
  const path = resolve(directory, entries[0].name)
  const bytes = readFileSync(path)
  const html = bytes.toString('utf8')
  let inlineScripts = 0
  let inlineStyles = 0
  const shell = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (_tag, attributes, code) => {
    assert.doesNotMatch(attributes, /\bsrc\s*=/i, '程式必須內嵌')
    verifyJavaScript(code)
    inlineScripts += 1
    return ''
  }).replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_tag, css) => {
    verifyCss(css)
    inlineStyles += 1
    return ''
  })
  assert.ok(inlineScripts > 0, '缺少內嵌程式')
  assert.ok(inlineStyles > 0, '缺少內嵌樣式')
  assert.match(shell, /\bid=["']root["']/)
  assert.match(shell, /\bid=["']modal-root["']/)
  for (const match of shell.matchAll(/<([a-z][\w-]*)\b[^>]*>/gi)) {
    const tag = match[1].toLowerCase()
    assert.equal(['script', 'style', 'base', 'iframe', 'object', 'embed'].includes(tag), false, `不允許外部載入標籤：${tag}`)
    for (const attribute of match[0].matchAll(/\b(src|href|poster|srcset|style)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi)) {
      const key = attribute[1].toLowerCase()
      const reference = attribute[2] ?? attribute[3] ?? attribute[4]
      if (key === 'style') verifyCss(reference)
      else if (tag === 'a' && key === 'href' && allowedNavigation.includes(reference)) continue
      else if (key === 'srcset') assert.fail('單檔不得另有圖片多來源資產')
      else assertEmbedded(reference)
    }
  }
  return {
    path, files: 1, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    inlineScripts, inlineStyles, externalResources: 0,
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = verifySinglefileBuild(resolve(process.argv[2] ?? resolve(root, `release/html-${version}`)))
  const html = readFileSync(report.path, 'utf8')
  const images = [
    ['public/Logo.svg', 'image/svg+xml'],
    ['public/Logo_PH.png', 'image/png'],
    ['public/Logo_TP.png', 'image/png'],
    ['src/assets/line_qrcode.jpg', 'image/jpeg'],
  ]
  for (const [path, mime] of images) {
    const embedded = `data:${mime};base64,${readFileSync(resolve(root, path)).toString('base64')}`
    assert.ok(html.includes(embedded), `必要圖片尚未內嵌：${path}`)
  }
  console.log(JSON.stringify({...report, embeddedImages: images.length}, null, 2))
}
