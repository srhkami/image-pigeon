---
type: plan
id: plan-image-pigeon-manual-layout-preference-2026-08-04
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-04
execution:
  status: partial
  completed_checkpoints:
    - C0-baseline-and-contract-inventory
    - C1-backend-schema-and-legacy-migration
    - C2-frontend-model-and-pagination
    - C3-focus-card-controls
    - C4-output-consistency-and-compatibility-regression
    - C5-source-verification-and-governance-closure
result: docs/result/2026-08-04-manual-layout-preference-result.md
approval_gates:
  source_write: completed
  local_browser_uat: pending
  packaged_pywebview_uat: pending
  commit: approved
  push: closed
---

# 圖片方向與排版方式分離實作計畫

## 目標

把圖片客觀方向與使用者指定排版拆成獨立資料：圖片只在首次匯入或舊專案遷移時依現行規則取得初始排版，之後旋轉不再改變排版；焦點圖片右上角提供刪除，右下角提供「上下／左右／六張」三段式選擇，頁面預覽、列印預覽與 Word 輸出共用同一份排版結果。

## 已確認產品決策

1. 圖片方向是依有效寬高與旋轉角度計算的 `landscape | portrait`，不持久化為使用者選擇。
2. 每張圖片持久化獨立的 `layoutPreference`：
   - `stacked-2`：上下
   - `side-by-side-2`：左右
   - `grid-6`：六張
3. 新匯入圖片只在建立時沿用目前推算規則：
   - 橫向 → `stacked-2`
   - 直向且舊 `portraitSize = large`／未指定 → `side-by-side-2`
   - 直向且舊 `portraitSize = small` → `grid-6`
4. 初始值建立後，旋轉只改方向，不修改 `layoutPreference`。
5. 使用者可不受方向限制，替任何圖片選擇任一排版。
6. 混合版面繼續自動組合，但只根據相鄰圖片明確的排版偏好：
   - `stacked-2` 後接最多三張 `grid-6` → `mixed-landscape1-small3`
   - 最多三張 `grid-6` 後接 `stacked-2` → `mixed-small3-landscape1`
   - `side-by-side-2` 不加入混合版面，只成對填入 `portrait-large-2`。
7. 修改排版後，從受影響項目起重新分頁；項目順序本身不變。
8. 焦點卡片右上角與編號同列放刪除；「上下／左右／六張」放在「左轉／右轉」同一操作列。一般刪除維持目前直接刪除，不新增確認視窗。
9. 焦點卡片不顯示方向與排版文字標籤，避免佔用操作空間。
10. 舊專案在開啟時依有效方向與舊 `portraitSize` 轉成明確的 `layoutPreference`；後續保存以新欄位為權威。

## 架構與資料契約

### Item 契約

前後端共同採用：

```text
layoutPreference: 'stacked-2' | 'side-by-side-2' | 'grid-6'
```

`portraitSize` 降為舊資料讀取相容欄位，不再參與新資料的分頁或 UI 操作。為避免不必要的大型格式改名，本次維持現有 `ProjectV2`／`version: 2`，把 `layoutPreference` 視為向後相容的加法欄位；舊資料在後端驗證邊界正規化後再回傳前端。儲存的新 `project.json` 必須含 `layoutPreference`，不得再依 `portraitSize` 重建使用者已選排版。

### 初始值與舊資料遷移

後端建立新 `Item` 時，使用壓縮／切割後資產的實際寬高決定初始值。讀取舊專案時，`ProjectV2` 層級的正規化可同時取得 item 與 asset，依 item rotation 計算有效尺寸，再套用舊 `portraitSize`；不得只在單一 `Item` validator 猜測方向。

若資產缺失或尺寸無效，採 fail-safe 預設 `side-by-side-2`，但原有資產完整性驗證仍應照常拒絕實際缺檔專案。

### 分頁契約

`buildAutoCollageLayout()` 的輸入改為 `itemId + layoutPreference`，不得讀取 `orientation` 或 `portraitSize`。輸出的既有五種 template、slot role、page/slot id 與順序保持不變，因此右側縮圖、列印預覽、Word payload 與 Python renderer 不另建立第二套排版判斷。

## Dirty worktree 與範圍護欄

