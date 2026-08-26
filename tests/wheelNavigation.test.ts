import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {activateItemByOffset, blurActiveElement} from '../src/features/ImagePreview/wheelNavigation.ts'
import * as wheelNavigation from '../src/features/ImagePreview/wheelNavigation.ts'
import type {ProjectV2} from '../src/types/project.ts'
import * as projectState from '../src/state/projectState.ts'

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const crop = {x: 0, y: 0, width: 1, height: 1, unit: 'ratio' as const}
const batchProject: ProjectV2 = {
  schema: 'image-pigeon.project',
  version: 2,
  document: {title: '批次測試'},
  assets: [
    {id: 'asset-shared', file: 'shared', mime: 'image/png', width: 100, height: 100, originalName: null, size: 10},
    {id: 'asset-orphan', file: 'orphan', mime: 'image/png', width: 100, height: 100, originalName: null, size: 10},
    {id: 'asset-kept', file: 'kept', mime: 'image/png', width: 100, height: 100, originalName: null, size: 10},
    {id: 'asset-preexisting-orphan', file: 'preexisting-orphan', mime: 'image/png', width: 100, height: 100, originalName: null, size: 10},
  ],
  items: [
    {id: 'item-1', type: 'image', assetId: 'asset-shared', remark: '', rotation: 0, crop, layoutPreference: 'stacked-2'},
    {id: 'item-2', type: 'image', assetId: 'asset-shared', remark: '', rotation: 90, crop, layoutPreference: 'side-by-side-2'},
    {id: 'item-3', type: 'image', assetId: 'asset-orphan', remark: '', rotation: 180, crop, layoutPreference: 'grid-6'},
    {id: 'item-4', type: 'image', assetId: 'asset-kept', remark: '', rotation: 270, crop, layoutPreference: 'stacked-2'},
  ],
  layouts: [
    {id: 'layout_word_default', type: 'word-compatible-grid', itemOrder: ['item-1', 'item-2', 'item-3', 'item-4']},
    {id: 'secondary', type: 'word-compatible-grid', itemOrder: ['item-4', 'item-3', 'item-2', 'item-1']},
  ],
}

test('常見單階行模式滾輪位移可跨越切圖門檻', () => {
  const sourceText = readFileSync(new URL('../src/features/ImagePreview/ImagePreview.tsx', import.meta.url), 'utf8')
  const thresholdMatch = sourceText.match(/const WHEEL_THRESHOLD = (\d+)/)

  assert.ok(thresholdMatch, '應定義滾輪切圖門檻')
  const threshold = Number(thresholdMatch[1])
  const commonSingleStepLineDelta = 3 * 16

  assert.ok(commonSingleStepLineDelta >= threshold, `單階位移 ${commonSingleStepLineDelta} 應達到門檻 ${threshold}`)
})

test('切換焦點圖片前會讓目前輸入欄位失焦以提交備註', () => {
  let didBlur = false

  blurActiveElement({
    blur: () => {
      didBlur = true
    },
  })

  assert.equal(didBlur, true)
})

test('沒有目前焦點元素時可安全略過', () => {
  assert.doesNotThrow(() => blurActiveElement(null))
})

test('滾輪切換圖片時會先提交備註再更新目前圖片', () => {
  let didSaveRemark = false
  let activeItemId = 'item-1'

  const didSwitch = activateItemByOffset({
    activeItemIndex: 0,
    itemIds: ['item-1', 'item-2'],
    offset: 1,
    activeElement: {
      blur: () => {
        didSaveRemark = true
      },
    },
    setActiveItemId: (itemId) => {
      assert.equal(didSaveRemark, true)
      activeItemId = itemId
    },
  })

  assert.equal(didSwitch, true)
  assert.equal(activeItemId, 'item-2')
})

test('已在清單邊界時不會讓備註欄位失焦', () => {
  let didBlur = false

  const didSwitch = activateItemByOffset({
    activeItemIndex: 1,
    itemIds: ['item-1', 'item-2'],
    offset: 1,
    activeElement: {
      blur: () => {
        didBlur = true
      },
    },
    setActiveItemId: () => {
      throw new Error('不應切換圖片')
    },
  })

  assert.equal(didSwitch, false)
  assert.equal(didBlur, false)
})

