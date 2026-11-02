---
type: plan
id: plan-image-pigeon-image-annotation-2026-10-30
status: active
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
created_at: 2026-10-30
branch:
  name: dev
  baseline: clean
execution:
  status: partial
  current_checkpoint: annotation_style_source_verified_waiting_manual
  ui_phase_status: user_attested_complete_2026-10-31
  annotation_phase_status: user_attested_complete_2026-11-02
  magnification_phase_status: user_reported_functional_2026-11-02
  annotation_style_phase_status: source_verified_waiting_manual
result: docs/result/2026-10-30-image-annotation-result.md
planning_result: docs/result/2026-10-30-image-annotation-planning-result.md
approval_gates:
  planning_docs: approved_2026-10-30
  ui_source_write: approved_consumed_2026-10-30
  ui_automated_test: approved_consumed_2026-10-30
  local_browser_runtime: closed
  annotation_source_write: approved_consumed_2026-10-31
  annotation_automated_test: approved_consumed_2026-10-31
  magnification_source_write: approved_consumed_2026-11-02
  magnification_automated_test: approved_consumed_2026-11-02
  project_format_change: approved_consumed_magnification_version_3_extension_2026-11-02
  annotation_style_source_write: approved_consumed_2026-11-02
  annotation_style_automated_test: approved_consumed_2026-11-02
  annotation_style_project_format: approved_consumed_version_4_2026-11-02
  electron_package_build: closed
  deployment: closed
  commit: closed
  push: closed
related:
  - AGENTS.md
  - STATE.md
  - docs/governance.md
  - docs/architecture/current-architecture.md
  - docs/adr/0002-pure-frontend-runtime-boundary.md
---

# 圖片標記與局部放大：方案 B 分階段計畫

## 1. 目標與執行邊界

在「編輯模式」的左側側邊欄加入圖片標記及局部放大工具，保留使用者選定方案 B 的緊湊工具。現行已選物件樣式依第 10 節移至圖片上方橫向懸浮面板；前段介面及格式契約保留其階段性歷史，不與最新核准並行生效。

初版先做介面；第一階段已由使用者於 2026-10-31 人工驗收通過。第二階段基本標記已完成來源、自動驗證與獨立審查；使用者於 2026-11-02 回覆「人工驗收通過。開始下一階段」，結清第二階段並開啟第 9 節局部放大實作。既有證據保留，不重做已通過的前段驗收。

## 2. 已確認的產品需求

- 工具順序分成兩組：「圖片標記」為圓形框、矩形框、線條、單箭頭、雙箭頭；「局部放大」為圓形放大、矩形放大。
- 基本標記可由側欄拖入圖片。同一張圖片允許多個物件，物件可移動、調整尺寸及適用顏色。
- 圓形框、矩形框不鎖定長寬比例：可以分別調整寬、高，也能從角落調整整體尺寸；圓形框可以拉成橢圓。線條與箭頭以端點調整長度及方向。
- 圓形框、矩形框可選框線及填滿顏色，填滿包含「無」。線條、箭頭及局部放大只提供框線顏色。
- 局部放大採「選取範圍 → 複製同樣顯示大小的區域 → 使用者手動放大或縮小」。副本可移動，但只能拖曳角落等比例縮放，不能單獨拉寬或拉高；不另設外框與內部倍率兩套調整。
- 圖片 ZIP、Word、列印／系統另存 PDF 都須包含標記及放大副本；`.ipigeon` 重新開啟後仍可編輯物件。Word 等輸出使用合成圖片，不要求在 Word 內逐個編輯標記。

以上是完整功能的需求邊界，不代表第一階段已實作或可驗收這些功能。

## 3. 第一階段：只整合方案 B 介面（已人工驗收；保留當時契約）

### 可觀察行為

