---
type: planning-workspace
id: planning-image-pigeon-project-state-v1-migration-2026-07-29
status: completed
canonical: false
created_at: 2026-07-29T16:24:38+08:00
completed_at: 2026-07-29
project: image-pigeon
---

# Project-State v1 遷移工作計畫

## 目標

將目前由 `AGENTS.md`、已刪除的 `docs/status/current-architecture-and-features.md` 與過期 `.planning/` 指標共同構成的舊治理，遷移成單一專案範圍的 `STATE.md` 與 scoped `docs/`。

## 已核准範圍

- 建立候選與正式 `STATE.md`。
- 建立 `docs/governance.md`、`docs/architecture/`、`docs/adr/`、正式 plan/result。
- 精簡 `AGENTS.md`。
- 移除過期 `.planning/.active_plan`。
- 在 `README.md` 加入開發者狀態入口，作為切換後的低風險閉環試行。

## 非範圍

- 不修改 `main.py`、`vite.config.ts` 或其他應用程式原始碼。
- 不復原已於 `d89afeb` 刪除的全部舊計畫與結果。
- 不執行資料庫、外部供應商、瀏覽器、部署、commit 或 push。
- 不宣稱應用程式 runtime、lint 或 build 已因本次文件遷移重新驗證。

## 階段

1. 盤點舊 authority、Git 歷史、目前原始碼與 dirty baseline。
2. 建立 `canonical: false`、`governance_mode: transitioning` 候選。
3. 驗證候選 frontmatter、路徑、scope owner 與 legacy retention。
4. 原子建立正式 `STATE.md` 與 scoped docs，並將 mode 切換為 `project-state-v1`。
5. 執行 README 低風險閉環試行。
6. 進行獨立文件治理審查與最終機械驗證。

## 回復條件

若候選或切換驗證失敗，停止新任務，把正式 scope 保持或恢復為 `transitioning`，舊資料只作歷史來源，不建立雙 canonical owner。
