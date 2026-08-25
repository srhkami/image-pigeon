---
type: plan
id: plan-image-pigeon-pure-frontend-version-2026-08-18
status: active
canonical: true
scope: image-pigeon
created_at: 2026-08-18
branch:
  name: feat/pure-frontend
  base: dev
  status: created
execution:
  status: partial
  current_checkpoint: c10_completed_partial_target_windows_skipped_by_user
result: docs/result/2026-08-18-pure-frontend-version-result.md
review:
  type: plan_sanity
  status: passed
  completed_at: 2026-08-24
approval_gates:
  planning_docs: approved
  branch_create: completed
  source_write: approved_consumed_c9_static_hosting_security_closed
  dependency_install: approved_consumed_c7_docx
  automated_test: completed_c10_regression
  local_browser_smoke: completed_c0_c4_c9_bounded
  browser_uat: closed_c10_target_windows_skipped_by_user_no_pass
  word_compatibility_uat: closed_c10_target_windows_skipped_by_user_no_pass
  deployment: closed
  commit: closed
  push: closed
---

# image-pigeon 純前端版本實作計畫

> 後續決策（2026-08-25）：本計畫執行時曾要求並完成舊 `.ipigeon/` 資料夾與 1.x JSON 相容；產品之後決定自本版本起移除兩者。現行退場契約與執行狀態以 `docs/plans/2026-08-25-retire-legacy-project-formats.md` 為準；以下原始內容保留作歷史執行證據。
>
> 後續決策（2026-08-25）：純前端候選不再自動檢查更新。所有要求保留新版本提示、版本 API、固定版本 GET、更新下載入口或對 `api.pigeonhand.tw` 開放 `connect-src` 的條款均已由本決策取代；正式前端不得發出背景 `fetch`／XMLHttpRequest，靜態同源資產讀取與使用者明確點擊的固定外部導覽不屬自動更新。下列舊條款保留作原始執行契約與歷史脈絡，不代表目前功能仍存在。

## 目標

在獨立測試分支 `feat/pure-frontend` 建立不依賴 `.exe`、pywebview、FastAPI、uvicorn 或本機監聽連接埠的純前端版本。正式產物必須能部署為 HTTPS 靜態網站，圖片、專案與輸出檔案在使用者瀏覽器本機處理，不將圖片或專案內容上傳至伺服器；在此邊界內盡可能維持現有編輯、排版、列印、專案與輸出體驗。

本計畫不把「功能名稱仍存在」當成相容成功。無法在一般瀏覽器安全模型下可靠保留的能力，必須移除、改成清楚的替代流程，或標示為純前端版不支援，不以遠端後端、隱藏上傳或高成本自製格式繞過限制。

## 分支與既有工作保護

- 本計畫專用分支已由 `dev` 建立：`feat/pure-frontend`。
- 建立分支時既有 staged 檔案 `tests/newVersionDismissal.test.ts` 已原樣帶入；它不是本計畫產生的變更，不得取消暫存、覆寫、改寫或納入純前端範圍判定。
- 實作前必須重新記錄 `git status --short --branch`、staged path 與 staged diff 摘要，之後只比較本計畫新增的差異。
- 本計畫沒有 commit、push、merge、部署或刪除既有分支的核准。即使所有驗證通過，也只能保留工作樹與分支供使用者測試。

## 現況與依賴邊界

目前正式版本是 pywebview + React + Python 的混合桌面架構：

- `main.py` 啟動 uvicorn、建立 pywebview 視窗並提供原生橋接。
- `core/app/api.py` 提供圖片匯入、長截圖、session 圖片、專案開啟／儲存及靜態檔案服務。
- `core/app/image_service.py` 與 Pillow 負責圖片壓縮及長截圖切割。
- `core/app/session_store.py` 以 filesystem session 保存 WebP。
- `core/app/project_service.py` 讀寫 `.ipigeon/` 資料夾專案。
- `core/save_docx.py` 使用 `python-docx` 與 Pillow 產生 Word。
- `core/save_images.py` 使用 Pillow 寫入多張 JPG。
- `src/services/imageApi.ts`、`src/services/projectApi.ts`、`src/services/apiClient.ts` 依賴本機 HTTP API。
- `src/state/projectState.ts` 將圖片預覽組成 `/api/sessions/.../image` URL。
- `src/features/Output/*.tsx` 的專案、Word、圖片輸出仍依賴 HTTP 或 pywebview。
- 編輯、排序、排版、拖放、列印預覽與 `window.print()` 主要已在 React 前端。

純前端版的正式執行階段不得 import、啟動或呼叫任何 Python／pywebview／FastAPI 路徑。Python 原始碼可暫時保留作相容基準，不因測試分支成立就批次刪除。

## 產品相容矩陣

### 必須保留

1. 多張圖片選擇與外部拖放。
2. 支援既有精確副檔名集合 `.jpg`、`.jpeg`、`.png`、`.webp`、`.bmp`、`.jfif`；副檔名通過只代表進入解碼，實際解碼失敗仍必須列入略過摘要，不得冒充支援成功。
3. 壓縮品質、最小尺寸與檔名備註模式。
4. 長截圖切割；超過瀏覽器能力時要安全失敗並說明，不可凍結或產生不完整資料後仍顯示成功。
5. ProjectV2 的 item、asset、remark、rotation、crop、layout preference、portrait size 與排序語意。
6. 焦點式編輯、滾輪切換、備註保存、旋轉、排版選擇、排序模式與全部清除。
7. 五種自動拼貼 template 與目前的列印預覽。
8. `window.print()` 系統列印及使用者自行另存 PDF。
9. 舊版 1.x JSON 匯入。
10. 專案保存與重新開啟的產品能力，但允許儲存介面由資料夾改成單一檔案。
11. 另存排序後圖片的能力，但允許由「寫入資料夾」改成「下載 ZIP」。
12. 現有新版本提示、SessionStorage／LocalStorage 的關閉與忽略語意；遠端版本 API 不可用時必須靜默降級，不影響主程式。
13. 所有圖片與專案內容只在瀏覽器本機處理；正式靜態主機不得接收圖片 POST、專案 payload 或自動診斷上傳。

### 可接受的替代

