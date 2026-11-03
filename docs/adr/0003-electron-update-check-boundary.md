---
type: adr
id: adr-image-pigeon-electron-update-check-boundary-0003
status: superseded
canonical: false
superseded_by: docs/adr/0004-retire-electron.md
superseded_at: 2026-11-03
scope: image-pigeon
decided_at: 2026-09-30
extends: docs/adr/0002-pure-frontend-runtime-boundary.md
---

# ADR-0003：桌面專用版本查詢邊界

## 歷史決策（2026-11-03 由 ADR-0004 取代）

Electron 與桌面版本查詢已退役，下列內容保留當時決策與證據，不再授權恢復桌面依賴；首頁手動下載入口繼續保留。

使用者核准恢復 EXE 的新版偵測及首頁 Intro 的「檢查新版」入口。此決策只增加桌面版本查詢能力，不恢復 Python／本機伺服器，也不改變圖片、專案、備註與輸出在本機處理的邊界。

- 網頁版仍遵守 ADR-0002：沒有背景 HTTP 請求或桌面執行階段依賴；可由使用者點擊首頁固定 Google 雲端資料夾連結。
- Electron 主程序只以 GET 查詢 `https://api.pigeonhand.tw/web/apps/1/` 的公開版本資訊，不附帶本機版本、圖片、專案、備註或識別資料；連線本身仍會具有一般網路連線的來源 IP。
- 沙箱預載只暴露零參數 `checkForUpdates()`，不暴露通用 IPC、任意網址、檔案或 Node.js API。主程序只接受本機主視窗頂層請求，整個程序只查一次，保留原隔離、沙箱、網頁安全、拒絕權限及導覽防護。
- 查詢有總逾時及回應上限，拒絕重導向與無效回應；失敗不得阻擋編輯。API 內容只作純文字版本提示，不解譯 HTML，不採用遠端任意下載網址。
- 提示與首頁入口均導向既有 v2 的固定 Google 雲端資料夾，Electron 只把該精確網址交給系統瀏覽器；不放寬其他網址或移除安全旗標。
- 只作新版提示與手動檢查，不自動下載／安裝、無背景排程、遙測、發布或更新框架。

## 後果與證據邊界

React 只在沙箱預載提供能力時呼叫單用途介面；同一份 `dist/` 仍可獨立部署，不匯入 Electron／Node.js，既有 build 命令與網站 CSP 不變。Electron 原最小封裝計畫的「無預載／IPC／更新」是該歷史切片的契約，本決策與新的獨立計畫才是這項增量的權威，不回寫舊契約。

依據：`docs/plans/2026-09-30-electron-update-check.md`。原始碼與隔離測試通過不代表真實 API、封裝產物或 Windows 人工驗收通過；這些保留各自核准閘門。
