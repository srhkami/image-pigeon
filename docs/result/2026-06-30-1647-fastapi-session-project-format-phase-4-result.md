---
id: result-image-pigeon-fastapi-session-project-format-phase-4-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 4
---

# Phase 4：長截圖匯入 API（後端）結果

## 完成項目

- 在 `py/app/image_service.py` 加入長截圖切割服務 `import_long_screen_bytes_to_session`，並保留既有 `_compact_image` 流程。
- 依 `crop_image.py` 規則實作切割參數：`width/height <= 9/21`、`segment_height = width*2`、`reserve_h = segment_height*0.03`、`blocks = ceil(height/segment_height)`，且第一段保留 `reserve_h*2`，後續段落保留上下 `reserve_h`。
- 長截圖切割後每段直接輸出 `WEBP`，每段都建立獨立 `Asset` / `Item`，並回傳 tuple 列表給 API 使用。
- `py/app/image_service.py` 新增 `NotLongScreenshotError` 作為明確 domain error，壞圖走 `ImageImportError`。
- 在 `py/app/api.py` 新增 `POST /api/images/import-long-screen`（multipart form）：`session_id` optional、`file`、`quality`、`min_size`，回應沿用 `status/message/data` 風格。
- 長截圖非長條件時回傳 HTTP 400 並附 `status=400`、`message` / `detail`。
- 非長截圖 API 行為、service domain error、session 資料更新、asset 可讀取 WebP、以及不保留原長圖的條件皆補上測試。

## TDD RED / GREEN 證據

- 先新增 `py/tests/test_long_screen_service.py` 與 `py/tests/test_long_screen_api.py`。
- 初版 `test_long_screen_api.py::test_import_non_long_screen_returns_400` 因斷言訊息字串過嚴導致失敗（RED，HTTP 400 已正確，但 message 斷言不一致）。
- 修正訊息斷言後，新增長截圖兩個新測試檔全數通過（GREEN）。

## 實際修改檔案

- `py/app/image_service.py`
- `py/app/api.py`
- `py/tests/test_long_screen_service.py`
- `py/tests/test_long_screen_api.py`

## 驗證命令與結果

- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_service.py' -v`
  - 結果：通過，`2 tests OK`
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_api.py' -v`
  - 結果：通過，`3 tests OK`
- `.venv/bin/python -m unittest discover -s py/tests -v`
  - 結果：通過，`23 tests OK`
- `.venv/bin/python -m compileall -q py`
  - 結果：通過
- `pnpm -s tsc -b`
  - 結果：通過
- `pnpm run build`
  - 結果：通過，建置成功，chunk warning 仍為既有提醒
- `pnpm run lint`
  - 結果：失敗，錯誤維持既有前端檔案 `src/layout/Test.tsx`、`src/utils/handleError.ts`、`src/utils/handleToast.ts` 的 `no-explicit-any`，非本階段新增

## Hermes 獨立驗收補充

OpenCode 回報後，Hermes 沒有直接採信結果，已重新讀取 result report、`py/app/image_service.py`、`py/app/api.py`、`py/tests/test_long_screen_service.py`、`py/tests/test_long_screen_api.py`，並 fresh rerun 下列命令：

- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_service.py' -v`
  - 結果：通過，`2 tests OK`。
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_api.py' -v`
  - 結果：通過，`3 tests OK`。
- `.venv/bin/python -m unittest discover -s py/tests -v`
  - 結果：通過，`23 tests OK`。
- `.venv/bin/python -m compileall -q py && echo 'compileall py: ok'`
  - 結果：通過，輸出 `compileall py: ok`。
- `pnpm -s tsc -b`
  - 結果：通過，exit code 0，無輸出。
- `pnpm run build`
  - 結果：通過，`✓ 322 modules transformed.`、`✓ built in 1.48s`。
- `pnpm run lint`
  - 結果：失敗，仍為 Phase 0-3 已知前端 lint 問題，非 Phase 4 新增。

## 手動 smoke / script 結果

- 以 `TestClient` 上傳 `400x1800` PNG 長截圖到 `/api/images/import-long-screen`
- 驗證：
  - `response status_code = 200`
  - `status/message = 200/新增成功`
  - `data.segments = 3`、`len(data.assets)=3`、`len(data.items)=3`、`len(data.layoutPatch.appendItemOrder)=3`
  - `session.json` 中 `project.assets/items/layouts[0].itemOrder` 同步各為 `3`
  - 每張 GET `/api/sessions/{session_id}/assets/{asset_id}/image` 都是 `200` 且 `image/webp`
  - `session/images` 只剩 `3` 個 `.webp` 檔，沒有其他原始長圖檔案

Hermes 另以 `tempfile.TemporaryDirectory()` 重新 smoke，避免在 repo 內留下 `py/web_cache`：

- `status_code 200`
- `response 200 新增成功`
- `segments 3`
- `assets 3`
- `items 3`
- `appendItemOrder 3`
- `session_assets 3`
- `session_items 3`
- `session_item_order 3`
- 每張 `GET /api/sessions/{session_id}/assets/{asset_id}/image` 皆為 `200 image/webp WEBP (400, 848)`
- `image_files_count 3`
- `all_webp True`

## 未完成項目 / blocker

- 無 blocker。

## 與計畫偏離

- 無偏離；僅實作 `docs/plans/... phase 4` 後端 API 與 tests，未改前端 `UploadLongScreen.tsx`。
