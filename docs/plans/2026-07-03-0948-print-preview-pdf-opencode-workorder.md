---
id: workorder-image-pigeon-print-preview-pdf-2026-07-03-0948
type: workorder
status: active
canonical: false
created_at: 2026-07-03T09:48:00+08:00
project: image-pigeon
related_plan: docs/plans/2026-07-03-0948-print-preview-pdf.md
---

# OpenCode Work Order：預覽列印與另存 PDF

你是在 `image-pigeon` repo 內執行的 OpenCode worker。請只使用 repo-relative paths，不要讀取 `.env`、credentials、production 系統，不要 push。

## 重要前置狀態

目前 working tree 可能已有使用者或前序工作留下的修改，尤其是 `core/save_docx.py`、`src/features/ImagePreview/*`、`src/features/Output/*`、`src/App.css` 等。不要 revert、reset 或重排這些既有修改；只做本 work order 需要的最小增量。如果同檔需要修改，請保留既有行為。

## 必讀文件

1. `AGENTS.md`
2. `docs/plans/2026-07-03-0948-print-preview-pdf.md`
3. `docs/plans/2026-07-02-0933-auto-collage-focus-preview.md`（僅作 auto-collage context）

## 任務目標

依 `docs/plans/2026-07-03-0948-print-preview-pdf.md` 實作 Story 1-5，完成：

- 不新增 router；以 React state 切換 `editor` / `print-preview`。
- 預覽列印是全頁 view，不是 Modal 疊 Modal。
- 不新增後端 PDF API / Playwright / Chromium / ReportLab。
- 新增正式 A4 print DOM：不要直接列印右側縮圖。
- 支援五種現有 auto-collage template。
- 列印與另存 PDF 共用 `window.print()` flow；另存 PDF 需提示使用者透過系統列印對話框選 PDF。
- 等圖片載入完成後才 enable 列印/PDF；失敗圖片需顯示警告。
- 更新 README / changelog（若合理），不可宣稱後端自動產 PDF。
- 建立 result reports。

## 建議檔案

可依需要修改/新增：

- `src/App.tsx`
- `src/layout/Sidebar.tsx`
- `src/features/Output/ModalOutput.tsx`
- `src/features/PrintPreview/PrintPreviewView.tsx`
- `src/features/PrintPreview/PrintableDocument.tsx`
- `src/features/PrintPreview/PrintablePage.tsx`
- `src/features/PrintPreview/PrintableSlot.tsx`
- `src/features/PrintPreview/printLayout.ts`
- `src/features/PrintPreview/usePrintImageReadiness.ts`
- `src/features/PrintPreview/printPreview.css`
- `src/features/PrintPreview/index.ts`
- `README.md`
- `src/utils/log.ts`（若新增 changelog）

請盡量符合使用者偏好：React 組件盡量拆獨立檔案，不要塞在單一大檔。

## Verification 要求

至少執行：

- `pnpm run lint`
- `pnpm run build`

如果 full lint/build 失敗，請先嘗試修正本次引入問題；若是既有 unrelated failure，請在 result 中清楚標示並提供 scoped evidence。

## Result report 要求

請建立以下 result reports（可合併敘述，但每個檔案都要存在）：

- `docs/result/2026-07-03-0948-print-preview-pdf-story1-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story2-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story3-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story4-result.md`
- `docs/result/2026-07-03-0948-print-preview-pdf-story5-result.md`

每份至少包含：

1. completed items mapped to story acceptance criteria
2. changed files
3. verification commands and exact outcomes
4. manual smoke evidence 或明確說明 CLI 無法完整 GUI/print dialog 驗證
5. blockers / deferred items
6. 是否有 macOS pywebview 實機列印預覽驗證；若沒有，明確標示未驗證

## 禁止事項

- 不要 commit。
- 不要 push。
- 不要新增 router dependency。
- 不要新增後端 PDF API。
- 不要新增 Playwright/Chromium/ReportLab。
- 不要刪除或 revert 你不理解的既有 dirty changes。
- 不要讀取 `.env` 或 credential 檔。

完成後請摘要：修改檔案、驗證結果、無法驗證事項。
