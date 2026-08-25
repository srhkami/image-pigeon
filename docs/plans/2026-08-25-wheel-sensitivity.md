---
type: plan
id: plan-image-pigeon-wheel-sensitivity-2026-08-25
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-25
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-08-25-wheel-sensitivity-result.md
---

# 圖片預覽滾輪靈敏度微調

## 目標

稍微降低焦點圖片預覽的滾輪累積門檻，使常見單階行模式位移可切換一張圖片，再交由使用者人工測試手感。

## 核准範圍

- `src/features/ImagePreview/ImagePreview.tsx`：只將 `WHEEL_THRESHOLD` 從 `90` 降至 `45`。
- `tests/wheelNavigation.test.ts`：加入常見單階行模式位移可跨越門檻的回歸契約。
- `STATE.md`
- `docs/plans/2026-08-25-wheel-sensitivity.md`
- `docs/result/2026-08-25-wheel-sensitivity-result.md`

## 非範圍

- 不調整 `WHEEL_COOLDOWN_MS`、事件正規化、觸控板判定、排序模式、版面或動畫。
- 不覆寫工作區既有未提交變更。
- 不 commit、push 或部署。

## 驗收條件

- 聚焦回歸契約先以門檻 `90` 產生預期失敗，再以 `45` 通過。
- `pnpm run test:frontend`、`pnpm run lint`、`pnpm run build` 與 `git diff --check` 完成並如實記錄。
- 本輪只提供自動驗證證據；實際滑鼠手感由使用者後續人工測試。
