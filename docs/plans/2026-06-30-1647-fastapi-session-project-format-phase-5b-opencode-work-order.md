---
id: work-order-image-pigeon-fastapi-session-project-format-phase-5b-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5B
executor: opencode
---

# OpenCode Work Order：Phase 5B 圖片/長截圖匯入串接新 API

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path；嚴禁自行組合或讀取任何 `/Users/...` absolute path；不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` Phase 5
- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-5-sliced-plan.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`
- Phase 3/4 result：
  - `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-3-result.md`
  - `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-4-result.md`
- Phase 5A files：
  - `src/types/project.ts`
  - `src/services/apiClient.ts`
  - `src/services/imageApi.ts`
  - `src/state/projectState.ts`
- 現有 UI：
  - `src/App.tsx`
  - `src/features/Upload/ModalUpload.tsx`
  - `src/features/Upload/UploadMultiple.tsx`
  - `src/features/Upload/UploadLongScreen.tsx`
  - `src/features/ImagePreview/ImagePreview.tsx`
  - `src/features/ImagePreview/ImageCard.tsx`
  - `src/features/ImagePreview/ImageCardForMove.tsx`
  - `src/globak.d.ts`

## 任務目標

把「一般圖片」與「長截圖分割」上傳主線從 pywebview base64 API 改成 FastAPI multipart API：

- 一般圖片：`POST /api/images/import`
- 長截圖：`POST /api/images/import-long-screen`

同時保持現有 preview UI 可以正常編譯與操作。這是 Phase 5B 過渡切片，不要求完整完成 Phase 5C 的 ImagePreview ProjectV2 重構，也不要改 Phase 8/9 輸出後端。

## 必須完成

### 1. App/ModalUpload 傳遞 ProjectV2 session state

在 `App.tsx` 新增：

- `project` state，初始 `createEmptyProject()`。
- `sessionId` state，初始 `null`。

把 `project/setProject/sessionId/setSessionId` 傳給 `ModalUpload`，再傳給 `UploadMultiple` / `UploadLongScreen`。

現有 `images: CustomImage[]` state 可以暫留，供 preview/output legacy bridge 使用。

### 2. 一般圖片上傳改用 `importImages()`

修改 `UploadMultiple.tsx`：

- 移除主線 `fileToBase64` 使用。
- 不再呼叫 `window.pywebview.api.upload_image`。
- 使用 `importImages()`。
- 以每批 2-4 張分批 request；建議 batch size = 3。
- FormData 由 `imageApi.importImages()` 處理，不在 component 手動 fetch。
- 對每批 response：
  - `checkStatus` 可不再使用於新 API；若使用需確保型別/狀態正確。
  - 用 `applyImportResult(project, response.data)` 更新 project。
  - 更新 `sessionId` 為 response.data.sessionId。
  - 依 response.data.items/assets 產生現有 `CustomImage[]` preview bridge。
- 檔名備註模式：若 `isFileNameMode` 為 true，前端需把新 items 的 remark 更新為對應檔名；如果後端 response 預設 remark 是空字串，前端需補上。若是 batch request，注意 item 與 file 順序對應。
- 非檔名模式：新 items remark 應套用 `defaultRemark`。
- 進度：每完成一張 image item，更新 `done` 與 `window.pywebview.updateProgress(done)`；若某檔 skipped/error，仍要避免進度卡死，可依完成處理的檔案數更新。

### 3. 長截圖上傳改用 `importLongScreen()`

修改 `UploadLongScreen.tsx`：

- 移除主線 `fileToBase64` 使用。
- 不再呼叫 `window.pywebview.api.crop_image`。
- 使用 `importLongScreen()`，逐檔 request。
- 每個 response 可產生多個 segment items。
- 每個 segment item 的 remark 套用 `defaultRemark`。
- 更新 project/sessionId。
- 產生現有 `CustomImage[]` preview bridge，preview 必須用 session asset URL，不可用 base64。
- 進度可按檔案數更新；若方便也可按 segment 數更新，但 UI count 必須一致不卡住。

### 4. Transition adapter

因 Phase 5C 尚未把 ImagePreview 完全改成 ProjectV2，本片允許新增 transition adapter，例如：

- `src/state/projectImageAdapter.ts`

需求：

- 把 `ProjectImportData` + `sessionId` + remark overrides 轉成 `CustomImage[]`。
- `CustomImage.preview` 必須是 `getAssetImageUrl(sessionId, assetId)`。
- `CustomImage.base64` 不可設定為上傳來源 base64；可維持 `null`。
- `CustomImage.id` 最好設為 item id，讓排序/刪除過渡期仍可對應 item。
- `width/height/rotation/remark` 來自 item/asset。
- 若需要新增 `CustomImage.fromProjectItemViewModel()`，可修改 `src/utils/type.ts`，但不要破壞既有 `fromBase64()` legacy JSON 匯入。

### 5. 型別宣告清理

修改 `src/globak.d.ts`：

- `upload_image` / `crop_image` 可以暫留為 legacy，但要加註解或重新整理型別，不能讓新 upload components 繼續依賴它們。
- 不要移除 `save_docx/save_images/save_json/select_path`，後續 Phase 仍會用到。

### 6. 保持範圍

不要做：

- 不要改後端 API。
- 不要實作 `.ipigeon/` 儲存/開啟。
- 不要重寫 Word/另存圖片後端輸出。
- 不要完全重構 ImagePreview 到 ProjectV2（那是 5C）。
- 不要改舊版 JSON 匯入（Phase 7）。
- 不要修既有 lint errors，除非是你新增或修改檔案產生的新 lint error。

## 驗收要求

- `pnpm -s tsc -b` 通過。
- `pnpm run build` 通過。
- `pnpm run lint` 可失敗於既有 lint，但不得新增 Phase 5B 修改檔案的 lint error。
- grep 驗收：
  - `UploadMultiple.tsx` 不應再有 `fileToBase64` 或 `upload_image`。
  - `UploadLongScreen.tsx` 不應再有 `fileToBase64` 或 `crop_image`。
- Preview bridge 使用 session asset URL，不可把新 API 結果轉回 base64。

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5b-result.md`

至少包含：

1. 完成項目。
2. 修改/新增檔案。
3. 一般圖片批次上傳流程說明。
4. 長截圖上傳流程說明。
5. ProjectV2/session state 如何更新。
6. transition adapter 如何避免保存 base64。
7. 驗證命令與結果。
8. 未完成項目 / blocker。

如果遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
