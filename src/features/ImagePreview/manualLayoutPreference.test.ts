import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {buildAutoCollageLayout} from './autoCollageLayout.ts'

const source = (itemId: string, layoutPreference: 'stacked-2' | 'side-by-side-2' | 'grid-6') => ({
  itemId,
  layoutPreference,
})

test('排版演算法只依 layoutPreference 決定容量與混合模板', () => {
  const pages = buildAutoCollageLayout([
    source('item-01', 'stacked-2'),
    source('item-02', 'grid-6'),
    source('item-03', 'grid-6'),
    source('item-04', 'grid-6'),
    source('item-05', 'side-by-side-2'),
    source('item-06', 'side-by-side-2'),
  ])

  assert.deepEqual(
    pages.map((page) => page.template),
    ['mixed-landscape1-small3', 'portrait-large-2'],
  )
  assert.deepEqual(
    pages.map((page) => page.slots.map((slot) => slot.itemId)),
    [['item-01', 'item-02', 'item-03', 'item-04'], ['item-05', 'item-06']],
  )
})

test('排版演算法保留六張空 slot 與穩定 page、slot id', () => {
  const pages = buildAutoCollageLayout([source('item-01', 'grid-6')])

  assert.equal(pages[0]?.pageId, 'page-01')
  assert.equal(pages[0]?.template, 'portrait-small-6')
  assert.deepEqual(
    pages[0]?.slots.map((slot) => ({slotId: slot.slotId, itemId: slot.itemId})),
    [
      {slotId: 'page-01-slot-1', itemId: 'item-01'},
      {slotId: 'page-01-slot-2', itemId: null},
      {slotId: 'page-01-slot-3', itemId: null},
      {slotId: 'page-01-slot-4', itemId: null},
      {slotId: 'page-01-slot-5', itemId: null},
      {slotId: 'page-01-slot-6', itemId: null},
    ],
  )
})

test('前端狀態以已保存 layoutPreference 為權威，旋轉不覆寫它', () => {
  const sourceText = readFileSync(new URL('../../state/projectState.ts', import.meta.url), 'utf8')

  assert.match(sourceText, /layoutPreference/)
  assert.match(sourceText, /updateItemLayoutPreference/)
  assert.match(sourceText, /\? \{\.\.\.item, rotation\}/)
  assert.doesNotMatch(sourceText, /\? \{\.\.\.item, rotation, layoutPreference:/)
})

test('焦點預覽只把刪除放在右上，排版選擇器與旋轉控制同列', () => {
  const sourceText = readFileSync(new URL('./FocusImageCard.tsx', import.meta.url), 'utf8')

  assert.match(sourceText, /aria-label='刪除圖片'/)
  assert.match(sourceText, /flex items-center justify-between[^>]*><span className='badge badge-outline'>#\{index \+ 1\}<\/span>\{isActive && <button type='button' aria-label='刪除圖片'/)
  assert.doesNotMatch(sourceText, /badge-info'\}>\{orientation\}/)
  assert.match(sourceText, /ml-auto[^>]*>\{LAYOUT_OPTIONS\.map/)
  assert.doesNotMatch(sourceText, /LAYOUT_OPTIONS\.map[\s\S]*btn btn-xs/)
  assert.doesNotMatch(sourceText, /absolute bottom-2 right-2[^>]*>\{LAYOUT_OPTIONS\.map/)
})

test('Word 輸出與預覽共用同一個自動分頁 builder', () => {
  const sourceText = readFileSync(new URL('../../state/projectOutputAdapter.ts', import.meta.url), 'utf8')

  assert.match(sourceText, /import \{AutoCollagePage, buildAutoCollageLayout\}/)
  assert.match(sourceText, /const pages = buildAutoCollageLayout\(viewModels\)/)
})