1. 現行 `.ipigeon/` 資料夾儲存改成單一 `.ipigeon` 壓縮檔，內含 `project.json` 與 `images/*.webp`。
2. 現行 `.ipigeon/` 資料夾可透過 Chromium 系瀏覽器的資料夾選取匯入；跨瀏覽器的必要主線以單一 `.ipigeon` 檔案為準。
3. 多張圖片輸出改成一個 ZIP 下載，不逐張觸發瀏覽器下載。
4. 檔案選擇與儲存使用瀏覽器原生 input／下載流程，不要求指定任意完整路徑。
5. Python filesystem session 改成頁面生命週期內的 Blob asset store。第一版不建立 IndexedDB／OPFS 自動復原；使用者必須明確下載專案才能跨重新整理保存。
6. Python 持久輪替記錄改成前端低敏感錯誤摘要；第一版不增加遠端遙測或自動上傳。

### 明確無法原樣保留

1. 未經使用者動作直接讀寫任意本機路徑。
2. 保存後自動啟動 Microsoft Word、Finder 或檔案總管。
3. 固定作業系統目錄的 Python 輪替記錄檔。
4. 瀏覽器關閉後仍持續執行圖片或輸出工作。
5. 保證瀏覽器暫存資料永不被清除。
6. 保證 Canvas、JPEG／WebP 編碼結果與 Pillow 位元級一致。
7. 保證 JavaScript Word 產物與目前 `python-docx` XML 或所有 Word 版本逐像素一致。

上述限制不是待補技術債；若驗收需要這些桌面能力，純前端版應判定不適合該使用情境，而不是加入伺服器端處理來假裝純前端。

## 目標架構

```text
HTTPS 靜態主機
  └── dist/（HTML、CSS、JavaScript、字型、圖示）
        │
        ▼
使用者瀏覽器
  ├── React UI 與 ProjectV2 metadata
  ├── BrowserAssetStore：asset id → Blob + object URL
  ├── Canvas／Web Worker：壓縮、旋轉、長截圖切割
  ├── project archive：project.json + images/*.webp
  ├── image ZIP exporter
  ├── bounded Word exporter（通過相容驗證才保留）
  └── window.print()／系統 PDF
```

### 資料原則

- React state 只保存 ProjectV2 metadata，不保存大型 Base64。
- 圖片二進位內容以 `Blob` 保存於頁面生命週期的 asset store。
- 預覽使用 `URL.createObjectURL(blob)`；刪除、清空、開啟其他專案及卸載時必須 `URL.revokeObjectURL()`。
- 匯出使用 Blob／ArrayBuffer，不把圖片轉成 Base64 後再來回複製。
- 正式版只允許必要的靜態 GET 與既有版本檢查 GET；不得新增圖片／專案 POST。

## 純前端 v1 資源限制表

下列是第一版固定產品契約，不以「瀏覽器可能可以更多」放寬。所有 checkpoint 共用同一組常數與固定錯誤碼；只有後續獨立計畫與實測證據才能調整。

| 邊界 | 固定上限 |
|---|---|
| 一般圖片單檔 | 32 MiB（33,554,432 bytes） |
| 一次一般圖片批次 | 50 檔、輸入合計 512 MiB（536,870,912 bytes） |
| 一般圖片解碼尺寸 | 單邊 16,384 px、總像素 64,000,000 |
| 長截圖單檔 | 64 MiB（67,108,864 bytes） |
| 長截圖解碼尺寸 | 寬 8,192 px、高 65,535 px、總像素 96,000,000，三項任一超限即拒絕 |
| 單張長截圖切割段數 | 100 段 |
| 同時解碼／Canvas 處理數 | 1；完成並釋放前一張暫存資源後才處理下一張 |
| 頁面 asset store | 200 assets、Blob 合計 512 MiB（536,870,912 bytes） |
| `.ipigeon` 壓縮檔 | 壓縮輸入 512 MiB、最多 201 個非目錄 entry、`project.json` 2 MiB、單一圖片 entry 64 MiB |
| `.ipigeon` 解壓後 | 總計 512 MiB、單一 entry 壓縮比不得超過 100:1、assets 與 items 各最多 200 |
| 圖片輸出 ZIP | 最多 200 張；來源 Blob 合計及完成 ZIP 各不得超過 512 MiB |
| 1.x JSON | 檔案 512 MiB、`images` 最多 200 筆；解碼後仍受 asset store 與解碼尺寸上限 |

資源檢查順序固定為：檔案數／壓縮 bytes 預檢 → 每筆 metadata 與宣告尺寸 → 實際解碼尺寸 → 每筆產物 bytes → aggregate store／archive 上限。超限一律使用固定 `RESOURCE_LIMIT_EXCEEDED`，訊息指出限制類型與上限，但不回傳檔案內容或完整私人路徑。

### 原子性、部分成功與取消契約

- 一般圖片批次：單張不可解碼可列入略過清單；所有可接受圖片先寫入暫存 asset store，批次完成後一次 commit。全數失敗或使用者取消時，原專案不變並回收所有暫存 URL／Blob。
- 長截圖批次：每個來源檔案是最小原子單位；任一 segment 失敗，該來源的所有暫存 segments 全部丟棄。不同來源可部分成功，但只在整批完成後一次 commit；取消時整批不 commit。
- 專案開啟與 1.x JSON 遷移：all-or-nothing。所有 metadata、圖片與 aggregate limits 全部通過後，才替換目前專案及 asset store。
- 專案、圖片 ZIP 與 Word 輸出：all-or-nothing；失敗或取消不觸發任何下載。
- 每個流程必須接受同一 `AbortSignal`。取消檢查點至少包括：每檔開始前、解碼後／Canvas 前、Canvas 輸出後／暫存註冊前、每個 archive entry 前後、最終 commit 或下載前。取消固定回傳 `OPERATION_CANCELLED`，並於離開前清除該次操作所有暫存資源。

### 目標環境與效能記錄

- 自動驗證以實作環境的 Node／Chromium adapter 執行；人工相容目標為 Windows 11、至少 8 GiB RAM、當次最新版穩定版 Microsoft Edge，Chrome 為次要目標。
- UAT result 必須記錄實際 Windows 版本、CPU、RAM、Edge／Chrome 完整版本、Microsoft Word 版本與 fixture hash；不能只寫「最新版」。
- 50 張一般圖片壓力 fixture：每張最多 12,000,000 pixels、8 MiB，合計最多 256 MiB；整批須在 120 秒內完成，Edge renderer working set 相對操作前增加不得超過 1.5 GiB，且不得出現頁面崩潰、瀏覽器 OOM 或超過 10 秒無回應。量測方法與起訖點須寫入 result。
- 若目標機關設備低於上述參考環境，必須另做實機 UAT；參考機 PASS 不得覆蓋較低規格設備。