計畫建立時已有使用者變更，執行前必須重新記錄雜湊並保護：

- staged：`.gitignore`、`src/features/Intro/newVersionDismissal.ts`
- untracked：既有 2026-08-04 file-dialog／ignore-update plan/result

特別注意：目前 staged `.gitignore` 新增 `/tests/`。本計畫不得改寫或取消該 staged 決定；新增的前端排版測試放在 `src/features/ImagePreview/` 內，並調整 `package.json` 的 `test:frontend` 精確納入，以確保測試可追蹤。不得 reset、clean、stash、stage 或吸收既有變更。

## Allowed paths

### 後端資料與匯入

- `core/app/models.py`
- `core/app/image_service.py`
- `core/tests/test_models.py`
- `core/tests/test_image_service.py`
- `core/tests/test_image_api.py`
- `core/tests/test_project_service.py`

### 前端資料、排版與介面

- `src/types/project.ts`
- `src/state/projectState.ts`
- `src/features/ImagePreview/autoCollageLayout.ts`
- `src/features/ImagePreview/autoCollageLayout.fixtures.ts`
- `src/features/ImagePreview/FocusImageCard.tsx`
- `src/features/ImagePreview/manualLayoutPreference.test.ts`
- `package.json`

### 治理與結果

- `STATE.md`
- `docs/plans/2026-08-04-manual-layout-preference.md`
- `docs/result/2026-08-04-manual-layout-preference-result.md`

發現其他 source、probe 或 contract 必須修改時，先停止並回報 `SCOPE_CHANGE_REQUIRED`，不得自行擴張。

## Protected paths

除 Allowed paths 外一律不得修改，尤其：

- `.gitignore`
- `src/features/Intro/newVersionDismissal.ts`
- 既有 file-dialog／ignore-update plan/result
- `core/save_docx.py`
- `src/features/PrintPreview/**`
- `src/state/projectOutputAdapter.ts`
- lockfiles 與套件版本

如果既有五種 template 契約無法承接新偏好，必須先回報，不得直接修改 Word renderer 或列印預覽。

## Non-scope

- 手動拖放圖片到特定頁／slot、手動新增分頁或鎖定頁界線。
- 新增第四種「自動」或「未設定」選項。
- 改變項目排序、混合版型結構、列印樣式、Word 表格尺寸或編號規則。
- 刪除確認視窗、復原功能或批次套用排版。
- 修改舊版 1.x JSON 匯入流程。
- 外部服務、資料庫、provider、production、deploy、發布、commit、push。

## 核准閘門

### G1：Source write

目前為 `pending`。只有使用者後續明確要求執行本計畫，才可修改 Allowed source/test paths。核准不包含 commit、push、發布或外部服務。

### G2：Local browser UAT

需另外明確核准後，才啟動 Vite 並在瀏覽器操作匯入、旋轉、排版、刪除與預覽。Source/build 通過不能替代 browser UAT。

### G3：Packaged pywebview UAT

保持 `pending`。只有明確核准且存在可用打包環境才執行；未執行時結果必須標為驗證缺口，不能宣稱桌面版完整通過。

### G4：Commit／push／發布

全部保持關閉，除非使用者另行逐項核准。

## 執行檢查點

### C0：基準、契約盤點與 RED 準備

1. 重新執行 `git status --short`、`git diff --cached --name-only`，記錄 Allowed 與 Protected 路徑雜湊。
2. 全域搜尋 `portraitSize`、`updateItemPortraitSize`、`collageKind`、`buildAutoCollageLayout` 及三個既有 template 使用處。
3. 執行修改前基準：
   - `pnpm run test:frontend`
   - `pnpm run lint`
   - `pnpm run build`
   - `uv run python -m unittest core.tests.test_models core.tests.test_image_service core.tests.test_image_api core.tests.test_project_service -v`
4. 若基準失敗，記錄為既有阻擋；不得把既有失敗歸因於本計畫或順手修正。

停止條件：dirty baseline 無法可靠保存、staged 檔案與 Allowed path 衝突，或發現另有 active canonical plan。

### C1：後端新增與遷移契約（TDD）

