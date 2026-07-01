---
id: plan-image-pigeon-fastapi-session-project-format-phase-6-sliced-2026-07-01
type: plan
status: active
canonical: true
created_at: 2026-07-01T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30
phase: 6
---

# Phase 6：新版專案儲存與開啟切片計畫

> For Hermes: Phase 6 採 OpenCode 分段派工，Hermes 必須逐段讀 result、查 diff、跑驗證命令後才可進下一段。

## Goal

支援 `.ipigeon/` 專案資料夾 roundtrip：儲存 `project.json` 與 `images/*.webp`，再開啟成新的 session，保留圖片、備註、排序、旋轉與 crop metadata；不保存 Word/另存圖片輸出設定。

## Architecture

- 後端 FastAPI 負責 project folder 讀寫、圖片複製、project schema validation、建立/回填 session。
- pywebview 只負責桌面路徑選擇能力：儲存 project folder 與開啟 project folder。
- 前端以 ProjectV2 state 為主，呼叫 FastAPI project API；SaveJson 保留 legacy，但新增主線「儲存專案 / 開啟專案」。

## Phase 6A：後端 project roundtrip

Scope:
- 新增 `py/app/project_service.py`。
- 新增 `POST /api/project/save`。
- 新增 `POST /api/project/open`。
- 新增/更新 unittest。

Acceptance:
- save 後 target folder 內有 `project.json` 與 `images/<uuid>.webp`。
- open 會驗證 `project.json`，建立新 session，複製 project images 到新 session temp。
- open response 回傳 `{ sessionId, project }`，且 project metadata 保留 remark / rotation / crop / layout.itemOrder。
- path traversal 或 missing asset 應回 400/404 類錯誤，不應讀寫 project folder 外的檔案。
- 不保存或新增 Word/圖片輸出設定欄位。

Verification:
- `python -m unittest discover -s py/tests -p 'test_project_service.py' -v`
- `python -m unittest discover -s py/tests -p 'test_project_api.py' -v`
- `python -m unittest discover -s py/tests -v`
- `python -m compileall py`

## Phase 6B：pywebview path + frontend save/open

Scope:
- `py/main.py` 的 `select_path` 增加 project save/open folder mode。
- 新增 frontend project API client functions。
- 替換/新增「儲存專案」UI。
- 新增「開啟專案」UI，開啟後更新 `project` / `sessionId` / legacy preview bridge。
- 保留 legacy JSON 為 legacy，不作新版主線。

Acceptance:
- 使用者能選擇儲存位置，產出 `.ipigeon/` folder。
- 使用者能選擇 `.ipigeon/` folder 開啟，圖片、備註、排序、旋轉仍存在。
- UI 不把 Word/另存圖片 options 寫入 project。

Verification:
- `pnpm -s tsc -b`
- `pnpm run build`
- `pnpm run lint`（可記錄既有 unrelated lint）
- 後端 project API unittest 仍通過。

## Delegation/report rules

每個 OpenCode work order 必須建立對應 result：

- Phase 6A result: `docs/result/2026-07-01-0000-fastapi-session-project-format-phase-6a-result.md`
- Phase 6B result: `docs/result/2026-07-01-0000-fastapi-session-project-format-phase-6b-result.md`

Result 必須包含：

1. completed items mapped to work order AC
2. changed files
3. verification commands and exact outcomes
4. blockers/deferred items

OpenCode 不得 commit/push；只允許 repo-relative path；不得讀取 `.env` 或 credentials。
