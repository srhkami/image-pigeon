---
type: result
id: result-image-pigeon-singlefile-html-2026-11-03
status: completed
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
implements: docs/plans/2026-11-03-singlefile-html.md
updated_at: 2026-11-03
execution:
  current_checkpoint: completed_user_attested
manual_acceptance: user_attested_2026-11-03
review:
  used: false
  method: primary_agent_self_check
approval_gates:
  source_write: approved_consumed_2026-11-03
  dependency_install: approved_consumed_2026-11-03
  automated_test: approved_consumed_2026-11-03
  singlefile_build: approved_consumed_2026-11-03
  browser_runtime: declined_user_manual_2026-11-03
  electron_package_build: closed
  deployment: closed
  commit: authorized_pending
  push: closed
artifact:
  path: release/html-3.3.0/image-pigeon-3.3.0.html
  bytes: 1295428
  sha256: 8887a29d3578c48889b52ca9a8328f00e631df1375a4388dda1460b6415ded2c
---

# 單一 HTML 離線版執行結果

後續使用者要求「請幫我提交GIT」，核准與 Electron 退役合併提交本計畫來源、測試及文件；提交前記為 authorized_pending，實際結果以 Git 紀錄為準。下文未提交敘述為初次交付時的歷史事實；已驗收 HTML 不納入，推送與部署仍關閉。

## 初次交付完成事項（退役前證據）

- 新增 `pnpm run build:singlefile`、`pnpm run verify:singlefile` 與 `pnpm run test:singlefile`；沿用產品版本 3.3.0，不改既有網站／Electron 命令、首頁 DOM、輸出資料契約或 .ipigeon 格式。
- `vite.singlefile.config.ts` 合併原 Vite 設定，使用鎖定的 vite-plugin-singlefile@2.3.4。程式與樣式內嵌，Logo.svg、兩張品牌 PNG 與回饋 QR 圖片全部包含在 HTML；關閉 public 資產複製，輸出目錄只有一份 HTML。
- 單檔專用轉換只在建置時替換原首頁兩張 public 圖片引用，不修改原首頁程式或網站 Vite 設定。新增設定檔納入 TypeScript 建置檢查。
- 主題與功能介紹已讀狀態改用 `browserPreferenceStorage.ts`。取得儲存空間、讀取或寫入失敗時安全回退，正常儲存語意保留；不把使用者圖片保存到 HTML，也不新增 UI 提示或功能。
- 初次交付時既有網站 build／靜態驗證保持通過；舊 EXE、其他來源及工作線依基線保護。當時計畫 active、結果 partial，等待使用者人工驗收；後續回報見下節，不把來源或產物檢查說成瀏覽器 PASS。

## 實際驗證

| 命令／檢查 | 結果 |
|---|---|
| 初始測試先行 | 8 項全部因缺少單檔契約／儲存容錯而預期失敗，退出 1；日誌 red.log |
| 最後聚焦回歸 | 50/50、0 失敗、0 略過、退出 0；含單檔／儲存、靜態部署、Electron、標記合成、專案封存、Word 轉接器與圖片 ZIP |
| `pnpm run lint` | 退出 0 |
| `pnpm run build` | 退出 0，原 TypeScript／Vite 網站建置 |
| `pnpm run verify:static` | 退出 0，原網站產物護欄 |
| `pnpm run build:singlefile` | 退出 0，含 TypeScript、新 Vite 設定、單檔建置及驗證器 |
| `node scripts/verify-singlefile-build.mjs` | 退出 0；1 份 HTML、1 份內嵌程式、1 份內嵌樣式、4 張必要圖片，沒有可辨識的外部／鄰近靜態資源依賴 |
| 單獨移動檔案 | HTML 單獨複製至 scratch/standalone，內容指紋一致且靜態驗證通過；不是瀏覽器開啟證據 |

產物驗證器以 TypeScript 語法樹檢查內嵌 JavaScript；污染測試每案重設乾淨 HTML，拒絕外部／缺漏腳本、CSS、圖片、SVG、圖片多來源、CSS 匯入、可選及相對網路請求、固定路徑 Worker、動態匯入、程式內圖片引用、語法損壞、缺少掛載點與額外資產檔案。命令列另證明乾淨含圖產物退出 0、污染產物退出 1；不把 XML namespace 或固定使用者導覽誤判成載入。這仍是可辨識來源／產物檢查，不是瀏覽器網路攔截或任意 JavaScript 的安全證明。

精確測試命令與數量見 `/Users/cksai/.hermes/cache/scratch/image-pigeon-singlefile-20261103/regression-final.json`；品質命令與退出碼見同目錄 quality-final.json，各自保留完整日誌。原網站大型區塊警告與套件既有棄用警告保留。未執行完整前端矩陣，不把既有未納入的列印文案等失敗宣稱已修正或通過。

安裝命令為 `pnpm add -D --save-exact vite-plugin-singlefile@2.3.4`。pnpm 另外重新解析既有 supports-color 選用同儕快照；以 YAML 套件記錄核對既有實體套件版本／完整性不變，新增外掛及其 picomatch 相依套件，不升級既有 Vite、React 或 Electron。首輪多檔補丁因既有 tsconfig.node.json 註解被工具當嚴格 JSON 拒絕而部分套用；已讀回後只補上新設定檔並移除兩行章節註解，編譯選項語意不變，最後完整建置通過。

## 交付與人工驗收

2026-11-03 使用者回報「單檔板驗收通過」，本計畫依 user_attested 完成收束。不補寫未提供的逐項平台矩陣，也不轉成 Agent 實測。使用者另核准退役 Electron，見 `docs/plans/2026-11-03-retire-electron.md`；本結果中的 Electron 契約、命令及套件不升級敘述僅屬初次交付當時，已驗收成品及其上述指紋保持原樣。

產物絕對路徑：`/Users/cksai/Desktop/Coding/image-pigeon/release/html-3.3.0/image-pigeon-3.3.0.html`。只需交付這一個檔案；日後以 `pnpm run build:singlefile` 重新產生，不必重新打包 EXE。

初次交付時使用者選擇「只完成建置與自動測試，瀏覽器由我自行驗收」。以下保留當時的驗收指引，不再作為待回報清單：

1. 斷網開啟，確認畫面、圖示、主題切換與功能介紹可用；設定儲存被拒絕時可能無法跨次記住偏好，不應阻擋目前操作。
2. 匯入圖片，確認標記、局部放大、樣式、排版與備註。
3. 保存 .ipigeon 並重新開啟，匯出圖片 ZIP 與 DOCX，人工開啟確認內容。
4. 確認列印預覽／另存 PDF；依需要使用 Edge／Chrome／Firefox 確認實際相容性。

上述瀏覽器、離線啟動、下載、列印及 Word 呈現均未由 Agent 操作或宣稱通過。沒有 Electron 專用啟動新版提示；手動下載與其他外站入口仍需要網路。Agent 未啟動服務、瀏覽器、EXE 或正式 API，沒有重打包舊 EXE、部署、暫存、提交或推送。文件與來源護欄收據保存在同目錄 final-verification.json。
