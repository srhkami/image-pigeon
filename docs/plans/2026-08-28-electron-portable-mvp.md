---
type: plan
id: plan-image-pigeon-electron-portable-mvp-2026-08-28
status: active
canonical: true
scope: image-pigeon
created_at: 2026-08-28
branch:
  name: dev
  base: dev
  status: existing_dirty
execution:
  status: partial
  current_checkpoint: windows_manual_uat_pending
result: docs/result/2026-08-28-electron-portable-mvp-result.md
review:
  type: plan_sanity
  status: passed
  first_verdict: request_changes
  first_delegation: deleg_a1e42320
  remediation_status: completed
  final_verdict: pass
  final_delegation: deleg_e1ea7501
implementation_review:
  status: passed
  verdict: pass
  delegation: deleg_90d38921
  confidence: high
approval_gates:
  planning_docs: approved_consumed
  source_write: approved_consumed_2026-08-28
  dependency_install: approved_consumed_2026-08-28
  automated_test: approved_consumed_2026-08-28
  local_package_build: approved_consumed_2026-08-28
  windows_manual_uat: user_operated_after_handoff
  signing: closed
  installer: closed
  deployment: closed
  commit: closed
  push: closed
related:
  - docs/adr/0002-pure-frontend-runtime-boundary.md
  - docs/architecture/current-architecture.md
  - docs/deployment/pure-frontend-static-hosting.md
  - docs/result/2026-08-25-retire-python-runtime-result.md
---

# Electron Windows x64 免安裝候選計畫

## 1. 目標與決策

在不改變現有 React + Vite 純前端功能、建置命令及 HTTPS 靜態部署能力的前提下，新增一層最小 Electron 桌面包裝，讓同一份 `dist/` 可以打包成未簽章的 Windows x64 免安裝執行檔，交由使用者在 Windows 環境人工驗測。

本輪採最快可交付路徑：Electron 只建立視窗、載入既有 `dist/`、封鎖未知導覽與權限，並將既有固定外部連結交給系統瀏覽器。React 端不使用 Electron、Node.js、預載腳本（preload script）或跨程序通訊（IPC）；`.ipigeon`、圖片 ZIP、DOCX、檔案選擇、拖放與 `window.print()` 全部先保留現有瀏覽器流程。

使用者已決定第一階段只產生未簽章 Windows x64 免安裝版；安裝程式、程式碼簽章、自動更新與正式發布都不在本輪。

## 2. 現況與基線

- 現行權威架構是 React + Vite 純前端，正式網站由 HTTPS 靜態主機提供 `dist/`。
- `vite.config.ts` 已使用 `base: './'`，可由 Electron 載入同一份相對路徑產物。
- 現行 `package.json` 的 `pnpm run build` 為 `tsc -b && vite build`，本輪不得改變其語意或附帶桌面打包。
- 正式前端沒有背景 `fetch`／XMLHttpRequest；圖片與專案不外送。
- `.ipigeon`、ZIP 與 DOCX 由 Blob URL 下載；專案開啟使用瀏覽器檔案輸入；列印使用 `window.print()`。
- 目前應用程式顯示版本由 `src/utils/log.ts` 的第一筆 changelog 決定，當前工作樹值為 `3.1.1`；`package.json.version` 仍為 `0.0.0`。
- 規劃開始前 dirty baseline：`src/utils/log.ts` 有一筆未暫存的使用者修改，staged inventory 為空。本輪不得修改、還原、暫存或吸收該檔案；若實作時基線已變動，先重新記錄並保護新的既有差異。
- 規劃文件完成後的工作線文件基線另含本工作建立的 `M STATE.md` 與 `?? docs/plans/2026-08-28-electron-portable-mvp.md`。這兩個文件是本工作線允許修改目標，不得與 `src/utils/log.ts` 的使用者既有 dirty hunk 混為同一來源。
- 本機是 macOS，不能提供 Windows GUI、Microsoft 365 Word、SmartScreen、防毒或 Windows 列印 PASS。macOS 若能跨平台產生 `.exe`，只證明封裝工具完成，不證明 Windows 執行成功。

## 3. 核心不變契約

完成後必須同時成立：

```text
pnpm run build
→ 只建立現有純前端 dist/
→ 不啟動 Electron
→ 不要求 Electron 執行階段
→ 可繼續部署至既有 HTTPS 靜態主機

pnpm run package:electron:win
→ 先建立同一份 dist/
→ 再由 Electron 包裝成 Windows x64 免安裝候選
```

進一步約束：

