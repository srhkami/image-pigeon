---
id: result-image-pigeon-fastapi-session-project-format-phase-1-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 1
---

# Phase 1：FastAPI 基礎與 pywebview 啟動整合執行結果

## 完成項目

- 新增 FastAPI backend package：`py/app/`。
- 新增 `GET /api/health`，回傳：
  - `{"status": 200, "message": "ok", "data": {"app": "image-pigeon"}}`
- 新增 FastAPI static serving：production 可由 FastAPI root URL serve `dist/index.html` 與 `dist/assets/*`。
- 調整 `py/main.py`：
  - 啟動 uvicorn daemon thread。
  - FastAPI bind `127.0.0.1:18765`。
  - production 視窗 URL 改為 `http://127.0.0.1:18765`。
  - dev mode 仍保留 Vite：`http://localhost:5173`。
  - 保留既有 pywebview `js_api=api`，目前仍可供選檔與舊流程使用。
- 更新 `vite.config.ts`：dev server `/api` proxy 到 `http://127.0.0.1:18765`。
- 更新 Python dependencies：加入 `fastapi`、`uvicorn[standard]`、`python-multipart`、`httpx`。
- 新增 unittest safety net：`py/tests/test_api.py`。

## TDD 證據

1. 先新增 `py/tests/test_api.py`，測試 `from app.api import create_app` 與 `/api/health`。
2. RED：執行 `.venv/bin/python -m unittest discover -s py/tests -v`。
   - 結果：失敗。
   - 失敗原因：`ModuleNotFoundError: No module named 'app'`。
3. GREEN：新增 `py/app/__init__.py`、`py/app/api.py` 後重跑。
   - `/api/health` 測試通過。
4. 追加 `main.get_frontend_url()` 測試。
5. RED：重跑 unittest。
   - 結果：失敗。
   - 失敗原因：`AttributeError: module 'main' has no attribute 'get_frontend_url'`。
6. GREEN：更新 `py/main.py` 後重跑。
   - 結果：2 tests OK。

## 實際修改檔案

- `pyproject.toml`
- `uv.lock`
- `py/app/__init__.py`
- `py/app/api.py`
- `py/main.py`
- `py/tests/test_api.py`
- `vite.config.ts`

Phase 0 同批次已修正：

- `pnpm-workspace.yaml`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-0-result.md`

## 驗證命令與結果

### Python tests / smoke

1. `.venv/bin/python -m unittest discover -s py/tests -v`
   - 結果：通過。
   - 輸出摘要：
     - `Ran 2 tests in 0.018s`
     - `OK`
   - 注意：FastAPI TestClient 目前會顯示 `StarletteDeprecationWarning`，不影響測試結果。

2. `.venv/bin/python -m compileall -q py && echo 'compileall py: ok'`
   - 結果：通過。
   - 輸出：`compileall py: ok`

3. 實際啟動 FastAPI smoke：
   - 命令：以 `.venv/bin/python` 啟動 `uvicorn.run(create_app(static_dir='dist'), host='127.0.0.1', port=18765, ...)`。
   - `GET http://127.0.0.1:18765/api/health`
     - HTTP status：`200`
     - body：`{"status":200,"message":"ok","data":{"app":"image-pigeon"}}`
   - `GET http://127.0.0.1:18765/`
     - HTTP status：`200`
     - body 開頭：`<!doctype html> <html lang="zh-hant" data-theme="dark"> ...`
   - smoke 完成後已停止 background server。

### Frontend

1. `pnpm -s tsc -b`
   - 結果：通過，exit code 0，無輸出。

2. `pnpm run build`
   - 結果：通過，exit code 0。
   - 輸出摘要：
     - `tsc -b && vite build`
     - `✓ 322 modules transformed.`
     - `✓ built in 1.26s`
   - 注意：仍有 Vite chunk size warning，不阻擋 build。

3. `pnpm run lint`
   - 結果：未通過，exit code 1。
   - 與 Phase 0 相同的既有問題仍存在：
     - `src/layout/Test.tsx:41:33`：`@typescript-eslint/no-explicit-any`
     - `src/utils/handleError.ts:4:43`：`@typescript-eslint/no-explicit-any`
     - `src/utils/handleToast.ts:7:39`：`@typescript-eslint/no-explicit-any`
     - 另有 3 個 React Hook dependency warnings。

## 手動 smoke 結果

- 已使用實際 uvicorn server 驗證 `/api/health`。
- 已使用實際 uvicorn server 驗證 production root 可回傳 React build 的 `index.html`。
- 未啟動完整 pywebview GUI 視窗；目前已用 unittest 驗證 production frontend URL 會指向 FastAPI root，並用 import/compileall 確認 Python 模組可載入。

## 未完成項目 / blocker

- Phase 1 的完整桌面 GUI smoke 尚未執行，避免 CLI session 被 pywebview 視窗阻塞；後續可在使用者本機互動確認視窗仍可開啟。
- `pnpm run lint` 仍有既有 lint errors/warnings，尚未納入本 Phase 修復範圍。
- 尚未開始 Phase 2 session store / Project v2 model。

## 與計畫偏離

- 本次選用固定 port `18765`，方便 Vite dev proxy 與 pywebview production URL 保持一致。
- 為了支援 FastAPI TestClient，額外加入 `httpx` 作為測試 dependency。
