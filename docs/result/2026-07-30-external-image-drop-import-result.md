---
type: result
id: result-image-pigeon-external-image-drop-import-2026-07-30
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-external-image-drop-import-2026-07-30
created_at: 2026-07-30
review:
  status: passed
  first_verdict: request_changes
  remediation_status: completed
  focused_rereview_verdict: pass
  passed_at: 2026-07-30
execution:
  source_and_automated_verification: completed
  browser_uat: passed
  pywebview_uat: user_attested_complete_2026-07-30
---

# 外部圖片拖放導入結果

## 實際變更

- `src/App.tsx` 新增 editor-only 的外部檔案拖放處理、drag-depth 提示層控制、有效圖片暫存與受控導入 modal 開關。有效圖片 drop 只設定 `pendingImportFiles` 並開啟 modal；沒有在 drop path 呼叫 `importImages()`。
- `src/features/Upload/ExternalImageDropOverlay.tsx` 新增全畫面、不可攔截指標事件的提示層，顯示「拖曳到此處導入圖片」與「放開後可設定預設備註，不會立即新增」。
- `src/features/Upload/externalImageDrop.ts` 新增外部檔案拖曳辨識、支援副檔名分割、drag-depth 夾限與 browser-safe progress notification 純函式。
- `src/features/Upload/fileAccept.ts` 將既有 accept 字串的支援副檔名集中為 `SUPPORTED_IMAGE_FILE_EXTENSIONS`，檔案選擇器與外部拖放共用同一格式來源。
- `src/layout/Sidebar.tsx` 將「導入圖片」按鈕改為呼叫 App 控制的 modal 開啟 callback；modal 本身仍由 Sidebar 掛載。
- `src/features/Upload/ModalImport.tsx` 改為受控 modal，並使用受控 radio 狀態；每次 modal 開啟或帶入新的拖放檔案時，都重設到「一般圖片」。
- `src/features/Upload/UploadMultiple.tsx` 以 `selectedFiles` 統一檔案選擇器與拖放待送出檔案；顯示數量／檔名，沒有檔案時阻止送出。只有表單送出後才進入既有 `importImages()` batching 流程。pywebview progress bridge 缺席時安全略過，存在時仍更新。
- `src/layout/AlertLoading.tsx` 的 pywebview progress callback 註冊改為先確認 bridge 存在；Vite browser 缺少 bridge 時不會在 loading 掛載階段拋出例外。
- `tests/externalImageDrop.test.ts` 新增 11 項 Node.js 回歸測試與 source-contract 檢查。

## 驗收條件對照

| 條件 | 證據 | 狀態 |
|---|---|---|
| AC-1 外部檔案與排序拖曳隔離 | `isExternalFileDrag()` 只接受 `DataTransfer.types` 的 `Files`；非檔案事件不攔截。Node test 通過。 | source/automated PASS；既有空 editor 的 browser drop 通過 |
| AC-2 提示層文案與抗負 depth | `ExternalImageDropOverlay.tsx` 與 `updateDragDepth()`；Node test 通過。 | browser UAT 通過；dragenter 後確認提示層文字 |
| AC-3 drop 後開啟一般圖片並顯示內容 | App 暫存 `File[]`；`UploadMultiple` 顯示數量與檔名。 | browser UAT PASS |
| AC-3a 每次開啟重設一般圖片頁籤 | `ModalImport` 受控 `activeTab` 與 `useEffect` reset；source contract test 通過。 | browser UAT PASS；切至長截圖後關閉／再 drop 仍回到一般圖片 |
| AC-4 drop 前不呼叫 API | `importImages()` 僅在 `UploadMultiple` 的 `omSubmit` 中；drop path 只呼叫 `onOpenImport()`。 | browser network observation PASS；drop 前無 `/api/images/import` 請求 |
| AC-5/AC-6 備註與既有導入選項／流程 | 原 remark、quality、min_size、檔名模式與 batching 流程保留。 | browser UAT PASS；填入預設備註、按新增後單張成功導入並在 editor 顯示備註 |
| AC-7 取消與成功後清除暫存 | App `onCloseImport()` 清除 pending；成功後清空 `selectedFiles` 再關閉。 | browser UAT PASS；關閉後重新 drop 僅顯示新帶入的單張；成功後 modal 關閉 |
| AC-8 格式一致與無效檔提示 | 共用 extension set；部分無效顯示略過數量，全無效不開 modal。Node test 通過。 | browser UAT PASS；混合檔保留圖片並提示略過，全無效不開 modal |
| AC-9 原按鈕與檔案選擇器 | Sidebar 保留按鈕；UploadMultiple 保留 `<input type="file">`，並支援手動選取。 | source PASS；macOS pywebview 手動驗收成功（user-attested） |
| AC-10 print-preview 與本機檔導覽 | `App` 在 print-preview early return 前不渲染 handler；檔案事件已 `preventDefault()`。 | source PASS；macOS pywebview 手動驗收成功（user-attested） |
| AC-10a browser 無 pywebview bridge | `notifyOptionalProgress()` 測試 bridge 缺席與存在兩種情境。 | browser UAT PASS；無 bridge 下完成單張導入，未見 JS error |
| AC-11 靜態驗證與 scope guard | 見下方命令結果。 | PASS |
| AC-12 macOS pywebview UAT | 使用者表示已完成 macOS pywebview 人工手動測試且成功。 | user-attested COMPLETE；不是 Agent 實機證據 |

