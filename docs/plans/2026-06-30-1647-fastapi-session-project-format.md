---
id: plan-image-pigeon-fastapi-session-project-format-2026-06-30-1647
type: plan
status: active
canonical: true
created_at: 2026-06-30T16:47:00+08:00
updated_at: 2026-06-30T16:47:00+08:00
owner: hermes
project: image-pigeon
affected_projects:
  - image-pigeon
non_goals:
  - 不修改 pywebview-base；pywebview-base 只作參考，未來可刪除。
  - 不完全移除 pywebview。
  - 第一階段不做前端自由拖曳排版 UI。
  - 第一階段不做前端 PDF/列印輸出。
  - 第一階段不做 WebSocket、SSE、後端 job/polling 進度系統。
  - 第一階段不保存 Word 輸出設定到專案檔。
  - 不使用資料庫。
  - 不加 auth token。
related:
  planning_workspace: .planning/2026-06-30-fastapi-session-project-format
result_contract:
  directory: docs/result
  filename_stem: 2026-06-30-1647-fastapi-session-project-format
---

# image-pigeon FastAPI Session + Project Format 改版計畫

> 後續執行者：請把 `image-pigeon/` 當作主資料夾。`pywebview-base/` 只可作架構參考，不得作為正式改動目標。

## 1. 目標

將 image-pigeon 從「React 透過 pywebview js_api 直接呼叫 Python、圖片以 base64 來回傳」改為：

- FastAPI 管理圖片匯入、壓縮、session 暫存、專案儲存/開啟、Word/圖片輸出。
- React 只保存輕量 metadata，不長期保存 base64。
- pywebview 保留桌面能力，例如開視窗、選檔/選資料夾、storage_path。
- 新版專案格式使用資料夾：`<name>.ipigeon/project.json + images/*.webp`。
- 舊版 JSON 僅作匯入相容；匯入後轉成新版 session/project model。
- 為未來前端裁切、拼貼排版、列印/PDF 留出 schema 空間，但第一階段不實作這些 UI。

## 2. 現況摘要

目前 image-pigeon 的主要流程：

- `py/main.py` 建立 `Api` 類別，透過 `webview.create_window(..., js_api=api)` 暴露給前端。
- 前端使用 `window.pywebview.api.upload_image()`、`crop_image()`、`save_docx()`、`save_images()`、`save_json()`、`select_path()`。
- 圖片匯入時前端先轉 base64，送 Python 壓縮後再回傳 base64。
- Word/圖片/JSON 輸出時，前端再把全部圖片 base64 傳回 Python。
- production 目前載入 `./html/index.html`，不是由 FastAPI serve React build。

主要問題：

- base64 體積膨脹且造成 React state / JSON / Python 解碼壓力。
- 圖片匯入傳一次，輸出又傳一次。
- 大量大圖時前後端記憶體與 request 壓力高。
- js_api 難以測試，不利後續 API 化。
- 舊版 JSON 格式不適合未來 crop/layout/PDF。

## 3. 已確認決策

### 3.1 專案格式

使用資料夾，不使用 zip。

範例：

```text
照片黏貼表.ipigeon/
  project.json
  images/
    550e8400-e29b-41d4-a716-446655440000.webp
    9a2de4a1-7d62-4e94-9bfb-5bbebf21f52e.webp
```

### 3.2 儲存 JSON

新版「儲存專案」取代舊版「儲存 JSON」。主線 UI 不再提供舊的儲存 JSON。

舊 JSON 僅保留「匯入舊版 JSON」。若未來要匯出舊 JSON，需另立相容功能，不在第一階段範圍。

### 3.3 儲存與開啟

第一階段需同時包含：

- 儲存新版專案
- 開啟新版專案

### 3.4 舊版 JSON 匯入

舊 JSON 匯入後完全轉成新版資料：

- 以實際 base64 解碼出的圖片為準。
- 不保留舊版資料結構。
- 不延續舊版 base64 狀態。
- 可用圖片匯入；壞圖回報清單；全部失敗才整批失敗。

### 3.5 圖片格式

