---
type: result
id: result-image-pigeon-diagnostic-logging-2026-08-04
status: partial
canonical: true
scope: image-pigeon
plan: docs/plans/2026-08-04-diagnostic-logging.md
completed_at: 2026-08-04
---

# 診斷記錄改善結果

## 實作範圍

已完成 C0–C5：安全記錄器、FastAPI／session／圖片與專案摘要、pywebview 檔案視窗、Word／圖片／legacy JSON 輸出，以及受控前端 bridge。

- `core/handle_log.py` 改為跨平台、UTF-8、2 MiB 輪替與三份備份的記錄器；包含 UUID operation ID、欄位白名單、範圍檢查、單行上限與敏感值遮蔽。
- FastAPI middleware 僅對 POST、非 2xx 與超過 1000 ms 的請求記錄安全摘要；成功圖片預覽 GET 不產生 INFO 噪音。
- 圖片／長截圖、session 及專案存開記錄固定計數、階段、耗時與例外類別，不記錄請求 body、圖片、備註、檔名或完整路徑。
- 檔案視窗取消記錄為 INFO。Word、圖片、JSON 的寫檔與 OS 開啟分離；若已儲存但開啟失敗，記錄 WARNING 並固定回覆 200 警告。
- 前端只透過 `record_frontend_diagnostic()` 傳送 enum 與數值；Python 固定回覆 200 或 400，無一般 telemetry endpoint，也不反射輸入內容。

## 驗證證據

| 項目 | 實際結果 |
|---|---|
| 聚焦 Python 測試與既有相關 API／service 測試 | `38` 項通過 |
| Python 編譯 | `uv run python -m compileall main.py core` 通過 |
| 前端診斷測試 | `node --test tests/diagnosticLogging.test.ts`：2/2 通過 |
| lint | `pnpm run lint` 通過 |
| build | `pnpm run build` 通過；僅既有 bundle size warning |
| diff hygiene | `git diff --check` 通過 |
| 打包 | `uv run pyinstaller main.spec --noconfirm` 通過 |
| macOS 打包版 UAT | 實際啟動 `dist/貼圖小鴿手`；Cocoa backend、pywebview ready 與 loaded event 均出現，視窗成功載入；驗證後已關閉程序 |

## 已知驗證缺口

本結果為 `partial`，不把下列非本切片失敗誤述為通過：

1. 完整 Python suite 的既有失敗：`test_main_production_frontend_url_uses_local_fastapi` 在 `DEBUG_MODE=True` 時仍期待正式環境 URL；本工作沒有變更該行為。
2. `pnpm run test:frontend` 有一項既有／平行工作線失敗：`manualLayoutPreference.test.ts` 的 regex 與現有 `FocusImageCard.tsx` 格式不符；本工作新增的前端診斷測試通過。
3. Windows 目標環境不可用，未宣稱 Windows pywebview／打包版實機驗收。

## 安全與範圍

未加入遠端 telemetry、外部服務、資料庫、付費 API、部署或 push。測試使用 temporary directory 與 fixture；未讀取或列印 secrets。