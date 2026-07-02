import {
  Asset,
  Item,
  ProjectImportData,
  ProjectItemViewModel,
  ProjectV2,
  WordCompatibleGridLayout,
} from '@/types/project.ts'
import {getAssetImageUrl} from '@/services/imageApi.ts'

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

export function getOrderedItemViewModels(project: ProjectV2, sessionId: string): ProjectItemViewModel[] {
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

      const orientation = asset.width >= asset.height ? 'landscape' : 'portrait'
      const portraitSize = item.portraitSize ?? 'large'
      const collageKind = orientation === 'landscape'
        ? 'landscape'
        : portraitSize === 'large'
          ? 'portrait-large'
          : 'portrait-small'

      return {
        itemId: item.id,
        itemType: item.type,
        remark: item.remark,
        rotation: item.rotation,
        assetId: item.assetId,
        crop: item.crop,
        orientation,
        portraitSize,
        collageKind,
        assetWidth: asset.width,
        assetHeight: asset.height,
        assetSize: asset.size,
        mime: asset.mime,
        originalName: asset.originalName,
        previewUrl: getAssetImageUrl(sessionId, asset.id),
      }
    })
    .filter((item): item is ProjectItemViewModel => Boolean(item))
}

export function removeItem(project: ProjectV2, itemId: string): ProjectV2 {
  const defaultLayout = getDefaultLayout(project)
  const nextLayout: WordCompatibleGridLayout = {
    ...defaultLayout,
    itemOrder: defaultLayout.itemOrder.filter((id) => id !== itemId),
  }

  return {
    ...replaceDefaultLayout(
      {
        ...project,
        items: project.items.filter((item) => item.id !== itemId),
      },
      nextLayout,
    ),
  }
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

export function updateItemPortraitSize(project: ProjectV2, itemId: string, portraitSize: 'large' | 'small'): ProjectV2 {
  return {
    ...project,
    items: project.items.map((item) => item.id === itemId
      ? {...item, portraitSize}
      : item),
  }
}