1. `src/` 正式程式不得匯入 `electron`、Node.js 內建模組或桌面橋接。
2. 不把圖片處理、專案封存、ZIP、DOCX 或列印搬到 Electron 主程序。
3. 不修改任何既有 UI、操作流程、資源上限、封存格式或輸出資料契約。
4. 不加入 Python、FastAPI、pywebview、本機 HTTP server、資料庫或可寫入服務端目錄。
5. Electron 依賴只能位於 `devDependencies`，不得進入 Vite 瀏覽器 bundle。
6. 刪除 Electron 專用檔案與依賴後，純前端應可恢復為原本的獨立交付形態。

## 4. 允許修改範圍

### 4.1 建立

- `electron/main.cjs`：最小 Electron 主程序，不建立預載腳本。
- `electron/navigation-policy.cjs`：Electron 固定外部導覽允許清單與 URL 判斷。
- `electron-builder.yml`：只定義 Windows x64 portable 封裝。
- `tests/electronPackagingContract.test.ts`：純前端不變與 Electron 安全／封裝契約。
- `scripts/verify-electron-package.mjs`：檢查輸出候選存在、格式、大小及禁止的額外產物。
- `docs/result/2026-08-28-electron-portable-mvp-result.md`：實際執行與驗證證據。

### 4.2 修改

- `package.json`：加入 Electron 開發依賴、桌面入口與獨立打包／驗證命令；將套件版本與應用程式顯示版本同步，但不得改變既有 `build`、`lint`、`test:frontend`、`preview` 或 `verify:static` 語意。
- `pnpm-lock.yaml`：只接受上述開發依賴造成的鎖定檔變更。
- `pnpm-workspace.yaml`：只記錄 pnpm 11 的依賴建置核准；允許既有 Vite 所需的 `esbuild` 安裝腳本，明確拒絕 portable MVP 不需要的 `electron-winstaller` 安裝腳本。
- `.gitignore`：忽略本機 Electron 打包輸出目錄 `release/`，並在既有 `/tests/*` 規則下精確加入 `!/tests/electronPackagingContract.test.ts`，確保新契約測試可由一般 Git 流程看見。
- `STATE.md`：反映工作線、閘門、證據與下一步。
- 本計畫：隨執行進度更新生命週期、審查與閘門結果。

### 4.3 條件式建立

- `build/icon.png` 或 `build/icon.ico`：只有現有 `public/Logo.svg`／`public/Logo_TP.png` 能以已安裝或明確新增的建置工具可靠產生時才建立；不得為圖示轉換引入大型執行階段或改動前端品牌資產。若圖示處理阻擋最快封裝，第一個候選可使用 Electron 預設圖示並在結果中列為人工驗收前非阻擋缺口。

## 5. 明確不在範圍

- 不修改 `src/utils/log.ts` 或其他既有 dirty hunk。
- 不修改 `src/features/`、`src/services/`、`src/state/`、`src/types/`、`src/layout/` 或現有 UI 樣式。
- 不改變 `.ipigeon` schema、ZIP、DOCX、列印、下載、拖放或檔案輸入流程。
- 不新增 preload、IPC、`fs`、`child_process`、原生儲存對話框或自訂 URL protocol。
- 不新增內容更新、自動更新、遙測、分析、崩潰上傳或背景網路請求。
- 不建立 NSIS／MSI 安裝程式，不處理升級、解除安裝或檔案關聯。
- 不購買、匯入或使用程式碼簽章憑證。
- 不在本輪修改 ADR-0002 或把 Electron 宣告為正式採用架構；人工 Windows 驗收與採用決策前，它只是額外交付候選。
- 不執行 commit、push、merge、正式部署或 release 發布。

## 6. 技術設計

### 6.1 依賴與入口

核准後以 `pnpm` 加入當時鎖定的 `electron` 與 `electron-builder` 開發依賴。規劃時查得 npm 最新版本分別為 `44.0.0` 與 `26.15.3`；實作時必須以 `pnpm add -D electron@44.0.0 electron-builder@26.15.3` 明確鎖定，不使用浮動 `latest`。`electron@44.0.0` 要求 Node.js `>=22.12.0`；本機規劃時實際版本為 `v22.22.2`，Windows 建置主機也必須先滿足相同最低版本，否則停止於環境前置條件，不把依賴安裝失敗誤判為專案程式錯誤。

`package.json.main` 指向 `electron/main.cjs`。新增命令名稱固定為：

```text
build:electron           → pnpm run build && pnpm run verify:static
package:electron:win     → pnpm run build:electron && electron-builder --win portable --x64
verify:electron:package  → node scripts/verify-electron-package.mjs
```

不得把 `electron-builder` 串進既有 `pnpm run build`。

