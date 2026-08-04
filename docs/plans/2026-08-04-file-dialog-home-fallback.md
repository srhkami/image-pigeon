---
type: plan
id: plan-image-pigeon-file-dialog-home-fallback-2026-08-04
status: completed
canonical: true
scope: image-pigeon
created_at: 2026-08-04
execution:
  status: completed
  current_checkpoint: lifecycle-closed
result: docs/result/2026-08-04-file-dialog-home-fallback-result.md
---

# 檔案選擇器家目錄備援修正

## 目標

避免 Windows 使用者環境缺少 `HOMEPATH` 時，pywebview 檔案選擇器在 Word 或其他輸出流程拋出 `KeyError`，同時維持現有跨平台檔案選擇與輸出流程。

## 根因與做法

pywebview 6.2.1 的 WinForms 實作在呼叫端未提供 `directory` 時直接讀取 `os.environ['HOMEPATH']`。應用程式將集中解析一個確實存在的初始資料夾，所有檔案／資料夾選擇器一律明確傳入；選擇器例外則在 Python 橋接邊界轉成穩定回應並保留完整日誌。

## Allowed paths

- `main.py`
- `core/tests/test_api.py`
- `STATE.md`
- `docs/plans/2026-08-04-file-dialog-home-fallback.md`
- `docs/result/2026-08-04-file-dialog-home-fallback-result.md`

## Protected parallel changes

- `package.json`
- `pnpm-lock.yaml`
- `uv.lock`

以上為使用者手動更新套件的既有未提交變更，本工作不得修改、還原、暫存或吸收。

## Non-scope

- 修改 `.venv` 內 pywebview 原始碼或維護套件分支。
- 更換 Word 產生器、輸出格式或前端操作流程。
- 發布、打包、commit、push 或 Windows 實機 UAT。

## 執行步驟

1. 在 `core/tests/test_api.py` 先加入失敗回歸測試，涵蓋家目錄環境變數全部缺少、所有選擇器收到明確初始資料夾，以及選擇器例外轉為穩定回應。
2. 執行聚焦 Python 測試，確認因缺少解析函式／未傳入 `directory` 而 RED。
3. 在 `main.py` 實作最小的有效資料夾解析與選擇器錯誤邊界。
4. 重跑聚焦與完整 Python 測試，再執行 `pnpm run lint`、`pnpm run build`、`git diff --check`。
5. 確認三個受保護套件檔案的狀態與內容摘要未變，寫入結果並收束 STATE。

## Acceptance criteria

- 清除 `HOME`、`USERPROFILE`、`HOMEDRIVE`、`HOMEPATH` 後仍回傳存在的初始資料夾，不拋例外。
- Word、JSON、圖片、專案儲存與專案開啟選擇器都明確收到非空 `directory`。
- pywebview 選擇器拋例外時，API 記錄錯誤並回傳穩定的 500 回應；取消選擇仍維持既有語意。
- Python 回歸測試、`pnpm run lint`、`pnpm run build` 與 `git diff --check` 通過。
- 不宣稱 Windows GUI 實機驗收；由使用者發布後交由原問題環境確認。
