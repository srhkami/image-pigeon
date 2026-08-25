---
type: result
id: result-image-pigeon-pure-frontend-version-2026-08-18
status: partial
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-pure-frontend-version-2026-08-18
created_at: 2026-08-24
review:
  c0_c3:
    status: passed
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_verdict: pass
    passed_at: 2026-08-24
  c4:
    status: passed
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_verdict: pass
    passed_at: 2026-08-24
  c5:
    status: passed
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_verdict: pass
    passed_at: 2026-08-24
  c6:
    status: passed
    focused_review_verdict: pass
    passed_at: 2026-08-24
  c7_source_candidate:
    status: passed
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_verdict: pass
    focused_rereview_delegation_id: deleg_c0931cf1
    passed_at: 2026-08-24
  c8:
    status: passed
    integration_review_delegation_id: deleg_7ab7be8f
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_delegation_id: deleg_c52f6504
    focused_rereview_verdict: pass
    passed_at: 2026-08-24
  c9:
    status: passed
    integration_review_delegation_id: deleg_86d1f8b4
    first_verdict: request_changes
    remediation_status: completed
    focused_rereview_delegation_id: deleg_f766eba3
    focused_rereview_verdict: request_changes
    second_remediation_status: completed
    second_focused_rereview_delegation_id: deleg_db9a5e23
    second_focused_rereview_verdict: request_changes
    third_remediation_status: completed
    final_focused_rereview_delegation_id: deleg_017e7eeb
    final_focused_rereview_verdict: pass
    passed_at: 2026-08-24
execution:
  c0_c3: completed
  c4: source_completed_edge_uat_deferred_c10
  c5: source_completed_browser_uat_deferred_c10
  c6: source_completed_edge_uat_deferred_c10
  c7: source_candidate_rereview_passed_provisional_connection_approved_target_windows_deferred
  c8: source_completed_target_windows_uat_deferred_c10
  c9: completed
  c10: completed_partial_target_windows_skipped_by_user
  source_and_automated_verification: completed
  local_browser_smoke: completed_with_observation_gap
  target_windows_edge_uat: not_run
---

# image-pigeon 純前端版本 C0–C10 部分執行結果

> 後續決策（2026-08-25）：本結果記錄的舊 `.ipigeon/` 資料夾與 1.x JSON 相容功能，已由 `docs/plans/2026-08-25-retire-legacy-project-formats.md` 接續退場。下列內容保留當時實際執行證據，不代表目前版本仍提供舊格式支援。

## 結論

本輪完成正式計畫 C0–C9 的原始碼 checkpoint，並依使用者核准執行 C10。C10 在目前 macOS arm64 工作區完成前端測試 108/108、lint、TypeScript／Vite production build、正式產物探針與差異護欄，全部 exit 0；既有 staged `tests/newVersionDismissal.test.ts` 路徑與 SHA-256 維持不變。當前執行主機沒有可操作的 Windows 11／Microsoft Edge／Microsoft 365 Word，使用者隨後明確決定先忽略 Windows 端；因此 C10 以部分完成收束，目標環境 UAT 未執行且沒有 Windows Edge／Word 相容性 PASS。

C7 exporter 與 exact `docx@9.7.1` 已完成自動驗證，使用者也已接受在目標 Windows Word UAT 延後時先完成 C8 provisional connection；但尚未執行 Windows 11／Edge／Microsoft 365 Word 的正式 fixture、效能、記憶體、版型相容或開檔修復警告驗收，因此沒有 Word 相容性 GO／PASS。C4 已使用核准安裝 `fflate@0.8.3`，C5 沿用該依賴建立圖片 ZIP；本結果不得解讀為 C5 目標 Edge 下載 UAT、C6 目標 Edge 列印／PDF UAT、Word 相容、正式部署或採用決策已通過。

## C0：基線、網路與資源契約

- `src/services/browserRuntimeContract.ts` 集中定義一般圖片、長截圖、asset store 與後續 archive／輸出的固定資源上限及具名錯誤碼。
- 一般圖片固定為單檔 32 MiB、單批 50 檔／512 MiB、單邊 16,384 px、64,000,000 pixels。
- 長截圖固定為單檔 64 MiB、寬 8,192 px、高 65,535 px、96,000,000 pixels、每來源最多 100 段。
- asset store 固定為 200 assets、Blob 合計 512 MiB。
- `src/services/browserNetworkPolicy.ts` 固定允許同源靜態 GET、`blob:` 本機讀取及無 body／credentials／專案 header 的版本檢查 GET；圖片、專案與輸出 mutation 固定拒絕。
- `package.json` 的 `test:frontend` 已涵蓋 `tests/*.test.ts`、`src/features/ImagePreview/*.test.ts`、`src/services/*.test.ts` 與 `src/features/Upload/*.test.ts`。
- 實作前後 staged guard 均只包含既有 `tests/newVersionDismissal.test.ts`；工作樹與 index SHA-256 均為 `7677a390887ff1a9381a77651f6505ab4660c40d79a4d8b86cad2655d323275f`，本工作未改寫或取消暫存。

## C1：瀏覽器資產儲存與預覽

