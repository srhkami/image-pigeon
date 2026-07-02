---
id: result-image-pigeon-fastapi-session-project-format-phase-3-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 3
---

# Phase 3：圖片匯入 API 執行結果

## 完成項目

- 以 OpenCode 優先執行 Phase 3 後端工作，Hermes 再獨立驗收與補修。
- 建立 `py/app/image_service.py`：
  - 用 Pillow 解碼上傳圖片 bytes。
  - 依 `quality` / `min_size` 產生 WebP。
  - 將 WebP 寫入 `web_cache/temp/sessions/<session_id>/images/<uuid>.webp`。
  - 建立 `Asset` / `Item` metadata。
  - 壞圖丟出 `ImageImportError`，由 API 統一轉成 skipped/errors。
- 更新 `py/app/api.py`：
  - 新增 `POST /api/images/import` multipart endpoint。
  - 新增 `GET /api/sessions/{session_id}/assets/{asset_id}/image` WebP image endpoint。
  - `create_app()` 新增 optional `session_base_dir` 供 tests/smoke 使用，不破壞既有 `static_dir` 用法。
  - 匯入成功後更新 session project 的 `assets`、`items` 與 default `layout_word_default.itemOrder`。
  - 全部壞圖回 HTTP 400；partial success 回 HTTP 200 並帶 `skipped` / `errors`。
- 新增 tests：
  - `py/tests/test_image_api.py`
  - `py/tests/test_image_service.py`
- 建立 Phase 3 OpenCode work order：
  - `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-3-opencode-work-order.md`

## OpenCode 執行情形與 Hermes 補強

- 第一次 OpenCode 派工誤用 malformed absolute path `/Users/ksai/...`，被 tool permission 拒絕，exit 0 但沒有產出 Phase 3 檔案；Hermes 驗證無 `image_service.py`、無 `test_image*.py`、無 phase-3 result report 後重派。
- 第二次使用 `opencode run --dir /Users/cksai/Desktop/Coding/image-pigeon` 與更嚴格 repo-relative prompt 執行。
- OpenCode 實作後最後又嘗試 malformed `/Users/Users/...` command，被拒絕；Hermes 沒有採信該 exit 0，改為自行讀檔、檢查產物與重跑驗證。
- Hermes 驗收發現 OpenCode 初版壓縮/縮圖後 `Asset.width` / `Asset.height` 仍記原尺寸，已補測試並修正為實際寫出的 WebP 尺寸。
- Hermes 補建此 result report，因 OpenCode 未成功建立 Phase 3 result report。

## TDD RED / GREEN 證據

- OpenCode 先新增 `py/tests/test_image_api.py` 與 `py/tests/test_image_service.py`，初次執行完整 unittest 出現 RED：
  - `test_import_single_image_creates_session_and_updates_project` 等 API tests 回 400。
  - service tests 出現 `TypeError: import_image_bytes_to_session() got an unexpected keyword argument 'session_id'`。
- OpenCode 修正後：
  - `test_image_api.py` 單檔 4 tests OK。
  - `test_image_service.py` 單檔 3 tests OK。
  - 全部 discovery 18 tests OK。
- Hermes 補強 RED/GREEN：新增 service test assertion，要求 resize 後 `asset.width == 1200`、`asset.height == 600`，修正 `_compact_image()` 回傳實際 WebP 尺寸後重跑通過。

## 實際修改檔案

- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-3-opencode-work-order.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-3-result.md`
- `py/app/api.py`
- `py/app/image_service.py`
- `py/tests/test_image_api.py`
- `py/tests/test_image_service.py`

## 驗證命令與結果

- `.venv/bin/python -m unittest discover -s py/tests -p 'test_image_service.py' -v`
  - 結果：通過，3 tests OK。
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_image_api.py' -v`
  - 結果：通過，4 tests OK。
- `.venv/bin/python -m unittest discover -s py/tests -v`
  - 結果：通過，18 tests OK。
- `.venv/bin/python -m compileall -q py && echo 'compileall py: ok'`
  - 結果：通過，輸出 `compileall py: ok`。
- `pnpm -s tsc -b`
  - 結果：通過，exit code 0，無輸出。
- `pnpm run build`
  - 結果：通過。
  - 輸出摘要：`✓ 322 modules transformed.`、`✓ built in 1.19s`。
  - 仍有既有 Vite chunk size warning，不阻擋 build。
- `pnpm run lint`
  - 結果：失敗，與 Phase 0/1/2 已記錄既有問題一致，非本 Phase 新增：
    - `src/layout/Test.tsx:41:33`：`@typescript-eslint/no-explicit-any`
    - `src/utils/handleError.ts:4:43`：`@typescript-eslint/no-explicit-any`
    - `src/utils/handleToast.ts:7:39`：`@typescript-eslint/no-explicit-any`
    - 另有 3 個 React Hook dependency warnings。

## 手動 smoke / script 結果

使用 `.venv/bin/python` + `fastapi.testclient.TestClient` 建立 1600x1200 JPEG，上傳到 `/api/images/import`，再讀取 `/api/sessions/{session_id}/assets/{asset_id}/image`：

- `import_status 200`
- `import_payload_status 200`
- `import_message 新增成功`
- `asset_size 1600 1200`
- `image_status 200`
- `image_content_type image/webp`
- `image_readable_webp WEBP`
- `session_file_exists True`
- `session_assets 1`
- `session_items 1`
- `session_item_order 1`

## 未完成項目 / blocker

- Phase 3 work order 刻意限定「後端」部分；前端 `UploadMultiple.tsx` 尚未改用新 API，留待後續前端 state / service 整合階段處理。
- `pnpm run lint` 仍有既有前端 lint errors/warnings。

## 與計畫偏離

- 本次先完成 Phase 3 後端 API 與測試，未實作正式計畫中 Phase 3 的前端 `src/types/project.ts`、`src/services/apiClient.ts`、`imageApi.ts` 與 `UploadMultiple.tsx` 切換；原因是使用者要求優先派 OpenCode 執行，且本 work order 明確先收斂在後端，以降低與後續 Phase 5 前端 state 重構的衝突。
