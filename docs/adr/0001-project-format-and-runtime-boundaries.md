---
type: adr
id: adr-image-pigeon-project-format-and-runtime-boundaries-0001
status: accepted
canonical: true
scope: image-pigeon
decided_at: 2026-06-30
reconciled_at: 2026-08-25
---

# ADR-0001：專案格式與 runtime 邊界

## 背景

舊版主要透過 pywebview `js_api` 傳遞 base64 圖片與執行輸出。2026-06-30 的 FastAPI/session/project-format 改版決定導入本機 FastAPI、filesystem session 與 ProjectV2，同時保留 pywebview 桌面能力。

本 ADR 將仍有效的產品與架構決策從舊 plan、status 與 `AGENTS.md` 分離。它記錄 accepted design，不代表任何新功能、資料庫、provider、部署或 production gate 已開啟。

## 決策

1. pywebview 保留桌面視窗、檔案／資料夾 dialog、storage path 與必要原生能力；不追求完全移除。
2. FastAPI 負責本機資料 API、圖片匯入／壓縮、長截圖切割、session temp、專案儲存／開啟與 React build serving。
3. FastAPI 只 bind `127.0.0.1`，不加 auth token；本專案不使用資料庫，以 filesystem session 管理。
4. 專案交換格式是單一 `<name>.ipigeon` ZIP archive：
   - archive 內含 `project.json`；
   - 圖片位於 `images/<uuid>.webp`；
   - manifest 維持 `image-pigeon.project` version 2；
   - 不支援獨立 1.x JSON 或 `.ipigeon/` 專案資料夾。此項取代本 ADR 在 2026-06-30 決定的資料夾格式；退場依據為 `docs/plans/2026-08-25-retire-legacy-project-formats.md`。
5. Session/project 內部圖片使用 WebP；另存圖片預設使用 JPG。
6. React 主要保存 asset/item/layout metadata，不把 base64 當長期狀態。
7. 圖片匯入使用 `multipart/form-data` + `UploadFile`。大量圖片由前端分批多 request，每批 2–4 張並顯示 N / total，不建立後端 job system。
8. `items[]` 保存 remark、rotation、crop 與 portraitSize；crop schema 先存在，即使沒有裁切 UI。
9. `layouts[]` 目前使用 `word-compatible-grid`，輸出排序以 `layout.itemOrder` 為準。
10. 專案不保存 Word／列印表單設定；輸出設定由匯出當下決定。
11. 刪除圖片目前只從前端列表移除，不立即刪 temp asset。
12. 不保存原始上傳圖片；preview 與輸出共用壓縮後的 session WebP。
13. 列印／另存 PDF 走 browser/system print flow，不新增後端 PDF renderer。

## 已知實作差異

- `core/app/session_store.py` 已提供 24 小時過期與目前 session 清理函式，但 `main.py` 尚未把清理接入啟動／正常關閉流程。
- `main.py.Api` 仍保留多個 legacy bridge 方法；目前邊界是漸進式收斂，不是純 FastAPI。
- 純前端候選的 `src/` 已移除獨立 JSON 與 `.ipigeon/` 專案資料夾相容；Python／FastAPI 舊桌面路徑仍留在 repository，是否退役由純前端候選採用決策另行處理，不構成瀏覽器候選的格式相容層。

## 後果

- 圖片不需在 React 與 Python 之間反覆以 base64 傳輸。
- 專案可保存與重新開啟，且原 `.ipigeon` archive 不被未儲存編輯直接修改。
- pywebview 與 FastAPI 各自保留適合的職責，但 legacy bridge 的移除必須以後續 bounded plan 執行。
- Session cleanup wiring 與 legacy bridge 收斂仍是桌面路徑的已知後續議題，不因本 ADR 自動進入 active workstream；瀏覽器候選的舊專案格式退場已由 2026-08-25 計畫處理。

## Provenance

- Git 歷史：`docs/status/2026-06-30-fastapi-session-project-format-decisions.md`（存在於 `d89afeb^`）。
- Git 歷史：`docs/plans/2026-06-30-1647-fastapi-session-project-format.md`（存在於 `d89afeb^`）。
- 現行 source：`main.py`、`core/app/`、`src/types/project.ts`、`src/features/ImagePreview/autoCollageLayout.ts`、`src/features/PrintPreview/`。