- 新增 `src/services/browserAssetStore.ts`，以 asset id 保存 Blob 並管理 object URL。
- 替換、刪除、全部清除與 App 卸載會撤銷 object URL。
- `projectState` 與圖片 adapter 改由 asset store 提供 `previewUrl`，一般圖片預覽不再需要 session 圖片 API。
- 保留既有 `Asset`、`Item`、`ProjectImportData` 與 `ProjectV2` metadata 契約，不把 object URL 或大型 Base64 寫入專案 state。

## C2：一般圖片本機匯入與壓縮

- 新增 `src/services/browserImageProcessor.ts` 與 `src/features/Upload/browserImportAdapter.ts`。
- 以瀏覽器解碼與 Canvas 依序處理，輸出 `image/webp` Blob；concurrency 固定為 1。
- 品質選項固定為 50／75／90／100；最小尺寸固定為 500／1000／2000；圖片只縮小、不放大。
- 保留 `.jpg`、`.jpeg`、`.png`、`.webp`、`.bmp`、`.jfif` 入口與實際解碼失敗處理。
- 單張失敗可保留其他成功項目；UI 顯示成功數、略過檔名與安全錯誤摘要。全數失敗、取消或資源超限不 commit 專案或 store。
- `UploadMultiple.tsx` 已改接純前端 adapter，不呼叫 `/api/images/import`。

## C3：長截圖本機切割

- 判定、段高、3% overlap、尾端黑色 padding、compact 與順序依正式計畫契約實作。
- 每個來源是原子單位；任一 segment 失敗會捨棄該來源全部暫存產物。
- 批次在解碼前檢查來源數與輸入 bytes；每個來源取得扣除既有 store 與本輪 pending 後的可用 asset／bytes 容量，processor 在每個 segment 產出時檢查上限。
- pending 產物逐來源預檢，資源超限固定中止整批且不 commit，不會先累積無界 Blob 後才拒絕。
- `UploadLongScreen.tsx` 已改接純前端 adapter，不呼叫 `/api/images/import-long-screen`。

## 取消與資源回收

- 一般圖片與長截圖 UI 都把同一個 `AbortSignal` 傳入 adapter／processor。
- `ModalImport.tsx` 與 legacy `ModalUpload.tsx` 由 modal owner 管理 `AbortController`。
- 使用者可在 loading 畫面按「取消處理」；關閉 modal 或元件卸載也會 abort。
- 取消固定使用 `OPERATION_CANCELLED`，不 commit project／store；loading 在 `finally` 收束。

## C4：單一 `.ipigeon` 與舊格式相容

- 套件前置評估固定選用唯一 dependency `fflate@0.8.3`：MIT 授權、repository 為 `101arrowz/fflate`、npm unpacked size 796,742 bytes；npm 顯示該版本於 2026-05-16 發布且套件 metadata 於 2026-07-20 更新。以臨時 Vite 入口僅匯入 `zip/unzip` 的實測產物為 16.12 kB、gzip 7.71 kB；量測檔已刪除，未寫入 repository。
- `pnpm audit --prod` 沒有回報 `fflate` 弱點；命令整體 exit 1 是既有 `@tailwindcss/vite > vite > postcss > nanoid` 路徑的 `nanoid <3.3.18` high advisory，非本 checkpoint 新增依賴路徑，未在 C4 範圍內升級。
- 新增 `src/services/browserProjectArchive.ts`，以 `fflate@0.8.3` 在瀏覽器建立及開啟單一 ZIP 容器；根目錄固定為 `project.json`，圖片固定為 `images/<asset-id>.webp`。
- archive 與舊資料夾匯入會拒絕絕對路徑、`..`、重複 canonical path、未知 schema/version、損壞 manifest、重複 ID、缺漏／多餘圖片、項目數及 bytes 超限。
- archive 與資料夾資產必須具有 WebP magic、可由瀏覽器解碼，且實際尺寸必須符合 manifest；中央目錄偽造較小解壓尺寸造成的截斷資產也會在 commit 前拒絕。
- `BrowserAssetStore.replaceAll()` 在完整預檢後原子替換 Blob 與 object URL；失敗或取消不修改既有 store，成功時回收舊 object URL。
- `SaveProject.tsx` 下載單一 `.ipigeon`；`OpenProject.tsx` 支援單檔與 Chromium `webkitdirectory` 舊資料夾入口；兩者不呼叫 pywebview 或 project API。
- 1.x JSON 依真實 writer 五欄 `base64/remark/width/height/rotation` 遷移；`rotation: null` 或缺省視為 0，其他值只接受 0／90／180／270。PNG、JPEG、WebP、BMP 會檢查宣告 MIME 與檔案 magic，歷史 JPEG bytes 冒充 PNG 的資料固定拒絕。
- 1.x 圖片完整驗證後才依序轉成 WebP quality 100，保留 remark、rotation 與順序，產生新 UUID、完整 crop、現行 portrait size 及排版偏好；任一項錯誤整批拒絕。
- 專案建立、開啟與遷移均接受 `AbortSignal`；共享 operation coordinator 以世代 lease 管理開啟與 1.x 遷移，關閉、全部清除、卸載或新操作取代時使舊 lease 失效，commit 前固定 `assertCurrent()`，阻止晚到結果覆寫較新的使用者操作。

