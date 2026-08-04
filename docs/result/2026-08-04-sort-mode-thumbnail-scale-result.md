---
type: result
id: result-image-pigeon-sort-mode-thumbnail-scale-2026-08-04
implements: docs/plans/2026-08-04-sort-mode-thumbnail-scale.md
status: completed
completed_at: 2026-08-04
verification_scope: source-and-automated-frontend
---

# 排序模式圖片尺寸與排版標示調整結果

## 完成內容

- 排序卡片圖片先由 `h-20 w-36` 放大為 `h-36 w-64`；依後續回饋再放大為 `h-72 w-[32rem]`，寬高均為第一版兩倍，並以 `max-w-full` 避免窄版面水平溢出。
- 圖片改用 `object-contain`，放大後仍呈現完整內容。
- 排序卡片標籤改由 `layoutPreference` 決定：`stacked-2` 顯示「上下」、`side-by-side-2` 顯示「左右」、`grid-6` 顯示「六張」。
- 排序卡片不再讀取 `orientation` 或 `portraitSize` 判斷使用者可見標籤。
- 排序卡片已移除備註及原始檔名預覽，只保留拖曳控制、編號、圖片與排版標籤。
- 卡片支援鍵盤聚焦及 Enter／Space 啟用；容器可換行且圖片最大寬度受卡片限制，避免窄版面水平溢出。

## 驗證

- 初始 source contract RED：6 項中 5 項通過、1 項如期失敗。
- 追加修改後聚焦 source contract：6/6 通過。
- `pnpm run test:frontend`：27/27 通過。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；保留既有 chunk size 警告。
- `git diff --check`：通過。

## 證據界線

未啟動 browser 或 pywebview，因此「約一頁四張」是由卡片高度與自動化來源契約支持的設計目標，不宣稱已完成實際視窗高度的視覺驗收。

## 獨立聚焦複審

第一輪複審結論為 `PASS`。審查確認尺寸、完整圖片呈現、三種排版標籤、必填聯集型別、窄寬度、拖曳行為與新增回歸契約均無阻擋；build 僅保留既有 bundle 大小警告。

## 後續使用者回饋

使用者確認第一版仍太小，要求圖片尺寸至少再放大兩倍，並移除備註預覽。追加來源修改與自動驗證已完成。第一次追加複審指出鍵盤啟用與窄版面兩項阻擋，已以 `tabIndex`、Enter／Space handler、`flex-wrap`、`max-w-full` 及移除 `shrink-0` 修正；聚焦複審結論為 `PASS`，未發現新的程式碼阻擋。
