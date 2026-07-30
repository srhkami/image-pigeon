---
type: result
id: result-image-pigeon-wheel-remark-save-2026-07-29
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-wheel-remark-save-2026-07-29
created_at: 2026-07-29
review:
  status: passed
  passed_at: 2026-07-30
---

# 滾輪切圖前保存備註修正結果

## 根因

`src/features/ImagePreview/FocusImageCard.tsx` 的備註只透過 textarea 的 `onBlur` 寫回 ProjectV2 與 legacy `CustomImage`。使用者在輸入後把滑鼠移到欄位外並滾動時，textarea 仍保有焦點；既有滾輪處理先切換 `activeItemId`，使目前卡片卸載，因此不能依賴瀏覽器自然失焦來觸發保存。

## 變更

- 新增 `src/features/ImagePreview/wheelNavigation.ts`，集中處理目標索引、邊界判斷、目前焦點元素失焦與 active item 更新順序。
- `ImagePreview` 的實際切換路徑直接委派同一個受測函式；僅在下一張圖片確實存在時，先讓 `document.activeElement` 失焦，再切換 `activeItemId`。
- 新增 Node.js 內建測試執行入口與四項回歸檢查，涵蓋失焦呼叫、沒有焦點元素、備註提交先於圖片切換，以及清單邊界不失焦。
- 沒有變更 threshold、cooldown、排序模式、資料模型或後端 API。

## TDD evidence

- RED：`pnpm run test:frontend` 因 `wheelNavigation.ts` 尚不存在而以 `ERR_MODULE_NOT_FOUND` 失敗，確認測試先於 production helper。
- GREEN：初版實作後同一命令通過 2 項測試，0 失敗。
- 首次獨立審查判定測試只覆蓋失焦小工具，未證明保存先於圖片切換，因此 verdict 為 FAIL。
- 第二次 RED：加入順序測試後，因 `activateItemByOffset` 尚未 export 而如預期失敗。
- 第二次 GREEN：將 production 切換路徑收斂至 `activateItemByOffset` 後，同一命令通過 4 項測試，0 失敗。

## 驗證

- `pnpm run test:frontend`：4/4 通過。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；Vite 仍報告單一 bundle 大於 500 kB 的既有效能警告，不影響本次 build 成功。
- `git diff --check`：通過。
- staged-file guard：通過，沒有 staged files。

## Review 與 runtime 邊界

首次獨立只讀程式審查因測試未涵蓋保存與切換順序而判定 FAIL；補強受測 production 路徑與順序測試後，重試審查判定 PASS。此次沒有啟動本機 FastAPI／Vite 持續服務或 pywebview 視窗，也沒有宣稱完成 GUI 實機 UAT；驗證證據限於回歸測試、lint、TypeScript build 與 Vite production build。