## C5：另存圖片改為本機 ZIP

- 新增 `src/services/browserImageZip.ts`，依 `ProjectV2` canonical item order 從 asset store 逐張讀取 Blob，以 Canvas 套用 0／90／180／270 度 rotation，白底輸出 `image/jpeg`。
- 預設命名使用正規化標題與連續序號；備註命名會處理換行、控制字元及 Windows 非法字元，空備註回退至預設名稱，重複名稱依輸出順序穩定加上 `_2`、`_3`，且以不分大小寫方式避免 Windows 覆蓋。
- `SaveImages.tsx` 改為只建立一個 Blob URL 並觸發單一 ZIP 下載；已移除選擇資料夾、自動開啟資料夾與 `window.pywebview.api.save_images` 呼叫。
- UI 顯示逐張處理進度並提供取消；元件卸載也會 abort。取消、任一圖片轉換失敗或 ZIP 超限時整批拒絕，不建立下載 Blob 或下載半成品。
- 固定限制為最多 200 張、來源 Blob 合計最多 512 MiB、JPEG 產物與完成 ZIP 各最多 512 MiB。ZIP 改用 `fflate.Zip`／`ZipPassThrough` 逐資料塊（chunk）建立，在保留資料塊前即檢查完成 ZIP 上限，超限立即 `terminate()`。
- `package.json` 的 `test:frontend` 已納入 `src/features/Output/*.test.ts`，讓圖片 ZIP UI 契約進入標準前端驗證。

## C5 聚焦複審

第一輪獨立聚焦複審 `deleg_e08c4f98` 結論為 `REQUEST_CHANGES`：核心功能與其餘驗收通過，但完成 ZIP 的 512 MiB 上限只在 `fflate.zip()` 完整配置產物後才檢查，未符合逐步資源約束。已改用串流 ZIP 回呼（streaming ZIP callback），在每個資料塊進入保留陣列前檢查上限；另補完成 ZIP 容器額外位元組超限的回歸測試。

修正版獨立聚焦複審 `deleg_145fadee` 結論為 `PASS`：前次資源阻擋問題已關閉，備註模式仍保留預設名稱供空備註後備命名，未發現新的阻擋問題。複審者另行執行 86/86 前端測試、聚焦 eslint 與 TypeScript 檢查，均通過。

## C6：列印與 PDF 相容驗證

- 列印入口、`PrintPreviewView` 與 `PrintableDocument` 已移除 legacy `sessionId` 必要性，直接使用 `projectState` 從 `browserAssetStore.getUrl(asset.id)` 取得的 object URL；列印流程不呼叫圖片 API 或 pywebview。
- 保留既有五種 `autoCollageLayout`，沒有新增 PDF renderer；輸出文案只宣稱可透過系統列印對話框另存 PDF，並明示瀏覽器無法控制儲存路徑或繞過機關列印政策。
- `derivePrintImageReadiness()` 將尚未回報的圖片自初始 render 起視為 loading，避免圖片註冊 effect 前短暫開放列印；所有圖片進入 loaded 或 error 終態後才可列印。
- `PrintableSlot` 沿用 `onLoad`／`onError` readiness 接線；載入失敗會顯示具名張數警告，失敗項以空白顯示但仍允許使用者繼續列印。
- 新增 `src/features/PrintPreview/printPreview.test.ts`，覆蓋五種版型、asset store object URL、無 session 列印路徑、readiness 初始／失敗終態、A4／分頁／備註換行 CSS 與 PDF 邊界；`package.json` 標準測試命令已納入 `src/features/PrintPreview/*.test.ts`。

## C6 聚焦複審

獨立聚焦複審 `deleg_be7bc77a` 結論為 `PASS`：五種版型、asset store object URL、無 session 列印路徑、readiness 初始／失敗行為、A4／換行 CSS、PDF 誠實文案及圖片失敗警告均通過，未發現必要修正或 C6 範圍漂移。複審另行執行 91/91 前端測試、lint、build 與 diff checks，均通過；build 僅有既有單一 bundle 大於 500 kB 的警告。

複審明確保留的驗證缺口是 Windows Edge／browser UAT：後續仍須以直式、橫式、小圖與混合樣本實測頁數、object URL readiness、備註換行、圖片失敗畫面及系統列印對話框。macOS 自動驗證不得擴張成 Windows Edge 列印引擎 PASS。

## C7：Word 有界可行性來源候選

