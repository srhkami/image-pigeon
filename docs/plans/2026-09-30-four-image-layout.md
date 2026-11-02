---
type: plan
id: plan-image-pigeon-four-image-layout-2026-09-30
status: completed
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
created_at: 2026-09-30
branch:
  name: dev
  base: dev
  status: existing_dirty_governance_only
execution:
  status: partial
  current_checkpoint: closed_with_validation_gaps
  word_checkpoint: word_source_verified_manual_not_attested
  thumbnail_fix_status: user_attested_complete
closure:
  status: closed_with_validation_gaps
  completed_at: 2026-11-02
  authority: 使用者確認問題已解決，可以收束當前計畫
  remaining_manual_validation: deferred_no_pass
result: docs/result/2026-09-30-four-image-layout-result.md
approval_gates:
  planning_docs: approved_2026-09-30
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
related:
  - docs/architecture/current-architecture.md
  - docs/plans/2026-08-28-electron-portable-mvp.md
---

# 一頁四張排版計畫

## 1. 目標與已確認行為

新增「四張」排版，讓編輯預覽、列印／系統另存 PDF 與 Word 輸出使用一致的 2×2 四格分頁，並可保存至 `.ipigeon` 後重新開啟。

- 「均分」指保留現有標題、頁尾及邊界後的頁面內容區，四格等寬、等高；不改既有紙張設定。
- 圖片順序為左上 → 右上 → 左下 → 右下；沿用等比例縮放、旋轉、編號與備註，不強制裁切。
- 連續採用「四張」的圖片每四張一頁，不足四張保留空格。支援四張／上下及四張／六張的兩方向半頁混排：上下半頁一張、四張半頁最多兩張、六張半頁最多三張，不足格位留空；只取緊鄰連續同偏好圖片，不越過其他偏好補圖。
- 四張在前且連續超過兩張、六張在前且連續超過三張時，仍優先各自純版型；上下在前且連續兩張仍優先上下成頁。半頁混排取用後，其餘圖片接續分頁，順序不變。
- 編輯模式可單張設定，整理模式可批次套用並顯示「四張」標籤。
- 僅新增四張／上下及四張／六張各兩個半頁混合版型；不改圖片匯入預設、純上下／左右／四張／六張及原六張／上下混排規則，不新增左右混排。

## 2. 必要做法與範圍

沿用 `LayoutPreference` 與共用 `buildAutoCollageLayout`，新增 `grid-4` 偏好、獨立四格模板及四張／上下、四張／六張兩方向混合模板。四張／六張縮圖與列印以六個基準欄呈現：四張格跨三欄、六張格跨兩欄，上下半頁等高；沿用現有四張及六張角色，僅在新模板限定欄位置。縮圖、列印及 Word 各自補上呈現，不新增依賴或通用排版框架。混排仍只保存原偏好，由共用分頁衍生，不新增封存欄位。

Word 純四張及四張／上下使用固定兩欄；四張／六張使用六個基準欄，四張半頁每格跨三欄、六張半頁每格跨兩欄，各半頁等高並保留圖片、編號與備註。沿用既有字級與備註對齊選項，保留總高度與圖片預留；新增尺寸配置不得意外溢至下一頁。

Word 圖片寬度補正只修改 `browserWordExporter.ts` 與其測試及本工作線文件：四張與六張格位（包含既有混排）依欄寬扣除左右各 2 mm 的明確圖片儲存格內距計算可用圖片寬度，不再額外限制為 76／50 mm。保持等比例縮放、不裁切，原圖片高度上限、列高、欄寬、編號與備註不變；其他 Word 格位及預覽／列印原始碼均不修改。

後續 Word 補正仍限同兩份原始碼／測試與本工作線文件：「左右」採相同左右各 2 mm 內距及可用圖片內寬；六張／上下的雙向混排使用能同時表達三等分圖片與 18／152 mm 編號／備註的共同基準欄，所有列的跨欄總數與欄寬一致。不改圖片高度上限、列高、內容、分頁及其他模板；前一輪「其他 Word 格位不修改」的限制僅就這兩項問題被取代。預覽／列印、依賴、打包與外部副作用仍不修改或執行。

專案沿用 `image-pigeon.project` version 2 與既有 `layoutPreference` 欄位，擴充封存驗證允許清單；否則保存的 `grid-4` 會被重新開啟流程拒絕。新版須維持讀取既有專案；舊版會拒絕含 `grid-4` 的專案，此限制已納入本輪範圍，不做舊版降級或相容輸出。

### 允許修改路徑

