---
type: plan
id: plan-image-pigeon-project-state-v1-migration-2026-07-29
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-07-29T16:24:38+08:00
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-07-29-project-state-v1-migration-result.md
---

# Project-State v1 遷移計畫

## 目標

將 image-pigeon 從 legacy `AGENTS.md + docs/status + .planning pointer` 治理，原子切換到 `STATE.md + scoped docs`，並以一個真實低風險任務驗證生命週期可閉環。

## Scope

- `AGENTS.md`
- `STATE.md`
- `README.md` 的單一開發者入口
- `docs/governance.md`
- `docs/adr/`
- `docs/architecture/`
- `docs/plans/`
- `docs/result/`
- `.planning/2026-07-29-project-state-v1-migration/`
- 刪除 `.planning/.active_plan`

## Non-scope

- `main.py`、`vite.config.ts` 與其他 runtime source。
- DB、provider、browser、production、deploy、commit、push。
- 批次復原或刪除 Git 歷史中的舊 plan/result。
- 宣稱應用程式 lint、build、packaged runtime 或 UAT 已於本遷移重新驗證。

## Checkpoints

1. Inventory：盤點 authority、歷史文件與 dirty baseline。
2. Candidate：建立 `canonical: false`、`transitioning` 候選並驗證。
3. Cutover：建立正式 authority，切換成 `project-state-v1`。
4. Trial：透過獨立 trial plan 在 README 增加 STATE 開發者入口，建立 result 並收束 STATE。
5. Review：執行 fresh-context 文件治理審查；修正後重驗。
6. Closure：完成 plan/result lifecycle，將 workstream 移出 STATE，留下 bounded recent result pointers。

## Acceptance criteria

- 正式 STATE 唯一且可導航所有未關閉工作。
- 不從 `.planning/` 或歷史 lifecycle 標籤直接執行。
- 架構、ADR、治理、plan、result owner 分離且連結可解析。
- 受保護 dirty baseline 沒有被覆寫。
- README trial 完整產生 plan、edit、result 與 STATE reconciliation。
- 獨立審查 PASS，frontmatter／路徑／stale reference／diff hygiene／staged guard 通過。

## Rollback

若 cutover 或 trial 無法閉環，停止新 execution，將正式 STATE mode 回到 `transitioning`，保留 failure evidence，修正後重新執行 closure；不得同時宣稱新舊 authority 都是 canonical。
