import type {AutoCollageSourceItem, AutoCollageTemplate} from '@/features/ImagePreview/autoCollageLayout.ts'

export type AutoCollageLayoutFixture = {
  name: string
  input: AutoCollageSourceItem[]
  expectedTemplates: AutoCollageTemplate[]
  expectedSlots: Array<Array<string | null>>
}

const createLandscape = (itemId: string): AutoCollageSourceItem => ({
  itemId,
  layoutPreference: 'stacked-2',
})

const createPortraitLarge = (itemId: string): AutoCollageSourceItem => ({
  itemId,
  layoutPreference: 'side-by-side-2',
})

const createPortraitSmall = (itemId: string): AutoCollageSourceItem => ({
  itemId,
  layoutPreference: 'grid-6',
})

export const AUTO_COLLAGE_LAYOUT_FIXTURES: AutoCollageLayoutFixture[] = [
  {
    name: '[橫,橫,橫,大直,橫,大直,大直] -> (橫橫)(橫空)(大直空)(橫空)(大直大直)',
    input: [
      createLandscape('item-01'),
      createLandscape('item-02'),
      createLandscape('item-03'),
      createPortraitLarge('item-04'),
      createLandscape('item-05'),
      createPortraitLarge('item-06'),
      createPortraitLarge('item-07'),
    ],
    expectedTemplates: ['landscape-2', 'landscape-2', 'portrait-large-2', 'landscape-2', 'portrait-large-2'],
    expectedSlots: [
      ['item-01', 'item-02'],
      ['item-03', null],
      ['item-04', null],
      ['item-05', null],
      ['item-06', 'item-07'],
    ],
  },
  {
    name: '[橫,小直,小直,小直] -> mixed-landscape1-small3',
    input: [
      createLandscape('item-01'),
      createPortraitSmall('item-02'),
      createPortraitSmall('item-03'),
      createPortraitSmall('item-04'),
    ],
    expectedTemplates: ['mixed-landscape1-small3'],
    expectedSlots: [['item-01', 'item-02', 'item-03', 'item-04']],
  },
  {
    name: '[小直,小直,小直,橫] -> mixed-small3-landscape1',
    input: [
      createPortraitSmall('item-01'),
      createPortraitSmall('item-02'),
      createPortraitSmall('item-03'),
      createLandscape('item-04'),
    ],
    expectedTemplates: ['mixed-small3-landscape1'],
    expectedSlots: [['item-01', 'item-02', 'item-03', 'item-04']],
  },
  {
    name: '[小直,橫] -> mixed-small3-landscape1 且中間小直 slot 留空',
    input: [createPortraitSmall('item-01'), createLandscape('item-02')],
    expectedTemplates: ['mixed-small3-landscape1'],
    expectedSlots: [['item-01', null, null, 'item-02']],
  },
  {
    name: '[小直 x6] -> portrait-small-6',
    input: [
      createPortraitSmall('item-01'),
      createPortraitSmall('item-02'),
      createPortraitSmall('item-03'),
      createPortraitSmall('item-04'),
      createPortraitSmall('item-05'),
      createPortraitSmall('item-06'),
    ],
    expectedTemplates: ['portrait-small-6'],
    expectedSlots: [['item-01', 'item-02', 'item-03', 'item-04', 'item-05', 'item-06']],
  },
  {
    name: '[大直,小直] -> (大直空)(小直...空)',
    input: [createPortraitLarge('item-01'), createPortraitSmall('item-02')],
    expectedTemplates: ['portrait-large-2', 'portrait-small-6'],
    expectedSlots: [
      ['item-01', null],
      ['item-02', null, null, null, null, null],
    ],
  },
]
