---
id: work-order-image-pigeon-fastapi-session-project-format-phase-3-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 3
executor: opencode
---

# OpenCode Work Order：Phase 3 圖片匯入 API

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path，不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` 的 Phase 3（約 lines 673-697）
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-0-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-1-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-2-result.md`
- 現有檔案：
  - `py/app/api.py`
  - `py/app/models.py`
  - `py/app/session_store.py`
  - `py/tests/test_api.py`
  - `py/tests/test_models.py`
  - `py/tests/test_session_store.py`
  - `pyproject.toml`

## 任務範圍

執行正式計畫 Phase 3 的「後端」部分：建立 multipart + WebP session image API，先不要改前端 component。

必須建立 / 更新：

1. `py/app/image_service.py`
   - 接收 UploadFile bytes 或 bytes + original filename。
   - 用 Pillow 解碼圖片。
   - 根據 `quality` / `min_size` 壓縮或限制尺寸。
   - 儲存 WebP 到 `web_cache/temp/sessions/<session_id>/images/<uuid>.webp`。
   - 產生 `Asset` / `Item`。
   - 更新 session project：append assets/items，並 append item id 到 default `layout_word_default.itemOrder`。
   - 壞圖需回報 skipped/errors；若全部失敗，API 應回合理 HTTP error。

2. `py/app/api.py`
   - 實作 `POST /api/images/import`
     - `multipart/form-data`
     - fields：
       - `session_id`: optional
       - `files`: UploadFile[]
       - `quality`: int = 75
       - `min_size`: int = 1000
     - response body 需符合計畫概念：
       - `status: 200`
       - `message: 新增成功`
       - `data.sessionId`
       - `data.assets`
       - `data.items`
       - `data.layoutPatch.appendItemOrder`
       - 可包含 `skipped` / `errors`，但不要破壞上述 contract。
   - 實作 `GET /api/sessions/{session_id}/assets/{asset_id}/image`
     - 回傳 session 內 WebP file。
     - 不存在時回 404。

3. tests
   - 依 TDD：先寫 failing tests，再實作。
   - 可新增：
     - `py/tests/test_image_service.py`
     - `py/tests/test_image_api.py`
   - 測試至少覆蓋：
     - POST 上傳單張 PNG/JPG，會建立或沿用 session。
     - response 有 sessionId/assets/items/layoutPatch.appendItemOrder。
     - session images 產生 `.webp`，且 Pillow 可讀、格式為 WebP。
     - session.json project 的 assets/items/layout itemOrder 已更新。
     - GET image endpoint 可讀回 WebP，content-type 合理。
     - 壞圖不應新增 asset；全部壞圖應回 400 或 422，並有清楚訊息。
     - 多檔 partial success：好圖成功、壞圖列 skipped/errors。
   - 注意：每個新測試檔需自行把 repo `py/` 放進 `sys.path`，不可依賴其他 test import side effect。Hermes 會單檔跑測試驗收。

## 約束

- 不使用 DB。
- 不實作 Phase 4 長截圖匯入。
- 不重構前端；Phase 3 前端 type/service 可先不做，除非非常小且不影響 build。
- 不重構舊 `py/upload_imags.py`，除非必要；優先在新 `py/app/image_service.py` 實作。
- 不處理既有 lint errors，除非你的改動造成新的錯誤。
- 不改 `pywebview-base`。
- 盡量維持現有 Python unittest 方式，不新增 pytest 依賴。
- 使用 Pydantic v2 API。
- API app 需能用 `create_app()` 注入測試用 session base dir；若需要，請以不破壞既有 `create_app(static_dir=...)` 的方式新增 optional 參數，例如 `session_base_dir`。

## 驗證命令

請執行並記錄：

- `.venv/bin/python -m unittest discover -s py/tests -v`
- 代表性單檔測試，例如：
  - `.venv/bin/python -m unittest discover -s py/tests -p 'test_image_api.py' -v`
  - `.venv/bin/python -m unittest discover -s py/tests -p 'test_image_service.py' -v`
- `.venv/bin/python -m compileall -q py`
- `pnpm -s tsc -b`
- `pnpm run build`
- 可執行 `pnpm run lint`，但若仍是 Phase 0/1/2 已記錄既有 lint failures，請明確標註非本 Phase 新增。

## 手動 smoke / script

請用 `fastapi.testclient.TestClient` 或 `.venv/bin/python` 小腳本實際建立 1 張測試圖片，上傳到 `/api/images/import`，再 GET `/api/sessions/{session_id}/assets/{asset_id}/image`，確認：

- HTTP 200
- 回傳可讀 WebP
- session file 存在
- session.json project metadata 有同步更新

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-3-result.md`

至少包含：

1. 完成項目，對應 Phase 3 task。
2. TDD RED/GREEN 證據。
3. 實際修改檔案。
4. 驗證命令與結果。
5. 手動 smoke / script 結果。
6. 未完成項目 / blocker。
7. 若與計畫偏離，說明原因。

如果你遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
