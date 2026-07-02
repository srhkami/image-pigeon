---
id: result-image-pigeon-fastapi-session-project-format-phase-5a-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5A
---

# Phase 5A：ProjectV2 foundation 執行結果

## 完成項目

- 新增 `src/types/project.ts`：定義 `Crop`、`Asset`、`Item`、`WordCompatibleGridLayout`、`ProjectV2`、`ProjectImportData`、`ProjectImportResponse`、`ProjectItemViewModel`。
- 新增 `src/services/apiClient.ts`：建立 `requestJson<T>()`，支援 `GET`/`POST`，同時支援 `FormData`。
- 新增 `src/services/imageApi.ts`：新增 `importImages()`、`importLongScreen()`、`getAssetImageUrl()`。
- 新增 `src/state/projectState.ts`：實作 `createEmptyProject()`、`getDefaultLayout()`、`applyImportResult()`、`getOrderedItemViewModels()`、`removeItem()`、`reorderItem()`、`updateItemRemark()`、`updateItemRotation()`。
- 未改 `App.tsx`、`UploadMultiple.tsx`、`UploadLongScreen.tsx`，未移除 `CustomImage`。

## 實際修改 / 新增檔案

- `src/types/project.ts`
- `src/services/apiClient.ts`
- `src/services/imageApi.ts`
- `src/state/projectState.ts`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`

## API contract 對齊說明

- `POST /api/images/import`
  - 使用 `multipart/form-data`
  - FormData key：`session_id`（optional）、`files`（multi）、`quality`、`min_size`
  - 回傳型別對齊 `ProjectImportResponse` / `ProjectImportData`
- `POST /api/images/import-long-screen`
  - 使用 `multipart/form-data`
  - FormData key：`session_id`（optional）、`file`、`quality`、`min_size`
  - 回傳型別同 `ProjectImportResponse`，含可選 `segments`
- `GET /api/sessions/${sessionId}/assets/${assetId}/image`
  - `getAssetImageUrl(sessionId, assetId)` 回傳該路徑字串
- `requestJson<T>()`
  - 非 2xx 時，會嘗試讀取 backend `message` 與 `detail` 組字後 throw `Error`
  - 若 body 是 `FormData` 不會手動設定 `Content-Type`
  - 若回傳 payload status >= 400，同樣拋錯

## state helper 行為

- `createEmptyProject()`：建立與後端預設一致的 ProjectV2（`schema: image-pigeon.project`, `version: 2`, 預設標題、空 assets/items、預設 `layout_word_default`）。
- `getDefaultLayout()`：優先以 `id === layout_word_default` 取 layout；無則回退第一個 `word-compatible-grid`；皆無回傳空白預設 layout。
- `applyImportResult()`：將 `assets/items` append 進 project，並把 `layoutPatch.appendItemOrder` append 到預設 layout。
- `getOrderedItemViewModels()`：依預設 layout `itemOrder` 取用 `Item` 與 `Asset` 並產生 `previewUrl`。
- `removeItem()`：僅移除 `item` 與 `itemOrder` 項目，`asset` 不刪。
- `reorderItem()`：僅調整預設 layout `itemOrder`。
- `updateItemRemark()` / `updateItemRotation()`：回傳新的 `ProjectV2` 並 immutably 更新對應 item。

## 驗證命令與結果

- `pnpm -s tsc -b`
  - 結果：通過
- `pnpm run build`
  - 結果：通過，含既有 chunk size warning（非本階段新增）
- `pnpm run lint`
  - 結果：失敗，既有 error 保持：
    - `src/layout/Test.tsx` 的 `no-explicit-any`
    - `src/utils/handleError.ts` 的 `no-explicit-any`
    - `src/utils/handleToast.ts` 的 `no-explicit-any`
  - 未新增 Phase 5A 檔案 lint error

## 未完成項目 / blocker

- 無新增 blocker。
- 現階段不涉及 Phase 5B 的上傳邏輯切換與其他 UI 狀態遷移，未列入 5A 範圍。

## Hermes 驗收補充

- Hermes 端重跑 `pnpm -s tsc -b`：通過。
- Hermes 端重跑 `pnpm run build`：通過。
- Hermes 端重跑 `pnpm run lint`：仍失敗於既有 3 errors / 3 warnings，未出現 Phase 5A 新檔案 lint error。
- Hermes 端檢查後端 `Asset.original_name` 第一階段可為 `null`，已將 `src/types/project.ts` 的 `Asset.originalName` 與 `ProjectItemViewModel.originalName` 修正為 `string | null`，避免後續串接 API 時型別合約過窄。
