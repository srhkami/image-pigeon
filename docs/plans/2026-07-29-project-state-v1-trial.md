---
type: plan
id: plan-image-pigeon-project-state-v1-readme-trial-2026-07-29
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-07-29T16:24:38+08:00
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-07-29-project-state-v1-trial-result.md
---

# Project-State v1 README 閉環試行

## 目標

在正式 cutover 後，以一項真實、低風險文件工作驗證新生命週期：在 README 加入開發者狀態入口，讓後續貢獻者能從 `AGENTS.md` 與 `STATE.md` 恢復工作。

## Allowed paths

- `README.md`
- `STATE.md`
- `docs/plans/2026-07-29-project-state-v1-trial.md`
- `docs/result/2026-07-29-project-state-v1-trial-result.md`
- 遷移 plan/result 與 `.planning/2026-07-29-project-state-v1-migration/` 的 reconciliation metadata

## Non-scope

- 應用程式原始碼、manifest、lockfile 與 runtime 行為。
- DB、provider、browser、production、deploy、commit、push。
- README 其他產品文案或版面重寫。

## Acceptance criteria

- README 新增一個簡短開發者入口。
- 入口同時指向 `AGENTS.md` 與 `STATE.md`，不指向 legacy `docs/status/`。
- README 其他內容保持不變。
- 建立同 scope result，包含 `implements`。
- 技術驗證完成後保持 review-pending；獨立 review PASS 後才將本 plan/result 標為 completed，並完成 STATE closure。
- `git diff --check`、路徑驗證與 staged-file guard 通過。