- session/project 內部：WebP。
- 另存圖片：JPG。
- Word 輸出若 WebP 相容性不穩，輸出時臨時轉 JPG。

### 3.6 大量圖片匯入

- 前端分批多 request。
- 每批 2-4 張。
- 前端顯示 `已完成 N / total`。
- 不做後端 job、polling、WebSocket、SSE。

### 3.7 刪除圖片

第一階段只從前端列表移除，不即時刪除後端 temp 檔。

temp 等 session 清理時處理。

### 3.8 裁切與排版欄位

第一階段即使 UI 不開放裁切，也要在 item 裡加入預設 crop：

```json
{
  "x": 0,
  "y": 0,
  "width": 1,
  "height": 1,
  "unit": "ratio"
}
```

project.json 保留 `layouts[]`，第一階段只產生 `word-compatible-grid`。

### 3.9 Word 輸出排序

Word 輸出一律以 `layout.itemOrder` 為準。

### 3.10 另存圖片

另存圖片時套用 item 的 `rotation` 與 `crop`。

### 3.11 Word 設定

專案儲存不保存 Word 輸出設定。

不保存：

- Word mode
- align_vertical
- font_size
- Word title setting

Word 表單設定仍由匯出當下決定。

### 3.12 檔案命名

圖片檔案使用 uuid，例如：

```text
images/<uuid>.webp
```

`originalName` 只記在 project.json。

### 3.13 session 清理

- app 啟動時清除超過 24 小時的 temp session。
- app 正常關閉時清目前未保存 session。
- project folder 不受 temp 清理影響。

## 4. 最終資料流

### 4.1 匯入一般圖片

1. 使用者在前端選多張圖片。
2. 前端分批，每批 2-4 張，使用 `multipart/form-data` 呼叫 FastAPI。
3. FastAPI 接收 `UploadFile`，用 Pillow 解碼、壓縮成 WebP。
4. FastAPI 存入 session：`web_cache/temp/sessions/<session_id>/images/<uuid>.webp`。
5. FastAPI 回傳 assets/items metadata。
6. 前端只保存 metadata，不保存 base64。

### 4.2 匯入長截圖

1. 使用者選一張或多張長截圖。
2. 前端分批上傳。
3. FastAPI 判斷長截圖比例並切割。
4. 切割後每張圖都成為獨立 asset/item。
5. 不保留原長圖。

### 4.3 前端編輯

前端可做：

- 排序
- 備註
- 旋轉
- 刪除列表項目

第一階段不做：

- 裁切 UI
- 自由拼貼排版 UI
- PDF/列印 UI

### 4.4 儲存專案

1. 使用者透過 pywebview 選擇專案資料夾位置或名稱。
2. 前端把目前 project manifest 傳給 FastAPI。
3. FastAPI 寫出：
   - `project.json`
   - `images/*.webp`
4. 專案資料夾不受 temp 清理影響。

### 4.5 開啟專案

1. 使用者透過 pywebview 選擇 `.ipigeon` 專案資料夾。
2. FastAPI 讀取 `project.json` 與 `images/`。
3. 建立新的 temp session。
4. 將 project images 複製到 session temp，避免未儲存前直接改動原專案。
5. 回傳 session_id + project metadata 給前端。

### 4.6 匯入舊版 JSON

1. 使用者選擇舊版 JSON。
2. FastAPI 讀取舊 JSON。
3. 解碼 `images[].base64`。
4. 轉成 WebP，建立新版 assets/items/layout。
5. 壞圖列入 skipped/errors。
6. 回傳新版 session。

### 4.7 匯出 Word

1. 使用者在 Word 匯出 UI 設定當次 Word options。
2. 使用 pywebview 選擇 docx 儲存位置。
3. 前端呼叫 FastAPI，送：
   - session_id
   - path
   - Word options
   - layout_id 或完整 itemOrder manifest
4. FastAPI 根據 `layout.itemOrder` 找圖片。
5. FastAPI 套用 rotation/crop，必要時臨時轉 JPG。
6. 使用 python-docx 輸出 Word。

### 4.8 另存圖片

