---
type: plan
id: plan-image-pigeon-retire-electron-2026-11-03
status: completed
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
created_at: 2026-11-03
execution:
  status: completed
  current_checkpoint: retirement_verified
result: docs/result/2026-11-03-retire-electron-result.md
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

# Electron 退役

## 授權與目標

使用者於 2026-11-03 明確回報「單檔板驗收通過，請你退役Electron相關依賴」。依前輪已列出的退役範圍，移除桌面殼、打包依賴、更新橋接及專用測試，保留網站／單檔交付、既有匯出、首頁手動檢查新版連結、歷史證據及所有 release 成品。單檔驗收記為 user_attested，不擴張為 Agent 跨瀏覽器或 Windows 實測。

## 精確範圍

刪除：electron/main.cjs、electron/navigation-policy.cjs、electron/preload.cjs、electron/update-check.cjs、electron/update-ipc.cjs、electron-builder.yml、scripts/verify-electron-package.mjs、tests/electronPackagingContract.test.ts、tests/electronUpdate.test.ts、src/services/desktopUpdate.ts、src/services/desktopUpdate.test.ts、src/features/Intro/ModalDesktopUpdate.tsx。

修改：package.json、pnpm-lock.yaml、pnpm-workspace.yaml、.gitignore、src/App.tsx、src/features/ImagePreview/imageAnnotations.test.ts、scripts/singlefileBuild.test.ts、tests/staticDeploymentContract.test.ts、scripts/verify-static-build.mjs、docs/architecture/current-architecture.md、docs/deployment/pure-frontend-static-hosting.md、docs/adr/0003-electron-update-check-boundary.md、STATE.md；並局部校正下列計畫／結果的生命週期及歷史邊界：

- docs/plans/2026-08-28-electron-portable-mvp.md
- docs/result/2026-08-28-electron-portable-mvp-result.md
- docs/plans/2026-09-30-electron-update-check.md
- docs/result/2026-09-30-electron-update-check-result.md
- docs/plans/2026-11-03-singlefile-html.md
- docs/result/2026-11-03-singlefile-html-result.md

新增：本計畫、同名結果及 docs/adr/0004-retire-electron.md。

pnpm 負責移除 electron、electron-builder 與不再可達的專用依賴；不升級其他直接依賴，不清除共用套件快取。electron-to-chromium 若仍由瀏覽器建置工具依賴則保留，不以名稱誤刪。package-lock.json 沒有 Electron 桌面依賴，本輪不修改此歷史 npm 鎖定檔。

## 驗證及保護

1. 修改前保存原始 NUL Git 狀態、允許目標完整快照、受保護來源摘要、暫存區及 release 逐檔摘要。基線與本輪日誌位於 /Users/cksai/.hermes/cache/scratch/image-pigeon-retire-electron-20261103/。
2. 先讓退役契約對現況產生預期失敗，再移除專用程式；保留／遷移正式前端不得匯入 Node／Electron、手動下載入口與瀏覽器輸出護欄。
3. 執行直接受影響的靜態部署、單檔、App 標記回呼、儲存及輸出回歸，pnpm run lint、pnpm run build、pnpm run verify:static。單檔以現有設定建置至本輪 scratch 目錄，並直接執行驗證器，不覆寫已驗收 HTML 或舊 EXE。不得啟動應用、瀏覽器或正式 API。
4. 依賴圖不含 Electron 桌面套件、正式來源無桌面橋接、相關設定無懸空指令；核對鎖定檔、必要文件前置資料與指標、差異格式、未追蹤文件及範圍／暫存區護欄。
5. 本輪為有界退役，由主代理聚焦自檢，不新增強制獨立審查。保留範圍外既有失敗，不重跑未受影響的完整人工矩陣。
6. 完成後先寫實際結果、校正本計畫與被取代的桌面計畫，再更新 STATE。單檔工作線依人工驗收收束；桌面驗收因退役取消，不改寫成通過；其他工作線不變。

## 完成結果

### 後續本機提交授權

使用者於完成退役後要求「請幫我提交GIT」，核准將已驗收的單檔版與 Electron 退役相關來源、測試及文件合併為本機提交。提交前狀態為 authorized_pending；實際提交識別碼以成功建立後讀回的 Git 紀錄為準，不預寫成功。此核准取代本計畫先前關閉的 commit 閘門，不包含 release 成品、其他工作線、推送或部署。

Electron 專用來源、接線及依賴已退役，pnpm 移除 198 個套件；保留的 417 筆鎖定套件與快照未變。聚焦回歸 70/70、lint、網站建置／靜態驗證及 scratch 隔離單檔建置／驗證通過。既有 HTML、EXE、暫存區與其他工作線保持原狀；具體命令、證據邊界及治理檢查見同範圍結果。來源、依賴與自動驗證核准已消耗，其他副作用閘門保持關閉。