- 依明確核准安裝唯一方案 exact `docx@9.7.1`（MIT；npm unpacked size 4,653,599 bytes），未比較其他大型 renderer，也未手寫完整 OOXML。
- 新增 `browserWordFixture.ts`，固定 20 張 synthetic fixture 規格：landscape 1600×900、portrait 900×1600，涵蓋中文、多行與空備註、0／90／180／270 度旋轉，以及五種既有 `autoCollageLayout`。fixture 規格 SHA-256 為 `ac8425edf619c598b4eb6d2f178a6281035ca0ee3cf080f3bc9da547f5b84598`。
- fixture 逐張 JPEG 固定上限 8 MiB、總量固定上限 80 MiB；exporter 另沿用瀏覽器 asset store 的 200 張 item count 上限。超限在建立文件前以具名錯誤整批失敗，不回傳半成品。
- 新增未接 UI 的 `browserWordExporter.ts`，只接受已完成旋轉與 JPEG 編碼、且 width／height 對應成品方向的圖片，不保留未使用的 rotation 欄位；由既有 `buildAutoCollageLayout()` 建立 A4 直式、固定表格寬度與列高、合併儲存格、空 slot、圖片等比例縮放、中文／多行／空備註及跨頁連續編號，最後以 `Packer.toBlob()` 產生 DOCX Blob。
- 新增 `browserWordExporter.test.ts`，實際解開產生的 DOCX，檢查 A4 page size、固定 table layout、兩欄／三欄合併、編號 01–20、多行備註、JPEG content type／relationship 及 20 個 media entry；測試 JPEG 是 Pillow 可解碼的有效 4×2 JPEG，並另驗證 fixture canonical SHA-256、規格與 8 MiB／80 MiB／200 張資源上限。
- 目前仍是 source candidate。已完成 macOS Chromium／Word 預檢，但 Windows 11／Edge／Microsoft 365 Word 版本、目標環境逐檔 SHA-256、60 秒時間、1.5 GiB working set、完整六頁 slot 一致性、修復警告、圖片越界及非預期跨頁仍未執行；尚不能作 GO／NO-GO，也不得接入 `SaveWord.tsx`。

## C7 聚焦複審

第一輪獨立聚焦複審 `deleg_a6866101` 結論為 `REQUEST_CHANGES`：要求把 fixture spec SHA-256 寫成 deterministic source contract、收斂 exporter 的 rotation API、改用有效可解碼 JPEG、補 item-count 上限，並排除複審環境曾出現的完整 test runner TAP 全綠但外層 exit 1。

前四項已以 TDD 修正：加入 canonical SHA-256 constant／assertion；exporter 只接受已旋轉 JPEG，fixture renderer 回傳成品尺寸；測試 JPEG 已由 Pillow 實際解碼為 4×2 JPEG，DOCX 測試再檢查 media、content type 與 relationship；item count 固定沿用 200 張 asset store 上限並有 201 張拒絕測試。完整 `pnpm run test:frontend` 已以明示 status wrapper 重跑，得到 94/94、0 fail、`FULL_TEST_EXIT=0`。

修正版獨立聚焦複審 `deleg_c0931cf1` 結論為 `PASS`、信心高：五項修正全部關閉，未發現阻擋問題、必要修正或範圍漂移。複審者另 fresh 執行完整前端測試，得到 94/94、0 fail、`FULL_TEST_EXIT=0`，並以 Pillow 記憶體內解碼確認測試 JPEG 為有效的 4×2 JPEG。此 PASS 只涵蓋 C7 來源候選與修正，不涵蓋 Windows 11／Edge／Microsoft 365 Word UAT 或 GO／NO-GO。

## C7 macOS 預檢（非目標環境 PASS）

- 環境：macOS 27.0（build `26A5388g`）、Vite 7.3.6、HeadlessChrome 150.0.0.0；此瀏覽器不是 Microsoft Edge。
- 規格 SHA-256 實算值與 source constant 一致：`ac8425edf619c598b4eb6d2f178a6281035ca0ee3cf080f3bc9da547f5b84598`。
- `createWordFeasibilityFixture()` 實際產生 20 張 Canvas JPEG，總計 631,233 bytes；連同 `Packer.toBlob()` 共 164.3 ms，產生 298,143-byte DOCX。DOCX SHA-256 為 `331924adc1f66b15a7eb1bb187dd5ba33689405c08ded37d2b06324ac09e8641`，`unzip -t` exit 0，`file` 辨識為 Microsoft Word 2007+。
- layout 實際為六頁：`landscape-2`、`portrait-large-2`、`portrait-small-6`、`mixed-landscape1-small3`、`mixed-small3-landscape1`、`portrait-large-2`。
- 個別 JPEG SHA-256：

