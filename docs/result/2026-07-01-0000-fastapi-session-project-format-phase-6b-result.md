---
id: result-image-pigeon-fastapi-session-project-format-phase-6b-2026-07-01
type: result
status: completed
canonical: true
created_at: 2026-07-01T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-6-sliced-2026-07-01
phase: 6B
---

# Phase 6B：pywebview path + frontend 儲存/開啟 `.ipigeon/` 執行結果

## 執行狀態

- OpenCode 已完成主要程式碼修改與驗證命令，但 `opencode run` 最後 timeout，未建立 result report。
- Hermes 端接手做獨立驗收、確認實際檔案、重跑驗證，並補建本 result report。

## 完成項目 / AC 對照

- AC1：`py/main.py` 的 `Api.select_path` 已新增：
  - `project-save`
  - `project-open`
  - 舊有 `word` / `json` / `images` 模式保留。
  - `project-save` 若 path 未以 `.ipigeon` 結尾會補上 `.ipigeon`。
- AC2：frontend 已可由 `ProjectActions` 呼叫 `/api/project/save`。
  - `src/services/projectApi.ts` 新增 `saveProject()`。
  - `src/features/Project/OpenProject.tsx` 會先用 `select_path({ mode: 'project-save' })` 取得 target path，再 POST `sessionId / project / targetPath`。
- AC3：frontend 已可由 `ProjectActions` 呼叫 `/api/project/open`。
  - `src/services/projectApi.ts` 新增 `openProject()`。
  - 開啟後更新 `project`、`sessionId`、legacy `images` bridge。
- AC4：opened project preview bridge 使用 `toCustomImagesFromProject()`，內部走 `getOrderedItemViewModels()`，因此依 `layout.itemOrder` 排序。
- AC5：opened project preview bridge 保留 `remark`、`rotation`、width/height 與 session asset preview URL。
- AC6：本階段未把 Word / SaveImages options 寫入 project；project save 使用現有 `ProjectV2` state。
- AC7：TypeScript build 通過。
- AC8：full lint 仍失敗於既有 unrelated lint；scoped lint 對 6B 修改檔案通過。

## 修改 / 新增檔案

- `py/main.py`
- `src/App.tsx`
- `src/layout/Nav.tsx`
- `src/features/index.ts`
- `src/features/Project/OpenProject.tsx`（新增）
- `src/services/projectApi.ts`（新增）
- `src/types/project.ts`
- `src/state/projectImageAdapter.ts`
- `src/utils/type.ts`
- `src/globak.d.ts`

## 驗證命令與結果

- `uv run python -m unittest discover -s py/tests -p 'test_project_api.py' -v`
  - Hermes 重跑：3/3 通過。
- `uv run python -m unittest discover -s py/tests -v`
  - Hermes 重跑：30/30 通過。
- `uv run python -m compileall py`
  - Hermes 重跑：完成無錯誤。
- `pnpm -s tsc -b`
  - Hermes 重跑：通過。
- `pnpm run build`
  - Hermes 重跑：通過；仍有既有 chunk size warning。
- `pnpm run lint`
  - Hermes 重跑：失敗於既有 3 errors / 3 warnings：
    - `src/layout/Test.tsx` no-explicit-any
    - `src/utils/handleError.ts` no-explicit-any
    - `src/utils/handleToast.ts` no-explicit-any
    - 3 個既有 React Hook dependency warnings
- Scoped lint：
  - `pnpm exec eslint src/features/Project/OpenProject.tsx src/services/projectApi.ts src/state/projectImageAdapter.ts src/layout/Nav.tsx src/App.tsx src/utils/type.ts src/globak.d.ts`
  - Hermes 重跑：通過。
- grep：
  - `grep -R "project-save\|project-open" -n py/main.py src`
  - 已確認 `py/main.py`、`OpenProject.tsx`、`src/utils/type.ts` 均有對應接線。
- cache：
  - `__pycache__` 搜尋結果 0。

## Blockers / Deferred

- 無 Phase 6B blocker。
- 尚未做實機 pywebview dialog 手動 smoke；目前驗收為程式碼、型別、build、後端測試與 grep 接線驗收。
- Full lint 的既有 unrelated errors 尚未處理，不屬 Phase 6B 新增問題。

## 2026-07-01 Hermes follow-up：儲存/開啟按鈕實機錯誤修正

