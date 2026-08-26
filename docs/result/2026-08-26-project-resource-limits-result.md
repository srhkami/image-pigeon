---
type: result
id: result-image-pigeon-project-resource-limits-2026-08-26
status: completed_with_known_test_gap
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-project-resource-limits-2026-08-26
created_at: 2026-08-26
---

# 單一專案資源上限調整結果

## 實際變更

- `src/services/browserRuntimeContract.ts`：資產儲存區、專案封存與圖片輸出的圖片上限調整為 1000；專案相關總量上限調整為 200 MiB（209,715,200 bytes）；封存項目數上限調整為 1001。
- `src/services/browserRuntimeContract.test.ts`：同步資源契約期待值，並以設定值推導一般圖片批次超限案例。
- `src/features/Upload/browserImportAdapter.test.ts`：同步長截圖可用資產容量期待值為 999、998。

## 驗證

- `node --test src/services/browserRuntimeContract.test.ts`：4/4 通過。
- `pnpm run test:frontend`：108/110 通過；本輪相關的資源契約與匯入容量測試均通過。兩項既有範圍外失敗仍為列印文案契約與版本值 `3.1.0`／測試期待 `3.0.0` 不一致。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；Vite 保留單一 chunk 大於 500 kB 的警告。
- `git diff --check`：通過。

## 未執行

- 未執行瀏覽器人工驗收。
- 未 commit、push 或部署。
