---
type: plan
id: plan-image-pigeon-diagnostic-logging-2026-08-04
status: partial
canonical: true
scope: image-pigeon
created_at: 2026-08-04
execution:
  status: completed
  current_checkpoint: closed_with_verification_gaps
result: docs/result/2026-08-04-diagnostic-logging-result.md
review:
  type: plan_sanity
  status: passed
  completed_at: 2026-08-04
approval_gates:
  source_write: approved
  automated_test: approved
  offline_smoke: approved
  frontend_bridge: approved
  pywebview_uat: approved
  packaged_app_uat: approved
  commit: approved
  push: closed
---

# image-pigeon 診斷記錄改善計畫

## 目標

建立安全、可輪替、可關聯的持久診斷記錄，使開發者能從單一記錄檔判斷應用程式啟動、圖片匯入、長截圖分割、session、專案開啟／儲存、檔案選擇與各類輸出的失敗階段，同時避免把圖片、Base64、備註、完整專案內容及私人路徑寫入記錄。

## 現況摘要

- `core/handle_log.py` 已建立共用 Python 記錄器，主控台輸出 `INFO` 以上並將 `DEBUG` 以上寫入目前工作目錄的 `debug.log`。
- 既有記錄主要集中於舊 pywebview 圖片／Word／JSON 輸出；新的 FastAPI、session 與專案持久化流程缺少一致的開始、結果、耗時與失敗階段記錄。
- `main.py` 關閉 Uvicorn access log，且目前沒有替代的低噪音 API 摘要或全域未處理例外記錄。
- 前端多處只使用 `console.log()`；`src/features/Upload/ReadJson.tsx` 甚至會印出可能包含 Base64 與備註的完整舊 JSON。
- `core/app/session_store.py` 解析損壞的 `session.json` 時會靜默略過，後續無法追查清理異常。

## 設計原則

1. **先記操作邊界，再記內部細節：** `INFO` 保存開始／完成摘要，`DEBUG` 保存逐項決策，`WARNING` 保存可恢復異常，`ERROR`／`EXCEPTION` 保存操作失敗及堆疊。
2. **可關聯：** 每次使用者觸發的匯入、開啟、儲存或輸出產生 `operation_id`；FastAPI 請求沿用或建立 request ID，使同一次操作的事件可搜尋。
3. **隱私預設：** 不寫入圖片／Base64／檔案內容／備註／完整 JSON／完整專案 payload。路徑與檔名預設只保留用途、副檔名、項目數或受控遮蔽值。
4. **低噪音：** 一般成功逐張事件只放 `DEBUG`；批次開始、完成及摘要才使用 `INFO`。圖片預覽 GET 不逐次記錄，只有失敗或超過慢請求門檻才記錄。
5. **階段明確：** 輸出流程區分資料準備、圖片轉換、版型建立、文件寫入、檔案儲存與作業系統開啟；不能把「檔案已儲存但開啟失敗」記成整體未產生。
6. **不新增外部記錄套件：** 第一版使用 Python 標準函式庫 `logging`、`logging.handlers.RotatingFileHandler`、`uuid`、`contextvars` 與既有 FastAPI middleware 能力。
7. **本計畫不記錄使用者內容：** 即使啟用 `DEBUG`，仍不得記錄備註、圖片內容、完整路徑或完整請求／回應 body。

## 固定欄位與注入防護契約

