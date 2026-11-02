export type Crop = {
  x: number
  y: number
  width: number
  height: number
  unit: 'ratio'
}

export type LayoutPreference = 'stacked-2' | 'side-by-side-2' | 'grid-4' | 'grid-6'

export type BasicAnnotationKind = 'ellipse' | 'rectangle' | 'line' | 'arrow' | 'double-arrow'
export type MagnificationKind = 'magnify-circle' | 'magnify-rectangle'
export type AnnotationKind = BasicAnnotationKind | MagnificationKind
export type AnnotationStrokeWidthLevel = 1 | 2 | 3 | 4 | 5
type AnnotationStrokeStyle = {stroke: string; strokeWidthLevel?: AnnotationStrokeWidthLevel}
export type AnnotationStyle = AnnotationStrokeStyle & {fill: string | null}
export type AnnotationRect = {x: number; y: number; width: number; height: number}
export type MagnificationTool = AnnotationStrokeStyle & {kind: MagnificationKind}
export type MagnificationAnnotation = AnnotationRect & AnnotationStrokeStyle & {id: string; kind: MagnificationKind; source: AnnotationRect}
export type ImageAnnotation = (
  | {kind: 'ellipse' | 'rectangle'; x: number; y: number; width: number; height: number; fill: string | null}
  | {kind: 'line' | 'arrow' | 'double-arrow'; x1: number; y1: number; x2: number; y2: number}
  | MagnificationAnnotation
) & {id: string} & AnnotationStrokeStyle

export type AnnotationEditor = {
  scope: string
  selectedId: string | null
  magnificationTool?: MagnificationTool | null
  onMagnificationToolChange?: (tool: MagnificationTool | null) => void
  onSelect: (id: string | null) => void
  onChange: (annotations: ImageAnnotation[], expected: readonly ImageAnnotation[]) => void
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
  layoutPreference?: LayoutPreference
  annotations?: ImageAnnotation[]
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
  annotations?: ImageAnnotation[]
}
