---
type: plan
id: plan-image-pigeon-electron-update-check-2026-09-30
status: superseded
canonical: false
superseded_by: docs/plans/2026-11-03-retire-electron.md
retired_at: 2026-11-03
execution_authority: historical_only
scope: image-pigeon
path_semantics: repository-root-relative
created_at: 2026-09-30
execution:
  status: partial
  current_checkpoint: retired_with_validation_gaps
result: docs/result/2026-09-30-electron-update-check-result.md
approval_gates:
  planning_docs: approved_2026-09-30
  source_write: approved_2026-09-30
  automated_test: approved_2026-09-30
  live_api: closed
  app_runtime: closed
  package_build: approved_consumed_2026-09-30
  repack_package_build: approved_consumed_2026-11-02
  package_metadata_sync: approved_consumed_2026-11-02
  deployment: closed
  commit: closed
  push: closed
allowed_existing:
  - STATE.md
  - docs/architecture/current-architecture.md
  - src/App.tsx
  - src/features/Intro/Intro.tsx
  - src/services/browserExternalNavigation.ts
  - package.json
  - electron/main.cjs
  - electron/navigation-policy.cjs
  - tests/electronPackagingContract.test.ts
  - tests/staticDeploymentContract.test.ts
  - scripts/verify-static-build.mjs
  - .gitignore
allowed_new:
  - electron/update-check.cjs
  - electron/update-ipc.cjs
  - electron/preload.cjs
  - src/features/Intro/ModalDesktopUpdate.tsx
  - src/services/desktopUpdate.ts
  - src/services/desktopUpdate.test.ts
  - tests/electronUpdate.test.ts
  - docs/adr/0003-electron-update-check-boundary.md
  - docs/plans/2026-09-30-electron-update-check.md
  - docs/result/2026-09-30-electron-update-check-result.md
---

# EXE 新版偵測與首頁檢查新版入口

## 2026-11-03 退役處置

使用者確認單檔版驗收通過並要求退役 Electron。桌面偵測、橋接、提示與封裝路徑退役，首頁手動檢查新版入口保留；未完成的 Windows 桌面驗收因退役取消，不視為通過。以下各節為退役前歷史契約與實際進度，已不具執行權威；後續以退役計畫為準，不執行原允許清單或打包命令。

## 目標與範圍

使用者核准直接修改：恢復 v2 的啟動新版提示與忽略機制，並將「檢查新版」固定放在首頁 Intro 的版本資訊旁，不放導覽列或其他位置。按鈕使用 v2 的固定 Google 雲端資料夾，與 API 偵測分開；網頁版可主動點擊入口，但不發出背景版本查詢。

EXE 只查 `https://api.pigeonhand.tw/web/apps/1/` 的公開版本資訊，不自動下載或安裝，不傳送圖片、專案、備註或本機版本。未知下載網址不交給系統瀏覽器，提示與首頁皆導向已核准的固定資料夾。

## 必要做法

- 為桌面專用版本檢查建立最小預載腳本（preload script）與跨程序通訊（IPC）；前端沒有 Electron／Node.js 匯入、HTTP 請求或端點字串，未提供桌面能力時完全不查詢。
- 主程序只接受本機主視窗頂層的無參數檢查請求；一次程序生命週期只查一次，設定總逾時、回應大小上限，拒絕重導向、錯誤狀態及無效 JSON／必要欄位。失敗安靜退回，不阻擋編輯。
- 版本以三段數字大小比較，僅遠端較新才提示；關閉後本次工作階段不重複，沿用 v2 以更新日期保存的「忽略此版本」。儲存失敗不使應用崩潰，卸載後忽略晚到結果。
- package.json 同步目前顯示版本 3.2.0；既有 `src/utils/log.ts` 不改。封裝測試改以實際套件版本判定，既有 build 命令不變、不加依賴。
- 新 ADR 僅補充桌面版例外，維持 ADR-0002 的網頁零背景請求與本機資料處理；舊退役／封裝計畫保留歷史，不以它們授權新功能。

## 驗收與驗證

- Intro 版本旁固定有「檢查新版」，與偵測結果無關；新版提示顯示版本、更新內容、「忽略此版本」及手動下載入口。
- 隔離測試驅動主程序查詢、預載與 IPC 邊界，證明固定 GET、零私人資料、一次查詢、逾時／超限／重導向／無效資料安全失敗與陌生來源零請求；版本大於、等於、小於、忽略與工作階段關閉案例可重現。
- 相關前端、Electron 與靜態部署測試、lint、build、verify:static、Node 語法檢查及差異護欄，必要時一次聚焦安全複審。範圍外既有失敗只記錄，不為全綠擴張。
- 基準 `/tmp/image-pigeon-electron-update-baseline.json` 保護既有排版／Word 及其他 dirty 內容。既有 App、架構與 STATE 只疊加本輪必要內容，不接管原排版差異，不操作暫存區。

