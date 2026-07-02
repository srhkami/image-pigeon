# Story 4 執行結果：一般模式改為 focus editor

- 對應目標：`docs/plans/2026-07-02-0933-auto-collage-focus-preview-story4-workorder.md`

## 完成項目（逐條對應 Story 4 requirements）

- 1) 一般編輯路徑不再使用 dnd-sortable：`ImageCard` 已移除 `useSortable()`、`CSS.Transform` 與拖曳 handle 相關 UI。
- 2) 建立 `FocusImageEditor` 並接收 `viewModels`、`activeItemId`、`setActiveItemId`、`setProject`、`setImages`。
- 3) `ImagePreview` 一般模式直接改為 `<FocusImageEditor />`；僅排序模式才保留 `DndContext + SortableContext + ImageCardForMove`。
- 4) `FocusImageEditor` 導入焦點切換來源：
  - 滑鼠滾輪（`WHEEL_THRESHOLD` 累積閥值）
  - 上下鍵（`window` `keydown` 監聽）
  - 上/下一張按鈕
  - 點擊相鄰卡片（非 active 卡片 onClick 切換）
  - 點右側縮圖仍透過 `CollagePagePreviewRail` 呼叫 `setActiveItemId`（Story 3 既有機制保留）
- 5) 建立 `FocusImageCard`，並使用既有 daisyUI class（`card`, `shadow`, `border`, `textarea textarea-sm`, `btn-ghost/info/error`, `badge-*`）。
- 6) active 卡片操作已覆蓋：備註 textarea（`onBlur` 存 project + `setImages.editRemark`）、左轉/右轉（同時更新 project + `setImages.setRotation`）、直圖大/小切換（`updateItemPortraitSize`）、刪除（project + `setImages`）
- 7) 非 active 卡片只保留縮圖與類型 badge；未顯示編輯控制項。
- 8) 焦點畫面視覺：依距離套用 `scale/opacity/blur` class，支援 active / adjacent / second-adjacent。
- 9) 未做 Story 5/6 相關整理（保留既有 ImageCardForMove + dnd 結構給 Story 5，排序模式不改輸出流程）。
- 10) 未新增任何 dependency。

## 實際修改檔案

- `src/features/ImagePreview/ImageCard.tsx`（移除 sortable 相關 hook 與 handle）
- `src/features/ImagePreview/FocusImageEditor.tsx`（新建）
- `src/features/ImagePreview/FocusImageCard.tsx`（新建）
- `src/features/ImagePreview/ImagePreview.tsx`（一般模式切換 focus editor、排序模式保留 DndContext）

## 驗證命令與結果

- `pnpm run lint`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`eslint .`，exit 0）。
- `pnpm run build`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`tsc -b && vite build`，exit 0）。
  - 僅保留既有大檔案 chunk 警告。
- `git diff --check`
  - Hermes 驗收通過，無 whitespace error。
- Browser smoke：`pnpm run dev -- --host 127.0.0.1` + `http://127.0.0.1:5173/`
  - Hermes 驗收通過；頁面可載入，console 無 JavaScript error。

## 手動驗證 / Source proof

- Browser smoke：首頁可載入；空專案狀態下左側顯示 `請先選擇圖片`，右側保留 `頁面縮圖預覽`。
- Source proof：
  - `ImagePreview` 非排序分支回傳 `FocusImageEditor`，並移除一般模式下的 dnd 包裝。
  - `FocusImageEditor` `handleWheel` 有 delta 累積閥值、`onKeyDown` 處理 `ArrowUp/ArrowDown`，並有 `goPrev/goNext`、非 active 卡片 `onActivate`。
  - `FocusImageCard` 非 active 只 render `badge` 與 `img`，active  render `textarea` + rotate / toggle portraitSize / delete。
  - 所有 `刪除` 與 `旋轉` 流程都同時更新 project state 與 legacy `setImages`。

## 未完成項目 / Blocker / Deferred

- 無阻擋項。
- OpenCode 曾額外產生 Story 5 排序模式檔案與結果文件；Hermes 驗收時已移除該 out-of-scope 變更，本 commit 僅保留 Story 4。
- 此次為 Story 4，故未保留 Story 5（排序模式獨立化）與 Story 6（Word 輸出改為 auto collage）變更。
