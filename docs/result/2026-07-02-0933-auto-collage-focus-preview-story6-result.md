---
title: Story 6 自動拼貼 Word 輸出結果
created_at: 2026-07-02
affected_projects:
  - image-pigeon
affected_apps:
  - desktop
source_plan: docs/plans/2026-07-02-0933-auto-collage-focus-preview.md
story: 6
status: completed
---

# Story 6 自動拼貼 Word 輸出結果

## 完成項目

- 前端 Word 輸出改為使用自動拼貼 payload。
  - `SaveWord` 不再提供舊版排版 mode select。
  - UI 顯示「依右側自動排版預覽輸出 Word」。
  - 保留文件標題、說明文字對齊、字體大小設定。
- 新增前端 payload 組裝。
  - `buildAutoCollageWordPayloadParts()` 使用 `getOrderedItemViewModels(project, sessionId)`。
  - 使用同一套 `buildAutoCollageLayout(viewModels)` 產生 Word pages。
  - 仍沿用 legacy `CustomImage[]` base64 圖片資料，避免本 Story 大改圖片傳輸。
  - 輸出 payload 帶入 `layoutMode: 'auto-collage-v1'`、`pages`、`images`、`title`、`align_vertical`、`font_size`、`path`。
- 更新 TypeScript 型別。
  - `OutputWord.mode` 改 optional，保留舊模式 fallback。
  - 新增 `layoutMode?: 'auto-collage-v1'`。
  - 新增 Word auto collage page / slot / template 型別。
- 後端 `OutputWord` 支援 auto payload。
  - 解析 `layoutMode` 與 `pages`。
  - 舊 `mode` 仍可 parse；非法值 fallback 到 1。
  - `to_dict()` 增加版型與頁數資訊。
- 後端 `creat_docx()` 支援 auto renderer。
  - 收到 `layoutMode == 'auto-collage-v1'` 且有 `pages` 時走 auto collage renderer。
  - 否則保留舊版 mode renderer fallback。
- 後端 auto renderer 支援五種 template：
  - `landscape-2`
  - `portrait-large-2`
  - `portrait-small-6`
  - `mixed-landscape1-small3`
  - `mixed-small3-landscape1`
- 空 slot 行為。
  - 空 slot 保留表格框線與空白 number / remark cells。
  - 空 slot 不呼叫 `handle_table_write()`。
- 保留圖片 id。
  - `SaveImage` 新增 `id`，讓 Word slot 的 `itemId` 可對應到 legacy image payload。
- 加入安全 progress helper。
  - `_safe_update_progress()` 在沒有 `webview.windows` 的測試環境不會失敗。
- Hermes 驗收時額外修正：
  - auto Word 編號跨頁連續，不會每頁從 1 重新開始。
  - `mixed-small3-landscape1` 底部橫圖 cell 先合併整列再寫入。
  - 補強測試覆蓋每種 template、空 slot、跨頁編號。

## 修改檔案

- `src/features/Output/SaveWord.tsx`
- `src/state/projectOutputAdapter.ts`
- `src/utils/type.ts`
- `py/save_docx.py`
- `py/save_images.py`
- `py/tests/test_save_docx_collage.py`

## 驗證結果

- Source probe
  - RED：實作前確認缺少 auto Word hint、`layoutMode/pages` 型別、auto payload helper、後端 auto branch。
  - GREEN：實作後確認 Story 6 source contract satisfied。
- `uv run python -m unittest py/tests/test_save_docx_collage.py -v`
  - 通過，8 tests OK。
  - 覆蓋 auto payload parse、legacy fallback、每種 template 產生 table、空 slot 不寫圖、itemId map、跨頁連續編號。
- `uv run python -m unittest py/tests/test_models.py py/tests/test_api.py -v`
  - 通過，12 tests OK。
  - 只有既有 StarletteDeprecationWarning，不是本次新增錯誤。
- `pnpm run lint`
  - 通過。
- `pnpm run build`
  - 通過。
  - 仍有既有 Vite chunk size warning，不是本次新增錯誤。
- `git diff --check`
  - 通過。
- Browser smoke
  - `pnpm run dev -- --host 127.0.0.1`
  - 開啟 `http://127.0.0.1:5173/`
  - 頁面可載入，console 無 JavaScript error。

## Source proof

- `src/features/Output/SaveWord.tsx`：送出 `layoutMode: 'auto-collage-v1'`，並使用 `buildAutoCollageWordPayloadParts()`。
- `src/state/projectOutputAdapter.ts`：`buildAutoCollageWordPayloadParts()` 產生 `images + pages`。
- `py/save_docx.py`：`creat_docx()` 在 auto mode 分流到 `_render_auto_collage_pages()`，legacy path 留在 `_build_legacy_layout()`。
- `py/tests/test_save_docx_collage.py`：新增 Story 6 後端 contract tests。

## Deferred / 注意事項

- 本 Story 未做 Story 7 project save / open 的 auto layout snapshot；目前 Word pages 是輸出當下即時計算。
- 本 Story 未改圖片傳輸格式，仍沿用 legacy base64 `CustomImage[]` 給 pywebview 後端。
- 建議下一步做 Story 7 前，先用實際圖片手動輸出一次 Word，檢查五種版型在 Word 裡的視覺比例是否符合預期。