### 6.2 Electron 主程序

`electron/main.cjs` 只實作：

- 單一執行個體鎖。
- `app.whenReady()` 後建立單一 `BrowserWindow`。
- 以 `loadFile()` 載入封裝內的 `dist/index.html`。
- `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`、`webSecurity: true`。
- 不提供 preload，不暴露 Node.js 或 Electron API 給 React。
- 阻止 `<webview>` 附掛。
- 拒絕攝影機、麥克風、位置、通知、剪貼簿讀取等所有網頁權限要求。
- `setWindowOpenHandler()` 一律拒絕建立新 Electron 視窗；只有精確命中允許清單的 HTTPS URL 才交給 `shell.openExternal()`。
- 阻止主視窗導覽離開已載入的本機 `index.html`。
- 外部開啟失敗只記錄固定錯誤，不反射私人資料、不使主視窗崩潰。
- 正式封裝不自動開啟開發者工具。
- Windows／Linux 關閉所有視窗後退出；macOS 只保留標準重新啟用行為，供本機最小煙霧驗證使用。

### 6.3 導覽政策

`electron/navigation-policy.cjs` 保存與 `src/services/browserExternalNavigation.ts` 相同的五個固定 URL。契約測試必須比較兩邊集合完全一致，避免 Electron 允許清單漂移；允許清單之外的 `http:`、`https:`、`file:`、`javascript:`、`data:` 與其他 scheme 全部拒絕。

不因離線模式移除既有外部連結：使用者主動點擊時仍嘗試交給系統瀏覽器；斷網時由系統瀏覽器呈現無法連線，不改變應用程式資料。

### 6.4 封裝設定

`electron-builder.yml` 必須固定：

- `appId`：`tw.pigeonhand.imagepigeon`
- `productName`：`貼圖小鴿手`
- `asar: true`
- `directories.output`：`release`
- `files` 允許清單精確為 `dist/**`、`electron/**`、`package.json`，並明確加入否定規則 `!node_modules/**`。本 MVP 的主程序只有 Electron 內建 API，沒有額外主程序 runtime dependency；Electron 自身由 builder 按平台提供，不以整個前端依賴樹塞入應用程式。
- Windows target 只有 `portable`，architecture 只有 `x64`。
- 產物名稱使用 ASCII：`image-pigeon-${version}-win-x64-portable.${ext}`。
- 不設定 publish provider、更新端點或簽章秘密。
- 不建立 installer target。

若 `electron-builder` 的必要預設檔案與 allowlist 衝突，實作只能加入最小必要路徑並更新契約測試，不可改成廣泛 `**/*`。

## 7. 執行切片

### E0：基線與 RED 契約

1. 重新執行 `git status --short --untracked-files=all`、`git diff --cached --name-only`，記錄所有既有 dirty／staged／untracked 路徑。
2. 將 `M STATE.md` 與 `?? docs/plans/2026-08-28-electron-portable-mvp.md` 記為本工作線既有文件差異；確認 `src/utils/log.ts` 仍是獨立的使用者修改且不得開啟編輯。
3. 建立 `tests/electronPackagingContract.test.ts`，先要求：
   - Electron 專用檔案與命令存在。
   - `src/` 不匯入 Electron／Node.js。
   - 原有 `build` 命令保持 `tsc -b && vite build`。
   - Electron 主程序安全旗標與導覽／權限拒絕存在。
   - Electron／瀏覽器外部 URL 允許清單一致。
   - builder 只有 Windows x64 portable、無 publish／installer／signing。
4. 先執行聚焦測試，確認因 Electron 候選尚未建立而 RED；若失敗原因是測試語法或環境，不得當成有效 RED。

### E1：最小桌面殼

1. 建立 `electron/navigation-policy.cjs`。
2. 建立 `electron/main.cjs`，只實作第 6 節安全殼。
3. 不新增 preload 或 React 分支。
4. 重跑聚焦測試，確認主程序契約轉為 GREEN。
5. 使用 Node 語法檢查確認兩個 `.cjs` 可解析；不啟動 GUI。

### E2：依賴與封裝設定

1. 使用 `pnpm add -D electron@44.0.0 electron-builder@26.15.3` 更新 `package.json` 與 `pnpm-lock.yaml`。
2. 將 `package.json.version` 同步為 `3.1.1`，但不修改 `src/utils/log.ts`；聚焦測試比較兩者一致。
3. 新增獨立 Electron scripts，保留所有既有 scripts 語意。
4. 建立 `electron-builder.yml` 與 `.gitignore` 的 `release/` 規則。
5. 在 `.gitignore` 精確加入 `!/tests/electronPackagingContract.test.ts`，並以 `git check-ignore -q tests/electronPackagingContract.test.ts` 的非零退出碼與完整 untracked status 證明測試檔沒有被忽略。
6. 重跑聚焦測試、lint、純前端 build 與 `verify:static`，先證明瀏覽器候選未退化。