- 記錄事件只能由程式碼內的固定目錄產生，不接受前端或 header 自訂事件名稱。
- 共用允許欄位限於：`event`、`operation_id`、`stage`、`method`、`route`、`status`、`duration_ms`、`item_count`、`success_count`、`failure_count`、`asset_count`、`order_count`、`page_count`、`slot_count`、`segment_count`、`image_width`、`image_height`、`input_bytes`、`output_bytes`、`quality`、`min_size`、五種既有 Word template 的固定 count 欄位、`project_schema`、`project_version`、`error_type`、`detail_code`、`file_ext`、`platform`、`app_version`、`mode`。各事件再使用自己的子集合；未知欄位直接拒絕，不以字串化方式保留。
- `operation_id` 只接受程式內產生的 canonical lowercase UUID 字串（36 字元）。HTTP `X-Request-ID` 只有在完全符合 UUID 格式時才能沿用；其他值一律捨棄並重建，且不得原樣寫入記錄。
- `event`、`stage`、`route`、`detail_code` 與 `mode` 必須來自程式內 enum／固定集合，不接受任意字串。`route` 使用 FastAPI route template，不含 query string、檔名或 ID 值。
- Word template 統計不得使用任意 dict key；只允許 `landscape-2`、`portrait-large-2`、`portrait-small-6`、`mixed-landscape1-small3`、`mixed-small3-landscape1` 五個既有 template 對應的固定欄位。`project_schema` 只允許既有 `image-pigeon.project`。
- `method` 只允許既有 HTTP 方法；`status` 為 100–599；`duration_ms` 為 0–86,400,000；所有 count、尺寸與 byte 欄位為 0–1,000,000,000 的整數；`quality` 為 1–100；`min_size` 為 1–100,000；`project_version` 為 1–10,000。
- `error_type` 只取例外類別名稱，格式為 `[A-Za-z][A-Za-z0-9_.]{0,63}`；不得直接使用 `str(exception)` 作為欄位。
- `file_ext` 只允許小寫副檔名格式 `.[a-z0-9]{1,15}`；不保留 basename。
- `platform`、`app_version` 只能由本機程式資訊取得，最長 32 字元並限制為英數、點、底線與連字號。
- formatter 在整行輸出前統一處理 `\r`、`\n`、`\t` 與 ASCII control characters，轉為可見跳脫字面值，確保每個事件只佔一行；每行最多 4096 字元，超出以固定 `…[truncated]` 結尾。
- 路徑統一輸出 `<user-path>`，檔名輸出 `<file:.ext>`，data URL／Base64 輸出 `<binary:redacted>`，其他被拒絕值輸出 `<redacted>`；測試以固定 sentinel 驗證原值不存在且遮蔽格式穩定。
- 例外堆疊只保留應用程式 stack frame、例外類別與經全行 sanitizer 處理後的安全摘要；不直接傾印外部 request、Pillow 物件、完整路徑或任意例外 message。若無法證明摘要安全，只記 `error_type` 與固定 `detail_code`。

## 記錄格式與保留策略

- 記錄檔採純文字單行 key-value 格式，保留時間、等級、模組、行號、事件名稱、`operation_id`、階段、耗時與必要統計。
- 檔案上限預設 2 MiB、保留 3 份備份；總上限約 8 MiB。數值應集中為常數並可測試，不先加入使用者設定介面。
- 記錄位置由單一 helper 決定：
  - Windows：`LOCALAPPDATA/image-pigeon/logs/debug.log`，缺少環境值時退回使用者目錄下的安全位置。
  - macOS：`~/Library/Logs/image-pigeon/debug.log`。
  - Linux：優先 `XDG_STATE_HOME/image-pigeon/logs/debug.log`，否則 `~/.local/state/image-pigeon/logs/debug.log`。
  - 測試可注入暫存目錄，禁止污染真實使用者記錄。
- 記錄器初始化必須具冪等性；重複 import 或測試重建不得重複加入 handler。
- 若持久記錄檔無法建立，主控台記錄仍可用，且只輸出一次不含私人路徑的 warning；不能因記錄器失敗阻止應用程式啟動。

## 事件目錄

### `INFO`

