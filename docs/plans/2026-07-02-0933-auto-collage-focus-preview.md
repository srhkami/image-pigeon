---
id: plan-image-pigeon-auto-collage-focus-preview-2026-07-02-0933
type: plan
status: proposed
canonical: true
created_at: 2026-07-02T09:33:00+08:00
updated_at: 2026-07-02T09:33:00+08:00
owner: hermes
project: image-pigeon
affected_projects:
  - image-pigeon
related:
  base_plan: docs/plans/2026-06-30-1647-fastapi-session-project-format.md
  decision_status: docs/status/2026-06-30-fastapi-session-project-format-decisions.md
  prototype: .planning/sketches/focus-card-layout/004-final-direction/index.html
result_contract:
  directory: docs/result
  filename_stem: 2026-07-02-0933-auto-collage-focus-preview
---

# image-pigeon 自動拼貼排版與焦點編輯預覽實作計畫

> **For Hermes:** 若開始實作，先依本計畫逐步執行；每個 story 完成後建立對應 `docs/result/2026-07-02-0933-auto-collage-focus-preview-<story-id>-result.md`，再由 Hermes 驗收 diff、測試、lint、build 與互動行為。

**Goal:** 將目前圖片清單改為「左側焦點編輯 / 獨立排序模式、右側放大頁面縮圖預覽」的自動拼貼排版流程，並讓 Word 輸出依同一份自動排版結果輸出混合版型。

**Architecture:** `items + itemOrder + portraitSize` 是使用者可編輯來源；前端以純函式 `buildAutoCollageLayout()` 嚴格依左側順序產生 pages/slots，右側頁面縮圖與 Word 輸出共用此 layout。第一版不做任意拖曳版面、不做拼貼 JPG、不做自動最佳化重排。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、daisyUI 5、dnd-kit、pywebview、python-docx、Pillow。

---

## 1. 已確認產品決策

### D21：自動排版嚴格保留左側順序

- 不跳過圖片。
- 不局部重排。
- 不為了減少空格而改變圖片順序。
- 遇到無法並存的圖片類型時，本頁合法 slot 留空，下一頁從未消耗的圖片繼續。

### D22：一般編輯模式採 center-stage 焦點卡片

- 一般編輯模式只編輯目前焦點圖片。
- 中央焦點圖片最大。
- 上下相鄰圖片縮小、降低透明度、虛化。
- 支援捲動動畫、上下鍵、上一張 / 下一張切換焦點。
- 一般編輯模式不提供拖曳排序。

### D23：排序模式完全獨立

- 切換排序模式後，不顯示焦點卡片。
- 左側只顯示小張圖片清單與拖曳排序。
- 排序模式不編輯備註、不旋轉、不切換大 / 小直圖。
- 拖曳排序後重新計算 auto layout。

### D24：焦點追蹤以 `activeItemId` 為準

- 不以 index 作為長期狀態。
- 排序後仍追蹤同一張圖片。
- 從排序模式回編輯模式時，用 `activeItemId` 在新順序中重新定位焦點卡片。

### D25：右側只保留放大頁面縮圖預覽

- 不做左側大型 A4 預覽 + 右側小頁縮圖兩套預覽。
- 右側只顯示一列放大後的頁面縮圖。
- 頁面縮圖需跟隨焦點圖片，自動捲到焦點圖片所在頁並高亮該頁 / 該 slot。
- 使用者點頁面縮圖時，焦點切到該頁第一張圖片。

### D26：直圖預設大直圖；小直圖由使用者設定

- 匯入圖片後，依資產寬高判斷 `orientation`。
- 橫圖固定為 `landscape`。
- 直圖預設 `portraitSize = 'large'`。
- 使用者在一般編輯模式中按「大 / 小直圖」切換。

### D27：第一版只輸出 Word

- 不做拼貼 JPG。
- 不做 PDF / 列印。
- Word 預覽與輸出必須依同一份 auto layout spec。

### D28：正式實作需盡量保留既有 daisyUI 樣式

- 使用既有 `btn`、`card`、`textarea`、`badge`、`divider`、`select`、`alert` 等 daisyUI class。
- 不把 prototype 的自訂視覺完整照搬成另一套 design system。
- 只補必要的焦點卡片動畫 / transform / page thumbnail CSS。
- 既有 Button / component wrapper 可沿用時優先沿用。

---

## 2. 現況盤點

### 2.1 前端入口與模式狀態

- `src/App.tsx:13` 已有 `isMoveMode` 排序模式狀態。
- `src/App.tsx:26-32` 將 `project`、`setProject`、`sessionId`、`setImages`、`isMoveMode` 傳入 `ImagePreview`。
- `src/layout/Footer.tsx` 目前是排序模式切換入口，實作時需保留既有使用者操作習慣。