## 自動驗證

- `pnpm exec node --test tests/externalImageDrop.test.ts`：11/11 通過。
- `pnpm run test:frontend`：15/15 通過，包含既有 `wheelNavigation.test.ts` 的 4 項回歸。
- `pnpm run lint`：通過。
- `pnpm run build`：通過。Vite 保留既有單一 bundle 超過 500 kB 的警告；不影響本次 build exit 0。
- `git diff --check`：通過。
- staged-file guard：通過，沒有 staged files。
- dirty scope guard：通過；所有 baseline scope 外 tracked／untracked 內容與 staged patch 維持不變。
- 未追蹤新增檔的 NUL byte、尾端空白與檔尾換行檢查：plan、result、新 source 與 test 全數通過。

## 已處理的 build 修正

第一次 `pnpm run build` 發現未被 Sidebar 使用、但仍參與 TypeScript 編譯的 legacy `ModalUpload.tsx` 未傳入新的 `UploadMultiple.pendingFiles` prop。為維持既有 legacy 呼叫路徑且不擴張 allowed paths，將 `pendingFiles` 設為 optional，預設空陣列；第二次 build 通過。

## Browser UAT

- 使用者於 2026-07-30 明確核准 browser UAT。以 `pnpm run dev -- --host 127.0.0.1` 啟動 Vite；預設 5195 已被既有程序使用，故本輪受控 Vite 實例實際使用 `http://localhost:5196/`。
- 確認外部有效 PNG 的 `dragenter` 顯示既定提示文案；`drop` 以 `preventDefault()` 處理並開啟一般圖片 modal，列出 1 張檔案。
- 監看 `/api/images/import`：drop 前無請求；按「新增」後才出現單一 POST，回應 HTTP 200／「新增成功」。成功後 modal 關閉、editor 顯示 1 張圖片及輸入的預設備註。
- UAT 探索時曾以損毀的 1×1 PNG fixture 得到既有 API 的 HTTP 400「無有效圖片可匯入」；此 fixture 失敗不代表拖放功能失敗，最終驗收改用經 Pillow 驗證的 2×2 PNG 並取得上述 HTTP 200。
- 混合 1 張有效 PNG 與 1 個 `.txt` 時，保留 1 張圖片並顯示「已略過 1 個不支援的檔案」；只有 `.txt` 時顯示錯誤且不開 modal。
- 將 tab 切至長截圖後關閉、重新 drop，確認回到一般圖片。browser 無 `window.pywebview` bridge 的成功導入過程未出現 JavaScript 錯誤。
- UAT 用圖片均為 browser memory 內生成的 2×2 PNG，不寫入 repository；成功送出會依既有 API 語意在本機 session storage 建立測試資料。

## Runtime 邊界與 macOS pywebview UAT

Browser UAT 已由 Agent 執行並記錄。macOS pywebview UAT 已由使用者於 2026-07-30 回報「人工手動測試，測試成功」；此結論標示為使用者人工驗收（user-attested），不改寫為 Agent 實機操作或螢幕／Accessibility 證據。先前本 agent session 缺少 Screen Recording／Accessibility 權限的阻擋，僅表示 Agent 無法自行操作 Finder／pywebview，不否定使用者的人工驗收。未啟動第二個 pywebview 視窗，未存取外部 provider，未 commit 或 push。

## 獨立審查與修正

首次 fresh-context review 為 `REQUEST_CHANGES`，發現 `AlertLoading` 在 Vite browser 缺少 `window.pywebview` 時仍直接註冊 progress callback；這會在一般圖片送出後進入 loading 階段時中斷。已以最小 allowed-scope 擴張加入 `src/layout/AlertLoading.tsx`，在 bridge 缺席時安全略過註冊，並保留 bridge 存在時的既有更新行為。

首次 review 亦指出純函式測試未直接佐證 drop path 不呼叫 API，及 modal 關閉清除暫存的組裝契約。已新增 source-contract tests，檢查 `App.onDrop` 僅將 accepted `File[]` 交給 `onOpenImport()`、不含 API 呼叫，並檢查 App → Sidebar → Modal 的 close callback 連線與手動 file input 更新 `selectedFiles`。這些是靜態組裝契約證據，不取代後續 browser／pywebview GUI UAT。

修正後已重新執行 15 項前端測試、lint、build、`git diff --check`、staged guard、dirty scope guard 與新增未追蹤檔 hygiene。focused rereview 已於 2026-07-30 判定 `PASS`；兩項首次 Important findings 均已修正。此 PASS 不改變 runtime 邊界。
