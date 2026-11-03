---
type: result
id: result-image-pigeon-electron-update-check-2026-09-30
status: partial
canonical: false
retired_at: 2026-11-03
closure_status: retired_with_validation_gaps
superseded_by: docs/result/2026-11-03-retire-electron-result.md
scope: image-pigeon
path_semantics: repository-root-relative
implements: docs/plans/2026-09-30-electron-update-check.md
updated_at: 2026-11-02
execution:
  current_checkpoint: retired_with_validation_gaps
review:
  status: pass
  delegation: deleg_2ccf796d
  source_manifest: /tmp/image-pigeon-electron-update-review.json
  source_digest: 925407eec2bfd0e4f44e7953fc7832919fc30d0d2088b62b09e5a3bb50740abd
  scope_note: 僅限2026-09-30固定來源快照的PASS；2026-11-02重新打包未重做獨立來源審查，不擴張舊審查至目前來源或產物
  blocking_findings: []
approval_gates:
  source_write: approved_consumed_2026-09-30
  automated_test: approved_consumed_2026-09-30
  live_api: closed
  app_runtime: closed
  package_build: approved_consumed_2026-09-30
  repack_package_build: approved_consumed_2026-11-02
  package_metadata_sync: approved_consumed_2026-11-02
  deployment: closed
  commit: closed
  push: closed
---

# EXE 更新偵測執行結果

## 2026-11-03 退役處置

Electron 專用來源、依賴與桌面新版提示已退役，首頁手動檢查新版保留。Windows 桌面人工驗收因退役取消，不改寫既有 partial 或歷史審查結果；舊 EXE 與下列退役前證據保留。本文其餘命令、檔案引用及待驗清單僅屬歷史，不再作現行建置或催驗依據。

## 更新偵測原始碼與自動驗證（2026-09-30 歷史證據）

- Intro 版本資訊旁固定顯示「檢查新版」，沿用 v2 的 Google 雲端資料夾，不放導覽列、側欄或其他位置，也不依 API 結果隱藏。網頁版可主動點擊，但無橋接時不查詢。
- EXE 編輯介面啟動時透過沙箱預載的單用途 `checkForUpdates()` 查詢；主程序只接受本機主視窗頂層、無參數請求，整個程序只做一次固定 GET，不外送圖片、專案、備註、本機版本或識別資料。
- 查詢總逾時 8 秒、回應上限 64 KiB；拒絕重導向、非 200、無效 JSON／欄位與超限，離線或失敗安靜退回、不重試、不影響編輯。API 的 `download_link` 不交給前端或系統瀏覽器，所有手動入口使用固定允許的資料夾。
- 僅遠端三段數字版本較新且未忽略／關閉時提示；顯示最新版本與純文字換行更新內容。沿用 v2 的更新日期民國七碼忽略鍵與工作階段關閉鍵；儲存不可用時仍維持本頁關閉，卸載或 StrictMode 晚到結果不更新 state。
- package.json 同步目前顯示版本 3.2.0；`src/utils/log.ts` 不改。封裝探針的合成檔名從實際套件版本建立，契約直接比對日誌顯示版本，不硬編碼舊版 3.1.1。
- React 沒有 Electron／Node.js 匯入或背景 HTTP；同一份 `dist/`、原 build 命令與網站 CSP 不變。新 ADR-0003 僅補桌面例外，不回寫或恢復歷史退役契約，不新增依賴或自動下載／安裝。

## 實際驗證

```text
node --test --test-reporter=tap tests/electronUpdate.test.ts tests/electronPackagingContract.test.ts tests/staticDeploymentContract.test.ts tests/browserRuntimeCutover.test.ts src/services/desktopUpdate.test.ts
pnpm run lint
pnpm run build
pnpm run verify:static
node --check electron/main.cjs
node --check electron/preload.cjs
node --check electron/update-check.cjs
node --check electron/update-ipc.cjs
git diff --check
```

- 聚焦集合 32/32、0 失敗、0 略過，exit 0；輸出 `/tmp/image-pigeon-electron-update-focused.tap`。新版查詢與沙箱／IPC 7 項、前端 9 項、既有封裝 6 項、靜態 7 項與退役邊界 3 項；未執行全倉測試，不宣稱全倉全綠。
- 測試實際串接預載函式 → IPC 主程序處理 → 固定 HTTPS 合成傳輸 → 前端提示判斷，重入只有一個 GET、關閉後不提示。另涵蓋錯誤、重導向、回應超限、連線／本文逾時、陌生來源零請求、固定無參數介面、版本比較與忽略／儲存失敗。
- lint、build、verify:static、四份 CJS 語法及差異檢查均 exit 0。靜態產物禁用字串命中 0，保留既有較大建置區塊警告。首輪 `pnpm run` 自動使用快取重建既有 esbuild；未新增依賴或改套件鎖定檔。
- 父代理 RED：具名 `EXE 使用單用途` 0/1、exit 1，原主程序缺少預載接線；實作後桌面隔離集合先 6/6，增加串接案例後 7/7。前端子代理 RED：Intro 缺少固定更新入口；日期邊界補測發現民國年份超過三位，最小補正後其前端 9/9 通過，父代理已整合重跑。
- 前端實作 `deleg_e2488728`（`gpt-5.6-terra`），只改指定六份前端檔案；父代理確認 App 相對既有基準只加入匯入與掛載，Intro 只加入版本旁連結，沒有接管原排版變更。

