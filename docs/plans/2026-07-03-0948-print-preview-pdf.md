---
id: plan-image-pigeon-print-preview-pdf-2026-07-03-0948
type: plan
status: proposed
canonical: true
created_at: 2026-07-03T09:48:00+08:00
updated_at: 2026-07-03T09:48:00+08:00
owner: hermes
project: image-pigeon
affected_projects:
  - image-pigeon
related:
  base_plan: docs/plans/2026-06-30-1647-fastapi-session-project-format.md
  decision_status: docs/status/2026-06-30-fastapi-session-project-format-decisions.md
  prior_auto_collage_plan: docs/plans/2026-07-02-0933-auto-collage-focus-preview.md
result_contract:
  directory: docs/result
  filename_stem: 2026-07-03-0948-print-preview-pdf
---

# image-pigeon 預覽列印與另存 PDF 實作計畫

> **For Hermes:** 若開始實作，請先依本計畫逐步執行；每個 story 完成後建立對應 `docs/result/2026-07-03-0948-print-preview-pdf-<story-id>-result.md`，再由 Hermes 驗收 diff、測試、lint、build 與實際列印預覽行為。

**Goal:** 新增不使用 router 的全頁「預覽列印」模式，讓使用者以接近現行 Word 自動拼貼排版的 A4 分頁畫面檢查內容，並透過同一套前端列印流程執行「列印」與「另存 PDF」。

**Architecture:** 以 React state 在 `editor` / `print-preview` 兩種 view mode 間切換，不新增 react-router。前端建立正式 A4 print DOM，與既有 `buildAutoCollageLayout()` / Word auto-collage payload 共用 pages/slots 排版概念；PDF 第一階段不由後端輸出，而是透過系統列印對話框選擇「另存為 PDF」。

**Tech Stack:** React 19、TypeScript、Tailwind CSS 4、daisyUI 5、pywebview、Browser print CSS、現有 FastAPI session image endpoint。

---

## 1. 已確認產品與架構決策

### D29：預覽列印是獨立全頁 view，不是 Modal

- 目前「輸出檔案」已是 Modal；預覽列印不再疊第二層大型 Modal。
- 點選預覽列印入口後，關閉輸出 Modal，切換到全頁預覽列印模式。
- 預覽列印底部固定操作列：左側「返回編輯」，右側「列印」與「另存 PDF」。

### D30：第一階段不做 router

- 不新增 `react-router-dom`。
- 不建立 `/print-preview` 路由。
- 由 `App.tsx` 或相鄰 app state 維護 `viewMode: 'editor' | 'print-preview'`。
- 返回編輯時不刷新頁面、不重載專案，保留目前 `project` / `sessionId` / 排序 / 編輯狀態。

### D31：第一階段不做後端 PDF 輸出

- 不新增 `/api/export/pdf`。
- 不導入 Playwright / Chromium。
- 不導入 ReportLab 或新的 Python PDF renderer。
- 「另存 PDF」第一階段與「列印」共用 browser print flow，提示使用者在系統列印對話框選擇「另存為 PDF」。

### D32：列印與 PDF 共用同一份前端 A4 print DOM

- 不直接列印目前右側縮圖 `CollagePageThumbnail`。
- 新增正式 `PrintableDocument` / `PrintablePage` 類元件，專門處理 A4 尺寸、分頁、表格格線、圖片 fit、編號與備註欄。
- 螢幕預覽與實際列印可有不同 CSS，但必須共用同一份 page/slot DOM 結構。

### D33：列印排版目標是接近 Word，不追求 docx pixel-perfect

- Word 由 `python-docx` 渲染，前端列印由瀏覽器渲染；兩者不可能完全一致。
- 驗收目標是：頁面分組、圖片順序、空 slot、編號、備註欄、橫圖/直圖/混合版型與 Word 自動拼貼邏輯一致。
- 若細節差異不可避免，優先確保列印版面穩定、可閱讀、A4 分頁正確。

---

## 2. 非目標

本計畫第一階段不做：

