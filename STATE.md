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
  - id: workstream-image-pigeon-diagnostic-logging-2026-08-04
    title: 診斷記錄改善
    status: partial
    affected_projects:
      - image-pigeon
    affected_areas:
      - logging
      - fastapi
      - session
      - project-persistence
      - pywebview
      - output
      - frontend-error-boundary
    plans:
      - id: plan-image-pigeon-diagnostic-logging-2026-08-04
        path: docs/plans/2026-08-04-diagnostic-logging.md
        role: implementation
        execution_status: completed
        current_checkpoints:
          - plan_sanity_review_passed
          - c0_to_c5_implemented
          - macos_packaged_app_launch_verified
          - closed_with_verification_gaps
    blockers:
      - 完整 Python suite 有既有 DEBUG_MODE URL 預期失敗
      - 全量前端測試有 FocusImageCard 格式 regex 失敗
      - Windows pywebview／打包版目標環境未驗收
    approval_gates:
      source_write: approved
      automated_test: approved
      offline_smoke: approved
      frontend_bridge: approved
      pywebview_uat: approved
      packaged_app_uat: approved
      commit: approved
      push: closed
    next_action: 已收束為 partial；若要取得完整 PASS，需在獨立切片處理既有測試失敗並於 Windows 目標環境驗收
    shared_paths:
      - core/handle_log.py
      - main.py
      - core/app/
      - core/save_docx.py
      - core/save_images.py
      - core/tests/test_api.py
      - src/services/apiClient.ts
      - src/utils/handleError.ts
      - src/features/Upload/ReadJson.tsx
      - src/globak.d.ts
      - src/services/diagnosticLog.ts
      - tests/diagnosticLogging.test.ts
    conflicts_with: []
recent_results:
  - id: result-image-pigeon-diagnostic-logging-2026-08-04
    path: docs/result/2026-08-04-diagnostic-logging-result.md
    status: partial
    completed_at: 2026-08-04
    note: C0–C5、聚焦測試、lint、build、打包與 macOS 啟動驗收完成；完整 suite 既有失敗與 Windows 驗收缺口如實保留
  - id: result-image-pigeon-sort-mode-thumbnail-scale-2026-08-04
    path: docs/result/2026-08-04-sort-mode-thumbnail-scale-result.md
    status: completed
    completed_at: 2026-08-04
    note: source、27 項前端測試、lint、build、diff check 與獨立聚焦複審 PASS；browser UAT 未執行
  - id: result-image-pigeon-manual-layout-preference-2026-08-04
    path: docs/result/2026-08-04-manual-layout-preference-result.md
    status: partial
    completed_at: 2026-08-04
    note: 原始碼與自動驗證完成；browser、pywebview 與本機檔案 side effect 驗收未執行
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

「診斷記錄改善」已收束為 partial：C0–C5、聚焦測試、lint、build、macOS 打包版啟動驗收均完成；完整 suite 的既有失敗與 Windows 實機驗收缺口已記錄於 result。使用者已核准 commit；push 維持關閉。

## Recent results

- `docs/result/2026-08-04-sort-mode-thumbnail-scale-result.md`
- `docs/result/2026-08-04-diagnostic-logging-result.md`
- `docs/result/2026-08-04-ignore-update-version-result.md`
- `docs/result/2026-08-04-file-dialog-home-fallback-result.md`
- `docs/result/2026-08-04-manual-layout-preference-result.md`
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
