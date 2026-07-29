# AGENTS.md

本 repository 是 image-pigeon 的正式工作區。`pywebview-base` 只曾作參考，不是本專案依賴或修改目標。

## 新 session 啟動順序

進入本 repository 後依序讀取：

1. `AGENTS.md`
2. `STATE.md`，確認 `governance_mode` 與相關 workstream
3. Workstream 指向的 canonical plan
4. 只讀該工作直接相關的 `docs/adr/`、`docs/architecture/` 或 `docs/governance.md` 章節

若 `STATE.md` 不存在、mode 不明或連結失效，必須 fail closed：只盤點並向使用者確認，不得從 `.planning/` 或 Git 歷史直接執行。

## 工作語言

- 文件、計畫、結果報告、提交訊息預設使用繁體中文與台灣用語。
- 技術名詞可保留英文，例如 FastAPI、pywebview、React、Vite、session、manifest。

## 規劃與執行治理

- `STATE.md` 是目前狀態、workstream、blocker、gate 與 next action 的唯一入口。
- `docs/plans/` 保存正式 execution contract；`docs/result/` 保存實際 evidence。已執行文件預設保留。
- `docs/adr/` 保存 accepted decision；`docs/architecture/` 保存 durable architecture；完整規則見 `docs/governance.md`。
- `.planning/` 只放非 canonical 草稿、發現與探索，不得直接執行。
- 一份 plan/result 只能有一個 canonical owner；執行後先校正 plan/result，再更新 STATE。

## 操作與安全規則

- 修改前先讀相關 source、manifest、definition 與 usages，不得猜測 symbol、API 或 dependency。
- 記錄並保護既有 dirty worktree；只改核准 scope，不得 reset、clean、stage 或覆寫使用者變更。
- 需要 side effect、runtime、外部服務、資料庫、production、deploy、commit 或 push 時，必須取得各自明確核准；一般 source-write 核准不會隱含開啟其他 gate。
- 不得讀取、列印或提交 secrets；除非使用者明確要求，避開 `.env` 與 credential files。
- 不 commit、push 或 rewrite history，除非使用者明確要求。
- Python 的 Pillow／python-docx 工作若進入 async FastAPI path，避免長時間阻塞 event loop；必要時使用同步 endpoint 或 threadpool。

## 修改與驗證

- 前端套件與指令優先使用 `pnpm`。
- 預設驗證命令：`pnpm run lint`、`pnpm run build`；依實際變更增加 Python tests 或 focused checks。
- 文件專用變更至少驗證 frontmatter、路徑／連結、stale authority、tracked/untracked status、`git diff --check` 與 staged-file guard。
- 驗證結果只證明實際執行的範圍；不得把 source review、文件 review 或 user-attested UAT 擴張成未執行的 runtime PASS。
- 完成工作後寫入同 scope result，校正 plan lifecycle，最後更新或關閉 STATE workstream。