## 1.x JSON 相容契約

可接受輸入為單一 JSON object，且必須有非空 `images` array。top-level `title` 可選；舊輸出的 `path` 與其他 top-level 欄位忽略，不信任也不沿用。

每個 `images[]` 元素必須是 object：

- `base64`：必填，必須是合法 `data:image/<mime>;base64,<payload>`，MIME 限 `image/png`、`image/jpeg`、`image/webp`、`image/bmp`；Base64、實際解碼及尺寸檢查都必須成功。
- `width`、`height`：必填的正整數，必須符合資源限制，且與實際解碼尺寸一致；不得只信任 JSON 宣告。
- `remark`：必填字串，最多 10,000 UTF-16 code units；空字串有效。
- `rotation`：可選；缺少時為 `0`，存在時只能是 `0 | 90 | 180 | 270`。
- 舊 `id`、`file`、`preview` 可存在但全部忽略；不得還原舊 object URL 或本機路徑。

任何一筆 malformed data URL、Base64、MIME、尺寸、remark 或 rotation 不合法，都拒絕整個 1.x JSON，原專案不變，不做部分匯入。合法項目依原陣列順序轉換：解碼後以 WebP quality 100 建立新 Blob；產生全新 asset／item UUID；remark 與 rotation 保留；crop 使用完整圖片 `x=0,y=0,width=1,height=1,unit=ratio`；portrait size 使用現行預設，layout preference 由實際尺寸與 rotation 推導；default layout order 等於原陣列順序。`document.title` 使用非空 top-level `title`，否則使用「照片黏貼表」。

實作 fixture 至少包括：從 `v1` 分支真實輸出形狀去識別化後建立的有效多圖 JSON、缺少 rotation、四種 rotation、空 remark、top-level legacy `path`、損壞 Base64、宣告／實際尺寸不符、錯誤 MIME、單筆壞資料混於多筆及超過資源上限。成功 assertions 必須證明可編輯、列印、另存單一 `.ipigeon` 並再次開啟。

## 套件原則

- 圖片解碼、縮放、旋轉與切割優先使用瀏覽器內建 API，不增加圖片處理套件。
- 專案與多圖 ZIP 可評估 `fflate`；安裝前必須先確認維護狀態、授權、瀏覽器支援及實際 bundle 成本。
- Word 可評估瀏覽器版 `docx`；只允許在 Word checkpoint 進行一次有界技術驗證，不直接承諾正式保留。
- 套件安裝是獨立核准閘門。未核准前只能完成介面、測試設計與不需新依賴的瀏覽器基礎能力。
- 不加入分析、遙測、雲端儲存、第三方 CDN、外部字型或遠端圖片處理服務。

## 範圍

### 預計建立

實作時應先核對命名與鄰近慣例；下列為 canonical 預定路徑：

- `src/services/browserAssetStore.ts`
- `src/services/browserImageProcessor.ts`
- `src/services/browserProjectArchive.ts`
- `src/services/browserDownload.ts`
- `src/services/browserImageExport.ts`
- `src/services/browserWordExport.ts`（只在 Word checkpoint GO 時建立）
- `src/services/browserAssetStore.test.ts`
- `src/services/browserImageProcessor.test.ts`
- `src/services/browserProjectArchive.test.ts`
- `src/services/browserDownload.test.ts`
- `src/services/browserImageExport.test.ts`
- `src/services/browserWordExport.test.ts`（只在 Word checkpoint GO 時建立）
- `src/features/Upload/browserImportAdapter.ts`
- `src/features/Upload/browserImportAdapter.test.ts`
- `src/features/Output/UnsupportedWordNotice.tsx`（只在 Word checkpoint NO-GO 時建立）
- `docs/adr/0002-pure-frontend-runtime-boundary.md`（只有最終採用決策通過時建立）
- `docs/result/2026-08-18-pure-frontend-version-result.md`（執行後）
- `docs/deployment/pure-frontend-static-hosting.md`

### 預計修改

- `package.json`
- `pnpm-lock.yaml`（只有套件安裝核准後）
- `vite.config.ts`
- `src/App.tsx`
- `src/types/project.ts`
- `src/utils/type.ts`
- `src/state/projectState.ts`
- `src/state/projectImageAdapter.ts`
- `src/state/projectOutputAdapter.ts`
- `src/services/imageApi.ts`
- `src/services/projectApi.ts`
- `src/services/diagnosticLog.ts`
- `src/features/Upload/UploadMultiple.tsx`
- `src/features/Upload/UploadLongScreen.tsx`
- `src/features/Upload/OpenProject.tsx`
- `src/features/Upload/ReadJson.tsx`
- `src/features/Upload/ModalImport.tsx`
- `src/features/Output/SaveProject.tsx`
- `src/features/Output/SaveImages.tsx`
- `src/features/Output/SaveWord.tsx`
- `src/features/Output/ModalOutput.tsx`
- `src/features/PrintPreview/PrintPreviewView.tsx`
- `src/features/Intro/ModalNewVersion.tsx`
- `src/globak.d.ts`
- `README.md`
- `docs/architecture/current-architecture.md`（只有純前端版本通過採用決策後）
- 本計畫、同 scope result 與 `STATE.md`

### 可在純前端主線接妥後刪除的前端相依層

刪除前須先做 usages 掃描並確認沒有正式 import：

- `src/services/apiClient.ts`
- `src/services/imageApi.ts`（若所有 image URL/import helper 已遷移）
- `src/services/projectApi.ts`
- `src/globak.d.ts` 中 pywebview 宣告；若整檔只剩橋接型別才刪整檔。

### 保留但不得進入正式執行階段

第一輪不批次刪除以下 Python 檔案，以便與既有輸出比對及保留回退能力：

- `main.py`
- `main.spec`
- `core/app/`
- `core/save_docx.py`
- `core/save_images.py`
- 其他 Python 原始碼與測試

純前端完成條件以 `dist/` 不依賴這些檔案為準，不以測試分支刪除所有歷史實作為準。

