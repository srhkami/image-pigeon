---
type: architecture
status: current
canonical: true
scope: image-pigeon
verified_against_source_at: 2026-08-25
---

# image-pigeon 現行架構

## 定位

image-pigeon 3.0 已合併至 `dev` 與 `main`，作為後續主要更新基線；現行產品是 React + Vite 純前端應用。圖片匯入、壓縮、長截圖切割、專案管理、圖片 ZIP、Word 與列印都在使用者瀏覽器內完成；正式部署只需要以 HTTPS 靜態主機提供 `dist/`。

Python 原始碼、Python 測試、套件環境及 PyInstaller 打包資產已正式退役。現行執行階段不使用 Python、FastAPI、uvicorn、pywebview、本機監聽連接埠、資料庫或可寫入伺服器目錄。舊桌面架構與驗證證據保留在 ADR-0001、歷史計畫及結果文件，但不再是現行原始碼或回退基線。

## 執行拓樸

```text
HTTPS 靜態主機
  └── dist/（HTML、CSS、JavaScript、圖示與圖片）
        │
        ▼
使用者瀏覽器
  ├── React UI 與 ProjectV2 metadata
  ├── BrowserAssetStore：asset id → Blob + object URL
  ├── Canvas：圖片解碼、縮放、旋轉與長截圖切割
  ├── .ipigeon archive：project.json + images/*.webp
  ├── 圖片 ZIP exporter
  ├── DOCX exporter
  └── window.print()／系統 PDF
```

開發使用 Vite dev server；production build 由 `pnpm run build` 產生。`vite.config.ts` 使用相對 `base`，使同一份產物可部署於 HTTPS 網站根目錄或子路徑。

## ProjectV2 與資產生命週期

前端型別定義於 `src/types/project.ts`：

```text
ProjectV2
├── schema: image-pigeon.project
├── version: 2
├── document.title
├── assets[]
├── items[]
└── layouts[]
```

- React state 保存 metadata，不長期保存 Base64 圖片。
- 圖片 Blob 由 `src/services/browserAssetStore.ts` 管理。
- 預覽以 `URL.createObjectURL()` 建立；替換、刪除、清空、開啟其他專案與卸載時回收 URL。
- `assets[].file` 指向 archive 內相對的 `images/<asset-id>.webp`。
- `items[]` 保存備註、旋轉、裁切、直向尺寸與排版偏好。
- `layouts[]` 使用 `word-compatible-grid`；輸出順序由 `itemOrder` 決定。

## 圖片處理

- `src/services/browserImageProcessor.ts` 使用瀏覽器解碼與 Canvas 處理一般圖片及長截圖。
- 正式處理遵守固定檔案數、位元組、像素、段數與 asset store 上限。
- 一般圖片允許單張略過、整批完成後一次提交；長截圖以來源檔案為最小原子單位。
- 取消、超限或失敗時回收暫存 Blob／object URL，不提交半成品。

## 專案封存

- 唯一專案交換格式是單一 `.ipigeon` ZIP archive。
- 根目錄必須有 `project.json`，圖片位於 `images/*.webp`。
- `src/services/browserProjectArchive.ts` 在解壓前檢查項目數、宣告大小、壓縮比與路徑，並驗證 manifest、資產集合、WebP 內容及實際尺寸。
- 專案開啟採 all-or-nothing；完整驗證後才原子替換 project state 與 asset store。
- 不支援獨立 1.x JSON 或 `.ipigeon/` 專案資料夾。

## 輸出與列印

- 圖片輸出：`src/services/browserImageZip.ts` 依 canonical order 產生 JPEG 並封裝成單一 ZIP 下載。
- Word 輸出：`src/services/browserWordExporter.ts` 與 `browserWordProjectAdapter.ts` 產生 DOCX Blob 並下載。
- 列印：`src/features/PrintPreview/` 重用五種自動拼貼版型，透過 `window.print()` 開啟系統列印流程；PDF 由使用者在系統列印對話框另存。
- 專案、ZIP 與 DOCX 皆由本機 Blob URL 下載，不經應用程式後端。

## 網路與隱私邊界

- 正式前端不發出背景 `fetch`／XMLHttpRequest，也不提供圖片、專案或輸出上傳 API。
- 應用程式只讀取使用者明確選定的檔案。
- 固定外部網站入口集中於 `src/services/browserExternalNavigation.ts`，只在使用者明確點擊後開啟，且不攜帶應用程式資料。
- `scripts/verify-static-build.mjs` 會驗證靜態資產引用並拒絕退役 runtime 與網路 sink。

## 驗證邊界

前端契約測試、lint、TypeScript／Vite production build 與靜態產物探針是目前自動化驗證主線。目標 Windows 11／Microsoft Edge／Microsoft 365 Word 的完整 UAT 仍未執行；現行架構採用與 source/build 通過不得擴張為該環境相容性 PASS。