| 分類 | 路徑與用途 |
|---|---|
| 排版資料與演算法 | `src/types/project.ts`、`src/utils/type.ts`、`src/features/ImagePreview/autoCollageLayout.ts`：新增偏好、模板、格位與連續四張分頁分支 |
| 操作入口與標籤 | `src/features/ImagePreview/FocusImageCard.tsx`、`src/features/ImagePreview/ImageCardForMove.tsx`、`src/layout/Sidebar.tsx`、`src/App.tsx`：單張／批次選項、標籤、型別及側欄局部排列 |
| 預覽與列印 | `src/features/ImagePreview/CollagePageThumbnail.tsx`、`src/features/PrintPreview/PrintablePage.tsx`、`src/features/PrintPreview/PrintableSlot.tsx`、`src/features/PrintPreview/printPreview.css`：2×2 網格、格位定位及模板名稱 |
| Word 與封存 | `src/services/browserWordExporter.ts`、`src/services/browserProjectArchive.ts`：四格表格與偏好允許清單 |
| 聚焦測試 | `src/features/ImagePreview/manualLayoutPreference.test.ts`、`src/features/PrintPreview/printPreview.test.ts`、`src/services/browserWordExporter.test.ts`、`src/services/browserProjectArchive.test.ts`：四格分頁、操作入口、輸出與存取回歸 |
| 文件與收束 | 本計畫、`STATE.md`、`docs/architecture/current-architecture.md`；架構文件僅校正現行版型說明。執行後建立 `docs/result/2026-09-30-four-image-layout-result.md` |

既有單張與批次狀態更新已接受 `LayoutPreference`，直接沿用 `src/state/projectState.ts`，不預設修改該檔。Word 專案轉接器已傳遞排版偏好，不預設修改。

不修改圖片匯入／壓縮、資產儲存、圖片 ZIP、資源上限、Electron 主程序、套件／鎖定檔、版本號與更新紀錄；不新增 PDF 輸出器、四張／上下及四張／六張以外的混排功能、提示文案或舊版相容機制。Electron 重新打包不在本輪實作核准內。

## 3. 驗收與驗證

| 驗收 | 可觀察結果與最小驗證 |
|---|---|
| 四格分頁正確 | 滿四張為一頁；不足四張留空；超過四張續頁；四張／上下及四張／六張兩方向可合併半頁，不足留空；不跨其他偏好補圖且不改純版型及原六張／上下混排。聚焦測試確認容量優先序、格位順序、完整圖片順序、無漏圖與無重複 |
| 操作與保存一致 | 單張及批次「四張」生效，整理標籤正確；旋轉不覆寫偏好。保存後重新開啟保留 `grid-4`，既有專案仍可讀取；以入口契約、既有狀態回歸及封存往返測試確認 |
| 預覽與列印一致 | 純四張為等寬、等高四格；四張／上下的上下圖片跨兩欄；四張／六張各占半頁、分別兩格與三格；編號、備註與圖片順序正確。以元件渲染／樣式契約及人工預覽、列印／系統另存 PDF 確認 |
| Word 正確 | 產生可開啟的 DOCX，純四張兩欄及上下配置相等；混排半頁等高，四張／六張的兩格／三格分別等寬；保留編號、備註、留空與跨頁順序。以 DOCX 結構測試及 Microsoft Word 人工開啟確認，不以結構測試宣稱 Word 相容性通過 |
| 既有功能未受影響 | 聚焦回歸保留既有版型、旋轉與狀態契約；`pnpm run lint`、`pnpm run build`、`git diff --check` 與允許路徑／暫存區護欄通過 |

自動驗證優先執行上述聚焦測試；未涉及的完整測試不預設重跑，若實際執行遇到既有範圍外失敗，只記錄而不順便修正。人工驗收使用滿頁、末頁留空、跨頁、與其他版型相鄰、橫直圖、旋轉與多行備註的精簡組合，不擴張為全系統驗收。

人工瀏覽器／列印及 Word 驗收由使用者操作，Agent 不在未核准時啟動應用程式或系統列印。原始碼與自動驗證通過但人工證據不足時，不宣稱完整驗收通過；使用者於第 7 節明確要求結案後，計畫生命週期為 `completed`，執行／結果仍維持 `partial` 並保留具體缺口，不再以未補驗項目阻擋本計畫收束。

## 4. 核准、執行與停止條件