## 明確不在範圍

- 帳號、登入、權限、多人協作或雲端專案。
- 圖片、專案、Word 或診斷資料上傳。
- 後端轉檔、無伺服器函式、WebAssembly Python 或遠端列印服務。
- PWA 安裝、服務工作者、完整離線更新與背景同步；可在純前端主線驗證後另立計畫。
- IndexedDB／OPFS 自動復原；第一版以明確專案下載為持久保存邊界。
- Safari／Firefox 的完整相容保證；第一目標是機關常用的最新版 Microsoft Edge，Chrome 作次要驗證。
- 重建桌面程式的任意路徑寫入、自動開檔、固定記錄目錄與背景處理能力。
- 為保留 Word 而手寫完整 OOXML renderer；若既有瀏覽器套件無法在有界驗證內達標，Word 功能應誠實降級。
- 正式伺服器設定、DNS、TLS、部署、發布、commit、push 或合併回 `dev`。
- 無關 UI 改版、路由系統、狀態管理框架或元件庫更換。

## 執行計畫

### C0：基線、網路邊界與失敗契約

1. 讀回 `AGENTS.md`、`STATE.md`、本計畫、現行架構與 ADR-0001。
2. 記錄分支、dirty worktree、staged 基線及使用者既有 `tests/newVersionDismissal.test.ts`。
3. 盤點所有 `fetch`、axios、`requestJson`、`window.pywebview`、`/api/`、`file://` 與 Python runtime 入口。
4. 建立功能相容測試矩陣：保留、替代、NO-GO、人工驗收，並逐項連到 checkpoint 與 AC；`CustomImage.base64` 只允許作 1.x JSON 一次性輸入型別，不得留在正式圖片生命週期的 import graph。
5. 建立正式網路範圍護欄：靜態資源只允許 GET；唯一應用程式外部 API 是無 body、無 credentials、無專案 header 的 `GET https://api.pigeonhand.tw/web/apps/1/`。圖片處理、專案與輸出期間不得有 XMLHttpRequest／fetch POST、PUT、PATCH、DELETE 或其他外送。`blob:`／object URL 是本機讀取，不計為網路；使用者自行點擊更新下載連結是外部導覽，須另列事件但不誤判為資料上傳。
6. 為大型圖片、無法解碼、Canvas 失敗、ZIP 損壞、project schema 不合法、重複檔名與使用者取消建立固定錯誤契約，並將本計畫「純前端 v1 資源限制表」實作為單一常數來源。
7. 修改 `package.json` 的 `test:frontend` 收集範圍，使標準命令至少包含既有 `tests/*.test.ts`、`src/features/ImagePreview/*.test.ts` 與本計畫新增的 `src/services/*.test.ts`、`src/features/Upload/*.test.ts`；另保留可直接執行單一測試檔的聚焦命令。

完成條件：基線可重建、相容矩陣明確、沒有改動 runtime source、沒有安裝套件或啟動服務。

### C1：瀏覽器 asset store 與預覽 URL

1. 在 `src/services/browserAssetStore.test.ts` 先建立 RED：註冊 Blob、依 asset id 取得 Blob／URL、重複替換時回收舊 URL、刪除、全部清空與開啟新專案時不殘留。
2. 實作小型 `BrowserAssetStore`；不使用 React context 或第三方 state library。
3. 將 `ProjectItemViewModel.previewUrl` 改由 asset store 解析，不再組成 `/api/sessions/...`。
4. 調整 `App.tsx`、`projectState.ts` 與 adapters，使 `sessionId` 不再是預覽必要條件；若為漸進遷移暫留欄位，必須標示 deprecated 且不得發 HTTP。
5. 為刪除、全部清除、開啟其他專案與元件卸載補 object URL 回收測試。

完成條件：現有編輯與列印元件取得可載入的 object URL，程式碼中不再以 session API 供應預覽。

### C2：一般圖片匯入與本機壓縮

1. 先以純函式測試尺寸計算、品質 allowlist、最小尺寸、檔名備註、批次錯誤與 ProjectV2 patch。
2. 使用 `createImageBitmap`／`Image` + Canvas 將輸入 File 解碼、依目前語意縮放並輸出 WebP Blob；必要時以 adapter 注入瀏覽器 API，使 Node 測試不需要假造完整 DOM。
3. 嚴格依本計畫資源限制以 concurrency `1` 依序處理，禁止無界 `Promise.all()`，每完成一張更新進度並執行取消檢查。
4. 將輸出 Blob 放入 asset store，ProjectV2 只保存 id、相對 `images/<id>.webp`、mime、尺寸、原始檔名與大小。
5. 保留外部拖放的 pending modal、`.jpg/.jpeg/.png/.webp/.bmp/.jfif` 精確副檔名過濾、備註與壓縮設定；每種格式至少有一個「副檔名通過＋實際可解碼」fixture，另有偽裝副檔名的解碼失敗 fixture。
6. 單張失敗時保留其他成功項目並顯示略過摘要；整批無成功項目時不得修改專案。

完成條件：一般匯入完全不呼叫 `/api/images/import`，圖片不轉成長期 Base64，現有編輯與預覽流程可用。

### C3：長截圖本機切割

1. 從 `core/app/image_service.py` 鎖定不依賴 Pillow bytes 的切割契約：只有 `width / height <= 9 / 21` 才是長截圖；`segmentHeight = width * 2`；`overlap = Math.round(segmentHeight * 0.03)`；`segmentCount = Math.ceil(height / segmentHeight)`。
2. 每個 raw segment canvas 固定為 `width × (segmentHeight + 2 * overlap)`。第 0 段來源範圍為 `[0, segmentHeight + 2*overlap)`；第 `i>0` 段為 `[i*segmentHeight-overlap, (i+1)*segmentHeight+overlap)`。來源超過圖片底部時只繪製有效交集，其餘區域填 opaque black，以相容目前一般不透明截圖的 Pillow crop padding；透明長截圖尾段也會使用黑色 padding，列為已知替代而非逐位元相容。
3. raw segment 之後沿用目前 compact 規則：quality 不等於 100，且寬或高至少為 `minSize * 2` 時，寬高各以整數除以 2；再輸出 WebP。段落順序保持由上至下。
4. 先建立公式、重疊、尾段、padding、compact、最小尺寸與「不是長截圖」RED。至少一個 synthetic fixture 在每個預期邊界放置不同色帶／序號，assert raw 與 compact 後 segment dimensions、順序、相鄰段重疊內容、第一列、最後有效列及尾端 padding；另以 Python 版產物作視覺基準，但不要求 WebP bytes 相同。
5. 在瀏覽器 adapter 以單一有界 segment Canvas 逐段繪製與輸出 Blob，不先配置第二張完整長圖 Canvas；每段完成後即釋放 Canvas backing store，並遵守 64 MiB、8,192 × 65,535、96,000,000 pixels 與最多 100 段限制。
6. 對無法建立 Canvas、瀏覽器拒絕解碼、超限或任一 segment 失敗回傳固定錯誤；同一來源檔案不得留下部分 segments，不得自動重試或宣告成功。
7. 將成功來源的各段加入同一暫存 ProjectV2 與 asset store，維持目前順序及備註模式，整批結束後依原子性契約 commit。