### E3：本機打包與機械驗證

1. 建立 `scripts/verify-electron-package.mjs`，只接受 `release/image-pigeon-3.1.1-win-x64-portable.exe`：
   - 必須是一般檔案。
   - 檔名與版本精確匹配。
   - 前兩個位元組必須為 Windows PE/DOS `MZ` 標記。
   - 大小必須大於合理的最低封裝門檻，避免空殼或錯誤文字檔冒充。
   - 掃描 `release/` 中的封裝產物，拒絕額外 `.exe`、installer、非 x64 或非 portable 候選；electron-builder 產生的診斷、有效設定或 metadata 檔案不算額外應用程式產物，不得因此誤報失敗。
2. 在 macOS 嘗試執行 `pnpm run package:electron:win`。
3. 若成功，執行 `pnpm run verify:electron:package`，記錄產物路徑、位元組數與 SHA-256；雜湊只是交付識別，不代表 Windows 可執行。
4. 若因 Wine、簽章工具、Electron builder 的 macOS→Windows 限制而失敗：
   - 不引入未核准的虛擬機、雲端 CI、付費服務或 Rosetta／系統級安裝。
   - 保留已通過的來源、設定、鎖定檔與純前端驗證。
   - 在結果中標記 `partial`，交付 Windows 上的精確打包命令，由使用者執行後再跑產物驗證。
5. 不在 macOS 執行或宣稱 Windows `.exe` GUI 驗收。

### E4：證據、審查與人工交接

1. 執行第 9 節全部自動驗證。
2. 盤點實際差異，確認只命中第 4 節允許路徑及既有 `src/utils/log.ts` 基線。
3. 建立結果文件，逐項記錄：純前端回歸、Electron 來源契約、是否實際產生 `.exe`、產物識別、已知警告與未執行的 Windows UAT。
4. 執行一次獨立聚焦實作審查，重點為純前端零退化、Electron 安全旗標、封裝 allowlist 與證據誠實性。
5. 若審查要求修正，只處理本計畫範圍並重跑受影響驗證；不順手加入 preload、原生儲存或安裝程式。
6. 將工作線維持 `waiting_approval`／`partial`，交由使用者在 Windows x64 斷網環境人工驗測；不得因 build 通過而提前完成。

## 8. 驗收條件

- AC-1：既有 `pnpm run build` 命令與語意不變，仍只產生可部署的純前端 `dist/`。
- AC-2：`src/` 沒有 Electron、Node.js、preload 或 IPC 依賴；既有圖片、專案、ZIP、DOCX、列印與 UI 原始碼零修改。
- AC-3：Electron 主程序以隔離、沙箱、無 Node integration 的視窗載入既有 `dist/index.html`，且不啟動 localhost。
- AC-4：未知新視窗、未知導覽、webview 與所有不需要的權限都被拒絕；五個既有外部 URL 只交給系統瀏覽器。
- AC-5：封裝設定只允許未簽章 Windows x64 portable，不含 installer、publish、自動更新或簽章設定。
- AC-6：Electron 依賴只在 `devDependencies`，既有靜態產物探針仍通過，正式瀏覽器 bundle 不含 Electron／Node.js 執行階段。
- AC-7：若 macOS 跨平台打包成功，`release/` 只有符合命名與 `MZ` 檢查的 portable `.exe`，並記錄大小及 SHA-256；若受主機工具鏈阻擋，結果必須是 `partial`，不得虛構產物。
- AC-8：既有 `src/utils/log.ts` dirty hunk 與 staged inventory 未被修改；沒有範圍外檔案或隱性提交。
- AC-9：聚焦 Electron 契約、完整前端測試、lint、純前端 build、靜態產物探針及差異護欄均有實際結果；任何既有範圍外測試失敗需逐項記錄，不得為全綠擴張範圍。
- AC-10：Windows 啟動、SmartScreen、防毒、檔案輸入／拖放、`.ipigeon` roundtrip、ZIP、DOCX／Word、列印／PDF、完全斷網與大量圖片均明確保留為使用者人工驗收，不被自動證據取代。

## 9. 驗證命令

實作時從 repository root 執行：

