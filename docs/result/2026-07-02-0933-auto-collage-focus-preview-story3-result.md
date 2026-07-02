# Story 3 執行結果：左右 68/32 版面與 page thumbnail rail

- 對應目標：`docs/plans/2026-07-02-0933-auto-collage-focus-preview-story3-workorder.md`

## 完成項目（逐條對應 Story 3 requirements）

- 1) `ImagePreview` 新增 `activeItemId` state（`string | null`）。
- 2) 初始 active 預設為第一張：透過 `useEffect` 當 `viewModels` 變更時，若無 active 或 active 不存在，改抓 `viewModels[0]?.itemId`。
- 3) 匯入 / 刪除造成 active 不存在時 fallback：`ImagePreview` 監聽 `viewModels` 與 `activeItemId`，自動回退到第一張。
- 4) 使用 `buildAutoCollageLayout(viewModels)` 產生頁面 layout。
- 5) 以 `findPageIndexByItemId(layout, activeItemId)` 對應焦點頁 index。
- 6) 右側建立縮圖 rail：`CollagePagePreviewRail` + `CollagePageThumbnail`，以 daisyUI `card`/`badge`/`divider` 呈現，僅展示頁面縮圖。
- 7) 點頁面縮圖時，`CollagePageThumbnail` 會取該頁第一個非空 slot 的 itemId，透過 `setActiveItemId(firstItemId)` 設為 active。
- 8) 左側保留既有 `ImageCard` / `ImageCardForMove` 列表與 dnd sorting 行為，未進行 Story 4/5/6 相關結構大改。
- 9) 拖曳完成時：`handleDragEnd` 除了 reorder 外也呼叫 `setActiveItemId(activeId)`，保持右側 rail 對齊 dragged item。
- 10) `CollagePageThumbnail` 用 template switch `getGridClass` + slot role mapping 呈現五種 template 的大致 slot 架構，含空 slot 顯示「空」。
- 11) 有圖片 slot 時展示 `viewModel.previewUrl` 的縮圖，缺內容顯示「空」，`img` 使用 `alt/title` 帶 item id 與 remark。
- 12) 未改 Word 輸出流程、未新增 dependency。

## 實際修改檔案

- `src/features/ImagePreview/ImagePreview.tsx`
- `src/features/ImagePreview/CollagePagePreviewRail.tsx`
- `src/features/ImagePreview/CollagePageThumbnail.tsx`
- `docs/result/2026-07-02-0933-auto-collage-focus-preview-story3-result.md`

## 驗證命令與結果

- `pnpm run lint`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`eslint .` exit 0）。
- `pnpm run build`
  - OpenCode 執行通過；Hermes 驗收重跑亦通過（`tsc -b && vite build` exit 0；保留既有 chunk size warning）。
- `git diff --check`
  - Hermes 驗收通過，無 whitespace error。

## 手動驗證 / Source Probe

- Source probe（OpenCode + Hermes 已確認）
  - `active item scroll` 邏輯：`CollagePagePreviewRail` 內使用 `activePageIndex -> pageRef -> scrollIntoView({ behavior: 'smooth', block: 'center' })`。
  - `thumbnail 點擊選取` 邏輯：`CollagePageThumbnail` 使用 `firstNonEmptyItemId` 做 guard，觸發 `onPageActivate()` 後傳回 page 的第一張非空圖片。
  - 五種 template 覆蓋：`getGridClass`（`landscape-2`、`portrait-large-2`、`portrait-small-6`）與 mixed 角色位移 class（`mixed-landscape-top`/`mixed-landscape-bottom` 與 `mixed-small-*`）覆蓋五類排列。

## 未完成項目 / Blocker / Deferred

- 無 blockers。
- 未新增互動式手動驗證截圖/錄影證據（以 source proof 替代），必要時可在瀏覽器完成以下 manual check：拖曳/刪除圖片後 active 會回到第一張、點某頁縮圖可跳到該頁。
