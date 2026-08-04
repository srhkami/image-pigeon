---
type: result
id: result-image-pigeon-manual-layout-preference-2026-08-04
implements: docs/plans/2026-08-04-manual-layout-preference.md
status: partial
completed_at: 2026-08-04
verification_scope: source-and-automated
---

# 圖片方向與排版方式分離：執行結果

## 結論

已完成核准的原始碼與自動化驗證範圍。每張圖片現在保存明確的 `layoutPreference`；旋轉不會覆寫使用者的排版選擇。預覽、列印與 Word 輸出共用 `buildAutoCollageLayout()` 的分頁結果。

焦點卡片目前採用使用者最後確認的版面：卡片右上與編號同列的刪除按鈕；「上下／左右／六張」在「左轉／右轉」同一操作列，並使用相近的預設按鈕尺寸。卡片不再顯示方向或排版文字標籤。

## 實作證據

- 後端 `ProjectV2` 在讀取舊資料時，依資產有效尺寸、旋轉與舊 `portraitSize` 一次性初始化 `layoutPreference`；已存在的偏好保留。
- 新圖片匯入會寫入初始偏好：橫圖為 `stacked-2`，直圖為 `side-by-side-2`。
- 前端 `getOrderedItemViewModels()` 優先採用已保存偏好；`updateItemRotation()` 不會修改偏好；`updateItemLayoutPreference()` 是唯一的使用者更新入口。
- `buildAutoCollageLayout()` 僅讀取 `itemId` 與 `layoutPreference`，保留五種既有模板、兩種混合模板、slot role、空 slot 與穩定 page/slot id。
- `projectOutputAdapter.ts` 與預覽皆呼叫同一個 `buildAutoCollageLayout()`。

## 實際驗證

| 命令 | 結果 |
|---|---|
| `pnpm run test:frontend` | 通過：26 項 |
| `pnpm run lint` | 通過 |
| `pnpm run build` | 通過；僅有既有 bundle 大小警告 |
| `uv run python -m unittest core.tests.test_save_docx_collage -v` | 通過：12 項 |
| `uv run python -m py_compile core/app/models.py core/app/image_service.py` | 通過 |
| `git diff --check` | 通過 |

## 獨立聚焦複審

獨立審查於本次收束前完成。審查初步要求變更的唯一 UI 阻擋，引用的是計畫中已被使用者後續明確取代的舊版規格（圖片 overlay 的右上刪除、右下排版選擇器與文字標籤）。現行快照已依使用者最後決策：刪除與編號同列、排版選擇器與旋轉同列、沒有方向或排版文字標籤；因此該 finding 標記為 stale，不適用於目前來源快照。

審查同時指出 UI source contract 採用字串斷言。此專案目前的前端測試 runner 沒有 React DOM 測試環境；本次保留 source contract 作為控制位置與可及性語意的機械防護，並由 `tsc`、lint 與 build 驗證可編譯性。實際互動與視覺行為仍列為未開啟的 browser／pywebview 驗收，不將 source contract 誇大成 runtime 證據。

完整 Python 測試共執行 57 項，其中 56 項通過；唯一失敗為既有的 `test_main_production_frontend_url_uses_local_fastapi`：目前 `DEBUG_MODE = True` 回傳開發網址 `http://localhost:5195`，但測試期待正式網址。這與本工作線無關，且在修改前已知為基準失敗，未順手變更。

## 未執行閘門與證據界線

- 本 agent 未執行本機瀏覽器、打包 pywebview 或 Windows GUI 驗收。
- 未執行檔案儲存／重新開啟的本機 side effect 驗收。
- 未涉及資料庫、外部 provider、正式環境、發布或 push。
- 因此本結果為 `partial`：原始碼與自動驗證範圍通過，不代表上述執行階段驗收已通過。
