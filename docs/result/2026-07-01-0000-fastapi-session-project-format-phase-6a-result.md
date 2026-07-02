---
id: result-image-pigeon-fastapi-session-project-format-phase-6a-2026-07-01
type: result
status: completed
canonical: true
created_at: 2026-07-01T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-6-sliced-2026-07-01
phase: 6A
---

# Phase 6A：後端 `.ipigeon/` project roundtrip

## 完成項目

- 新增 `py/app/project_service.py`
  - `save_project_folder(session_id, project, target_path, session_base_dir)`：
    - 驗證 `ProjectV2`。
    - 檢查 session 來源圖檔存在。
    - 安全驗證 `asset.file`，拒絕 `..` 或絕對路徑。
    - 建立/清空 `target/images`，複製 `images/<uuid>.webp`。
    - 寫入 `project.json`。
  - `open_project_folder(project_path, session_base_dir)`：
    - 讀取與驗證 `project.json`。
    - 驗證每個 `asset.file` 安全且存在於 project folder。
    - 建立新 session，將專案圖片複製到 session temp `images/<assetId>.webp`。
    - 回傳新 `sessionId` + `ProjectV2`。
  - 自定義錯誤：`ProjectServiceError / ProjectNotFoundError / ProjectAssetError`。
- 更新 `py/app/api.py`
  - 新增 `POST /api/project/save`。
  - 新增 `POST /api/project/open`。
  - 使用 Pydantic request model：`ProjectSaveRequest` / `ProjectOpenRequest`。
  - 成功回傳一致 wrapper：`{status, message, data}`。
  - 失敗以 `ProjectServiceError` 產生 wrapper：`{status, message, data:{}}`。
- 新增後端單元測試：
  - `py/tests/test_project_service.py`
    - `test_save_project_folder_writes_project_json_and_images`
    - `test_open_project_folder_creates_new_session_and_preserves_metadata`
    - `test_rejects_asset_file_that_escapes_project_folder`
    - `test_open_missing_project_json_fails`
  - `py/tests/test_project_api.py`
    - `test_save_project_endpoint_roundtrip`
    - `test_open_project_endpoint_returns_new_session_and_project`
    - `test_open_missing_or_unsafe_project_returns_error`
- 對應 AC 要求
  - `save` 會建立 `.ipigeon/` 內 `project.json + images/<uuid>.webp`。
  - `open` 會驗證路徑、驗證 `ProjectV2`、建立新 session 並複製 temp。
  - `remark / rotation / crop / layout.itemOrder` 在 roundtrip 中保留。
  - 違規 asset 路徑與缺少 `project.json` 皆會回報非 200。

## 變更檔案

- `py/app/project_service.py`（新增）
- `py/app/api.py`
- `py/tests/test_project_service.py`（新增）
- `py/tests/test_project_api.py`（新增）

## 驗證命令

- `python -m unittest discover -s py/tests -p 'test_project_service.py' -v`
  - 環境若直接用 `python` 會找不到安裝。
  - 使用 `uv run` 執行：`uv run python -m unittest discover -s py/tests -p 'test_project_service.py' -v`
  - 結果：4/4 通過。
- `python -m unittest discover -s py/tests -p 'test_project_api.py' -v`
  - 使用 `uv run` 執行：`uv run python -m unittest discover -s py/tests -p 'test_project_api.py' -v`
  - 結果：3/3 通過。
- `python -m unittest discover -s py/tests -v`
  - 使用 `uv run` 執行：`uv run python -m unittest discover -s py/tests -v`
  - 結果：30/30 通過。
- `python -m compileall py`
  - 使用 `uv run` 執行：`uv run python -m compileall py`
  - 結果：編譯完成，`py` 與 `py/app`, `py/tests` 均列印掃描成功。

## Blockers / Deferred

- 無。

## Hermes 驗收補充

- Hermes 端重讀 `project_service.py` 後發現：OpenCode 版本會在 save 流程完整驗證 `asset.file` 前建立/清空 target `images/`，若傳入不安全 asset path，可能對既有 target folder 造成不必要副作用。
- Hermes 已修正為先透過 `_ensure_save_asset_files()` 一次驗證來源 session image 與目標 asset path 安全性，全部通過後才建立/清空 target folder 並寫入。
- Hermes 端重跑：`uv run python -m unittest discover -s py/tests -p 'test_project_service.py' -v`：4/4 通過。
- Hermes 端重跑：`uv run python -m unittest discover -s py/tests -p 'test_project_api.py' -v`：3/3 通過。
- Hermes 端重跑：`uv run python -m unittest discover -s py/tests -v`：30/30 通過。
- Hermes 端重跑：`uv run python -m compileall py`：完成無錯誤。
- Hermes 已清理 compileall 產生的 `__pycache__`。
