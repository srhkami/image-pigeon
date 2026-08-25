---
type: result
id: result-image-pigeon-retire-legacy-project-formats-2026-08-25
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-retire-legacy-project-formats-2026-08-25
created_at: 2026-08-25
review:
  status: passed
  first_verdict: request_changes
  first_delegation: deleg_2d24666a
  second_verdict: request_changes
  second_delegation: deleg_e807302a
  remediation_status: completed
  focused_rereview_verdict: pass
  final_delegation: deleg_f5e6ab88
approval_gates:
  source_write: approved_consumed
  automated_test: completed
  local_browser_uat: not_required
  deployment: closed
  commit: closed
  push: closed
---

# 舊專案格式退場執行結果

## 結論

舊專案格式退場的原始碼、測試與現行文件修改均已完成，最終聚焦複審為 `PASS`。現行產品只保留單一 `.ipigeon` archive 的儲存與開啟能力；archive 內部的 `project.json` 與 `images/*.webp` 維持不變。

本結果只證明本機原始碼、測試、lint、建置與靜態產物檢查；未執行或宣稱 Windows Edge、正式部署、merge、push 或正式環境驗證。

## 實際修改

### 使用者介面

- `src/features/Upload/OpenProject.tsx` 移除資料夾 input、`webkitdirectory`、資料夾 handler 與「開啟舊專案資料夾」按鈕。
- `src/features/Upload/ModalImport.tsx` 移除 `ReadJson` 與 `legacy-json` 頁籤，只保留一般圖片及長截圖。
- 刪除無執行階段引用的 `src/features/Upload/ModalUpload.tsx`，並移除 `src/features/index.ts` 的舊 re-export。
- 刪除 `src/features/Upload/ReadJson.tsx`。
- `src/features/Upload/fileAccept.ts` 移除 JSON 專案檔接受常數。

### 服務與契約

- `src/services/browserProjectArchive.ts` 移除：
  - `openProjectFolder()`；
  - `migrateLegacyProjectJson()`；
  - 舊 JSON data URL／Base64／MIME 驗證；
  - legacy processor 型別與資料夾資源掃描。
- `src/services/browserImageProcessor.ts` 移除 `processLegacyImage()`。
- `src/services/browserRuntimeContract.ts` 移除 `legacyJson` 限制區段。
- 保留 `createProjectArchive()`、`openProjectArchive()`、ProjectV2 schema、ZIP 安全檢查、WebP 內容及尺寸檢查、取消與原子替換。

### 測試與文件

- 刪除舊資料夾成功匯入與 1.x JSON 遷移測試。
- 更新 `src/features/Upload/projectArchiveUi.test.ts`，固定單一 `.ipigeon` 與無舊入口契約。
- README 改為單一 `.ipigeon` 專案檔說明。
- accepted ADR 與 current architecture 已校正為單一 `.ipigeon` archive 契約，並明確區分 repository 仍保留的舊桌面 runtime 與尚待採用的純前端候選。
- 既有純前端 plan/result 保留歷史內容，並加入後續退場計畫指標，避免把當時證據誤讀為目前支援範圍。

## 測試驅動證據

1. 先修改 `src/features/Upload/projectArchiveUi.test.ts`，要求：
   - `OpenProject.tsx` 不得包含 `webkitdirectory`、`openProjectFolder` 或舊資料夾按鈕；
   - `ModalImport.tsx` 不得包含 `ReadJson`、`legacy-json` 或「讀取舊檔」。
2. RED：`node --test src/features/Upload/projectArchiveUi.test.ts`，exit 1。
3. 完成 UI 與服務移除後，聚焦測試：22/22 通過，exit 0。

## 完整驗證

| 驗證 | 結果 | 證據邊界 |
|---|---|---|
| `pnpm run test:frontend` | PASS，103/103，exit 0 | 完整前端自動測試 |
| `pnpm run lint` | PASS，exit 0 | ESLint |
| `pnpm run build` | PASS，exit 0 | TypeScript 與 Vite production build；保留既有 chunk size warning |
| `pnpm run verify:static` | PASS，exit 0 | 8 個產物檔、6 個參照、禁止字串 0 命中 |
| `git diff --check` | PASS，exit 0 | tracked 差異空白與衝突標記護欄 |
| 舊格式 symbol 掃描 | PASS | 正式 `src` 只有退場契約測試中的禁止詞；歷史 changelog 內容明確保留 |
| Git staged guard | PASS | 本輪差異均未 staged；未建立第二個提交 |
| Closure metadata 機械驗證 | PASS，11/11 | plan/result/STATE 狀態矩陣、雙向指標、最終複審 handle、recent result、未追蹤文件空白、tracked/cached diff check；staged paths 0 |

## 複審歷程

### 第一輪：`deleg_2d24666a`

結論：`REQUEST_CHANGES`。

唯一阻擋問題是 R3 尚未完成：本結果檔不存在，plan lifecycle 與 `STATE.md` 仍停在執行中，因而缺少 canonical evidence。原始碼、測試、lint、build 與範圍審查沒有提出其他阻擋問題。

處置：建立本結果，將 plan／STATE 同步至 `focused_re_review_pending`，保留第一輪 finding lineage，並派送目前快照的聚焦複審。

### 第二輪：`deleg_e807302a`

結論：`REQUEST_CHANGES`。

第一輪 canonical result／lifecycle finding 已確認修復。新增阻擋是 `docs/adr/0001-project-format-and-runtime-boundaries.md` 與 `docs/architecture/current-architecture.md` 仍把 `.ipigeon/` 資料夾描述為候選現行格式。

處置：擴充同一產品契約的文件範圍，將 accepted ADR 的專案格式決策校正為單一 archive，並在 current architecture 明確分開舊桌面基線與純前端候選；未把純前端候選誤寫為已採用。

### 最終聚焦複審：`deleg_f5e6ab88`

結論：`PASS`。

複審覆蓋前兩輪 finding 聯集，確認 canonical result／lifecycle、accepted ADR 與 current architecture 均已校正；複審另讀回聚焦測試 22/22、正式 `src/` 舊格式 symbol 掃描 0 命中、lifecycle lineage、canonical format contract、未追蹤 canonical artifact 與 `git diff --check` 通過。

延遲送達的前置基線複審 `deleg_a5b75e92` 亦為 `PASS`，確認提交 `0a18b73` 前兩項取消競態修正完整；此 verdict 僅補充基線證據，不取代本結果的最終複審。

## 驗收條件

- AC-1：`source_pass`。UI 只提供單一 `.ipigeon` 專案檔開啟／儲存。
- AC-2：`source_pass`。舊資料夾與獨立 JSON 支援的正式 symbol、元件與限制已移除。
- AC-3：`source_pass`。單一 archive roundtrip、安全檢查、取消與原子替換測試保留並通過。
- AC-4：`review_pass`。README、accepted ADR、current architecture、歷史文件指標及 `STATE.md` 已完成校正，最終聚焦複審通過。

## 未執行與禁止擴張

- 未執行瀏覽器人工驗收；本次是入口與相容層退場，不把 source/build 證據擴張為目標 Windows Edge PASS。
- 未部署、未 merge、未 push。
- 本結果結案複審快照當時尚未建立第二個 Git 提交；使用者後續已另行核准將退場成果納入本機 3.0.0 版本交付提交，實際提交狀態以 `STATE.md` 為準。
- 未修改 `.ipigeon` 內部 `project.json`、version 2 schema 或 ZIP 安全契約。

## 下一步

舊格式退場工作已結案。後續只等待純前端候選的採用決策；任何新 Git 提交、push、merge、部署或目標 Windows UAT 仍需各自核准。
