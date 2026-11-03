---
type: adr
id: adr-image-pigeon-retire-electron-0004
status: accepted
canonical: true
scope: image-pigeon
decided_at: 2026-11-03
supersedes:
  - docs/adr/0003-electron-update-check-boundary.md
extends: docs/adr/0002-pure-frontend-runtime-boundary.md
---

# ADR-0004：退役 Electron，保留網站與單檔交付

## 決策

使用者確認單一 HTML 離線版驗收通過，因 Electron 應用程式體積負擔而要求退役其相關依賴。現行交付維持 HTTPS 網站及單一 HTML 離線版，不再保留 Electron 桌面殼、打包工具、預載橋接、啟動版本查詢及專用測試。

- 圖片、專案、ZIP、DOCX、列印及 PDF 繼續使用既有瀏覽器流程，不改資料格式或操作介面。
- 首頁手動「檢查新版」仍導向既有固定下載資料夾；只由使用者主動點擊，不加入背景版本 API。
- 移除 electron 與 electron-builder 開發依賴及專用間接依賴。仍由瀏覽器建置工具使用的 electron-to-chromium 資料套件不代表桌面執行階段，應保留。
- 現有 release 成品及歷史計畫／結果保留，不在退役來源時清除舊 EXE 或已驗收 HTML。
- ADR-0002 的本機處理、零上傳及無背景請求邊界維持。日後若重新引入桌面能力，另立決策與核准，不直接恢復歷史腳本。

## 驗證邊界

單檔通過屬使用者人工回報（user_attested），不是 Agent 瀏覽器實測，也不補寫未具名的平台矩陣。舊 Electron Windows 人工驗收隨退役取消，不改記為通過。退役後的聚焦測試、網站與隔離單檔建置依 `docs/plans/2026-11-03-retire-electron.md` 執行，實際證據保存於同範圍結果。
