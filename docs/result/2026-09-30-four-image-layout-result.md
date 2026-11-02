---
type: result
id: result-image-pigeon-four-image-layout-2026-09-30
status: partial
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
implements: docs/plans/2026-09-30-four-image-layout.md
updated_at: 2026-11-02
execution:
  current_checkpoint: closed_with_validation_gaps
thumbnail_fix:
  status: user_attested_complete
  review_used: false
  manual_acceptance: user_attested_complete_2026-11-02
closure:
  status: closed_with_validation_gaps
  completed_at: 2026-11-02
  authority: 使用者確認問題已解決，可以收束當前計畫
  remaining_manual_validation: deferred_no_pass
review:
  status: pass
  applies_to: word_side_stacked_grid_correction
  delegation: deleg_c0fcd197
  used: true
  blocking_findings: []
  source_manifest: /tmp/image-pigeon-word-layout2-rereview.json
  source_digest: d59b987609e62dcb9e04796cd928203bfc3273c39577d8ca31222eb4a432fc69
historical_reviews:
  - delegation: deleg_915ecf6b
    status: request_changes_missing_metadata_width_assertion
    source_digest: edfbb2de839f4b0b917a6eaee50157506a29e2e921d52dbd0dc0e67b31be8b44
  - delegation: null
    status: self_checked_grid_image_width_only
    source_digest: 891e827582bdee6669ed25253e9c3fbe5b402537777ada1fcd71b7c1da73988c
  - delegation: deleg_947fc8db
    status: pass_grid4_grid6_mixing_before_word_width_correction
    source_digest: 86c448a7b74262dd67058d8d8ed713f928af3cb39de8071faf4d8861d5735314
  - delegation: deleg_b39ec195
    status: pass_grid4_stacked_only
    source_digest: 17827910a12192dcdac9dbf001d64ea349b4aae1edcc6230e93bd9851bf64db3
  - delegation: deleg_84c7eade
    status: pass_initial_grid4_only
    source_digest: bbf637d9a5d11b91d6f03d86a5ad7f9a24a0e87fd8ff377ab0e4845683c5ed3b
approval_gates:
  source_write: approved_consumed_2026-09-30
  automated_test: approved_consumed_2026-09-30
  thumbnail_fix_source_write: approved_consumed_2026-11-02
  thumbnail_fix_automated_test: approved_consumed_2026-11-02
  local_browser_runtime: closed
  manual_uat: thumbnail_user_attested_remaining_deferred_2026-11-02
  electron_package_build: closed
  deployment: closed
  commit: closed
  push: closed
---

# 一頁四張排版執行結果

## 目前結論

2026-11-02 使用者回覆「確認問題已解決，可以收束當前計畫。」純上下縮圖與末頁空格修正記為使用者人工驗收通過（user-attested）；計畫生命週期已完成，結案分類為 `closed_with_validation_gaps`。先前直接回歸 48/48、lint／build 通過；本次只收束文件，未修改產品或啟動應用。

先前 Word 左右圖片內寬與六張／上下雙向混排已補正，當時預覽與列印未修改。首輪審查要求的明示欄寬測試已補強；相關集合 38/38、lint／build 通過，聚焦複審 `deleg_c0fcd197` 為 PASS，該輪來源測試缺口已關閉。該歷史審查不涵蓋本輪縮圖修正；Word／列印等完整人工矩陣未取得逐項回報，結果仍為 `partial`，不宣稱 Word 實機相容性或完整矩陣通過。以下各輪當時的待驗敘述保留為歷史，現行處置以下方結案小節為準。

## 上下排版縮圖補正（2026-11-02）

