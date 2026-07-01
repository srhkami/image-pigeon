import {ProjectImportData} from '@/types/project.ts'
import {CustomImage} from '@/utils/type.ts'
import {getAssetImageUrl} from '@/services/imageApi.ts'
import {ProjectV2} from '@/types/project.ts'
import {getOrderedItemViewModels} from '@/state/projectState.ts'

type RemarkMode = {
  isFileNameMode: boolean
  defaultRemark: string
}

export function applyImportRemarks(
  importData: ProjectImportData,
  remarkMode: RemarkMode,
): ProjectImportData {
  const assetMap = new Map(importData.assets.map((asset) => [asset.id, asset]))

  return {
    ...importData,
    items: importData.items.map((item) => {
      const asset = assetMap.get(item.assetId)
      const remark = remarkMode.isFileNameMode
        ? (asset?.originalName ?? remarkMode.defaultRemark)
        : remarkMode.defaultRemark

      return {
        ...item,
        remark,
      }
    }),
  }
}

export function toCustomImagesFromImportData(
  importData: ProjectImportData,
  sessionId: string,
  remarkMode: RemarkMode,
): CustomImage[] {
  const importDataWithRemarks = applyImportRemarks(importData, remarkMode)
  const assetMap = new Map(importDataWithRemarks.assets.map((asset) => [asset.id, asset]))

  return importDataWithRemarks.items
    .map((item) => {
      const asset = assetMap.get(item.assetId)
      if (!asset) {
        return null
      }

      const image = new CustomImage(null, item.remark)
      image.id = item.id
      image.preview = getAssetImageUrl(sessionId, asset.id)
      image.width = asset.width
      image.height = asset.height
      image.rotation = item.rotation

      return image
    })
    .filter((item): item is CustomImage => Boolean(item))
}

export function toCustomImagesFromProject(project: ProjectV2, sessionId: string): CustomImage[] {
  const viewModels = getOrderedItemViewModels(project, sessionId)

  return viewModels
    .map((item) => {
      const image = new CustomImage(null, item.remark)
      image.id = item.itemId
      image.preview = item.previewUrl
      image.width = item.assetWidth
      image.height = item.assetHeight
      image.rotation = item.rotation
      return image
    })
}
