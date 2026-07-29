# 驗收條件

- [x] 根目錄只有一份正式 `STATE.md`，使用 `workstreams`。
- [x] 正式 STATE 為 `canonical: true`、`governance_mode: project-state-v1`。
- [x] `AGENTS.md` 只保留操作、安全、核准與驗證規則，並以 STATE 作目前狀態入口。
- [x] 架構、決策、治理、計畫與結果各有單一 canonical owner。
- [x] 不把已完成舊計畫誤匯入目前 workstream。
- [x] 舊計畫／結果的 Git provenance 與生命週期缺口保存在 legacy snapshot。
- [x] `.planning/.active_plan` 已移除，其他既有草稿仍明確為非 canonical。
- [x] README 試行完整通過 STATE → plan → edit → result → STATE reconciliation。
- [x] 所有新／修改文件 frontmatter、連結、相對路徑與狀態詞彙通過機械驗證。
- [x] `main.py`、`vite.config.ts` 與既有狀態文件刪除基線未被遷移流程覆寫。
- [x] 沒有 staged files，沒有 commit 或 push。
- [x] 獨立文件治理審查結果為 PASS；否則保持未關閉狀態。
