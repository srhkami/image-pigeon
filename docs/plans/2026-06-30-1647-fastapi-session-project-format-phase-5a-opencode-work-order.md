---
id: work-order-image-pigeon-fastapi-session-project-format-phase-5a-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5A
executor: opencode
---

# OpenCode Work Order：Phase 5A ProjectV2 frontend foundation

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path；嚴禁自行組合或讀取任何 `/Users/...` absolute path；不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` Phase 5
- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-5-sliced-plan.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-3-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-4-result.md`
- 現有前端檔案：
  - `src/utils/type.ts`
  - `src/App.tsx`
  - `src/features/Upload/UploadMultiple.tsx`
  - `src/features/Upload/UploadLongScreen.tsx`
  - `src/features/ImagePreview/ImagePreview.tsx`
  - `src/features/ImagePreview/ImageCard.tsx`
  - `src/features/ImagePreview/ImageCardForMove.tsx`
  - `src/globak.d.ts`

## 任務範圍

只做 Phase 5A foundation。不要替換 UI、不要改 `App.tsx` state、不要改 UploadMultiple/UploadLongScreen 的行為、不要移除 `CustomImage`。

請新增：

1. `src/types/project.ts`
   - 型別需對齊後端 Phase 2-4 API response：
     - `Crop`
     - `Asset`
     - `Item`
     - `WordCompatibleGridLayout`
     - `ProjectV2`
     - `ProjectImportData`
     - `ProjectImportResponse`
     - `ProjectItemViewModel`
   - 注意後端 JSON 使用 alias：`assetId`、`itemOrder`、`originalName`。
   - rotation 型別：`0 | 90 | 180 | 270`。
   - `ProjectItemViewModel.previewUrl` 應為 session asset URL，不是 base64。

2. `src/services/apiClient.ts`
   - 新增 `requestJson<T>()` 或等價 helper。
   - 支援 GET/POST/FormData。
   - FormData 時不要手動設定 multipart `Content-Type`，避免 boundary 錯誤。
   - API error 應將後端 `message/detail` 轉成 Error message。

3. `src/services/imageApi.ts`
   - `importImages(params)`：呼叫 `POST /api/images/import`。
     - params 至少含 files、sessionId optional、quality、minSize。
     - 使用 field name `files`，多檔 append。
     - FormData key 必須符合後端：`session_id`、`files`、`quality`、`min_size`。
   - `importLongScreen(params)`：呼叫 `POST /api/images/import-long-screen`。
     - FormData key：`session_id`、`file`、`quality`、`min_size`。
   - `getAssetImageUrl(sessionId, assetId)`：回傳 `/api/sessions/${sessionId}/assets/${assetId}/image`。

4. `src/state/projectState.ts`
   - `createEmptyProject()`：建立與後端 default 相容的 ProjectV2。
   - `getDefaultLayout(project)`。
   - `applyImportResult(project, importData)`：append assets/items，append `layoutPatch.appendItemOrder` 到 default layout。
   - `getOrderedItemViewModels(project, sessionId)`：依 default layout `itemOrder` 排序，合併 item + asset，產出 preview URL。
   - `removeItem(project, itemId)`：移除 item 並從 itemOrder 移除；asset 可先保留，符合「刪除圖片第一階段只從前端列表移除」。
   - `reorderItem(project, activeId, overId)`：只改 itemOrder。
   - `updateItemRemark(project, itemId, remark)`。
   - `updateItemRotation(project, itemId, rotation)`。
   - 不要 mutate 原 project；回傳新 object，方便 React state。

## 驗收要求

- `pnpm -s tsc -b` 通過。
- `pnpm run build` 通過。
- `pnpm run lint` 可失敗於既有 lint，但不得新增 Phase 5A 新檔案 lint error。
- 不應修改 upload UI 主流程。
- 不應新增 test framework dependency。
- 不應讀取 `.env`。

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`

至少包含：

1. 完成項目。
2. 實際修改/新增檔案。
3. API contract 對齊說明（FormData keys、response shape）。
4. state helper 行為說明。
5. 驗證命令與結果。
6. 未完成項目 / blocker。

如果遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