完成條件：長截圖不呼叫 `/api/images/import-long-screen`；公式、每段尺寸、重疊、尾段、padding、compact、內容邊界及順序均有 fixture 證據；超限與任一段失敗不污染原專案。

### C4：單一 `.ipigeon` 專案檔與舊格式相容

前置：`dependency_install` 核准後才可安裝 ZIP 套件。

執行狀態（2026-08-24）：C4 原始碼、77 項前端測試、本機 Chromium 煙霧測試與修正版獨立聚焦複審均已完成。第一輪複審要求補強的 v2 WebP 實際內容／尺寸驗證與 clear/open late-commit 防護均已關閉，修正版複審結論為 `PASS`。C4 原始碼 checkpoint 已收束；C5 後續已另獲明確核准並完成。目標 Windows Edge 資料夾匯入原保留至 C10，最後依使用者決定先忽略 Windows 端而未執行，不據本機證據擴張宣稱。

1. 定義壓縮檔契約：根目錄必須有 `project.json`，圖片位於 `images/<asset-id>.webp`，拒絕絕對路徑、`..`、重複 canonical path、遺失資產、超量項目及解壓縮炸彈型輸入。
2. 先建立 archive roundtrip、損壞 JSON、未知 schema/version、path traversal、遺失／多餘圖片、重複 ID、容量／項目數上限與取消流程測試。
3. 儲存時從 ProjectV2＋asset store 產生單一 `.ipigeon` Blob 並觸發一次下載。
4. 開啟時讓使用者選擇單一 `.ipigeon` 檔，驗證後一次性替換目前專案與 asset store；驗證失敗不得破壞目前工作。
5. 以 `<input webkitdirectory>` 或等價 bounded adapter 支援現行 `.ipigeon/` 資料夾匯入，僅列為 Microsoft Edge／Chrome 相容入口；不要求寫回原資料夾。
6. 依本計畫「1.x JSON 相容契約」保留舊檔匯入；修正它只更新 legacy `images` state 而未完整接入 ProjectV2 的現況，使用去識別化 `v1` 真實輸出形狀 fixture 驗證 all-or-nothing migration、編輯、列印、另存新 `.ipigeon` 與再次開啟。
7. UI 明確說明純前端版下載的是單一專案檔，重新整理前應先儲存。

完成條件：新格式 roundtrip 保留順序、備註、旋轉、排版偏好與圖片 bytes；現有資料夾專案可在目標 Edge 讀取；取消或損壞檔案不清除目前專案。

### C5：另存圖片改為本機 ZIP

前置：C1、C2、C4 完成。

執行狀態（2026-08-24）：C5 原始碼、86 項前端測試、lint、TypeScript／Vite build 與修正版獨立聚焦複審均已完成。第一輪複審要求把完成 ZIP 的 512 MiB 上限從事後檢查改為逐資料塊（chunk）約束；修正後改用 `fflate.Zip`／`ZipPassThrough`，在保留資料塊前檢查並於超限時終止，修正版複審結論為 `PASS`。C5 原始碼 checkpoint 已收束；瀏覽器下載 UAT 原保留至 C10，最後依使用者決定先忽略 Windows 端而未執行。其後使用者已明確核准並完成 C6 原始碼切片。

1. 先建立排序、旋轉、JPEG 輸出、預設命名、備註命名、換行／非法字元正規化、重複檔名與空備註測試。
2. 從 asset store 讀 Blob，在 Canvas 套用 rotation，輸出 JPG Blob。
3. 依 ProjectV2 的 canonical item order 建立 ZIP；不得逐張觸發下載。
4. 重複檔名採穩定序號消歧，不覆蓋或靜默漏圖。
5. UI 改為「下載圖片 ZIP」，移除選擇資料夾與自動開啟資料夾宣稱。
6. 處理期間顯示進度；取消或單張轉換失敗時遵守固定整批失敗契約，不下載半成品。

完成條件：ZIP 圖片數、順序、旋轉與命名符合契約，沒有 pywebview 呼叫。

### C6：列印與 PDF 相容驗證

執行狀態（2026-08-24）：C6 已移除列印路徑的 legacy session 必要性，沿用 asset store object URL 與既有五種 `autoCollageLayout`，補強圖片 readiness 初始狀態、失敗警告、A4／備註換行及誠實 PDF 文案契約。91 項前端測試、lint、TypeScript／Vite build 與獨立聚焦複審均通過。目標 Windows Edge 的實際預覽、分頁及系統列印對話框 UAT 原保留至 C10，最後依使用者決定先忽略 Windows 端而未執行；其後使用者另行核准 C7 原始碼與 `docx` dependency。

1. 保留目前五種 `autoCollageLayout`，不另建 PDF renderer。
2. 將列印預覽的圖片來源切換成 asset store object URL。
3. 執行現有 print layout 純函式測試與 A4 CSS 檢查。
4. 在目標 Edge 以直式、橫式、小圖與混合樣本驗收預覽、頁數、圖片 readiness、備註換行及 `window.print()`。
5. PDF 只宣稱「可透過系統列印對話框另存」，不宣稱程式能控制目的路徑或繞過機關列印政策。

完成條件：列印主流程與目前前端版型一致，圖片載入失敗仍有清楚警告。

### C7：Word 有界可行性驗證與 GO／NO-GO

前置：`dependency_install`、`word_compatibility_uat` 分別核准。

