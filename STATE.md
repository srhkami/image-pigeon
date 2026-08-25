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
  - id: workstream-image-pigeon-pure-frontend-version-2026-08-18
    title: 純前端版本
    status: waiting_approval
    affected_projects:
      - image-pigeon
    affected_areas:
      - frontend-runtime
      - browser-image-processing
      - project-persistence
      - output
      - static-hosting
      - privacy-boundary
    plans:
      - id: plan-image-pigeon-pure-frontend-version-2026-08-18
        path: docs/plans/2026-08-18-pure-frontend-version.md
        role: implementation
        execution_status: partial
        current_checkpoints:
          - branch_created
          - plan_sanity_review_passed
          - c0_c3_completed
          - c0_c3_automated_verification_passed
          - c0_c3_local_browser_smoke_completed
          - c0_c3_focused_rereview_passed
          - c4_technical_verification_completed
          - c4_focused_rereview_passed
          - c4_source_completed_edge_uat_deferred_c10
          - c5_automated_verification_passed
          - c5_focused_rereview_passed
          - c5_source_completed_browser_uat_deferred_c10
          - c6_automated_verification_passed
          - c6_focused_review_passed
          - c6_source_completed_edge_uat_deferred_c10
          - c7_docx_dependency_installed
          - c7_source_candidate_automated_verification_passed
          - c7_source_candidate_first_review_request_changes
          - c7_source_candidate_remediation_completed
          - c7_source_candidate_rereview_passed
          - c7_word_compatibility_uat_macos_preflight_completed
          - c7_word_compatibility_uat_target_windows_deferred_by_user
          - c8_source_and_provisional_word_connection_approved
          - c8_automated_verification_passed
          - c8_first_integration_review_request_changes
          - c8_response_boundary_remediation_completed
          - c8_focused_rereview_passed
          - c8_source_completed_target_windows_uat_deferred_c10
          - c9_source_and_bounded_browser_network_verification_approved
          - c9_automated_and_bounded_browser_verification_passed
          - c9_first_integration_review_request_changes
          - c9_first_review_request_changes_remediated
          - c9_first_focused_rereview_request_changes
          - c9_first_focused_rereview_request_changes_remediated
          - c9_second_focused_rereview_request_changes
          - c9_second_focused_rereview_request_changes_remediated
          - c9_final_focused_rereview_passed
          - c9_source_build_checkpoint_completed
          - c10_approved
          - c10_automated_regression_passed
          - c10_target_windows_uat_skipped_by_user_no_pass
          - c10_completed_partial
      - id: plan-image-pigeon-retire-legacy-project-formats-2026-08-25
        path: docs/plans/2026-08-25-retire-legacy-project-formats.md
        role: implementation
        execution_status: completed
        result: docs/result/2026-08-25-retire-legacy-project-formats-result.md
        current_checkpoints:
          - baseline_committed_0a18b73
          - source_and_docs_approved
          - plan_authored
          - legacy_project_formats_removed
          - automated_verification_passed
          - first_review_request_changes
          - review_finding_remediated
          - second_review_request_changes
          - canonical_format_docs_reconciled
          - focused_re_review_passed
          - legacy_project_format_retirement_completed
          - version_3_0_0_precommit_review_request_changes_deleg_493eabc3
          - version_3_0_0_focused_re_review_passed_deleg_0e7228f1
          - version_3_0_0_release_commit_completed_440bdcd
          - version_3_0_0_image_editor_bugfixes_completed
          - version_3_0_0_automatic_update_removed
    blockers:
      - 目標 Windows 11／Edge／Microsoft 365 Word 五種版型與資源 UAT 依使用者決定先忽略，未執行且不得宣稱相容性 PASS
      - 機關 Windows Microsoft Edge 的瀏覽器政策與 Canvas／下載能力尚未實機驗證
    approval_gates:
      planning_docs: approved
      branch_create: completed
      source_write: approved_consumed_remove_automatic_update
      dependency_install: approved_consumed_c7_docx
      automated_test: completed_remove_update_scoped_full_95_of_96_unrelated_print_copy_failure
      local_browser_smoke: completed_c0_c4_c9_bounded
      browser_uat: closed_c10_target_windows_skipped_by_user_no_pass
      word_compatibility_uat: closed_c10_target_windows_skipped_by_user_no_pass
      deployment: closed
      commit: completed_version_3_0_0_440bdcd
      push: closed
    next_action: 等待使用者決定是否採用純前端候選；push、merge、部署或目標 Windows UAT 仍需各自核准
    shared_paths:
      - src/App.tsx
      - src/types/project.ts
      - src/state/
      - src/services/
      - src/features/Upload/
      - src/features/Output/
      - src/features/PrintPreview/
      - package.json
      - vite.config.ts
      - README.md
      - CHANGELOG.md
      - src/utils/log.ts
      - tests/versionMetadata.test.ts
    conflicts_with: []
