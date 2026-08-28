---
title: Electron Windows x64 免安裝候選執行結果
date: 2026-08-28
status: partial
plan: docs/plans/2026-08-28-electron-portable-mvp.md
workstream: workstream-electron-portable-mvp-2026-08-28
---

# Electron Windows x64 免安裝候選執行結果

## 結論

已在 macOS 主機以 Electron 44.0.0 與 electron-builder 26.15.3 成功產生 Windows x64 portable 候選。純前端 `pnpm run build` 與 `verify:static` 仍通過，Electron 維持獨立包裝層；Windows 實機 GUI、Word、列印、SmartScreen、防毒、中文路徑、顯示縮放與斷網 UAT 尚未執行，不宣稱已通過。

## 已實作

- 新增 `electron/main.cjs` 與 `electron/navigation-policy.cjs`，以 `loadFile()` 載入既有 `dist/index.html`。
- `BrowserWindow` 固定 `nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`，未新增 preload、IPC 或 renderer Node.js API。
- 固定外部 HTTPS 允許清單交由系統瀏覽器開啟；未知新視窗、外部導覽、webview 與所有權限要求均拒絕。
- `package:electron:win` 與 `verify:electron:package` 與既有 `build` 分離。
- builder 只將 `dist`、`electron` 與 `package.json` 放入 ASAR，並明確排除 `node_modules`。
- 採用 Electron 預設圖示，未讓圖示轉換阻擋 MVP 候選。

## 自動驗證證據

### 通過

- `node --test tests/electronPackagingContract.test.ts`：6/6 通過。
- 排除兩個已記錄既有失敗檔案後的其餘前端測試：110/110 通過。
- `pnpm run lint`：通過。
- `node --check electron/main.cjs electron/navigation-policy.cjs scripts/verify-electron-package.mjs`：通過。
- `pnpm run build`：通過。
- `pnpm run verify:static`：通過；8 個檔案、6 個引用、0 個禁止命中。
- `pnpm run package:electron:win`：通過；macOS 成功產生 Windows x64 portable 候選。
- `pnpm run verify:electron:package`：通過。
- ASAR header 實際頂層只有 `dist`、`electron`、`package.json`；archive 大小 1,236,985 bytes。
- `git diff --check` 與 `git diff --cached --check`：通過。
- staged inventory：空。
- `tests/electronPackagingContract.test.ts` 經 `git check-ignore` 確認可見。
- portable launcher 與 x64 payload 的 PE certificate table 均為 `(0, 0)`，確認產物未簽章。

### 完整前端測試現況

`pnpm run test:frontend` 實際結果為 116 項中 114 通過、2 失敗。兩項均為計畫執行前已記錄的既有基線失敗，本工作線未修改其來源或測試：

1. `src/features/PrintPreview/printPreview.test.ts`：既有文案缺少「可透過系統列印對話框另存 PDF」。
2. `tests/versionMetadata.test.ts`：既有測試仍期待 `3.0.0`，與專案目前 `3.1.1` 不一致。

因此不將完整測試套件記為 PASS，也不在 Electron 範圍內修正這兩項。

## 候選產物

- 路徑：`release/image-pigeon-3.1.1-win-x64-portable.exe`
- 大小：99,230,143 bytes
- SHA-256：`ff22e7b5e96cb38cfbe59f87bf791849cf97210c2b53da52a0a20304ee46f207`
- payload architecture：x64
- portable launcher PE machine：`0x14c`（NSIS portable 啟動器）；`win-unpacked/貼圖小鴿手.exe` 已驗證為 `0x8664` x64。
- 簽章：未簽章。
- 圖示：Electron 預設圖示。

## 範圍護欄

- 使用者既有 `src/utils/log.ts` 未被本工作線修改；SHA-256 仍為 `91750e108a3749eba9c131798b3bb58881f9733839ac6f1d368c38546111a0da`。
- 未修改 React 功能來源。
- 未新增安裝程式、簽章、自動更新、遙測、preload、IPC、Node.js 檔案操作或原生儲存。
- 未 commit、push 或部署。

## 獨立實作複審

- 複審識別：`deleg_90d38921`
- 結論：`PASS`
- 必要修正：無
- 信心：高（0.90）
- 非阻擋注意事項：產物探針目前以根目錄額外 `.exe` 為主要額外產物拒絕條件，沒有另列 `.msi` 等副檔名；builder 實際設定只有 portable x64，現有 `release/` 亦無 installer，因此不阻擋本次 Windows UAT 候選。
- 複審未重新執行測試、build 或 package；其結論建立在唯讀來源、設定、產物 metadata、ASAR、雜湊及本結果所列既有執行證據。

## 待使用者 Windows 實機驗收

候選完成後再斷網執行，依計畫逐項驗證：啟動、一般圖片／長截圖、`.ipigeon`、ZIP、DOCX、列印、外部連結、未知導覽拒絕、中文路徑、125%／150% 顯示縮放、SmartScreen 與防毒結果。
