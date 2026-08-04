---
type: state
schema_version: 1
canonical: true
governance_mode: project-state-v1
path_semantics: repository-root-relative
scope:
  workspace: image-pigeon
  type: single-project
  primary_project: image-pigeon
  affected_projects:
    - image-pigeon
parent_state: null
workstreams: []
recent_results:
  - id: result-image-pigeon-ignore-update-version-2026-08-04
    path: docs/result/2026-08-04-ignore-update-version-result.md
    status: completed
    completed_at: 2026-08-04
    note: 前端回歸、lint、build 與 Vite browser UAT 通過
  - id: result-image-pigeon-file-dialog-home-fallback-2026-08-04
    path: docs/result/2026-08-04-file-dialog-home-fallback-result.md
    status: completed
    completed_at: 2026-08-04
    note: source 與自動驗證完成；Windows pywebview GUI 實機驗收留待問題環境更新確認
  - id: result-image-pigeon-wheel-remark-save-2026-07-29
    path: docs/result/2026-07-29-wheel-remark-save-result.md
    status: completed
    completed_at: 2026-07-30
  - id: result-image-pigeon-external-image-drop-import-2026-07-30
    path: docs/result/2026-07-30-external-image-drop-import-result.md
    status: completed
    completed_at: 2026-07-30
    note: source／自動驗證／focused rereview 與 browser UAT PASS；macOS pywebview UAT 為使用者人工驗收成功（user-attested）
  - id: result-image-pigeon-project-state-v1-migration-2026-07-29
    path: docs/result/2026-07-29-project-state-v1-migration-result.md
    status: completed
    completed_at: 2026-07-29
  - id: result-image-pigeon-project-state-v1-readme-trial-2026-07-29
    path: docs/result/2026-07-29-project-state-v1-trial-result.md
    status: completed
    completed_at: 2026-07-29
last_reconciled: 2026-08-04
---

# image-pigeon 專案狀態

## 目前摘要

本專案已切換至 Project-State v1。`STATE.md` 是目前工作線與下一步的唯一入口；架構、決策、治理、計畫與結果分別由 scoped `docs/` 保存。

Project-State v1 遷移與 README 低風險閉環試行已通過獨立審查並完成 lifecycle closure。焦點式編輯器以滾輪切換圖片前保存備註的修正已通過回歸測試、lint、build 與獨立程式審查，並完成生命週期閉環。「外部圖片拖放導入」已完成來源改動、15 項前端回歸、lint、build、scope guard、focused rereview `PASS` 與 Vite browser UAT；macOS pywebview UAT 已由使用者人工驗收成功（user-attested），工作線已收束。檔案選擇器已改為由應用程式提供可靠的初始資料夾，避免 Windows 缺少 `HOMEPATH` 時由 pywebview 拋出 `KeyError`；source 與自動驗證已完成，Windows GUI 實機確認留待問題環境更新。新版本提示已加入「忽略此版本」，以遠端更新日期的七碼民國日期保存於 LocalStorage；前端回歸、lint、build 與 Vite browser UAT 通過。Git 歷史中的舊計畫標籤與既有 `.planning/` 草稿均未被匯入為目前工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | `STATE.md` | `project-state-v1` | 單一專案，沒有 child STATE |

## 目前工作與阻擋

目前沒有 active workstream。

## Recent results

- `docs/result/2026-08-04-ignore-update-version-result.md`
- `docs/result/2026-08-04-file-dialog-home-fallback-result.md`
- `docs/result/2026-07-29-wheel-remark-save-result.md`
- `docs/result/2026-07-29-project-state-v1-migration-result.md`
- `docs/result/2026-07-29-project-state-v1-trial-result.md`

## 導航

- Agent 操作與安全規則：`AGENTS.md`
- 文件治理：`docs/governance.md`
- 現行架構：`docs/architecture/current-architecture.md`
- 已接受決策：`docs/adr/`
- 正式計畫：`docs/plans/`
- 執行證據：`docs/result/`
- 非正式草稿：`.planning/`，不得直接執行