1. 使用者選擇輸出資料夾。
2. 前端呼叫 FastAPI，送 session_id + itemOrder/item metadata。
3. FastAPI 套用 rotation/crop。
4. 輸出 JPG。

## 5. project.json schema 草案

第一階段 schema version 使用 `2`，表示取代舊版 base64 JSON。

```json
{
  "schema": "image-pigeon.project",
  "version": 2,
  "document": {
    "title": "照片黏貼表"
  },
  "assets": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "file": "images/550e8400-e29b-41d4-a716-446655440000.webp",
      "mime": "image/webp",
      "width": 1200,
      "height": 900,
      "originalName": "事故照片1.jpg",
      "size": 234567
    }
  ],
  "items": [
    {
      "id": "item_550e8400-e29b-41d4-a716-446655440000",
      "type": "image",
      "assetId": "550e8400-e29b-41d4-a716-446655440000",
      "remark": "現場照片",
      "rotation": 0,
      "crop": {
        "x": 0,
        "y": 0,
        "width": 1,
        "height": 1,
        "unit": "ratio"
      }
    }
  ],
  "layouts": [
    {
      "id": "layout_word_default",
      "type": "word-compatible-grid",
      "itemOrder": [
        "item_550e8400-e29b-41d4-a716-446655440000"
      ]
    }
  ]
}
```

### 5.1 欄位規則

- `assets[].id`：uuid，不含副檔名。
- `assets[].file`：相對 project root 的檔案路徑。
- `assets[].originalName`：只作顯示/追蹤，不作實體檔名。
- `items[].assetId`：參照 asset。
- `items[].crop`：非破壞性裁切 metadata，第一階段固定全圖。
- `layouts[].type`：第一階段只允許 `word-compatible-grid`。
- `layouts[].itemOrder`：正式輸出排序來源。

### 5.2 未來 paged-canvas 擴充方向

第一階段不產生，但 schema 預留 `layouts[]`，未來可加入：

```json
{
  "id": "layout_pages_001",
  "type": "paged-canvas",
  "pages": [
    {
      "id": "page_001",
      "size": "A4",
      "orientation": "portrait",
      "unit": "mm",
      "elements": [
        {
          "id": "el_001",
          "type": "image",
          "itemId": "item_xxx",
          "box": {"x": 10, "y": 20, "width": 90, "height": 60},
          "fit": "contain"
        }
      ]
    }
  ]
}
```

## 6. 建議 API 設計

所有 response 可沿用目前概念：

```json
{
  "status": 200,
  "message": "成功",
  "data": {}
}
```

HTTP status 仍應合理使用：400/404/500 不要都包成 HTTP 200。

### 6.1 health

`GET /api/health`

用途：前端確認 FastAPI ready。

回傳：

```json
{"status": 200, "message": "ok", "data": {"app": "image-pigeon"}}
```

### 6.2 匯入圖片

`POST /api/images/import`

Content-Type: `multipart/form-data`

欄位：

- `session_id`: optional
- `files`: UploadFile[]
- `quality`: 50 | 75 | 90，預設 75
- `min_size`: number，預設 1000

回傳：

```json
{
  "status": 200,
  "message": "新增成功",
  "data": {
    "sessionId": "...",
    "assets": [],
    "items": [],
    "layoutPatch": {
      "appendItemOrder": []
    }
  }
}
```

### 6.3 匯入長截圖

`POST /api/images/import-long-screen`

與 `/api/images/import` 類似，但後端執行切割；每個切割結果建立 asset/item。

### 6.4 圖片預覽/載入

`GET /api/sessions/{session_id}/assets/{asset_id}/image`

回傳 session 內 WebP 圖片檔。

第一階段 preview 和正式圖同一份，因此不需要獨立 preview endpoint。

### 6.5 儲存專案

`POST /api/project/save`

Body：

```json
{
  "sessionId": "...",
  "targetPath": "/path/to/照片黏貼表.ipigeon",
  "project": {
    "schema": "image-pigeon.project",
    "version": 2,
    "document": {},
    "assets": [],
    "items": [],
    "layouts": []
  }
}
```

行為：