1. 保留現有導入圖片、開啟專案、編輯／整理模式、圖片數量及輸出入口與原有功能；只在編輯模式顯示新工具區，整理模式仍使用原批次操作。
2. 工具採兩欄、圖示與文字並列的緊湊按鈕，依上述分組與順序排列。沿用現有主題、圖示套件與元件，不把草稿的整頁樣式貼入正式程式。
3. 尚未選取工具時顯示最短提示「選取工具後顯示顏色設定」，不顯示空的顏色表單；選取後按鈕有明確選取狀態，設定區顯示工具名稱。
4. 圓形框、矩形框顯示框線顏色與填滿顏色；其他五種工具只顯示框線顏色，不留停用的填滿欄位。
5. 顏色介面沿用草稿的常用框線色、色彩選擇器及「無」填滿選項；初始顯示為紅色框線、無填滿。這些選擇僅存在介面的暫時狀態，不寫入專案，也不修改圖片。
6. 工具區附近保留一則必要狀態「介面預覽，尚未啟用標記」，不以成功通知或圖片變化假裝功能可用。無圖片時停用工具與顏色控制。
7. 桌面側欄以方案 B 的約 224 px 為基準；高度不足時工具／設定區可捲動，圖片數量與輸出入口保持可到達，不遮住設定。窄視窗保留操作可達性，不藉此改造整個編輯／頁面預覽布局。

### 必要做法與允許路徑

現有側欄已取得模式與圖片數量，第一階段不需要把目前圖片、資產或專案變更方法傳入新工具元件。只以局部介面狀態模擬工具及顏色選取，避免未完成標記功能污染專案資料。

| 路徑 | 允許用途 |
|---|---|
| `src/layout/Sidebar.tsx` | 編輯模式插入工具區；必要的側欄寬度、捲動及底部入口排列，保留既有控制與回呼 |
| `src/features/ImagePreview/ImageAnnotationToolbar.tsx`（新增） | 工具按鈕、適用顏色欄位、介面暫時狀態、停用及可存取名稱 |
| `tests/imageAnnotationSidebar.test.ts`（新增） | 第一階段的模式入口、工具順序、適用欄位與無資料副作用之聚焦契約測試；沿用既有 Node.js 測試方式 |
| `.gitignore` | 使用者另核准的單行 `!/tests/imageAnnotationSidebar.test.ts` 例外，避免新測試被既有 `/tests/*` 規則隱藏；其他忽略規則不改 |
| 本計畫、`STATE.md` | 範圍內生命週期與導航 |
| `docs/result/2026-10-30-image-annotation-planning-result.md` | 本輪規劃證據，不作功能完成證據 |
| `docs/result/2026-10-30-image-annotation-result.md`（執行後新增） | 第一階段實際變更、驗證與人工回饋；後續同範圍證據保留並分段追加 |

不修改圖片卡片、主畫面、圖片資料型別、專案狀態、匯入／壓縮、封存與匯出流程。第一階段不新增拖曳至圖片、物件選取／刪除／縮放、局部取圖、格式欄位、依賴、路由、版本號、更新紀錄或 Electron 改動。需要超出允許路徑時先提出最小修訂。

### 第一階段驗收與驗證

- 在有圖片的編輯模式可依序看到七個工具；整理模式的既有批次操作不被替換。沒有圖片時新控制不提供可操作的假狀態。
- 點選工具後只選中一個，顏色表單依上述規則顯示；填滿「無」與顏色選取可在介面切換，但圖片與專案內容不變，儲存或輸出不會產生標記。
- 沿用既有明暗主題；鍵盤可到達工具與顏色控制，按鈕具有名稱及選取／停用狀態，不只用顏色傳達選取。
- 聚焦測試執行 `node --test tests/imageAnnotationSidebar.test.ts`，再執行 `pnpm run lint`、`pnpm run build`、`git diff --check` 與允許路徑／暫存區檢查。原始碼契約測試不能取代實際介面驗收，不預設重跑未涉及的完整測試。
- 人工確認編輯／整理模式、無圖片、圓形框、線條、局部放大、明暗主題與較矮視窗的最小情境，重點是工具密度、設定區及輸出入口是否好操作。由使用者操作；Agent 啟動正式應用程式或本機瀏覽器驗證仍需獨立核准。
- 自動驗證完成但人工尚未回報時，只能記為第一階段部分完成；不能稱標記功能完成，也不能開始後段。

## 4. 階段依賴與後續目標