test('刪除目前圖片後優先聚焦下一張，最後一張則回到前一張', () => {
  const getActiveItemIdAfterRemoval = Reflect.get(wheelNavigation, 'getActiveItemIdAfterRemoval')
  assert.equal(typeof getActiveItemIdAfterRemoval, 'function')

  assert.equal(getActiveItemIdAfterRemoval(['item-1', 'item-2', 'item-3'], 'item-2'), 'item-3')
  assert.equal(getActiveItemIdAfterRemoval(['item-1', 'item-2', 'item-3'], 'item-3'), 'item-2')
  assert.equal(getActiveItemIdAfterRemoval(['item-1'], 'item-1'), null)
})

test('批次刪除後保留未刪除的作用中項目，否則優先後方再前方', () => {
  const getActiveItemIdAfterRemovingItems = Reflect.get(wheelNavigation, 'getActiveItemIdAfterRemovingItems')
  assert.equal(typeof getActiveItemIdAfterRemovingItems, 'function')

  assert.equal(getActiveItemIdAfterRemovingItems(['item-1', 'item-2', 'item-3', 'item-4'], 'item-2', new Set(['item-3'])), 'item-2')
  assert.equal(getActiveItemIdAfterRemovingItems(['item-1', 'item-2', 'item-3', 'item-4'], 'item-2', new Set(['item-2', 'item-3'])), 'item-4')
  assert.equal(getActiveItemIdAfterRemovingItems(['item-1', 'item-2', 'item-3'], 'item-3', new Set(['item-2', 'item-3'])), 'item-1')
  assert.equal(getActiveItemIdAfterRemovingItems(['item-1'], 'item-1', new Set(['item-1'])), null)
})

