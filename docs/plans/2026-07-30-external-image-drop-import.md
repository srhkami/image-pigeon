---
type: plan
id: plan-image-pigeon-external-image-drop-import-2026-07-30
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-07-30
execution:
  status: completed
  current_checkpoint: closed
  route: hermes-native-delegation
result: docs/result/2026-07-30-external-image-drop-import-result.md
plan_review:
  status: passed
  initial_verdict: request_changes
  initial_reviewed_at: 2026-07-30
  focused_rereview_verdict: pass
  focused_rereviewed_at: 2026-07-30
code_review:
  status: passed
  first_verdict: request_changes
  focused_rereview_verdict: pass
  passed_at: 2026-07-30
gates:
  source_write: approved_by_user_2026-07-30
  automated_verification: approved_by_user_2026-07-30
  browser_uat: passed_2026-07-30
  pywebview_uat: user_attested_complete_2026-07-30
  commit: closed
  push: closed
---

# 外部圖片拖放導入功能

## 目標

讓使用者從 Finder／檔案總管將外部圖片拖入程式視窗時，看見明確的拖放提示；放開後只暫存檔案並開啟既有「導入圖片」對話框，不自動呼叫匯入 API。使用者仍可編輯預設備註與壓縮選項，並在按下「新增」後才正式導入圖片。

## 已確認的產品契約

1. 拖放是「選取圖片」的替代入口，不是自動上傳或自動新增。
2. 外部圖片進入編輯器視窗時顯示全畫面提示層：
   - 主文案：「拖曳到此處導入圖片」
   - 副文案：「放開後可設定預設備註，不會立即新增」
3. 放開有效圖片後，開啟既有「導入圖片」對話框並停留在「一般圖片」頁籤。
4. 對話框顯示已帶入的圖片數量與檔名，使使用者能確認本次選取內容。
5. 使用者仍可修改：
   - 圖片預設備註；
   - 圖片壓縮品質；
   - 壓縮最小尺寸；
   - 是否使用檔名作為每張圖片的備註。
6. 只有按下「新增」後才能呼叫既有 `importImages()` 流程。
7. 關閉或取消對話框時清除本次拖入但尚未送出的檔案。
8. 側邊欄原有「導入圖片」按鈕與檔案選擇器流程必須維持可用。

## 實作策略

### 控制權與狀態

將導入對話框改為受控元件（controlled component）：

- `App` 擁有對話框開關與待確認的外部 `File[]`。
- `App` 負責辨識外部檔案拖曳、顯示提示層、接收 drop，以及開啟對話框。
- `Sidebar` 的「導入圖片」按鈕只發出開啟請求。
- `ModalImport` 接收顯示狀態、關閉 callback 與待確認檔案。
- `UploadMultiple` 將拖入檔案放入待送出選取狀態，仍由既有表單送出流程呼叫 `importImages()`。

不使用自訂全域 DOM event、命令式 ref 或直接寫入 `<input type="file">.files`，避免瀏覽器安全限制與狀態不同步。

`ModalImport` 的頁籤改為受控狀態。每次從側邊欄按鈕或外部 drop 開啟時，都在 modal 顯示前重設為「一般圖片」；不能只依賴目前 radio 的 `defaultChecked`。外部 drop 的待確認檔案設定、頁籤重設與 modal 開啟須由同一個 orchestration path 依序完成，避免沿用先前的「長截圖分割」或「讀取舊檔」狀態。

### 拖曳事件邊界

- 只在 `DataTransfer` 明確包含外部檔案時攔截 `dragenter`、`dragover`、`dragleave`、`drop`。
- 使用 drag-depth counter 或等價機制避免游標經過子元素時提示層閃爍。
- 只有外部檔案拖曳才執行 `preventDefault()`，避免影響文字操作與現有 `@dnd-kit` 圖片排序。
- `print-preview` 視圖不啟用外部圖片拖放。
- drop 後立即關閉提示層；若沒有有效圖片，不開啟對話框。