使用者回報「儲存專案 / 開啟專案」按下按鈕時都出錯。Hermes 重新追查後確認 Phase 6B 先前雖通過 build/API 測試，但 pywebview 實機接線仍有缺口：

- 根因 1：`py/main.py` 的 `select_path` 被 OpenCode 改到 `class Api` 外層，導致 pywebview JS API 不會暴露 `window.pywebview.api.select_path`。兩顆 project 按鈕都依賴此方法，因此會一起失敗。
- 修正：已將 `select_path` 縮排回 `class Api` 內，並在 `py/tests/test_api.py` 新增 `test_pywebview_api_exposes_select_path` 回歸測試。
- 根因 2：`DEBUG_MODE` 曾被改為 `True` 且 `VITE_DEV_URL` 指到 `localhost:5175`，與 production 桌面 app 需走 `http://127.0.0.1:18765` 的設計不符。
- 修正：已將 `DEBUG_MODE=False`、`VITE_DEV_URL=http://localhost:5173`，並保留 `test_main_production_frontend_url_uses_local_fastapi` 驗證。
- 根因 3：`.ipigeon` 是專案資料夾格式，但 `project-save` 先前嘗試使用 SAVE 檔案對話框；這與後端 `save_project_folder()` 預期資料夾語意不一致。
- 修正：`project-save` 改為選擇父資料夾，再用 `build_project_save_path(parent, title)` 產生 `<title>.ipigeon/` 目標資料夾；已新增 `test_build_project_save_path_creates_ipigeon_folder_name`。
- UX 防護：`ProjectActions` 新增 `getPywebviewApi()`，若在一般瀏覽器而非桌面 pywebview 環境按下 project 按鈕，會顯示「請在桌面程式中使用專案儲存/開啟功能」，而不是 undefined runtime error。

Follow-up 驗證：

- `uv run python -m unittest py.tests.test_api -v`：4/4 通過。
- `uv run python -m unittest discover -s py/tests -p 'test_project_api.py' -v`：3/3 通過。
- `uv run python -m unittest discover -s py/tests -v`：32/32 通過。
- `uv run python -m compileall py`：通過。
- `pnpm -s tsc -b && pnpm run build`：通過。
- `pnpm exec eslint src/features/Project/OpenProject.tsx src/services/projectApi.ts src/state/projectImageAdapter.ts src/layout/Nav.tsx src/App.tsx src/utils/type.ts src/globak.d.ts`：通過。
- `pnpm run lint`：仍只失敗於既有 unrelated 3 errors / 3 warnings。
- 已清理 `__pycache__` 與 `py/web_cache/` 測試暫存。

## 2026-07-01 Hermes follow-up：Word 儲存路徑被截成 `/` 修正

使用者回報「儲存 Word」失敗，錯誤為 `FileExistsError: [Errno 17] File exists: '/'`，trace 顯示 `doc.save(data.path)` 收到的 `data.path` 是 `/`。

- 根因：`Api.select_path()` 假設 pywebview dialog 一律回傳 list/sequence，使用 `selected_path[0]` 取第一筆。但 macOS / pywebview 可能直接回傳字串路徑；若選到 `/Users/.../output.docx`，`selected_path[0]` 會變成第一個字元 `/`。
- 修正：新增 `normalize_dialog_path()`，同時支援字串路徑與 sequence 路徑；`select_path()` 改用此 helper。
- 回歸測試：`py/tests/test_api.py` 新增 `test_normalize_dialog_path_accepts_string_or_sequence`。
- 連帶修正：`save_docx()` 原本使用 Windows-only `os.startfile(data.path)`；macOS 存檔成功後會再失敗。已新增跨平台 `open_file()`，macOS 使用 `open`。
- 連帶修正：`py/save_images.py` 也移除 Windows-only `os.startfile(data.path)`，改用跨平台 `open_folder()`，避免另存圖片發生同類問題。

Follow-up 驗證：

- `uv run python -m unittest py.tests.test_api -v`：5/5 通過。
- `uv run python -m unittest discover -s py/tests -v`：33/33 通過。
- `uv run python -m compileall py`：通過。
- `pnpm -s tsc -b && pnpm run build`：通過。
- 手動 helper probe：`normalize_dialog_path('/Users/cksai/Desktop/test.docx')` 與 `normalize_dialog_path(['/Users/cksai/Desktop/test.docx'])` 都回傳完整路徑，不再回傳 `/`。
