export type Crop = {
  x: number
  y: number
  width: number
  height: number
  unit: 'ratio'
}

export type Asset = {
  id: string
  file: string
  mime: string
  width: number
  height: number
  originalName: string | null
  size: number
}

export type Item = {
  id: string
  type: 'image'
  assetId: string
  remark: string
  rotation: 0 | 90 | 180 | 270
  crop: Crop
  portraitSize?: 'large' | 'small'
}

export type WordCompatibleGridLayout = {
  id: string
  type: 'word-compatible-grid'
  itemOrder: string[]
}

export type ProjectDocument = {
  title: string
}

export type ProjectV2 = {
  schema: 'image-pigeon.project'
  version: number
  document: ProjectDocument
  assets: Asset[]
  items: Item[]
  layouts: WordCompatibleGridLayout[]
}

export type ProjectImportData = {
  sessionId: string
  assets: Asset[]
  items: Item[]
  layoutPatch: {
    appendItemOrder: string[]
  }
  segments?: number
  skipped?: string[]
  errors?: Array<{ filename: string; message: string }>
}

export type ProjectImportResponse = {
  status: number
  message: string
  data: ProjectImportData
  detail?: string
}

export type ProjectItemViewModel = {
  itemId: string
  itemType: 'image'
  remark: string
  rotation: 0 | 90 | 180 | 270
  assetId: string
  crop: Crop
  orientation: 'landscape' | 'portrait'
  portraitSize: 'large' | 'small'
  collageKind: 'landscape' | 'portrait-large' | 'portrait-small'
  assetWidth: number
  assetHeight: number
  assetSize: number
  mime: string
  originalName: string | null
  previewUrl: string
}

export type ProjectSaveResponse = {
  status: number
  message: string
  data: {
    path: string
    project: ProjectV2
  }
  detail?: string
}

export type ProjectOpenResponse = {
  status: number
  message: string
  data: {
    sessionId: string
    project: ProjectV2
  }
  detail?: string
}