test('焦點預覽刪除流程會委派 App 共用刪除操作並保留單張入口', () => {
  const sourceText = readFileSync(new URL('../src/features/ImagePreview/ImagePreview.tsx', import.meta.url), 'utf8')
  const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

  assert.match(sourceText, /onRemoveItems\(new Set\(\[itemId\]\)\)/)
  assert.match(sourceText, /onRemoveItem=\{handleRemoveItem\}/)
  assert.match(appSource, /getActiveItemIdAfterRemovingItems/)
  assert.match(appSource, /setActiveItemId\(\(current\) => getActiveItemIdAfterRemovingItems\(/)
})

test('批次相對旋轉只更新選取項目並正確環回', () => {
  const left = projectState.applyBatchRotation(batchProject, new Set(['item-1', 'item-2', 'unknown']), -90)
  assert.deepEqual(left.items.map(item => item.rotation), [270, 0, 180, 270])
  assert.deepEqual(left.items.map(item => item.layoutPreference), batchProject.items.map(item => item.layoutPreference))

  const right = projectState.applyBatchRotation(batchProject, new Set(['item-3', 'item-4']), 90)
  assert.deepEqual(right.items.map(item => item.rotation), [0, 90, 270, 0])
})

test('批次排版只更新選取項目且不改旋轉', () => {
  const result = projectState.applyBatchLayoutPreference(batchProject, new Set(['item-2', 'item-3', 'unknown']), 'grid-6')
  assert.deepEqual(result.items.map(item => item.layoutPreference), ['stacked-2', 'grid-6', 'grid-6', 'stacked-2'])
  assert.deepEqual(result.items.map(item => item.rotation), batchProject.items.map(item => item.rotation))
})

test('批次刪除會清理所有排版順序與本次成為孤立的資產，並保留共享資產', () => {
  const result = projectState.removeItems(batchProject, new Set(['item-1', 'item-3', 'unknown']))
  assert.deepEqual(result.items.map(item => item.id), ['item-2', 'item-4'])
  assert.deepEqual(result.layouts.map(layout => layout.itemOrder), [['item-2', 'item-4'], ['item-4', 'item-2']])
  assert.deepEqual(result.assets.map(asset => asset.id), ['asset-shared', 'asset-kept'])
})

test('批次刪除只有未知 ID 時不清理既有狀態', () => {
  assert.equal(projectState.removeItems(batchProject, new Set(['unknown'])), batchProject)
})

test('批次刪除前由 App 依目前排序決定鄰近焦點', () => {
  const appSource = readSource('../src/App.tsx')
  const previewSource = readSource('../src/features/ImagePreview/ImagePreview.tsx')

  assert.match(appSource, /const \[activeItemId, setActiveItemId\]/)
  assert.match(appSource, /getActiveItemIdAfterRemovingItems\([\s\S]*?current,[\s\S]*?itemIds,[\s\S]*?\)\)/)
  assert.match(appSource, /activeItemId=\{activeItemId\}/)
  assert.match(previewSource, /readonly activeItemId: string \| null/)
  assert.doesNotMatch(previewSource, /useState<string \| null>\(null\)/)
})

test('排序卡片使用原生核取控制，拖曳把手不再把整張卡片設為拖曳啟用區', () => {
  const cardSource = readSource('../src/features/ImagePreview/ImageCardForMove.tsx')
  assert.match(cardSource, /type='checkbox'/)
  assert.match(cardSource, /checked=\{isSelected\}/)
  assert.doesNotMatch(cardSource, /setActiveItemId|isActive/)
  assert.doesNotMatch(cardSource, /<div[^>]*\{\.\.\.attributes\}/)
  assert.match(cardSource, /<button[\s\S]*\{\.\.\.attributes\}[\s\S]*\{\.\.\.listeners\}/)
})

test('排序卡片將圖片置中並固定編號、排版、選取框與拖曳把手位置', () => {
  const cardSource = readSource('../src/features/ImagePreview/ImageCardForMove.tsx')
  const listSource = readSource('../src/features/ImagePreview/SortableImageList.tsx')

  assert.match(cardSource, /className='absolute left-3 top-3[^']*'>#\{index \+ 1\}/)
  assert.match(cardSource, /className=\{`absolute bottom-3 right-3[^`]*\$\{layoutTag\.style\}`\}>\{layoutTag\.label\}/)
  assert.match(cardSource, /<label className='absolute bottom-3 left-3[^']*'/)
  assert.match(cardSource, /className=\{twMerge\('absolute left-3 top-1\/2 -translate-y-1\/2/)
  assert.match(cardSource, /<figure[\s\S]*?className='mx-auto flex[^']*items-center justify-center/)
  assert.match(listSource, /overflow-y-auto[^']*pt-3/)
})

test('側邊欄批次按鈕使用真正的 disabled 屬性且全部清除已退場', () => {
  const sidebarSource = readSource('../src/layout/Sidebar.tsx')
  assert.doesNotMatch(sidebarSource, /全部清除|onClearProject/)
  assert.match(sidebarSource, /<button[^>]*disabled=\{!hasSelection\}/)
  assert.match(sidebarSource, /<MdDeleteForever\/>刪除已選圖片/)
})

test('批次刪除確認綁定顯示時的專案 session 與選取 ID，舊確認不得覆寫新專案', () => {
  const appSource = readSource('../src/App.tsx')
  const sidebarSource = readSource('../src/layout/Sidebar.tsx')

  assert.match(appSource, /const projectRef = useRef\(project\)/)
  assert.match(appSource, /const sessionIdRef = useRef\(sessionId\)/)
  assert.match(appSource, /if \(sessionIdRef\.current !== expectedSessionId\)/)
  assert.match(appSource, /const currentProject = projectRef\.current/)
  assert.match(sidebarSource, /const confirmedSessionId = sessionId/)
  assert.match(sidebarSource, /const confirmedItemIds = new Set\(selectedItemIds\)/)
  assert.match(sidebarSource, /onRemoveSelected\(confirmedItemIds, confirmedSessionId\)/)
})

test('成功開啟專案會建立新的 session，讓相同 item ID 的舊選取失效', () => {
  const appSource = readSource('../src/App.tsx')
  const sidebarSource = readSource('../src/layout/Sidebar.tsx')

  assert.match(appSource, /const projectSessionSequenceRef = useRef\(0\)/)
  assert.match(appSource, /const nextSessionId = `project-\$\{\+\+projectSessionSequenceRef\.current\}`/)
  assert.match(appSource, /setSessionId\(nextSessionId\)/)
  assert.match(appSource, /onProjectOpened=\{startProjectSession\}/)
  assert.match(sidebarSource, /setSessionId=\{\(\) => onProjectOpened\(\)\}/)
})