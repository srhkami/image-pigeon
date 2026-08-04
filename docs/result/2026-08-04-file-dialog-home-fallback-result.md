---
type: result
id: result-image-pigeon-file-dialog-home-fallback-2026-08-04
status: completed
canonical: true
scope: image-pigeon
implements: plan-image-pigeon-file-dialog-home-fallback-2026-08-04
created_at: 2026-08-04
---

# 檔案選擇器家目錄備援修正結果

## 根因

更新後的 pywebview 6.2.1 在 Windows WinForms 檔案選擇器仍會於呼叫端沒有提供 `directory` 時直接讀取 `os.environ['HOMEPATH']`。缺少該環境變數時，錯誤發生在檔案選擇器開啟階段，而不是 `python-docx` 儲存 Word 階段。

## 變更

- `main.py` 新增 `resolve_dialog_directory()`，依序檢查 `USERPROFILE`、`HOMEDRIVE` 加 `HOMEPATH`、`HOME`、`Path.home()`、應用程式路徑與目前工作目錄，只回傳確實存在的資料夾。
- Word、JSON、圖片、專案儲存與專案開啟五種 pywebview 選擇器都明確傳入 `directory`，不再觸發 pywebview 對 `HOMEPATH` 的內建假設。
- `Api.select_path()` 捕捉檔案選擇器例外，日誌保留完整錯誤追蹤，前端收到固定且可理解的 500 回應；使用者取消選擇的既有 400 語意不變。
- `core/tests/test_api.py` 新增三項回歸測試，涵蓋全部家目錄環境缺失、五種選擇器的明確初始資料夾，以及選擇器例外回應。

## TDD evidence

- 修改 production source 前先執行三項新測試；在修正測試本身的環境變數模擬方式後，測試因 `resolve_dialog_directory` 不存在、呼叫缺少 `directory` 與 `KeyError` 未被捕捉而如預期 RED。
- 實作後三項新測試通過；加入兩項鄰近既有路徑測試後，聚焦命令共 5/5 通過。

## 驗證

- 聚焦 Python 回歸：5/5 通過。
- Word 輸出 renderer 測試在完整 Python suite 中全部通過。
- `uv run python -m py_compile main.py core/tests/test_api.py`：通過。
- `pnpm run test:frontend`：15/15 通過。
- `pnpm run lint`：通過。
- `pnpm run build`：通過；Vite 仍有單一 chunk 大於 500 kB 的既有警告。
- `git diff --check`：通過。
- staged-file guard：沒有 staged files。
- dirty baseline guard：使用者既有 `package.json`、`pnpm-lock.yaml`、`uv.lock` 的狀態、大小與 SHA-256 均未改變。

## 既有驗證缺口

完整 Python suite 執行 53 項，其中 52 項通過；唯一失敗是本輪修改前已可重現的 `test_main_production_frontend_url_uses_local_fastapi`，因 committed source 的 `DEBUG_MODE = True` 回傳 Vite URL，而測試期待本機 FastAPI URL。此失敗與檔案選擇器修正無關，未在本輪擴張範圍修改。

## 執行階段邊界

本輪沒有 Windows 測試環境，因此沒有宣稱 Windows GUI 實機驗收。已透過 Python 橋接回歸測試證明呼叫端不再省略 `directory`，並驗證缺少所有家目錄來源時仍可取得有效資料夾；最終 Windows 打包版確認留給使用者發布後由原問題環境驗收。
