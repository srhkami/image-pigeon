---
id: work-order-image-pigeon-fastapi-session-project-format-phase-5c-opencode-2026-06-30
type: work-order
status: active
canonical: false
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5C
executor: opencode
---

# OpenCode Work Order：Phase 5C ImagePreview 改用 ProjectV2 + layout.itemOrder

你正在 `/Users/cksai/Desktop/Coding/image-pigeon` repo 內工作。請只使用 repo-relative path；嚴禁自行組合或讀取任何 `/Users/...` absolute path；不要讀取或修改 `.env`、secret、production、DB、deploy 相關內容。不要 commit、不要 push。

## 先讀取

- `AGENTS.md`
- `docs/plans/2026-06-30-1647-fastapi-session-project-format-phase-5-sliced-plan.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5a-result.md`
- `docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5b-result.md`
- Phase 5A/5B source：
  - `src/types/project.ts`
  - `src/services/imageApi.ts`
  - `src/state/projectState.ts`
  - `src/state/projectImageAdapter.ts`
  - `src/App.tsx`
  - `src/features/Upload/ModalUpload.tsx`
  - `src/features/Upload/UploadMultiple.tsx`
  - `src/features/Upload/UploadLongScreen.tsx`
- Preview/Footer source：
  - `src/features/ImagePreview/ImagePreview.tsx`
  - `src/features/ImagePreview/ImageCard.tsx`
  - `src/features/ImagePreview/ImageCardForMove.tsx`
  - `src/layout/Footer.tsx`
  - `src/features/Output/ModalOutput.tsx`

## 任務目標

把前端預覽列表的主資料來源改成 `ProjectV2` + default layout `itemOrder`，讓排序、刪除、備註、旋轉都更新 ProjectV2。這是 Phase 5C；legacy `CustomImage[] images` 可暫時保留給 Phase 5D/Phase 8 前的輸出 bridge，但 preview 主線不可再以 `images.map` 決定順序與內容。

## 必須完成

### 1. App 使用 ProjectV2 preview count

- `App.tsx` 已有 `project` / `setProject` / `sessionId`。
- 新增或使用 `getOrderedItemViewModels(project, sessionId)` 取得 preview item list。
- Intro 顯示條件改用 ProjectV2 item count，而不是 `images.length`。
- `ImagePreview` 改傳 `project/setProject/sessionId`，不再以 `images` 作為 preview 主線。
- `Footer` 至少要能接收 ProjectV2 preview count；全部清除時需清空 ProjectV2 items/layout order，同時可清空 legacy `images`。

### 2. ImagePreview 改用 ProjectItemViewModel

修改 `ImagePreview.tsx`：

- Props 改為 `project: ProjectV2`、`setProject`、`sessionId: string | null`、`isMoveMode`，可保留 `setImages` 作為 legacy output sync，但 preview 排序不要用 `images`。
- 使用 `getOrderedItemViewModels(project, sessionId ?? '')` 取得 list。若沒有 sessionId 且無 items，顯示空列表即可。
- DnD `SortableContext.items` 使用 `viewModel.itemId`。
- `handleDragEnd` 呼叫 `reorderItem(project, activeId, overId)` 更新 ProjectV2 default layout `itemOrder`。
- 如果為了 legacy output sync 仍需要更新 `images`，可同步 reorder `images`，但 ProjectV2 必須是 source of truth。

### 3. ImageCard / ImageCardForMove 改用 ProjectItemViewModel

- 改 props 使用 `ProjectItemViewModel`，而非 `CustomImage`。
- preview image src 使用 `viewModel.previewUrl`。
- rotation 使用 `viewModel.rotation`。
- remark 使用 `viewModel.remark`。
- 刪除：呼叫 `removeItem(project, itemId)` 更新 ProjectV2；asset 保留，不呼叫後端 delete。
- 備註：呼叫 `updateItemRemark(project, itemId, remark)`。
- 旋轉：呼叫 `updateItemRotation(project, itemId, rotation)`。
- 排序模式卡片刪除也應更新 ProjectV2。
- 舊「與上圖合併」功能本階段可暫時隱藏或 disabled，因完整合併需重新進 API/session asset 流程；若調整，需在 result report 註明。

### 4. Footer 清除全部

- `Footer` props 增加 `project/setProject` 或至少 `itemCount/onClearProject`。
- 顯示「共 N 張圖片」以 ProjectV2 default layout itemOrder / viewModels count 為準。
- 全部清除需：
  - 清空 ProjectV2 `items`。
  - 清空 default layout `itemOrder`。
  - assets 可保留或清空皆可；若清空，需說明只是前端 state，後端 temp 不刪。
  - 清空 legacy `images`，避免輸出 bridge 殘留。

### 5. 保持範圍

不要做：

- 不要改後端。
- 不要改 project save/open。
- 不要改 legacy JSON 匯入。
- 不要重寫 Word/另存圖片輸出 API；輸出 bridge 留到 5D/Phase 8。
- 不要刪除 `CustomImage` class。
- 不要修既有 lint errors，除非是你修改檔案新增的新 lint error。

## 驗收要求

- `pnpm -s tsc -b` 通過。
- `pnpm run build` 通過。
- `pnpm run lint` 可失敗於既有 lint，但不得新增 Phase 5C 修改檔案 lint error。
- grep/讀檔驗收：
  - `ImagePreview.tsx` 不應以 `images.map` 作為主列表。
  - `ImagePreview.tsx` 的 reorder 應呼叫 `reorderItem` 或等價 ProjectV2 layout helper。
  - `ImageCard.tsx` 的 remark/rotation/delete 應呼叫 ProjectV2 helpers。
  - 刪除不應呼叫任何後端 delete。

## 結果報告

必須建立：

`docs/result/2026-06-30-1647-fastapi-session-project-format-phase-5c-result.md`

至少包含：

1. 完成項目。
2. 修改/新增檔案。
3. preview source-of-truth 如何改為 ProjectV2/layout.itemOrder。
4. 排序、刪除、備註、旋轉如何更新 ProjectV2。
5. legacy `images` 目前如何保留/同步，哪些留到 5D。
6. 驗證命令與結果。
7. 未完成項目 / blocker。

如果遇到 blocker 或權限問題，也必須建立上述 result report，status 標為 partial/blocked，列出已完成與 blocker。