- 建立/覆寫 target project folder。
- 寫入 `project.json`。
- 複製 session images 到 `images/`。
- 不保存 Word 匯出設定。

### 6.6 開啟專案

`POST /api/project/open`

Body：

```json
{
  "projectPath": "/path/to/照片黏貼表.ipigeon"
}
```

行為：

- 驗證 `project.json` 與 `images/`。
- 建立新 session。
- 複製 project images 到 session temp。
- 回傳 sessionId + project。

### 6.7 匯入舊版 JSON

`POST /api/project/import-legacy-json`

Body：

```json
{
  "jsonPath": "/path/to/old.json"
}
```

或採 UploadFile；若由 pywebview select_path 選本機路徑，body path 較簡單。

行為：

- 讀舊 JSON。
- 解碼 base64。
- 轉 WebP。
- 建立新版 project/session。
- 回傳 skipped/errors。

### 6.8 匯出 Word

`POST /api/export/docx`

Body：

```json
{
  "sessionId": "...",
  "path": "/path/to/output.docx",
  "title": "照片黏貼表",
  "mode": "4",
  "alignVertical": "center",
  "fontSize": "12",
  "layoutId": "layout_word_default",
  "project": {}
}
```

注意：Word options 不保存到 project，只是此次 request 使用。

### 6.9 另存圖片

`POST /api/export/images`

Body：

```json
{
  "sessionId": "...",
  "path": "/path/to/folder",
  "title": "Photo",
  "isRemarkMode": false,
  "layoutId": "layout_word_default",
  "project": {}
}
```

輸出 JPG，套用 rotation/crop。

### 6.10 session 清理

`DELETE /api/sessions/{session_id}`

第一階段可由 app 關閉時後端內部呼叫；前端不一定要有 UI。

## 7. 建議檔案結構

### 7.1 Python 後端

可在 `py/` 下新增：

```text
py/
  main.py
  app/
    __init__.py
    api.py
    models.py
    session_store.py
    image_service.py
    project_service.py
    export_service.py
    legacy_json.py
    paths.py
```

建議責任：

- `api.py`：FastAPI app/routes。
- `models.py`：Pydantic request/response/project schema。
- `session_store.py`：建立 session、找 image path、清理 temp。
- `image_service.py`：Pillow 壓縮、WebP 儲存、長截圖切割、rotation/crop。
- `project_service.py`：save/open project folder。
- `export_service.py`：Word/JPG 輸出，包裝既有 `save_docx.py`、`save_images.py` 可重用邏輯。
- `legacy_json.py`：舊 JSON 匯入轉換。
- `paths.py`：resource path、cache path、portable path。

### 7.2 前端

可在 `src/` 下新增/調整：

```text
src/
  services/
    apiClient.ts
    imageApi.ts
    projectApi.ts
    exportApi.ts
  types/
    project.ts
  utils/
    uploadBatch.ts
```

建議責任：

- `apiClient.ts`：axios instance。
- `imageApi.ts`：import images / long screenshots。
- `projectApi.ts`：save/open/import legacy JSON。
- `exportApi.ts`：docx/images export。
- `project.ts`：Project/Asset/Item/Layout 型別。
- `uploadBatch.ts`：限制每批 2-4 張與進度回報。

### 7.3 pywebview bridge 保留範圍

第一階段保留 js_api，但縮小為桌面操作：

- `select_path` 或拆成更明確：
  - `select_save_docx_path`
  - `select_project_folder`
  - `select_open_project_folder`
  - `select_output_images_folder`
  - `select_legacy_json_file`

可先沿用既有 `select_path(mode)`，但計畫上建議後續拆明確，降低 mode 字串錯誤。

## 8. 實作階段與任務

> 每個階段完成後都必須寫 `docs/result/2026-06-30-1647-fastapi-session-project-format-<phase>-result.md` 或合併成總結果報告。結果需包含 changed files、verification commands、outcomes、blockers。

### Phase 0：基線與安全網

目標：確認目前專案可建置，建立改版前基線。

任務：

1. 在 image-pigeon 根目錄執行前端建置檢查：
   - `pnpm install`，若 node_modules 已存在可略過。
   - `pnpm -s tsc -b`
   - `pnpm build`