| item | 成品尺寸 | bytes | SHA-256 |
|---|---:|---:|---|
| fixture-01 | 1600×900 | 32,220 | `5c0f49d5d375acafddce2eb68fd03287bba14eb899d7ec52cb371b893022d0c4` |
| fixture-02 | 1600×900 | 33,505 | `f9e216ce9ae63594461fb1b4c4abf80e831e0d7d3a9d8de0a153cd501dc365d3` |
| fixture-03 | 900×1600 | 33,097 | `bfd0b95bbe6b02e50c395f6db8f032a038034c7ac954e82f35e67bfb5836583c` |
| fixture-04 | 1600×900 | 32,234 | `45ba94254fa11cbd3b25273e9804196dcf5aefca675506a94612c3a9bccb6b9e` |
| fixture-05 | 900×1600 | 32,006 | `2defc08e0881a88aa2530667d9e9ea629d670e06d8b395302da953f7683bf107` |
| fixture-06 | 900×1600 | 30,229 | `88167e334bda0518e20b58070a6a51d9732c357faf983bcda329006bd663734d` |
| fixture-07 | 1600×900 | 29,331 | `b39bf2c275623dc17af8d8425d720d9b01b47e38c30026f05ff21c0b54c27b58` |
| fixture-08 | 900×1600 | 30,711 | `9c0d5a1dac04c02814f8c7ef67ba1aae56f1c04c232f39db5b10187ce5828a29` |
| fixture-09 | 900×1600 | 32,939 | `a672c2c9a943fe2304f213649e10dd4850226473d142c0132609ad779fd864d5` |
| fixture-10 | 900×1600 | 31,950 | `37da8985ba72b8401b0158dde63627e83a55b74d3e841c936a8bd243b0541b3c` |
| fixture-11 | 1600×900 | 32,035 | `d47f74b0cb7c679ec7001e2dcfe6223d801f670030b2d0f0946fa3ef5c13379d` |
| fixture-12 | 1600×900 | 32,596 | `ce3ec4f8861e5f779fe513a29f289bd3d92a2ff7247996711cda71152ea64ad4` |
| fixture-13 | 900×1600 | 30,637 | `e07d2e09b3dd7e7ad309a7b62ba6e0fb0332d5574f5bf965c15e980c2ff996d3` |
| fixture-14 | 900×1600 | 32,266 | `4c27bf8c553c85b8d30b896108f3c1ba2c0bbe3cfc23af9fd5753f3840bf9c2c` |
| fixture-15 | 900×1600 | 31,162 | `88d8f7596052683af0c493490022b220569066a8a10c9ad6cf3def58dd83aa0e` |
| fixture-16 | 900×1600 | 30,654 | `643f0eeeeb911a0e49b268f0610d5cfaa89eb60f1eae55f4e192bef50b0b0657` |
| fixture-17 | 900×1600 | 27,813 | `c913aa6e20914bfa35cb7f7965e75fa810e70e9341a777b2c7bda445b643fc5a` |
| fixture-18 | 900×1600 | 31,155 | `43755ca0699a840eeba5f66e7fc5f2e72ed406219df2b6e8c734940a9d2ed45b` |
| fixture-19 | 900×1600 | 31,416 | `2cab9ff284b1ca3d7823c83c3e75fedb3e92bbd7ab36a88a9c1db674d0e4a553` |
| fixture-20 | 900×1600 | 33,277 | `3f77b8a455458c4ad9af420c9c0ab0d2c4e9c3cd15d5466b06dccd65d6a52fd4` |

- 產物位於 `/Users/cksai/Downloads/image-pigeon-c7-browser-word-macos-preflight.docx`。Microsoft Word for Mac 16.112.1 實際開啟後，AppleScript 讀回 6 個 table，內容含 `編號01`、`編號20` 與 `中文備註`；Word 狀態列顯示第 1 頁／共 6 頁。
- 可見視窗未顯示修復或錯誤警告；70% 縮放截圖可完整看見第 1 頁及部分第 2 頁，第 1 頁未見圖片越界、欄寬塌陷或非預期跨頁。此視覺判定只涵蓋可見第 1 頁，不推定其餘五頁。
- 未量測目標 Windows Edge working set，也未以 Windows Microsoft 365 Word 逐頁目視；macOS 164.3 ms 只能作預檢，不能直接通過 60 秒／1.5 GiB 目標閘門。

## C4 聚焦複審

第一輪 C4 獨立聚焦複審 `deleg_8255ee0f` 為 `REQUEST_CHANGES`：要求驗證 v2 WebP 實際內容／解碼尺寸，並修正開啟專案與「全部清除」之間的 late commit race。兩項均已修正；另補中央目錄偽造較小解壓尺寸及非同步結果晚到不 commit 的回歸測試。

修正版獨立聚焦複審 `deleg_b6653dbc` 結論為 `PASS`：前次兩項問題均關閉，未發現修正引入新的 C4 阻擋問題。複審者另行執行 77/77 前端測試、lint、build、聚焦 archive／operation／UI 測試與 `git diff --check`，均通過；build 只有既有單一 bundle 大於 500 kB 的警告。

## C0–C3 聚焦複審

第一輪 C0–C3 獨立聚焦複審為 `REQUEST_CHANGES`，提出：

1. Critical：長截圖批次與 pending 產物未在處理途中受 store 上限約束。
2. Major：UI 丟棄部分成功的 `skipped/errors`，仍固定顯示成功。
3. Major：UI 未建立或傳遞 `AbortSignal`，關閉／卸載不能取消。

三項均已修正並新增回歸測試。修正版獨立聚焦複審結論為 `APPROVED`：原三項均已關閉，且修正沒有引入新的阻擋或重大 correctness 問題。複審另行實際執行 53 項前端測試、lint、build 與 `git diff --check`，均通過。

## 自動驗證

最新實際結果：