- `app.starting`、`app.ready`、`app.shutdown`
- `image_import.started`、`image_import.completed`
- `long_screen_import.started`、`long_screen_import.completed`
- `session.created`、`session.reused`、`session.cleanup_completed`
- `project.save_started`、`project.save_completed`
- `project.open_started`、`project.open_completed`
- `output.word_started`、`output.word_completed`
- `output.images_started`、`output.images_completed`
- `output.json_started`、`output.json_completed`
- `file_dialog.opened`、`file_dialog.cancelled`、`file_dialog.selected`

### `WARNING`

- 指定 session 不存在而建立新 session。
- 單一圖片不可辨識但批次仍有成功項目。
- session metadata 損壞、清理略過。
- 舊專案需要 migration 或存在孤立 item／asset。
- 進度 UI 更新失敗但主要操作可繼續。
- 檔案已儲存，但作業系統開啟檔案失敗。
- API 4xx、慢請求與回應格式異常。

### `ERROR`／`EXCEPTION`

- 應用程式或 FastAPI 啟動失敗。
- 整批圖片／長截圖匯入失敗。
- session、專案或輸出檔案讀寫失敗。
- Word／圖片／JSON 輸出未完成。
- API 5xx 與未處理例外。
- 檔案選擇視窗本身拋出例外。

### `DEBUG`

- 圖片處理前後尺寸、位元組數及壓縮參數。
- 長截圖分割數與各段尺寸。
- Word 頁面 template 統計、slot 數、缺圖 slot 與頁面索引。
- 單張轉換進度。
- 排序、旋轉、排版偏好與刪除等操作摘要，僅在後續啟用前端診斷 bridge 時記錄 ID 與前後狀態；永不記錄備註文字。

## 核准範圍

### 預計建立

- `core/tests/test_handle_log.py`
- `core/tests/test_diagnostic_logging.py`
- `core/tests/test_output_logging.py`
- `tests/diagnosticLogging.test.ts`（只有前端 bridge gate 獲准才建立）
- `src/services/diagnosticLog.ts`（只有前端 bridge gate 獲准才建立）
- `docs/result/2026-08-04-diagnostic-logging-result.md`（執行後）

### 預計修改

- `core/handle_log.py`
- `main.py`
- `core/app/api.py`
- `core/app/image_service.py`
- `core/app/session_store.py`
- `core/app/project_service.py`
- `core/save_docx.py`
- `core/save_images.py`
- `core/tests/test_api.py`
- `core/tests/test_image_api.py`
- `core/tests/test_long_screen_api.py`
- `core/tests/test_project_api.py`
- `core/tests/test_project_service.py`
- `core/tests/test_session_store.py`
- `src/features/Upload/ReadJson.tsx`
- `src/globak.d.ts`（只有前端 bridge gate 獲准才修改）
- `src/services/apiClient.ts`（只有前端 bridge gate 獲准才修改）
- `src/utils/handleError.ts`（只有前端 bridge gate 獲准才修改）
- 本 plan、同 scope result 與 `STATE.md`

實作前須重新確認 symbol 與 usages；若實際定義已移動，先校正 plan，禁止照舊路徑猜測。

## 明確不在範圍

- 遠端記錄收集、雲端錯誤追蹤或 telemetry。
- 新增 Sentry、OpenTelemetry、資料庫或外部服務。
- 使用者行為分析、使用量統計或產品分析。
- 將備註、圖片、Base64、完整 JSON、完整專案 payload 或完整私人路徑寫入記錄。
- 在一般 `INFO` 層級記錄每次拖曳、焦點切換、旋轉或按鍵。
- 提供 UI 記錄檢視器、上傳按鈕或自動回傳記錄。
- 修改圖片、專案或文件輸出的既有業務行為。
- commit、push、發布與正式環境操作。

## 執行計畫

### C0：基線與隱私契約

1. 重新確認 dirty worktree、適用 STATE、plan 及核准 gate。
2. 盤點所有 `log()`、`console.*`、例外捕捉與輸出入口，形成限定清單，不順手重構無關程式。
3. 先為敏感內容遮蔽建立失敗測試：Base64、備註、完整 JSON、完整路徑及請求 body 不得出現在記錄。
4. 為事件名稱、層級與欄位建立固定測試契約。
5. 若發現現有記錄已包含使用者內容，先標示為需修正項，禁止把內容複製到 result。

