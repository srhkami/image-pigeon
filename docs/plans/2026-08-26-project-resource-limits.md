---
type: plan
id: plan-image-pigeon-project-resource-limits-2026-08-26
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-26
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-08-26-project-resource-limits-result.md
---

# 單一專案資源上限調整

## 目標

將單一專案的圖片數量上限調整為 1000 張，專案資源大小上限調整為 200 MiB（209,715,200 bytes）。

## 核准範圍

- `src/services/browserRuntimeContract.ts`
- `src/services/browserRuntimeContract.test.ts`
- `src/features/Upload/browserImportAdapter.test.ts`
- `STATE.md`
- 本計畫與對應結果文件

## 驗收條件

- 資產儲存區、專案封存與圖片輸出的圖片數量上限一致為 1000。
- 專案相關總量上限一致為 209,715,200 bytes。
- `.ipigeon` 封存項目數上限為 1001，包含 `project.json` 與最多 1000 張圖片。
- 聚焦測試、lint、build 與差異檢查完成並如實記錄。

## 非範圍

- 不調整單張圖片、單批匯入或解碼尺寸上限。
- 不 commit、push 或部署。