1. 先在 `core/tests/test_models.py` 新增失敗測試：
   - 新欄位 alias roundtrip。
   - 舊橫向 item → `stacked-2`。
   - 舊直向 large／缺省 → `side-by-side-2`。
   - 舊直向 small → `grid-6`。
   - rotation 90/270 後以有效尺寸推算。
   - 已存在 `layoutPreference` 時保留原值，不因方向覆寫。
2. 先在 `core/tests/test_image_service.py` 與 `core/tests/test_image_api.py` 新增失敗測試，證明新匯入的橫圖／直圖回傳明確 `layoutPreference`。
3. 執行聚焦測試確認 RED 來自欄位或正規化尚未存在。
4. 在 `core/app/models.py` 定義 Literal、舊資料正規化與序列化契約；在 `core/app/image_service.py` 建立新 item 時寫入初始偏好。
5. 在 `core/tests/test_project_service.py` 驗證舊專案 open 後已正規化、save/open roundtrip 保留人工偏好。
6. 重跑聚焦 Python tests 至 GREEN。

停止條件：遷移必須改寫原始舊專案檔、需要資料庫，或無法在 asset/item 同時可見的邊界完成。

### C2：前端資料模型與純排版演算法（TDD）

1. 新增 `src/features/ImagePreview/manualLayoutPreference.test.ts`，先驗證：
   - 前端舊資料 fallback 與後端一致。
   - `updateItemLayoutPreference` 只改排版欄位。
   - `updateItemRotation` 不改排版。
   - 相同偏好依 2／2／6 容量填頁。
   - 兩種混合序列仍產生既有 mixed templates。
   - 不同偏好邊界、空 slot、順序與 page/slot id 穩定。
2. 更新 `package.json`，讓 `test:frontend` 同時執行既有 `tests/*.test.ts` 與新的 tracked in-source test；不得修改 staged `.gitignore`。
3. 執行聚焦測試確認 RED。
4. 在 `src/types/project.ts` 新增 `LayoutPreference`，讓 `ProjectItemViewModel` 同時保留客觀 `orientation` 與獨立 `layoutPreference`；`portraitSize` 只保留舊資料相容輸入。
5. 在 `src/state/projectState.ts`：
   - 提供單一初始／fallback 推算函式。
   - `getOrderedItemViewModels()` 優先使用已保存偏好。
   - 新增不可變的 `updateItemLayoutPreference()`。
   - 移除新 UI 對 `updateItemPortraitSize()` 的依賴；是否保留 deprecated helper 只依實際 usage inventory，不能留成第二套 authority。
6. 在 `autoCollageLayout.ts` 改以 `layoutPreference` 分頁並維持五種既有 template 與混合組合。
7. 更新 fixtures 為偏好導向，重跑聚焦與完整前端測試至 GREEN。

停止條件：演算法需要改變 template／slot role contract，或同一輸入在 preview 與 output 產生不同 pages。

### C3：焦點圖片控制介面（TDD／source contract）

1. 先在同一前端測試加入 source contract，驗證焦點卡具備：
   - 右上刪除控制。
   - 右下「上下／左右／六張」三段式控制。
   - 三個按鈕以 `aria-pressed` 或同等語意標示目前選擇。
   - 方向與排版為獨立標籤。
   - 不再顯示「切大圖／切小圖」。
2. 修改 `FocusImageCard.tsx`：
   - 只在 active card 的 `figure` overlay 顯示控制。
   - 刪除使用右上角、可辨識的 destructive 樣式及 `aria-label`。
   - 排版選擇器使用右下半透明容器，三項直接可見，不用下拉選單。
   - 所有 overlay click 必須阻止誤觸非 active card 的 activate 行為。
   - 保留備註、左右旋轉與既有刪除資料同步；移除舊 portrait size toggle。
   - 窄寬度允許控制列緊縮／換行，但不得遮住整張圖。
3. 驗證選擇排版後 project state 更新，`ImagePreview` 的 memoized layout 與右側 preview 自動重算；不得另外維護 UI-only layout state。
4. 執行聚焦測試、lint 與 build。

### C4：輸出一致性與相容回歸

