---
type: plan
id: plan-image-pigeon-retire-python-runtime-2026-08-25
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-25
branch:
  name: dev
  base: dev
  status: existing_merged_with_main
execution:
  status: completed_with_known_test_gap
  current_checkpoint: python_runtime_retirement_completed
result: docs/result/2026-08-25-retire-python-runtime-result.md
review:
  type: implementation
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
  planning_docs: approved_consumed
  source_write: approved_consumed
  deletion: approved_consumed
  automated_test: approved_consumed
  local_runtime: not_required
  deployment: closed
  commit: closed
  push: closed
related:
  - docs/plans/2026-08-18-pure-frontend-version.md
  - docs/result/2026-08-18-pure-frontend-version-result.md
  - docs/adr/0001-project-format-and-runtime-boundaries.md
---

# Python 執行階段退役計畫

## 1. 決策與背景

3.0 純前端版本已合併至 `dev` 與 `main`，兩個本機及遠端追蹤分支均指向 `dd90060`。正式前端已在瀏覽器完成圖片處理、專案封存、圖片 ZIP、Word 與列印，不再匯入或呼叫 Python、FastAPI、pywebview、Pillow、python-docx 或本機 HTTP API。

使用者已明確決定未來主要更新以 3.0 純前端版本為準，現行專案不再保留 Python 回退基線、Python 測試、Python 套件環境或 PyInstaller 桌面打包資產。本計畫執行完整退役，同時保留歷史計畫、結果與舊架構決策作可追溯證據。

工作樹基線已有使用者 staged 刪除 `CHANGELOG.md`；本計畫不得讀回、還原、取消暫存、重建或吸收該檔案。

## 2. 目標

- 刪除全部 Git 追蹤的 Python 正式原始碼與 Python 測試。
- 刪除 Python 套件定義、鎖定檔及 PyInstaller 打包設定。
- 刪除只供 PyInstaller 使用、正式前端未引用的 `Logo.ico`。
- 移除 `.gitignore` 與 Vite 中已失效的 Python／web cache 設定。
- 以可執行契約防止 Python 執行階段檔案重新進入現行專案。
- 將現行架構、ADR、純前端計畫生命週期及 `STATE.md` 校正為純前端已採用。
- 保留舊 plan/result、`.planning/` 與負向 pywebview／API 探針，不刪除歷史證據或安全護欄。

## 3. 允許修改與刪除範圍

### 3.1 刪除

- `main.py`
- `main.spec`
- `Logo.ico`
- `pyproject.toml`
- `uv.lock`
- `core/` 全部內容

### 3.2 建立

- `src/services/pythonRuntimeRetirement.test.ts`
- `docs/adr/0002-pure-frontend-runtime-boundary.md`
- `docs/result/2026-08-25-retire-python-runtime-result.md`

### 3.3 修改

- `.gitignore`
- `vite.config.ts`
- `AGENTS.md`
- `STATE.md`
- `docs/architecture/current-architecture.md`
- `docs/adr/0001-project-format-and-runtime-boundaries.md`
- `docs/plans/2026-08-18-pure-frontend-version.md`
- `docs/plans/2026-08-25-retire-python-runtime.md`

### 3.4 本機清理

- `.venv/`
- `__pycache__/`、`.pytest_cache/`、`.mypy_cache/`、`.ruff_cache/`

## 4. 明確不在範圍

- 不修改、還原或暫存 `CHANGELOG.md`。
- 不刪除歷史 `docs/plans/`、`docs/result/`、`.planning/` 或 Git 歷史。
- 不移除前端對 `window.pywebview`、localhost API 與上傳 endpoint 的負向測試／產物探針。
- 不修改一般圖片、長截圖、專案、ZIP、Word、列印或 UI 行為。
- 不盤點或移除 JavaScript 套件。
- 不 commit、push、部署或改寫 Git 歷史。

## 5. 執行切片

### R1：退役契約先行