**完成條件：** 隱私與事件契約測試呈現預期 RED，且沒有執行任何 runtime／外部 side effect。

### C1：記錄器基礎設施

1. 在 `core/tests/test_handle_log.py` 先覆蓋：跨平台路徑、測試注入、輪替參數、UTF-8、冪等 handler、檔案建立失敗降級及遮蔽 helper。
2. 執行聚焦測試，確認缺少新行為而失敗。
3. 重構 `core/handle_log.py`：
   - 將初始化與 `log()` 取得 logger 分離。
   - 使用 `RotatingFileHandler`。
   - 提供操作識別碼建立／綁定／清除 helper。
   - 提供受控欄位與遮蔽 helper，拒絕自由傾印物件。
   - 保留既有 `log().info/debug/error/exception` 呼叫相容性。
4. 執行聚焦測試並驗證記錄檔真的寫入暫存目錄、輪替可觸發、重複初始化不重複輸出。

**完成條件：** 記錄器聚焦測試通過；既有呼叫不需一次全面改寫；無新增套件。

### C2：FastAPI、session 與圖片匯入

1. 在 `core/tests/test_diagnostic_logging.py` 及既有 API／session 測試先加入 RED 契約。
2. 在 `core/app/api.py` 加入低噪音 middleware：
   - POST、非 2xx 與慢請求才寫摘要。
   - 圖片預覽 GET 成功不逐次寫入。
   - 產生或沿用 request／operation ID。
   - 5xx 保留堆疊，4xx 不記為未處理例外。
   - 慢請求門檻固定為 `SLOW_REQUEST_MS = 1000`，由 middleware 進入至 `call_next()` 回傳 response 的 monotonic elapsed time 計算；第一版不宣稱涵蓋 streaming body 完整傳輸時間。
   - middleware 捕捉未處理 `Exception` 時，以 `api.unhandled_exception`、固定 route template、method、duration、`error_type` 與 operation ID 記錄一次後重新拋出，保留 FastAPI 原有 HTTP 行為；已轉為 HTTP response 的 5xx 只記一次 `api.response_failed`，不偽造 stack trace。
3. 在圖片與長截圖匯入入口記錄批次開始、session 建立／重用、成功／失敗數、參數、耗時與失敗階段。
4. 在 `core/app/session_store.py` 記錄建立、寫入、讀取及過期清理摘要；損壞 metadata 的略過改為 `WARNING`。
5. 驗證記錄不包含 multipart 內容、檔案 bytes、完整檔名、備註、完整 session JSON 或請求 body。

**完成條件：** 圖片、長截圖、session 聚焦測試與相關既有測試通過；API 成功 GET 不產生高噪音記錄。

### C3：專案開啟／儲存

1. 先為專案儲存／開啟的開始、完成、失敗階段、統計與 migration 摘要建立 RED 測試。
2. 在 API 邊界建立 `operation_id`，在 `project_service.py` 記錄：schema、版本、asset／item／order 數量、複製數量及耗時。
3. 將 session 不存在、來源資產遺失、unsafe path、資料驗證錯誤、目標權限與寫檔失敗分成可搜尋的 `stage`／`error_type`。
4. 路徑僅記錄經遮蔽值或副檔名；不得記錄備註與完整 `project.json`。
5. 加入舊資料 migration 與孤立 item／asset 統計；只有異常數量才使用 `WARNING`。

**完成條件：** 專案 roundtrip 與錯誤測試通過；記錄可區分開啟、複製、驗證與寫入階段。

### C4：pywebview 檔案視窗與輸出

