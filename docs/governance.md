---
type: governance
schema_version: 1
status: current
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
updated_at: 2026-07-29
---

# image-pigeon 文件治理

## Authority

| 問題 | 權威文件 |
|---|---|
| Agent 操作、安全、核准與驗證規則 | `AGENTS.md` |
| 目前工作線、blocker、gate、下一步與導航 | `STATE.md` |
| 原定 scope、驗收條件與允許路徑 | `docs/plans/` |
| 實際變更、檢查與 gate outcome | `docs/result/` |
| 已接受產品／架構決策 | `docs/adr/` |
| 現行架構與 durable contract | `docs/architecture/` |
| 短期草稿、發現與介面探索 | `.planning/`，非 canonical |

衝突時按欄位校正，不以整份文件覆蓋另一份文件。Result 證明實際發生事項；plan 保留原始 contract；STATE 必須與有效 evidence 一致。一般文字不能自行開啟核准 gate。

## Governance mode

本 scope 的 `STATE.md.governance_mode` 是唯一模式宣告：

- `legacy`：舊 authority 仍有效。
- `transitioning`：舊 authority 仍有效，新文件只可作 candidate。
- `project-state-v1`：`STATE.md` 與 scoped `docs/` 接管目前狀態與正式文件。

沒有 STATE、mode 不明或連結失效時，一律 fail closed：只盤點，不從 `.planning/` 或 Git 歷史直接執行。

## 文件生命週期

Plan lifecycle：`draft | active | completed | superseded | cancelled`。

Execution/result：`not_started | in_progress | completed | partial | blocked | failed | cancelled`。

Workstream：`planned | in_progress | blocked | waiting_approval | paused | completed | cancelled`。

一份 plan/result 只有一個 canonical owner。完成或取消 workstream 時，先校正 plan/result，再從 STATE 移除；必要時在 `recent_results` 留下有限期 handoff pointer。

## Scope 與路徑

本 repository 是單一 project scope。所有 frontmatter 路徑均以 repository root 為基準；一般 Markdown link 則依 Markdown 標準從所在檔案目錄解析。

只建立實際需要的 `docs/` 子目錄，不建立 `.project/`、`project-docs/` 或 `docs-v2/`。

## 保留與刪除

- 已執行的正式 plan/result 預設保留。
- `.planning/` 永遠不是執行權威。
- 可刪除項目限於已核准的非正式草稿、空 placeholder、精確重複或已通過 replacement/snapshot/reference scan/trial gate 的舊指標。
- 本專案 2026-07-03 以前的細碎 plan/result 已由舊治理清理；其 provenance 請看 `docs/architecture/legacy-project-governance-snapshot.md` 與 Git history，不批次復原。

## 預設載入順序

1. 讀適用的 `AGENTS.md`。
2. 讀同 scope 的 `STATE.md` 並確認 mode。
3. 從相關 workstream 讀 canonical plan。
4. 只讀直接相關 ADR、architecture 與 governance 章節。
5. 歷史 result 僅在執行、debug、audit 或 reconciliation 時讀取。

## 執行與驗證

- 執行前記錄 dirty baseline，保護既有使用者變更。
- 中大型工作以 formal plan 定義 scope、non-scope、gates 與驗收條件。
- 執行後建立同 scope result，包含 `implements`。
- 文件修改至少驗證 frontmatter、路徑、連結、stale authority、tracked/untracked status、`git diff --check` 與 staged-file guard。
- 文件審查不等同 runtime、資料庫、provider、production、commit 或 push 核准。