## 核准與停止

初始核准只含原始碼及自動驗證。使用者於 2026-09-30 另核准「下一步我需要你打包現行版本的EXE」，並確認本輪僅需接入指定 API；不要求真實 API 查詢。打包使用目前工作樹（含既有未提交的排版與 Word 修改），不修改產品原始碼或依賴；沿用 Windows x64 portable 設定，輸出至新的 `release/3.2.0/`，保留既有 `release/` 產物。允許打包工具所需的公開工具鏈取得與產物機械檢查，不啟動應用或 EXE。真實 API、應用／瀏覽器啟動、Windows 人工驗收、部署、提交或推送仍未核准；測試使用合成回應，不冒充正式 API 或 EXE 實機結果。

前一輪 Word 排版已由使用者回報樣式完善，此處只視為該可見樣式的使用者驗收，不擴張為 Windows／封裝完整驗收，不改其父計畫契約。

## 前輪執行現況（2026-09-30 歷史證據）

3.2.0 Windows x64 免安裝 EXE 已實際產出並通過版本、封裝內容與來源一致、PE 格式／x64 應用程式、未簽章狀態、大小與 SHA-256 檢查。打包前基準為 `/tmp/image-pigeon-3.2.0-package-baseline.json`，新產物為 `release/3.2.0/image-pigeon-3.2.0-win-x64-portable.exe`，既有產物與產品原始碼未被改寫。

前輪受審快照聚焦 32/32 與安全複審 PASS 保留為歷史證據；本次打包前的現行 Intro 已不同於受審快照，唯一差異檔案為 `src/features/Intro/Intro.tsx`。本輪聚焦 31/32：舊版型測試要求 `col-span-2` 在連結本身，但現行版型將其放在外層容器；不修改該版型或測試以求全綠。另以 TypeScript 語法樹確認現行唯一更新入口、版本旁兩欄容器、正確 href／target／rel 均成立。lint、build 與靜態驗證通過；詳細證據見結果。計畫保持 active、執行 partial，僅 Windows 人工驗收尚未執行，不要求或查詢真實 API。

## 現行版本重新打包（2026-11-02）

使用者要求「請幫我打包一個exe檔版本」，核准以目前 dev 工作樹產出 Windows x64 免安裝 EXE。來源基線為 `df8a91ad3469d7a1a7396b516f374bbc6145d952`，工作樹與暫存區起始為乾淨。應用程式更新紀錄已是 3.3.0、package.json 仍是 3.2.0；只將 package.json.version 同步為 3.3.0，不改更新紀錄、功能、依賴或鎖定檔。

本輪允許修改 package.json 的版本欄位、本計畫、既有結果與 STATE；產生 dist／既有 TypeScript 建置快取及新的 `release/3.3.0/`，保護所有舊 release 產物。沿用既有打包命令並以 `--config.directories.output=release/3.3.0` 指定新目錄；允許必要公開打包工具鏈取得，不使用憑證、簽章、安裝程式或發布。Agent 應用／瀏覽器／EXE 啟動、正式 API、Windows 實機驗收、部署、commit、push 仍關閉。

最低驗證為既有 Electron 封裝與更新隔離測試、lint、打包內含的 build／verify:static、產物探針、ASAR 實際內容／版本與來源一致性、PE x64 與簽章表、大小／SHA-256、舊產物與來源／暫存區護欄。既有範圍外測試失敗只保留，不為全綠擴修；不重做無關功能矩陣或獨立來源審查。基線及實際日誌位於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-exe-330-20261102/`。

本輪打包與機械驗證已完成：`release/3.3.0/image-pigeon-3.3.0-win-x64-portable.exe` 實際產出，封裝／更新隔離測試 13/13、lint、build、verify:static 與產物探針通過。實際 ASAR 14 檔符合目前 dist／electron 與 3.3.0 metadata，x64 應用程式及啟動器簽章表均為零；舊產物、功能來源及暫存區未變。兩項本輪核准已消耗；結果仍 partial、計畫 active，Windows 啟動、Word／列印、SmartScreen／防毒與斷網驗收未由 Agent 執行，不要求或查詢正式 API。詳細路徑、大小、雜湊與命令見既有結果最後小節。
