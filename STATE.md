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
  - id: workstream-image-annotation-2026-10-30
    title: 圖片標記與局部放大（方案 B）
    status: waiting_approval
    plan: docs/plans/2026-10-30-image-annotation.md
    result: docs/result/2026-10-30-image-annotation-result.md
    affected_projects:
      - image-pigeon
    affected_areas:
      - 編輯模式側邊欄介面
      - 圖片標記與局部放大、專案保存及輸出
    current_checkpoint: annotation_style_source_verified_waiting_manual
    blocker: null
    approval_gates:
      planning_docs: approved_2026-10-30
      ui_source_write: approved_consumed_2026-10-30
      ui_automated_test: approved_consumed_2026-10-30
      local_browser_runtime: closed
      annotation_source_write: approved_consumed_2026-10-31
      annotation_automated_test: approved_consumed_2026-10-31
      magnification_source_write: approved_consumed_2026-11-02
      magnification_automated_test: approved_consumed_2026-11-02
      project_format_change: approved_consumed_magnification_version_3_extension_2026-11-02
      annotation_style_source_write: approved_consumed_2026-11-02
      annotation_style_automated_test: approved_consumed_2026-11-02
      annotation_style_project_format: approved_consumed_version_4_2026-11-02
      electron_package_build: closed
      deployment: closed
      commit: closed
      push: closed
    shared_paths:
      - STATE.md
      - src/layout/Sidebar.tsx
    conflicts_with: []
    next_action: 本輪來源、102項聚焦回歸及獨立審查已通過；使用者確認正式橫向面板、粗細與色票、取消／刪除、保存重開及各輸出樣式後回報，再校正人工驗收；Agent正式應用／瀏覽器、打包、部署與Git寫入仍關閉
  - id: workstream-electron-update-check-2026-09-30
    title: EXE 更新偵測與首頁檢查新版
    status: waiting_approval
    plan: docs/plans/2026-09-30-electron-update-check.md
    result: docs/result/2026-09-30-electron-update-check-result.md
    current_checkpoint: package_330_verified_windows_uat_pending
    blocker: null
    approval_gates:
      planning_docs: approved_2026-09-30
      source_write: approved_2026-09-30
      automated_test: approved_2026-09-30
      live_api: closed
      app_runtime: closed
      package_build: approved_consumed_2026-09-30
      repack_package_build: approved_consumed_2026-11-02
      package_metadata_sync: approved_consumed_2026-11-02
      deployment: closed
      commit: closed
      push: closed
    shared_paths:
      - STATE.md
      - src/App.tsx
      - docs/architecture/current-architecture.md
    conflicts_with: []
    next_action: 3.3.0 Windows x64免安裝EXE已產出於release/3.3.0，13項封裝／更新隔離測試、lint、build、靜態及產物檢查通過，舊EXE保留；Windows實機驗收由使用者自行安排，Agent不啟動應用／正式API，不部署、提交或推送

  - id: workstream-electron-portable-mvp-2026-08-28
    title: Electron Windows x64 免安裝候選
    status: partial
    plan: docs/plans/2026-08-28-electron-portable-mvp.md
    current_checkpoint: windows_manual_uat_pending
    blocker: Windows GUI、Word、列印、SmartScreen 與防毒仍需後續人工驗收
    next_action: 使用者在 Windows x64 完成斷網與功能人工驗收後回報結果
recent_results:
  - id: result-image-pigeon-four-image-layout-2026-09-30
    path: docs/result/2026-09-30-four-image-layout-result.md
    status: partial
    completed_at: 2026-11-02
    closure_status: closed_with_validation_gaps
    note: 使用者確認上下縮圖及末頁空格修正已解決並要求收束；計畫 completed，直接回歸48/48與lint／build證據保留，完整列印13/14的既有文案斷言及Word／列印等未逐項回報矩陣留作驗證缺口，不再作本計畫強制待辦；其他工作線、Agent執行階段、打包、部署及Git閘門不變
  - id: result-image-pigeon-electron-portable-mvp-2026-08-28
    path: docs/result/2026-08-28-electron-portable-mvp-result.md
    status: partial
    completed_at: 2026-08-28
    note: Electron 最小安全殼與 Windows x64 portable 候選已完成；Electron 契約 6/6、範圍內前端測試 110/110、lint、build、static、package、產物探針及獨立複審 PASS；完整前端 114/116 的兩項既有失敗保留，Windows 人工 UAT 待使用者執行，commit／push／部署未核准
  - id: result-image-pigeon-project-resource-limits-2026-08-26
    path: docs/result/2026-08-26-project-resource-limits-result.md
    status: completed_with_known_test_gap
    completed_at: 2026-08-26
    note: 單一專案圖片上限調整為 1000 張，資產儲存、專案封存與圖片輸出的總量上限調整為 200 MiB；聚焦 4/4、lint、build 與差異檢查通過，完整前端測試 108/110 的兩項既有範圍外失敗保留，commit／push／部署未核准
  - id: result-image-pigeon-batch-image-editing-2026-08-26
    path: docs/result/2026-08-26-batch-image-editing-result.md
    status: completed_with_known_test_gap
    completed_at: 2026-08-26
    note: 整理模式批次選取、旋轉、排版與確認刪除完成；卡片定位與頂端防遮擋已調整，聚焦 18/18、lint、build、static、差異護欄與最後聚焦複審 PASS；完整前端 108/110 的列印文案與版本契約既有失敗保留；C5 由使用者人工驗收完成，Agent 未操作瀏覽器，commit／push／部署未核准
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
last_reconciled: 2026-11-02
---

# image-pigeon 專案狀態

## 目前摘要

