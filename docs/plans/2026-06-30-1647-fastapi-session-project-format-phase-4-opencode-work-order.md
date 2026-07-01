---
id: work-order-image-pigeon-fastapi-session-project-format-phase-4-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
phase: 4
executor: opencode
---

# OpenCode Work Order：Phase 4 長截圖匯入 API（後端切片）

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path，不要自行組合或讀取任何 `/Users/...` absolute path，不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format.md` 的 Phase 4（約 lines 698-715）
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-3-result.md`
- 現有檔案：
  - `py/crop_image.py`
  - `py/app/api.py`
  - `py/app/image_service.py`
  - `py/app/models.py`
  - `py/app/session_store.py`
  - `py/tests/test_image_api.py`
  - `py/tests/test_image_service.py`

## 任務範圍

執行正式計畫 Phase 4 的「後端」部分：長截圖 multipart import API，暫不改前端。

必須建立 / 更新：

1. `py/app/image_service.py`
   - 重構或新增長截圖切割 helper，不要再使用 base64。
   - 參考 `py/crop_image.py` 現有規則：
     - 當 `width / height <= 9 / 21` 才視為長截圖。
     - `segment_height = width * 2`
     - `reserve_h = segment_height * 0.03`
     - `blocks = ceil(height / segment_height)`
     - 第一段 crop `(0, 0, width, segment_height + reserve_h * 2)`；後續段落上下保留 reserve。
   - 每段切割後都應輸出 WebP 檔，不保留原長圖。
   - 每段都建立獨立 `Asset` / `Item`，append 到 project，append item id 到 default `layout_word_default.itemOrder`。
   - `Asset.width/height` 必須是實際儲存 WebP 尺寸。
   - 壞圖需清楚 error；非長截圖需可辨識為 400 類錯誤。

2. `py/app/api.py`
   - 實作 `POST /api/images/import-long-screen`
     - multipart/form-data
     - fields：
       - `session_id`: optional
       - `file`: UploadFile（單張長截圖；多檔前端分批可重複呼叫）
       - `quality`: int = 75
       - `min_size`: int = 1000
     - response body 需符合 Phase 3 import contract 風格：
       - `status: 200`
       - `message: 新增成功`
       - `data.sessionId`
       - `data.assets`
       - `data.items`
       - `data.layoutPatch.appendItemOrder`
       - 建議可包含 `segments` 數量
   - 非長截圖回 HTTP 400，message/detail 需明確。
   - 壞圖回 HTTP 400 或 422，message/detail 需明確。

3. tests
   - 依 TDD：先寫 failing tests，再實作。
   - 可新增：
     - `py/tests/test_long_screen_service.py`
     - `py/tests/test_long_screen_api.py`
   - 測試至少覆蓋：
     - service：合格長截圖切成多段，每段 WebP 可讀。
     - service：非長截圖會 raise 明確 domain error。
     - API：上傳長截圖後，response 有 sessionId/assets/items/layoutPatch.appendItemOrder，數量等於切割段數。
     - API：session.json project 的 assets/items/layout itemOrder 已更新。
     - API：每個 asset 都可用既有 GET `/api/sessions/{session_id}/assets/{asset_id}/image` 讀回 WebP。
     - API：非長截圖回 400。
     - API：不會在 session images 保留原長圖，只有切割段 WebP。
   - 每個新測試檔需自行把 repo `py/` 放進 `sys.path`，不可依賴其他 test import side effect。

## 約束

- 不使用 DB。
- 不改前端 `UploadLongScreen.tsx`；本切片只做後端 API + tests。
- 不重構舊 `py/crop_image.py`，除非必要；舊 pywebview API 暫保留。
- 不處理既有 lint errors，除非你的改動造成新的錯誤。
- 不改 `pywebview-base`。
- 不新增 pytest；沿用 Python unittest。
- 使用 Pydantic v2 API。
- 保持 Phase 3 `POST /api/images/import` 與 GET image endpoint 行為不退化。
- 如需整理重複邏輯，允許在 `py/app/api.py` 內抽 private helper，但不要做大範圍架構重構。

## 驗證命令

請執行並記錄：

- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_service.py' -v`
- `.venv/bin/python -m unittest discover -s py/tests -p 'test_long_screen_api.py' -v`
- `.venv/bin/python -m unittest discover -s py/tests -v`
- `.venv/bin/python -m compileall -q py`
- `pnpm -s tsc -b`
- `pnpm run build`
- 可執行 `pnpm run lint`，但若仍是 Phase 0-3 已記錄既有 lint failures，請明確標註非本 Phase 新增。

## 手動 smoke / script

請用 `fastapi.testclient.TestClient` 或 `.venv/bin/python` 小腳本實際建立一張長截圖測試圖（例如 400x1800 PNG/JPEG），上傳 `/api/images/import-long-screen`，再逐一 GET 每個 asset image，確認：

- HTTP 200
- `assets/items/layoutPatch.appendItemOrder` 數量一致且大於 1
- 每個 image response 是可讀 WebP
- session.json project metadata 已同步更新
- session images 目錄只有切割段 WebP，沒有原長圖保存檔

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-4-result.md`

至少包含：

1. 完成項目，對應 Phase 4 task。
2. TDD RED/GREEN 證據。
3. 實際修改檔案。
4. 驗證命令與結果。
5. 手動 smoke / script 結果。
6. 未完成項目 / blocker。
7. 若與計畫偏離，說明原因。

如果遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
