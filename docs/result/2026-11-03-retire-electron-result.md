---
type: result
id: result-image-pigeon-retire-electron-2026-11-03
status: completed
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
implements: docs/plans/2026-11-03-retire-electron.md
updated_at: 2026-11-03
execution:
  current_checkpoint: retirement_verified
review:
  used: false
  method: primary_agent_focused_self_check
approval_gates:
  source_write: approved_consumed_2026-11-03
  dependency_removal: approved_consumed_2026-11-03
  automated_validation: approved_consumed_2026-11-03
  browser_runtime: closed
  external_api: closed
  release_cleanup: closed
  deployment: closed
  commit: authorized_pending
  push: closed
---

# Electron 退役結果

## 後續 Git 授權

使用者在本結果完成後要求「請幫我提交GIT」，核准單檔版與退役相關來源、測試及治理文件合併為本機提交。此節覆蓋下文實作階段「未暫存／未提交」的歷史狀態；寫入此文件時尚待提交，記為 authorized_pending，不預先宣稱成功。沿用兩份正式計畫的主代理自檢方式，不新增獨立複審；提交前重跑聚焦回歸、lint、網站建置及靜態驗證，核對精確暫存清單與內容，提交後讀回實際 Git 紀錄。release 成品不納入，推送與部署仍未核准。

## 完成內容

- 移除 electron 44.0.0、electron-builder 26.15.3，pnpm 實際移除 198 個套件；鎖定檔亦移除 198 筆專用套件記錄。保留的 417 筆套件與快照逐筆等同本輪基線，其他直接依賴與版本不變。
- 刪除計畫列出的 12 份桌面專用來源、打包設定、腳本及測試；package.json 移除桌面入口與三項專用命令，pnpm-workspace.yaml 移除不再需要的 electron-winstaller 建置規則。
- App 只移除桌面更新提示的匯入與掛載，標記回呼測試只移除其替身。保留首頁手動「檢查新版」、所有輸出與 .ipigeon 格式，不新增介面或背景請求。
- 將仍適用的「前端不得匯入 Electron／Node」及手動下載入口契約保留於靜態部署測試；單檔測試改為要求桌面命令已不存在。靜態產物驗證器加入桌面橋接禁用檢查與污染案例。
- electron-to-chromium 仍由 browserslist@4.28.7 使用，屬建置工具的瀏覽器版本資料，不是 Electron 桌面執行階段。既有 package-lock.json 只含此類資料，未在本輪更動。
- 新增 ADR-0004，取代桌面查詢例外 ADR-0003。兩份桌面計畫改為 superseded、歷史結果保留 partial 與已取得的證據；未做的桌面人工驗收因退役取消，不改為通過。
- 單檔版依使用者「單檔板驗收通過」回報記為 user_attested 並收束；不補寫未具名平台矩陣。STATE 移除單檔及桌面工作線，圖片標記工作線保持原狀。

## 實際驗證

本輪日誌與基線：`/Users/cksai/.hermes/cache/scratch/image-pigeon-retire-electron-20261103/`。

| 驗證 | 實際結果 |
|---|---|
| 修改前退役契約 | 14 項中 11 通過、3 預期失敗，退出 1；原因為桌面命令、入口與 App 橋接仍存在，見 red.log |
| pnpm 移除依賴 | `pnpm --config.offline=true --config.ignore-scripts=true remove -D electron electron-builder`，退出 0；未連正式 API、未升級相鄰依賴 |
| 聚焦回歸 | 70/70，0 失敗、0 略過、退出 0；靜態部署、單檔、偏好儲存、App 標記回呼、標記合成、專案封存、Word 轉接器及圖片 ZIP；精確命令見 regression.json、完整輸出 regression.log |
| `pnpm run lint` | 退出 0 |
| `pnpm run build` | 退出 0，包含 TypeScript 與原網站 Vite 建置 |
| `pnpm run verify:static` | 退出 0，禁止字串命中 0 |
| 隔離單檔建置 | `pnpm exec vite build --config vite.singlefile.config.ts --outDir /Users/cksai/.hermes/cache/scratch/image-pigeon-retire-electron-20261103/singlefile`，退出 0 |
| 隔離單檔驗證 | `node scripts/verify-singlefile-build.mjs /Users/cksai/.hermes/cache/scratch/image-pigeon-retire-electron-20261103/singlefile`，退出 0；1 份 HTML、1 份內嵌程式、1 份內嵌樣式、4 張必要圖片、外部資源 0 |
| 依賴與產品差異 | verify-dependencies.cjs 通過：套件欄位僅指定刪除、剩餘鎖定記錄不變、桌面模組不可解析、App 兩行及替身一行精確移除 |

品質命令及退出碼保存於 quality.json。網站既有大型區塊警告仍存在；隔離輸出位於專案外，Vite 提示不自動清空該目錄，未使用清空參數。

隔離單檔成品：1,292,294 bytes，SHA-256 `a477702750c654ea34fcc10b6892720e1ea007e1655335fea6956e385aceb9ff`。此為退役後自動建置證據，不冒充已人工驗收的新成品；原 `release/html-3.3.0/image-pigeon-3.3.0.html` 及舊 EXE 全部原樣保留。

## 保護與證據邊界

修改前基線記錄 15 個既有差異路徑、230 個來源／設定路徑及 77 份 release 成品摘要。guard.py 以本輪精確允許清單比對範圍外內容、Git 狀態、分支、HEAD、暫存區及 release 逐檔摘要；共用檔另以本輪前快照比對，不以整份 HEAD 差異冒充本輪變更。最終文件前置資料、指標、非目標工作線、未追蹤文件空白、差異格式與護欄收據保存於 final-verification.json。

未執行完整前端測試矩陣，不宣稱範圍外既有列印文案／版本契約失敗已修復。未啟動應用、瀏覽器、EXE 或正式 API；未清除任何 release 成品或共用套件快取，未部署、暫存、提交或推送。實際產品來源變更僅為移除桌面提示接線，既有單檔人工驗收仍按原成品保存。

準備護欄時，系統 Python 不提供 PyYAML 與 hashlib.file_digest；前者改用既有 ESLint 間接依賴 js-yaml，後者改為分塊 SHA-256。兩次前置工具限制均發生於產品修改前，未安裝新解析器，也沒有偽造驗證結果。
