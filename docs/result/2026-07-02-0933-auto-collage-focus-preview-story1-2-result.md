# Story 1-2 執行結果：schema 擴充與 auto collage layout 純函式

- Story 1：`Item` schema / 狀態加上 `portraitSize`，並提供 `updateItemPortraitSize()`。
- Story 2：新增 `autoCollageLayout` pure function，與頁面 index / 空白 slot 統計工具。

## 完成項目

- Story 1
  - `src/types/project.ts`
    - `Item` 新增 `portraitSize?: 'large' | 'small'`。
    - `ProjectItemViewModel` 新增 `orientation`、`portraitSize`、`collageKind`。
  - `src/state/projectState.ts`
    - `getOrderedItemViewModels()` 依 `asset.width >= asset.height` 判斷 orientation；`landscape` 或 `portrait-large`/`portrait-small` 對應 `collageKind`。
    - `portraitSize` 缺省沿用 `large`。
    - 新增 `updateItemPortraitSize(project, itemId, portraitSize)`。
  - `py/app/models.py`
    - `Item` 新增 `portrait_size: Literal['large', 'small'] = Field(default='large', alias='portraitSize')`。
  - `py/tests/test_models.py`
    - 新增 `portrait_size` 預設為 `large` 測試。
    - 新增 alias roundtrip 測試。
    - 新增舊版 JSON 未含 `portraitSize` 仍可載入測試。
- Story 2
  - 新增 `src/features/ImagePreview/autoCollageLayout.ts`
    - 定義 `AutoCollageTemplate` union。
    - 定義 `AutoCollagePage` + slot 資料。
    - 實作 `buildAutoCollageLayout()`（Greedy consume）：支援
      `landscape-2`、`portrait-large-2`、`portrait-small-6`、
      `mixed-landscape1-small3`、`mixed-small3-landscape1`。
    - 實作 `findPageIndexByItemId(layout, itemId)`。
    - 實作 `countBlankSlots(layout)`。
  - 新增 `src/features/ImagePreview/autoCollageLayout.fixtures.ts`
    - 補齊 6 組代表案例（橫橫、橫+小直、3小+橫、6小、`[大直,小直]`），作為 deterministic 檢核資料。
  - Hermes 驗收時補正 `mixed-small3-landscape1` 在小直圖不足 3 張時的空 slot 位置，確保 `[小直,橫]` 會輸出 `[小直,空,空,橫]`，並將此代表案例加入 fixtures。

## 實際修改檔案

- `src/types/project.ts`
- `src/state/projectState.ts`
- `src/features/ImagePreview/autoCollageLayout.ts`
- `src/features/ImagePreview/autoCollageLayout.fixtures.ts`
- `py/app/models.py`
- `py/tests/test_models.py`
- `docs/result/2026-07-02-0933-auto-collage-focus-preview-story1-2-result.md`

## 驗證命令與結果

- `uv run python -m pytest py/tests/test_models.py`
  - 失敗：執行環境未安裝 `pytest`，顯示 `No module named pytest`。
- `uv run python -m unittest py/tests/test_models.py -v`
  - 通過：7/7。
- `pnpm run lint`
  - 通過（無新增 lint error）。
- `pnpm run build`
  - 通過（TypeScript compile + production build 通過）。
- Hermes 額外 deterministic runtime probe：`node --experimental-strip-types --input-type=module ...`
  - 通過：6 組 auto layout cases，並驗證 `findPageIndexByItemId()` 與 `countBlankSlots()`。

## 前端測試替代方案

- 本專案未配置 front-end test runner（未新增 Vitest 依賴），故以 `autoCollageLayout.ts` 型別函式實作 + `autoCollageLayout.fixtures.ts` deterministic fixtures 做規格覆蓋說明。
- Hermes 驗收時另以 Node 22 `--experimental-strip-types` 執行 runtime probe，實際跑過 fixtures 對應的核心 cases，避免只做 source-only 檢查。
- 透過 `pnpm run build` 的 TypeScript compile 驗證函式可被正確型別檢查與建置。

## 未完成項目 / Blocker / Deferred

- 無 blockers；`Story 2` 的 representative cases 目前採 fixtures 形式紀錄，未加入可執行 test runner。
