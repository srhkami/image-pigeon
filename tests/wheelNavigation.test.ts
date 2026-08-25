import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {activateItemByOffset, blurActiveElement} from '../src/features/ImagePreview/wheelNavigation.ts'
import * as wheelNavigation from '../src/features/ImagePreview/wheelNavigation.ts'

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

test('焦點預覽刪除流程會在移除專案項目前決定鄰近焦點', () => {
  const sourceText = readFileSync(new URL('../src/features/ImagePreview/ImagePreview.tsx', import.meta.url), 'utf8')

  assert.match(sourceText, /setActiveItemId\(getActiveItemIdAfterRemoval\(sortableItemIds, itemId\)\)/)
  assert.match(sourceText, /onRemoveItem=\{handleRemoveItem\}/)
})