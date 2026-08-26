import type {
  Asset,
  Item,
  LayoutPreference,
  ProjectImportData,
  ProjectItemViewModel,
  ProjectV2,
  WordCompatibleGridLayout,
} from '../types/project.ts'
import {browserAssetStore} from '../services/browserAssetStore.ts'

const DEFAULT_LAYOUT_ID = 'layout_word_default'
const DEFAULT_LAYOUT_TYPE: WordCompatibleGridLayout['type'] = 'word-compatible-grid'

export function createEmptyProject(): ProjectV2 {
  return {
    schema: 'image-pigeon.project',
    version: 2,
    document: {
      title: '照片黏貼表',
    },
    assets: [],
    items: [],
    layouts: [
      {
        id: DEFAULT_LAYOUT_ID,
        type: DEFAULT_LAYOUT_TYPE,
        itemOrder: [],
      },
    ],
  }
}

export function getDefaultLayout(project: ProjectV2): WordCompatibleGridLayout {
  const defaultById = project.layouts.find((layout) => layout.id === DEFAULT_LAYOUT_ID)
  if (defaultById) {
    return defaultById
  }

  const firstWordGrid = project.layouts.find((layout) => layout.type === 'word-compatible-grid')
  if (firstWordGrid) {
    return firstWordGrid
  }

  return {
    id: DEFAULT_LAYOUT_ID,
    type: DEFAULT_LAYOUT_TYPE,
    itemOrder: [],
  }
}

const replaceDefaultLayout = (project: ProjectV2, nextLayout: WordCompatibleGridLayout): ProjectV2 => {
  const existingIndex = project.layouts.findIndex((layout) => layout.id === nextLayout.id)
  if (existingIndex >= 0) {
    const layouts = [...project.layouts]
    layouts[existingIndex] = nextLayout
    return {
      ...project,
      layouts,
    }
  }

  return {
    ...project,
    layouts: [...project.layouts, nextLayout],
  }
}

const getEffectiveAssetDimensions = (asset: Asset, rotation: Item['rotation']) => {
  if (rotation === 90 || rotation === 270) {
    return {
      width: asset.height,
      height: asset.width,
    }
  }

  return {
    width: asset.width,
    height: asset.height,
  }
}

export const getInitialLayoutPreference = (
  asset: Asset,
  rotation: Item['rotation'],
  portraitSize: 'large' | 'small' = 'large',
): LayoutPreference => {
  const {width, height} = getEffectiveAssetDimensions(asset, rotation)
  if (width >= height) return 'stacked-2'
  return portraitSize === 'small' ? 'grid-6' : 'side-by-side-2'
}

export function applyImportResult(project: ProjectV2, importData: ProjectImportData): ProjectV2 {
  const defaultLayout = getDefaultLayout(project)
  const nextLayout: WordCompatibleGridLayout = {
    ...defaultLayout,
    itemOrder: [...defaultLayout.itemOrder, ...importData.layoutPatch.appendItemOrder],
  }

  const updatedProject: ProjectV2 = {
    ...project,
    assets: [...project.assets, ...importData.assets],
    items: [...project.items, ...importData.items],
  }

  return {
    ...replaceDefaultLayout(updatedProject, nextLayout),
  }
}

export function getOrderedItemViewModels(project: ProjectV2, sessionId?: string): ProjectItemViewModel[] {
  void sessionId
  const defaultLayout = getDefaultLayout(project)
  const itemOrder = defaultLayout.itemOrder
  const itemMap = new Map<string, Item>(project.items.map((item) => [item.id, item]))
  const assetMap = new Map<string, Asset>(project.assets.map((asset) => [asset.id, asset]))

  const orderedItems = [
    ...itemOrder
      .map((itemId) => itemMap.get(itemId))
      .filter((item): item is Item => Boolean(item)),
    ...project.items.filter((item) => !itemOrder.includes(item.id)),
  ]

  return orderedItems
    .map((item): ProjectItemViewModel | null => {
      const asset = assetMap.get(item.assetId)
      if (!asset) {
        return null
      }

      const effectiveDimensions = getEffectiveAssetDimensions(asset, item.rotation)
      const orientation = effectiveDimensions.width >= effectiveDimensions.height ? 'landscape' : 'portrait'
      const portraitSize = item.portraitSize ?? 'large'
      const layoutPreference = item.layoutPreference
        ?? getInitialLayoutPreference(asset, item.rotation, portraitSize)

      return {
        itemId: item.id,
        itemType: item.type,
        remark: item.remark,
        rotation: item.rotation,
        assetId: item.assetId,
        crop: item.crop,
        orientation,
        portraitSize,
        layoutPreference,
        assetWidth: effectiveDimensions.width,
        assetHeight: effectiveDimensions.height,
        assetSize: asset.size,
        mime: asset.mime,
        originalName: asset.originalName,
        previewUrl: browserAssetStore.getUrl(asset.id),
      }
    })
    .filter((item): item is ProjectItemViewModel => Boolean(item))
}