本專案已切換至 Project-State v1；`STATE.md` 是目前工作線與下一步的唯一入口。3.0 純前端版本已合併至 `dev` 與 `main`，並作為後續主要更新基線；現行唯一專案交換格式為單檔 `.ipigeon` archive，舊格式與 Python／PyInstaller 執行階段均已退役。網頁版維持 ADR-0002 的零背景請求；Electron Windows x64 免安裝候選已完成原始碼及初版封裝，Windows 人工驗收仍待使用者執行。2026-09-30 新增桌面專用新版偵測，依 `docs/adr/0003-electron-update-check-boundary.md` 及獨立計畫實作，不恢復網頁背景 API 或舊 Python 路徑。既有純前端 build 與 HTTPS 靜態部署保持不變；2026-11-02 依使用者要求完成3.3.0本機EXE打包及必要封裝版本同步，兩項核准已消耗；正式 API、應用啟動、部署、提交及推送仍關閉。

Project-State v1 遷移與 README 低風險閉環試行已通過獨立審查並完成 lifecycle closure。焦點式編輯器以滾輪切換圖片前保存備註的修正已通過回歸測試、lint、build 與獨立程式審查，並完成生命週期閉環。「外部圖片拖放導入」已完成來源改動、15 項前端回歸、lint、build、scope guard、focused rereview `PASS` 與 Vite browser UAT；macOS pywebview UAT 已由使用者人工驗收成功（user-attested），工作線已收束。檔案選擇器已改為由應用程式提供可靠的初始資料夾，避免 Windows 缺少 `HOMEPATH` 時由 pywebview 拋出 `KeyError`；source 與自動驗證已完成，Windows GUI 實機確認留待問題環境更新。新版本提示與忽略機制曾隨純前端版本退場；現在只依新的桌面更新計畫恢復，不回復網頁 API 查詢。README 彈窗版本化保存仍未實作。Git 歷史中的舊計畫標籤與既有 `.planning/` 草稿均未被匯入為目前工作。

## Scope map

| Scope | State | Governance mode | Notes |
|---|---|---|---|
| `image-pigeon` | `STATE.md` | `project-state-v1` | 單一專案，沒有 child STATE |

## 目前工作與阻擋

圖片標記方案 B 前兩階段已人工驗收；第三階段來源、92 項聚焦回歸及獨立審查通過，使用者其後回報「目前功能良好」，不補寫未提供的逐項輸出驗收。本輪第 10 節橫向懸浮面板、五段粗細、快速色票與指定操作提示已完成來源整合，102/102 聚焦回歸、品質檢查及 v4 舊讀取器拒讀驗證通過；獨立聚焦審查 `deleg_707a10f8` 為 PASS，主代理核對 24 份來源／測試及架構未漂移，目前等待使用者確認本輪樣式。既有列印文案失敗保留；Agent 正式應用／瀏覽器仍未核准，獨立 DEMO 的瀏覽器證據不等同正式實測。其他工作線及各自驗收保持原狀。

一頁四張排版計畫於 2026-11-02 依使用者「確認問題已解決，可以收束當前計畫」完成收束。純上下縮圖與末頁空格修正已由使用者人工驗收通過；直接回歸 48/48、lint／build 及前輪 Word 獨立審查證據保留。計畫 completed、結果 partial，分類為 closed_with_validation_gaps；Word／列印等未逐項回報矩陣與既有列印文案斷言失敗只保留驗證邊界，不再作本計畫強制待辦。結果見 `docs/result/2026-09-30-four-image-layout-result.md`；其他工作線與未核准副作用保持原狀。

Electron Windows x64 免安裝候選工作線已進入執行：使用者於 2026-08-28 核准依正式計畫開始實作，source、依賴安裝、自動驗證與本機打包閘門已消耗。第一輪計畫健全性審查為 `REQUEST_CHANGES`，必要修正已寫回，聚焦複審 `deleg_e1ea7501` 為 `PASS`。Windows 人工 UAT、commit、push 與部署仍未核准；現有 `src/utils/log.ts` 未暫存修改屬使用者既有工作，必須完整保護。

上一條整理模式批次圖片編輯計畫已完成：C0–C4 原始碼與自動驗證完成，C5 由使用者於 2026-08-26 人工瀏覽器驗收成功，最後文件聚焦複審 `deleg_d2568d4b` 為 `PASS`；Agent 未啟動或操作瀏覽器。完整前端測試 108/110 的兩項既有範圍外失敗保留，commit、push 與部署仍未核准。單一專案圖片上限已調整為 1000 張，資產儲存、專案封存與圖片輸出的總量上限已調整為 200 MiB。

上一條圖片預覽滾輪工作線已完成：累積門檻由 90 降至 45，聚焦滾輪測試 7/7、lint、build 與差異檢查通過；完整前端測試為 97/99，兩項範圍外失敗是既有列印文案契約及版本值 3.0.1 與舊測試期待 3.0.0 不一致。實際操作已由使用者人工驗收完成（user-attested）。

## Recent results

- `docs/result/2026-09-30-four-image-layout-result.md`
- `docs/result/2026-08-26-project-resource-limits-result.md`
- `docs/result/2026-08-26-batch-image-editing-result.md`
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

- 圖片標記與局部放大計畫（方案 B）：`docs/plans/2026-10-30-image-annotation.md`
- 一頁四張排版計畫：`docs/plans/2026-09-30-four-image-layout.md`
- Electron Windows x64 免安裝候選計畫：`docs/plans/2026-08-28-electron-portable-mvp.md`
- 整理模式批次圖片編輯計畫：`docs/plans/2026-08-26-batch-image-editing.md`
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