- 第二階段已進入第 7 節契約，涵蓋五種基本標記、多物件操作、專案保存及各輸出一致性；格式閘門已核准，不交付只有編輯畫面看得到、輸出卻遺失的半套功能。
- 第三階段依第 9 節執行圓形／矩形區域等大小複製、移動與等比例縮放，沿用已驗證的物件操作及保存／輸出流程。
- 資料與繪製方向：保留匯入後的底圖資產，物件資料分開保存；編輯呈現與輸出合成依同一份物件資料。座標須依圖片本體而非卡片留白計算，並處理既有旋轉，否則視窗或方向改變會使標記跑位。此段不是新的資料介面或套件選型契約。
- 相容性基線：第二階段實作前 `.ipigeon` 讀取只接受 version 2，並重建已知欄位；第一階段不修改格式。第二階段依第 7 節完成 version 2／3 區分，避免舊版忽略物件後另存而遺失。
- 局部副本取圖已於 2026-11-02 確認：只複製原圖，不包含標記與其他放大副本；基本標記的重疊選取與刪除沿用第 7 節。不自行增加圖層面板、文字標記、筆刷、復原／重做、獨立倍率控制或圖片增強。

## 5. 核准、來源與停止條件

- 使用者已確認方案 B 與第 2 節產品需求；2026-10-30 先核准規劃文件，再明確要求「請開始第一階段」，開啟第一階段原始碼與自動驗證，未開啟正式應用啟動或後續功能。
- 第一階段測試先行時發現新測試被 `.gitignore` 隱藏；使用者同日另核准上述單行例外及允許路徑補正，原忽略檔快照保存於執行基線同目錄的 `approved-extension.json`，不擴張其他修改範圍。
- 使用者於 2026-10-31 明確回報「目前人工驗收良好，可以進行下一階段」；第一階段依其回報記為 `user_attested_complete`，不是 Agent 瀏覽器實測。其後明確同意第 7 節 version 2／3 相容性並要求開始實作；第二階段以該節為界，當時未核准第三階段及其他副作用。2026-11-02 後續核准僅依第 9 節延伸局部放大。
- 方案 B 的獨立 HTML 僅為介面參考，暫存位置可能被清除；第 3 節保留第一階段契約，現行樣式依第 10 節的最新核准。不移植合成道路圖、固定物件、草稿方案切換列或假的既有操作。
- 原始碼依據為 `src/layout/Sidebar.tsx`、`src/features/ImagePreview/FocusImageCard.tsx`、`src/types/project.ts`、`src/services/browserProjectArchive.ts`、`src/services/browserImageZip.ts` 與 `src/services/browserWordProjectAdapter.ts`；只證明現有接點與資料限制，不作新功能可用證據。
- 規劃基線為 `dev`、乾淨工作樹、暫存區空。第一階段執行基線為 `dev`、`STATE.md` 已修改、本計畫及規劃結果未追蹤、暫存區空；快照保存在 `/Users/cksai/.hermes/cache/scratch/image-pigeon-annotation-phase1-20261030/baseline.json`。規劃結果維持原狀，本計畫及 STATE 只做本工作線校正；不要求未涉入工作線凍結。
- 既有一頁四張、Electron 更新及免安裝候選的計畫、證據與未完成驗收保持原狀。第一階段與一頁四張共用 `src/layout/Sidebar.tsx`，僅追加新工具區，不改既有排版／批次操作契約；各工作線核准互不繼承。
- 依已取得的第一階段核准連續實作與自動驗證，不逐檔重問；完成後交由使用者人工確認介面。正式應用啟動、打包、部署、提交與推送依各自核准；本計畫不授權外部服務或圖片上傳。
- 第一階段不接資料的限制僅適用第 3 節；第二階段必要的標記資料、保存與輸出接線以第 7 節為準，不擴張至局部放大。超出當前階段允許路徑、增加工具／套件或變更已確認操作時，先停下修訂；格式閘門關閉時不得先寫一套無法安全保存的標記原始碼。

## 6. 第一階段目前結果

方案 B 側欄原始碼與自動驗證已完成：新工具只更新局部介面狀態，無圖片時停用，既有整理模式與輸出入口保留。聚焦與相鄰回歸 33/33、既有四張批次介面契約 1/1、lint 及 build 通過；build 有大型區塊警告，未擴張處理。詳見本計畫 `result` 指向的結果文件。

