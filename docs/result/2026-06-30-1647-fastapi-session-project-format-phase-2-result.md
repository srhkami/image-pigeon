---
id: result-image-pigeon-fastapi-session-project-format-phase-2-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 2
---

# Phase 2：session store 與 Project v2 model 執行結果

## 完成項目

- 建立 `py/app/models.py`，包含：`APIResponse`、`ProjectV2`、`Asset`、`Item`、`Crop`、`WordCompatibleGridLayout`。
- `ProjectV2` 遵循 Phase 2 約定：
  - `schema` 預設為 `image-pigeon.project`
  - `version` 預設為 `2`
  - `Crop` 預設 `x=0,y=0,width=1,height=1,unit="ratio"`
  - `WordCompatibleGridLayout` 預設 `type="word-compatible-grid"`
- 建立 `py/app/session_store.py` 並實作：
  - `create_session()`
  - `get_session_dir()`
  - `get_image_path()`
  - `write_session()` / `read_session()`（含 project + runtime metadata）
  - `clean_expired_sessions(hours=24)`
  - `cleanup_current_session()`
- 新增 unittest：
  - `py/tests/test_models.py`
  - `py/tests/test_session_store.py`

## TDD RED / GREEN 證據

- RED 階段：先補齊測試骨幹，定義 Phase 2 所有必須覆蓋的行為（預設值、序列化、路徑、session roundtrip、過期清理、刪除 session）。
- GREEN 階段：實作完成後跑一次完整 unittest：
  - `.venv/bin/python -m unittest discover -s py/tests -v`
  - 結果：`Ran 11 tests in 0.019s`
  - 結果：`OK`
- Hermes 驗收補強：OpenCode 初版完整 discovery 會通過，但單獨執行 `test_models.py` 會因 `ModuleNotFoundError: No module named 'app'` 失敗；Hermes 已在 `py/tests/test_models.py` 與 `py/tests/test_session_store.py` 補上各自的 `py/` import path，並重跑單檔與完整測試通過。

## 實際修改檔案

- `py/app/models.py`
- `py/app/session_store.py`
- `py/tests/test_models.py`
- `py/tests/test_session_store.py`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-2-opencode-work-order.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-2-result.md`

## 驗證命令與結果

- `.venv/bin/python -m unittest discover -s py/tests -v`
  - 結果：通過，11 tests OK。
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_models.py' -v`
  - 結果：通過，4 tests OK。
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_session_store.py' -v`
  - 結果：通過，5 tests OK。
- `.venv/bin/python -m compileall -q py`
  - 結果：通過。
- `pnpm -s tsc -b`
  - 結果：通過。
- `pnpm run build`
  - 結果：通過，產生 production build。
- `pnpm run lint`
  - 結果：失敗（非本 phase 新增）：`3 errors, 3 warnings`，既有 `no-explicit-any` 問題仍在 `src/layout/Test.tsx`、`src/utils/handleError.ts`、`src/utils/handleToast.ts`。

## 手動 smoke / script 結果

- 以 `.venv/bin/python` 跑短腳本建立 session、讀回 session、計算 image path、執行清理：
  - `session_dir_exists`：`True`
  - `session_schema`：`image-pigeon.project`
  - `expired_cleaned`：會輸出被清理的 session_id 清單（實測可清掉過期資料）

## 未完成項目 / blocker

- 無。

## 與計畫偏離

- 無偏離。