- `pnpm run test:frontend`：106/106 通過。
- `pnpm exec tsc -b --pretty false`：通過，exit 0。
- `pnpm run lint`：通過，exit 0。
- `pnpm run build`：通過，exit 0；Vite 保留單一 bundle 大於 500 kB 的警告，不影響 build 結果。
- `git diff --check`：通過。
- `git status --short --branch`：分支為 `feat/pure-frontend`；既有 staged 檔仍只有 `tests/newVersionDismissal.test.ts`。

## 本機 Chromium 煙霧測試

- 以 Vite 本機開發頁面實際載入應用程式。
- 在瀏覽器記憶體建立 1200 × 1200 PNG `File`，經 UI 一般圖片導入後顯示 1 張圖片。
- 預覽圖片實際來源 protocol 為 `blob:`，完成解碼後 natural size 為 1000 × 1000。
- 先前同輪 synthetic 長截圖驗證以 1000 × 4500 色帶圖片得到 3 張 1000 × 2120 WebP；相鄰重疊列一致，最後有效列與尾端黑色 padding 符合契約。
- C4 最終煙霧以瀏覽器實際建立 838-byte、`application/vnd.image-pigeon+zip` 的 `.ipigeon` 並重新開啟，比對 title、資產 bytes 與關鍵 metadata；原子替換後預覽 protocol 為新建的 `blob:`。
- 另以 516-byte 真實 WebP 驗證開啟階段會實際解碼並比對 2 × 1 尺寸；將 manifest width 改成 1 時回傳 `INVALID_PROJECT_SCHEMA`，不進入 commit。
- 以 Canvas 產生真實 PNG data URL，經 1.x migration 轉成 2 × 1 WebP；最終煙霧證明 `rotation: null` 正規化為 0，另一次 fixture 證明 270 度保留。JPEG bytes 冒充 PNG 的輸入回傳 `INVALID_PROJECT_SCHEMA`。另以實際 `.ipigeon` `File` 派送至 UI input，畫面顯示 Blob 預覽及 fixture 備註。
- 專案輸出 modal 已實際進入「儲存專案」並觸發瀏覽器下載動作；本機測試沒有宣稱可任意指定檔案系統路徑。
- 開發伺服器已停止，未留下 tracked background process 或 4173 listener。
- browser console 沒有文字型 error 訊息；browser 工具仍保留 2 筆無 message、無 stack 的空 exception 記錄，無法歸因或證明為零錯誤。因此本項只記為功能煙霧測試完成且保留觀察缺口，不擴張成完整 browser UAT PASS。

## C8：瀏覽器 Word 接線與正式執行階段切換

- 使用者明確接受目標 Windows Word UAT 尚未完成的風險，並核准保持 Word 入口可操作、直接接入瀏覽器 exporter；此決策不代表 Windows 相容性 GO／PASS。
- `SaveWord.tsx` 已從 `ProjectV2` 與 `browserAssetStore` 依 canonical order 取得來源 Blob，透過既有 `browserJpegConverter` 套用旋轉並轉成 JPEG，再交由 `createBrowserWordBlob()` 產生 DOCX Blob 與瀏覽器下載。
- `browserWordProjectAdapter.ts` 保留每張備註與 `layoutPreference`，依完成方向回報寬高、計算 SHA-256，並在每張轉換前後與 DOCX 生成邊界檢查取消訊號。UI 提供逐張進度與取消；錯誤或取消不會觸發半成品下載。
- Word 檔名沿用 Windows 非法字元／控制字元／尾端點與空白正規化，空值回退為 `照片黏貼表.docx`。
- 已刪除正式前端退役路徑：`SaveJson.tsx`、`apiClient.ts`、`imageApi.ts`、`projectApi.ts`、`diagnosticLog.ts`、`projectOutputAdapter.ts`、`handleError.ts`、`globak.d.ts` 與只驗證退役 bridge 的 `tests/diagnosticLogging.test.ts`；Python 原始碼未刪除。
- `AlertLoading.tsx` 不再註冊 pywebview progress bridge；只顯示本機不定進度與已知工作張數，不虛構完成百分比。
- 版本檢查移至 `browserVersionCheck.ts`，只向固定 `VERSION_CHECK_URL` 發出 `GET`，使用 `credentials: 'omit'`、無 body／自訂 header、5 秒逾時，非成功回應、逾時或網路錯誤一律靜默回傳 `null`。
- TDD 的有效 RED 由缺少 `browserWordProjectAdapter.ts` 與 `browserVersionCheck.ts` 造成 module-not-found，另由既有 pywebview／HTTP 路徑造成 C8 source contract 失敗；先前三次 `pnpm exec tsx` 因專案未安裝 `tsx` 而失敗，僅屬錯誤 runner，不列為有效 RED。
- 委派實作者 `deleg_2f089ae1` 在最後一次 build 執行期間達到 600 秒限制，沒有完成摘要。父層依 timeout reconciliation 讀取實際產物、確認無殘留程序，並 fresh 重跑完整前端測試 99/99、focused 13/13、lint、build、production source／dist forbidden-string scan、`git diff --check` 與 staged guard；上述檢查均通過。build 只保留既有大於 500 kB chunk 警告。
- 獨立整合複審 `deleg_7ab7be8f` 第一輪為 `REQUEST_CHANGES`：遠端版本 JSON 缺少執行階段資料邊界，未驗證的 `download_link` 會直接進入新分頁連結。已以 TDD 補上必要欄位／日期／HTTP(S) URL 驗證、無效資料 `null` 降級及 `rel='noopener noreferrer'`；有效 RED 為 5 項中 2 項因缺少邊界而失敗，修正後 focused 5/5、完整前端測試 101/101、lint、build 與差異護欄通過。聚焦複審 `deleg_c52f6504` 結論為 `PASS`，前輪唯一 Important finding 已關閉，C8 原始碼 checkpoint 完成。