1. 先擴充 `core/tests/test_api.py`、`core/tests/test_save_docx_collage.py`，並建立 `core/tests/test_output_logging.py`，明確覆蓋檔案視窗、Word、圖片、legacy JSON、儲存成功、儲存失敗及 OS 開啟失敗。
2. `main.py` 啟動記錄應包含版本、模式、平台、FastAPI readiness 與前端來源；不得記錄環境變數內容。
3. `select_path()` 記錄 mode、預設目錄來源類別、取消、選擇及真正例外；取消使用 `INFO`。
4. Word、圖片、JSON 輸出改為一個操作一個 `operation_id`，記錄開始、完成、耗時與失敗 stage。
5. Word 記錄頁數、template histogram、slot／缺圖 slot 數量；逐張成功降為 `DEBUG`。
6. 將檔案儲存與作業系統開啟結果分開記錄。明確回應契約為：若檔案尚未儲存就失敗，維持非 200；若檔案已成功儲存但 OS 開啟失敗，記錄 `WARNING` 並回傳 status 200 與固定、不含路徑的 warning message。
   - Word：在 `main.Api.save_docx()` 將 `doc.save()` 與 `open_file()` 拆成兩個明確階段；先確認 `doc.save()` 成功，再以獨立 `try` 執行 `open_file()`。測試分別 mock 寫檔失敗、寫檔成功＋開啟成功、寫檔成功＋開啟失敗，最後一種必須是 status 200 warning。
   - 圖片：`save_images.save()` 把 `open_folder()` 從實際逐張寫檔階段分離，使 `main.Api.save_images()` 能套用相同三分支契約。
   - legacy JSON：現況 `main.Api.save_json()` 寫檔成功後直接回傳，沒有呼叫 `open_file()`。C4 將新增「寫檔成功後的獨立 `open_file()` 階段」，並以測試分別覆蓋寫檔失敗、寫檔成功＋開啟成功、寫檔成功＋開啟失敗；最後一種必須是 status 200 固定 warning。
   - 不得改變 Word／圖片／JSON 的實際檔案內容、命名與成功儲存路徑。
7. 移除 `ReadJson.tsx` 對完整舊 JSON 的 `console.log()`，以不含內容的摘要或不記錄取代。

**完成條件：** pywebview API 與輸出聚焦測試通過；記錄不含 payload；取消不是 ERROR；已儲存／開啟失敗可區分。

### C5：前端診斷 bridge（獨立核准閘門）

此 checkpoint 不由一般 source-write 自動開啟。原因是它新增前端到 Python 的診斷資料通道，需要獨立確認資料契約。

若核准：

1. 建立 `src/services/diagnosticLog.ts`，定義固定且最小的前端事件 schema，只允許程式碼定義的事件名稱、route template、HTTP status、錯誤類別、耗時及 operation ID。
2. 前端一律不得傳送 `Error.message`、stack、response body、自由文字、任意物件、檔案、路徑、備註或專案內容。前端錯誤只能以固定 enum 的 `error_type`（例如 `network_error`、`non_json_response`、`http_error`、`invalid_response`）與固定 `detail_code` 表達；不提供任何自由文字訊息欄位。
3. Python 接收端固定為 `main.Api.record_frontend_diagnostic(payload)`，不得新增一般 HTTP telemetry endpoint。方法先在 `core/handle_log.py` 的 validator 驗證事件 enum、欄位白名單、型別、長度、operation ID 與控制字元；未知／超界欄位不寫入記錄，也不拋出到主要功能。
   - 成功固定回傳 `Response(status=200, message='診斷事件已接受').to_dict()`，即 `{status: 200, message: '診斷事件已接受', data: null}`。
   - 拒絕固定回傳 `Response(status=400, message='診斷事件已拒絕').to_dict()`，即 `{status: 400, message: '診斷事件已拒絕', data: null}`。
   - 回應不得反射 payload、欄位名稱、驗證原因或任何輸入值。
