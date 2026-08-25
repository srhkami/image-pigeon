---
type: plan
id: plan-image-pigeon-retire-legacy-project-formats-2026-08-25
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-25
branch:
  name: feat/pure-frontend
  base: dev
  status: existing
execution:
  status: completed
  current_checkpoint: legacy_project_format_retirement_completed
result: docs/result/2026-08-25-retire-legacy-project-formats-result.md
review:
  type: implementation
  status: passed
  first_verdict: request_changes
  first_delegation: deleg_2d24666a
  second_verdict: request_changes
  second_delegation: deleg_e807302a
  final_verdict: pass
  final_delegation: deleg_f5e6ab88
  remediation_status: completed
approval_gates:
  planning_docs: approved
  source_write: approved_consumed
  automated_test: completed
  local_browser_uat: not_required
  deployment: closed
  commit: closed
  push: closed
related:
  - docs/plans/2026-08-18-pure-frontend-version.md
  - docs/result/2026-08-18-pure-frontend-version-result.md
---

# 舊專案格式退場計畫

## 1. 決策與背景

純前端版本候選已在提交 `0a18b73` 建立現行專案封存格式，同時保留兩條舊格式相容路徑：

1. 1.x 單一 JSON 專案檔，圖片以 Base64 data URL 內嵌。
2. 舊桌面版 `.ipigeon/` 專案資料夾，內含 `project.json` 與圖片檔案。

產品決策自本版本起停止支援上述兩種舊格式。唯一受支援的專案交換格式為單一 `.ipigeon` 壓縮檔；其內部仍保留 `project.json` 與 `images/*.webp`，manifest 為 `image-pigeon.project` version 2。

本計畫是既有純前端候選的後續收斂工作，不改寫已完成計畫與結果中的歷史證據。

## 2. 目標

- UI 只提供單一 `.ipigeon` 專案檔的開啟與儲存入口。
- 完整刪除獨立 JSON 與專案資料夾的解析、遷移、型別、資源限制及圖片處理程式。
- 保留現行 `.ipigeon` archive 的安全驗證、取消、原子替換與資產回收契約。
- 測試從「舊格式可成功匯入」改為固定「舊格式入口與相容程式不存在」。
- 更新 README、accepted ADR、current architecture、純前端計畫的後續決策註記與治理狀態，避免 canonical 文件繼續宣稱支援舊格式。

## 3. 範圍

### 3.1 使用者介面

- `src/features/Upload/OpenProject.tsx`
  - 移除資料夾 input、`webkitdirectory`、資料夾 handler 與「開啟舊專案資料夾」。
  - 保留單一 `.ipigeon` 開啟、取消、驗證完成後原子替換。
- `src/features/Upload/ModalImport.tsx`
  - 移除 `legacy-json` 頁籤與 `ReadJson`。
  - 保留一般圖片與長截圖匯入的共享取消生命週期。
- `src/features/Upload/ReadJson.tsx`
  - 刪除整個元件。
- `src/features/Upload/ModalUpload.tsx`
  - 若確認無任何使用處，刪除既有未使用元件，避免殘留舊 JSON 入口。
- `src/features/Upload/fileAccept.ts`
  - 移除獨立 JSON 專案檔接受規則。

### 3.2 服務與型別

- `src/services/browserProjectArchive.ts`
  - 移除 `openProjectFolder()` 與 `webkitRelativePath` 資料夾載入路徑。
  - 移除 `migrateLegacyProjectJson()`、Base64 data URL parser、legacy 驗證與相關型別。
  - 保留 `createProjectArchive()`、`openProjectArchive()` 與現行 archive 安全檢查。
- `src/services/browserImageProcessor.ts`
  - 移除只供舊 JSON 使用的 `processLegacyImage()`。
- `src/services/browserRuntimeContract.ts`
  - 移除 `legacyJson` 資源限制。
- `src/types/project.ts`
  - 移除只供舊格式遷移使用的型別；保留 ProjectV2 與現行 import data。

### 3.3 測試與文件

- 移除舊資料夾成功匯入與 1.x JSON 成功遷移測試。
- 移除 legacy image processor 與 legacy 資源限制測試。
- 新增或改寫原始碼契約測試，確認：
  - 不存在 `webkitdirectory` 與舊資料夾入口。
  - 不存在 `ReadJson`、`migrateLegacyProjectJson` 與 `openProjectFolder`。
  - 現行 `.ipigeon` roundtrip、安全驗證與取消仍通過。
- 更新 `README.md` 的專案檔說明。
- 校正 `docs/adr/0001-project-format-and-runtime-boundaries.md` 的現行專案交換格式，同時保留舊桌面 runtime 尚在 repository 的邊界。
- 校正 `docs/architecture/current-architecture.md`，區分舊桌面基線與尚待採用的純前端候選，且不再把資料夾格式描述為候選現行格式。
- 在既有純前端計畫與結果加入後續退場文件連結，不改寫當時已執行的歷史契約。

