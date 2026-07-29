# 約束與核准界線

## 受保護 dirty baseline

盤點時間：2026-07-29 16:24:38 +0800

- `D docs/status/current-architecture-and-features.md`
- `M main.py`
- `M vite.config.ts`
- staged files：無

其中 `main.py` 與 `vite.config.ts` 的既有差異是開發埠 `5195`；本次遷移不得修改或復原。狀態文件的刪除也視為使用者既有變更，不直接復原。

## 已開啟 gate

- 專案內治理文件寫入。
- `AGENTS.md` 精簡。
- `README.md` 單一開發者入口試行。
- 刪除過期 `.planning/.active_plan`。

## 保持關閉的 gate

- 應用程式原始碼變更。
- DB、外部 provider、production、deploy。
- browser/runtime 持續服務。
- 復原或刪除整批歷史計畫／結果。
- commit、push、history rewrite。
