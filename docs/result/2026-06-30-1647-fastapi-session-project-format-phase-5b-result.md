---
id: result-image-pigeon-fastapi-session-project-format-phase-5b-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5B
---

# Phase 5B：上傳主線改 FastAPI multipart 實作結果

## 完成項目

- `App.tsx` 新增 `project` state，初始使用 `createEmptyProject()`；新增 `sessionId` state，初始 `null`。
- `ModalUpload.tsx` 接收 `project/setProject/sessionId/setSessionId`，並傳給 `UploadMultiple`、`UploadLongScreen`。
- `UploadMultiple.tsx` 改為使用 `importImages()`，移除 `fileToBase64` 與 `window.pywebview.api.upload_image`。
- `UploadLongScreen.tsx` 改為使用 `importLongScreen()`，移除 `fileToBase64` 與 `window.pywebview.api.crop_image`。
- 新增 `src/state/projectImageAdapter.ts`，提供 `toCustomImagesFromImportData()`，將 `ProjectImportData` 映射為 legacy `CustomImage[]`。
- `globak.d.ts` 保留 legacy `upload_image/crop_image`，加註 `legacy` 說明，避免新上傳元件再依賴它們。

## 實際修改 / 新增檔案

- `src/App.tsx`
- `src/features/Upload/ModalUpload.tsx`
- `src/features/Upload/UploadMultiple.tsx`
- `src/features/Upload/UploadLongScreen.tsx`
- `src/state/projectImageAdapter.ts`
- `src/globak.d.ts`

## 一般圖片批次上傳流程

- 使用者在 `UploadMultiple` 選擇多張檔案後，先以 `batchSize = 3` 切批（符合 2-4 張建議）。
- 每批呼叫 `importImages({ files, quality, minSize, sessionId })`。
- 每筆 response 呼叫 `applyImportResult(project, response.data)` 更新目前 `project`，並以 `response.data.sessionId` 保持 session。
- 透過 `toCustomImagesFromImportData(response.data, response.data.sessionId, remarkMode)` 轉成 `CustomImage[]`，`preview` 直接指向 `getAssetImageUrl(sessionId, assetId)`。
- 備註模式：
  - `isFileNameMode = true` 時，用 `asset.originalName` 當作 remark；如無 fallback 到 `defaultRemark`。
  - `isFileNameMode = false` 時，整批套用 `defaultRemark`。
- 更新進度：`done += max(response.items.length, batch.length)`，每個 batch 後呼叫 `window.pywebview.updateProgress(done)`。

## 長截圖上傳流程

- `UploadLongScreen` 逐檔上傳（每次只處理一張長截圖）到 `importLongScreen()`。
- 每筆 response 先 `applyImportResult(project, response.data)`，再用 `toCustomImagesFromImportData(...)` 轉成 `CustomImage[]`。
- 每張原圖皆補上 `defaultRemark`。
- 每檔完成 `done++` 後呼叫 `window.pywebview.updateProgress(done)`；若單檔有多段切割，會依後端回傳新增對應項目。

## ProjectV2 / session state 更新

- `UploadMultiple`/`UploadLongScreen` 各自保有本次上傳的 `nextProject`，每筆 response 都累加使用 `applyImportResult`。
- 每筆 response 都更新 `nextSessionId = response.data.sessionId`。
- 上傳完成後一次呼叫 `setProject(nextProject)` 與 `setSessionId(nextSessionId)`，使後續上傳可沿用同一 session。

## Transition adapter 如何避免保存 base64

- `toCustomImagesFromImportData()` 只建立 `CustomImage(null, remark)`，再覆寫：
  - `id = item.id`
  - `preview = getAssetImageUrl(sessionId, asset.id)`
  - `width/height = asset.width/height`
  - `rotation = item.rotation`
  - `base64` 保持 `null`（不回填上傳來源 base64）。
- 因此 preview bridge 完全由 session asset URL 組成，且符合不再使用 base64 的 Phase 5B 過渡規範。

## 驗證命令與結果

- `pnpm -s tsc -b`
  - 結果：通過
- `pnpm run build`
  - 結果：通過，仍有既有 chunk size 警告（非本階段新增）
- `pnpm run lint`
  - 結果：失敗，僅既有前置問題：
    - `src/layout/Test.tsx` `@typescript-eslint/no-explicit-any`
    - `src/utils/handleError.ts` `@typescript-eslint/no-explicit-any`
    - `src/utils/handleToast.ts` `@typescript-eslint/no-explicit-any`
- grep 驗收
  - `UploadMultiple.tsx` 無 `fileToBase64`、`upload_image`
  - `UploadLongScreen.tsx` 無 `fileToBase64`、`crop_image`

## 未完成項目 / blocker

- 無 blocker；Phase 5B 範圍內項目完成。

## Hermes 驗收補充

- Hermes 端重讀 `UploadMultiple.tsx`、`UploadLongScreen.tsx`、`projectImageAdapter.ts` 後發現：OpenCode 版本的 preview bridge 會顯示 default/file name remark，但 `applyImportResult()` 寫入 `ProjectV2.items` 前尚未同步 remark，會讓 Phase 5C/ProjectV2 主 state 保留後端空 remark。
- Hermes 已新增 `applyImportRemarks()`，並讓一般圖片與長截圖在 `applyImportResult()` 前先套用 default/file name remark，確保 preview bridge 與 `ProjectV2.items[].remark` 一致。
- Hermes 端重跑 `pnpm -s tsc -b`：通過。
- Hermes 端重跑 `pnpm run build`：通過。
- Hermes 端重跑 `pnpm run lint`：仍只失敗於既有 3 errors / 3 warnings，未出現 Phase 5B 修改檔案 lint error。
- Hermes grep：`UploadMultiple.tsx` / `UploadLongScreen.tsx` 已無 `fileToBase64`、`upload_image`、`crop_image` 主線呼叫；剩餘 `fileToBase64` 僅在 legacy `base64.ts` / `ReadJson.tsx` 路徑。
