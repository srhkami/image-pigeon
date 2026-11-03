---
type: plan
id: plan-image-pigeon-singlefile-html-2026-11-03
status: completed
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
created_at: 2026-11-03
execution:
  status: completed
  current_checkpoint: completed_user_attested
manual_acceptance: user_attested_2026-11-03
result: docs/result/2026-11-03-singlefile-html-result.md
approval_gates:
  source_write: approved_consumed_2026-11-03
  dependency_install: approved_consumed_2026-11-03
  automated_test: approved_consumed_2026-11-03
  singlefile_build: approved_consumed_2026-11-03
  browser_runtime: declined_user_manual_2026-11-03
  electron_package_build: closed
  deployment: closed
  commit: authorized_pending
  push: closed
---

# 單一 HTML 離線版

## 範圍與授權

以下為本單檔計畫執行時的範圍；當時保留 Electron 命令的要求，已由 `docs/plans/2026-11-03-retire-electron.md` 的新核准取代，不限制後續退役。

使用者於 2026-11-03 要求直接實作前輪確認的單檔方案，並選擇「只完成建置與自動測試，瀏覽器由我自行驗收」。沿用目前 3.3.0 與 React 原始碼，新增獨立 Vite 單檔建置，內嵌程式、樣式與必要圖片；現有網站及 Electron 命令不變，不啟動任何瀏覽器或服務。

允許修改 package.json、pnpm-lock.yaml、tsconfig.node.json、src/layout/BtnThemeToggle.tsx、src/features/About/ModalReadme.tsx、STATE.md、docs/architecture/current-architecture.md、docs/deployment/pure-frontend-static-hosting.md；新增 vite.singlefile.config.ts、scripts/verify-singlefile-build.mjs、scripts/singlefileBuild.test.ts、src/services/browserPreferenceStorage.ts、src/services/browserPreferenceStorage.test.ts、本計畫與結果。

只新增鎖定的 vite-plugin-singlefile@2.3.4 建置依賴；單檔專用轉換內嵌既有 public 圖示，不修改首頁 DOM 或功能。設定儲存不可用時回退預設值／目前元件狀態，不影響開啟；不改專案保存格式。輸出位於 release/html-3.3.0/，不覆寫任何舊 EXE；既有 dist/ 可依原命令重新建置。

## 最低驗收

1. 測試先重現缺少單檔建置及儲存容錯；完成後直接測試、既有靜態／Electron 契約、lint、網站 build／verify:static 與單檔 build 通過。範圍外舊失敗如實保留，不擴修。
2. 單檔輸出目錄只有一份 HTML；程式、樣式、圖示與 QR 圖片內嵌，不引用鄰近資產。驗證器解析內嵌 JavaScript 並拒絕外部／缺漏靜態資源、可辨識網路載入與動態匯入；以各案重設的污染測試證明拒絕，不把 XML 中繼資料或固定主動導覽誤判成背景載入。
3. 儲存取得、讀取及寫入被拒絕皆不拋錯，正常儲存語意保持；兩個實際消費元件接線有回歸。
4. 非允許檔案、其他工作線、舊 release 與暫存區不變；文件前置資料／路徑／差異通過。基線與日誌保存在 /Users/cksai/.hermes/cache/scratch/image-pigeon-singlefile-20261103/。

## 交付與證據邊界

初次交付時已提供 HTML 絕對路徑、大小與指紋，當時等待使用者人工確認。2026-11-03 使用者明確回報「單檔板驗收通過」，記為 user_attested，計畫完成；不逐項補寫未具名的作業系統／瀏覽器矩陣，也不宣稱 Agent 瀏覽器實測。

單檔版不提供 Electron 專用啟動新版提示，原有手動下載入口保留；不加入新 UI、API、服務工作者、原生檔案 API、自動更新、安裝程式或新功能。低風險有界變更由主代理自檢，不新增強制獨立審查；不提交、推送或部署。

## 目前結果

後續使用者要求「請幫我提交GIT」，核准本計畫交付與 Electron 退役合併為本機提交，提交前記為 authorized_pending；取代前述不提交限制，但不包含 release 成品、推送或部署。實際提交以 Git 成功紀錄為準。

來源與單檔產物已完成，初次交付聚焦回歸 50/50、lint、原網站 build／verify:static、單檔 build 及產物驗證通過。產物為 `release/html-3.3.0/image-pigeon-3.3.0.html`，程式／樣式與四張必要圖片內嵌，單獨移到其他資料夾後靜態檢查仍通過。使用者人工驗收已通過，計畫與結果 completed；原四項實作／建置核准已消耗，Agent 執行階段及發布／Git 閘門不變。Electron 退役由另一份明確核准的計畫處理，不覆寫本計畫的歷史證據或已驗收成品。
