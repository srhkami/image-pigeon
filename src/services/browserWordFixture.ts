import type {LayoutPreference} from '../types/project.ts'
import {
  BrowserWordExportError,
  WORD_MAX_IMAGE_BYTES,
  WORD_MAX_TOTAL_BYTES,
  type BrowserWordItem,
} from './browserWordExporter.ts'

export type WordFeasibilityFixtureSpec = {
  itemId: string
  width: 1600 | 900
  height: 900 | 1600
  layoutPreference: LayoutPreference
  remark: string
  rotation: 0 | 90 | 180 | 270
}

export type WordFixtureImageRenderer = (
  spec: Readonly<WordFeasibilityFixtureSpec>,
  index: number,
) => Promise<{imageData: Uint8Array; width: number; height: number}>

export const WORD_FIXTURE_SPEC_SHA256 = 'ac8425edf619c598b4eb6d2f178a6281035ca0ee3cf080f3bc9da547f5b84598'

const descriptions = [
  '橫式照片一',
  '橫式照片二\n第二行備註',
  '直式大圖左',
  '',
  '中文備註 01',
  '中文備註 02\n多行內容',
  '中文備註 03',
  '',
  '中文備註 05',
  '中文備註 06',
  '混合版型上方橫式',
  '混合小圖一',
  '混合小圖二\n換行',
  '混合小圖三',
  '反向混合小圖一',
  '',
  '反向混合小圖三',
  '反向混合下方橫式',
  '末頁直式左',
  '末頁直式右\n跨頁連號',
] as const

const preferences: readonly LayoutPreference[] = [
  'stacked-2', 'stacked-2',
  'side-by-side-2', 'side-by-side-2',
  'grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-6',
  'stacked-2', 'grid-6', 'grid-6', 'grid-6',
  'grid-6', 'grid-6', 'grid-6', 'stacked-2',
  'side-by-side-2', 'side-by-side-2',
]

const rotations: readonly (0 | 90 | 180 | 270)[] = [
  0, 180, 0, 90, 0, 0, 270, 0, 0, 0,
  0, 90, 0, 0, 0, 180, 0, 270, 0, 0,
]

export function buildWordFeasibilityFixtureSpecs(): WordFeasibilityFixtureSpec[] {
  return preferences.map((layoutPreference, index) => {
    const landscape = layoutPreference === 'stacked-2'
    return {
      itemId: `fixture-${String(index + 1).padStart(2, '0')}`,
      width: landscape ? 1600 : 900,
      height: landscape ? 900 : 1600,
      layoutPreference,
      remark: descriptions[index],
      rotation: rotations[index],
    }
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new BrowserWordExportError('MISSING_IMAGE', '無法建立 synthetic JPEG fixture'))
        return
      }
      resolve(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/jpeg', 0.86)
  })
}

async function renderSyntheticJpeg(spec: Readonly<WordFeasibilityFixtureSpec>, index: number) {
  if (typeof document === 'undefined') {
    throw new BrowserWordExportError('MISSING_IMAGE', 'synthetic fixture 需要瀏覽器 Canvas')
  }
  const rotated = spec.rotation === 90 || spec.rotation === 270
  const canvas = document.createElement('canvas')
  canvas.width = rotated ? spec.height : spec.width
  canvas.height = rotated ? spec.width : spec.height
  const context = canvas.getContext('2d')
  if (!context) throw new BrowserWordExportError('MISSING_IMAGE', '瀏覽器無法建立 Canvas 2D context')

  context.save()
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate(spec.rotation * Math.PI / 180)
  context.fillStyle = `hsl(${(index * 37) % 360} 55% 82%)`
  context.fillRect(-spec.width / 2, -spec.height / 2, spec.width, spec.height)
  context.strokeStyle = '#1f2937'
  context.lineWidth = 12
  context.strokeRect(-spec.width / 2 + 18, -spec.height / 2 + 18, spec.width - 36, spec.height - 36)
  context.fillStyle = '#111827'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = 'bold 72px sans-serif'
  context.fillText(spec.itemId, 0, -40)
  context.font = '40px sans-serif'
  context.fillText(`${spec.width}×${spec.height} / ${spec.rotation}°`, 0, 50)
  context.restore()

  return {
    imageData: await canvasToJpeg(canvas),
    width: canvas.width,
    height: canvas.height,
  }
}

async function sha256(data: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', data.slice().buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256WordFixtureSpecs(specs: readonly WordFeasibilityFixtureSpec[]) {
  const canonical = specs.map(({itemId, width, height, layoutPreference, remark, rotation}) => ({
    itemId,
    width,
    height,
    layoutPreference,
    remark,
    rotation,
  }))
  return sha256(new TextEncoder().encode(JSON.stringify(canonical)))
}

export async function createWordFeasibilityFixture(
  renderer: WordFixtureImageRenderer = renderSyntheticJpeg,
) {
  const specs = buildWordFeasibilityFixtureSpecs()
  const items: BrowserWordItem[] = []
  let totalBytes = 0

  for (const [index, spec] of specs.entries()) {
    const {imageData, width, height} = await renderer(spec, index)
    if (imageData.byteLength > WORD_MAX_IMAGE_BYTES) {
      throw new BrowserWordExportError('IMAGE_TOO_LARGE', `圖片 ${spec.itemId} 超過 8 MiB 上限`)
    }
    totalBytes += imageData.byteLength
    if (totalBytes > WORD_MAX_TOTAL_BYTES) {
      throw new BrowserWordExportError('TOTAL_TOO_LARGE', '圖片總量超過 80 MiB 上限')
    }
    items.push({
      itemId: spec.itemId,
      layoutPreference: spec.layoutPreference,
      remark: spec.remark,
      width,
      height,
      imageData,
      sha256: await sha256(imageData),
    })
  }

  return {items, totalBytes}
}