## 護欄、審查與未執行事項

基準 `/tmp/image-pigeon-electron-update-baseline.json`：19 份範圍外既有修改的內容與狀態維持相同；分支 dev、空暫存區及新路徑允許範圍確認。新增契約測試未被 `.gitignore` 忽略，全部新增檔案已做空白檢查。

受審來源 19 檔及受保護既有修改 19 檔：`/tmp/image-pigeon-electron-update-review.json`；相對差異 `/tmp/image-pigeon-electron-update-relative.diff`。來源摘要只納入 `source` 字典，不含 `protected` 或審查後收尾的 plan/result/STATE；演算法明列路徑排序、UTF-8 LF 串接、無尾端換行，避免聚合範圍歧義。

聚焦安全審查 `deleg_2ccf796d`（`gpt-5.6-terra`）為 PASS，無阻擋發現：沙箱單用途介面、主視窗頂層來源驗證、固定 GET／資料邊界、網頁零背景查詢、Intro 按鈕位置與固定下載網址均成立。獨立重跑上述集合 32/32、0 失敗，另驗五份 Electron CJS 語法、差異與暫存區護欄；來源摘要與 19 份保護內容相符，審查者未改檔。主代理在 PASS 後重算相同來源摘要，全部受審內容維持不變，僅校正本結果、計畫與 STATE。

使用者另核准本機 EXE 打包，不要求真實 API 查詢；已完成 3.2.0 Windows x64 portable 交叉打包及產物機械檢查，結果維持 partial，不把打包或隔離驗證擴張成 Windows 實機通過。本輪版型測試有一項失敗，詳見下方，不沿用舊 32/32 宣稱現行全綠。

未連線真實 API，也未啟動應用／瀏覽器／Word、執行 Windows 人工驗收、部署、提交或推送。測試只使用明示合成回應；實際遠端欄位及 Windows 呈現尚未驗證，不冒充實機或正式服務 PASS。依使用者確認，正式 API 查詢不列為本次交付前提。舊 EXE 保留不動，新版輸出至獨立 `release/3.2.0/`。

使用者已回報前一輪樣式完善，只記錄為該可見樣式的使用者確認，不擴張為前一輪完整 Windows／封裝驗收。

## 3.2.0 EXE 打包與交付（2026-09-30）

- 使用者明確核准打包現行版本，未核准啟動、部署或 Git 操作；使用現行 dev 工作樹，保留既有未提交的排版／Word 與 Intro 版型。
- 命令 `pnpm run package:electron:win --config.directories.output=release/3.2.0` exit 0，包含重新執行 TypeScript／Vite 建置與 `verify:static`；未修改依賴。沿用較大建置區塊、缺少 author／description 與預設 Electron 圖示等警告，未因此擴張修改。
- 命令 `pnpm run verify:electron:package release/3.2.0` exit 0；獨立讀取檔案確認 MZ／PE 標記、launcher machine `0x014c`、內含應用程式 machine `0x8664`。啟動器為 x86 不代表應用程式不是 x64。
- 最終檔案：`release/3.2.0/image-pigeon-3.2.0-win-x64-portable.exe`。
- 大小：99,233,703 bytes。
- SHA-256：`490bf167c8994e182c0c264d3ae9600b24a3acadc163d7f533984b7d802e794d`。
- 啟動器與應用程式 PE certificate table 均為 `[0, 0]`，實際產物未簽章；不把 builder 的 signtool 日誌誤記為有簽章。
- `win-unpacked/resources/app.asar` 頂層精確為 `dist`、`electron`、`package.json`，共 14 個檔案；無原始碼、文件、測試或 node_modules。封裝 metadata 版本 3.2.0、main `electron/main.cjs`；其餘 13 個檔案逐 byte 與目前 dist／electron 一致，無遺漏或多餘檔案。確認固定 API、更新預載與 IPC 接線已封裝。
- ASAR SHA-256：`eb42a717dead09fb120839ab8fab3a73d8bb1cfec8aa41e74dff1f4c1a45eda3`。
- 本輪 lint exit 0；聚焦重跑 31/32、1 失敗。失敗為 `desktopUpdate.test.ts:34` 要求連結自身含 `col-span-2`，而現行 Intro 已在外層 div 保留兩欄容器。相較前輪受審快照，只有 Intro 不同，且在本輪打包基準建立前已存在；所有桌面橋接、安全、版本邏輯及其他契約均通過。另用 TypeScript 語法樹機械確認唯一固定入口位於版本欄旁、外層兩欄容器、href、target 與安全 rel 均成立，exit 0；不回改使用者版型或調整測試以求全綠。
- 打包基準 `/tmp/image-pigeon-3.2.0-package-baseline.json`：除本輪三份治理文件外，全部既有來源內容一致；全部舊 release 檔案 SHA-256 保持相同。驗證摘要 `/tmp/image-pigeon-3.2.0-package-verification.json`。
- 打包交付已完成；未執行 Windows 啟動、SmartScreen／防毒、GUI、列印與 Word 實機驗收，不宣稱這些項目通過。

