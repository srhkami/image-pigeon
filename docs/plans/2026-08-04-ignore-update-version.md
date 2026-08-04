---
type: plan
id: plan-image-pigeon-ignore-update-version-2026-08-04
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-04
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-08-04-ignore-update-version-result.md
---

# 忽略指定更新版本功能

## 目標

在「有新版本」提示視窗加入「忽略此版本」按鈕。使用者點擊後，把遠端最新版本 `updated_at` 轉成民國年七碼日期並寫入 LocalStorage；相同日期的版本不再顯示，遠端更新日期改變後才再次提示。

## 現況與做法

更新 API 已回傳 `updated_at`，例如 `2026-07-15`。現有元件只用 SessionStorage 記錄當次工作階段關閉的 `app_version`。本輪保留一般關閉時的既有 SessionStorage 行為，另建立可獨立測試的日期轉換與忽略判斷函式；只有明確點擊「忽略此版本」才寫入 LocalStorage。

## Allowed paths

- `src/features/Intro/ModalNewVersion.tsx`
- `src/features/Intro/newVersionDismissal.ts`
- `src/utils/type.ts`
- `tests/newVersionDismissal.test.ts`
- `STATE.md`
- `docs/plans/2026-08-04-ignore-update-version.md`
- `docs/result/2026-08-04-ignore-update-version-result.md`

## Protected existing changes

本輪開始前已存在的所有未提交變更均受保護，尤其是上一輪檔案選擇器修正、套件更新及其 plan/result；不得還原、覆寫、暫存或吸收。

## Non-scope

- 修改更新 API、版本比較規則或下載流程。
- 將一般關閉按鈕改成永久忽略。
- 發布、打包、commit、push 或 Windows GUI 實機驗收。

## 執行步驟

1. 先新增前端失敗測試，驗證西元日期轉七碼民國日期、同日期抑制與不同日期重新顯示。
2. 實作純函式並使聚焦測試轉綠。
3. 擴充 `VersionCheckData.updated_at`，在提示視窗讀取 LocalStorage；加入明確的「忽略此版本」按鈕並只在該動作寫入。
4. 執行完整前端測試、lint、build、`git diff --check` 與 dirty baseline guard。
5. 寫入結果並收束 STATE。

## Acceptance criteria

- `2026-07-15` 轉換為 `1150715`，LocalStorage 只保存七碼日期。
- 儲存日期等於遠端最新版本日期時不顯示；日期不同時再次顯示。
- 「忽略此版本」按鈕會寫入目前遠端版本日期並關閉視窗。
- 一般關閉不寫入永久忽略 LocalStorage，既有工作階段內不重複提示行為保留。
- 前端測試、lint、build 與 `git diff --check` 通過。