2. 確認 Python dependencies：
   - `.venv` 或 uv environment。
   - 現有 `python main.py` 是否可啟動。
3. 記錄目前 known failures，不要在後續誤報成新錯。

驗收：

- 有 baseline result report。
- 若現有 build 失敗，需記錄錯誤與是否與改版無關。

### Phase 1：FastAPI 基礎與 pywebview 啟動整合

目標：讓 image-pigeon 啟動 FastAPI，production 可由 FastAPI serve React build。

任務：

1. 更新 `pyproject.toml`：加入 `fastapi`、`uvicorn`，若使用 UploadFile 另視情況加入 `python-multipart`。
2. 建立 `py/app/api.py`，提供 `GET /api/health`。
3. 把 `main.py` 調整成：
   - 啟動 FastAPI uvicorn thread。
   - dev 模式載入 Vite。
   - production 載入 FastAPI root URL。
   - 保留 pywebview js_api 供選檔/選資料夾。
4. 更新 `vite.config.ts`：加入 `/api` proxy 到 FastAPI port。
5. FastAPI 只 bind `127.0.0.1`。
6. image 不依賴 pywebview-base 的 port 設定；可使用 image 專屬固定 port 或 get-free-port。若使用動態 port，前端 dev proxy 需有固定 dev port 或透過設定處理。

驗收：

- `GET /api/health` 成功。
- dev mode React 可呼叫 `/api/health`。
- production build 後可由 FastAPI serve index/assets。
- pywebview 視窗仍可開啟。

### Phase 2：session store 與 project schema model

目標：建立 filesystem session 和 Project v2 model。

任務：

1. 建立 `py/app/models.py`：
   - API response model。
   - ProjectV2。
   - Asset。
   - Item。
   - Crop。
   - WordCompatibleGridLayout。
2. 建立 `py/app/session_store.py`：
   - create_session()
   - get_session_dir()
   - get_image_path()
   - write/read session.json
   - clean_expired_sessions(hours=24)
   - cleanup_current_session()
3. session path：
   - `web_cache/temp/sessions/<session_id>/session.json`
   - `web_cache/temp/sessions/<session_id>/images/<uuid>.webp`
4. session.json 中保存 project object 與 runtime metadata。

驗收：

- 單元測試或小型 script 可建立 session、寫入/讀回 session.json、清理過期 session。
- 不需要 DB。

### Phase 3：圖片匯入 API

目標：用 multipart + WebP session image 取代 base64 upload_image。

任務：

1. 建立 `py/app/image_service.py`：
   - UploadFile bytes -> Pillow Image。
   - 根據 quality/min_size 壓縮。
   - 儲存 WebP。
   - 產生 Asset/Item。
2. 實作 `POST /api/images/import`。
3. 實作 `GET /api/sessions/{session_id}/assets/{asset_id}/image`。
4. 前端建立 `src/types/project.ts`。
5. 前端建立 `src/services/apiClient.ts`、`imageApi.ts`。
6. 前端 `UploadMultiple.tsx` 改用分批上傳，不再轉 base64。
7. 前端狀態改為新版 item/asset metadata，不保存 base64。

驗收：

- 匯入多張圖片後，session/images 產生 WebP。
- 前端可顯示圖片。
- 前端進度顯示 N / total。
- React state 不再保存 base64。

### Phase 4：長截圖匯入 API

目標：將 crop_image 改為 FastAPI multipart 流程。

任務：

1. 在 `image_service.py` 中重構現有長截圖切割邏輯。
2. 實作 `POST /api/images/import-long-screen`。
3. 切割後每張圖建立獨立 asset/item。
4. 不保留原長圖。
5. 前端 `UploadLongScreen.tsx` 改用新 API 與分批進度。

驗收：

- 合格長截圖匯入後生成多張 WebP。
- 非長截圖回傳 400，前端顯示錯誤。
- 不產生原長圖保存檔。

### Phase 5：前端 project state 重構

目標：統一前端使用 ProjectV2 state，排序更新 layout.itemOrder。

任務：

