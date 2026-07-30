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
workstreams:
  - id: workstream-external-image-drop-import
    title: 外部圖片拖放導入
    status: blocked_pywebview_uat_permissions
    affected_projects:
      - image-pigeon
    affected_areas:
      - frontend
      - upload
      - desktop-ux
    plans:
      - id: plan-image-pigeon-external-image-drop-import-2026-07-30
        path: docs/plans/2026-07-30-external-image-drop-import.md
        role: implementation
        execution_status: completed_browser_uat_pending_pywebview
        current_checkpoints:
          - macos-pywebview-uat-gated
    blockers:
      - macOS pywebview UAT 缺少本 agent session 的 Screen Recording 與 Accessibility 權限
    approval_gates:
      source_write: approved_by_user_2026-07-30
      automated_verification: approved_by_user_2026-07-30
      browser_uat: passed_2026-07-30
      pywebview_uat: blocked_missing_macos_ui_permissions
      commit: closed
      push: closed
    next_action: 使用者授予本 agent session 的 Screen Recording 與 Accessibility 權限後，重做 macOS pywebview UAT；使用既有 app process，不啟動第二個實例
    shared_paths:
      - src/App.tsx
      - src/layout/Sidebar.tsx
      - src/layout/AlertLoading.tsx
      - src/features/Upload/
      - src/features/Upload/ExternalImageDropOverlay.tsx
      - src/features/Upload/externalImageDrop.ts
      - tests/
    conflicts_with: []
recent_results:
  - id: result-image-pigeon-wheel-remark-save-2026-07-29
    path: docs/result/2026-07-29-wheel-remark-save-result.md
    status: completed
    completed_at: 2026-07-30
  - id: result-image-pigeon-external-image-drop-import-2026-07-30
    path: docs/result/2026-07-30-external-image-drop-import-result.md
    status: partial
    note: source／自動驗證與 focused rereview PASS；browser／pywebview UAT 尚待獨立核准
  - id: result-image-pigeon-project-state-v1-migration-2026-07-29
    path: docs/result/2026-07-29-project-state-v1-migration-result.md
    status: completed
    completed_at: 2026-07-29
  - id: result-image-pigeon-project-state-v1-readme-trial-2026-07-29
    path: docs/result/2026-07-29-project-state-v1-trial-result.md
    status: completed
    completed_at: 2026-07-29
last_reconciled: 2026-07-30
---

# image-pigeon 專案狀態

## 目前摘要

本專案已切換至 Project-State v1。`STATE.md` 是目前工作線與下一步的唯一入口；架構、決策、治理、計畫與結果分別由 scoped `docs/` 保存。

Project-State v1 遷移與 README 低風險閉環試行已通過獨立審查並完成 lifecycle closure。焦點式編輯器以滾輪切換圖片前保存備註的修正已通過回歸測試、lint、build 與獨立程式審查，並完成生命週期閉環。「外部圖片拖放導入」已完成來源改動、15 項前端回歸、lint、build、scope guard、focused rereview `PASS` 與 Vite browser UAT；macOS pywebview UAT 已獲核准但受本 agent session 缺少 Screen Recording／Accessibility 權限阻擋，result 保持 partial。Git 歷史中的舊計畫標籤與既有 `.planning/` 草稿均未被匯入為目前工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | `STATE.md` | `project-state-v1` | 單一專案，沒有 child STATE |

## 目前工作與阻擋

### 外部圖片拖放導入

- 正式計畫：`docs/plans/2026-07-30-external-image-drop-import.md`
- 狀態：`blocked_pywebview_uat_permissions`／`macos-pywebview-uat`
- 計畫審查：初次 `REQUEST_CHANGES` 已修正，focused rereview 為 `PASS`。
- 已開啟 gate：Checkpoint 0–2 的來源寫入與自動驗證已由使用者核准。
- 已完成 runtime gate：browser UAT；macOS pywebview UAT 已核准但因 macOS UI 權限不足而 BLOCKED；仍關閉：commit、push。
- 程式審查：首次 `REQUEST_CHANGES` 已修正，focused rereview 為 `PASS`；`AlertLoading` bridge guard 與 source-contract coverage 已補強，15 項前端回歸、lint、build、scope guard 均通過。
- 下一步：使用者授予本 agent session 的 Screen Recording 與 Accessibility 權限後，使用既有 app process 重做 macOS pywebview UAT。效果驗證不會被 source/build 證據取代。

## Recent results

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