### 檔案驗證

沿用 `src/features/Upload/fileAccept.ts` 的支援格式：

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.bmp`
- `.jfif`

拖放驗證以不分大小寫的副檔名為主要依據，不能只依賴可能為空值或平台差異較大的 MIME type。資料夾與不支援檔案不進入待送出清單：

- 部分有效：保留有效圖片並提示略過數量。
- 全部無效：不開啟對話框並顯示錯誤提示。
- 不默默接受或默默丟棄無效項目。

本輪不新增重複檔案自動去重；使用者明確重複選取的圖片維持既有可導入語意。

## Allowed paths

### 執行來源

- `src/App.tsx`
- `src/layout/Sidebar.tsx`
- `src/layout/AlertLoading.tsx` — 僅補 browser-safe pywebview bridge guard；這是 independent review 發現的 AC-10a 必要修正，不改 loading UI 或 pywebview 存在時的進度更新行為。
- `src/features/Upload/ModalImport.tsx`
- `src/features/Upload/UploadMultiple.tsx`
- `src/features/Upload/fileAccept.ts`
- `src/features/Upload/ExternalImageDropOverlay.tsx`（新檔）
- `src/features/Upload/externalImageDrop.ts`（新檔）

### 回歸測試與專案文件

- `tests/externalImageDrop.test.ts`（新檔）
- `STATE.md`
- `docs/plans/2026-07-30-external-image-drop-import.md`
- `docs/result/2026-07-30-external-image-drop-import-result.md`（執行後建立）

若實作證明必須修改其他檔案，先回報 `SCOPE_CHANGE_REQUIRED`，不得自行擴張。

## Dirty worktree 保護

規劃時工作樹已有以下既存變更：

- `src/utils/log.ts`：已修改，不屬本計畫範圍，禁止碰觸。
- `STATE.md`：本規劃 checkpoint 已修改，是 allowed existing dirty target；後續只可精確更新本 workstream 的 checkpoint、gate 與 lifecycle 欄位，不得重寫或刪除其他 current/recent 狀態。
- `docs/plans/2026-07-30-external-image-drop-import.md`：本規劃 checkpoint 新增且目前未追蹤；後續只可做本計畫的 review、execution 與 lifecycle 精確校正。
- `docs/plans/2026-07-29-wheel-remark-save.md`：未追蹤既存成果，禁止覆寫。
- `docs/result/2026-07-29-wheel-remark-save-result.md`：未追蹤既存成果，禁止覆寫。
- `src/features/ImagePreview/wheelNavigation.ts`：未追蹤既存來源，禁止覆寫。
- `tests/wheelNavigation.test.ts`：位於既存未追蹤 `tests/` 目錄，禁止覆寫；本計畫只可新增 `tests/externalImageDrop.test.ts`。

開始實作前須重新擷取完整 dirty baseline，並保存 `STATE.md` 與本計畫的完整 snapshot／SHA-256。每個 checkpoint 都要比較 branch、staged 狀態、既存 dirty 路徑與內容；`STATE.md` 與本計畫以「baseline snapshot + 本 checkpoint 明確 transform」驗證，不得僅因在 allowlist 就整份覆寫。不得 reset、clean、stage 或還原使用者變更。

由於 `git diff --check` 不涵蓋未追蹤檔案，scope guard 還須直接列舉本 checkpoint 新增的 untracked plan、result、test 與 source files，以不寫入 index 的 deterministic 檢查驗證尾端空白、NUL byte、換行結尾與預期內容標記；檢查器不可使用 `git add -N`、暫存 stage 或其他 index mutation。

## Non-scope

- 後端 FastAPI endpoint、session store、圖片壓縮服務與專案格式。
- 長截圖分割與舊 JSON 讀取流程。
- 圖片排序演算法或 `@dnd-kit` 行為調整。
- 自動上傳、自動送出或 drop 後立即呼叫 API。
- 資料夾遞迴掃描、剪貼簿貼圖、URL 圖片導入。
- 新增第三方套件或測試框架。
- changelog 與版本號更新；`src/utils/log.ts` 保持不動。
- production、deploy、外部服務、資料庫、commit、push。

## 執行順序

依使用者要求採「先完成來源改動，再測試效果」；本計畫不要求先建立失敗測試。測試仍是交付必要條件，但安排在來源實作完成後。

### Checkpoint 0：實作前基線與契約確認

1. 重新讀取 `STATE.md`、本計畫及所有目標來源。
2. 以 raw NUL porcelain 擷取 dirty baseline，保護既存 tracked／untracked／staged 狀態。
3. 全域搜尋拖放事件、`ModalImport`、`UploadMultiple`、`importImages` 與相關 probe/test usages。
4. 確認沒有新增 dependency 的需要。
5. 確認 source-write gate 已由使用者明確開啟；否則停止。

完成條件：範圍與 baseline 可歸因，沒有未解 scope 衝突。

### Checkpoint 1：來源實作

1. 在 `src/features/Upload/externalImageDrop.ts` 建立純函式：
   - 判斷事件是否為外部檔案拖曳；
   - 依既有支援副檔名分割有效與無效檔案；
   - 提供 drag-depth 的可測試狀態轉換或等價純邏輯。
2. 在 `src/features/Upload/ExternalImageDropOverlay.tsx` 建立無副作用提示層元件：
   - 覆蓋可編輯視窗；
   - 使用本計畫確認的主／副文案；
   - 不攔截已完成 drop 後的正常操作。
3. 在 `src/App.tsx` 接線全域外部檔案拖放：
   - 僅 editor 模式啟用；
   - 維護提示層、待確認檔案與受控 modal 狀態；
   - 有效 drop 只開 modal，不呼叫 API；
   - 無效檔案使用既有 toast 風格提示。
4. 在 `src/layout/Sidebar.tsx` 將導入按鈕改為呼叫受控開啟 callback，保留原按鈕外觀與位置。
5. 在 `src/features/Upload/ModalImport.tsx` 接收受控狀態與待確認檔案，確保外部 drop 開啟時預設為「一般圖片」。
6. 在 `src/features/Upload/UploadMultiple.tsx` 統一檔案選擇器與外部拖入檔案的待送出狀態：
   - 顯示數量與檔名；
   - 允許檔案選擇器重新選取；
   - 驗證空清單；
   - 按下「新增」前不得呼叫 `importImages()`；
   - 成功或取消後清除待確認檔案。
7. 將 `window.pywebview.updateProgress(done)` 改為 browser-safe 的可選 bridge 呼叫：pywebview bridge 存在時維持進度更新；Vite browser 不存在 bridge 時安全略過，不能因此中斷匯入。此 guard 只處理進度通知，不得建立假 pywebview runtime 或改變匯入結果。
8. 檢查 diff，確認未更動 backend、排序功能、長截圖與既有 dirty 檔。

完成條件：來源契約完整接線，尚不宣稱瀏覽器或 pywebview 效果通過。

### Checkpoint 2：來源完成後補回歸測試與靜態驗證

1. 新增 `tests/externalImageDrop.test.ts`，至少覆蓋：
   - 外部檔案拖曳辨識；
   - 非檔案拖曳不啟用提示；
   - 支援副檔名不分大小寫；
   - 混合有效／無效檔案的分割結果；
   - 全部無效時有效清單為空；
   - drag-depth 不因子元素 `dragleave` 提前歸零。
2. 以 source contract 或可在現有 `node --test` 環境執行的純邏輯測試，驗證：
   - modal open orchestration 每次都先重設一般圖片頁籤；
   - browser 沒有 `window.pywebview` 時，進度通知安全略過；
   - bridge 存在時仍呼叫 `updateProgress(done)`。
3. 執行：
   - `pnpm run test:frontend`
   - `pnpm run lint`
   - `pnpm run build`
   - `git diff --check`
4. 對所有本 checkpoint 未追蹤新檔執行不寫入 index 的 whitespace／NUL／EOF 檢查，並確認檢查範圍包含 plan、result、test 與兩個新 source files。
5. 確認完整前端測試仍包含並通過既有 `tests/wheelNavigation.test.ts`，不得以新測試取代舊回歸契約。
6. 執行 allowed-path／dirty-baseline guard，確認 scope 外內容與 staged 狀態未漂移，並以 snapshot + exact transform 驗證 `STATE.md` 與本計畫。

完成條件：命令皆為 fresh exit 0；若 full command 因既存 scope 外問題失敗，只能記錄具體 blocker，不得擴張修正範圍或宣稱完整 PASS。

### Checkpoint 3：效果驗證

此 checkpoint 需要獨立 runtime 核准；自動驗證不等同實際拖放驗收。

#### 瀏覽器 UAT

以 Vite 開發模式人工驗證：

1. 拖入單張支援圖片，提示層顯示且不閃爍。
2. 放開後開啟「導入圖片／一般圖片」，顯示正確檔名與數量。
3. 先開啟「長截圖分割」或「讀取舊檔」、關閉 modal，再以外部 drop 開啟；頁籤必須重設為「一般圖片」。
4. 放開後尚未按「新增」時，project item count、session 與 network import request 均未變化。
5. 在沒有 `window.pywebview` bridge 的 Vite browser 中修改預設備註後按「新增」，匯入不因進度通知而中斷；此項只算 browser UAT，不算 pywebview 實機證據。
6. 勾選「使用檔名作為備註」時維持既有覆蓋語意。
7. 關閉 modal 後重新開啟，不殘留上次未送出檔案。
8. 混合拖入支援與不支援檔案時，只有有效圖片進入清單並有略過提示。
9. 只有無效檔案或資料夾時，不開啟 modal。
10. 既有按鈕＋檔案選擇器仍可完成多檔導入。
11. 排序模式拖曳圖片時，不顯示外部檔案提示層。
12. print-preview 視圖不啟用外部拖放。

#### pywebview UAT

在 macOS pywebview 實機重做至少以下案例：

1. Finder 單張與多張圖片拖放。
2. 提示層與 modal 開啟。
3. 放開後不自動匯入。
4. 修改預設備註後送出成功。
5. 取消後不殘留待送出檔案。
6. 視窗不會因 drop 導覽到本機圖片。

若專案發行 Windows 版本，Windows 打包程式驗證列為後續 release gate，不阻擋本輪 macOS source checkpoint。

完成條件：將實際環境、步驟與結果寫入 result；未執行的 runtime 不得標為 PASS。

### Checkpoint 4：獨立審查與生命週期校正

1. 建立 `docs/result/2026-07-30-external-image-drop-import-result.md`，逐項對照驗收條件與實際證據。
2. 派一位 fresh-context reviewer 檢查：
   - drop 不會自動呼叫 API；
   - 內外部拖曳隔離；
   - modal 暫存／取消／送出生命週期；
   - 原檔案選擇器與既有測試未被取代；
   - dirty baseline 與 allowed paths 沒有漂移。
3. 若 runtime UAT 尚未執行，execution/result 保持 `partial`，不得關閉完整 workstream。
4. 審查與必要修正完成後，重新執行受影響測試、lint、build、`git diff --check` 與 scope guard。
5. 校正 plan lifecycle、result 與 `STATE.md`；完整完成後才從 active workstream 移除並加入 bounded `recent_results`。
6. 不 commit、不 push；若使用者日後要求，另開 gate。

## Acceptance criteria

- AC-1：只有外部檔案拖曳會顯示提示層；既有圖片排序拖曳不會觸發。
- AC-2：提示層使用已確認文案，且跨子元素移動時不明顯閃爍。
- AC-3：有效圖片 drop 後開啟「導入圖片」的「一般圖片」頁籤並顯示檔名與數量。
- AC-3a：不論先前選擇哪個導入頁籤，每次重新開啟或外部 drop 都以受控狀態重設為「一般圖片」。
- AC-4：drop 到按下「新增」之前，不呼叫 `importImages()`，不增加 project items，也不建立新的 session import 結果。
- AC-5：使用者可在送出前修改預設備註、品質、最小尺寸與檔名備註模式。
- AC-6：按下「新增」後沿用現有 batching、project/session 更新與 remark adapter 流程。
- AC-7：取消或關閉 modal 會清除未送出檔案；成功送出後也不殘留。
- AC-8：支援格式與既有檔案選擇器一致；混合無效檔案有明確略過提示，全部無效時不開 modal。
- AC-9：既有側邊欄按鈕與檔案選擇器導入流程維持可用。
- AC-10：print-preview 不啟用外部圖片拖放，drop 不會使 WebView 導覽到本機檔案。
- AC-10a：Vite browser 缺少 `window.pywebview` 時，進度通知安全略過且匯入流程不中斷；此證據不替代 pywebview 實機 UAT。
- AC-11：`pnpm run test:frontend`、`pnpm run lint`、`pnpm run build`、`git diff --check` 與 dirty scope guard 通過。
- AC-12：macOS pywebview UAT 的結果被誠實記錄；未執行時整體只能是 partial，不能以瀏覽器/build 證據替代。

## 風險與停止條件

### 主要風險

- pywebview 在不同平台 WebView 引擎上的 external file-drop 行為可能不同。
- 全域 drag handler 若判斷過寬，可能干擾 `@dnd-kit` 排序。
- `dragenter`／`dragleave` 的子元素事件可能造成提示層閃爍。
- React Hook Form 的 file input 不適合由程式直接改寫 `FileList`，因此需以獨立 `File[]` 狀態統一送出來源。
- modal 關閉與成功送出若未共用清除路徑，可能留下陳舊檔案。

### Fail-closed 停止條件

- 必須改動 allowed paths 以外來源。
- 必須新增第三方 dependency 或測試框架。
- 外部 drop 無法在不破壞圖片排序的情況下可靠辨識。
- pywebview 只能取得本機路徑而不能沿用現有 `File`／multipart 流程。
- 發現 scope 外 dirty/staged 漂移。
- 驗證需要啟動未核准的 browser／pywebview runtime、production、外部服務、DB、commit 或 push。

遇到停止條件時回報 `SCOPE_CHANGE_REQUIRED` 或 `BLOCKED`，不得自行擴張。

## 核准與下一步

本計畫建立本身不代表 source-write、browser UAT、pywebview UAT、commit 或 push gate 已開啟。

下一步是由使用者明確核准 Checkpoint 0–2 的來源寫入與自動驗證。Checkpoint 3 的瀏覽器／pywebview 效果驗證需在來源 checkpoint 完成後再取得或確認 runtime 核准。

## Plan review history

### 2026-07-30 初次 Plan Sanity Review

- Verdict：`REQUEST_CHANGES`
- 已處理：補入 browser-safe pywebview progress guard 與驗收界線。
- 已處理：將一般圖片頁籤改為每次開啟明確 reset 的受控狀態契約。
- 已處理：將 `STATE.md`／本計畫納入既有 dirty target snapshot + exact-transform 保護，並補入不寫 index 的 untracked 檢查。
- 初次 verdict 不視為 PASS；修正後已完成 focused rereview。

### 2026-07-30 Focused Plan Sanity Rereview

- Verdict：`PASS`
- 三項初次 Required Fixes 均通過。
- 審查範圍僅為計畫與 STATE 一致性；未執行 source、test、lint、build、browser 或 pywebview runtime。
- 下一步：等待使用者明確核准 Checkpoint 0–2 的來源寫入與自動驗證。