執行狀態（2026-08-24）：使用者已核准 C7 原始碼與單一 `docx` dependency，已安裝 exact `docx@9.7.1`，建立獨立 Blob exporter、固定 20 張 synthetic fixture 規格及來源契約測試；最新 94 項前端測試、lint 與 build 通過。fixture 規格 canonical SHA-256 為 `ac8425edf619c598b4eb6d2f178a6281035ca0ee3cf080f3bc9da547f5b84598`，已由 source constant 與測試固定。第一輪聚焦複審為 `REQUEST_CHANGES`，其 deterministic hash、已旋轉 JPEG API、有效 JPEG 測試、200 張 item count 上限及 test runner exit code 五項問題已修正或以 fresh exit 0 排除；修正版獨立聚焦複審 `deleg_c0931cf1` 結論為 `PASS`，未發現阻擋問題或範圍漂移。macOS 27.0／HeadlessChrome 150 預檢已產生固定 20 張 fixture 與六頁 DOCX，Word for Mac 16.112.1 可開啟。使用者決定將 Windows 11／Edge／Microsoft 365 Word 正式驗證延後，並明確接受在未取得目標環境 PASS 前直接接入瀏覽器 Word exporter；此決策不等同 Word 相容性 PASS。C8 source-write 與 provisional Word 接線已核准執行。

本 checkpoint 最多進行一個 JavaScript `docx` 套件方案，不比較多個大型 renderer，也不手寫完整 OOXML。

1. 建立固定 20 張 synthetic fixture：landscape 使用 1600×900、portrait 使用 900×1600，單張不超過 8 MiB、總計不超過 80 MiB；包含中文、多行及空備註，且安排後能覆蓋 `landscape-2`、`portrait-large-2`、`portrait-small-6`、`mixed-landscape1-small3`、`mixed-small3-landscape1` 五種 template。記錄 fixture SHA-256。
2. 先用最小獨立 exporter 產生上述五種 template，不先接 UI。
3. 驗證標題、A4、欄寬、列高、合併儲存格、編號、備註、圖片旋轉、空 slot 與跨頁連續編號。
4. 在 Windows 11、至少 8 GiB RAM、當次穩定版 Edge 與 Microsoft 365 desktop Word，用同一 fixture 同時產生現行 Python Word 與純前端 Word；result 記錄 CPU、RAM、Edge 與 Word 完整版本、計時起訖及 renderer working set 量測方式。
5. GO 條件全部必須成立：產生時間不超過 60 秒；Edge renderer working set 相對開始前增加不超過 1.5 GiB；沒有崩潰、OOM 或超過 10 秒無回應；Word 開啟時沒有修復警告；五種 template 的頁數與 slot 分配一致；所有圖片、旋轉、編號、中文／多行／空備註完整；沒有欄寬塌陷、圖片越界或非預期跨頁。
6. NO-GO 條件：任一 GO 條件失敗、套件不能穩定控制必要表格結構、目標 Word 無法開啟，或需手寫大量 OOXML 才能達標。任何主要版型失敗即整體 NO-GO，不只停用該版型。
7. GO 時才接入 `SaveWord.tsx` 並加入 exporter 測試；NO-GO 時移除／隱藏 Word tab，顯示「純前端測試版暫不支援 Word，請使用列印／PDF」，並在 result 記錄 fixture 與失敗條件。

完成條件：必須產生明確 GO 或 NO-GO，不允許以「之後再修」保留一個已知會產生錯誤文件的按鈕。

### C8：移除正式執行階段的 HTTP／pywebview 依賴

執行決策（2026-08-24）：使用者核准 C8 source-write，並選擇保留可操作的 Word 入口、直接接入 C7 瀏覽器 exporter；接受目標 Windows Word UAT 尚未完成的風險。實作與結果文件必須持續標示 Windows 相容性未驗證，不得把此風險接受改寫成 GO／PASS。

執行狀態（2026-08-24）：C8 第一輪獨立整合複審 `deleg_7ab7be8f` 為 `REQUEST_CHANGES`，唯一 Important 問題是版本回應缺少執行階段資料邊界；已以 TDD 補上必要欄位、日期、HTTP(S) 下載網址驗證及新分頁 `rel` 防護。修正後父層與聚焦複審 `deleg_c52f6504` fresh 驗證為前端測試 101/101、focused 5/5、lint、build、`git diff --check`、cached check 與 staged guard全部通過，聚焦複審結論為 `PASS`；C8 原始碼 checkpoint 完成，等待 C9 另行核准。目標 Windows Word UAT 仍延後至 C10，不得宣稱相容性 PASS。

1. 搜尋並移除前端正式路徑中的 `window.pywebview`、`requestJson`、`/api/` session URL、`select_path`、`save_docx` 與 `save_images` 呼叫。
2. 更新或刪除 `apiClient.ts`、`imageApi.ts`、`projectApi.ts` 與 pywebview 全域型別。
3. 版本檢查保留為唯一預期外部 API：無 body、無 credentials、無專案 header 的 `GET https://api.pigeonhand.tw/web/apps/1/`；加上固定逾時與失敗靜默降級，不上傳任何應用狀態。
4. 前端診斷不再透過 pywebview bridge；保留固定低敏感本機錯誤處理，不新增遠端 telemetry。
5. 更新 `package.json`，讓純前端驗證不需要 Python；`pyproject.toml`、Python source 與 `main.spec` 暫留作回退基準，不進入 `dist/`。
6. 驗證 `dist/` 的 HTML／JavaScript 不含 localhost API 位址、`127.0.0.1:18765`、pywebview API 名稱或圖片上傳 endpoint。

完成條件：正式 `dist/` 是自足靜態前端，使用期間不啟動或要求本機 HTTP server；開發用 Vite 不得被描述成正式 runtime。

### C9：靜態部署與資安護欄

執行決策（2026-08-24）：使用者明確核准開始 C9，範圍包含靜態部署設定與文件、正式產物／Blob 下載護欄，以及有界的瀏覽器網路攔截驗證；不包含正式部署、commit、push、merge 或 ADR cutover。