### 2.2 目前圖片預覽與排序

- `src/features/ImagePreview/ImagePreview.tsx:34-89` 目前用同一個 dnd-kit context 包住一般模式與排序模式。
- `src/features/ImagePreview/ImagePreview.tsx:59-70` 依 `isMoveMode` 切換 `ImageCard` 或 `ImageCardForMove`。
- `src/features/ImagePreview/ImageCard.tsx:26-137` 一般圖片卡目前仍掛 `useSortable()` 與拖曳 handle。
- `src/features/ImagePreview/ImageCardForMove.tsx:20-85` 排序卡已有小圖清單雛形。

### 2.3 Project schema 與排序來源

- `src/types/project.ts:19-26` 的 `Item` 目前有 `remark`、`rotation`、`crop`，尚無 `portraitSize` / layout preference。
- `src/types/project.ts:28-32` 目前只有 `WordCompatibleGridLayout` 與 `itemOrder`。
- `src/state/projectState.ts:86-122` 以 default layout 的 `itemOrder` 產生 ordered view models。
- `src/state/projectState.ts:160-184` 已有 `reorderItem()`，可延用排序來源。

### 2.4 Word 輸出

- `src/features/Output/SaveWord.tsx:84-92` 目前仍讓使用者手動選 1/2/4/6 張模式。
- `src/state/projectOutputAdapter.ts:24-54` 目前把 project items 轉回 legacy `CustomImage[]` base64 給 pywebview `save_docx`。
- `py/save_docx.py:48-84` 目前依 `data.mode` 走固定版型。
- `py/save_docx.py:128-390` 已有部分 Word table helper，但 `add_table_six_of_page()` 目前一次只吃 3 張，與新需求「小直圖 6 張（上 3 下 3）」不同，不能直接沿用為最終版型。

### 2.5 後端 Project model

- `py/app/models.py:41-48` 的 `Item` 需要加入 `portraitSize` 或相等欄位。
- `py/app/models.py:61-75` 目前 layouts 只有 `word-compatible-grid`，若要保存 auto collage layout 需擴充 union model。
- `py/tests/test_models.py:10-64` 需補 schema roundtrip 測試，避免 project 開啟 / 儲存遺失新欄位。

---

## 3. 自動排版規格

### 3.1 圖片分類

前端 view model 計算：

- `orientation = assetWidth >= assetHeight ? 'landscape' : 'portrait'`
- 若旋轉 90 / 270 度，顯示與排版是否採旋轉後 orientation 是需明確決策：第一版建議採「資產原始寬高 + portraitSize」分類，旋轉只影響圖片顯示方向，不改變排版類型，避免旋轉造成整份文件重新分頁。
- 直圖的 `portraitSize`：
  - 預設 `large`
  - 使用者可切換為 `small`

### 3.2 支援版型

第一版支援五種 template：

1. `landscape-2`
   - 橫圖最多 2 張。
   - 直式紙張，上下排列。
   - 每張含備註欄。

2. `portrait-large-2`
   - 大直圖最多 2 張。
   - 直式紙張，左右排列。
   - 每張含備註欄。

3. `portrait-small-6`
   - 小直圖最多 6 張。
   - 直式紙張，上 3 下 3。
   - 每張含備註欄。

4. `mixed-landscape1-small3`
   - 上 1 橫，下最多 3 小直。
   - 每張含備註欄。

5. `mixed-small3-landscape1`
   - 上最多 3 小直，下 1 橫。
   - 每張含備註欄。

### 3.3 Greedy consume 規則

從 `itemOrder` 第一張開始依序 consume：

#### 目前圖片為橫圖

- 下一張是橫圖：產生 `landscape-2`，消耗 2 張。
- 下一張是小直圖：產生 `mixed-landscape1-small3`，消耗目前橫圖 + 後續最多 3 張連續小直圖。
- 下一張是大直圖或沒有下一張：產生 `landscape-2`，第二格留空，消耗 1 張。

#### 目前圖片為大直圖

- 下一張是大直圖：產生 `portrait-large-2`，消耗 2 張。
- 否則：產生 `portrait-large-2`，第二格留空，消耗 1 張。

#### 目前圖片為小直圖

- 往後收集最多 6 張連續小直圖。
- 若連續小直圖數量 <= 3 且下一張是橫圖：產生 `mixed-small3-landscape1`，小直圖不足 3 的 slot 留空，消耗小直圖 + 橫圖。
- 否則：產生 `portrait-small-6`，最多消耗 6 張小直圖，不足 slot 留空。

