---
type: result
id: result-image-pigeon-wheel-sensitivity-2026-08-25
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-wheel-sensitivity-2026-08-25
created_at: 2026-08-25
manual_uat: user_attested_complete
---

# 圖片預覽滾輪靈敏度微調結果

## 實際變更

- `src/features/ImagePreview/ImagePreview.tsx`：只將 `WHEEL_THRESHOLD` 從 `90` 降至 `45`；`WHEEL_COOLDOWN_MS`、事件正規化與其他互動均未變更。
- `tests/wheelNavigation.test.ts`：新增常見單階行模式位移 `3 × 16 = 48` 可跨越切圖門檻的聚焦契約。

## TDD 證據

- RED：聚焦測試以「單階位移 48 應達到門檻 90」失敗，確認契約能重現目前不靈敏的設定。
- GREEN：門檻改為 45 後，同一聚焦測試 1/1 通過。
- 滾輪測試檔：7/7 通過，包含既有備註失焦保存、清單邊界與刪除後焦點契約。

## 驗證

- `node --test tests/wheelNavigation.test.ts`：7/7 通過。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；Vite 保留單一 chunk 大於 500 kB 的既有警告。
- `git diff --check`：通過。
- dirty worktree 護欄：基線後七個受保護並行路徑未漂移；本輪沒有還原、暫存或覆寫其內容。
- `pnpm run test:frontend`：97/99 通過。兩項失敗均不在本輪範圍：既有列印文案缺少「可透過系統列印對話框另存 PDF」，以及目前版本值 `3.0.1` 與版本測試期待 `3.0.0` 不一致；本輪未修改相關來源或測試。

## 使用者人工驗收

2026-08-25，使用者在目前介面完成實際操作後回報「測試情形良好，不用再次修改」。此證據分類為使用者人工驗收（user-attested）完成；Agent 未操作瀏覽器或量測滾輪事件，因此不將其改寫為 Agent 瀏覽器執行證據。

## 未執行

- 未 commit、push 或部署。