1. 建立 project state helper：
   - add assets/items
   - remove item from itemOrder
   - reorder itemOrder
   - update remark
   - update rotation
2. 讓現有預覽列表使用 `layout.itemOrder` 渲染。
3. 將 `CustomImage` 用途降到最低或改成 `ProjectItemViewModel`。
4. 刪除圖片只更新前端 state，不呼叫後端 delete。
5. 確認所有輸出 UI 都能取得 project + layout.itemOrder。

驗收：

- 排序後 Word/圖片輸出 request 的 itemOrder 正確。
- 刪除項目後 UI 消失，但後端 temp 可保留。
- 備註/旋轉仍可操作。

### Phase 6：新版專案儲存與開啟

目標：支援 `.ipigeon/` 專案資料夾 roundtrip。

任務：

1. 實作 `py/app/project_service.py`。
2. 實作 `POST /api/project/save`：
   - 建立 target folder。
   - 寫 project.json。
   - 複製 session images。
3. 實作 `POST /api/project/open`：
   - 驗證 project.json。
   - 建立新 session。
   - 複製 images 到 session temp。
   - 回傳 session/project。
4. pywebview `select_path` 增加或調整 project folder 選擇模式。
5. 前端替換「儲存 JSON」為「儲存專案」。
6. 新增「開啟專案」。

驗收：

- 儲存後產生 `project.json` 與 `images/*.webp`。
- 關閉/重新開啟專案後，圖片、備註、排序、旋轉仍存在。
- project 不保存 Word 匯出設定。

### Phase 7：舊版 JSON 匯入

目標：支援舊版 JSON 轉新版 session。

任務：

1. 建立 `py/app/legacy_json.py`。
2. 實作 `POST /api/project/import-legacy-json`。
3. 解碼舊版 `images[].base64`。
4. 實際圖片尺寸以解碼後為準。
5. 保留可轉換的 remark/rotation。
6. 壞圖 skipped/errors；全部失敗才整批失敗。
7. 前端新增「匯入舊版 JSON」。

驗收：

- 舊版 JSON 可匯入並轉為 WebP session。
- 前端不保存舊 base64。
- 壞圖處理有明確訊息。

### Phase 8：Word 輸出改造

目標：Word 輸出不再接收 base64 images，而是使用 session images + layout.itemOrder。

任務：

1. 建立/調整 `py/app/export_service.py`。
2. 重構 `save_docx.py` 讓它可接收 image file path + item metadata，而不是 base64 dict。
3. 輸出時套用 rotation/crop。
4. WebP 若 python-docx 不穩，臨時轉 JPG 再插入。
5. `POST /api/export/docx` 接收 session_id、path、Word options、project/layout。
6. 前端 `SaveWord.tsx` 改呼叫新 API。

驗收：

- 匯入圖片後可匯出 Word。
- Word 圖片順序依 layout.itemOrder。
- rotation/crop 生效。
- Word options 不被寫回 project.json。

### Phase 9：另存圖片改造

目標：另存圖片輸出 JPG，套用 rotation/crop。

任務：

1. 重構 `save_images.py` 或在 `export_service.py` 實作輸出 JPG。
2. `POST /api/export/images` 接收 session/project/layout。
3. 檔名邏輯沿用現有 title/index 或 remark mode。
4. 輸出時處理非法檔名與重名。
5. 前端 `SaveImages.tsx` 改呼叫新 API。

驗收：

- 輸出資料夾中產生 JPG。
- rotation/crop 生效。
- remark mode 與 title mode 正常。

### Phase 10：清理舊流程與文件

目標：移除主線 base64 / save_json 依賴，補文件與驗證。

任務：

1. 移除或停用主線 `window.pywebview.api.upload_image/crop_image/save_docx/save_images/save_json` 前端呼叫。
2. 保留 pywebview select_path 類桌面 API。
3. 更新 TypeScript global declaration。
4. 更新 README 或 docs，說明新版專案格式。
5. 檢查 `window.pywebview.updateProgress` 是否仍需要；若前端分批進度已取代，逐步移除。

驗收：

