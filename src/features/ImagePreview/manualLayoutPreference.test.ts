import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'

import {buildAutoCollageLayout} from './autoCollageLayout.ts'
import {AUTO_COLLAGE_LAYOUT_FIXTURES} from './autoCollageLayout.fixtures.ts'
import type {LayoutPreference, ProjectV2} from '../../types/project.ts'
import {applyBatchLayoutPreference, applyBatchRotation, createEmptyProject, getInitialLayoutPreference, getOrderedItemViewModels, updateItemLayoutPreference, updateItemRotation} from '../../state/projectState.ts'
import {browserAssetStore} from '../../services/browserAssetStore.ts'

const source = (itemId: string, layoutPreference: LayoutPreference) => ({
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

test('六張後接上下時，上下圖片固定放在混合版型的底部橫圖位置', () => {
  const pages = buildAutoCollageLayout([
    source('grid-01', 'grid-6'),
    source('stacked-01', 'stacked-2'),
  ])

  assert.equal(pages[0]?.template, 'mixed-small3-landscape1')
  assert.deepEqual(
    pages[0]?.slots.map((slot) => [slot.role, slot.itemId]),
    [
      ['mixed-small-bottom-left', 'grid-01'],
      ['mixed-small-bottom-middle', null],
      ['mixed-small-bottom-right', null],
      ['mixed-landscape-bottom', 'stacked-01'],
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
  assert.match(sourceText, /flex items-center justify-between[^>]*>\s*<span className='badge badge-outline'>#\{index \+ 1\}<\/span>\s*\{isActive &&\s*<button type='button' aria-label='刪除圖片'/)
  assert.doesNotMatch(sourceText, /badge-info'\}>\{orientation\}/)
  assert.match(sourceText, /ml-auto[^>]*>\{LAYOUT_OPTIONS\.map/)
  assert.doesNotMatch(sourceText, /LAYOUT_OPTIONS\.map[\s\S]*btn btn-xs/)
  assert.doesNotMatch(sourceText, /absolute bottom-2 right-2[^>]*>\{LAYOUT_OPTIONS\.map/)
})

test('Word exporter 與預覽共用同一個自動分頁 builder', () => {
  const sourceText = readFileSync(new URL('../../services/browserWordExporter.ts', import.meta.url), 'utf8')

  assert.match(sourceText, /import \{buildAutoCollageLayout, type AutoCollagePage\}/)
  assert.match(sourceText, /const layout = buildAutoCollageLayout\(options\.items\)/)
})

test('排序模式放大圖片並顯示目前排版偏好', () => {
  const sourceText = readFileSync(new URL('./ImageCardForMove.tsx', import.meta.url), 'utf8')

  assert.match(sourceText, /'stacked-2': \{label: '上下'/)
  assert.match(sourceText, /'side-by-side-2': \{label: '左右'/)
  assert.match(sourceText, /'grid-6': \{label: '六張'/)
  assert.doesNotMatch(sourceText, /viewModel\.orientation/)
  assert.doesNotMatch(sourceText, /viewModel\.portraitSize/)
  assert.match(sourceText, /aspect-video h-72 w-\[32rem\]/)
  assert.match(sourceText, /object-contain w-full h-full/)
  assert.doesNotMatch(sourceText, /viewModel\.remark/)
  assert.doesNotMatch(sourceText, /viewModel\.originalName/)
  assert.doesNotMatch(sourceText, /summaryText/)
  assert.match(sourceText, /tabIndex=\{0\}/)
  assert.match(sourceText, /onKeyDown=/)
  assert.match(sourceText, /relative flex w-full items-center justify-center/)
  assert.match(sourceText, /w-\[32rem\] max-w-full/)
  assert.doesNotMatch(sourceText, /w-\[32rem\][^']*shrink-0/)
})

test('四張依左上、右上、左下、右下分頁，滿頁、末頁留空與跨頁完整保留順序', () => {
  const roles = ['grid-4-top-left', 'grid-4-top-right', 'grid-4-bottom-left', 'grid-4-bottom-right']
  for (let count = 1; count <= 9; count += 1) {
    const items = Array.from({length: count}, (_, index) => source(`four-${index + 1}`, 'grid-4'))
    const pages = buildAutoCollageLayout(items)
    assert.equal(pages.length, Math.ceil(count / 4))
    assert.deepEqual(pages.flatMap((page) => page.slots.flatMap((slot) => slot.itemId ? [slot.itemId] : [])), items.map((item) => item.itemId))
    pages.forEach((page, index) => {
      assert.equal(page.template, 'grid-4')
      assert.equal(page.pageId, `page-${String(index + 1).padStart(2, '0')}`)
      assert.deepEqual(page.slots.map((slot) => slot.role), roles)
      assert.deepEqual(page.slots.map((slot) => slot.order), [1, 2, 3, 4])
      assert.deepEqual(page.slots.map((slot) => slot.slotId), [1, 2, 3, 4].map((n) => `${page.pageId}-slot-${n}`))
      assert.deepEqual(page.slots.map((slot) => slot.itemId), Array.from({length: 4}, (_, n) => items[index * 4 + n]?.itemId ?? null))
    })
  }
})

test('四張與上下或六張半頁混排、不跨其他偏好補圖，完整保留順序', () => {
  const preferences: LayoutPreference[] = ['stacked-2', 'side-by-side-2', 'grid-6', 'grid-4']
  const check = (sequence: LayoutPreference[]) => {
    const items = sequence.map((preference, index) => source(`item-${index}`, preference))
    const byId = new Map(items.map((item) => [item.itemId, item.layoutPreference]))
    const pages = buildAutoCollageLayout(items)
    const ids = pages.flatMap((page) => page.slots.flatMap((slot) => slot.itemId ? [slot.itemId] : []))
    assert.deepEqual(ids, items.map((item) => item.itemId))
    assert.equal(new Set(ids).size, items.length)
    for (const page of pages) {
      const pagePreferences = page.slots.flatMap((slot) => slot.itemId ? [byId.get(slot.itemId)] : [])
      if (pagePreferences.includes('grid-4')) {
        if (page.template === 'grid-4') {
          assert.equal(page.slots.length, 4)
          assert.ok(pagePreferences.every((preference) => preference === 'grid-4'))
        } else if (page.template === 'mixed-grid2-small3' || page.template === 'mixed-small3-grid2') {
          assert.equal(page.slots.length, 5)
          assert.ok(pagePreferences.filter((preference) => preference === 'grid-4').length <= 2)
          assert.ok(pagePreferences.filter((preference) => preference === 'grid-6').length <= 3)
          assert.ok(pagePreferences.every((preference) => preference === 'grid-4' || preference === 'grid-6'))
        } else {
          assert.ok(['mixed-landscape1-grid2', 'mixed-grid2-landscape1'].includes(page.template))
          assert.equal(page.slots.length, 3)
          assert.equal(pagePreferences.filter((preference) => preference === 'stacked-2').length, 1)
          assert.ok(pagePreferences.filter((preference) => preference === 'grid-4').length <= 2)
          assert.ok(pagePreferences.every((preference) => preference === 'grid-4' || preference === 'stacked-2'))
        }
      } else assert.ok(!['grid-4', 'mixed-landscape1-grid2', 'mixed-grid2-landscape1'].includes(page.template))
    }
  }
  const visit = (sequence: LayoutPreference[]) => {
    check(sequence)
    if (sequence.length < 5) preferences.forEach((preference) => visit([...sequence, preference]))
  }
  visit([])
  // 舊版型與混排直接對照既有固定案例，避免用同一 builder 作自己的預期值。
  for (const fixture of AUTO_COLLAGE_LAYOUT_FIXTURES) {
    const pages = buildAutoCollageLayout(fixture.input)
    assert.deepEqual(pages.map((page) => page.template), fixture.expectedTemplates, fixture.name)
    assert.deepEqual(pages.map((page) => page.slots.map((slot) => slot.itemId)), fixture.expectedSlots, fixture.name)
  }
})

test('四張與上下兩方向半頁混排、留空及容量優先序', () => {
  const cases: Array<{preferences: LayoutPreference[]; templates: string[]; ids: Array<Array<string | null>>}> = [
    {preferences: ['stacked-2', 'grid-4'], templates: ['mixed-landscape1-grid2'], ids: [['0', '1', null]]},
    {preferences: ['stacked-2', 'grid-4', 'grid-4'], templates: ['mixed-landscape1-grid2'], ids: [['0', '1', '2']]},
    {preferences: ['grid-4', 'stacked-2'], templates: ['mixed-grid2-landscape1'], ids: [['0', null, '1']]},
    {preferences: ['grid-4', 'grid-4', 'stacked-2'], templates: ['mixed-grid2-landscape1'], ids: [['0', '1', '2']]},
    {preferences: ['grid-4', 'grid-4', 'grid-4', 'stacked-2'], templates: ['grid-4', 'landscape-2'], ids: [['0', '1', '2', null], ['3', null]]},
    {preferences: ['grid-4', 'grid-4', 'grid-4', 'grid-4', 'grid-4', 'stacked-2'], templates: ['grid-4', 'mixed-grid2-landscape1'], ids: [['0', '1', '2', '3'], ['4', null, '5']]},
    {preferences: ['stacked-2', 'grid-4', 'grid-4', 'grid-4'], templates: ['mixed-landscape1-grid2', 'grid-4'], ids: [['0', '1', '2'], ['3', null, null, null]]},
    {preferences: ['stacked-2', 'stacked-2', 'grid-4'], templates: ['landscape-2', 'grid-4'], ids: [['0', '1'], ['2', null, null, null]]},
    {preferences: ['grid-4', 'side-by-side-2', 'stacked-2'], templates: ['grid-4', 'portrait-large-2', 'landscape-2'], ids: [['0', null, null, null], ['1', null], ['2', null]]},
    {preferences: ['grid-4', 'grid-6', 'stacked-2'], templates: ['mixed-grid2-small3', 'landscape-2'], ids: [['0', null, '1', null, null], ['2', null]]},
  ]
  for (const {preferences, templates, ids} of cases) {
    const pages = buildAutoCollageLayout(preferences.map((preference, index) => source(String(index), preference)))
    assert.deepEqual(pages.map((page) => page.template), templates, preferences.join(','))
    assert.deepEqual(pages.map((page) => page.slots.map((slot) => slot.itemId)), ids)
    for (const page of pages) {
      if (page.template === 'mixed-landscape1-grid2') assert.deepEqual(page.slots.map((slot) => slot.role), ['mixed-grid4-landscape-top', 'grid-4-bottom-left', 'grid-4-bottom-right'])
      if (page.template === 'mixed-grid2-landscape1') assert.deepEqual(page.slots.map((slot) => slot.role), ['grid-4-top-left', 'grid-4-top-right', 'mixed-grid4-landscape-bottom'])
    }
  }
})

test('四張六張兩方向半頁混排、留空、容量優先序及跨頁順序', () => {
  for (const fourFirst of [true, false]) {
    for (let four = 1; four <= 2; four += 1) {
      for (let six = 1; six <= 3; six += 1) {
        const fourItems = Array.from({length: four}, (_, i) => source(`four-${i}`, 'grid-4'))
        const sixItems = Array.from({length: six}, (_, i) => source(`six-${i}`, 'grid-6'))
        const pages = buildAutoCollageLayout(fourFirst ? [...fourItems, ...sixItems] : [...sixItems, ...fourItems])
        assert.equal(pages.length, 1)
        assert.equal(pages[0].template, fourFirst ? 'mixed-grid2-small3' : 'mixed-small3-grid2')
        const fourIds = [...fourItems.map((item) => item.itemId), ...Array(2 - four).fill(null)]
        const sixIds = [...sixItems.map((item) => item.itemId), ...Array(3 - six).fill(null)]
        assert.deepEqual(pages[0].slots.map((slot) => slot.itemId), fourFirst ? [...fourIds, ...sixIds] : [...sixIds, ...fourIds])
        assert.deepEqual(pages[0].slots.map((slot) => slot.role), fourFirst
          ? ['grid-4-top-left', 'grid-4-top-right', 'portrait-small-4', 'portrait-small-5', 'portrait-small-6']
          : ['portrait-small-1', 'portrait-small-2', 'portrait-small-3', 'grid-4-bottom-left', 'grid-4-bottom-right'])
        assert.deepEqual(pages[0].slots.map((slot) => slot.order), [1, 2, 3, 4, 5])
      }
    }
  }
  const cases: Array<{preferences: LayoutPreference[]; templates: string[]; ids: Array<Array<string | null>>}> = [
    {preferences: ['grid-4', 'grid-4', 'grid-4', 'grid-6'], templates: ['grid-4', 'portrait-small-6'], ids: [['0', '1', '2', null], ['3', null, null, null, null, null]]},
    {preferences: ['grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-4'], templates: ['portrait-small-6', 'grid-4'], ids: [['0', '1', '2', '3', null, null], ['4', null, null, null]]},
    {preferences: ['grid-4', 'grid-4', 'grid-4', 'grid-4', 'grid-4', 'grid-6'], templates: ['grid-4', 'mixed-grid2-small3'], ids: [['0', '1', '2', '3'], ['4', null, '5', null, null]]},
    {preferences: ['grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-6', 'grid-4'], templates: ['portrait-small-6', 'mixed-small3-grid2'], ids: [['0', '1', '2', '3', '4', '5'], ['6', null, null, '7', null]]},
    {preferences: ['grid-4', 'grid-6', 'grid-6', 'grid-6', 'grid-6'], templates: ['mixed-grid2-small3', 'portrait-small-6'], ids: [['0', null, '1', '2', '3'], ['4', null, null, null, null, null]]},
    {preferences: ['grid-6', 'grid-4', 'grid-4', 'grid-4'], templates: ['mixed-small3-grid2', 'grid-4'], ids: [['0', null, null, '1', '2'], ['3', null, null, null]]},
    {preferences: ['grid-4', 'side-by-side-2', 'grid-6'], templates: ['grid-4', 'portrait-large-2', 'portrait-small-6'], ids: [['0', null, null, null], ['1', null], ['2', null, null, null, null, null]]},
    {preferences: ['grid-6', 'stacked-2', 'grid-4'], templates: ['mixed-small3-landscape1', 'grid-4'], ids: [['0', null, null, '1'], ['2', null, null, null]]},
    {preferences: ['grid-4', 'grid-6', 'grid-4', 'grid-6'], templates: ['mixed-grid2-small3', 'mixed-grid2-small3'], ids: [['0', null, '1', null, null], ['2', null, '3', null, null]]},
  ]
  for (const {preferences, templates, ids} of cases) {
    const pages = buildAutoCollageLayout(preferences.map((preference, i) => source(String(i), preference)))
    assert.deepEqual(pages.map((page) => page.template), templates, preferences.join(','))
    assert.deepEqual(pages.map((page) => page.slots.map((slot) => slot.itemId)), ids)
  }
})

test('四張單張與批次狀態設定生效，旋轉不覆寫偏好且不改匯入預設', (t) => {
  t.mock.method(browserAssetStore, 'getUrl', () => 'blob:synthetic-asset')
  const project: ProjectV2 = {
    ...createEmptyProject(),
    assets: [{id: 'asset', file: 'images/asset.webp', mime: 'image/webp', width: 400, height: 800, size: 10, originalName: null}],
    items: ['one', 'two', 'three'].map((id) => ({id, type: 'image', assetId: 'asset', remark: '備註\n第二行', rotation: 0, crop: {x: 0, y: 0, width: 1, height: 1, unit: 'ratio'}, layoutPreference: 'side-by-side-2'})),
    layouts: [{id: 'layout_word_default', type: 'word-compatible-grid', itemOrder: ['three', 'one', 'two']}],
  }
  const single = updateItemLayoutPreference(project, 'one', 'grid-4')
  const batch = applyBatchLayoutPreference(single, new Set(['one', 'three']), 'grid-4')
  const rotated = applyBatchRotation(updateItemRotation(batch, 'one', 90), new Set(['three']), -90)
  assert.deepEqual(rotated.items.map(({layoutPreference, rotation}) => [layoutPreference, rotation]), [['grid-4', 90], ['side-by-side-2', 0], ['grid-4', 270]])
  assert.deepEqual(getOrderedItemViewModels(rotated).map(({itemId, layoutPreference}) => [itemId, layoutPreference]), [['three', 'grid-4'], ['one', 'grid-4'], ['two', 'side-by-side-2']])
  assert.ok(rotated.items.every(({remark}) => remark === '備註\n第二行'))
  assert.ok(project.items.every(({layoutPreference, rotation}) => layoutPreference === 'side-by-side-2' && rotation === 0))
  assert.equal(rotated.items[1], project.items[1])
  assert.equal(getInitialLayoutPreference(project.assets[0], 0), 'side-by-side-2')
  assert.equal(getInitialLayoutPreference(project.assets[0], 90), 'stacked-2')
  assert.equal(getInitialLayoutPreference(project.assets[0], 0, 'small'), 'grid-6')
})