recent_results:
  - id: result-image-pigeon-remove-automatic-update-2026-08-25
    path: docs/result/2026-08-25-remove-automatic-update-result.md
    status: completed
    completed_at: 2026-08-25
    note: 自動更新提示、版本 API、忽略版本狀態與外部網路例外已退場；聚焦 10/10、lint、build、static、瀏覽器同源資源煙霧驗證及差異護欄通過，完整 suite 的 1 項範圍外列印文案失敗如實保留
  - id: result-image-pigeon-image-editor-bugfixes-2026-08-25
    path: docs/result/2026-08-25-image-editor-bugfixes-result.md
    status: completed
    completed_at: 2026-08-25
    note: 刪除目前圖片改為選擇鄰近圖片，六張後接上下的反向混合版型位置已修正；19 項聚焦回歸、lint、build 與 diff check 通過，完整 suite 的 1 項範圍外文案契約失敗如實保留
  - id: result-image-pigeon-retire-legacy-project-formats-2026-08-25
    path: docs/result/2026-08-25-retire-legacy-project-formats-result.md
    status: completed
    completed_at: 2026-08-25
    note: 獨立 JSON 與 `.ipigeon/` 專案資料夾相容已退場；103 項前端測試、lint、build、static、差異護欄與最終聚焦複審 PASS，未執行 Windows／Word UAT
  - id: result-image-pigeon-pure-frontend-version-2026-08-18
    path: docs/result/2026-08-18-pure-frontend-version-result.md
    status: partial
    completed_at: 2026-08-24
    note: C0–C9 原始碼 checkpoint 與 C10 自動回歸已完成；使用者決定先忽略目標 Windows Edge／Microsoft 365 Word UAT，故結果維持 partial 且無相容性 PASS
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
last_reconciled: 2026-08-25
---

# image-pigeon 專案狀態

## 目前摘要

本專案已切換至 Project-State v1。`STATE.md` 是目前工作線與下一步的唯一入口；架構、決策、治理、計畫與結果分別由 scoped `docs/` 保存。純前端版本候選已於 `feat/pure-frontend` 提交基線 `0a18b73`；提交前 109/109 前端測試、lint、TypeScript／Vite production build、正式產物探針、差異護欄與聚焦複審均通過。獨立 JSON 與 `.ipigeon/` 專案資料夾相容已依 `docs/plans/2026-08-25-retire-legacy-project-formats.md` 完成退場，退場後 103/103 前端測試、lint、build、static、差異護欄及最終聚焦複審通過，目前唯一候選格式為單檔 `.ipigeon` archive。3.0.0 版本 metadata、內建與根目錄更新日誌、README 已完成，最新 104/104 前端測試、lint、build、static 與差異護欄通過；提交前第一輪複審 finding 已修正，聚焦複審 `deleg_0e7228f1` 通過。3.0.0 版本交付已建立本機提交 `440bdcd`。其後發現的圖片刪除焦點與「六張 → 上下」混合排版問題已完成小範圍修正；自動更新提示、版本 API 與相關外部網路例外也已完成退場，證據分別記錄於 `docs/result/2026-08-25-image-editor-bugfixes-result.md` 與 `docs/result/2026-08-25-remove-automatic-update-result.md`。目標 Windows 11／Microsoft Edge／Microsoft 365 Word UAT 仍未執行，不得擴張為相容性 PASS；正式部署、push、merge 與純前端候選採用尚未核准。