1. 以相同 project fixture 分別呼叫預覽 builder 與 `buildAutoCollageWordPayloadParts()`，確認 pages template、slot itemId 與空格完全一致；若需新增測試但 `projectOutputAdapter.ts` 不需改動，測試仍放在既定 tracked test path。
2. 執行既有 `core.tests.test_save_docx_collage`，證明五種 template 的 Python renderer 未回歸。
3. 驗證 save/open 後人工選擇不被方向重新推算。
4. 驗證 legacy `portraitSize` 只在缺少 `layoutPreference` 時使用；新值存在時永遠優先。
5. 全域搜尋，確認分頁決策沒有殘留 orientation／portraitSize 分支，且輸出仍只有一個 `buildAutoCollageLayout()` authority。

### C5：完整驗證、審查與治理收束

G1 內執行：

```bash
pnpm run test:frontend
pnpm run lint
pnpm run build
uv run python -m unittest discover -s core/tests -p 'test_*.py' -v
uv run python -m py_compile core/app/models.py core/app/image_service.py
git diff --check
git diff --cached --name-only
```

另執行 dirty baseline guard，證明 Protected paths 內容與 staged 狀態未被本工作改變。

G2 核准後的 browser UAT：

1. 匯入橫圖與直圖，確認初始值符合現行推算。
2. 旋轉圖片，確認方向標籤改變而排版選擇不變。
3. 對同一張圖片依序選「上下／左右／六張」，確認 active state 與右側頁面立即重排。
4. 建立 `上下 + 六張×3` 及 `六張×3 + 上下`，確認兩種混合版面仍自動產生。
5. 點擊右上刪除，確認 project、焦點與頁面預覽同步。
6. 進入列印預覽，確認頁數、slot 與右側預覽一致。
7. 若另核准本機檔案 side effect，保存並重新開啟 `.ipigeon`，確認人工排版選擇持久化。

完成後：

1. 進行獨立聚焦複審，確認資料 authority 唯一、遷移不覆寫人工值、混排及 output contract 未漂移、舊 source probe 已正確轉譯。
2. 寫入 `docs/result/2026-08-04-manual-layout-preference-result.md`，只記錄實際執行證據與未開啟閘門。
3. 校正本 plan lifecycle，再更新／關閉 `STATE.md` workstream。
4. 不 commit、不 push、不發布。

## 驗收條件

- 每張 item 都有明確、可持久化的 `layoutPreference`；方向與排版是不同欄位。
- 新匯入與舊資料遷移只初始化一次；旋轉與重新開啟不覆寫人工排版。
- 使用者可對任何方向圖片選擇「上下／左右／六張」。
- 焦點圖片右上與編號同列為刪除；排版選擇器與旋轉控制同列；非焦點卡不顯示控制。
- 焦點卡片不顯示方向與排版文字標籤，舊「切大圖／切小圖」退出 active UI contract。
- 五種既有 template、兩種混合組合、slot role、順序與空格語意保持相容。
- 右側頁面預覽、列印預覽與 Word payload 由同一 builder 產生一致 pages。
- 舊專案可開啟並正規化；新保存專案 roundtrip 保留人工排版。
- 聚焦／完整前後端測試、lint、build、Python compile、`git diff --check` 與 dirty/staged guard 通過。
- 未核准的 browser、pywebview、commit、push、發布不得被宣稱完成。

## 風險與控制

- **重新分頁造成連鎖位移：** 這是已接受行為；以右側即時預覽與穩定 item order 降低意外。
- **舊欄位形成雙 authority：** `layoutPreference` 優先；`portraitSize` 只能在新欄位缺失時參與一次遷移。
- **混合版面重新變成方向推論：** builder 測試明確禁止讀取 orientation，只接受 layout preference。
- **前後端初始規則漂移：** 規則各自以相同 fixture 驗證；後端回傳值是新匯入資料的 canonical 初始值，前端 fallback 僅保護舊／不完整資料。
- **overlay 遮擋圖片：** 僅 active card 顯示、採緊湊半透明容器，窄視窗驗收時檢查可操作與遮擋程度。
- **staged `.gitignore` 排除 tests：** 新測試放 tracked source path，禁止修改使用者 staged 內容。

## 下一步

原始碼與自動驗證範圍已完成；未執行的 browser、pywebview 與本機檔案 side effect 驗收詳見 result，需另立閘門處理。
