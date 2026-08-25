---
type: result
id: result-image-pigeon-retire-python-runtime-2026-08-25
status: completed_with_known_test_gap
canonical: true
scope: image-pigeon
created_at: 2026-08-25
implements: docs/plans/2026-08-25-retire-python-runtime.md
execution:
  status: completed_with_known_test_gap
  completed_checkpoints:
    - r1_retirement_contract_red_green
    - r2_python_runtime_dependencies_and_packaging_removed
    - r3_architecture_and_governance_reconciled
    - r4_automated_verification_completed
  current_checkpoint: python_runtime_retirement_completed
review:
  status: passed
  first_verdict: request_changes
  first_delegation: deleg_3c5c6849
  second_verdict: pass_superseded_by_post_review_hardening
  second_delegation: deleg_9041d3da
  third_verdict: request_changes
  third_delegation: deleg_202ba017
  final_verdict: pass
  final_delegation: deleg_26cd4689
  remediation_status: completed
approval_gates:
  source_write: approved_consumed
  deletion: approved_consumed
  automated_test: approved_consumed
  deployment: closed
  commit: closed
  push: closed
---

# Python 執行階段退役結果

## 結論

3.0 純前端版本已作為 `dev` 與 `main` 的共同更新基線。本輪已依退役計畫移除工作樹中的 Python 原始碼、Python 測試、Python 套件環境、PyInstaller 打包設定及只供該打包流程使用的圖示，並建立可執行退役契約。現行架構與 accepted ADR 已改以 React + Vite 純前端執行階段為權威。

目前候選已通過最後聚焦複審。commit、push 與部署均未執行。

## 實際變更

### Git 候選刪除

共 30 個既有追蹤檔案標為刪除：

- 26 個 Python 原始碼／測試：`main.py` 與 `core/` 全部內容。
- Python 套件定義與鎖定檔：`pyproject.toml`、`uv.lock`。
- 桌面打包：`main.spec`、`Logo.ico`。

因 commit gate 關閉，這些路徑目前是未暫存的 working-tree deletion；只有後續另獲核准提交後，Git tree 才會正式停止追蹤。

### 本機清理

已清除：

- `.venv/`
- `__pycache__/`
- `.pytest_cache/`
- `.mypy_cache/`
- `.ruff_cache/`

### 防回歸契約

新增 `src/services/pythonRuntimeRetirement.test.ts`：

- 斷言 Python runtime、依賴、lock、PyInstaller spec、`core/`、`.venv/` 與舊 `.ico` 不存在，並遞迴確認儲存庫實體樹沒有 `.py`／`.pyi`、PyInstaller spec 或 Python 套件 manifest／lock／requirements。
- 斷言 `package.json` scripts 不呼叫 Python、uv、pytest、PyInstaller 或 pywebview。
- 已先取得 `main.py must be retired` 的 RED，再於刪除後取得 2/2 GREEN。

### 設定與治理

- `.gitignore`：移除 Python cache 與舊 `web_cache` 規則。
- `vite.config.ts`：移除舊 `web_cache` watcher exclusion。
- `AGENTS.md`：移除 Python/FastAPI 執行規則，驗證主線改為前端測試。
- `docs/adr/0001-project-format-and-runtime-boundaries.md`：標示為 `superseded`。
- `docs/adr/0002-pure-frontend-runtime-boundary.md`：建立現行純前端 accepted decision。
- `docs/architecture/current-architecture.md`：改為瀏覽器內圖片、ProjectV2、`.ipigeon`、ZIP、DOCX 與列印架構。
- `docs/plans/2026-08-18-pure-frontend-version.md`：計畫生命週期標為 completed，保留 execution partial 與目標 Windows／Word UAT 未執行。

歷史 plan/result、`.planning/` 及禁止 pywebview／HTTP runtime 重新進入正式前端的負向探針均保留。

## 驗證證據

### 聚焦退役與純前端邊界

```text
node --test src/services/pythonRuntimeRetirement.test.ts tests/browserRuntimeCutover.test.ts tests/staticDeploymentContract.test.ts
12 tests, 12 passed, exit 0
```

### 完整前端測試

```text
pnpm run test:frontend
98 tests, 97 passed, 1 failed, exit 1
```

唯一失敗仍是本輪開始前已存在的列印文案契約：

- `src/features/PrintPreview/printPreview.test.ts`
- 測試要求「可透過系統列印對話框另存 PDF」；目前 UI 文案為「不用匯出 WORD，直接透過瀏覽器預覽並列印」。

本輪沒有修改列印 UI 或該測試；此失敗不代表 Python 退役路徑回歸，但完整 suite 不得宣稱 PASS。

### 靜態檢查與建置

```text
pnpm run lint
exit 0

pnpm run build
exit 0；299 modules transformed

pnpm run verify:static
exit 0；files 8；verifiedReferences 6；forbiddenHits 0
```

Vite 另回報既有單一 JavaScript chunk 超過 500 kB 的非阻擋警告；本輪未調整 code splitting。

### 刪除與工作樹護欄

- 退役 allowlist：30/30 路徑均標為刪除且工作樹中不存在。
- 儲存庫目前實體檔案搜尋：`*.py` 為 0。
- 本機 `.venv` 與 Python cache 路徑均不存在。
- `git diff --check`：exit 0。
- `git diff --cached --check`：exit 0。
- 使用者既有 staged `CHANGELOG.md` 仍精確保持 `D  CHANGELOG.md`；本輪未修改、還原、取消暫存或吸收。最終複審過程曾檢視 staged diff 以確認基線，未造成內容或 index 變更。

## 證據邊界

- 未執行 Windows 11／Microsoft Edge／Microsoft 365 Word 完整 UAT，不宣稱該環境相容性 PASS。
- 未執行瀏覽器人工驗收；本輪沒有 UI 行為變更。
- 未 commit、push、部署或操作正式環境。
- 完整前端 suite 保留 97/98 與一項既有範圍外文案失敗，不硬化成全綠。

## 獨立複審

第一輪複審 `deleg_3c5c6849` 判定 `REQUEST_CHANGES`：

1. 初版退役契約只檢查已知路徑，未阻止其他位置重新加入 `.py`／`.pyi`。
2. `STATE.md` 的 workstream commit gate 沿用 3.0.0 既有提交狀態，未清楚區分本輪退役 commit gate 關閉。

已修正：退役契約現在遞迴檢查儲存庫實體樹；workstream gate 明記本輪 commit 關閉，同時保留既有 3.0.0 提交事實。等待修正後快照的聚焦複審。

第二輪複審 `deleg_9041d3da` 對上述兩項修正判定 `PASS`，無新的 Critical／Important 問題。其後又將契約擴充為拒絕任意位置的 PyInstaller spec、Python manifest／lock／requirements，並校正 `STATE.md` 現況摘要；因此第二輪 PASS 不直接套用到最後快照，目前等待最終聚焦複審。

第三輪複審 `deleg_202ba017` 判定 `REQUEST_CHANGES`：current architecture 雖已描述 3.0 純前端與現行不使用 Python，但未像 STATE／ADR-0002 一樣明確宣告已合併 `dev`、`main` 及 Python 原始碼、測試、環境與打包資產正式退役。已補齊定位段，等待修正後最終聚焦複審。

最後聚焦複審 `deleg_26cd4689` 判定 `PASS`：第三輪 finding 已收斂，plan/result/STATE review ledger 與證據邊界一致，未發現新的 Critical／Important 問題。