使用者於 2026-10-31 整體回報第一階段人工驗收良好，第一階段已完成，不再要求重做原介面清單。未提供逐項操作紀錄或目標環境細節，不補寫未提供的瀏覽器／Windows 相容性證據。Agent 未啟動應用程式或瀏覽器；既有自動驗證仍僅綁定第一階段來源，不延伸為第二階段功能通過。

## 7. 第二階段：五種基本標記、保存與輸出

### 目標與操作契約

- 沿用方案 B 的分組、順序及顏色控制。圓形框、矩形框、線條、單箭頭、雙箭頭可以從側欄拖入目前圖片；只接受本工具的內部拖曳資料，不攔截原有外部圖片匯入。
- 一張圖片允許多個物件；拖入後可選取、移動及修改顏色。框形提供側邊與角落控制點，可自由調整長寬、拉成橢圓；線條及箭頭以兩端控制點調整長度與方向。
- 點空白處取消選取；重疊時優先選最上層物件，新增物件在最上層，不另加圖層面板。提供明確的「刪除標記」控制，不能沿用整張圖片刪除按鈕；鍵盤刪除不得攔截備註或色彩輸入。
- 未選物件時，顏色設定作為新物件的預設；選取既有物件後，設定更新該物件。線條與箭頭不顯示填滿；不新增粗細、透明度、文字、筆刷、復原／重做或自由旋轉設定。
- 操作限定在圖片本體內，不能把留白視為圖片座標。標記隨底圖的 0／90／180／270 度旋轉；圖片切換、專案切換、取消手勢或移除圖片時清除過期選取與未提交草稿，不把操作寫到其他圖片。標記拖動／縮放期間不得意外觸發既有滾輪或方向鍵換圖。
- 編輯卡片、整理縮圖、右側頁面預覽及列印預覽都顯示同一組標記。選取框與控制點只在目前編輯圖片上出現，不得進入預覽、列印或匯出。
- 圓形放大與矩形放大仍不提供圖片操作；保留原按鈕、必要的未開放提示及停用狀態，不能讓使用者誤認已可建立放大副本。

### 資料、相容性與輸出

- 底圖 Blob 不改寫、不以合成圖覆蓋。每張圖片保存獨立、有穩定識別碼的標記集合；框形存範圍、線形存兩端、各自保存適用顏色，以相對底圖座標記錄，不保存畫面像素位置或 DOM。
- 由共用幾何轉換處理圖片尺寸、旋轉、控制點、箭頭及繪製順序。編輯／預覽可使用 SVG，既有 JPEG 轉換器以 Canvas 合成，兩者共用幾何資料；不新增繪圖套件或通用編輯框架。
- 圖片 ZIP 與 Word 都將標記傳入既有 JPEG 轉換器，Word 仍嵌入合成圖片，不改表格寬度、分頁、備註與編號。列印沿用現有系統列印／PDF 路徑，不新增 PDF 匯出器。保留取消、失敗與資源回收行為，合成失敗不能默默輸出無標記底圖。
- 封存驗證須保存及讀回完整物件，拒絕未知種類、重複識別碼、非有限數值、非法尺寸／座標與顏色；遵守既有專案 JSON、封存及圖片輸出大小上限。驗證失敗不能替換目前專案，也不能部分寫入。
- 格式決策（使用者於 2026-10-31 核准）：新版可讀現有 `.ipigeon` 格式 version 2，缺少標記集合視為空；含標記的專案保存為 version 3，舊版應用會依既有版本檢查拒絕開啟，不會忽略標記後另存。無標記的專案仍可保存為 version 2；不得把含標記資料包成 version 2。這是專案內部格式，不修改產品版本號，也不提供舊版可編輯標記的降級輸出。

### 允許修改路徑

以下僅供第二階段；格式閘門已明確核准，依此清單開始來源寫入，不擴張其他階段。

