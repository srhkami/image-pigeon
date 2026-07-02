import {CustomImage} from '@/utils/type.ts'
import {ProjectV2} from '@/types/project.ts'
import {getOrderedItemViewModels} from '@/state/projectState.ts'
import {AutoCollagePage, buildAutoCollageLayout} from '@/features/ImagePreview/autoCollageLayout.ts'

export type AutoCollageWordPayloadParts = {
  images: CustomImage[],
  pages: AutoCollagePage[],
}

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('轉換為 data URL 失敗'))
      }
    }

    reader.onerror = () => {
      reject(reader.error ?? new Error('轉換為 data URL 失敗'))
    }

    reader.readAsDataURL(blob)
  })
}

export async function buildLegacyOutputImages(project: ProjectV2, sessionId: string): Promise<CustomImage[]> {
  if (!sessionId) {
    throw new Error('尚未建立圖片 session，請先重新匯入圖片')
  }

  const viewModels = getOrderedItemViewModels(project, sessionId)

  const result: CustomImage[] = []

  for (const item of viewModels) {
    const response = await fetch(item.previewUrl)
    if (!response.ok) {
      throw new Error(`無法讀取圖片 ${item.itemId} 的 session 預覽：${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const dataUrl = await blobToDataUrl(blob)

    const image = new CustomImage(null, item.remark)
    image.id = item.itemId
    image.preview = item.previewUrl
    image.base64 = dataUrl
    image.width = item.assetWidth
    image.height = item.assetHeight
    image.rotation = item.rotation

    result.push(image)
  }

  return result
}

export async function buildAutoCollageWordPayloadParts(project: ProjectV2, sessionId: string): Promise<AutoCollageWordPayloadParts> {
  const viewModels = getOrderedItemViewModels(project, sessionId)
  const pages = buildAutoCollageLayout(viewModels)
  const images = await buildLegacyOutputImages(project, sessionId)

  return {
    images,
    pages,
  }
}
