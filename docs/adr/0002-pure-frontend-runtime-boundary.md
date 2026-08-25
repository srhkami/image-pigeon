---
type: adr
id: adr-image-pigeon-pure-frontend-runtime-boundary-0002
status: accepted
canonical: true
scope: image-pigeon
decided_at: 2026-08-25
supersedes:
  - docs/adr/0001-project-format-and-runtime-boundaries.md
---

# ADR-0002：純前端執行階段邊界

## 背景

3.0 已將圖片匯入與壓縮、長截圖切割、專案封存、圖片 ZIP、Word 及列印流程移至瀏覽器，並已合併至 `dev` 與 `main` 作為後續主要更新基線。正式前端不再呼叫本機 FastAPI、pywebview bridge 或 Python 輸出流程。

既有 ADR-0001 描述 pywebview + FastAPI + React 桌面架構。該架構曾是有效決策並保留為歷史證據，但不再代表現行產品邊界。

## 決策

1. 現行產品是 React + Vite 純前端應用；正式產物由 HTTPS 靜態主機提供 `dist/`。
2. 圖片、專案、備註與輸出資料在使用者瀏覽器本機處理，不上傳至應用程式伺服器。
3. 圖片二進位內容保存在頁面生命週期的 Blob asset store，預覽使用 object URL；ProjectV2 只保存 metadata 與相對資產路徑。
4. 唯一專案交換格式是單一 `.ipigeon` ZIP archive，內含 `project.json` 與 `images/*.webp`。
5. 圖片輸出為瀏覽器建立的 ZIP；Word 輸出由瀏覽器建立 DOCX；列印與 PDF 使用瀏覽器／系統列印流程。
6. 正式執行階段不需要 Python、FastAPI、uvicorn、pywebview、Pillow、python-docx、本機監聽連接埠、資料庫或可寫入伺服器目錄。
7. 儲存庫不保留 Python 回退原始碼、Python 測試、Python 套件鎖定檔或 PyInstaller 打包設定。
8. 正式前端不得發出背景 `fetch`／XMLHttpRequest；固定外部網站只能由使用者明確操作後導覽，且不得攜帶圖片、專案、備註或應用程式狀態。
9. Windows 11／Microsoft Edge／Microsoft 365 Word 的完整 UAT 尚未執行；採用純前端架構不構成該相容性 PASS。

## 後果

- 開發、測試與建置統一使用 Node.js／pnpm 前端工具鏈。
- 正式部署只發布靜態 `dist/`，不部署應用程式後端。
- 任意本機路徑讀寫、自動開啟 Word／資料夾、固定 Python 記錄目錄與背景桌面程序不再是產品能力。
- 舊 Python renderer 不再作現行輸出比對權威；前端測試、固定 fixture 與瀏覽器／目標環境驗收成為現行證據來源。
- 若未來要恢復桌面或後端能力，必須建立新的 ADR、計畫與獨立安全／部署核准，不得直接恢復已退役路徑。

## 驗證依據

- 純前端實作與證據：`docs/plans/2026-08-18-pure-frontend-version.md`、`docs/result/2026-08-18-pure-frontend-version-result.md`
- Python 退役契約與結果：`docs/plans/2026-08-25-retire-python-runtime.md`、`docs/result/2026-08-25-retire-python-runtime-result.md`
- 部署邊界：`docs/deployment/pure-frontend-static-hosting.md`
