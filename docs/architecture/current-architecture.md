---
type: architecture
status: current
canonical: true
scope: image-pigeon
verified_against_source_at: 2026-07-29
---

# image-pigeon 現行架構

## 定位

image-pigeon 是 pywebview + React + Python 桌面工具。pywebview 保留桌面視窗、原生檔案／資料夾選擇與 storage path；FastAPI 負責本機資料 API 與 production React build serving。服務只綁定 `127.0.0.1`。

`pywebview-base` 只曾作參考，不是本 repository 的正式依賴或修改目標。

## Runtime 拓樸

- `main.py` 啟動 uvicorn thread，建立 pywebview 視窗，並以 `js_api=Api()` 保留原生 bridge 與部分 legacy 相容方法。
- 開發模式載入 Vite dev server；production 模式由 FastAPI serve `dist/`。
- `core/app/api.py` 建立 FastAPI app，提供 health、圖片、session asset 與 project API。
- 開發伺服器 URL 與 Vite port 必須保持一致；目前工作樹對這兩個值另有使用者未提交變更，本文件不把該差異納入治理成果。

## FastAPI API

目前 source-defined endpoints：

- `GET /api/health`
- `POST /api/images/import`
- `POST /api/images/import-long-screen`
- `GET /api/sessions/{session_id}/assets/{asset_id}/image`
- `POST /api/project/save`
- `POST /api/project/open`

圖片以 `multipart/form-data` 與 FastAPI `UploadFile` 匯入。session 使用 filesystem，不使用資料庫。

## ProjectV2

後端模型定義於 `core/app/models.py`，前端型別定義於 `src/types/project.ts`：

```text
ProjectV2
├── schema: image-pigeon.project
├── version: 2
├── document.title
├── assets[]
├── items[]
└── layouts[]
```

- Session/project 圖片以 WebP 保存。
- `assets[].file` 指向相對圖片路徑。
- `items[]` 保存 remark、rotation、crop 與 portraitSize。
- 目前 layout type 是 `word-compatible-grid`，順序由 `itemOrder` 決定。
- `.ipigeon/` 是資料夾格式，包含 `project.json` 與 `images/*.webp`。

## Session 與專案

- `core/app/session_store.py` 在 `web_cache/temp/sessions/<session-id>/` 保存 `session.json` 與 WebP。
- Source 提供 24 小時過期 session 清理函式，但目前 `main.py` 啟動／關閉流程沒有呼叫它；這是實作缺口，不應從舊計畫文字推定為已接線。
- 開啟專案時會建立新的 temp session；儲存專案時寫入目標 `.ipigeon/` 資料夾。

## 前端狀態與排版

- `src/App.tsx` 以 ProjectV2 與 `sessionId` 作主要狀態，並用 `editor | print-preview` 切換視圖，不使用 router。
- `src/features/ImagePreview/autoCollageLayout.ts` 依既有順序產生五種 template：
  - `landscape-2`
  - `portrait-large-2`
  - `portrait-small-6`
  - `mixed-landscape1-small3`
  - `mixed-small3-landscape1`
- 一般編輯使用焦點式編輯區；排序模式是獨立小圖列表；右側顯示頁面縮圖預覽。

## 輸出

- Word 輸出位於 `core/save_docx.py`。
- 圖片輸出位於 `core/save_images.py`，預設面向 JPG 輸出流程。
- 列印預覽位於 `src/features/PrintPreview/`，重用自動拼貼 pages/slots，透過 `window.print()` 開啟系統列印流程。
- 目前沒有後端 PDF renderer，也沒有 `/api/export/pdf`。

## 驗證邊界

本文件以 2026-07-29 工作樹 source 與 manifest 靜態核對。它不代表 packaged macOS／Windows runtime、列印對話框、完整 lint/build 或實機 UAT 已於本次治理遷移重新執行。
