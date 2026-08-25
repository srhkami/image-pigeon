export type Crop = {
  x: number
  y: number
  width: number
  height: number
  unit: 'ratio'
}

export type LayoutPreference = 'stacked-2' | 'side-by-side-2' | 'grid-6'

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
  layoutPreference?: LayoutPreference
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
  assets: Asset[]
  items: Item[]
  layoutPatch: {
    appendItemOrder: string[]
  }
  segments?: number
  skipped?: string[]
  errors?: Array<{ filename: string; message: string }>
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
  layoutPreference: LayoutPreference
  assetWidth: number
  assetHeight: number
  assetSize: number
  mime: string
  originalName: string | null
  previewUrl: string
}
