---
id: work-order-image-pigeon-fastapi-session-project-format-phase-5d-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5D
executor: opencode
---

# OpenCode Work Order：Phase 5D 輸出 UI bridge 對齊 ProjectV2/layout.itemOrder

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path；嚴禁自行組合或讀取任何 `/Users/...` absolute path；不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-5-sliced-plan.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5b-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5c-result.md`
- Source：
  - `src/types/project.ts`
  - `src/state/projectState.ts`
  - `src/state/projectImageAdapter.ts`
  - `src/App.tsx`
  - `src/layout/Footer.tsx`
  - `src/features/Output/ModalOutput.tsx`
  - `src/features/Output/SaveWord.tsx`
  - `src/features/Output/SaveImages.tsx`
  - `src/features/Output/SaveJson.tsx`
  - `src/utils/type.ts`
- Legacy pywebview output behavior for context only：
  - `py/save_images.py`
  - `py/save_docx.py`
  - `py/main.py` save_docx/save_images handlers

## 背景

Phase 5B/5C 後，preview 主線已是 session asset URL，不再保存上傳 base64。但目前 legacy `save_docx` / `save_images` pywebview API 仍接 `CustomImage[]` 並要求 `image.base64`。Phase 8 才會改後端輸出 API；5D 要做的是「過渡 bridge」：輸出 UI 以 ProjectV2 + `layout.itemOrder` 作 source of truth，在按下輸出時才把 session asset URL fetch 成 data URL/base64，組成 legacy `CustomImage[]` payload 給舊 API。

## 任務目標

- `ModalOutput` / `SaveWord` / `SaveImages` 能接收 `project` + `sessionId`，以 ProjectV2/layout order 建立輸出 payload。
- Word/另存圖片 request 的 item order 來源必須是 `layout.itemOrder`。
- 不把 base64 存回 ProjectV2，也不要在上傳/preview 主線保存 base64；base64 只允許在 output bridge 當下短暫產生。
- `SaveJson` 舊版 JSON 可暫留 legacy，但必須標示 legacy 或保留現有 images；不要把它當作新版專案儲存（Phase 6 會處理）。

## 必須完成

### 1. 新增 output bridge helper

建議新增：`src/state/projectOutputAdapter.ts`

功能：

- `buildLegacyOutputImages(project: ProjectV2, sessionId: string): Promise<CustomImage[]>`
  - 使用 `getOrderedItemViewModels(project, sessionId)`。
  - 依 view model 順序逐張 fetch `previewUrl`。
  - 將 response blob 轉 data URL。
  - 建立 `CustomImage(null, remark)`，設定：
    - `id = itemId`
    - `preview = previewUrl`
    - `base64 = dataUrl`
    - `width/height`
    - `rotation`
    - `remark`
  - 若 `sessionId` 缺失或 fetch 失敗，丟出明確 Error，讓 toast 顯示。
- 請避免把轉出的 base64 寫回 ProjectV2 或全域 state。

### 2. ModalOutput 改接 ProjectV2/session

- Props 加入：`project: ProjectV2`、`sessionId: string | null`、`itemCount: number`。
- 輸出按鈕 disabled 條件用 `itemCount === 0`。
- 傳 `project/sessionId/itemCount` 給 `SaveWord`、`SaveImages`。
- `SaveJson` 可以保留 `images` legacy props，但 UI/註解需明確是舊版 JSON，且不代表 Phase 6 新版專案儲存。

### 3. SaveWord 改從 ProjectV2 建 legacy payload

- Props 改為 `project/sessionId/itemCount`（可不再依賴 `images`）。
- onSave 中，在呼叫 legacy `window.pywebview.api.save_docx` 前：
  - 若無 sessionId，throw `尚未建立圖片 session，請先重新匯入圖片` 或類似明確錯誤。
  - 呼叫 `buildLegacyOutputImages(project, sessionId)`。
  - data.images 使用轉換後的 ordered legacy images。
- `AlertLoading count` 使用 `itemCount`。
- 不改後端 `save_docx`。

### 4. SaveImages 改從 ProjectV2 建 legacy payload

- 同 SaveWord，呼叫 legacy `window.pywebview.api.save_images` 前才轉 base64。
- `AlertLoading count` 使用 `itemCount`。
- 另存圖片的排序必須來自 `layout.itemOrder`。

### 5. Footer/App 傳遞

- `App.tsx` / `Footer.tsx` 必須把 project/sessionId/itemCount 傳到 `ModalOutput`。
- 全部清除仍保留 5C 行為。

## 保持範圍

不要做：

- 不要改後端輸出 API（Phase 8）。
- 不要實作 `.ipigeon/` 專案儲存/開啟（Phase 6）。
- 不要把 base64 存回 ProjectV2 或 upload/preview state。
- 不要刪除 legacy `CustomImage` class。
- 不要重寫 SaveJson 成新版專案儲存；最多加 legacy 註解/文案。
- 不要修既有 lint errors，除非是你修改檔案新增的新 lint error。

## 驗收要求

- `pnpm -s tsc -b` 通過。
- `pnpm run build` 通過。
- `pnpm run lint` 可失敗於既有 lint，但不得新增 Phase 5D 修改檔案 lint error。
- 讀檔/grep 驗收：
  - `SaveWord.tsx` / `SaveImages.tsx` 不應直接使用 props `images` 作輸出順序。
  - 輸出 adapter 必須使用 `getOrderedItemViewModels()`。
  - base64 只在 output adapter/build function 產生，不寫入 ProjectV2。

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5d-result.md`

至少包含：

1. 完成項目。
2. 修改/新增檔案。
3. Word/另存圖片如何從 ProjectV2/layout.itemOrder 建立 legacy output payload。
4. base64 如何限制在 output bridge 當下產生。
5. SaveJson legacy 狀態與 Phase 6 關係。
6. 驗證命令與結果。
7. 未完成項目 / blocker。

如果遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