1. 更新 `vite.config.ts`，使 production build 可部署於指定 HTTPS 靜態路徑；不承諾直接雙擊 `file://index.html`。
2. 建立 `docs/deployment/pure-frontend-static-hosting.md`，說明 MIME、SPA fallback（若仍需要）、Brotli／gzip、hashed asset 長快取、`index.html` 短快取及 HTTPS。
3. 文件提供內容安全政策建議：腳本／樣式／字型 self-host；`connect-src` 只允許同源與既有版本 API；禁用不必要的第三方來源。
4. 以瀏覽器網路面板或同時攔截 XMLHttpRequest／fetch 的自動攔截器執行：匯入、編輯、專案儲存／開啟、圖片 ZIP、Word（若 GO）與列印預覽。自動資料請求只允許靜態 GET 與固定版本 GET；`blob:`／object URL 讀取另列為本機證據，不算網路。任何其他自動請求均為 NO-GO。既有聯繫、回饋、新版資料夾、作者網站、原始碼及經驗證的更新下載網址，只能在使用者明確點擊後作受控外部導覽，不承載專案資料，並與應用資料外送分開記錄。
5. 驗證下載的 `.ipigeon`、ZIP、Word 均由 Blob URL 產生，不從伺服器下載使用者內容。
6. 正式部署保持關閉；本 checkpoint 只產生可部署 `dist/` 與部署文件。

完成條件：靜態主機只需提供前端資源，不需 Python、Node runtime、資料庫或寫入目錄；資安邊界可由網路證據驗證。

執行結果（2026-08-24）：C9 原始碼、正式產物探針、部署文件及有界 Chromium 網路驗證已完成。獨立整合複審先後發現產物探針 false PASS、外部導覽未集中、子路徑尾斜線、protocol-relative／unquoted URL、過寬 metadata allowlist 與 optional-call 繞過；三輪最小修正後，最終聚焦複審 `deleg_017e7eeb` 為 `PASS`。本結果只完成 C9 source/build checkpoint，不代表正式部署或 C10 Windows Edge／Microsoft 365 Word UAT 通過。

### C10：回歸、目標瀏覽器 UAT 與誠實收束

執行狀態（2026-08-24）：使用者已明確核准 C10。已在目前 macOS arm64 工作區完成 108/108 前端測試、lint、TypeScript／Vite production build、正式產物探針、差異空白檢查與 staged 檔護欄，全部 exit 0。當前執行主機沒有可操作的目標 Windows 11／Microsoft Edge／Microsoft 365 Word；使用者隨後明確決定先忽略 Windows 端，因此 C10 以 `partial` 誠實收束，目標 Windows／Word UAT 記為未執行且不構成相容性 PASS。這項決定不會開啟部署、commit、push、merge 或 ADR cutover。

1. 執行前端 unit tests、lint、TypeScript build 與 Vite production build。
2. 以最新版 Microsoft Edge 為主、Chrome 為次，逐項驗收：一般匯入、拖放、長截圖、備註、滾輪保存、旋轉、排版、排序、列印、專案 roundtrip、舊資料夾專案匯入、1.x JSON、圖片 ZIP、新版本失敗降級與 Word GO／NO-GO 結果。
3. 壓力樣本至少涵蓋：20 張一般圖片、50 張一般圖片、1 張超長截圖、混合直橫式、重複備註檔名與一個損壞專案檔。樣本不得提交私人圖片。
4. 依資源限制表記錄作業系統、CPU、RAM、瀏覽器／Word 完整版本、fixture hash、案例、結果、完成秒數、renderer working set 起訖與是否崩潰／OOM／超過 10 秒無回應；不把 macOS Chrome 成功擴張成機關 Windows Edge PASS。
5. 建立 result，逐項對照本計畫功能矩陣。Word 若 NO-GO、資料夾寫回不支援、自動開檔不存在，必須列為產品限制而非未說明缺陷。
6. 純前端版本獲使用者採用後，才建立 ADR-0002、更新現行架構並決定是否 supersede ADR-0001；測試分支成功本身不自動改變 `dev` 的現行架構。
7. 更新 STATE：執行證據不完整時 result 可標記 `partial`，但 workstream 不使用不存在的 `partial` status；未採用則將 workstream 標記 `cancelled`，已完成評估則標記 `completed`，並依治理規則從 active workstreams 移除、保留 recent result。採用但尚未 merge／deploy 則保持 `waiting_approval`；只有另行核准並完成生命週期後才關閉 workstream。

完成條件：result 能清楚回答「保留了什麼、替代了什麼、做不到什麼、在哪些瀏覽器實測」，且沒有 commit、push、merge 或部署副作用。

## 測試與驗證命令

實作時依 checkpoint 逐步執行，不可等到最後一次跑完。

### 基本前端驗證

```bash
pnpm run test:frontend
pnpm run lint
pnpm run build
```

預期：所有命令 exit 0。若完整前端測試仍受既有 staged／基線失敗影響，必須另跑本計畫聚焦測試並在 result 保留完整 suite 的真實 RED，不得宣稱全量 PASS。

### 純前端正式產物探針

以可重複腳本或 Node test 驗證：

- `dist/index.html` 存在。
- 產物中沒有 `127.0.0.1:18765`、`/api/images/import`、`/api/project/save`、`window.pywebview`。
- 瀏覽器操作沒有圖片／專案 POST。
- `.ipigeon` roundtrip 圖片 hash、ProjectV2 內容與 item order 一致。
- 圖片 ZIP 的檔案數、順序及名稱一致。

不得使用單純字串探針代替瀏覽器 UAT；字串探針只作正式執行階段依賴護欄。

### 本機瀏覽器煙霧測試

只有 `local_browser_smoke` gate 核准後，才可啟動 Vite development／preview server。它是開發驗證工具，不是交付架構，也不證明機關環境允許 localhost。

```bash
pnpm run dev
# 或
pnpm run preview
```

啟動後必須由 Hermes tracked process 管理並在驗證後停止，不可留下背景 server。

### 文件專用驗證

```bash
git diff --check
git status --short --branch
git diff --cached --name-only
```

另以機械檢查確認 plan frontmatter、STATE pointer、repository-root-relative 路徑及 staged-file guard。既有 staged `tests/newVersionDismissal.test.ts` 必須保持 staged，內容 hash 不得因本計畫改變。

## 驗收條件

### AC-1：執行階段純前端

正式 `dist/` 可由 HTTPS 靜態主機提供；不需要 `.exe`、pywebview、FastAPI、uvicorn、Python、Node server runtime 或本機監聽連接埠。

