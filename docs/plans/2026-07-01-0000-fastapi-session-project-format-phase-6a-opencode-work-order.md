---
id: work-order-image-pigeon-fastapi-session-project-format-phase-6a-opencode-2026-07-01
type: work-order
status: active
canonical: false
created_at: 2026-07-01T00:00:00+08:00
project: image-pigeon
phase: 6A
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-6-sliced-2026-07-01
---

# Phase 6A OpenCode Work Order：後端 `.ipigeon/` project roundtrip

請在 repo root 執行。只能使用 repo-relative paths；不要 commit、不要 push；不要讀取 `.env`、credentials、或 repo 外路徑。

## 目標

實作新版專案資料夾後端 roundtrip：

- `POST /api/project/save`
- `POST /api/project/open`
- `py/app/project_service.py`
- 對應 unittest

本階段只做後端 API 與測試，不做前端 UI，不改 pywebview `select_path`。

## 現有上下文

請先讀：

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` Phase 6
- `docs/plans/2026-07-01-0000-fastapi-session-project-format-phase-6-sliced-plan.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5d-result.md`
- `py/app/models.py`
- `py/app/session_store.py`
- `py/app/api.py`
- `py/tests/test_session_store.py`
- `py/tests/test_image_api.py`

## API 合約

### POST `/api/project/save`

Request JSON:

```json
{
  "sessionId": "current-session-id",
  "project": { "schema": "image-pigeon.project", "version": 2 },
  "targetPath": "/absolute/path/to/My Project.ipigeon"
}
```

Response success:

```json
{
  "status": 200,
  "message": "儲存成功",
  "data": {
    "path": "/absolute/path/to/My Project.ipigeon",
    "project": { ... }
  }
}
```

Behavior:

- Validate `ProjectV2` with Pydantic.
- Create target folder if missing.
- Create/overwrite `project.json`.
- Create/overwrite `images/` content for assets referenced by project.
- Copy each asset file from current session temp (`web_cache/temp/sessions/<sessionId>/images/<assetId>.webp`) to target project folder according to `asset.file` (normally `images/<assetId>.webp`).
- Do not persist Word/SaveImages output options.
- Reject missing session/image files with HTTP error; do not silently produce partial projects.
- Reject unsafe asset file paths that escape project folder.

### POST `/api/project/open`

Request JSON:

```json
{
  "projectPath": "/absolute/path/to/My Project.ipigeon"
}
```

Response success:

```json
{
  "status": 200,
  "message": "開啟成功",
  "data": {
    "sessionId": "new-session-id",
    "project": { ... }
  }
}
```

Behavior:

- Read `<projectPath>/project.json`.
- Validate `ProjectV2`.
- Validate every asset file path is safe and exists under `<projectPath>`.
- Create a new session.
- Copy project image files into the new session temp folder as `<assetId>.webp`.
- Preserve `project.json` data including `document`, `assets`, `items`, `layouts`, `remark`, `rotation`, `crop`, `layout.itemOrder`.
- Write session.json for the new session.

## Required tests（TDD）

新增：

- `py/tests/test_project_service.py`
- `py/tests/test_project_api.py`

請先寫 failing tests，再實作。

Minimum service tests:

1. `save_project_folder_writes_project_json_and_images`
   - 建立 temp session + dummy webp image。
   - 建立含 asset/item/layout 的 ProjectV2。
   - 呼叫 service save。
   - Assert target folder has `project.json` and `images/<asset>.webp`。
   - Assert `project.json` 不含 Word/export options。

2. `open_project_folder_creates_new_session_and_preserves_metadata`
   - 建立 project folder with `project.json` + image。
   - 呼叫 service open。
   - Assert new session id exists and differs if applicable。
   - Assert session image copied。
   - Assert remark/rotation/crop/itemOrder preserved。

3. `rejects_asset_file_that_escapes_project_folder`
   - asset.file 如 `../evil.webp` 或 absolute path。
   - Assert save/open raises clear error。

4. `open_missing_project_json_fails`
   - Assert error。

Minimum API tests:

1. `test_save_project_endpoint_roundtrip`
   - Use `TestClient(create_app(session_base_dir=tempdir))`。
   - 建立 session + image fixture（可直接用 session_store + write_session）。
   - POST `/api/project/save`。
   - Assert response 200 and files exist。

2. `test_open_project_endpoint_returns_new_session_and_project`
   - Create project folder fixture。
   - POST `/api/project/open`。
   - Assert response 200, `data.sessionId`, project metadata, image endpoint `GET /api/sessions/{sessionId}/assets/{assetId}/image` returns webp。

3. error cases: missing project json / unsafe asset path return non-200 JSON with meaningful message.

## Implementation hints

- Prefer custom exceptions in `project_service.py`, translated to `HTTPException` in `api.py`.
- Reuse `create_session`, `get_image_path`, `read_session`, `write_session` from `session_store.py`.
- Use `ProjectV2.model_validate(...)` and `model_dump(by_alias=True)`.
- Use `Path.resolve()` containment checks. Do not trust `asset.file`.
- If target folder exists, overwrite `project.json`; ensure `images/` reflects project assets. Simpler acceptable approach: recreate/clear only target `images/` folder before copying.
- Keep API response wrapper shape consistent with existing endpoints: `{status, message, data}`.

## Out of scope

- Frontend UI.
- pywebview path dialog mode.
- Legacy JSON import.
- Word export rewrite.
- Another image output API.
- DB / production / network calls.

## Verification commands

Run and record exact outcomes:

```bash
python -m unittest discover -s py/tests -p 'test_project_service.py' -v
python -m unittest discover -s py/tests -p 'test_project_api.py' -v
python -m unittest discover -s py/tests -v
python -m compileall py
```

## Required result report

Create `docs/result/2026-07-01-0000-fastapi-session-project-format-phase-6a-result.md` with:

- frontmatter: `type: result`, `status: completed|partial|blocked`, `canonical: true`, `phase: 6A`
- completed items mapped to AC above
- changed files
- verification commands + exact outcomes
- blockers/deferred items

If blocked, still create the result report with `status: blocked` or `partial` and stop.
