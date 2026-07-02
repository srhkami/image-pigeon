---
id: work-order-image-pigeon-fastapi-session-project-format-phase-2-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 2
executor: opencode
---

# OpenCode Work Order：Phase 2 session store 與 Project v2 model

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path，不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` 的 Phase 2（約 lines 643-672）
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-0-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-1-result.md`
- 現有檔案：`py/app/api.py`、`py/main.py`、`py/tests/test_api.py`、`pyproject.toml`

## 任務範圍

執行正式計畫 Phase 2：建立 filesystem session 和 Project v2 model。

必須建立 / 更新：

1. `py/app/models.py`
   - API response model
   - ProjectV2
   - Asset
   - Item
   - Crop
   - WordCompatibleGridLayout
   - schema/version defaults 需符合正式計畫：
     - schema = `image-pigeon.project`
     - version = `2`
     - default crop：`x=0,y=0,width=1,height=1,unit="ratio"`
     - layout type 第一階段只允許/預設 `word-compatible-grid`

2. `py/app/session_store.py`
   - create_session()
   - get_session_dir()
   - get_image_path()
   - write/read session.json
   - clean_expired_sessions(hours=24)
   - cleanup_current_session()
   - session path：`web_cache/temp/sessions/<session_id>/session.json`
   - image path：`web_cache/temp/sessions/<session_id>/images/<uuid>.webp`
   - session.json 中保存 project object 與 runtime metadata。

3. 測試
   - 依 TDD：先寫 failing tests，再實作。
   - 可在 `py/tests/test_models.py`、`py/tests/test_session_store.py` 增加 unittest。
   - 測試至少覆蓋：
     - ProjectV2 defaults / serialization
     - Crop defaults
     - layout itemOrder
     - create_session 建立 session dir/images dir/session.json
     - write/read session.json roundtrip
     - get_image_path path shape
     - clean_expired_sessions 只清過期 session，不清未過期 session
     - cleanup_current_session 清指定 session

## 約束

- 不使用 DB。
- 不實作 Phase 3 圖片匯入 API。
- 不重構前端。
- 不處理既有 lint errors，除非你的改動造成新的錯誤。
- 不改 `pywebview-base`。
- 盡量維持現有 Python unittest 方式，不新增 pytest 依賴。
- 若需要 Pydantic，專案已透過 FastAPI dependencies 有 Pydantic v2，請用 v2 API。

## 驗證命令

請執行並記錄：

- `.venv/bin/python -m unittest discover -s py/tests -v`
- `.venv/bin/python -m compileall -q py`
- `pnpm -s tsc -b`
- `pnpm run build`
- 可執行 `pnpm run lint`，但若仍是 Phase 0/1 已記錄既有 lint failures，請明確標註非本 Phase 新增。

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-2-result.md`

至少包含：

1. 完成項目，對應 Phase 2 task。
2. TDD RED/GREEN 證據。
3. 實際修改檔案。
4. 驗證命令與結果。
5. 手動 smoke / script 結果。
6. 未完成項目 / blocker。
7. 若與計畫偏離，說明原因。

如果你遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
