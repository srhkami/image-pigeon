import assert from 'node:assert/strict'
import test from 'node:test'

import {activateItemByOffset, blurActiveElement} from '../src/features/ImagePreview/wheelNavigation.ts'

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