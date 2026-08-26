---
type: result
id: result-image-pigeon-batch-image-editing-2026-08-26
status: completed_with_known_test_gap
canonical: true
scope: image-pigeon
plan: docs/plans/2026-08-26-batch-image-editing.md
execution:
  status: completed_with_known_test_gap
  completed_checkpoints:
    - C0
    - C1
    - C2
    - C3
    - C4
    - C5
  current_checkpoint: completed
---

# 整理模式批次選取、轉向、排版與刪除：執行結果

## 結論

C0–C4 原始碼、測試與自動驗證均已完成。第一輪獨立複審為 `REQUEST_CHANGES`，指出舊批次刪除確認可能覆寫新專案，以及 `sessionId` 固定為 `null` 無法清理相同 item ID 的跨專案選取；兩項均已用 RED／GREEN 修正，當時聚焦複審為 `PASS`，無 Critical 或 Important 問題。使用者於 2026-08-26 明確回報瀏覽器驗收成功，C5 分類為 `user_attested_complete`；這不是 Agent 啟動或操作瀏覽器的證據。後續卡片定位、頂端防遮擋與原生 `disabled` 修正經目前快照最後複審收斂；文件聚焦複審 `deleg_d2568d4b` 為 `PASS`，Critical／Important 均無。本結果以 `completed_with_known_test_gap` 收束，保留完整前端測試 108/110 的兩項既有範圍外失敗。

## 實作摘要

- `App` 持有穩定 `Set<string>` 選取集合與作用中圖片，處理離開排序模式、session 切換及項目失效後的選取清理：`src/App.tsx:30`、`src/App.tsx:56`。
- 側邊入口目前以「編輯模式」與「整理模式」分流；「整理模式」是原「排序模式」的介面新名稱，不改 `isMoveMode` 內部契約。
- 排序卡片整張非拖曳區域切換選取，保留原生核取控制與鍵盤操作；拖曳屬性與監聽只掛在把手：`src/features/ImagePreview/ImageCardForMove.tsx:42`、`src/features/ImagePreview/ImageCardForMove.tsx:44`、`src/features/ImagePreview/ImageCardForMove.tsx:49`。
- 依使用者後續指定，圖片在卡片內水平／垂直置中；編號、排版標籤、選取框分別固定於左上、右下、左下，拖曳按鈕固定於左側垂直置中：`src/features/ImagePreview/ImageCardForMove.tsx:42`–`65`。
- 排序清單捲動容器加入 `pt-3` 頂部內距，避免最上方卡片外框／陰影緊貼容器頂界而被頂端欄陰影遮蔽：`src/features/ImagePreview/SortableImageList.tsx:16`。
- 側邊欄只在排序模式提供選取數量、全選／取消、批次左右轉、三種既有排版與需確認的批次刪除；無選取時使用原生 `disabled`：`src/layout/Sidebar.tsx:41`、`src/layout/Sidebar.tsx:67`、`src/layout/Sidebar.tsx:72`、`src/layout/Sidebar.tsx:79`。
- 純狀態操作涵蓋批次相對旋轉、批次排版、指定 ID 集合刪除及單張委派：`src/state/projectState.ts:159`、`src/state/projectState.ts:169`、`src/state/projectState.ts:180`、`src/state/projectState.ts:199`。
- 單張與批次刪除共用 `App.removeSelectedItems()`，同步作用中圖片、專案、`CustomImage[]`、選取集合及已無 metadata 的瀏覽器資產：`src/App.tsx:89`。
- 多 ID 刪除後的作用中圖片規則集中於 `getActiveItemIdAfterRemovingItems()`：`src/features/ImagePreview/wheelNavigation.ts:17`。
- 批次刪除確認會凍結顯示當下的選取 ID 與 session；成功開啟專案會建立單調遞增 session，舊確認在 session 不符時安全失效，不會覆寫新專案或回收新資產。
- 左側獨立「全部清除」入口已移除；一般焦點卡片單張刪除入口仍保留且不新增確認。

## 測試驅動證據

### RED

命令：

```bash
node --test --experimental-strip-types tests/wheelNavigation.test.ts
```

有效行為失敗曾包含：

- `批次刪除前由 App 依目前排序決定鄰近焦點`：`App` 尚未持有 `activeItemId`，批次刪除無法依目前排序選擇鄰近焦點。
- `排序卡片使用原生核取控制，拖曳把手不再把整張卡片設為拖曳啟用區`：拖曳 attributes 仍掛在整張卡片。
- `側邊欄批次按鈕使用真正的 disabled 屬性且全部清除已退場`：既有 `Button` 不會把 `disabled` 傳給原生按鈕。
- `批次刪除只有未知 ID 時不清理既有狀態`：未知 ID 仍會順帶移除既有孤立 metadata。
- `批次刪除確認綁定顯示時的專案 session 與選取 ID，舊確認不得覆寫新專案`：缺少同步 project/session ref 與失效護欄。
- `成功開啟專案會建立新的 session，讓相同 item ID 的舊選取失效`：缺少新的專案 session。

上述均是可讀 assertion failure，不是載入器或環境錯誤。

收束前 fresh 驗證另取得一項有效 RED：使用者後續 UI 調整曾把批次刪除等控制改成共用 `Button`，但該元件沒有把 `disabled` 傳給原生 DOM，造成「真正停用」來源契約 17/18。修正限制在 `Sidebar.tsx`，將整理模式內需停用的控制改為保留相同 DaisyUI class 的原生 `<button disabled={...}>`；聚焦測試恢復 18/18。

### GREEN

```text
node --test --experimental-strip-types tests/wheelNavigation.test.ts
18 tests / 18 pass / 0 fail
```