| 分類 | 精確路徑與用途 |
|---|---|
| 資料與狀態 | `src/types/project.ts`、`src/state/projectState.ts`：標記型別、圖片標記集合與局部狀態更新；保留既有排版／旋轉／備註及資產關聯 |
| 工具與目前圖片接線 | `src/App.tsx`、`src/layout/Sidebar.tsx`、`src/features/ImagePreview/ImageAnnotationToolbar.tsx`、`src/features/ImagePreview/ImagePreview.tsx`、`src/features/ImagePreview/FocusImageEditor.tsx`、`src/features/ImagePreview/FocusImageCard.tsx`：連接工具、樣式及目前物件；保留外部匯入與換圖流程 |
| 共用標記呈現 | `src/features/ImagePreview/ImageAnnotationLayer.tsx`（新增）、`src/features/ImagePreview/annotationGeometry.ts`（新增）：可編輯／唯讀覆蓋層與共用幾何，供現有圖片位置使用 |
| 縮圖與列印 | `src/features/ImagePreview/ImageCardForMove.tsx`、`src/features/ImagePreview/CollagePageThumbnail.tsx`、`src/features/PrintPreview/PrintableSlot.tsx`：加入唯讀標記並保留現有圖片載入、比例與排版 |
| 保存與圖片合成 | `src/services/browserProjectArchive.ts`、`src/services/browserImageZip.ts`、`src/services/browserWordProjectAdapter.ts`、`src/services/browserAnnotationRenderer.ts`（新增）：格式驗證／往返、共用 JPEG 合成與輸出傳遞 |
| 聚焦測試 | `tests/imageAnnotationSidebar.test.ts`、`src/features/ImagePreview/imageAnnotations.test.ts`（新增）、`src/features/PrintPreview/printPreview.test.ts`、`src/services/browserProjectArchive.test.ts`、`src/services/browserImageZip.test.ts`、`src/services/browserWordProjectAdapter.test.ts`、`src/services/browserAnnotationRenderer.test.ts`（新增）：更新當前功能契約並保留第一階段證據，不把「介面尚未接資料」舊斷言當第二階段限制 |
| 文件 | 本計畫、既有結果及 `STATE.md`；實作完成後才校正 `docs/architecture/current-architecture.md` 的標記與格式現況 |

新測試使用既有 `src/` 測試匹配路徑，已檢查不受忽略，不再擴張 `.gitignore`。不改套件、鎖定檔、產品版本、Word 表格輸出器、Electron、部署與其他工作線。必要整合路徑若不足，先最小修訂，不用全目錄允許清單代替精確範圍。

### 驗收與最小驗證

1. 五種工具可拖入目前圖片，同圖多物件可移動、改色與刪除；框形可自由調整長寬及形成橢圓，線形端點可調；重疊選取與取消手勢不誤刪圖片或改到其他圖片。
2. 原圖留白、四向旋轉、視窗尺寸改變及圖片／專案切換不造成位置漂移或過期事件寫入；拖曳標記不破壞原有外部匯入與換圖。
3. 專案保存／重開保留物件、順序、座標與顏色；舊檔正常讀取，非法標記及不相容版本明確拒絕且不損壞目前專案。新版含標記檔的版本值及舊版拒絕邊界有自動契約證據。
4. 編輯、縮圖、頁面預覽、列印／PDF、圖片 ZIP 與 Word 的標記內容一致，沒有控制點或選取框；無標記圖片保持既有輸出，取消／合成錯誤不交付缺標記產物。
5. 先取得聚焦測試的預期失敗，再執行新幾何／事件／合成與既有封存、ZIP、Word 轉接及列印契約的最小回歸；執行 `pnpm run lint`、`pnpm run build`、`pnpm run verify:static`、差異與範圍護欄。不預設重跑完整歷史測試，也不為了取得綠燈修範圍外問題。
6. 使用者人工確認五種工具、同圖多物件、改色／刪除、旋轉後操作、重開專案、Word 及列印／PDF。Agent 來源／合成測試不冒稱瀏覽器或 Word 實測；應用啟動仍需獨立核准，未取得人工證據時結果保持部分完成。

