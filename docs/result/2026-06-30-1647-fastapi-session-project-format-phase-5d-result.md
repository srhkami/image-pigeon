---
id: result-image-pigeon-fastapi-session-project-format-phase-5d-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5D
---

# Phase 5D：輸出 UI bridge 對齊 ProjectV2/layout.itemOrder 執行結果

## 完成項目

- `ModalOutput` 接收 `project / sessionId / itemCount`，輸出按鈕啟用條件改用 `itemCount === 0`。
- `SaveWord` 與 `SaveImages` 改為接 `project / sessionId / itemCount`，並在執行前建立 legacy payload。
- 新增 `src/state/projectOutputAdapter.ts`，提供 `buildLegacyOutputImages(project, sessionId)`：以 `getOrderedItemViewModels()` 取 `ProjectV2` + `layout.itemOrder` 順序，fetch `previewUrl` 後轉 data URL，再組 `CustomImage`。
- `Footer` / `App` 傳遞 `project`、`sessionId`、`itemCount` 到輸出對話框。
- `SaveJson` 保留 legacy JSON 匯出行為，提醒文案明確註記為舊版 JSON，不等同新版專案儲存。

## 修改 / 新增檔案

- `src/state/projectOutputAdapter.ts`（新增）
- `src/features/Output/ModalOutput.tsx`
- `src/features/Output/SaveWord.tsx`
- `src/features/Output/SaveImages.tsx`
- `src/features/Output/SaveJson.tsx`
- `src/layout/Footer.tsx`
- `src/App.tsx`

## Word / 另存圖片 payload 建立方式

- 以 `ProjectV2` 的預設 layout (`layout_word_default`) 為準，透過 `getOrderedItemViewModels(project, sessionId)` 取得排序後 `ProjectItemViewModel[]`。
- 逐筆 `for...of` 依序 fetch `previewUrl`，`blob` 轉成 data URL，建立 `CustomImage(null, remark)`，再覆寫
  `id / preview / base64 / width / height / rotation`。
- 將 `outputImages` 傳入 `window.pywebview.api.save_docx` 與 `window.pywebview.api.save_images`，因此排序與資料欄位都落在 `layout.itemOrder` 的順序與 legacy 介面對齊。

## base64 時機與範圍

- `ProjectV2` 不儲存 `base64`。
- `base64` 僅在 `buildLegacyOutputImages()` 執行當下，由 `fetch(previewUrl) -> blob -> FileReader.readAsDataURL` 產生。
- 其他流程（上傳、預覽、排序）不會將 data URL 寫回 `project` 或全域 `images` state。

## SaveJson legacy 狀態

- `SaveJson` 仍接 `images: CustomImage[]` 作 legacy 輸出，僅保留舊版 JSON 相容行為。
- 介面文案明確說明：非 Phase 6 的新版 `.ipigeon` 專案儲存（本階段不改後端 API）。

## 驗證命令與結果

- `pnpm -s tsc -b`：通過。
- `pnpm run build`：通過；仍有既有 chunk size warning。
- `pnpm run lint`：失敗（既有）：`Test.tsx`、`handleError.ts`、`handleToast.ts` 的 `@typescript-eslint/no-explicit-any`，本次修改未新增 lint error。
- grep 驗收：
  - `SaveWord.tsx` / `SaveImages.tsx` 不再以 `props.images` 當作輸出來源與排序。
  - adapter 使用 `getOrderedItemViewModels()`。
  - `projectOutputAdapter.ts` 於輸出當下產生 `base64`，未改寫 `project`。

## 未完成項目 / blocker

- 無 blocker。

## Hermes 驗收補充

- Hermes 端重讀輸出 UI 後發現：OpenCode 版本雖標示 `SaveJson` 為 legacy，但輸出 Modal 預設仍停在舊版 JSON，而新版 session 匯入的 legacy `images.base64` 可能為 `null`，容易讓使用者誤觸壞掉的舊 JSON 匯出。
- Hermes 已修正 `ModalOutput`：預設 tab 改為「另存圖片」，舊版 JSON tab 改名「舊版 JSON」。
- Hermes 已修正 `SaveJson`：若目前 `images` 不全都有 base64，顯示 warning 並停用舊版 JSON 儲存按鈕；新版專案儲存仍留到 Phase 6。
- Hermes 端重跑 `pnpm -s tsc -b`：通過。
- Hermes 端重跑 `pnpm run build`：通過。
- Hermes 端重跑 `pnpm run lint`：仍只失敗於既有 3 errors / 3 warnings，未出現 Phase 5D 修改檔案 lint error。
- Hermes grep：`SaveWord.tsx` / `SaveImages.tsx` 透過 `buildLegacyOutputImages()` 輸出；adapter 使用 `getOrderedItemViewModels()`，base64 僅於 `projectOutputAdapter.ts` 的輸出 bridge 當下產生。