4. 資料流固定為 `requestJson()`／`checkStatus()` → `diagnosticLog.ts` → `window.pywebview?.api.record_frontend_diagnostic()` → `main.Api` validator → Python 持久記錄。`src/globak.d.ts` 只增加此固定方法型別。
5. `requestJson()` 只回報網路失敗、非 JSON、非 2xx 與格式錯誤；成功請求不回報。route 由呼叫端的程式碼定義 template 傳入，不從完整 URL 或 query 反推。
6. `checkStatus()` 不再以零散 `console.log()` 作唯一證據。
7. bridge 不存在、回傳 400、回傳格式錯誤或呼叫失敗時必須靜默降級，不影響主要功能；前端不得呼叫 `checkStatus()` 處理此 bridge 回應，也不可因 bridge 的拒絕／例外再觸發診斷。
8. C5 額外允許修改路徑明定為 `main.py`、`core/handle_log.py`、`core/tests/test_api.py`、`src/globak.d.ts`、`src/services/diagnosticLog.ts`、`src/services/apiClient.ts`、`src/utils/handleError.ts` 與 `tests/diagnosticLogging.test.ts`；不得碰觸其他 UI 或新增 HTTP endpoint。
9. 以 Python 與 Node 測試驗證 schema、固定 200／400 回應、不反射輸入、拒絕未知欄位、控制字元、無效 operation ID、失敗降級、不遞迴，以及 payload 不含 `message`、`stack`、body 或其他自由文字欄位。

若未核准：保留 backend／pywebview 記錄範圍，將 frontend-only 網路失敗列為驗證缺口，不建立一般 telemetry endpoint。

### C6A：無額外 runtime side effect 的來源驗證

1. 只執行不載入應用程式、不產生 build／cache／輸出檔的 Git 與文件檢查：`git diff --check`、`git diff --name-only`、`git diff --cached --name-only`、frontmatter／路徑存在性與 allowlist 文字契約檢查。
2. 不執行 Python／Node、lint、build、compile、測試、server、request、圖片處理或輸出流程；這些都歸入 `automated_test` 或 `offline_smoke`。
3. 不把 C6A 的文件／diff 證據擴張成語法、build、runtime 或輸出流程 PASS。

**完成條件：** 文件、路徑、scope、staged guard 與 diff hygiene 通過；仍等待 `automated_test`／`offline_smoke` 時保持 execution partial。

### C6B：自動測試（獨立 `automated_test` 閘門）

1. 只使用 temporary directory 與程式內 fixture，執行所有聚焦 Python 測試。
2. 執行完整 Python suite；既有失敗必須與本工作線分開記錄，不得宣稱未執行範圍通過。
3. 執行 `pnpm run test:frontend`、`pnpm run lint`、`pnpm run build` 與 `uv run python -m compileall main.py core`；這些命令會執行專案工具並可能產生 `dist`／`__pycache__`，只在此 gate 開啟後執行。
4. 驗證測試沒有寫入真實作業系統記錄目錄、沒有開啟 GUI／檔案，也沒有讀取私人檔案；測試與 compile/build 產物須列入 scoped status 查核。

**完成條件：** 聚焦與完整 suite 結果有新鮮證據；任何 skip／既有失敗如實列出。

### C6C：離線 smoke（獨立 `offline_smoke` 閘門）

1. 以暫存記錄目錄執行離線 smoke：啟動測試用 FastAPI app、發送 TestClient request、匯入 fixture 圖片、專案 roundtrip、Word fixture 輸出；禁止使用私人檔案，不啟動 pywebview GUI。
2. 檢查產生記錄：事件可關聯、錯誤階段明確、輪替可用，且全文搜尋不含 fixture 中刻意放入的 Base64、備註、完整路徑、控制字元與 payload sentinel。
3. 派發獨立聚焦複審，檢查：隱私、記錄層級、handler 冪等性、錯誤語意、噪音、測試證據與 scope。
4. 建立同 scope result，校正 plan lifecycle，最後更新或移除 STATE workstream。