1. 建立 `src/services/pythonRuntimeRetirement.test.ts`。
2. 斷言 `main.py`、`main.spec`、`pyproject.toml`、`uv.lock`、`core/` 與 `.venv/` 不存在，且儲存庫實體樹沒有任何 `.py`／`.pyi`、PyInstaller spec 或 Python 套件 manifest／lock／requirements。
3. 斷言 `package.json` scripts 不呼叫 Python、uv、pytest、PyInstaller 或 pywebview。
4. 先執行聚焦測試，確認因退役檔案仍存在而失敗。

### R2：原始碼、依賴與打包資產退役

1. 刪除 `main.py`、`main.spec`、`Logo.ico`、`pyproject.toml`、`uv.lock` 與整個 `core/`。
2. 移除 `.gitignore` 的 Python cache／web cache 規則。
3. 移除 `vite.config.ts` 的 `web_cache` watch exclusion。
4. 移除 `AGENTS.md` 已失效的 Python 執行規則。
5. 清除本機 Python 虛擬環境與 Python 快取。
6. 重跑 R1 聚焦測試至通過。

### R3：架構與治理收斂

1. 建立 ADR-0002，記錄純前端執行階段已正式採用。
2. 將 ADR-0001 標為被 ADR-0002 取代，保留原始決策正文作歷史。
3. 重寫現行架構文件為 React + Vite 瀏覽器架構。
4. 將純前端計畫生命週期標為完成；執行結果仍保留 Windows／Word UAT 未執行的 `partial` 證據邊界。
5. 撰寫本計畫結果並從 `STATE.md` 關閉純前端採用／Python 退役工作線。

### R4：驗證與獨立複審

1. 執行聚焦退役契約與純前端執行邊界測試。
2. 執行完整前端測試；若既有列印文案契約仍是唯一失敗，誠實記錄為範圍外既有失敗，不為取得全綠擴張 UI 範圍。
3. 執行 lint、production build 與靜態產物探針。
4. 搜尋 Git 追蹤的 Python 原始碼、manifest、lock 與打包設定，結果必須為空。
5. 執行 `git diff --check`、`git diff --cached --check` 與 dirty worktree guard，確認 `CHANGELOG.md` staged 狀態仍為 `D `。
6. 對目前差異進行獨立聚焦複審；必要修正後重跑受影響驗證並重新複審。

## 6. 驗收條件

- AC-1：目前候選將全部 `.py`、`.pyi`、`pyproject.toml`、`uv.lock` 與 `main.spec` 標為刪除；因 commit gate 關閉，只有後續獲核准提交後 Git tree 才會正式不再追蹤它們。
- AC-2：`core/`、`main.py`、`main.spec`、`pyproject.toml`、`uv.lock` 與 `Logo.ico` 不存在。
- AC-3：`package.json` 的開發、測試、建置與驗證 scripts 全部只依賴前端工具鏈。
- AC-4：聚焦退役契約、lint、build 與靜態產物探針退出碼為 0。
- AC-5：current architecture 與 ADR-0002 以純前端為現行權威；ADR-0001 清楚標示被取代。
- AC-6：舊純前端計畫可結案，但 Windows 11／Edge／Microsoft 365 Word UAT 仍明確未執行，不改寫成 PASS。
- AC-7：歷史 plan/result 與負向 pywebview／API 探針保留。
- AC-8：既有 staged `CHANGELOG.md` 刪除未被改變或納入本輪操作。

## 7. 驗證命令

```bash
node --test src/services/pythonRuntimeRetirement.test.ts tests/browserRuntimeCutover.test.ts tests/staticDeploymentContract.test.ts
pnpm run test:frontend
pnpm run lint
pnpm run build
pnpm run verify:static
git diff --name-only --diff-filter=D -- '*.py' '*.pyi' pyproject.toml uv.lock main.spec
git diff --check
git diff --cached --check
git status --short --branch
```

## 8. 證據與停止條件

- 聚焦退役契約失敗、build 失敗、靜態產物出現 Python／pywebview runtime 引用，或 `CHANGELOG.md` staged 狀態漂移時立即停止。
- 完整前端測試的既有列印文案失敗不自動擴張範圍；若新增其他失敗，視為本輪阻擋問題。
- reviewer 提出可重現的必要修正時，先修正再以目前快照重新驗證與複審。
- commit、push 與部署維持關閉。