### 3.4 空格與頁面縮圖

- 空格是合法 layout slot，不代表資料錯誤。
- 右側頁面縮圖要顯示空格，讓使用者理解為何 Word 會留白。
- 頁面縮圖應顯示：頁碼、版型名稱、焦點 slot 高亮。
- 頁面縮圖清單應在 `activeItemId` 變化後自動 scroll 到焦點頁。

---

## 4. 實作 stories

### Story 1：擴充 project/item schema 與狀態操作

**Objective:** 讓每張直圖能保存大 / 小直圖設定，並保持專案儲存 / 開啟相容。

**Files:**
- Modify: `src/types/project.ts`
- Modify: `src/state/projectState.ts`
- Modify: `py/app/models.py`
- Modify: `py/tests/test_models.py`

**Steps:**

1. 在 TypeScript `Item` 加入 `portraitSize?: 'large' | 'small'`。
2. 在 `ProjectItemViewModel` 加入：
   - `orientation: 'landscape' | 'portrait'`
   - `portraitSize: 'large' | 'small'`
   - `collageKind: 'landscape' | 'portrait-large' | 'portrait-small'`
3. 在 `getOrderedItemViewModels()` 依 asset width/height 與 item.portraitSize 計算上述欄位。
4. 新增 `updateItemPortraitSize(project, itemId, portraitSize)`。
5. Python `Item` 加入 `portrait_size: Literal['large', 'small'] = Field(default='large', alias='portraitSize')`。
6. 補 `py/tests/test_models.py`：
   - default 為 `large`
   - alias roundtrip 保留 `portraitSize`
   - 舊 project JSON 沒有 `portraitSize` 也可載入。

**Verification:**

- `uv run python -m pytest py/tests/test_models.py`
- `pnpm run lint`
- `pnpm run build`

### Story 2：建立 auto collage layout 純函式與測試

**Objective:** 將排版規則集中成可測試純函式，供右側預覽與 Word 輸出共用。

**Files:**
- Create: `src/features/ImagePreview/autoCollageLayout.ts`
- Create: `src/features/ImagePreview/autoCollageLayout.test.ts`（若專案尚無 test runner，可先建立無 runner 的 pure cases 文件或改由後續補 Vitest；若新增 Vitest 需另確認）
- Modify: `src/types/project.ts`

**Steps:**

1. 定義 `AutoCollageTemplate` union：
   - `landscape-2`
   - `portrait-large-2`
   - `portrait-small-6`
   - `mixed-landscape1-small3`
   - `mixed-small3-landscape1`
2. 定義 `AutoCollagePage`：
   - `pageId`
   - `template`
   - `slots: Array<{ slotId, itemId: string | null, role, order }>`
3. 實作 `buildAutoCollageLayout(viewModels)`。
4. 實作 `findPageIndexByItemId(layout, itemId)`。
5. 實作 `countBlankSlots(layout)`。
6. 覆蓋代表案例：
   - `[橫,橫,橫,大直,橫,大直,大直] -> (橫橫)(橫空)(大直空)(橫空)(大直大直)`
   - `[橫,小直,小直,小直] -> mixed-landscape1-small3`
   - `[小直,小直,小直,橫] -> mixed-small3-landscape1`
   - `[小直 x6] -> portrait-small-6`
   - `[大直,小直] -> (大直空)(小直...空)`

**Verification:**

- 若已有 / 加入 test runner：跑 auto layout unit tests。
- 否則用 `pnpm run build` 保證 TypeScript compile，並在 result report 中列出未加 runner 的原因。

### Story 3：改造 ImagePreview 為左右分割版面

**Objective:** 將主要操作區改為左側 68%、右側 32%，右側只保留放大頁面縮圖預覽。

**Files:**
- Modify: `src/features/ImagePreview/ImagePreview.tsx`
- Create: `src/features/ImagePreview/CollagePagePreviewRail.tsx`
- Create: `src/features/ImagePreview/CollagePageThumbnail.tsx`

**Steps:**

1. 在 `ImagePreview` 內新增 `activeItemId` state。
2. 初始 active item 為第一張 view model。
3. 若匯入 / 刪除導致 active item 不存在，fallback 到鄰近或第一張。
4. 用 `buildAutoCollageLayout(viewModels)` 產生 layout。
5. 根據 `activeItemId` 找焦點頁。
6. 建立右側 preview rail：
   - 使用 daisyUI `card` / `badge` / `divider` 風格。
   - 只顯示頁面縮圖，不顯示大型 A4 預覽。
   - active page 高亮。
   - active slot 高亮。
   - `activeItemId` 改變時自動 scrollIntoView 到 active page。
