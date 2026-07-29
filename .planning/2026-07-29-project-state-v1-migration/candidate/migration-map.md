# Legacy → Project-State v1 對照

## Authority 對照

| 舊來源 | 分類 | 新 owner | 處理方式 |
|---|---|---|---|
| `AGENTS.md` 操作／安全規則 | agent guidance | `AGENTS.md` | 保留並精簡 |
| `AGENTS.md` 架構與產品決策 | durable knowledge | `docs/architecture/`、`docs/adr/` | 依內容分流 |
| 已刪除 `docs/status/current-architecture-and-features.md` | current handoff | `STATE.md` + architecture + ADR | 不復原原檔，依 source 重建 replacement |
| `.planning/.active_plan` | stale index | `STATE.md` | 核准後刪除 |
| `.planning/2026-06-30-*` | non-canonical scratch | legacy snapshot | 原檔保留，不再執行 |
| `.planning/sketches/` | design exploration | non-canonical history | 保留 |
| Git 歷史中的 15 plans / 18 results | historical contract/evidence | Git history + legacy snapshot | 不大量復原 |

## Source-verified facts

- `pyproject.toml` 宣告 FastAPI、uvicorn、pywebview、Pillow 與 python-docx。
- `main.py` 建立 localhost FastAPI server 與 pywebview 視窗。
- `core/app/api.py` 提供圖片匯入、長截圖、session asset、project save/open 與 React build serving。
- `src/types/project.ts` 定義 ProjectV2 的 assets/items/layouts。
- `src/features/ImagePreview/autoCollageLayout.ts` 定義五種自動拼貼 template。
- `src/App.tsx` 具有 editor／print-preview view mode。

## Conflict policy

正式 cutover 前，本候選沒有執行權威。正式 cutover 後，`STATE.md` 管 current work，Git 歷史與 `.planning/` 只供歷史與稽核；任何衝突不得混合推定。