Project-State v1 遷移與 README 低風險閉環試行已通過獨立審查並完成 lifecycle closure。焦點式編輯器以滾輪切換圖片前保存備註的修正已通過回歸測試、lint、build 與獨立程式審查，並完成生命週期閉環。「外部圖片拖放導入」已完成來源改動、15 項前端回歸、lint、build、scope guard、focused rereview `PASS` 與 Vite browser UAT；macOS pywebview UAT 已由使用者人工驗收成功（user-attested），工作線已收束。檔案選擇器已改為由應用程式提供可靠的初始資料夾，避免 Windows 缺少 `HOMEPATH` 時由 pywebview 拋出 `KeyError`；source 與自動驗證已完成，Windows GUI 實機確認留待問題環境更新。新版本提示曾加入以遠端更新日期保存的忽略機制，該提示、遠端 API 與儲存狀態現已隨純前端版本決策退場；README 彈窗版本化保存仍未實作。Git 歷史中的舊計畫標籤與既有 `.planning/` 草稿均未被匯入為目前工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | `STATE.md` | `project-state-v1` | 單一專案，沒有 child STATE |

## 目前工作與阻擋

「純前端版本」目前為 `waiting_approval`：候選基線已提交為 `0a18b73`，3.0.0 版本交付已提交為 `440bdcd`；舊格式退場已完成並由 `docs/result/2026-08-25-retire-legacy-project-formats-result.md` 記錄，候選只保留單一 `.ipigeon` archive。3.0.0 更新日誌、README、內建版本 metadata 與回歸測試已完成；自動更新提示與版本 API 已退場，正式前端不再發出背景外部 API 請求。第一輪提交前複審 finding 已修正，聚焦複審 `deleg_0e7228f1` 通過。目標 Windows 11／最新版 Microsoft Edge／Microsoft 365 Word UAT 仍未執行，不宣稱 Windows／Word 相容性 PASS。push、merge、候選採用與正式部署仍各自關閉；此工作線仍保留 Python 原始碼作回退與輸出比對，圖片與專案不得上傳。

## Recent results

- `docs/result/2026-08-25-remove-automatic-update-result.md`
- `docs/result/2026-08-25-image-editor-bugfixes-result.md`
- `docs/result/2026-08-25-retire-legacy-project-formats-result.md`
- `docs/result/2026-08-18-pure-frontend-version-result.md`
- `docs/result/2026-08-04-sort-mode-thumbnail-scale-result.md`
- `docs/result/2026-08-04-diagnostic-logging-result.md`
- `docs/result/2026-08-04-ignore-update-version-result.md`
- `docs/result/2026-08-04-file-dialog-home-fallback-result.md`
- `docs/result/2026-08-04-manual-layout-preference-result.md`
- `docs/result/2026-07-29-wheel-remark-save-result.md`
- `docs/result/2026-07-29-project-state-v1-migration-result.md`
- `docs/result/2026-07-29-project-state-v1-trial-result.md`

## 導航

- 舊專案格式退場計畫：`docs/plans/2026-08-25-retire-legacy-project-formats.md`
- 純前端版本計畫：`docs/plans/2026-08-18-pure-frontend-version.md`
- Agent 操作與安全規則：`AGENTS.md`
- 文件治理：`docs/governance.md`
- 現行架構：`docs/architecture/current-architecture.md`
- 已接受決策：`docs/adr/`
- 正式計畫：`docs/plans/`
- 執行證據：`docs/result/`
- 非正式草稿：`.planning/`，不得直接執行
