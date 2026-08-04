---
type: result
id: result-image-pigeon-ignore-update-version-2026-08-04
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-ignore-update-version-2026-08-04
created_at: 2026-08-04
---

# 忽略指定更新版本功能結果

## 變更

- 新增 `src/features/Intro/newVersionDismissal.ts`，集中處理遠端 `updated_at` 的七碼民國日期轉換、LocalStorage 寫入及提示顯示判斷。
- LocalStorage key 為 `image-pigeon.ignored-update-date`；例如 API 的 `2026-07-15` 儲存為 `1150715`。
- `ModalNewVersion` 新增「忽略此版本」按鈕。只有點擊該按鈕才永久寫入 LocalStorage；右上角關閉與背景關閉仍只沿用既有 SessionStorage 行為。
- 遠端日期等於已忽略日期時不顯示；遠端日期不同時重新顯示。日期無效時採 fail-open，仍顯示提示且不寫入錯誤忽略值。
- `VersionCheckData` 補上目前 API 已實際回傳的 `updated_at` 欄位。

## TDD evidence

- RED：新增測試後，因 `newVersionDismissal.ts` 尚不存在而以 `ERR_MODULE_NOT_FOUND` 失敗。
- GREEN：實作純函式與 UI 接線後，聚焦測試 6/6 通過。
- 完整前端測試加入新測試後共 21/21 通過。

## 驗證

- `pnpm run test:frontend`：21/21 通過。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；Vite 仍有單一 chunk 大於 500 kB 的既有警告。
- `git diff --check`：通過。
- staged-file guard：沒有 staged files。
- dirty baseline guard：上一輪檔案選擇器修正、使用者套件更新與其他既有未提交檔案均未被本輪改動。

## Browser UAT

在 Vite browser runtime 使用實際更新 API 驗證：

1. 初始 LocalStorage 無忽略值時，新版本提示顯示「忽略此版本」按鈕。
2. 點擊後寫入 `1150715` 並關閉提示。
3. 重新載入後，同一個 API `updated_at: 2026-07-15` 不再顯示提示。
4. 將儲存值改為前一日期 `1150714` 後重新載入，提示再次顯示，證明下一個不同日期會重新提示。
5. 驗收後清除測試用 LocalStorage／SessionStorage；browser console 沒有 JavaScript 錯誤。

本輪沒有執行 pywebview 打包版 GUI UAT、發布、commit 或 push。
