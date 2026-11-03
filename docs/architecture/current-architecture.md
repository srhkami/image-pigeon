---
type: architecture
status: current
canonical: true
scope: image-pigeon
verified_against_source_at: 2026-09-30
annotation_verified_against_source_at: 2026-10-31
magnification_verified_against_source_at: 2026-11-02
annotation_style_verified_against_source_at: 2026-11-02
singlefile_source_verified_at: 2026-11-03
electron_retired_at: 2026-11-03
singlefile_manual_acceptance: user_attested_2026-11-03
---

# image-pigeon 現行架構

## 定位

image-pigeon 3.0 已合併至 `dev` 與 `main`，作為後續主要更新基線；現行產品是 React + Vite 純前端應用。圖片匯入、壓縮、長截圖切割、專案管理、圖片 ZIP、Word 與列印都在使用者瀏覽器內完成；正式部署只需要以 HTTPS 靜態主機提供 `dist/`。

Python 原始碼、Python 測試、套件環境及 PyInstaller 打包資產已正式退役。現行執行階段不使用 Python、FastAPI、uvicorn、pywebview、本機監聽連接埠、資料庫或可寫入伺服器目錄。舊桌面架構與驗證證據保留在 ADR-0001、歷史計畫及結果文件，但不再是現行原始碼或回退基線。

## 執行拓樸

```text
HTTPS 靜態主機
  └── dist/（HTML、CSS、JavaScript、圖示與圖片）
        │
        ▼
使用者瀏覽器
  ├── React UI 與 ProjectV2 metadata
  ├── BrowserAssetStore：asset id → Blob + object URL
  ├── Canvas：圖片解碼、縮放、旋轉與長截圖切割
  ├── .ipigeon archive：project.json + images/*.webp
  ├── 圖片 ZIP exporter
  ├── DOCX exporter
  └── window.print()／系統 PDF
```

開發使用 Vite dev server；production build 由 `pnpm run build` 產生。`vite.config.ts` 使用相對 `base`，使同一份產物可部署於 HTTPS 網站根目錄或子路徑。

## 單一 HTML 離線交付

`pnpm run build:singlefile` 使用獨立的 `vite.singlefile.config.ts`，沿用原 React／Vite 設定，再由鎖定的 vite-plugin-singlefile 將程式、樣式及匯入圖片內嵌；單檔專用轉換另外內嵌 public 的網站圖示與兩張品牌圖，不修改原首頁 DOM 或網站設定。輸出只有 `release/html-<version>/image-pigeon-<version>.html`，沒有相鄰資產依賴；建置後由 `scripts/verify-singlefile-build.mjs` 檢查單檔結構、必要圖片、內嵌程式及可辨識資源／網路載入。

`browserPreferenceStorage.ts` 為主題及功能介紹已讀狀態提供安全讀寫；瀏覽器拒絕儲存時使用預設值及目前元件狀態，不影響專案檔保存。單檔仍使用既有瀏覽器圖片、標記、封存、ZIP、DOCX 與列印路徑，沒有 Electron 專用啟動版本查詢；手動下載入口保留。

此交付目標為直接以 file:// 開啟，不取代必須由 HTTP(S) 提供的網站 dist，也不改網站 CSP。使用者於 2026-11-03 回報單檔版驗收通過（user_attested）；Agent 僅取得來源／產物自動證據，不擴張為 Agent 瀏覽器實測或未具名的平台矩陣。計畫及結果見 `docs/plans/2026-11-03-singlefile-html.md`、`docs/result/2026-11-03-singlefile-html-result.md`。

## ProjectV2 與資產生命週期

前端型別定義於 `src/types/project.ts`：

```text
ProjectV2
├── schema: image-pigeon.project
├── version: 2（無標記）／3（無粗細欄位的標記）／4（含粗細欄位）
├── document.title
├── assets[]
├── items[]
└── layouts[]
```

- React state 保存 metadata，不長期保存 Base64 圖片。
- 圖片 Blob 由 `src/services/browserAssetStore.ts` 管理。
- 預覽以 `URL.createObjectURL()` 建立；替換、刪除、清空、開啟其他專案與卸載時回收 URL。
- `assets[].file` 指向 archive 內相對的 `images/<asset-id>.webp`。
- `items[]` 保存備註、旋轉、裁切、直向尺寸、排版偏好及選用的 `annotations[]`。基本標記為圓形／橢圓框、矩形框、線條、單箭頭及雙箭頭；物件保存穩定識別、相對未旋轉底圖的範圍／端點與適用顏色，不覆寫底圖 Blob。七種物件共用選用的 `strokeWidthLevel` 整數 1–5，缺省為標準 3；線寬及箭頭幾何由同一份比例計算。
- 局部副本同存 `annotations[]`，種類為 `magnify-circle`／`magnify-rectangle`；保存原圖來源矩形、副本矩形與框線色，不另存圖檔。初始等大小，副本只有四角等比例縮放，移動／縮放不改來源，且不複製其他物件。
- 排版偏好包含上下、左右、四張與六張；純四張使用 `grid-4` 模板，內容區為 2×2 等分，依左上、右上、左下、右下排序。四張／上下及四張／六張皆支援兩方向半頁混排，半頁分別為上下一張、四張最多兩張、六張最多三張，不足留空；前段四張超過兩張、六張超過三張及上下連續兩張仍優先純版型。只取緊鄰同偏好圖片，不跨其他偏好補圖；匯入預設與原六張／上下混排規則不變。
- `layouts[]` 使用 `word-compatible-grid`；輸出順序由 `itemOrder` 決定。

## 圖片處理