7. 點擊頁面縮圖時，將 active item 設為該頁第一張非空 item。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動瀏覽器驗證：焦點切換時右側自動跳到對應頁。

### Story 4：一般編輯模式改為 center-stage 焦點卡片

**Objective:** 一般編輯模式不再顯示長列表，而是顯示中心焦點卡片與上下相鄰卡片。

**Files:**
- Modify: `src/features/ImagePreview/ImageCard.tsx`
- Create: `src/features/ImagePreview/FocusImageEditor.tsx`
- Create: `src/features/ImagePreview/FocusImageCard.tsx`
- Modify: `src/features/ImagePreview/ImagePreview.tsx`

**Steps:**

1. 從一般編輯卡移除 `useSortable()` 與拖曳 handle。
2. 建立 `FocusImageEditor`，只渲染 active index 前後最多 2 張。
3. 支援切焦點來源：
   - 滑鼠滾輪 / trackpad threshold
   - 上下鍵
   - 上一張 / 下一張按鈕
   - 點相鄰卡片
   - 點右側頁面縮圖
4. `FocusImageCard` 使用既有 daisyUI：
   - `card bg-base-100 shadow border`
   - `textarea textarea-sm`
   - `btn btn-ghost / btn-info / btn-error`
   - `badge badge-info / badge-warning / badge-success`
5. 只在 active card 顯示：
   - 備註 textarea
   - 旋轉左 / 旋轉右
   - 直圖大 / 小切換（僅直圖顯示）
   - 刪除
6. 非 active card 只顯示縮小圖片與類型 badge。
7. 設計 animation class：
   - active：scale 1、opacity 1、blur 0
   - adjacent：scale 0.84～0.88、opacity 0.45～0.55、blur 1px
   - second adjacent：scale 0.70～0.76、opacity 0.15～0.22、blur 2～3px

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動瀏覽器驗證：捲動動畫、焦點高亮、備註儲存、旋轉、刪除、小直圖切換。

### Story 5：排序模式獨立成小圖拖曳清單

**Objective:** 排序模式只處理排序，不混入一般編輯功能。

**Files:**
- Modify: `src/features/ImagePreview/ImageCardForMove.tsx`
- Create: `src/features/ImagePreview/SortableImageList.tsx`
- Modify: `src/features/ImagePreview/ImagePreview.tsx`

**Steps:**

1. 排序模式只渲染小圖 row。
2. 每列顯示：
   - drag handle
   - 小縮圖
   - 序號
   - 類型 badge
   - 原檔名或備註摘要
3. 保留 dnd-kit 只包排序模式，避免一般編輯模式也有 drag listeners。
4. 拖曳排序後：
   - 呼叫 `reorderItem()`
   - 保持 `activeItemId = dragged item id`
   - 重新計算 layout
   - 右側 preview rail 自動跳到該圖片所在頁。
5. 點排序列：只設定 active item，不進行備註/旋轉。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動瀏覽器驗證：排序後 active item 不變、右側頁面自動更新。

### Story 6：Word 輸出改為 auto collage mode

**Objective:** Word 輸出不再要求使用者選固定 mode，而是依 auto layout pages/slots 輸出混合版型。

**Files:**
- Modify: `src/features/Output/SaveWord.tsx`
- Modify: `src/state/projectOutputAdapter.ts`
- Modify: `src/utils/type.ts`
- Modify: `py/save_docx.py`
- Modify: `py/tests/test_api.py` 或新增 `py/tests/test_save_docx_collage.py`

**Steps:**

1. 前端 SaveWord 移除或停用「排版 mode」select，改顯示提示：`依右側自動排版預覽輸出 Word`。
2. 前端建立 Word payload 時，除了 images，也送 auto layout pages/slots。
3. 保留 `align_vertical`、`font_size`、`title` 當下輸出設定，不保存到 project.json。
4. Python `OutputWord` 支援新欄位：
   - `layoutMode: 'auto-collage-v1'`
   - `pages[]`
5. `creat_docx()` 若有 `layoutMode = auto-collage-v1`，走新 renderer；否則保留舊 mode 作為相容 fallback。
6. 新增 Word table helpers：
   - landscape-2：上下 2 橫。
   - portrait-large-2：左右 2 大直。
   - portrait-small-6：上 3 下 3，共 6 小直。
   - mixed-landscape1-small3。
   - mixed-small3-landscape1。
7. 空 slot 在 Word 中保留框線與空白備註欄。
8. 圖片寫入仍透過既有 `SaveImage` / `handle_table_write()` 或抽出更通用 slot writer，避免重複圖片縮放邏輯。

