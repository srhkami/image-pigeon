---
type: result
id: result-image-pigeon-remove-automatic-update-2026-08-25
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-pure-frontend-version-2026-08-18
created_at: 2026-08-25
---

# 純前端版本移除自動更新結果

## 結論

純前端正式來源已移除啟動時版本檢查、更新提示、忽略版本狀態、遠端版本 API、版本請求型別、更新下載入口與專用網路政策。正式前端原始碼不再包含 `fetch` 或 XMLHttpRequest；靜態部署的內容安全政策（Content Security Policy, CSP）也不再允許連線至 `api.pigeonhand.tw`。

README 彈窗的版本化「不再顯示」不在本次核准範圍內，未修改其儲存鍵、七碼日期判定或顯示生命週期。

## 原始碼變更

- `src/App.tsx` 不再匯入或渲染 `ModalNewVersion`。
- `src/features/index.ts` 不再匯出更新提示元件。
- 刪除 `src/features/Intro/ModalNewVersion.tsx` 與 `src/features/Intro/newVersionDismissal.ts`。
- 刪除 `src/services/browserVersionCheck.ts`、`browserNetworkPolicy.ts` 及其測試。
- 刪除 `tests/newVersionDismissal.test.ts`。
- `src/utils/type.ts` 移除退役的 `VersionCheckData`。
- `src/services/browserExternalNavigation.ts` 移除退役的更新下載資料夾入口。
- `src/features/About/ModalDisclaimer.tsx` 移除仍宣稱保留自動更新的舊免責文字。

## 部署與契約變更

- `tests/browserRuntimeCutover.test.ts` 固定要求更新相關檔案不存在，且 App 與 feature barrel 不得引用更新提示。
- `tests/staticDeploymentContract.test.ts` 固定要求正式來源沒有 `fetch` 或 XMLHttpRequest。
- `scripts/verify-static-build.mjs` 不再允許版本 API，並把舊版本端點列入正式產物禁用字串。
- `docs/deployment/pure-frontend-static-hosting.md` 的 `connect-src` 收斂為 `'self'`，零上傳邊界改為不得出現背景外部 API 請求。
- README、CHANGELOG、現行架構與正式純前端計畫已校正；舊計畫與舊結果中的版本檢查敘述保留作歷史證據，並加上後續退場註記。

## TDD 證據

1. 先修改 `tests/browserRuntimeCutover.test.ts`，要求四個更新檢測來源檔案不存在且 App 無引用。
2. RED：`node --test tests/browserRuntimeCutover.test.ts` 為 2/3 通過；失敗原因是 `ModalNewVersion.tsx` 當時仍存在。
3. 移除正式來源後，同一命令為 3/3 通過。
4. 加入靜態零背景請求契約後，聚焦命令 `node --test tests/browserRuntimeCutover.test.ts tests/staticDeploymentContract.test.ts` 為 10/10 通過。

## 完整驗證

- `pnpm run test:frontend`：96 項中 95 項通過、1 項失敗。唯一失敗是既有範圍外 `PrintPreviewOutput.tsx` 已移除「可透過系統列印對話框另存 PDF」文案，不是本次更新退場造成；本工作未修改或接管該檔案。
- `pnpm run lint`：exit 0。
- `pnpm run build`：exit 0，Vite 轉換 299 modules；只保留既有單一區塊大於 500 kB 警告。
- `pnpm run verify:static`：exit 0；8 個正式產物檔案、6 個資產參照、禁用字串命中 0。
- `git diff --check` 與 `git diff --cached --check`：exit 0。
- 正式來源搜尋：`fetch`／XMLHttpRequest 命中 0；更新名稱只保留在負向契約測試與正式產物禁用字串。

## 本機瀏覽器煙霧驗證

以 `vite preview` 啟動 `dist/`，載入後等待超過舊版本檢查的 5 秒逾時：

- 頁面正常顯示「貼圖小鴿手」。
- 唯一對話框是既有 README 彈窗，沒有「有新版本可供下載」提示。
- Resource Timing 只有同源 CSS、JavaScript、兩個 Logo 與 SVG，共 5 筆；沒有 `api.pigeonhand.tw` 或其他外部 API 請求。

## Dirty worktree 護欄

- 修改前記錄 15 個既有 dirty 路徑與 SHA-256；暫存區為空。
- 寫入結果與狀態前，15 個既有 dirty 路徑的 SHA-256 均與基線一致；最後只有 `STATE.md` 因本次治理校正而新增同範圍內容，其餘 14 個既有 dirty 路徑仍與基線一致，沒有覆寫或刪除並行變更。
- 暫存區在前後皆為空，空 patch SHA-256 均為 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- 未 commit、未 push、未部署。

## 驗證限制

- 未執行目標 Windows 11／Microsoft Edge 人工驗收。
- 完整前端測試不是全綠；範圍外列印文案契約失敗已如實保留，不能宣稱 96/96 PASS。