- `src/services/browserImageProcessor.ts` 使用瀏覽器解碼與 Canvas 處理一般圖片及長截圖。
- 正式處理遵守固定檔案數、位元組、像素、段數與 asset store 上限。
- 一般圖片允許單張略過、整批完成後一次提交；長截圖以來源檔案為最小原子單位。
- 取消、超限或失敗時回收暫存 Blob／object URL，不提交半成品。

## 專案封存

- 唯一專案交換格式是單一 `.ipigeon` ZIP archive。
- 根目錄必須有 `project.json`，圖片位於 `images/*.webp`。
- 新版接受 version 2／3／4；保存依完整、已驗證物件決定：無物件為 2，有物件但無粗細欄位為 3，任一物件含粗細欄位為 4，不信任記憶體中的過期版本值。缺少物件集合視為空；拒絕 version 2 偷帶物件、version 3 偷帶粗細，以及未知種類、重複識別、非法座標／尺寸／顏色／粗細。只支援 version 2／3 的前版在讀圖前拒讀 version 4，不能忽略粗細後另存。`ProjectV2` 保留既有程式型別名稱，產品版本號不隨內部格式調整。
- 局部副本延伸 version 3 的物件種類，另驗證來源範圍及等比例；僅支援基本標記的前版讀取器會因未知種類拒讀含副本的封存，不會忽略副本後另存。
- `src/services/browserProjectArchive.ts` 在解壓前檢查項目數、宣告大小、壓縮比與路徑，並驗證 manifest、資產集合、WebP 內容及實際尺寸。
- 專案開啟採 all-or-nothing；完整驗證後才原子替換 project state 與 asset store。
- 不支援獨立 1.x JSON 或 `.ipigeon/` 專案資料夾。

## 輸出與列印

- 圖片輸出：`src/services/browserImageZip.ts` 依 canonical order 產生 JPEG 並封裝成單一 ZIP 下載。
- Word 輸出：`src/services/browserWordExporter.ts` 與 `browserWordProjectAdapter.ts` 產生 DOCX Blob 並下載。
- 列印：`src/features/PrintPreview/` 重用共用自動分頁，包括五種既有版型、純四張及四張／上下、四張／六張各兩種混排版型；透過 `window.print()` 開啟系統列印流程，PDF 由使用者在系統列印對話框另存。Word 純四張及四張／上下使用固定兩欄，上下圖片跨兩欄；四張／六張使用六個等寬基準欄，四張格跨三欄、六張格跨兩欄，各半頁等高，保留圖片、編號、備註與留空。
- 專案、ZIP 與 DOCX 皆由本機 Blob URL 下載，不經應用程式後端。
- 基本標記的共用幾何位於 `annotationGeometry.ts`；編輯、整理與頁面／列印預覽以 `ImageAnnotationLayer.tsx` 同一 SVG 場景呈現底圖及物件。唯讀預覽沒有選取框／控制點；含標記列印以可見 SVG 底圖載入事件判斷就緒。ZIP 與 Word 將物件交給同一 JPEG 轉換器，以 `browserAnnotationRenderer.ts` 合成相同圖元、順序與底圖裁切，再沿原路徑輸出；底圖資產仍獨立保留。
- 局部放大點選工具後在圖片拖曳選區，放開才建立等大小副本；SVG 以 `<use>` 引用唯一可見原圖並套用來源映射及圓形／矩形裁切，沿用該原圖載入就緒。JPEG 合成直接從原始 bitmap 取區域，不從已畫標記的 Canvas 擷取；副本與其他物件依同一集合順序繪製。
- 標記及選區手勢的草稿只在目前圖片上存在，起手即顯示手勢鎖，放開才經專案／圖片身分與原物件集合比對後寫入；取消、失去指標捕捉、工具改變或切換使草稿失效。局部副本已取得使用者功能良好回報，未補寫未提供的逐項輸出證據；本輪樣式的正式瀏覽器及成品目視仍未驗收。
- `ImageAnnotationStylePanel.tsx` 由目前焦點編輯器呈現於圖片上方，選取物件時提供取消、五段粗細、框線及適用填滿與獨立刪除，不顯示物件類型名稱。手勢中收起，控制項鍵盤及滾輪與換圖隔離；側欄只保留工具與高亮，點工具透過固定識別碼顯示指定操作提示，不重複提供物件樣式表單。

## 網路與隱私邊界

- 正式前端不發出背景 `fetch`／XMLHttpRequest，也不提供圖片、專案或輸出上傳 API。
- 應用程式只讀取使用者明確選定的檔案。
- 固定外部網站入口集中於 `src/services/browserExternalNavigation.ts`，只在使用者明確點擊後開啟，且不攜帶應用程式資料。
- `scripts/verify-static-build.mjs` 會驗證靜態資產引用並拒絕退役 runtime 與網路 sink。

## 桌面退役與手動下載

依 `docs/adr/0004-retire-electron.md`，Electron 桌面殼、打包設定與命令、專用依賴、預載橋接及啟動新版提示均已退役。網站與單檔直接使用同一份純前端功能，不提供背景版本查詢，也沒有原生檔案或桌面 API。

首頁 Intro 的版本資訊旁保留「檢查新版」；使用者主動點擊後才開啟既有固定 Google 雲端資料夾。不自動下載或安裝，也不發送圖片、專案或備註。

舊 EXE 與既有 release 成品保留，但不是目前建置目標；歷史桌面計畫、結果及 ADR-0003 僅作證據。Windows 桌面人工驗收因退役取消，不視為通過。

## 驗證邊界

前端契約測試、lint、TypeScript／Vite production build 與靜態產物探針是目前自動化驗證主線。目標 Windows 11／Microsoft Edge／Microsoft 365 Word 的完整 UAT 仍未執行；現行架構採用與 source/build 通過不得擴張為該環境相容性 PASS。
