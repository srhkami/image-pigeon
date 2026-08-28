import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync, readdirSync, statSync} from 'node:fs'
import {basename, resolve} from 'node:path'

const releaseDirectory = resolve(process.argv[2] ?? 'release')
const packageMetadata = JSON.parse(readFileSync(resolve('package.json'), 'utf8'))
const expectedName = `image-pigeon-${packageMetadata.version}-win-x64-portable.exe`

const executableCandidates = readdirSync(releaseDirectory, {withFileTypes: true})
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith('.exe'))
  .map(entry => resolve(releaseDirectory, entry.name))
assert.equal(executableCandidates.length, 1, `release 根目錄必須只有一個 .exe，實際為 ${executableCandidates.length}`)

const candidate = executableCandidates[0]
assert.equal(basename(candidate), expectedName, `portable 候選檔名不符：${basename(candidate)}`)
const bytes = readFileSync(candidate)
assert.ok(bytes.length > 1024 * 1024, 'portable 候選大小異常')
assert.equal(bytes.subarray(0, 2).toString('ascii'), 'MZ', 'portable 候選缺少 MZ 標記')

const peOffset = bytes.readUInt32LE(0x3c)
assert.equal(bytes.subarray(peOffset, peOffset + 4).toString('binary'), 'PE\u0000\u0000', 'portable 候選缺少 PE 標記')
const launcherMachine = bytes.readUInt16LE(peOffset + 4)

const unpackedExecutable = resolve(releaseDirectory, 'win-unpacked', `${packageMetadata.build?.productName ?? '貼圖小鴿手'}.exe`)
const unpackedBytes = readFileSync(unpackedExecutable)
const unpackedPeOffset = unpackedBytes.readUInt32LE(0x3c)
assert.equal(unpackedBytes.subarray(unpackedPeOffset, unpackedPeOffset + 4).toString('binary'), 'PE\u0000\u0000', '未封裝應用程式缺少 PE 標記')
assert.equal(unpackedBytes.readUInt16LE(unpackedPeOffset + 4), 0x8664, '未封裝應用程式不是 Windows x64 PE')

console.log(JSON.stringify({
  candidate,
  bytes: statSync(candidate).size,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  architecture: 'x64',
  launcherMachine: `0x${launcherMachine.toString(16)}`,
  portable: true,
}, null, 2))