export function applyBatchRotation(project: ProjectV2, itemIds: ReadonlySet<string>, offset: 90 | -90): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => {
      if (!itemIds.has(item.id)) return item
      return {...item, rotation: ((item.rotation + offset) % 360 + 360) % 360 as Item['rotation']}
    }),
  }
}

export function applyBatchLayoutPreference(
  project: ProjectV2,
  itemIds: ReadonlySet<string>,
  layoutPreference: LayoutPreference,
): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => itemIds.has(item.id) ? {...item, layoutPreference} : item),
  }
}

export function removeItems(project: ProjectV2, itemIds: ReadonlySet<string>): ProjectV2 {
  const existingItemIds = new Set(project.items.map((item) => item.id))
  const removedItemIds = new Set([...itemIds].filter((itemId) => existingItemIds.has(itemId)))
  if (!removedItemIds.size) return project

  const items = project.items.filter((item) => !removedItemIds.has(item.id))
  const referencedAssetIds = new Set(items.map((item) => item.assetId))

  return {
    ...project,
    items,
    assets: project.assets.filter((asset) => referencedAssetIds.has(asset.id)),
    layouts: project.layouts.map((layout) => ({
      ...layout,
      itemOrder: layout.itemOrder.filter((itemId) => !removedItemIds.has(itemId)),
    })),
  }
}

export function removeItem(project: ProjectV2, itemId: string): ProjectV2 {
  return removeItems(project, new Set([itemId]))
}

export function clearProjectItems(project: ProjectV2): ProjectV2 {
  const defaultLayout = getDefaultLayout(project)
  const nextLayout: WordCompatibleGridLayout = {
    ...defaultLayout,
    itemOrder: [],
  }

  return {
    ...replaceDefaultLayout(
      {
        ...project,
        items: [],
      },
      nextLayout,
    ),
  }
}

export function reorderItem(project: ProjectV2, activeId: string, overId: string): ProjectV2 {
  if (activeId === overId) {
    return project
  }

  const defaultLayout = getDefaultLayout(project)
  const currentOrder = [...defaultLayout.itemOrder]
  const activeIndex = currentOrder.indexOf(activeId)
  const overIndex = currentOrder.indexOf(overId)
  if (activeIndex === -1 || overIndex === -1) {
    return project
  }

  const nextOrder = [...currentOrder]
  const [movingItem] = nextOrder.splice(activeIndex, 1)
  nextOrder.splice(overIndex, 0, movingItem)

  return {
    ...project,
    ...replaceDefaultLayout(project, {
      ...defaultLayout,
      itemOrder: nextOrder,
    }),
  }
}

export function updateItemRemark(project: ProjectV2, itemId: string, remark: string): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => item.id === itemId
      ? {...item, remark}
      : item),
  }
}

export function updateItemRotation(project: ProjectV2, itemId: string, rotation: 0 | 90 | 180 | 270): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => item.id === itemId
      ? {...item, rotation}
      : item),
  }
}

export function updateItemLayoutPreference(
  project: ProjectV2,
  itemId: string,
  layoutPreference: LayoutPreference,
): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => item.id === itemId
      ? {...item, layoutPreference}
      : item),
  }
}

export function updateItemPortraitSize(project: ProjectV2, itemId: string, portraitSize: 'large' | 'small'): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => item.id === itemId
      ? {...item, portraitSize}
      : item),
  }
}