```bash
node --test tests/electronPackagingContract.test.ts
pnpm run test:frontend
pnpm run lint
pnpm run build
pnpm run verify:static
node --check electron/main.cjs
node --check electron/navigation-policy.cjs
pnpm run package:electron:win
pnpm run verify:electron:package

git diff --check
git diff --cached --check
git status --short --untracked-files=all
git diff --name-only
git diff --cached --name-only
git check-ignore -q tests/electronPackagingContract.test.ts; test $? -ne 0
```

`package:electron:win` 或 `verify:electron:package` 只有在 `local_package_build` 閘門核准後執行。若跨平台封裝受環境阻擋，前面的來源／前端驗證仍需完成，但不得把它們擴張為 `.exe` PASS。

Windows 建置主機必須先確認 Node.js `>=22.12.0`；本輪規劃與本機驗證基準版本為 `v22.22.2`。前置條件符合後，人工交接命令固定為：

```powershell
node --version
corepack enable
pnpm install --frozen-lockfile
pnpm run package:electron:win
pnpm run verify:electron:package
```

該命令不包含簽章、安裝、發布、commit 或 push。

## 10. Windows 人工驗收清單

由使用者在 Windows x64 執行並回報，不是 Agent 完成條件：

1. 在已完成依賴安裝與封裝後關閉網路，再雙擊 portable `.exe`；應可啟動且不出現 localhost／伺服器需求。本項不要求離線執行 `pnpm install` 或下載 Electron。
2. 一般圖片選取、外部拖放、壓縮、長截圖切割、排序、旋轉、備註與五種排版可操作。
3. `.ipigeon` 儲存、關閉程式、重啟與開啟 roundtrip 正確；取消與損壞檔案不污染目前專案。
4. 圖片 ZIP 與 DOCX 可下載／保存，中文檔名正確；DOCX 可由 Microsoft 365 Word 開啟並人工檢查版型。
5. `window.print()` 可開啟 Windows 列印流程，Microsoft Print to PDF 的 A4 分頁正常。
6. 五個允許連結由預設瀏覽器開啟；未知導覽不建立 Electron 視窗。
7. 1000 張與 200 MiB 產品上限、取消與超限提示符合現有純前端行為。
8. 記錄 Windows 版本、Electron 候選檔 SHA-256、Word 版本、顯示縮放及 SmartScreen／防毒結果。

任何失敗先記錄單一可重現案例；不自動擴張為原生檔案 API、安裝程式或全面桌面重構。

## 11. 停止條件與後續決策

遇到以下任一情況立即停止目前切片並回報：

- 需要修改既有 React 功能才能讓 Electron 啟動或打包。
- `src/` 必須匯入 Electron／Node.js，或需要 preload／IPC 才能維持現有功能。
- `pnpm run build`、`verify:static` 或既有前端測試出現本輪新增失敗。
- Electron 依賴進入正式 Vite bundle，或正式前端新增背景網路請求。
- 打包工具要求秘密、簽章、外部發布、系統級高風險安裝或未核准的雲端 CI。
- 既有 `src/utils/log.ts` dirty hunk、staged inventory 或其他使用者變更發生漂移。
- reviewer 發現純前端零退化或 Electron 安全邊界的阻擋問題。

使用者完成 Windows 人工驗收後，再另行決定：

- 是否採用 Electron 為正式額外交付方式。
- 是否修正特定 Windows 相容性問題。
- 是否加入品牌圖示、安裝程式、程式碼簽章或檔案關聯。
- 是否更新 ADR／現行架構文件。

上述決策不由本計畫預先開啟。

## 12. 計畫審查紀錄

### 第一輪 Plan Sanity Review

- delegation：`deleg_a1e42320`
- verdict：`REQUEST_CHANGES`
- 已確認方向：同一份 `dist/`、`loadFile()`、無 preload／IPC、Windows portable x64 與 macOS 跨平台證據邊界均合理。
- 必要修正：解除新測試的既有 `.gitignore` 規則、鎖定 Node.js 最低版本、收斂 builder 檔案允許清單、避免 metadata 造成產物探針假陰性，並分開記錄本工作線文件差異與使用者既有 dirty hunk。
- remediation：已依目前計畫快照完成上述聚焦修正；修正期間 `review.status` 維持 `changes_requested`，沒有提前開啟實作閘門。

### 聚焦 Plan Sanity Re-review

- delegation：`deleg_e1ea7501`
- verdict：`PASS`
- 結論：第一輪五項必要修正、斷網 UAT 時序、範圍控制與 `STATE.md` 狀態均一致，沒有阻擋問題；計畫可作為後續最快實作契約。
- 證據邊界：本次只完成唯讀計畫審查，沒有執行命令、測試、依賴安裝、打包或 Windows UAT，也沒有因此開啟任何後續閘門。
