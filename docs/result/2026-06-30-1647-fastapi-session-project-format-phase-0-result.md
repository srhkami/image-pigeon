---
id: result-image-pigeon-fastapi-session-project-format-phase-0-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 0
---

# Phase 0：基線與安全網執行結果

## 完成項目

- 已讀取正式計畫與決策紀錄：
  - `docs/plans/2026-06-30-1647-fastapi-session-project-format.md`
  - `docs/status/2026-06-30-fastapi-session-project-format-decisions.md`
  - `.planning/2026-06-30-fastapi-session-project-format/*`
- 已確認目前實作仍是 pywebview `js_api` 主流程，前端仍使用 `window.pywebview.api.*` 與 `CustomImage` base64 model。
- 已執行前端 baseline：install、TypeScript build、production build、lint。
- 已檢查 Python `.venv` dependencies 與 `py/main.py` import / `Api` 建構 smoke。
- 已清掉 `compileall` 產生的 `py/__pycache__/` 暫存檔，避免污染 git status。

## 實際修改檔案

- `pnpm-workspace.yaml`
  - 將 `allowBuilds.esbuild` 從佔位字串 `set this to true or false` 改為 `true`。
  - 原因：佔位值會讓 `pnpm install`、`pnpm -s tsc -b`、`pnpm run build`、`pnpm run lint` 在執行實際命令前先因 `ERR_PNPM_IGNORED_BUILDS` 失敗。

## 驗證命令與結果

### 前端

1. `pnpm install`
   - 結果：通過。
   - 重點輸出：
     - `esbuild postinstall: Done`
     - `Done in 596ms using pnpm v11.4.0`

2. `pnpm -s tsc -b`
   - 結果：通過，exit code 0，無輸出。

3. `pnpm run build`
   - 結果：通過，exit code 0。
   - 重點輸出：
     - `tsc -b && vite build`
     - `✓ 322 modules transformed.`
     - `✓ built in 1.16s`
   - 注意：Vite 顯示 chunk size warning：`Some chunks are larger than 500 kB after minification.` 此為 warning，不阻擋 build。

4. `pnpm run lint`
   - 結果：未通過，exit code 1。
   - 目前既有 lint 問題：
     - `src/layout/Test.tsx:41:33`：`@typescript-eslint/no-explicit-any`
     - `src/utils/handleError.ts:4:43`：`@typescript-eslint/no-explicit-any`
     - `src/utils/handleToast.ts:7:39`：`@typescript-eslint/no-explicit-any`
   - 目前既有 lint warnings：
     - `src/features/About/ModalReadme.tsx:18:6`：React Hook dependency `onShow`
     - `src/features/Intro/ModalNewVersion.tsx:36:6`：React Hook dependency `onShow`
     - `src/layout/AlertLoading.tsx:19:6`：React Hook dependency `count`

### Python

1. `.venv/bin/python --version`
   - 結果：`Python 3.13.13`

2. `.venv/bin/python` dependency check
   - 結果：通過。
   - 已確認：
     - `pillow: 12.1.0`
     - `pyinstaller: 6.18.0`
     - `python-docx: 1.2.0`
     - `pywebview: 6.1`

3. `.venv/bin/python -m compileall -q py`
   - 結果：通過，輸出 `compileall py: ok`。

4. `.venv/bin/python` import / Api smoke
   - 結果：通過。
   - 重點輸出：
     - `main import + Api construct: ok`
     - production URL expression 目前為 `/Users/cksai/Desktop/Coding/image-pigeon/./html/index.html`

## 手動 smoke 結果

- 未啟動完整 pywebview GUI 視窗，避免 Phase 0 baseline 在 CLI session 中卡住互動式桌面流程。
- 已用 import / `Api()` 建構確認 `py/main.py` 與既有 bridge method 可載入：`upload_image`、`crop_image`、`save_docx`、`save_images`、`save_json`、`select_path`。
- 已確認目前 production URL 邏輯仍指向 `./html/index.html`，尚未改為 FastAPI serve root；此為 Phase 1 預期工作。

## Known failures / blockers

- `pnpm run lint` 有既有 lint errors/warnings，上列檔案需在後續清理或改造時處理；目前 TypeScript build 與 production build 可通過。
- `pnpm-workspace.yaml` 原本的 `allowBuilds.esbuild` 佔位值會阻擋所有 pnpm script；已在 Phase 0 修正為 `true`。
- 尚未開始 Phase 1 FastAPI 基礎整合。

## 與計畫偏離

- Phase 0 原計畫要求確認 `python main.py` 是否可啟動；本次未在 CLI 中啟動完整 GUI，改以 import / `Api()` 建構 / compileall 作為 smoke，避免 pywebview 桌面視窗阻塞自動化流程。