- 不新增 router 或 URL 深連結。
- 不支援重新整理後保留在預覽列印頁。
- 不做後端 PDF renderer。
- 不新增 Chromium / Playwright 打包流程。
- 不新增自由拖曳排版。
- 不保存列印 / PDF / Word 輸出設定到 `project.json`。
- 不改變既有 Word 輸出後端 renderer。
- 不直接使用目前右側縮圖作為正式列印 DOM。

---

## 3. 現況盤點

### 3.1 App 入口與狀態

- `src/App.tsx:12-15` 目前保存 `setImages`、`isMoveMode`、`project`、`sessionId`。
- `src/App.tsx:20-57` 目前固定渲染 editor shell：`Nav`、`Sidebar`、`ImagePreview` / `Intro`、`ModalNewVersion`、`Toaster`。
- 預覽列印可在 `App.tsx` 新增 `viewMode`，並在 `viewMode === 'print-preview'` 時改渲染全頁 `PrintPreviewView`。

### 3.2 輸出 Modal

- `src/features/Output/ModalOutput.tsx:34-46` 目前有「儲存WORD / 儲存專案 / 另存圖片」tabs。
- `src/features/Output/ModalOutput.tsx:47-50` 有註解掉的「直接列印」入口。
- 實作時應新增「預覽列印 / PDF」入口，但不在 tab 內直接顯示 A4 預覽。

### 3.3 既有自動拼貼 layout

- `src/features/ImagePreview/autoCollageLayout.ts` 已定義 `AutoCollagePage`、`AutoCollageSlot` 與五種 template。
- `src/features/ImagePreview/CollagePageThumbnail.tsx` 目前是右側縮圖預覽，不適合直接列印。
- `src/state/projectOutputAdapter.ts:62-70` 目前 Word payload 會用 `buildAutoCollageLayout(viewModels)` 產生 pages。

### 3.4 圖片來源

- `ProjectItemViewModel.previewUrl` 由 `GET /api/sessions/{session_id}/assets/{asset_id}/image` 提供。
- 列印預覽應直接使用 preview URL，不再轉 base64，避免大圖造成 React state / memory 壓力。
- 需要在觸發 `window.print()` 前等待 print DOM 內所有圖片載入完成。

---

## 4. 目標使用流程

1. 使用者在編輯頁點「輸出檔案」。
2. 在 Modal 中選擇「預覽列印 / PDF」。
3. 使用者設定：
   - 文件標題，預設 `照片黏貼表`
   - 備註垂直對齊，預設 `center`
   - 字體大小，預設 `12`
4. 點「開啟預覽列印」。
5. 輸出 Modal 關閉，App 切換到全頁 `PrintPreviewView`。
6. 預覽頁中央顯示多頁 A4 預覽。
7. 底部固定操作列：
   - 左側：「返回編輯」
   - 中間：頁數 / 圖片載入狀態
   - 右側：「列印」、「另存 PDF」
8. 點「列印」：等待圖片載入完成後呼叫 `window.print()`。
9. 點「另存 PDF」：先提示「會開啟系統列印對話框，請選擇另存為 PDF」，再呼叫同一個 print flow。
10. 點「返回編輯」：回到原本 editor view，不清除任何 project state。

---

## 5. Print DOM 與版面規格

### 5.1 共用輸入資料

`PrintPreviewView` / `PrintableDocument` 應接收：

- `project: ProjectV2`
- `sessionId: string`
- `title: string`
- `fontSize: '10' | '11' | '12' | '13' | '14'`
- `alignVertical: 'top' | 'center'`
- `onBackToEditor: () => void`

內部由：

- `getOrderedItemViewModels(project, sessionId)` 取得 ordered view models。
- `buildAutoCollageLayout(viewModels)` 取得 pages。

### 5.2 A4 頁面

- 頁面方向：第一階段固定 A4 portrait。
- 螢幕預覽：灰底 + 白色 A4 紙張 + shadow。
- 實際列印：只輸出 A4 pages，不輸出 Nav、Sidebar、底部操作列、背景陰影。
- 每一頁應強制 page break，避免兩頁黏在同一張紙。

### 5.3 支援 template

必須支援現有五種 auto collage template：

1. `landscape-2`
   - 上下兩個橫圖區塊。
   - 每張：圖片 row + 編號/備註 row。
   - 空 slot 保留格線。