- 搜尋不到主線 component 仍使用舊圖片處理 js_api。
- README/docs 說明新版 `.ipigeon/`。
- 前端 build 成功。
- Python smoke 成功。

## 9. 測試與驗證矩陣

### 9.1 前端

必要命令：

```bash
pnpm -s tsc -b
pnpm build
```

如有 lint：

```bash
pnpm lint
```

若 lint 有既有錯誤，結果報告需區分新舊錯誤。

### 9.2 Python

若有 pytest，新增並執行：

```bash
pytest
```

若沒有 pytest，至少以 scripts 或 manual smoke 驗證：

- create session
- import images
- save/open project
- import legacy JSON
- export docx
- export images

### 9.3 API smoke

- `GET /api/health`
- `POST /api/images/import`
- `GET /api/sessions/{session_id}/assets/{asset_id}/image`
- `POST /api/project/save`
- `POST /api/project/open`
- `POST /api/project/import-legacy-json`
- `POST /api/export/docx`
- `POST /api/export/images`

### 9.4 Roundtrip 驗證

1. 匯入 5 張圖片。
2. 修改備註、旋轉、排序。
3. 儲存 `.ipigeon/`。
4. 清掉目前 session 或重啟 app。
5. 開啟 `.ipigeon/`。
6. 驗證圖片、備註、旋轉、排序一致。
7. 匯出 Word。
8. 另存圖片為 JPG。

### 9.5 大量圖片驗證

至少測：

- 20 張一般照片。
- 2-3 張大尺寸照片。
- 長截圖切割。
- 分批進度 N / total。
- 批次失敗時錯誤顯示。

## 10. 風險與緩解

### 10.1 WebP 與 Word 相容性

風險：python-docx/Word 對 WebP 支援不穩。

緩解：Word 輸出時臨時轉 JPG。

### 10.2 大量圖片記憶體

風險：一次讀太多圖片造成 memory spike。

緩解：前端分批 2-4 張；後端逐張處理並盡快寫檔。

### 10.3 project folder 覆寫

風險：儲存專案時覆蓋使用者資料。

緩解：save API 清楚處理 target folder；可先寫 temp folder 再 replace，或確認覆寫行為；第一階段結果需驗證不誤刪非本專案檔。

### 10.4 temp 清理誤刪 project

風險：清理 temp 誤刪使用者專案。

緩解：temp path 固定在 `web_cache/temp/sessions/`；project folder 不放在 temp。

### 10.5 前端 state 遷移範圍大

風險：`CustomImage` 舊模型散落多處。

緩解：先建立 adapter/view model，逐步替換；每階段跑 build。

### 10.6 舊 JSON 品質不一致

風險：舊 JSON base64 可能 mime 錯、尺寸錯、壞圖。

緩解：以實際解碼為準；壞圖 partial success；全部失敗才整批失敗。

## 11. Definition of Done

本計畫完成需滿足：

- image-pigeon 已不依賴 pywebview js_api 做圖片處理 API。
- FastAPI 負責圖片匯入、長截圖切割、session、專案儲存/開啟、Word/圖片輸出。
- pywebview 仍負責桌面視窗與選檔/選資料夾。
- 前端不長期保存 base64。
- 新版 `.ipigeon/` project folder 可 save/open roundtrip。
- 舊版 JSON 可匯入並轉新版 session。
- Word 可輸出。
- 另存圖片輸出 JPG 並套用 rotation/crop。
- project.json 包含 crop metadata 與 layouts[]。
- `pnpm -s tsc -b` 與 `pnpm build` 通過，或結果報告明確列出非本改版造成的既有錯誤。
- 有 `docs/result/` 執行結果報告。

## 12. 執行結果報告契約

每次實作完成一個 phase 或一批 phase，需建立：

```text
docs/result/2026-06-30-1647-fastapi-session-project-format-<phase>-result.md
```

至少包含：

1. 完成項目，對應 phase/task。
2. 實際修改檔案。
3. 驗證命令與結果。
4. 手動 smoke 結果。
5. 未完成項目 / blocker。
6. 若與計畫偏離，說明原因。

Hermes 或後續 agent 回報完成前，必須先讀取 result report，再檢查 diff/tests。