- 使用者於 2026-09-30 明確要求開始執行本計畫，原始碼實作與自動驗證已核准，計畫轉為 `active`；此核准不包含啟動應用程式、人工驗收或打包。
- 使用者同日核准「修正原計劃，直接完成補正」，取代初版禁止四張／上下混排的契約，核准上述兩方向混排的原始碼、測試與必要文件校正。既有純四張 PASS 僅保留歷史證據，補正後重新驗證及聚焦審查；其他副作用閘門不變。
- 使用者同日新增「四張和六張也要可以放在同一頁」，本輪納入四張／六張兩方向半頁混排及直接來源、測試與文件校正；取代四張與六張永不混排的限制，不擴張至左右或其他副作用。前一輪審查僅保留歷史證據，新補正重新驗證及聚焦審查。
- 使用者後續指出橫式照片未充分利用寬度，並確認只有 Word 有問題、預覽與列印正常；本次只補正上述 Word 圖片內寬與直接回歸。保留歷史審查，補正後重新驗證，不以原快照 PASS 代替新證據；其他閘門不變。
- 使用者再指出「左右」圖片未充分利用寬度，以及六張／上下同頁時三格不等寬、上下編號過寬，並明確確認均為 Word 問題；納入上述最小 Word 補正及直接自動回歸，其他閘門維持原狀。
- 取得原始碼實作與自動驗證核准後，在允許路徑內連續完成實作及必要驗證，不逐檔重問；人工驗收、Agent 啟動瀏覽器、Electron 打包、部署、提交與推送依各自明確核准處理。
- 執行前重查分支、未暫存／未追蹤差異及暫存區；規劃基線為 `dev`、乾淨工作樹、暫存區空。實作基線為 `dev`、`STATE.md` 已修改、本計畫未追蹤、暫存區空；快照保存於 `/tmp/image-pigeon-four-layout-baseline/`。保留既有治理內容，只校正本工作線，不暫存、清理或還原。
- 既有 Electron 工作線與 Windows 人工驗收證據維持原狀；其權限不授予本計畫，`STATE.md` 共用修改僅限本工作線導航與證據校正。
- 若需新增四張／上下及四張／六張以外混排、舊版相容、依賴、格式版本遷移或允許清單外修改，或既有頁面尺寸無法滿足驗收，停止受影響工作並提出最小修訂，不自行擴張範圍。
- 完成後先保存同範圍結果並校正計畫生命週期，最後更新或關閉 STATE 工作線；只記錄實際執行證據，不把文件或自動測試通過擴張為人工驗收通過。

## 5. 前輪 Word 執行現況（保留當時證據）

已完成 Word 左右圖片內寬及六張／上下雙向混排欄寬補正，不改預覽／列印。明示編號／備註欄寬的測試已補強，相關集合 38/38、lint／build 通過，聚焦複審 `deleg_c0fcd197` 為 PASS，唯一驗證缺口已關閉。含既有文案失敗集合為 38/39；來源及保護內容符合受審快照。等待使用者重新匯出 Word 確認呈現；詳細歷程見 `docs/result/2026-09-30-four-image-layout-result.md`。

瀏覽器／列印／系統另存 PDF 與 Microsoft Word 人工驗收仍待使用者另行核准，計畫保持 `active`、執行為 `partial`；Agent 不啟動應用程式。Electron 打包、部署、commit 及 push 保持關閉。

## 6. 上下排版縮圖補正（2026-11-02）

使用者確認此次問題是「上下」而非「左右」，並要求直接修正。此核准只取代前輪禁止修改預覽的限制：將純上下縮圖明確設定為單欄、兩列，上下圖片及末頁空格都占滿同一欄；不改圖片等比例完整顯示、混排、左右、分頁、Word 或列印來源。

精確允許路徑為 `src/features/ImagePreview/CollagePageThumbnail.tsx`、`src/features/PrintPreview/printPreview.test.ts`、本計畫、既有結果與 `STATE.md`。先在既有元件呈現測試重現上下圖片／空格欄位錯誤，再作最小修正，執行直接回歸、lint、build、差異及保護基線檢查；此低風險局部修正由主代理自檢，不將既有 Word 獨立審查擴稱為本輪審查。基線與收據位於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-stacked-thumbnail-fix-20261102/`。

交付修正來源時，既有 Word 待人工項目與歷史證據保持不變；Agent 正式應用／瀏覽器、打包、部署、提交及推送仍關閉。來源驗證不冒稱瀏覽器版面實測，修正後請使用者確認上下兩張及末頁「空」的位置；後續回報與結案處置見第 7 節。

本輪來源已完成：純上下明確單欄、上下兩格分別定位至第一／第二列且占滿同一欄；標記覆蓋層與原圖片路徑不變。新增回歸先取得預期失敗，修正後直接集合 48/48、lint／build 通過；完整列印為 13/14，唯一失敗仍是既有提示文案斷言，未擴修。來源與測試核准已消耗；來源交付當時為等待人工驗收，詳細證據見既有結果新增的小節。

## 7. 使用者確認與計畫收束（2026-11-02）

使用者回覆「確認問題已解決，可以收束當前計畫。」將純上下縮圖及末頁空格修正記為使用者人工驗收通過（user-attested），不補造 Agent 瀏覽器證據。收束前已核對縮圖來源與直接測試符合前輪驗證指紋；本次僅校正計畫、結果及 STATE，不修改產品或重跑已完成的產品驗證。

本計畫生命週期改為 `completed`，執行與結果仍為 `partial`，結案分類為 `closed_with_validation_gaps`。原 Word／列印／系統另存 PDF、保存重開等未逐項回報的人工矩陣，以及既有列印提示文案斷言失敗，保留為結案驗證缺口，不視為 PASS，也不再作為本計畫的強制待辦；未來若要補驗或修正，須另行核准。第 5 節的待驗狀態屬前輪歷史，不是目前下一步。

結果保留於原 canonical 路徑，STATE 移除本工作線並加入近期結果；其他工作線不受此結案涵蓋。Agent 應用／瀏覽器、Electron 打包、部署、commit 與 push 閘門保持關閉。