## 3.3.0 重新打包（2026-11-02）

使用者另行要求打包 EXE，本輪以目前已提交的 dev 來源 `df8a91ad3469d7a1a7396b516f374bbc6145d952` 重新封裝。只將 package.json 的封裝版本同步至既有更新紀錄的 3.3.0；不改功能、依賴或鎖定檔。新輸出目錄為 `release/3.3.0/`，舊產物保持不動。本輪打包及機械驗證完成，不沿用上方 2026-09-30 的產物雜湊或測試計數。

- 最終檔案：`release/3.3.0/image-pigeon-3.3.0-win-x64-portable.exe`；大小 99,241,119 bytes（94.64 MiB）。
- SHA-256：`3cad9c7940ec34e71ba348d887286f82bc55f42e822f4c5ef921399127c2bca9`。
- `node --test --test-reporter=tap tests/electronPackagingContract.test.ts tests/electronUpdate.test.ts`：13/13 通過，0 失敗、0 略過，退出 0；僅合成更新回應，不查正式 API。`pnpm run lint`：退出 0。
- `pnpm run package:electron:win --config.directories.output=release/3.3.0`：退出 0，包含本輪 TypeScript／Vite build 與 verify:static；靜態 8 檔、6 個引用、禁止命中 0。使用 `CSC_IDENTITY_AUTO_DISCOVERY=false`，未使用簽章憑證。
- `pnpm run verify:electron:package release/3.3.0`：退出 0，檔名、大小與 Windows PE 格式符合。啟動器 machine 為 `0x14c`，內含應用程式為 `0x8664` x64；兩者 certificate table 均為 `[0, 0]`，確認未簽章，不將 signtool 日誌誤認為已簽章。
- `python3 /Users/cksai/.hermes/cache/scratch/image-pigeon-exe-330-20261102/verify-artifact.py`：退出 0。ASAR 頂層精確為 dist、electron、package.json，共 14 檔；13 個內容檔逐 byte 符合目前 dist／electron，metadata 的 version／main／name 正確，沒有 src、docs、tests 或 node_modules。ASAR SHA-256：`d2520666a8d212899f0a3e8ab63168f076bd1a8f65b4f34d0d80d17c720d937e`。
- 同一護欄確認 package.json 相對基線只改版本，其他產品來源、依賴與鎖定檔、所有舊 release 產物、HEAD、分支及暫存區保持不變；只有本輪三份治理文件另作必要校正。`git diff --check` 與 staged 差異檢查退出 0。
- 基線及收據位於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-exe-330-20261102/`，包含 baseline.json、focused-result.json、lint-result.json、package-result.json、artifact-verification.json 及各命令日誌。初次基線蒐集因本機 Python 沒有 hashlib.file_digest 而停止；改用既有 sha256 介面後重跑成功，未影響產品或產物。
- 保留既有大型區塊、預設 Electron 圖示、缺少 author／description 及建置工具相依性提示；ASAR 實際檢查已確認未打包前端 node_modules。沒有更新工具或依賴，不重跑完整前端矩陣，不將既有列印文案或歷史 Intro 斷言改寫成全綠。
- 本輪沒有新增獨立來源複審；前輪 PASS 只限其歷史來源快照。計畫 active、結果 partial、目前檢查點為 `package_330_verified_windows_uat_pending`；打包與 metadata 同步閘門已消耗。未啟動應用、EXE、瀏覽器或 Word，未做 Windows 啟動、SmartScreen／防毒、列印或斷網人工驗收，未部署、暫存、提交或推送。