2. `portrait-large-2`
   - 左右兩個大直圖區塊。
   - 每張：圖片區 + 編號 + 備註。
   - 空 slot 保留格線。

3. `portrait-small-6`
   - 上 3 下 3 小直圖。
   - 每張：圖片區 + 編號 + 備註。
   - 空 slot 保留格線。

4. `mixed-landscape1-small3`
   - 上方 1 橫圖，下方最多 3 小直圖。
   - 空 slot 保留格線。

5. `mixed-small3-landscape1`
   - 上方最多 3 小直圖，下方 1 橫圖。
   - 空 slot 保留格線。

### 5.4 編號與備註

- 編號應全文件連續，不可每頁重置。
- 空 slot 不產生編號。
- 編號格式與 Word 接近：`編號01`、`編號02`、...、`編號10`。
- 備註文字來源為 `item.remark`。
- `alignVertical` 控制備註欄垂直對齊。
- `fontSize` 控制編號與備註主要字級。

### 5.5 圖片顯示

- 圖片使用 `object-fit: contain`，不可裁切。
- 套用 `item.rotation`。
- 第一階段 crop metadata 仍固定全圖；若未來有裁切 UI，列印版需跟進套用 crop。
- 等待所有 `<img>` load / error 完成後才 enable「列印」與「另存 PDF」。

---

## 6. 實作 stories

### Story 1：新增全頁 view mode 與預覽列印入口