**Verification:**

- Python targeted tests：驗證每種 template 產生 docx 不例外、頁數 / table 數符合預期。
- 手動 smoke：用測試圖片輸出 Word，打開確認五種版型、空白 slot、備註欄。
- `pnpm run lint`
- `pnpm run build`

### Story 7：專案儲存 / 開啟與 layout 保存策略

**Objective:** 保存使用者大 / 小直圖設定，並確保 project 開啟後能重建相同 auto layout。

**Files:**
- Modify: `src/types/project.ts`
- Modify: `src/state/projectState.ts`
- Modify: `py/app/models.py`
- Modify: `py/tests/test_project_service.py`

**Steps:**

1. `portraitSize` 作為 item metadata 保存到 `project.json`。
2. 第一版 auto layout 可不持久保存 pages/slots，開啟專案後依 `itemOrder + portraitSize + asset dimensions` 重新計算。
3. 若實作中決定保存 auto layout snapshot，需新增 `AutoCollageLayout` union，不得破壞既有 `word-compatible-grid`。
4. 舊專案開啟時，缺少 `portraitSize` 的 item 預設 large。

**Verification:**

- 儲存 `.ipigeon` 後檢查 `project.json` 有 `portraitSize`。
- 開啟 `.ipigeon` 後右側 preview 與儲存前一致。
- `uv run python -m pytest py/tests/test_project_service.py py/tests/test_models.py`

---

## 5. 驗收標準

### UI / UX

- 一般編輯模式左側為 center-stage 焦點卡片。
- 一般編輯模式不可拖曳排序。
- 排序模式左側為小圖清單，可拖曳排序。
- 排序模式不可編輯備註 / 旋轉 / 大小直圖。
- 右側只顯示放大頁面縮圖預覽。
- 右側預覽會跟隨焦點圖片自動跳到對應頁。
- 點右側頁面縮圖會把焦點切到該頁第一張圖片。
- 整體樣式盡量保留 daisyUI 風格。

### Auto layout

- 嚴格保留左側順序。
- 橫圖 + 橫圖 -> 一頁 2 橫。
- 大直 + 大直 -> 一頁 2 大直。
- 小直最多 6 張 -> 上 3 下 3。
- 橫 + 小直 -> mixed 橫 / 小直。
- 小直 + 橫 -> mixed 小直 / 橫。
- 大直不與橫圖或小直圖混排。
- 無法並存時留空。

### Word

- Word 輸出與右側 preview 使用同一份 auto layout pages/slots。
- 每張圖片都有備註欄。
- 空 slot 在 Word 中保留空白框 / 空白備註欄。
- 不輸出拼貼 JPG。

### 驗證命令

每個 implementation checkpoint 至少跑：

```bash
pnpm run lint
pnpm run build
```

涉及 Python model / Word 輸出時加跑：

```bash
uv run python -m pytest py/tests/test_models.py py/tests/test_project_service.py
```

若新增 Word renderer tests：

```bash
uv run python -m pytest py/tests/test_save_docx_collage.py
```

---

## 6. 非目標

- 不做任意座標拖拉拼貼。
- 不做跨格合併。
- 不做圖片裁切 UI。
- 不做 PDF / 列印預覽。
- 不做拼貼 JPG 輸出。
- 不做自動最佳化重排。
- 不為了填滿空格改變圖片順序。
- 不永久保存 Word 輸出設定。

---

## 7. 實作順序建議

1. Story 1：schema 與 `portraitSize`。
2. Story 2：auto layout 純函式。
3. Story 3：右側放大頁面縮圖 preview rail。
4. Story 4：左側 center-stage 編輯模式。
5. Story 5：排序模式獨立。
6. Story 6：Word auto collage 輸出。
7. Story 7：專案儲存 / 開啟驗證與必要 snapshot 策略。

建議先完成 Story 1～5 並用 UI 確認互動，再做 Story 6 Word 輸出。避免 Word renderer 先行實作後，前端 layout spec 又調整造成重工。

---

## 8. Execution result report contract

每個 story 完成後，執行者必須建立：

```text
docs/result/2026-07-02-0933-auto-collage-focus-preview-<story-id>-result.md
```

內容至少包含：

1. 完成項目，需對應 story / step。
2. 實際修改檔案清單。
3. 驗證命令與結果。
4. 手動 UI / Word smoke evidence。
5. 未完成項目 / blocker / deferred items。

Hermes 驗收 gate：

1. 先確認 result report 存在並讀取。
2. 再檢查 git diff。
3. 再重跑必要 lint / build / pytest。
4. 若 result report 缺失，即使程式碼看似完成也視為 non-compliant。