## 4. 明確不在範圍

- 不移除現行 `.ipigeon` 內部的 `project.json`。
- 不變更 ProjectV2 manifest 名稱或 version 2 schema。
- 不新增舊格式轉換工具、遷移精靈、隱藏相容層或過渡期開關。
- 不處理正式部署、版本發布、遠端推送或 Git 歷史改寫。
- 不調整一般圖片、長截圖、圖片 ZIP、Word 或列印功能。

## 5. 驗收條件

### AC-1 唯一專案入口

- UI 只接受並開啟單一 `.ipigeon` 檔案。
- 原始碼中沒有 `webkitdirectory`、舊專案資料夾按鈕或 JSON 專案頁籤。

### AC-2 相容程式完整退場

- `openProjectFolder`、`migrateLegacyProjectJson`、`processLegacyImage` 與只供它們使用的型別、常數、parser 全部移除。
- 不留下未被呼叫的舊格式程式碼。

### AC-3 現行格式不回歸

- 單一 `.ipigeon` roundtrip 保留 ProjectV2、圖片 bytes 與順序。
- 損壞 ZIP、未知版本、非法路徑、遺失／多餘資產及尺寸不一致仍會拒絕。
- 取消與失敗不污染目前 project 或 asset store。

### AC-4 文件一致

- README 只描述單一 `.ipigeon` 專案檔。
- accepted ADR 與 current architecture 對純前端候選只宣稱單一 `.ipigeon` archive；舊桌面 Python 路徑保留為尚待採用決策處理的 repository 基線，不冒充候選相容能力。
- 歷史計畫與結果保留原始內容，但能導向本退場計畫與結果。
- `STATE.md` 指向本計畫及最後驗證狀態。

## 6. 執行切片

### R1 測試契約先行

1. 將 UI 契約測試改為要求舊入口與 legacy symbol 不存在。
2. 移除舊格式成功案例，保留現行 archive 測試。
3. 先執行聚焦測試，確認測試因舊入口仍存在而失敗。

### R2 UI 與服務退場

1. 移除 `OpenProject` 資料夾入口。
2. 移除 `ModalImport` JSON 頁籤並刪除 `ReadJson`。
3. 確認 `ModalUpload` 無使用處後刪除。
4. 移除 archive、image processor、runtime contract 與 project types 的 legacy 路徑。
5. 執行聚焦測試至通過。

### R3 文件與治理收斂

1. 更新 README。
2. 校正 accepted ADR 與 current architecture 的專案格式契約。
3. 在前置純前端計畫／結果增加後續決策連結。
4. 寫入本計畫對應結果。
5. 校正本計畫狀態與 `STATE.md`。

## 7. 驗證命令

```bash
node --test src/features/Upload/projectArchiveUi.test.ts src/services/browserProjectArchive.test.ts src/services/browserImageProcessor.test.ts src/services/browserRuntimeContract.test.ts
pnpm run test:frontend
pnpm run lint
pnpm run build
pnpm run verify:static
git diff --check
```

另執行：

- 搜尋 `webkitdirectory|ReadJson|openProjectFolder|migrateLegacyProjectJson|processLegacyImage|legacyJson`，正式 `src/` 不得殘留舊格式實作。
- 檢查 tracked／untracked 狀態及 staged-file guard，避免碰觸範圍外檔案。

## 8. 核准與閘門

- 原始碼與文件修改：使用者已於 2026-08-24 明確核准，且要求計畫完成後直接實作。
- Git 基線提交：已依使用者要求完成為 `0a18b73`。
- 本輪不含 commit、push、部署或正式環境操作；如需後續提交或推送，另行核准。

## 9. 複審紀錄

- 第一輪實作複審 `deleg_2d24666a`：`REQUEST_CHANGES`。唯一阻擋是尚未建立本計畫的 canonical result，且 plan／STATE 尚未校正到 closure review；原始碼、測試、lint、build 與範圍未提出其他阻擋。
- 第二輪聚焦複審 `deleg_e807302a`：`REQUEST_CHANGES`。第一輪 finding 已確認修復；新增阻擋是 accepted ADR 與 current architecture 仍把 `.ipigeon/` 資料夾描述為候選現行格式。
- 最終聚焦複審 `deleg_f5e6ab88`：`PASS`。複審覆蓋前兩輪 finding 聯集，確認 canonical result／lifecycle 與專案格式文件衝突均已修復；聚焦測試 22/22、正式 `src/` 舊格式 symbol 掃描 0 命中及差異護欄通過。
- 延遲送達的前置基線聚焦複審 `deleg_a5b75e92` 亦為 `PASS`，確認提交 `0a18b73` 前的儲存最終取消檢查與全部清除匯入取消競態已修復；該 verdict 僅補充基線 lineage，不取代本計畫的最終複審。