## C4 自動驗證

| 命令 | 實際結果 | 判定 |
|---|---|---|
| `node --test --experimental-strip-types tests/wheelNavigation.test.ts` | 18 tests，18 pass，0 fail | PASS |
| `pnpm run test:frontend` | 110 tests，108 pass，2 fail | 已知基線失敗，範圍內新增／受影響契約無新增失敗 |
| `pnpm run lint` | exit 0 | PASS |
| `pnpm run build` | exit 0；299 modules transformed；`dist/assets/index-zwmZNRrC.js` 929.96 kB、gzip 290.32 kB | PASS |
| `pnpm run verify:static` | 8 files、6 references、0 forbidden hits | PASS |
| `git diff --check` | exit 0 | PASS |
| staged-file guard | `git diff --cached --name-only` 無輸出 | PASS |
| 新增行安全掃描 | hardcoded secret、dangerous eval、shell injection、debug console 均為 0 | PASS |

建置仍有既有的大型 chunk 警告：`dist/assets/index-zwmZNRrC.js` 約 929.96 kB、gzip 約 290.32 kB；不是本檢查點新增錯誤。

## 獨立複審紀錄

### 第一輪：REQUEST_CHANGES

- Critical：確認 toast 持有舊 render 的專案與選取，開啟新專案後點舊確認可能覆寫新專案。
- Important：`OpenProject` 固定寫入 `sessionId = null`，相同 item ID 的新專案可能保留舊選取。
- 處置：以確認 snapshot、同步 project/session refs、預期 session guard 與 App 擁有的單調 session token 修正；新增兩項回歸契約，取得 15 pass／2 fail 的有效 RED，修正後為 17/17 GREEN。
- 聚焦複審：`PASS`；原 Critical 與 Important 問題均已消除，無新增阻擋問題，信心高（約 90%）。

### 聚焦複審：PASS

- `Sidebar` 在顯示確認時凍結選取 ID 與 session，確認時傳入凍結值：`src/layout/Sidebar.tsx:42`–`50`。
- `App` 在任何專案、資產、圖片或選取寫入前，以同步 `sessionIdRef` 驗證預期 session；失配即中止：`src/App.tsx:89`–`98`。
- 刪除流程從 `projectRef.current` 取得目前專案，所有資產與狀態異動都位於 session gate 後方：`src/App.tsx:98`–`113`。
- 成功開啟專案會由 App 產生單調遞增 session，立即更新 ref 並清除 selection／active：`src/App.tsx:129`–`135`。
- 複審保留的驗證缺口：競態目前由來源契約防護，尚未以 React/UI harness 或真實瀏覽器事件序列驗證；此項留待 C5。

聚焦複審完成後，使用者另指定排序卡片位置與頂端防遮擋微調；這些變更未改狀態、刪除、session 或拖曳事件邏輯，來源契約、lint、build 與靜態探針均已重跑。使用者其後明確回報瀏覽器驗收成功；目前快照另行進入最後聚焦複審。

完整前端測試的兩項既有失敗與 `STATE.md` 基線一致：

1. `列印預覽不依賴後端 session 並明確說明系統列印另存 PDF 邊界`：期待文案不存在。
2. `3.0.0 是目前應用程式版本且位於內建更新日誌首筆`：目前 fresh 驗證的實際版本 `3.1.0`，測試期待 `3.0.0`。

本工作沒有修改上述兩個範圍外契約，也未將完整測試宣稱為全綠。

## 驗收條件映射

- AC-1～AC-8：來源／聚焦契約提供自動證據；使用者於 2026-08-26 明確回報 C5 瀏覽器驗收成功，分類為 `user_attested_complete`，Agent 未操作瀏覽器或讀回執行期資料。
- AC-9：lint、build、靜態探針與受影響測試沒有新增失敗；列印、Word、ZIP、`.ipigeon` 未做人工輸出驗收。
- AC-10：自動證據、第一輪／聚焦複審及使用者人工瀏覽器驗收已分層記錄；目前快照的最後聚焦複審待完成。

## 驗證缺口與關閉閘門

- 獨立整合／程式品質複審：聚焦修正後 PASS，無 Critical 或 Important 問題。
- 本機 Vite／瀏覽器執行階段驗收：使用者於 2026-08-26 回報成功，`user_attested_complete`；Agent 未啟動或操作瀏覽器。
- `.ipigeon` 實際存檔／重新開啟、Word／ZIP／列印人工輸出：未核准、未執行。
- commit、push、正式部署：未核准、未執行。

## 收束複審狀態

- 最終狀態：`completed_with_known_test_gap`。
- 範圍：先前 PASS 後的排序卡片定位、頂端防遮擋微調及其事件隔離契約；核心批次狀態與 session 競態修正保留既有複審 lineage。
- 通過條件：目前快照沒有新的 Critical／Important 問題，且使用者人工驗收不被誤寫成 Agent 瀏覽器證據。
- 最後複審 `deleg_2f440a2f`：`REQUEST_CHANGES`；Critical 無，Important 一項。`STATE.md` frontmatter 已前進至 C5 使用者人工驗收完成／收束複審中，但正文仍誤寫 C0–C4 執行中及瀏覽器未核准。
- 處置：只校正 `STATE.md` 目前摘要與導航名稱，明確區分使用者人工驗收與 Agent 未操作瀏覽器，commit／push／部署維持關閉；產品來源與測試未再修改。
- 文件聚焦複審 `deleg_d2568d4b`：`PASS`；Critical 無，Important 無。前輪唯一治理 finding 已收斂，未發現新的治理矛盾。
