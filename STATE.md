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
  - id: result-image-pigeon-wheel-sensitivity-2026-08-25
    path: docs/result/2026-08-25-wheel-sensitivity-result.md
    status: completed
    completed_at: 2026-08-25
    note: 滾輪累積門檻由 90 降至 45；聚焦 7/7、lint、build 與差異護欄通過，完整前端測試的兩項範圍外失敗如實保留，實際操作由使用者人工驗收完成（user-attested），commit／push／部署未核准
  - id: result-image-pigeon-retire-python-runtime-2026-08-25
    path: docs/result/2026-08-25-retire-python-runtime-result.md
    status: completed_with_known_test_gap
    completed_at: 2026-08-25
    note: Python 原始碼、測試、套件環境與 PyInstaller 打包資產已退役；聚焦 12/12、lint、build、static、差異護欄與最後聚焦複審 PASS，完整前端 suite 的既有列印文案失敗維持 97/98，Windows／Word UAT 未執行，commit／push／部署未核准
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

本專案已切換至 Project-State v1；`STATE.md` 是目前工作線與下一步的唯一入口。3.0 純前端版本已合併至 `dev` 與 `main`，並作為後續主要更新基線；現行唯一專案交換格式為單檔 `.ipigeon` archive，自動更新與舊格式相容路徑均已退役。Python 執行階段、測試、套件環境及 PyInstaller 打包資產也已依 `docs/plans/2026-08-25-retire-python-runtime.md` 從目前候選移除，現行架構與 ADR-0002 以 React + Vite 純前端為權威。退役聚焦測試、lint、build 與靜態產物探針通過；完整前端測試為 97/98，唯一失敗是既有列印文案契約。目標 Windows 11／Microsoft Edge／Microsoft 365 Word UAT 仍未執行，不得擴張為相容性 PASS；本輪 commit、push 與正式部署均未核准。

Project-State v1 遷移與 README 低風險閉環試行已通過獨立審查並完成 lifecycle closure。焦點式編輯器以滾輪切換圖片前保存備註的修正已通過回歸測試、lint、build 與獨立程式審查，並完成生命週期閉環。「外部圖片拖放導入」已完成來源改動、15 項前端回歸、lint、build、scope guard、focused rereview `PASS` 與 Vite browser UAT；macOS pywebview UAT 已由使用者人工驗收成功（user-attested），工作線已收束。檔案選擇器已改為由應用程式提供可靠的初始資料夾，避免 Windows 缺少 `HOMEPATH` 時由 pywebview 拋出 `KeyError`；source 與自動驗證已完成，Windows GUI 實機確認留待問題環境更新。新版本提示曾加入以遠端更新日期保存的忽略機制，該提示、遠端 API 與儲存狀態現已隨純前端版本決策退場；README 彈窗版本化保存仍未實作。Git 歷史中的舊計畫標籤與既有 `.planning/` 草稿均未被匯入為目前工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | `STATE.md` | `project-state-v1` | 單一專案，沒有 child STATE |

## 目前工作與阻擋

目前沒有 active workstream。圖片預覽滾輪累積門檻已由 90 降至 45，聚焦滾輪測試 7/7、lint、build 與差異檢查通過；完整前端測試為 97/99，兩項範圍外失敗是既有列印文案契約及版本值 3.0.1 與舊測試期待 3.0.0 不一致。實際操作已由使用者人工驗收完成（user-attested），本工作線已收束；commit、push 與部署均未核准。

## Recent results

- `docs/result/2026-08-25-wheel-sensitivity-result.md`
- `docs/result/2026-08-25-retire-python-runtime-result.md`
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

- Python 執行階段退役計畫：`docs/plans/2026-08-25-retire-python-runtime.md`
- Python 執行階段退役結果：`docs/result/2026-08-25-retire-python-runtime-result.md`
- 舊專案格式退場計畫：`docs/plans/2026-08-25-retire-legacy-project-formats.md`
- 純前端版本計畫：`docs/plans/2026-08-18-pure-frontend-version.md`
- Agent 操作與安全規則：`AGENTS.md`
- 文件治理：`docs/governance.md`
- 現行架構：`docs/architecture/current-architecture.md`
- 已接受決策：`docs/adr/`
- 正式計畫：`docs/plans/`
- 執行證據：`docs/result/`
- 非正式草稿：`.planning/`，不得直接執行