**Objective:** 建立不使用 router 的 editor / print-preview 切換流程，讓輸出 Modal 可進入全頁預覽列印。

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/layout/Sidebar.tsx`
- Modify: `src/features/Output/ModalOutput.tsx`
- Create: `src/features/PrintPreview/PrintPreviewView.tsx`
- Create or modify: `src/features/PrintPreview/index.ts`

**Steps:**

1. 在 `App.tsx` 新增 `viewMode: 'editor' | 'print-preview'`。
2. 在 `App.tsx` 新增 `printOptions` state：`title`、`alignVertical`、`fontSize`。
3. 在 `viewMode === 'editor'` 時維持現有畫面。
4. 在 `viewMode === 'print-preview'` 時渲染 `PrintPreviewView`，不要渲染 `Nav` / `Sidebar` / editor main。
5. 將 `onOpenPrintPreview(options)` 由 `App.tsx` 傳到 `Sidebar`，再傳到 `ModalOutput`。
6. `ModalOutput` 新增「預覽列印 / PDF」tab 或區塊，包含基本設定表單與「開啟預覽列印」按鈕。
7. 使用者送出後：關閉輸出 Modal，呼叫 `onOpenPrintPreview(options)`。
8. `PrintPreviewView` 先建立基本空殼：標題列、中央 placeholder、底部 action bar。
9. 底部左側「返回編輯」呼叫 `onBackToEditor()`。

**Acceptance:**

- 不新增 router dependency。
- 從輸出 Modal 可切到全頁預覽列印。
- 點返回編輯後原本圖片、備註、排序、session 狀態仍在。
- 預覽頁不是 Modal，也不與輸出 Modal 疊層。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動 smoke：匯入圖片 → 輸出檔案 → 預覽列印 / PDF → 開啟預覽 → 返回編輯。

### Story 2：建立正式 A4 PrintableDocument 與 template renderer

**Objective:** 以現有 auto collage pages 產生可列印的正式 A4 DOM，替代右側縮圖作為列印來源。

**Files:**
- Create: `src/features/PrintPreview/PrintableDocument.tsx`
- Create: `src/features/PrintPreview/PrintablePage.tsx`
- Create: `src/features/PrintPreview/PrintableSlot.tsx`
- Create: `src/features/PrintPreview/printLayout.ts`
- Modify: `src/features/PrintPreview/PrintPreviewView.tsx`

**Steps:**

1. 在 `printLayout.ts` 定義列印用 helper：
   - `formatPrintImageNumber(index: number): string`
   - `buildPrintableSlotIndexMap(pages): Record<slotId, number | null>` 或等價純函式，確保編號跨頁連續。
2. `PrintableDocument` 依 `project/sessionId` 建立 `viewModels` 與 `pages`。
3. `PrintablePage` 依 page template 選擇 CSS grid/table 結構。
4. `PrintableSlot` 接收 item、編號、slot role、空 slot 狀態。
5. 實作五種 template 的 DOM：
   - `landscape-2`
   - `portrait-large-2`
   - `portrait-small-6`
   - `mixed-landscape1-small3`
   - `mixed-small3-landscape1`
6. 空 slot 保留框線與空白，不顯示編號。
7. 圖片套用 preview URL、rotation、`object-fit: contain`。
8. 備註套用 `fontSize` 與 `alignVertical`。

**Acceptance:**

- 預覽頁可看到正式 A4 紙張，而非右側縮圖卡片。
- 五種 template 都有對應 render。
- 空 slot 顯示為空白格線。
- 編號跨頁連續。
- 圖片順序與 `layout.itemOrder` / `buildAutoCollageLayout()` 一致。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動 smoke：用橫圖、大直圖、小直圖與混合排序檢查五種 template 顯示。

### Story 3：加入 print CSS 與 viewport-bounded 預覽體驗

**Objective:** 讓預覽列印頁在桌面視窗內穩定顯示，並讓實際列印只輸出 A4 pages。

**Files:**
- Create or modify: `src/features/PrintPreview/printPreview.css`
- Modify: `src/features/PrintPreview/PrintPreviewView.tsx`
- Modify: `src/features/PrintPreview/PrintableDocument.tsx`
- Modify: `src/main.tsx` or local component import path if CSS is scoped by import

**Steps:**

1. 預覽頁外層使用 viewport-bounded layout：`h-dvh overflow-hidden flex flex-col` 或等價 class。
2. 中央預覽區使用 `flex-1 min-h-0 overflow-auto`。
3. 底部 action bar 固定在畫面底部，不隨 A4 pages 捲走。
4. A4 預覽頁面在螢幕上置中，使用灰底、白紙、shadow。
5. 定義 print media CSS：
   - 隱藏 `.print-preview-chrome` / footer / buttons。
   - 隱藏非列印內容。
   - `@page { size: A4 portrait; margin: 0; }`
   - `.print-page { page-break-after: always; break-after: page; }`
6. 確保列印時不輸出背景陰影與 app chrome。
7. 確保最後一頁不額外產生空白頁；若 browser 行為導致最後 page break，多加 CSS guard。

**Acceptance:**

- 預覽頁不撐高整個 app，不產生外層頁面雙重捲軸。
- 底部「返回編輯 / 列印 / 另存 PDF」一直可見。
- Browser print preview 只看到 A4 pages，不看到底部 action bar 或 editor UI。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動 smoke：Chrome/Vite dev print preview。
- 手動 smoke：pywebview 開啟後 print preview 是否可用；若 CLI 無法完整驗證 GUI，result 必須明確標示未驗證或由使用者驗證。

### Story 4：圖片載入狀態與列印 / 另存 PDF 動作

**Objective:** 在圖片全部載入完成後才允許列印，並讓「列印」與「另存 PDF」共用同一個 print flow。

**Files:**
- Create: `src/features/PrintPreview/usePrintImageReadiness.ts`
- Modify: `src/features/PrintPreview/PrintPreviewView.tsx`
- Modify: `src/features/PrintPreview/PrintableDocument.tsx` or `PrintableSlot.tsx`

**Steps:**

1. 建立 hook 或 component-level 狀態追蹤 print DOM 中的圖片載入：
   - total images
   - loaded count
   - errored count
   - isReady
2. 對每個非空 slot 的 `<img>` 註冊 `onLoad` / `onError`。
3. 已 cache 完成的圖片也要正確算入 loaded，可用 `img.complete` 或 component mount 後掃描。
4. 圖片未 ready 前 disable「列印」與「另存 PDF」。
5. 點「列印」時：若 ready，呼叫 `window.print()`。
6. 點「另存 PDF」時：先顯示 toast / confirm 說明「將開啟系統列印對話框，請選擇另存為 PDF」，確認後呼叫同一個 `window.print()`。
7. 若有 errored images，允許使用者列印，但 action bar 應顯示警告，例如「有 N 張圖片載入失敗」。

**Acceptance:**

- 圖片尚未載入完成時不會直接觸發列印。
- 列印與另存 PDF 共用同一份 print DOM。
- 另存 PDF 不呼叫任何後端 PDF API。
- 有載入失敗時不靜默，使用者能看到警告。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動 smoke：大量圖片進入預覽後按鈕會等待載入完成。
- 手動 smoke：按「列印」能開系統列印對話框。
- 手動 smoke：按「另存 PDF」會提示使用者，再開同一個列印對話框。

### Story 5：列印版與 Word 排版一致性檢查及文件更新

**Objective:** 對照目前 Word auto-collage 行為，確認列印預覽的分頁、slot、編號與備註欄符合第一階段驗收目標，並更新使用者說明。

**Files:**
- Modify: `README.md`
- Modify: `src/utils/log.ts` if release note/changelog entry is desired
- Create: `docs/result/2026-07-03-0948-print-preview-pdf-story5-result.md`

**Steps:**

1. 建立一組手動 smoke 測資清單，至少包含：
   - 2 張橫圖。
   - 2 張大直圖。
   - 6 張小直圖。
   - 1 橫 + 3 小直。
   - 3 小直 + 1 橫。
   - 不足 slot 的頁面。
2. 對照右側縮圖、Word 輸出 payload pages、列印預覽 pages，確認頁面分組一致。
3. 檢查編號跨頁連續。
4. 檢查備註文字在 `top` / `center` 對齊設定下有可見差異。
5. 更新 README 使用說明，描述：
   - 預覽列印用途。
   - 另存 PDF 第一階段需透過系統列印對話框選擇 PDF。
6. 若更新 changelog，使用繁體中文與台灣用語，避免誇稱「自動輸出 PDF 檔」。

**Acceptance:**

- 文件不宣稱後端可直接產生 PDF。
- 手動 smoke 結果有寫入 result。
- 若發現 Word 與列印版不可避免差異，result 要列出差異與是否接受。

**Verification:**

- `pnpm run lint`
- `pnpm run build`
- 手動 smoke 結果截圖或文字記錄。

---

## 7. 驗收標準

整體完成時必須滿足：

1. 不新增 router dependency。
2. 不新增後端 PDF API / Playwright / Chromium / ReportLab。
3. 編輯頁與預覽列印頁可雙向切換，返回後資料不遺失。
4. 預覽列印頁是全頁 view，不是 Modal 疊 Modal。
5. 正式 A4 print DOM 與右側縮圖分離。
6. 五種 auto collage template 都可顯示。
7. 空 slot、圖片順序、跨頁編號符合 Word auto-collage layout 概念。
8. 實際列印只輸出 A4 pages，不輸出 app chrome 或操作列。
9. 「另存 PDF」清楚告知使用者透過系統列印對話框完成。
10. `pnpm run lint` 與 `pnpm run build` 通過；若有既有 unrelated failure，需在 result 明確記錄並提供 scoped verification。

---

## 8. Result report contract

每個 story 完成後必須建立 result：

- `docs/result/2026-07-03-0948-print-preview-pdf-story1-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story2-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story3-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story4-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story5-result.md`

Result 至少包含：

1. completed items mapped to story acceptance criteria
2. changed files
3. verification commands and exact outcomes
4. manual smoke evidence
5. blockers / deferred items
6. 是否有 macOS pywebview 實機列印預覽驗證；若沒有，需明確標示未驗證

---

## 9. 後續可選延伸，非本計畫 scope

若第一階段列印版面穩定，未來可另立計畫評估：

1. 程式化 PDF 輸出：
   - Playwright / Chromium：較接近前端頁面 fidelity，但打包成本高。
   - Python PDF renderer：打包較可能穩，但需維護另一套 renderer。
2. router / hash-based page state：只有當 app 變成多頁桌面工具、或需要 deep link 時再評估。
3. 列印設定保存到 project：需另行決策，因目前 canonical 決策是不保存 Word/輸出設定。
4. 裁切 UI 後，列印版同步套用 crop metadata。
