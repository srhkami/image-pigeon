---
id: status-image-pigeon-current-architecture-and-features
type: status
status: current
canonical: true
created_at: 2026-07-03T00:00:00+08:00
updated_at: 2026-07-03T00:00:00+08:00
owner: hermes
project: image-pigeon
affected_projects:
  - image-pigeon
---

# image-pigeon 目前架構與功能狀態

本文件取代過去分散在 `docs/plans/`、`docs/result/`、舊決策紀錄中的開發過程文件。舊計畫、派工單與結果報告只保留在 git history；後續 coding agent 進入專案時，以 `AGENTS.md` 與本文件作為主要上下文。

## 目前定位

- 本專案是 pywebview + React + Python 桌面工具。
- pywebview 保留桌面能力：開桌面視窗、選擇檔案/資料夾、`storage_path`、必要桌面原生能力。
- FastAPI 負責資料 API、圖片暫存、圖片匯入/壓縮、長截圖切割、專案儲存/開啟、輸出流程與 serve React build。
- 不追求完全移除 pywebview。
- `pywebview-base` 只作參考，不是正式依賴；正式改動都應在 `image-pigeon/` 內完成。

## 專案格式與資料模型

- 新版專案格式使用資料夾，不使用 zip。
- 建議專案資料夾命名為 `<name>.ipigeon/`。
- 專案資料夾結構：

```text
<name>.ipigeon/
  project.json
  images/
    <asset-id>.webp
```

- `project.json` 使用 ProjectV2：
  - `schema: "image-pigeon.project"`
  - `version: 2`
  - `document.title`
  - `assets[]`
  - `items[]`
  - `layouts[]`
- `assets[].file` 指向 project 內相對路徑，例如 `images/<uuid>.webp`。
- `items[]` 保存 remark、rotation、crop、portraitSize 等編輯狀態。
- `layouts[]` 目前保留 `word-compatible-grid`，排序來源是 `layout.itemOrder`。
- 專案儲存不保存 Word / 列印輸出設定；輸出設定由匯出當下表單決定。

## 圖片與 session

- session/project 內部圖片格式使用 WebP。
- 前端不要長期保存 base64；主要保存 asset/item/layout metadata。
- 圖片匯入使用 multipart/form-data + FastAPI `UploadFile`。
- 一般圖片匯入可批次上傳；大量圖片由前端分批送 request 並顯示進度。
- 長截圖由後端判斷並切割成多個 asset/item；不保留原長圖。
- 刪除圖片目前從前端列表移除，不即時刪後端 temp 檔。
- preview 和輸出流程使用同一份壓縮後 WebP。
- 不使用資料庫；session 以 filesystem 管理。
- app 啟動時可清理超過 24 小時的 temp session；正常關閉時可清目前未保存 session；project folder 不受 temp 清理影響。

## FastAPI / pywebview 邊界

- FastAPI 只 bind `127.0.0.1`，不加 auth token。
- `main.py` 建立 pywebview 視窗並啟動本機 FastAPI。
- pywebview API 仍負責 native file/folder dialog：
  - Word 儲存路徑
  - 另存圖片資料夾
  - project save/open 資料夾
- FastAPI 主要 API：
  - `POST /api/images/import`
  - `POST /api/images/import-long-screen`
  - `GET /api/sessions/{session_id}/assets/{asset_id}/image`
  - `POST /api/project/save`
  - `POST /api/project/open`

## 前端編輯與排版

- React state 以 ProjectV2 為主要資料來源。
- 一般編輯模式採焦點卡片：目前圖片置中放大，上下相鄰圖片較小。
- 排序模式獨立於一般編輯模式，使用小圖列表拖曳排序。
- 焦點追蹤以 `activeItemId` 為準，排序後仍盡量保持同一張圖為焦點。
- 右側預覽是 A4/影印感的頁面縮圖，跟隨自動排版結果。
- 自動拼貼排版由 `buildAutoCollageLayout()` 產生 pages/slots，保留左側順序，不為了補空格而重排。
- 目前自動拼貼 template 包含：
  - `landscape-2`
  - `portrait-large-2`
  - `portrait-small-6`
  - `mixed-landscape1-small3`
  - `mixed-small3-landscape1`

## 輸出

- Word 輸出以 `layout.itemOrder` / auto-collage pages 為排序與分頁來源。
- Word 自動拼貼輸出由 `core/save_docx.py` 處理，`layout_mode == 'auto-collage-v1'` 且有 pages 時走 auto-collage renderer。
- 另存圖片預設輸出 JPG，並應套用 item 的 rotation/crop。
- 列印預覽使用獨立全頁 React view state，不使用 router。
- `App.tsx` 以 `viewMode: 'editor' | 'print-preview'` 切換編輯與列印預覽。
- 列印預覽使用正式 A4 print DOM，和 auto-collage pages/slots 共用排版概念。
- 第一階段 PDF 不由後端產生；列印與另存 PDF 走 browser/system print flow。

## 後續實作注意

- 文件、計畫、結果報告、提交訊息預設使用繁體中文與台灣用語。
- 技術名詞可保留英文，例如 FastAPI、pywebview、React、Vite、session、manifest。
- 新功能或大改動若需要計畫，先寫短期草稿到 `.planning/<topic>/`；確認後再視需要建立正式文件。
- 功能完成後不要長期保留細碎 work-order/result；若仍有價值，請濃縮進 `docs/status/` 的 current/handoff 文件。
- Pillow / python-docx 工作屬 CPU/IO；避免在 async endpoint 裡直接長時間阻塞 event loop，必要時改同步 endpoint 或 threadpool。
- 不要引入 DB、後端 job system、WebSocket/SSE、router、後端 PDF renderer，除非先重新確認產品與打包風險。
