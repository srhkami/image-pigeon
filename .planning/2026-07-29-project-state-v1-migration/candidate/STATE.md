---
type: state
schema_version: 1
canonical: false
governance_mode: transitioning
path_semantics: repository-root-relative
scope:
  workspace: image-pigeon
  type: single-project
  primary_project: image-pigeon
  affected_projects:
    - image-pigeon
parent_state: null
workstreams:
  - id: project-state-v1-migration-2026-07-29
    title: 將 image-pigeon 遷移至 Project-State v1
    status: in_progress
    affected_projects:
      - image-pigeon
    affected_areas:
      - governance
      - documentation
      - onboarding
    plans:
      - id: planning-image-pigeon-project-state-v1-migration-2026-07-29
        path: .planning/2026-07-29-project-state-v1-migration/task_plan.md
        role: implementation
        lifecycle_status: draft
        execution_status: in_progress
        current_checkpoints:
          - inventory_complete
          - candidate_building
    results: []
    blockers: []
    approval_gates:
      - id: governance-doc-writes
        status: approved
      - id: readme-trial
        status: approved
      - id: remove-stale-active-plan
        status: approved
      - id: commit-push
        status: closed
    next_action: 完成候選文件機械驗證後進行原子 cutover
    coordination:
      shared_paths:
        - AGENTS.md
        - STATE.md
        - README.md
        - docs/
        - .planning/
      conflicts_with: []
      child_states: []
recent_results: []
last_reconciled: 2026-07-29
---

# image-pigeon 候選狀態

## Current summary

此檔是非 canonical 遷移候選。舊 authority 在正式 cutover 前仍有效；不得從本候選直接執行未核准工作。

目前只納入 Project-State v1 治理遷移，不把 Git 歷史中的 `active` 或 `proposed` 標籤重新當成現在工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | 候選檔本身 | `transitioning` | 單一專案，沒有 child STATE |

## Blockers

- 無；正式 cutover 仍需候選 closure 驗證。