- 原因是純上下未指定單欄，上方格卻跨三欄、下方格沒有對應定位，產生隱含欄位。只在 `CollagePageThumbnail.tsx` 明確指定 `grid-cols-1 grid-rows-2`，並讓上下兩格各占第一欄的第一／第二列；空格沿用相同定位及置中。保留原圖片等比例顯示、標記覆蓋層、其他模板、分頁及輸出程式。
- 在既有 `printPreview.test.ts` 共用的真實元件載入器補兩項回歸。修正前執行具名兩項為 1 通過、1 預期失敗、退出 1，原因為上下縮圖缺少單欄；混排基線已通過。修正後涵蓋一／兩張、有／無標記、圖片順序、兩格欄位及列位、空格置中與唯讀無控制點；另確認上下／六張兩方向保留三欄及橫圖跨三欄。
- `node --test --test-reporter=tap --test-skip-pattern='列印預覽不依賴後端 session' src/features/PrintPreview/printPreview.test.ts src/features/ImagePreview/manualLayoutPreference.test.ts src/features/ImagePreview/imageAnnotations.test.ts`：48/48、退出 0。`node --test --test-reporter=tap src/features/PrintPreview/printPreview.test.ts`：13/14、退出 1，唯一失敗仍是「列印預覽不依賴後端 session 並明確說明系統列印另存 PDF 邊界」，沒有刪除或放寬斷言。
- `pnpm run lint`、`pnpm run build` 各退出 0；大型區塊警告保留。基線、紅階段、直接回歸、完整列印與品質日誌保存於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-stacked-thumbnail-fix-20261102/`，命令與數量見 `tests.json`、`quality.json`。本輪保護 30 筆既有變更，暫存區不動；來源採基線相對的精確轉換驗證，既有測試只插入本輪兩項，其他內容保留。
- 本輪為局部格線修正，由主代理自檢，`thumbnail_fix.review_used: false`；不借用先前 Word 的獨立 PASS。來源／自動驗證核准已消耗。來源交付當時保留縮圖視覺與原 Word 人工驗收缺口；其後縮圖已由使用者確認，原 Word 等缺口維持未取得證據。Agent 未啟動正式應用／瀏覽器、打包、部署、提交或推送。

## Word 左右內寬及六張／上下欄寬補正

- 左右圖片仍被固定 76 mm 限制；改為與兩欄圖片格位相同的可用內寬 81 mm，左右各 2 mm 內距。高度仍為 180 mm、列高與兩欄 85 mm 配置不變，保持等比例及末頁留空。
- 原六張／上下混排的三等寬基準欄，與上下編號／備註的明示 18／152 mm 欄寬相衝突。兩方向改用四個共同基準欄：第一個三等分格拆為 18 mm 編號窄欄與剩餘內段，六張三格依序跨 2／1／1 欄；上下圖片跨四欄，編號占第一欄，備註跨後三欄。
- 先以 `docx.convertMillimetersToTwip()` 換算，再用整數總寬補最後一欄；總寬一致，三等分格最多相差 1 twip（Word 長度單位的取整差），編號／備註寬度與共用基準欄相符。圖片、編號與備註三列都採相同跨度，不讓不同列互相擠壓。
- 只改 `browserWordExporter.ts`、其測試與本工作線三份文件；分頁、預覽、列印、四張、四張／六張、封存、依賴及 `src/utils/log.ts` 均受保護。20 份受保護內容雜湊、`dev` 分支、原工作樹狀態清單及空暫存區通過。
- 先執行 `node --test --test-reporter=tap --test-name-pattern='Word 左右橫式|Word 六張上下混排' src/services/browserWordExporter.test.ts`，0/2、exit 1：左右實際圖片尺寸過小，混排明示儲存格寬度與基準欄衝突。實作後以下四檔範圍內集合 38/38、exit 0。

```text
node --test --test-reporter=tap --test-skip-pattern='列印預覽不依賴後端 session' src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts src/services/browserProjectArchive.test.ts
```

- 新增兩項實際 DOCX 回歸：左右圖片精確內寬、內距、欄寬、原列高、連號及末頁留空；六張／上下兩方向各 1／2／3 張，逐列依基準欄加總跨度，確認三格等寬、18／152 mm 編號／備註、不衝突、原列高、禁止拆列、留空、換行與跨頁連號。上一輪橫直 JPEG 內寬測試保留。
- `pnpm run lint`、`pnpm run build`、`git diff --check` 均 exit 0。含既有列印文案測試的四檔集合實跑為 38/39、exit 1，唯一失敗仍為原具名文案契約，輸出 `/tmp/image-pigeon-word-layout2-tests.tap`。未修改範圍外文案或執行完整前端集合；既有建置區塊與 Node 警告保留。
- 相對差異 `/tmp/image-pigeon-word-layout2-relative.diff`；來源與保護內容 `/tmp/image-pigeon-word-layout2-review.json`，兩檔來源合併 SHA-256 `edfbb2de839f4b0b917a6eaee50157506a29e2e921d52dbd0dc0e67b31be8b44`。
- 首輪審查 `deleg_915ecf6b`（`gpt-5.6-terra`）為 REQUEST_CHANGES：輸出欄寬／跨度正確，獨立 Word 測試 9/9，來源及保護雜湊 22/22 相符；唯一缺口為測試未強制上下編號／備註兩格的明示 `tcW` 存在。這是驗證缺口，並非又一項輸出排版錯誤。審查者未改檔。
- 主代理先對兩格各別刪除輸出 XML 的 `tcW` 加入負向斷言，具名混排測試實跑 0/1、exit 1（未拋出應有例外），再補編號／備註列要求每格明示欄寬必須存在且符合合併後寬度；六組正向輸出及兩格各別缺欄寬的負向案例均通過。只改測試，`browserWordExporter.ts` 原始位元組雜湊與首輪完全相同。
- 補強後範圍內集合重新實跑 38/38、lint／build／差異檢查 exit 0，輸出 `/tmp/image-pigeon-word-layout2-rereview-tests.tap`。目前來源 `/tmp/image-pigeon-word-layout2-rereview.json`，合併 SHA-256 `d59b987609e62dcb9e04796cd928203bfc3273c39577d8ca31222eb4a432fc69`；明列聚合演算法為路徑字典序的 `UTF-8 LF-join(path + ':' + sha256)`，無尾端換行。
- 聚焦複審 `deleg_c0fcd197`（`gpt-5.6-terra`）為 PASS：兩個編號／備註格均要求明示 `tcW`，兩格各別移除欄寬都被負向斷言拒絕；原欄寬、容許取整差與三等分檢查保留。獨立重跑 Word 測試 9/9、0 失敗；來源 2 檔與保護內容 20 檔逐檔雜湊全數相符，輸出程式未變。首次 REQUEST_CHANGES 後只補強測試一輪，不擴張產品範圍。
- 複審指出聚合欄位的範圍未明確標示；主代理已明列 `digest_scope` 為兩份來源，不包含受保護內容，原來源摘要 `d59b987609e62dcb9e04796cd928203bfc3273c39577d8ca31222eb4a432fc69` 不變。另列來源加保護內容共 22 檔的 `all_files_sha256` 為 `51ee2cd4b3978d3694907779a746566bf49e61defbe43c380344241b8f4ab4bd`，兩者均由磁碟核對並依明列範圍重算；只校正快照說明，未改來源或測試，不觸發重跑。
- PASS 後校正本結果、計畫與 STATE，保持人工待驗及原副作用閘門。未啟動 Word 或任何應用、列印、打包、commit、push；DOCX 結構驗證不是 Word GUI 相容性證據。

## Word 圖片內寬補正歷史證據

- 原因：四張及六張使用固定 76／50 mm 圖片上限，未依 170 mm 表格的兩欄／三欄可用內寬計算，留下額外左右空白。
- 圖片儲存格明確設定左右各 2 mm 內距，以格寬扣除內距作圖片寬度上限；四張由 76 增至 81 mm，六張由 50 增至約 52.67 mm。純版型、四張／六張雙向混排及與上下的雙向混排均套用。
- 保持等比例、不裁切、不拉伸；高度受限的照片仍依原高度上限縮小，不強迫所有照片填滿寬度。原欄寬、列高、安全預留、編號、備註及其他 Word 格位不變。
- 本次只修改 `src/services/browserWordExporter.ts`、`src/services/browserWordExporter.test.ts` 與本計畫／結果／STATE。預覽、列印、分頁、封存、依賴及既有 `src/utils/log.ts` 未修改；19 份受保護內容雜湊符合本次基準，分支 `dev`、暫存區空且工作樹狀態清單不變。
- 測試先行：新增具名內寬測試先 exit 1，確認缺少儲存格明確內距。實作後第一次重跑發現測試假定 XML 屬性順序，改為不依賴屬性順序的斷言；未為此改產品設定。
- 新增一項測試涵蓋八種純／混模板，以有效 4×2 與旋轉後 2×4 JPEG 實際產生 DOCX，確認內距、逐圖片精確尺寸、原高度上限及非目標格位沒有新增內距。既有固定欄寬、等高、跨欄、留空、連號及禁止拆列回歸保留。
- 精確排除既有「列印預覽不依賴後端 session」的四檔集合為 36/36、exit 0；執行命令同下方歷史集合。含該文案測試的集合實跑為 36/37、exit 1，唯一失敗仍為原文案契約；輸出 `/tmp/image-pigeon-word-width-tests.tap`，未修範圍外文案，未執行完整前端集合。
- `pnpm run lint`、`pnpm run build`、`git diff --check` 均 exit 0；既有大型區塊警告保留。主代理自檢與客觀 DOCX 測試足以涵蓋本次低風險修正，`review.used: false`，沒有新增獨立審查。
- 本次相對差異 `/tmp/image-pigeon-word-width-relative.diff`；兩檔來源快照及受保護內容 `/tmp/image-pigeon-word-width-review.json`，合併 SHA-256 為 `891e827582bdee6669ed25253e9c3fbe5b402537777ada1fcd71b7c1da73988c`。DOCX 結構通過不等於 Microsoft Word GUI 驗收；未啟動應用、Word、列印、打包、commit 或 push。

## 四張／六張混排補正歷史證據

- 雙向新增 `mixed-grid2-small3`、`mixed-small3-grid2`：四張半頁最多兩張、六張半頁最多三張，不足留空。沿用既有角色，只取緊鄰同偏好圖片；前段四張超過兩張或六張超過三張仍優先純版型，混排剩餘圖片接續分頁，不越過其他偏好補圖。
- 縮圖與列印使用六個等寬基準欄、上下兩個等高半頁，四張每格跨三欄、六張每格跨兩欄；定位限定新模板，不改舊角色在純版型或上下混排的位置。編號、備註與旋轉沿用既有元件。
- Word 使用六個等寬基準欄，四張儲存格跨三欄、六張跨兩欄；每半頁採 84／8／28 mm 的圖片／編號／備註列高並禁止拆列，圖片分別限制 76×82 與 50×82 mm。基準欄總寬與 170 mm 僅有換算至 twip（Word 的長度單位）的微小取整差，不改 A4 邊界，總高度保留安全餘量。
- 封存仍為 version 2，混排由既有偏好衍生，不增加欄位。相對前一輪快照修改 8 檔來源／測試；不修改依賴、套件／鎖定檔、入口、版本、Electron 或使用者既有 `src/utils/log.ts`。

### 本輪驗證

- 測試先紅後綠：具名「四張六張」三項新增測試的紅階段 exit 1；實作後以下集合 35/35、exit 0：

```text
node --test --test-reporter=tap --test-skip-pattern='列印預覽不依賴後端 session' src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts src/services/browserProjectArchive.test.ts
```

- 分頁涵蓋雙向半頁容量組合、留空、純版型優先及剩餘跨頁；舊五種模板使用固定 fixture 回歸，混合偏好窮舉檢查完整順序、無漏圖與重複。
- 實際元件靜態渲染與 CSS 契約檢查兩格／三格跨度、上下半頁、留空、編號、多行備註與旋轉；不是瀏覽器視覺驗收。
- 實際產生 DOCX 並解壓檢查固定六欄、雙向跨度、等高列、安全餘量、禁止拆列、圖片數及留空；舊 Word 與封存測試同集合通過，不是 Word GUI 驗收。
- `pnpm run lint`、`pnpm run build`、`git diff --check` 均 exit 0；build 保留非阻擋的既有大型區塊警告。
- 含既有列印文案測試的集合為 35/36、exit 1，唯一失敗仍是 `列印預覽不依賴後端 session 並明確說明系統列印另存 PDF 邊界`。輸出保存在 `/tmp/image-pigeon-grid46-tests.tap`，未修正文案或宣稱完整集合全綠。
- 新來源快照 `/tmp/image-pigeon-grid46-review.json`：14 檔來源、11 檔受保護內容；合併 SHA-256 為 `86c448a7b74262dd67058d8d8ed713f928af3cb39de8071faf4d8861d5735314`。相對補正差異為 `/tmp/image-pigeon-grid46-relative.diff`。分支 `dev`、暫存區空，受保護內容相符。
- 聚焦獨立審查 `deleg_947fc8db`（模型 `gpt-5.6-terra`）為 PASS，限原始碼與自動驗證；首次審查即通過，沒有阻擋、修正或範圍漂移。確認雙向分頁、留空／容量優先序／順序、新模板限定六欄定位與舊角色隔離、DOCX 跨欄／半頁等高／禁止拆列／頁高餘量，以及既有封存 version 2 回歸。
- 審查者獨立重跑上述指定命令 35/35、退出碼 0；`git diff --check` 與暫存區護欄通過，審查全程未改檔、未啟動應用或 GUI，未重跑 lint／build。來源14/14、保護內容11/11符合；主代理接收後再從磁碟原始位元組重算，相同合併摘要。前兩輪審查仍僅作歷史證據。
- PASS 後僅收束本結果、計畫與 STATE；文件前置資料、路徑／連結、核准閘門、待人工狀態、未追蹤文件空白、非目標工作線保留及來源／暫存區護欄均核對。未重跑有效產品證據或擴張執行範圍。

## 初版實際變更與歷史證據

- `LayoutPreference` 加入 `grid-4`，共用自動分頁加入獨立模板及左上、右上、左下、右下四個角色。連續四張每四張一頁，不足留空，遇其他偏好另起頁；舊混排與匯入預設不變。
- 單張選擇器與整理模式批次選擇器加入「四張」，整理卡顯示「四張」標籤；批次回呼沿用共用型別，側欄四個選項改為兩欄排列。既有狀態更新函式未修改，旋轉仍保留手動排版偏好。
- 縮圖及列印加入 2×2 版型與明確格位，沿用圖片、編號、備註及旋轉路徑，不改紙張設定。
- Word 加入兩個 85 mm 等寬欄；上下各使用 84／8／28 mm 的圖片／編號／備註固定列高，圖片限制為 76×82 mm 並等比例縮放，保留頁尾空間。沿用原字級、備註垂直對齊、A4 與邊界。
- `.ipigeon` 仍為 `image-pigeon.project` version 2，既有欄位允許 `grid-4`。新版本可讀取舊專案；舊版仍會拒絕含 `grid-4` 的專案，未新增降級輸出。
- 僅校正架構文件的現行版型說明；未修改套件、鎖定檔、版本、Electron、匯入、資源上限或範圍外功能。

## 初版自動驗證證據

聚焦命令：

```text
node --test src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts src/services/browserProjectArchive.test.ts
```

最終結果為 29/30，exit 1；唯一失敗為既有「列印預覽不依賴後端 session 並明確說明系統列印另存 PDF 邊界」。`PrintPreviewOutput.tsx` 不含測試期待的「可透過系統列印對話框另存 PDF」文案，來源與該舊斷言均未修改。完整輸出暫存於 `/tmp/image-pigeon-four-layout-tests.tap`。不將此既有失敗當成本輪新功能缺陷，也未削弱原測試。

排除該具名既有失敗的同範圍命令：

```text
node --test --test-skip-pattern='列印預覽不依賴後端 session' src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts src/services/browserProjectArchive.test.ts
```

結果 29/29，exit 0。Node 此選擇器不把未選中的測試列入總數；不是完整測試全綠，也未執行 `pnpm run test:frontend`。

| 驗證項目 | 實際證據 |
|---|---|
| 四格分頁／狀態 | 10/10；1–9 張滿頁及留空；四種偏好、長度不超過五的排列檢查順序、無重複、無漏圖、不跨格式補圖及舊版型分配；實跑單張／批次設定及旋轉保留偏好 |
| 縮圖／列印 | 排除已知舊失敗後 7/7；來源契約、TypeScript 語法樹確認側欄容器與禁用條件，Node 內實際元件渲染確認三張＋空格的圖片順序、編號、備註及旋轉；不是瀏覽器幾何或互動驗收 |
| Word | 4/4；新四張測試實際產生 DOCX Blob 並解壓 XML，五字級×兩種備註對齊共十組，確認兩等寬欄、上下固定等高、禁止拆列、留空結構、表格高度預留、跨頁連號及多行備註；不宣稱 Word GUI 通過 |
| 專案封存 | 8/8；四張偏好往返保存、既有六張專案仍可讀，保留路徑、資產集合、資源界線與取消回歸；合成 WebP 結構及尺寸檢查沿用既有受控測試介面 |
| `pnpm run lint` | exit 0 |
| `pnpm run build` | exit 0；TypeScript 與 Vite 產生 `dist/`。保留大於 500 kB 區塊警告，未擴張效能調整 |
| `git diff --check` | exit 0 |
| 範圍／分支／暫存區護欄 | exit 0；僅計畫允許路徑改動，`dev` 不變，暫存區仍空 |

### 測試先行及整合修正

- 主代理先新增分頁測試，實際觀察原演算法將 `grid-4` 誤當 `portrait-large-2` 的兩項預期失敗，再新增四張分支取得 10/10。狀態測試最初的資產 URL fixture 缺漏另行修正，不冒充產品 RED；既有狀態更新本已接受偏好，不需改寫。
- 委派實作者回報單張入口初始 RED 為缺少四張選項；封存初始 RED 為允許清單拒絕 `grid-4`；Word 初始 RED 為共用分頁尚未加入四張。主代理整合後重跑，不沿用子代理早於 core 完成的建置失敗作目前結論。
- 主代理發現 Word 新測試把 85／8 mm 的單位取整值寫錯；依 `docx.convertMillimetersToTwip` 實際輸出校正測試並補尺寸與輸出結構斷言，未為測試修改紙張設定。
- 補強的 Node 元件渲染測試曾因測試器 CommonJS 預設匯入未啟用互通而失敗；校正轉譯設定後通過，未改產品元件。Node 的 localStorage 實驗性警告不影響測試退出碼。

## 初版歸因與審查

實作基線：`dev`；`STATE.md` 已修改、本計畫未追蹤，其餘本輪來源乾淨；暫存區空。基線及完整允許路徑快照保存於 `/tmp/image-pigeon-four-layout-baseline/`；未暫存、提交、推送、還原或清理既有工作。

- 原生委派 `deleg_1875b9d5`，實作者模型為 `gpt-5.6-terra`：Word／封存四檔與介面／預覽九檔分別執行。主代理負責分頁型別／演算法、狀態回歸、整合驗證、測試器校正及治理文件。
- 主代理首次整合為 26/28，Word 測試取整預期有誤且存在既有列印文案失敗；校正並補強後，最終本輪相關測試為 29/29，含既有失敗的聚焦集合為 29/30。未出現允許範圍外修改。
- 聚焦獨立審查 `deleg_84c7eade` 為 `PASS`（限原始碼與自動驗證），沒有阻擋問題。審查者核對分頁與舊混排、單張／批次接線、四格預覽／列印、Word 固定表格與 version 2 封存；獨立重跑範圍內測試 29/29、exit 0，未重跑 lint／build，也未啟動應用或 GUI。
- 初版來源／測試共 17 檔的快照由逐檔原始位元組 SHA-256 定義，聚合規則為路徑字典序的 `UTF-8 LF-join(path + ':' + sha256)`、無尾端換行；治理收束文件另列，不混入凍結來源快照。當時審查者與主代理重算均符合 `bbf637d9a5d11b91d6f03d86a5ad7f9a24a0e87fd8ff377ab0e4845683c5ed3b`，PASS 只適用補正前來源。
- PASS 回傳後僅校正本結果、計畫與 STATE 的審查及下一步欄位；文件前置資料、相互引用、人工待驗狀態、未追蹤文件空白格式、非目標工作線保留、來源快照及差異／暫存區護欄通過。未重跑產品測試或擴張審查範圍。

## 四張／上下混排補正歷史證據

使用者明確核准修訂原計畫並直接完成補正，取代初版不混排的限制；本輪只改共用模板／角色、分頁、縮圖、列印、Word 及其三份直接測試，共十份來源／測試。封存、單張／批次入口與狀態函式不需再改。

- 分頁新增 `mixed-landscape1-grid2`、`mixed-grid2-landscape1`，四張半頁最多兩張；沿用六張混排優先序，不跨其他偏好，不改純四張每頁容量。
- 縮圖／列印使用兩欄兩列，獨立上下格位跨兩欄；不重用六張的跨三欄角色，避免多出隱含欄位。
- Word 每半頁均為 84／8／28 mm 圖片／編號／備註列，兩欄各 85 mm；上下半頁的三列均跨兩欄，圖片上限 150×82 mm，四張格仍為 76×82 mm。保留固定高度、禁止拆列及頁尾預留。
- 調整被新契約取代的「四張永不混排」測試；保留順序、不重複、不漏圖及左右／六張隔離。舊版型以既有固定案例的預期模板與格位直接驗證，不用同一 builder 作自己的預期值。

先實跑以下新增測試，結果 0/3、exit 1：分頁缺少混排模板而分兩頁；縮圖仍落入三欄；Word 仍產生三頁而不是兩頁。均為缺少本次行為的預期失敗，不是測試器或環境錯誤。

```text
node --test --test-reporter=tap --test-name-pattern='四張與上下兩方向|四張混排' src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts
```

實作後執行：

```text
node --test --test-reporter=tap --test-skip-pattern='列印預覽不依賴後端 session' src/features/ImagePreview/manualLayoutPreference.test.ts src/features/PrintPreview/printPreview.test.ts src/services/browserWordExporter.test.ts src/services/browserProjectArchive.test.ts
pnpm run lint
pnpm run build
git diff --check
```

結果為 32/32、lint／build／差異檢查 exit 0；分頁／狀態 11、縮圖／列印 8、Word 5、封存 8。新增測試涵蓋兩方向的滿半頁與留空、容量優先序／跨頁／偏好隔離、實際元件內容與跨欄樣式、DOCX 跨欄列數／等高／連號／多行備註。Word 舊五種版型及純四張測試保留；封存測試重新通過，版本與欄位未變。

未排除既有列印文案測試的同四檔集合實跑為 32/33、exit 1，仍只有原具名失敗；輸出保存在 `/tmp/image-pigeon-grid4-mixed-tests.tap`。未執行完整前端集合。Node localStorage 實驗性警告與 Vite 大區塊警告仍保留，不冒充範圍內失敗。

本輪未提交修改基線包含初版成果及 `src/utils/log.ts` 既有修改；以本輪開始的逐檔雜湊確認允許範圍外內容不變，未覆寫、還原、暫存或提交。補正相對差異保存於 `/tmp/image-pigeon-grid4-mixed-correction.diff`；受審來源／測試與必要不變依賴共 14 檔的原始位元組快照保存於 `/tmp/image-pigeon-grid4-mixed-review.json`，聚合規則同初版，摘要為 `17827910a12192dcdac9dbf001d64ea349b4aae1edcc6230e93bd9851bf64db3`。

聚焦獨立審查 `deleg_b39ec195`（模型 `gpt-5.6-terra`）為 `PASS`，沒有阻擋發現；確認兩方向分頁／留空／順序與偏好隔離、縮圖及列印固定兩欄與跨欄位置、Word 等寬／等高／跨欄與安全預留、既有模板與封存 version 2 不變。審查者獨立重跑指定範圍內測試為 32/32、exit 0，`git diff --check` exit 0，未重跑 lint／build、未修改檔案或啟動應用。審查者最後重算來源 14/14、受保護 10/10 皆相符；主代理接收回傳後再由磁碟原始位元組核對，相同摘要且暫存區仍空。

PASS 後僅校正結果、計畫與 STATE 的審查處置／下一步；文件前置資料、相互引用、人工待驗狀態、未追蹤文件空白格式、非目標工作線保留、來源快照及差異／暫存區護欄均通過。未重跑產品測試或擴張審查範圍。

## 結案時保留的驗證缺口

以下原人工矩陣沒有逐項回報，依使用者明確結案要求保留為 `deferred_no_pass`，不再作為本計畫的強制補驗待辦；未來要補驗須另行核准。純上下縮圖及末頁空格已由使用者確認，不列為待驗。

1. 單張／批次四張設定、整理標籤與 `.ipigeon` 重新開啟的完整人工組合。
2. 純四張、四張／上下及四張／六張各兩方向混排的完整視覺、列印／另存 PDF、留空及跨頁組合。
3. Microsoft Word 實機開啟 DOCX 的內寬、比例、混排等寬、窄編號欄、備註及無意外溢頁組合。

完整列印相關測試 13/14 的既有提示文案斷言失敗亦保留，未修改或放寬斷言。上述缺口不是本次新增功能故障的判定，也不等於已驗收通過。

## 使用者確認與文件收束（2026-11-02）

- 使用者原文：「確認問題已解決，可以收束當前計畫。」人工通過範圍限剛交付的純上下縮圖及末頁「空」提示，不擴張為全部 Word／PDF 或保存重開驗收。
- 收束前直接從磁碟核對縮圖來源及直接測試的 SHA-256，符合前輪 `verification.json` 的兩份來源記錄。既有 48/48、lint／build 與前輪範圍驗證證據不變，本次沒有重跑產品測試或新增獨立複審。
- 僅修改本結果、原計畫及 `STATE.md`；計畫為 `completed`、結果維持 `partial`，現行檢查點為 `closed_with_validation_gaps`。STATE 移除本工作線、保留近期結果導航，並清理其他工作線指向本已結案工作線的衝突引用；不關閉其他工作線。
- 本輪文件驗證命令為 `node /Users/cksai/.hermes/cache/scratch/image-pigeon-layout-closure-20261102/verify.mjs`，涵蓋 YAML 前置資料、狀態／指標、歷史審查保留、非目標工作線、檔案雜湊、路徑／連結、過期現況、空白、Git 差異與暫存區護欄；實際收據保存於同目錄 `verification.json`。原計畫與結果保留，不刪除歷史證據。
- Agent 未啟動應用程式、瀏覽器、系統列印或 Word GUI；未執行 Electron 重新打包、部署、暫存、commit 或 push。使用者人工驗收不轉寫為 Agent 執行階段 PASS，亦不開啟任何未核准副作用。
