# Story 5 執行結果：排序模式獨立化

- 對應目標：`docs/plans/2026-07-02-0933-auto-collage-focus-preview-story5-workorder.md`

## 完成項目（逐條對應 Story 5 requirements）

- 1) 排序模式只渲染小圖 row
  - `ImagePreview` 在 `isMoveMode` 分支改為渲染 `SortableImageList`，不再在排序分支內渲染其他編輯卡片。

- 2) 每列資訊
  - `ImageCardForMove` 在每列呈現：
    - drag handle（`CgMenuGridR` 按鈕）
    - 小縮圖
    - 序號（`#`）
    - 類型 badge（橫向 / 直向大圖 / 直向小圖）
    - 原檔名或備註摘要（`remark` 優先、無備註時 fallback `originalName`）

- 3) 排序模式不提供一般編輯功能
  - `ImageCardForMove` 僅保留排序與選取 row：不含備註 textarea、旋轉按鈕、直圖切換、刪除按鈕。

- 4) `ImageCardForMove` 重構為純 sortable row
  - 保留 `useSortable()`，並保留 drag listeners 與 transform style。
  - 行列點擊只做 `setActiveItemId(viewModel.itemId)`。
  - 拖曳 handle 的 `onPointerDown` 設定 `stopPropagation()`，避免點擊 handle 時同時觸發列 click。

- 5) 建立 `SortableImageList`
  - 新增 `src/features/ImagePreview/SortableImageList.tsx`，接收 `viewModels`、`activeItemId`、`setActiveItemId`。
  - 以 `ImageCardForMove` 渲染所有 row。
  - active row 套用 ring / border / accent 樣式（`ImageCardForMove` `isActive` 狀態）。
  - 空列表顯示「尚未加入圖片，請先匯入後再進行排序。」

- 6) `ImagePreview` 排序/一般模式切換
  - `isMoveMode` 為真時，只在此分支組裝 `DndContext + SortableContext`。
  - 一般模式仍保留 `FocusImageEditor`。
  - 右側 `CollagePagePreviewRail` 仍保留，`activeItemId` 變更後可定位到對應頁面。
  - `handleDragEnd` 仍保留 `reorderItem()`、`setActiveItemId(activeId)` 與 `setImages(arrayMove(...))`。

- 7) 未做 Story 6
  - 未動到 Word 輸出相關程式。

- 8) 未新增 dependency
  - 變更僅重用既有 `dnd-kit` / 現有樣式系統。

## 實際修改檔案

- `src/features/ImagePreview/ImageCardForMove.tsx`
- `src/features/ImagePreview/SortableImageList.tsx`（新增）
- `src/features/ImagePreview/ImagePreview.tsx`

## 驗證命令與結果

- Source contract probe
  - RED：實作前確認舊排序卡仍含刪除 UI、缺少 `SortableImageList`、`ImagePreview` 尚未使用排序清單。
  - GREEN：Hermes 驗收重跑通過，確認 `ImageCardForMove` 不含刪除/旋轉/備註/portraitSize 操作、`SortableImageList` 已接線、拖曳後仍保留 `setActiveItemId(activeId)`。
- `pnpm run lint`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`eslint .`，exit 0）。
- `pnpm run build`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`tsc -b && vite build`，exit 0）。
  - 仍有既有 chunk 大小警告。
- `git diff --check`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過，無 whitespace error。
- Browser smoke：`pnpm run dev -- --host 127.0.0.1` + `http://127.0.0.1:5173/`
  - Hermes 驗收通過；頁面可載入，console 無 JavaScript error。

## Source proof / 手動驗證

- Source proof：
  - 排序清單元件 `SortableImageList` 與 row `ImageCardForMove` 已獨立化。
  - `ImagePreview.tsx` 僅在 `isMoveMode` 分支內有 `DndContext + SortableContext`，一般模式回到 `FocusImageEditor`。
  - `ImageCardForMove` 只實作 `setActiveItemId` 行為，不存在 `remark`、旋轉、直圖切換或刪除 handlers。
  - handle click 使用 `onPointerDown(...stopPropagation())`，避免點 handle 時列 click side effect。
- Browser smoke：首頁可載入；空專案狀態下左側顯示 `請先選擇圖片`，右側保留 `頁面縮圖預覽`。
- 手動建議：在排序模式下拖曳任一列，觀察左側只剩小圖 row；拖曳後 active item 保持不變並檢查右側頁面縮圖會自動對齊。

## 未完成項目 / Blocker / Deferred

- 無阻礙。
- Story 6 Word 輸出未開始，符合此 Story 範圍限制。
