---
type: result
id: result-image-pigeon-image-editor-bugfixes-2026-08-25
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-25
review:
  status: not_requested
---

# 圖片刪除焦點與混合排版修正結果

## 範圍

本次依使用者核准直接修正 3.0.0 純前端候選的兩個小範圍問題：

1. 刪除目前圖片後不再固定跳回第一張。
2. 「六張」後接「上下」時，「上下」圖片不再落入六張小圖格。

沒有修改專案格式、匯入、輸出契約、後端、部署、版本號、依賴或 Git 歷史。

## 根因

### 刪除後跳回第一張

`src/features/ImagePreview/ImagePreview.tsx` 持有 `activeItemId`，但原本的刪除流程位於 `FocusImageCard`，只移除專案項目與資產。刪除後 active ID 指向不存在的項目，既有效果因此使用 `viewModels[0]` 作為後備，造成固定跳回第一張。

### 六張後接上下時位置錯誤

`src/features/ImagePreview/autoCollageLayout.ts` 建立 `mixed-small3-landscape1` 時，先把連續六張項目與後方上下項目串接，再補滿四格。當只有一張六張項目時，後方上下項目因此被放入第二個小圖格，而底部橫圖格保持空白。

## 變更

- `src/features/ImagePreview/wheelNavigation.ts`
  - 新增無副作用的 `getActiveItemIdAfterRemoval()`。
  - 刪除中間項目時選擇下一張；刪除最後一張時選擇前一張；刪除唯一項目時回傳 `null`。
- `src/features/ImagePreview/ImagePreview.tsx`
  - 將刪除協調移至焦點狀態擁有者。
  - 先決定鄰近焦點，再移除 ProjectV2 項目、舊 `CustomImage` 狀態與未被其他項目共用的瀏覽器資產。
- `src/features/ImagePreview/FocusImageEditor.tsx`、`FocusImageCard.tsx`
  - 以 `onRemoveItem` 將刪除意圖傳回 `ImagePreview`，卡片不再自行協調焦點與資產生命週期。
- `src/features/ImagePreview/autoCollageLayout.ts`
  - 先將六張項目補滿前三個小圖位置，再把後方上下項目固定放入第四個 `mixed-landscape-bottom` 位置。
- 更新 `manualLayoutPreference.test.ts`、`tests/wheelNavigation.test.ts` 與 `browserAssetStore.test.ts` 的回歸契約。

## 測試驅動開發證據

### 混合排版

- RED：`node --test src/features/ImagePreview/manualLayoutPreference.test.ts`
  - 6 項通過、1 項失敗。
  - 實際結果把 `stacked-01` 放入 `mixed-small-bottom-middle`，而 `mixed-landscape-bottom` 為空。
- GREEN：修正 slot 組裝後重跑同一命令，7/7 通過。

### 刪除後焦點

- RED：`node --test tests/wheelNavigation.test.ts`
  - 4 項通過、2 項失敗。
  - `getActiveItemIdAfterRemoval` 尚不存在，且實際刪除路徑尚未接上鄰近焦點選擇。
- GREEN：新增 helper 並將刪除流程提升至 `ImagePreview` 後，與排版測試合併執行為 13/13 通過。

## 驗證

- 聚焦回歸：
  - `node --test tests/wheelNavigation.test.ts src/features/ImagePreview/manualLayoutPreference.test.ts src/services/browserAssetStore.test.ts`
  - 19/19 通過。
- `pnpm run lint`：通過，exit code 0。
- `pnpm run build`：通過，exit code 0；Vite 保留單一 chunk 超過 500 kB 的既有警告。
- `git diff --check`：通過。
- `pnpm run test:frontend`：107 項中 106 項通過、1 項失敗。
  - 失敗為 `printPreview.test.ts` 既有文案契約要求「可透過系統列印對話框另存 PDF」，但同時出現的範圍外未提交變更已將 `PrintPreviewOutput.tsx` 文案改成「不用匯出 WORD，直接透過瀏覽器預覽並列印」。
  - 本次沒有修改、還原或接管該範圍外變更；此失敗不在兩項 bug 修正路徑內，但完整 suite 不宣稱全數通過。

## 工作樹與驗證邊界

本次開始時工作樹為乾淨。執行期間另出現 `src/features/Output/PrintPreviewOutput.tsx`、`SaveImages.tsx`、`SaveProject.tsx`、`SaveWord.tsx` 的未提交變更；這些檔案不屬本次修正，已完整保留且未納入成果。

此次沒有啟動瀏覽器人工驗收、Windows／Word UAT、部署、commit、push 或 merge。完成證據限於測試驅動開發的 RED／GREEN、19 項聚焦回歸、lint、TypeScript／Vite production build 與差異檢查。
