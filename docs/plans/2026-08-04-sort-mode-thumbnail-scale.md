---
type: plan
id: plan-image-pigeon-sort-mode-thumbnail-scale-2026-08-04
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-04
execution:
  status: completed
  current_checkpoint: completed
result: docs/result/2026-08-04-sort-mode-thumbnail-scale-result.md
approval_gates:
  source_write: approved
  browser_uat: pending
  commit: closed
  push: closed
---

# 排序模式圖片尺寸與排版標示調整

## 目標

放大排序模式中的圖片預覽，使一般可用高度約可看到四張圖片；將舊「橫向／直向大圖／直向小圖」標示改為目前的「上下／左右／六張」排版偏好。

## 核准範圍

- `src/features/ImagePreview/ImageCardForMove.tsx`
- `src/features/ImagePreview/manualLayoutPreference.test.ts`
- 本 plan、同 scope result 與 `STATE.md`

## 驗收條件

- 排序卡片圖片相對第一版 `h-36 w-64` 至少再放大兩倍，採 `h-72 w-[32rem]` 並維持合理比例。
- 圖片使用 `object-contain`，避免放大後裁切內容。
- 標籤只依 `layoutPreference` 顯示「上下／左右／六張」，不再依方向或 `portraitSize` 顯示舊標籤。
- 排序卡片不預覽備註或原始檔名，只保留排序控制、編號、圖片與排版標籤。
- 前端回歸、lint、build 與 `git diff --check` 通過。
- browser UAT 未核准時只記錄為未執行，不以 build 取代。
