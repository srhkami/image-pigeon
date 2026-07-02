---
id: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
type: plan
status: active
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 5
---

# Phase 5：前端 ProjectV2 state 重構切片計畫

## 目標

把前端從長期保存 `CustomImage.base64` 的主線流程，逐步轉成 ProjectV2 + session asset URL + `layout.itemOrder` 的資料模型。為避免一次性改動輸出、排序、上傳、長截圖、JSON 匯入造成回歸，Phase 5 拆成可獨立驗收的切片。

## 切片原則

- 每片都必須 `pnpm -s tsc -b` 與 `pnpm run build` 通過。
- `pnpm run lint` 目前有既有錯誤，可執行並記錄；不得新增新的 lint error。
- 不改 Phase 6+ 專案儲存/開啟、不改 Word/另存圖片後端輸出 API。
- 若仍需相容舊 `CustomImage[]` 輸出流程，必須明確標註是 transition adapter，不可重新引入上傳 base64 作為主線。
- OpenCode 每片需寫 `docs/result/...`，Hermes 需重跑驗收後才進下一片。

## Phase 5A：ProjectV2 types / API client / state helper foundation

範圍：不替換 UI，只建立可用的型別與 helper。

交付：

- `src/types/project.ts`
  - ProjectV2 / Asset / Item / Crop / Layout / ProjectItemViewModel 等型別。
- `src/services/apiClient.ts`
  - `requestJson<T>()` 或等價 helper。
  - 需支援 FormData，不手動覆蓋 multipart boundary。
- `src/services/imageApi.ts`
  - `importImages()` 呼叫 `POST /api/images/import`。
  - `importLongScreen()` 呼叫 `POST /api/images/import-long-screen`。
  - `getAssetImageUrl(sessionId, assetId)` 回傳 `/api/sessions/${sessionId}/assets/${assetId}/image`。
- `src/state/projectState.ts`
  - `createEmptyProject()`。
  - `applyImportResult(project, result)`。
  - `getDefaultLayout(project)`。
  - `getOrderedItemViewModels(project, sessionId)`。
  - `removeItem(project, itemId)`。
  - `reorderItem(project, activeId, overId)`。
  - `updateItemRemark(project, itemId, remark)`。
  - `updateItemRotation(project, itemId, rotation)`。
- 不改現有 `App.tsx` state、不改 upload UI。

驗收：

- `pnpm -s tsc -b` 通過。
- `pnpm run build` 通過。
- `pnpm run lint` 執行並記錄既有錯誤。
- result report：`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`。

## Phase 5B：一般圖片 / 長截圖上傳改呼叫 FastAPI API

範圍：用 5A helper 串上傳，不完整替換所有 preview/output state。

交付：

- `UploadMultiple.tsx` 改用 `imageApi.importImages()`，不再 fileToBase64 + `window.pywebview.api.upload_image`。
- `UploadLongScreen.tsx` 改用 `imageApi.importLongScreen()`，不再 fileToBase64 + `window.pywebview.api.crop_image`。
- 仍可透過 transition adapter 把 ProjectV2 item 轉成現有 preview card 可用資料，但 preview `src` 必須使用 session asset URL，不可保存 base64。
- 進度：一般圖片依批次 2-4 張分批 request，顯示 N / total；長截圖多檔可逐檔 request。
- `globak.d.ts` 移除或降低 upload/crop 主線依賴；若舊 API 暫保留，需註記 legacy。

驗收：

- 前端 upload source 不再出現 `fileToBase64` + `upload_image/crop_image` 主線呼叫。
- `pnpm -s tsc -b`、`pnpm run build` 通過。
- result report：`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5b-result.md`。

## Phase 5C：App / ImagePreview 使用 ProjectV2 + layout.itemOrder

範圍：把核心前端 state 從 `CustomImage[]` 遷到 ProjectV2。

交付：

- `App.tsx` 保存 `project` 與 `sessionId`。
- `ImagePreview` 用 `getOrderedItemViewModels(project, sessionId)` 渲染。
- 排序只改 `layout.itemOrder`。
- 刪除只更新前端 state，不呼叫後端 delete。
- 備註、旋轉更新 ProjectV2 item metadata。

驗收：

- 排序、刪除、備註、旋轉 UI 可編譯且資料更新路徑明確。
- `pnpm -s tsc -b`、`pnpm run build` 通過。
- result report：`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5c-result.md`。

## Phase 5D：輸出 UI 過渡檢查

範圍：在 Phase 8/9 後端輸出 API 完成前，先確保輸出 UI 能拿到 ProjectV2 + `layout.itemOrder`，並明確隔離 legacy adapter。

交付：

- `ModalOutput` / `SaveWord` / `SaveImages` props 可接 project/session/layout 或明確 adapter。
- 若仍呼叫舊 pywebview `save_docx/save_images`，必須標為 legacy bridge，不在 project.json 保存輸出設定。
- 不在此片重寫後端 export。

驗收：

- 輸出 request / adapter 的 item order 來源是 `layout.itemOrder`。
- `pnpm -s tsc -b`、`pnpm run build` 通過。
- result report：`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5d-result.md`。
