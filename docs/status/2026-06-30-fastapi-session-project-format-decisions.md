---
id: status-image-pigeon-fastapi-session-project-format-decisions-2026-06-30
type: status
status: current
canonical: true
created_at: 2026-06-30T16:47:00+08:00
updated_at: 2026-06-30T16:47:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
---

# image-pigeon FastAPI Session + Project Format 決策紀錄

此文件記錄正式計畫前已確認的架構與產品決策。正式執行以 `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` 為準。

## 決策表

| 編號 | 決策 | 結果 |
|---|---|---|
| D01 | 新版專案格式 | 使用資料夾 `<name>.ipigeon/`，不使用 zip。 |
| D02 | 儲存 JSON | 新版「儲存專案」取代舊「儲存 JSON」，主線不再需要儲存 JSON。 |
| D03 | 開啟專案 | 第一階段同時做儲存新版專案與開啟新版專案。 |
| D04 | 舊 JSON 匯入 | 舊 JSON 僅作相容匯入，匯入後完全轉新版資料。 |
| D05 | 舊資料準確性 | 以實際 base64 解碼圖片為準，不保留舊版結構。 |
| D06 | 內部圖片格式 | session/project 內部使用 WebP。 |
| D07 | 另存圖片格式 | 另存圖片預設輸出 JPG。 |
| D08 | 大量圖片進度 | 前端分批進度 N / total，不做後端 job。 |
| D09 | 上傳方式 | 前端分批多 request，每批 2-4 張。 |
| D10 | 刪除圖片 | 第一階段只從前端列表移除，不即時刪後端 temp。 |
| D11 | crop metadata | 第一階段加入 crop 預設欄位，但 UI 不開放。 |
| D12 | layouts schema | 第一階段保留 layouts[]，只產生 word-compatible-grid。 |
| D13 | Word 排序 | 以 layout.itemOrder 為準。 |
| D14 | 另存圖片效果 | 套用 rotation/crop 後輸出。 |
| D15 | Word 設定 | 專案儲存不保存 Word 輸出設定。 |
| D16 | 檔案命名 | 圖片使用 uuid.webp，originalName 只放 JSON。 |
| D17 | session 清理 | 啟動清超過 24 小時 temp；正常關閉清目前未保存 session；project 不受影響。 |
| D18 | pywebview 範圍 | 保留桌面視窗、選檔/選資料夾、storage_path；不追求完全移除。 |
| D19 | FastAPI 安全 | 只 bind 127.0.0.1，不加 auth token。 |
| D20 | 資料庫 | 不使用 DB，filesystem session 即可。 |

## 後續非目標

第一階段不做：

- 前端自由拖曳排版。
- 前端列印/PDF 輸出。
- WebSocket/SSE。
- 後端 job + polling。
- zip-based `.ipigeon` 單檔。
- 舊版 JSON 匯出。
- Word 輸出設定保存到 project.json。

## 正式計畫

- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md`