### AC-2：零圖片與專案上傳

一般匯入、長截圖、專案開啟／儲存、圖片 ZIP、Word（若 GO）及列印期間，XMLHttpRequest／fetch 沒有圖片或專案 POST／PUT／PATCH／DELETE。唯一外部 API 是無 body、無 credentials、無專案 header 的 `GET https://api.pigeonhand.tw/web/apps/1/`；`blob:` URL 本機讀取與使用者自行點擊更新連結必須分開記錄。

### AC-3：核心編輯相容

多圖、拖放、備註、旋轉、排版偏好、排序、滾輪保存、預覽、全部清除及五種自動拼貼行為維持可用。

### AC-4：本機圖片處理

圖片壓縮及長截圖切割在瀏覽器完成；部分失敗、全失敗、超限與取消有固定且不破壞既有專案的結果。

### AC-5：專案可攜性

單一 `.ipigeon` 檔能在資源限制內 roundtrip ProjectV2 與圖片；現行 `.ipigeon/` 資料夾至少能在目標 Edge 匯入；符合具名 1.x JSON 契約的舊檔可 all-or-nothing 轉入 ProjectV2，並完成編輯、列印、另存與再次開啟 assertions。

### AC-6：輸出相容

列印／PDF 可用；圖片以 ZIP 下載且順序、旋轉、命名正確；Word 必須依 C7 得到 GO 後才保留，NO-GO 時 UI 與文件要明確告知不支援。

### AC-7：記憶體與生命週期

圖片不長期保存為 Base64；object URL 在替換、刪除、清空與卸載時回收；所有操作遵守具名資源限制、concurrency `1`、AbortSignal 與 all-or-nothing／部分成功契約。固定 50 張 fixture 在參考 Windows Edge 環境須於 120 秒內完成，renderer working set 增量不超過 1.5 GiB，且不崩潰、OOM 或超過 10 秒無回應。

### AC-8：部署與隱私文件

部署文件能讓一般靜態主機提供 `dist/`，並清楚說明快取、HTTPS、內容安全政策、外部版本 GET、零上傳與瀏覽器本機處理邊界。

### AC-9：回歸證據

前端測試、lint、build、產物探針與目標瀏覽器 UAT 有實際結果；未執行 Windows Edge、Word 或正式部署時不得擴張成 PASS。

### AC-10：治理與 Git 邊界

同 scope result、plan lifecycle 與 STATE 一致；既有 staged 檔受保護；沒有未核准的 commit、push、merge、正式部署或 ADR cutover。

## 風險與停止條件

1. 若目標 Edge 禁止所需 File／Blob／Canvas／下載能力，停止並將純前端方案判定為不適用；不得改用圖片上傳後端補洞。
2. 若長截圖必須處理的實際尺寸持續超過瀏覽器安全上限，記錄支援上限並提供清楚錯誤；不建立複雜 WebAssembly pipeline。
3. 若單一 `.ipigeon` 壓縮檔造成不可接受的記憶體高峰，先降低一次處理規模或採串流能力；仍無法達標就限制專案規模並誠實記錄。
4. 若 JavaScript Word 無法在一個 bounded checkpoint 達到五種版型基本相容，執行 NO-GO，移除純前端 Word 功能，不手寫完整 OOXML。
5. 若版本 API CORS／機關網路不可用，新版本提示靜默停用；不得影響主功能。
6. 若任何實作需要伺服器接收圖片、專案或輸出內容才能成立，視為超出純前端契約並停止。
7. 若發現必須改動既有 staged `tests/newVersionDismissal.test.ts` 或其他不明 dirty hunk，停止並向使用者確認擁有權。

## 核准閘門與下一步

目前已完成 C0–C9 原始碼 checkpoint 與 C10 自動回歸；C4 的目標 Edge 舊資料夾匯入、C5 的目標 Edge ZIP 下載／解壓、C6 的目標 Edge 列印／PDF，以及 C7／C8 的 Microsoft 365 Word 相容驗收原保留至 C10，但已依使用者決定先忽略 Windows 端而結束，不構成相容性 PASS。

使用者已於 2026-08-24 明確核准 C10，並在自動回歸完成後決定先忽略 Windows 端。C10 因此以 `partial` 收束；目標 Windows Edge／Microsoft 365 Word UAT 明確記為未執行，不得擴張為相容性 GO／PASS。若未來要補做，應另行開啟新的目標環境驗收工作線。

正式部署、commit、push、merge 與 ADR cutover 仍是獨立關閉閘門，不由 C10 核准開啟。

## 計畫審查紀錄

- 2026-08-24 第一輪 Plan Sanity Review：`REQUEST_CHANGES`。阻擋項目為資源／記憶體界線未量化、1.x JSON 契約不足、長截圖尾段與 overlap 語意不足、Word 效能門檻不可驗收，以及 STATE 留有非法 `partial` workstream status。
- 已依第一輪審查補上具名資源限制與原子性／取消契約、1.x JSON schema／fixture／ProjectV2 投影、長截圖公式與 padding 差異、Word 固定環境與 GO／NO-GO 門檻、test discovery、精確 allowlist、固定版本 API 網路邊界及 workstream closure 規則。
- 2026-08-24 聚焦 Plan Sanity Re-review：`PASS`，無阻擋問題或必要修正；審查範圍只證明計畫與治理文件可作為後續分階段契約，不代表 runtime、browser、Word、build、lint 或測試已通過。
- 2026-08-24 C0–C3 已執行。第一輪實作聚焦複審為 `REQUEST_CHANGES`：長截圖暫存資源界線、部分成功摘要及 UI 取消接線有阻擋／重大問題；已補上逐來源／逐產物容量、`AbortSignal` 與使用者可見略過摘要，詳見同 scope result。
- 2026-08-24 C0–C3 修正版聚焦複審：`APPROVED`。原三項均已關閉，沒有新增阻擋或重大 correctness 問題；此結論只涵蓋 C0–C3，不涵蓋 C4–C10。
- 2026-08-24 C6 獨立聚焦複審 `deleg_be7bc77a`：`PASS`。五種版型、asset store object URL、無 session 列印路徑、圖片 readiness／失敗警告、A4／換行 CSS 及 PDF 邊界均通過；Windows Edge／browser UAT 當時保留至 C10，最後依使用者決定先忽略 Windows 端而未執行。