## C9：靜態部署與資安護欄

- `vite.config.ts` 設為 `base: './'`，正式產物可放在 HTTPS 根目錄或子路徑；不承諾 `file://` 直接開啟。已移除退役的本機 `/api` development proxy。
- `index.html` 已移除 Google Fonts 的 stylesheet 與 preconnect；正式 HTML 不再載入第三方字型、腳本或樣式，改用瀏覽器／作業系統字型。
- 新增 `docs/deployment/pure-frontend-static-hosting.md`，說明 MIME、無需全域 SPA fallback、Brotli／gzip、hashed asset 長快取、`index.html` 短快取、HTTPS、部署／回退順序、CSP、安全標頭及零上傳邊界。正式部署仍未核准或執行。
- 新增 `scripts/verify-static-build.mjs` 與 `pnpm run verify:static`，實際確認 `dist/index.html` 的 Logo、JavaScript、CSS 都是存在的 `./` 相對路徑，JavaScript／CSS 具內容 hash，且正式產物退役執行階段字串零命中。
- TDD 的有效 source RED 為 5 項中 4 項失敗：缺少 `base: './'`、仍有本機 API proxy、仍載入 Google Fonts、缺少部署文件；修正後 5/5 通過。產物探針也先對 C8 舊 `dist/` RED，正確抓到第三方字型與絕對資產路徑；fresh build 後 GREEN。
- 第一輪獨立整合複審 `deleg_86d1f8b4` 為 `REQUEST_CHANGES`：產物探針可讓外部圖片、CSS URL 與未 hash JavaScript false PASS；既有聯繫、回饋、新版資料夾及作者網站外部導覽未納入 C9 政策；子路徑無尾端斜線時相對資產會解析至上一層。
- 修正先加入污染產物、外部導覽與部署文件回歸測試，fresh RED 為 7 項中 3 項失敗。`verify-static-build.mjs` 現遞迴掃描 HTML／CSS／JavaScript／SVG，驗證外部 URL 允許清單、HTML／CSS／JavaScript 資產參照存在性、站台根絕對路徑及每個 JavaScript／CSS hash；7/7 GREEN。
- 新增 `browserExternalNavigation.ts` 集中固定外部導覽；既有六個入口只由使用者明確點擊，全部使用 `noopener noreferrer`，README 未允許網址會降為純文字。`Intro.tsx` 的兩個 public Logo 也改用 `import.meta.env.BASE_URL`，避免子路徑回到站台根目錄。
- 部署文件加入 `/image-pigeon` 301／308 至 `/image-pigeon/` 的要求與 Nginx 範例，並明確區分唯一自動跨來源版本 GET、固定使用者外部導覽及零專案資料外送。
- remediation 後 fresh `pnpm run test:frontend` 為 108/108、lint、build、`verify:static`、`git diff --check` 與 cached check 均通過。build 轉換 305 modules；`dist/` 共 8 個檔、驗證 6 個資產參照、退役字串零命中，只有既有單一 bundle 大於 500 kB 警告。
- 第一輪修正的聚焦複審 `deleg_f766eba3` 仍為 `REQUEST_CHANGES`：實際重現未加引號 HTML、JavaScript／SVG protocol-relative URL 及 allowlist 過寬的 false PASS；另發現 `/tests/` ignore 規則使 C9 contract 測試無法作為一般可交付候選。外部導覽與子路徑尾斜線兩項則確認已關閉。
- 第二輪修正加入上述四種繞過的獨立污染案例；HTML／SVG attribute parser 現同時檢查 quoted 與 unquoted 值，所有文字產物拒絕 protocol-relative literal，JavaScript 額外拒絕靜態 network sink URL，文件／套件 metadata URL 與可導覽 URL 分離，GitHub 等文件來源不再以整個網域放行。`.gitignore` 只重新納入 `tests/staticDeploymentContract.test.ts`；因 Git gate 未核准，該檔目前是可被一般 Git 流程看見的 untracked 交付候選，沒有變更既有 staged inventory。
- 第二輪修正後 focused 7/7、完整前端 108/108、lint、build、`verify:static`、差異與 staged hash 護欄均通過；`git check-ignore tests/staticDeploymentContract.test.ts` 確認不再被忽略。
- 第二輪聚焦複審 `deleg_db9a5e23` 確認前述 HTML／SVG／protocol-relative／GitHub allowlist 繞過及 ignored test 均已關閉，但以 `fetch?.("https://pigeonhand.tw")` 重現 optional-call 語法 false PASS，因此仍為 `REQUEST_CHANGES`。
- 第三輪修正讓所有已列 network sink 同時檢查一般呼叫與 optional call，新增獨立 `fetch?.(...)` 污染回歸案例；修正後 focused 7/7、完整前端 108/108、lint、305-module build、`verify:static`、差異與 staged hash 護欄再次通過。
- 最終聚焦複審 `deleg_017e7eeb` 親自重現 optional-call 污染已改為 exit 1，且一般與 optional-call 的固定版本 GET 仍合法通過；前兩輪 findings、測試可交付性及 staged guard 均未倒退。結論為 `PASS`、信心高，C9 source/build checkpoint 完成。