**完成條件：** source、自動測試與離線 smoke 通過、獨立複審 PASS；pywebview／打包版實機驗收若未核准，必須明確標示未執行。

## 驗證命令

實作時依 checkpoint 逐步執行，最終至少包含：

```bash
uv run python -m unittest \
  core.tests.test_handle_log \
  core.tests.test_diagnostic_logging \
  core.tests.test_output_logging \
  core.tests.test_api \
  core.tests.test_image_api \
  core.tests.test_long_screen_api \
  core.tests.test_project_api \
  core.tests.test_project_service \
  core.tests.test_session_store \
  core.tests.test_save_docx_collage

uv run python -m unittest discover -s core/tests -p 'test_*.py'
pnpm run test:frontend
pnpm run lint
pnpm run build
uv run python -m compileall main.py core
git diff --check
git status --short
```

測試中不得寫入真實作業系統記錄目錄；必須注入 temporary directory。

## 驗收條件

- 記錄器使用可輪替檔案，位置穩定、UTF-8、初始化冪等，失敗時不阻止應用程式啟動。
- 啟動、匯入、長截圖、session、專案開啟／儲存、檔案視窗與輸出皆有可搜尋的開始、完成、耗時與失敗階段。
- 同一操作的後端事件可由 `operation_id` 關聯。
- API 成功圖片預覽 GET 不造成大量 INFO 記錄；逐張成功事件只在 DEBUG。
- 使用者取消檔案視窗不記為 ERROR。
- 能區分檔案未儲存與檔案已儲存但開啟失敗。
- `debug.log` 不包含圖片／Base64、備註、完整舊 JSON、完整專案 payload、請求 body 或完整私人路徑。
- session metadata 損壞不再靜默略過。
- 完整前後端驗證與 `git diff --check` 通過；任何既有失敗、未執行 pywebview／打包版 UAT 都被如實標示。
- 不新增遠端 telemetry、付費服務、資料庫、部署、commit 或 push side effect。

## 風險與防護

- **記錄造成資料外洩：** 以集中遮蔽 helper、固定事件 schema、sentinel 測試與禁止自由物件傾印防護。
- **記錄過多拖慢圖片處理：** INFO 只記批次摘要；逐張資訊降為 DEBUG；不記 bytes／Base64。
- **記錄器失敗拖垮應用程式：** File handler 建立失敗時降級至 stderr，初始化不可向上拋出。
- **handler 重複導致訊息倍增：** 使用自有 handler 標記與冪等測試。
- **operation ID 在執行緒／請求間串線：** FastAPI 使用 context-local 狀態；pywebview 每個公開操作自行建立並在 finally 清除。
- **把正常取消誤判為錯誤：** 以事件與層級測試固定取消語意。
- **順手改變輸出行為：** C4 在 `source_write` 獲准後，唯一允許的回應語意變更就是本計畫明定的「檔案已儲存但 OS 開啟失敗時回傳 status 200 固定 warning」，並新增 legacy JSON 儲存成功後的獨立開啟階段；其他輸出行為、檔案內容、命名或回應語意變更都必須先更新計畫並重新取得核准。

## 核准閘門

- `source_write`：已於 2026-08-04 核准。
- `automated_test`：已於 2026-08-04 核准。
- `offline_smoke`：已於 2026-08-04 核准。
- `frontend_bridge`：已於 2026-08-04 核准。
- `pywebview_uat`：已於 2026-08-04 核准。
- `packaged_app_uat`：已於 2026-08-04 核准；僅能在可用的目標環境據實驗收。
- `commit`：已由使用者於 2026-08-04 明確核准；`push` 維持關閉。

## 下一步

已完成 C0–C5 與 macOS 打包版啟動驗收；完整 Python／前端 suite 各有一項既有或平行工作線失敗，詳見同 scope result。Windows 實機驗收留待目標環境。
