---
type: architecture-snapshot
status: historical
canonical: true
scope: image-pigeon
snapshot_date: 2026-07-29
historical_only: true
---

# Legacy 文件治理快照

本文件只保存 Project-State v1 遷移所需的歷史脈絡，不得直接作為執行計畫。

## 舊 authority model

2026-07-03 的清理提交 `d89afeb` 曾將分散計畫／結果濃縮成：

- `AGENTS.md`：操作規則、架構決策與載入順序。
- `docs/status/current-architecture-and-features.md`：canonical current handoff。
- `.planning/`：短期草稿、進度與介面探索。

該模式要求完成後刪除細碎 plan/result，只把摘要留在 `docs/status/`。這與 Project-State v1「保留已執行 plan/result、用 STATE 做 selective loading」不同。

## 歷史檔案盤點

在 `d89afeb^`：

- `docs/plans/`：15 份。
  - 13 份 frontmatter 仍標示 `active`。
  - 2 份仍標示 `proposed`。
- `docs/result/`：18 份。
  - 12 份標示 `completed`。
  - 6 份沒有正式 frontmatter status，其中包含 5 份功能 result 與 `docs/result/README.md`。
- `docs/status/`：1 份 FastAPI/session/project-format 決策紀錄。

這表示舊清理發生前，plan lifecycle 與 result outcome 沒有完整 reconciliation。這些標籤只代表歷史檔案外觀，不可重新匯入為目前 workstream。

## 目前仍存在的 legacy artifacts

- `.planning/2026-06-30-fastapi-session-project-format/`：宣稱程式碼尚未開始修改，且指向已不存在的 formal plan，內容已過期。
- `.planning/sketches/focus-card-layout/`：介面探索與最後方向草圖。
- `.planning/.active_plan`：過期 current pointer，已獲使用者核准在本次遷移移除。

既有 `.planning/` 內容保留為 non-canonical 歷史；除本次遷移 candidate 外，不從中執行工作。

## Replacement

| Legacy responsibility | Replacement |
|---|---|
| current handoff / active pointer | `STATE.md` |
| agent operation rules | `AGENTS.md` |
| full documentation governance | `docs/governance.md` |
| architecture summary | `docs/architecture/current-architecture.md` |
| accepted product/runtime decisions | `docs/adr/0001-project-format-and-runtime-boundaries.md` |
| new execution contracts | `docs/plans/` |
| new execution evidence | `docs/result/` |

## Provenance 與保留策略

- 已刪除的舊 plan/result 不批次復原；Git history 保留其完整正文與 evidence。
- 需要稽核時從 `9970e16` 到 `d89afeb^` 的歷史讀取，不把歷史 `active/proposed` 當成現在狀態。
- 2026-07-03 之後新執行的 formal plan/result 依 Project-State v1 保留，不再以「濃縮後刪除」作預設清理方式。
