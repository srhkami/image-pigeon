---
type: plan
id: plan-image-pigeon-wheel-remark-save-2026-07-29
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-07-29
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-07-29-wheel-remark-save-result.md
---

# 滾輪切圖前保存備註修正

## 目標

修正焦點式圖片編輯器中，備註欄位仍有焦點時在欄位外使用滾輪切換圖片，因元件先卸載而未觸發既有失焦保存，導致輸入文字遺失的問題。

## Allowed paths

- `src/features/ImagePreview/ImagePreview.tsx`
- `src/features/ImagePreview/wheelNavigation.ts`
- `tests/wheelNavigation.test.ts`
- `package.json`
- `STATE.md`
- `docs/plans/2026-07-29-wheel-remark-save.md`
- `docs/result/2026-07-29-wheel-remark-save-result.md`

## Non-scope

- 備註資料模型、專案格式與後端 API。
- 滾輪切圖的 threshold、cooldown、排序模式行為與版面。
- 外部服務、資料庫、production、deploy、commit、push。

## Acceptance criteria

- 先有失敗的前端回歸測試，證明缺少切圖前失焦提交機制。
- 滾輪切換焦點圖片前，主動讓目前焦點元素失焦，使既有 `onBlur` 保存同步完成。
- 沒有焦點元素時不拋出錯誤。
- `pnpm run test:frontend`、`pnpm run lint`、`pnpm run build` 與 `git diff --check` 通過。