### C9 有界瀏覽器網路證據

- 以 production `dist/` 的 Vite preview 在本機 Chromium 執行，使用 synthetic 120 × 80 PNG；實際完成一般圖片匯入、備註編輯、旋轉、`.ipigeon` 儲存與同檔重新開啟、圖片 ZIP、Word DOCX 及列印預覽。
- 初始 resource timing 只有同源 JavaScript、CSS、Logo／圖片 GET，以及固定 `GET https://api.pigeonhand.tw/web/apps/1/`。版本請求之外，從攔截器安裝至所有上述操作完成，fetch 與 XMLHttpRequest 紀錄均為空陣列，沒有圖片或專案 mutation。
- Blob 捕捉實際記錄 `.ipigeon` 1,091 bytes（`application/vnd.image-pigeon+zip`）、旋轉圖片 WebP 586 bytes、圖片 ZIP 1,041 bytes，以及 DOCX 11,086 bytes；四者 URL protocol 均為 `blob:`。重新開啟 `.ipigeon` 後仍為 1 張圖片且保留 `C9 網路邊界測試備註`。
- 列印預覽實際顯示 1 頁、`編號 01` 與 fixture 備註；本 checkpoint 只驗證預覽期間無網路資料外送，沒有開啟系統列印對話框，也不替代 C10 目標 Windows Edge／PDF UAT。
- preview server 已由 tracked process 停止，未留下背景伺服器；未呼叫正式部署、commit、push 或 merge。

## 尚未執行與阻擋

- 目標 Windows Edge 的 `webkitdirectory` 舊資料夾匯入未實機執行；原保留至 C10，現依使用者決定先忽略 Windows 端而結束，C4 仍只有原始碼 checkpoint 證據。
- C5 圖片 ZIP 已在 C9 有界 Chromium 驗證實際產生 Blob ZIP，但未於目標 Windows Edge 執行下載／解壓 UAT；本項不構成目標環境 PASS。
- C6 列印／PDF 原始碼與自動驗證已完成，但未執行目標 Windows Edge 的實際預覽、分頁及系統列印對話框 UAT；本項不構成目標環境 PASS。
- C7 source candidate 已完成自動驗證與 macOS Chromium／Word 預檢；C8 正式執行階段切換與 C9 靜態部署／資安護欄均已完成。C10 自動回歸已執行，目標 Windows 11／Edge／Microsoft 365 Word UAT 依使用者決定先忽略。
- 未執行機關 Windows 11／Microsoft Edge 壓力與記憶體 UAT。
- 已安裝唯一 C4 ZIP dependency `fflate@0.8.3` 與唯一 C7 Word dependency exact `docx@9.7.1`，並更新 `pnpm-lock.yaml`。
- 未 commit、push、merge、部署或建立 ADR-0002。

## C10：回歸與目標環境狀態

- 核准：使用者於 2026-08-24 明確核准執行當前計畫 C10；此核准不包含 commit、push、merge、部署或 ADR cutover。
- 執行環境：macOS 27.0、arm64、Node.js v22.22.2、pnpm 11.4.0；不是計畫要求的目標 Windows 11 環境。
- `pnpm run test:frontend`：exit 0，108/108 通過。
- `pnpm run lint`：exit 0。
- `pnpm run build`：exit 0，TypeScript 與 Vite 7.3.6 production build 完成，305 個模組完成轉換。
- `pnpm run verify:static`：exit 0，8 個正式產物檔、6 個引用通過，`forbiddenHits=0`。
- `git diff --check` 與 `git diff --cached --check`：exit 0。
- staged 護欄：仍只有 `tests/newVersionDismissal.test.ts`；SHA-256 仍為 `7677a390887ff1a9381a77651f6505ab4660c40d79a4d8b86cad2655d323275f`。
- 目標環境處置：目前沒有可操作的 Windows 11／最新版 Microsoft Edge／Microsoft 365 Word；使用者決定先忽略 Windows 端。因此未執行 20 張、50 張、超長截圖、混合直橫式、重複備註檔名、損壞專案檔、working set、列印／PDF、ZIP 解壓、舊資料夾匯入與 Word 五種版型 UAT；不得宣稱 Windows Edge 或 Word 相容性 PASS。

## 下一步

C10 已獲核准，自動回歸通過；Windows 端依使用者決定先忽略，故本結果維持 `partial` 且不宣稱 Windows Edge／Word 相容性 GO／PASS。若使用者決定採用此純前端候選，後續 commit、push、merge、ADR cutover 與正式部署仍須各自明確核准。