以上保留第二階段當時的相容性與實作核准；該來源基線保存於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-annotation-phase2-implementation-20261031/`，包含當時既有髒工作樹與精確允許路徑。第三階段現依第 9 節及新基線執行，應用啟動、打包、部署與 Git 寫入仍關閉。

## 8. 第二階段目前結果

五種基本標記、共用幾何與物件操作、專案 version 2／3 往返、各預覽及圖片 ZIP／Word 合成接線已完成。聚焦與直接回歸 79/79 通過，lint、build、靜態產物及範圍護欄通過；完整列印測試為 11 項通過、1 項既有提示文案斷言失敗。已用本輪前快照重現同一失敗，對應 `PrintPreviewOutput.tsx` 未變，不為此擴張產品文案或移除舊斷言。建置的大型區塊警告保留。

已以修改前實際封存讀取器驗證：新版含標記 version 3 在讀圖前被舊讀取器拒絕；新版無標記 version 2 仍可由舊讀取器讀取。使用合成封存與注入圖片檢查器，只證明隔離版本契約，不是舊版應用或真實圖片解碼驗收。

第二階段唯讀獨立審查 `deleg_549f2e57`（`gpt-6-luna`）已通過；第三階段開始前再次核對受審 24 份來源與測試全部未變。使用者於 2026-11-02 整體回報人工驗收通過，記為 `user_attested_complete`，不虛構 Agent 瀏覽器／Word／PDF 實測或逐項環境證據。第二階段來源、自動驗證與指定格式核准已消耗；後續來源以第 9 節本輪基線歸因，不要求維持第二階段產品雜湊不變。完整證據以同範圍結果文件為準。

## 9. 第三階段：原圖區域副本與等比例縮放

### 核准與操作契約

使用者於 2026-11-02 明確要求開始下一階段，並選擇「只複製原圖，不包含標記與其他放大副本」。本節取代第 7 節第二階段停用局部放大按鈕的限制；其餘基本標記、純前端、資產保留與輸出邊界不變。

- 點選「圓形放大」或「矩形放大」後，在目前圖片拖曳選取範圍；放開才建立同樣顯示大小、初始覆蓋來源位置的副本並選取。來源為原始底圖，圓形選區可依寬高形成橢圓。無面積、留白起手、取消、換圖／專案／旋轉不建立物件。
- 副本可移動、改框線色、單獨刪除；只提供四個角落等比例縮放，不提供側邊控制點、獨立寬高或倍率。縮放固定來源範圍，內容與外框一起縮放；移動副本不改來源範圍。同一圖片可有多個副本與一般標記，保持集合繪製順序。
- 沿用方案 B 的顏色控制與必要最短操作提示，不新增面板、連接線、來源範圍編輯、額外工具、依賴或圖片增強。選取既有物件或切回基本工具即離開範圍選取；Escape 可取消範圍選取與未提交手勢。
- 保存相對未旋轉底圖的來源矩形與副本矩形及框線色，副本寬高必須與來源等比例；不產生額外底圖資產、不保存 DOM 或合成快照。延伸現有 version 3 物件種類；新版仍讀 version 2／3、無物件仍寫 version 2。第二階段讀取器會因未知物件種類明確拒讀含副本的 version 3，須以修改前實際讀取器驗證，不得靜默丟棄副本。
- 編輯與所有唯讀預覽／列印共用原圖裁切幾何；圖片 ZIP 與 Word 的既有 JPEG 合成從同一原圖 bitmap 取區域，不從已繪製的 Canvas 擷取，避免複製其他物件。合成失敗／取消仍拒絕產物並回收資源。列印繼續依可見原圖載入就緒，不加入獨立圖片載入競態。

### 允許路徑與驗證

精確允許修改：`src/types/project.ts`、`src/App.tsx`、`src/layout/Sidebar.tsx`、`src/features/ImagePreview/ImageAnnotationToolbar.tsx`、`src/features/ImagePreview/ImageAnnotationLayer.tsx`、`src/features/ImagePreview/annotationGeometry.ts`、`src/services/browserAnnotationRenderer.ts`、`src/services/browserImageZip.ts`；必要聚焦測試為 `tests/imageAnnotationSidebar.test.ts`、`src/features/ImagePreview/imageAnnotations.test.ts`、`src/services/browserAnnotationRenderer.test.ts`、`src/services/browserProjectArchive.test.ts`、`src/services/browserImageZip.test.ts`、`src/services/browserWordProjectAdapter.test.ts`。文件只更新本計畫、既有結果、`STATE.md` 與完成後的 `docs/architecture/current-architecture.md`。其餘第二階段接線作唯讀消費者，不因前段 allowlist 曾允許就擴張本輪。

本輪基線為 `/Users/cksai/.hermes/cache/scratch/image-pigeon-annotation-phase3-20261102/baseline.json`，保留前段既有髒工作樹、未追蹤來源及其他工作線；允許 18 路徑，暫存區空。應用／瀏覽器啟動、Electron 打包、部署、外部服務、提交及推送保持關閉。

先取得新幾何、物件驗證、範圍選取／取消、工具啟用、共用原圖合成及封存往返的預期失敗，再完成實作。最小回歸包含基本標記、來源不變的角落縮放、邊界、四向旋轉、過期圖片／專案事件與同圖多物件、ZIP／Word 傳遞及列印就緒。執行範圍內測試、`pnpm run lint`、`pnpm run build`、`pnpm run verify:static`、差異／範圍／文件護欄；保留前段已證明的既有列印文案失敗，不為全綠擴修。完成後凍結本輪候選，做一次唯讀獨立聚焦審查，再交使用者人工驗收範圍選取、等大小副本、移動／角落縮放、改色／刪除、保存重開及各輸出；自動測試不代替人工視覺驗收。

### 第三階段目前證據

來源實作完成，聚焦與直接回歸 92/92、lint、build、靜態產物與範圍／差異護欄通過。兩種副本均已以本輪前的實際第二階段讀取器與驗證器證明：無物件 version 2、基本標記 version 3 仍可讀，含副本 version 3 在圖片解碼前明確拒讀。完整列印為 11 通過、1 項前段已重現的既有文案失敗；本輪未改列印測試或對應文案。建置保留大型區塊警告。

唯讀獨立聚焦審查 `deleg_3ac83652`（實際模型 `gpt-6-luna`）已回傳 PASS，核對 24 份來源／測試及架構雜湊相符，未發現資料遺失、錯圖寫入、無法操作、來源污染或輸出不一致的實質阻擋。審查未修改來源、執行測試或啟動應用；既有驗證收據不冒稱審查者重新執行。

第三階段交付當時為 `magnification_source_verified_waiting_manual`。來源／測試與指定格式延伸核准已消耗；候選與執行證據見該輪基線同目錄的 `source-candidate.json`、`verification.json` 及正式結果。使用者其後回報「目前功能良好」，但未提供逐項輸出驗收紀錄；不補寫完整人工 PASS，也不阻擋已另行核准的下列來源調整。

## 10. 已核准調整：橫向懸浮樣式面板與五段粗細

使用者於 2026-11-02 確認最新版獨立 DEMO，要求直接修改正式專案，並另明確選擇「橫向工具列：固定在圖片上方」及同意內部格式 version 4。本節只取代前段「側欄編輯已選物件、不提供粗細、不新增面板」的限制，保留其餘物件操作、原圖取樣與輸出契約；前段已執行證據不重做。

### 可觀察行為與資料

- 側欄保留原七種工具、分組、文字與高亮；移除物件樣式表單及其空提示，不保留重複設定。新物件初始沿用紅色、無填滿及標準粗細，建立後由選取面板編輯；不新增建立前的預設樣式控制。
- 只有目前編輯圖片有選取物件時，在圖片編輯區上方置中顯示橫向懸浮面板。最左側為「取消選取」，其後依序為粗細下拉、框線色、適用填滿色，刪除獨立放最右側。面板不顯示物件名稱或類型圖示，不移植合成圖片、固定物件、示範標籤、版型切換或新主題切換。
- 粗細下拉依序為極細、細、標準、粗、極粗；七種物件都適用。標準維持既有線寬，其餘依 DEMO 的相對比例 0.4、0.7、1、1.6、2.4 計算；與原圖尺寸共同比例換算，箭頭及所有 SVG／Canvas 消費者共用幾何。以選用的 `strokeWidthLevel` 整數 1–5 保存，缺少欄位視為 3；非法值不得靜默回退。
- 框線與填滿均提供原六色快速色票及自訂色彩；填滿另有「無填滿」，只在圓形框、矩形框出現。修改立即套用該物件；取消選取只關閉面板、不刪除物件，刪除只移除選取物件。保留圖片及工具高亮與必要可存取名稱。
- 手勢期間收起面板，取消或完成後依目前選取恢復；換圖／專案／模式不殘留舊面板或回呼寫入。面板控制的方向鍵、原生下拉及色彩輸入不得觸發換圖或刪圖，面板內滾輪不觸發換圖。色票 Escape 先收起色票，原生輸入保留其鍵盤行為；一般面板 Escape 可取消選取。窄版允許面板換行，不擴改整體編輯布局。
- 點擊五種圖片標記工具，以既有 toast 顯示「請直接拖曳到圖片上」；點擊兩種局部放大工具顯示「請在圖片上圈選範圍」。同一操作提示識別碼避免堆疊，不用成功樣式，不恢復已註解的常駐操作說明；同步移除失效的說明引用。
- 新版讀取 version 2／3／4。保存時依完整、已驗證資料決定版本：無物件為 2、有物件但沒有新粗細欄位為 3、任一物件有粗細欄位為 4；不信任記憶體中過期的版本值。讀取拒絕 version 2 偷帶物件及 version 3 偷帶粗細。新版讀舊檔時沿用標準外觀，不改底圖；舊讀取器必須在圖片解碼前拒讀 version 4，不能忽略粗細後另存。產品版本號、套件及鎖定檔不變。

### 本輪精確範圍與驗證

允許來源：`src/types/project.ts`、`src/features/ImagePreview/annotationGeometry.ts`、`src/state/projectState.ts`、`src/services/browserProjectArchive.ts`、`src/features/ImagePreview/ImageAnnotationToolbar.tsx`、`src/features/ImagePreview/ImageAnnotationStylePanel.tsx`（新增）、`src/layout/Sidebar.tsx`、`src/features/ImagePreview/FocusImageEditor.tsx`、`src/features/ImagePreview/ImagePreview.tsx`、`src/features/ImagePreview/ImageAnnotationLayer.tsx`、`src/App.css`。聚焦測試限 `tests/imageAnnotationSidebar.test.ts`、`src/features/ImagePreview/imageAnnotations.test.ts`、`src/services/browserAnnotationRenderer.test.ts`、`src/services/browserProjectArchive.test.ts`。文件限本計畫、既有結果、STATE 與完成後的現行架構，共 19 路徑。

本輪基線保存於 `/Users/cksai/.hermes/cache/scratch/image-pigeon-annotation-style-20261102/baseline.json`，保護 13 筆範圍外既有變更，所有既有目標均保存修改前快照，暫存區不動。先以預期失敗覆蓋粗細、封存與面板契約，再實作；執行聚焦／必要相鄰回歸、lint、build、verify:static、範圍／差異及文件檢查，以實際舊讀取器確認拒讀邊界。沿用已證明的既有列印文案失敗，不擴修該文案或測試。完成後凍結產品／測試並做一次唯讀獨立聚焦審查，再交使用者確認正式面板、粗細保存重開與各輸出。

只有來源、自動驗證與指定內部格式核准開啟。先前瀏覽器核准僅涵蓋獨立 DEMO，不轉用於正式應用；正式應用／瀏覽器、外部服務、Electron 打包、部署、提交及推送仍關閉。

### 本輪目前證據

正式面板、五段粗細、快速色票及指定操作提示已完成來源整合。九份聚焦及直接回歸 102/102，lint、build、靜態產物、差異與範圍護欄均通過；完整列印仍為 11/12，唯一失敗為既有提示文案斷言，未擴修。修改前的實際第三階段讀取器仍可開啟無標記 v2 及原基本標記／副本 v3，並在圖片解碼前拒讀兩類物件各五段粗細的 v4。

執行證據位於本輪基線同目錄的 `verification.json`、各命令日誌與 `legacy-reader-evidence.json`。唯讀獨立聚焦審查 `deleg_707a10f8`（實際模型 `gpt-6-luna`）已回傳 PASS，24 份來源／測試與架構雜湊相符，無實質阻擋；主代理收到裁定後再核對候選未變。來源、自動驗證及 v4 核准已消耗，目前為 `annotation_style_source_verified_waiting_manual`。尚未取得本輪正式應用、瀏覽器或各輸出人工證據，不以獨立 DEMO 或隔離回呼測試代替；整體計畫保持 active、結果 partial，等待使用者確認本輪樣式。
