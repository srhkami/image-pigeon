# AGENTS.md

此資料夾是後續改版的主工作區。`pywebview-base` 僅作參考，未來會刪除；正式狀態摘要應寫在本專案內。

## 新 session 啟動順序

新 session 或 coding agent 進入 `image-pigeon/` 後，請先讀：

1. `AGENTS.md`
2. `docs/status/current-architecture-and-features.md`
3. 若正在實作中的任務另有 `.planning/<topic>/` 或新狀態文件，再讀取對應上下文。

重要：`pywebview-base` 已視為可刪除參考，不是本專案依賴；所有後續改動都必須在 `image-pigeon/` 內完成。

## 工作語言

- 文件、計畫、結果報告、提交訊息預設使用繁體中文與台灣用語。
- 技術名詞可保留英文，例如 FastAPI、pywebview、React、Vite、session、manifest。

## 專案方向

- 本專案是 pywebview + React + Python 桌面工具。
- 改版方向是保留 pywebview 桌面能力，將 FastAPI 擅長的資料 API、圖片暫存、輸出流程導入 image-pigeon。
- 不追求完全移除 pywebview。
- pywebview 應繼續負責：開桌面視窗、選擇檔案/資料夾、storage_path、必要桌面原生能力。
- FastAPI 應負責：圖片匯入、壓縮、長截圖切割、session temp、專案儲存/開啟、Word/圖片輸出、serve React build。

## 規劃與執行治理

- `.planning/<topic>/`：只放短期草稿、發現、進度，不是長期執行真相。
- `docs/status/`：保留目前架構、產品決策、handoff 與必要的長期摘要。
- `docs/plans/`、`docs/result/`：僅在大型功能開發期間視需要短期建立；功能完成後應濃縮進 `docs/status/`，再刪除過程性計畫、派工單與結果報告。
- 不要直接從 `.planning/` 執行；`.planning/` 只能作為輔助上下文。

## 已確認的產品/架構決策

- 新版專案格式使用資料夾，不使用 zip。
- 專案資料夾建議副檔名風格：`<name>.ipigeon/`。
- 新版「儲存專案」取代舊版「儲存 JSON」；不再需要主線儲存 JSON。
- 第一階段需同時支援儲存新版專案與開啟新版專案。
- 舊版 JSON 只支援匯入相容；匯入後完全轉成新版資料模型。
- session/project 內部圖片格式使用 WebP。
- 另存圖片預設輸出 JPG。
- 大量圖片匯入採前端分批多 request，每批 2-4 張，顯示 N / total 進度，不做後端 job system。
- 刪除圖片第一階段只從前端列表移除，不即時刪後端 temp。
- project.json 第一階段就加入 crop metadata，但 UI 不開放裁切。
- project.json 保留 layouts 陣列；第一階段只產生 `word-compatible-grid`。
- Word 輸出排序以 `layout.itemOrder` 為準。
- 另存圖片需套用 item 的 rotation/crop。
- 專案儲存不保存 Word 輸出設定。
- 圖片檔案命名使用 uuid，例如 `images/<uuid>.webp`。
- session 清理：啟動清超過 24 小時 temp；正常關閉清目前未保存 session；project folder 不受影響。

## 後續實作注意

- 前端不要再長期保存 base64；保存 asset/item/layout metadata。
- 圖片傳輸使用 multipart/form-data + UploadFile，不用 base64 JSON。
- FastAPI 只 bind `127.0.0.1`，不加 token。
- 不使用資料庫；filesystem session 即可。
- 不保留原始圖片；使用者上傳來源本身就是原圖備份。
- preview 和輸出圖使用同一份壓縮後 WebP。
- 長截圖切割後不保留原長圖。
- Pillow / python-docx 工作屬 CPU/IO，同步 endpoint 或 threadpool 處理，不要在 async endpoint 裡直接長時間阻塞 event loop。
