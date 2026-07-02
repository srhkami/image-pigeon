---
id: result-image-pigeon-fastapi-session-project-format-phase-5c-2026-06-30
type: result
status: completed
canonical: true
created_at: 2026-06-30T00:00:00+08:00
project: image-pigeon
related_plan: plan-image-pigeon-fastapi-session-project-format-phase-5-sliced-2026-06-30
phase: 5C
---

# Phase 5C：ImagePreview 改用 ProjectV2 + layout.itemOrder

## 完成項目

- `App.tsx` 改用 `ProjectV2` 作為預覽主資料來源，Intro 顯示條件改以 `getOrderedItemViewModels(project, sessionId ?? '')` 的筆數判斷。
- `ImagePreview.tsx` 以 `project/setProject/sessionId` 為主要 props，改由 `getOrderedItemViewModels` 取得預覽資料，`SortableContext` 改用 `viewModel.itemId`。
- `ImagePreview` 的排序改呼叫 `reorderItem(project, activeId, overId)`，並保留 `setImages` 作 legacy bridge 同步。
- `ImageCard.tsx` 與 `ImageCardForMove.tsx` 改用 `ProjectItemViewModel`，`preview src` 改 `previewUrl`，`rotation`、`remark`、刪除都改寫入 ProjectV2。
- `ImageCard.tsx` 的「與上圖合併」流程暫時移除（符合本階段可隱藏/停用要求）。
- `Footer.tsx` 改為接收 `itemCount`，顯示「共 N 張圖片」以 `ProjectV2` 排序清單計數為準。
- `Footer` 全部清除時改以 `onClearProject` 清空 ProjectV2 `items`、清空預設 layout `itemOrder`，同時清空 legacy `images`，避免輸出橋接殘留。
- 利用 `clearProjectItems(project)` helper 在 `src/state/projectState.ts` 清空預覽專用 project state。

## 修改 / 新增檔案

- `src/App.tsx`
- `src/features/ImagePreview/ImagePreview.tsx`
- `src/features/ImagePreview/ImageCard.tsx`
- `src/features/ImagePreview/ImageCardForMove.tsx`
- `src/layout/Footer.tsx`

## Source-of-Truth 切換說明

- 5C 以 `ProjectV2` + `layout_word_default.itemOrder` 為唯一排序與項目來源：
  - 預覽清單全部改用 `getOrderedItemViewModels(project, sessionId ?? '')`。
  - 拖曳排序只寫 `reorderItem`，更新 `layout.itemOrder`。
  - 刪除/備註/旋轉都改透過 `removeItem / updateItemRemark / updateItemRotation` 改 ProjectV2。
- `CustomImage[] images` 僅作 legacy 輸出橋接暫存：
  - 上傳保留透過既有 adapter 同步。
  - 在排序、刪除、備註、旋轉時同步更新 `setImages`。
  - 輸出元件本階段維持沿用 `images`，不改接手新版 schema。

## 更新行為明細

- 排序：`ImagePreview` 拖曳時，`setProject(prev => reorderItem(prev, activeId, overId))`，並同步 `setImages` 按 id 重排。
- 刪除：`ImageCard` / `ImageCardForMove` 直接呼叫 `removeItem(prev, itemId)`，清除 `ProjectV2.items` 並同步移除 `images` 對應 id。
- 備註：`ImageCard` submit on blur 時呼叫 `updateItemRemark(prev, itemId, remark)`。
- 旋轉：`ImageCard` 呼叫 `updateItemRotation(prev, itemId, rotation)`，值以 `viewModel.rotation` + ±90 更新。

## legacy `images` 保留 / 同步方式

- 保留：`CustomImage[] images` 目前僅作輸出 bridge。
- 同步：
  - 上傳流程維持 `toCustomImagesFromImportData` 產生 `images`。
  - 5C 內操作（排序、刪除、備註、旋轉）會更新 `setImages` 讓輸出橋接不落後。
  - 全部清除時，順帶 `setImages([])`。
- 保留給 5D：輸出流程、Word/另存圖片的真正項目來源切換。

## 驗證命令

- `pnpm -s tsc -b`：通過。
- `pnpm run build`：通過（仍有既有 chunk size warning）。
- `pnpm run lint`：失敗，既有 3 個 error（`src/layout/Test.tsx`, `src/utils/handleError.ts`, `src/utils/handleToast.ts`）與 3 個 warning，無新增 Phase 5C 相關 lint。
- grep 驗收：
  - `ImagePreview.tsx` 不再以 `images.map` 決定主要清單。
  - `ImagePreview.tsx` reorder 走 `reorderItem`。
  - `ImageCard.tsx` remark/rotation/delete 呼叫 ProjectV2 helper。
  - 刪除不呼叫後端 delete。

## 未完成 / Blocker

- 無 blocker；輸出流程 (`ModalOutput`, `SaveWord`, `SaveImages`) 接收 `images`，尚未改到 `ProjectV2`，預期保留到 5D。

## Hermes 驗收補充

- Hermes 端重讀 `ImagePreview.tsx` 後發現 OpenCode 版本在 `setProject` updater 內呼叫 `setImages`，屬於 React state updater 內副作用；Hermes 已修正為 `setProject(prev => reorderItem(...))` 與 legacy `setImages(arrayMove)` 分離。
- Hermes 端重跑 `pnpm -s tsc -b`：通過。
- Hermes 端重跑 `pnpm run build`：通過。
- Hermes 端重跑 `pnpm run lint`：仍只失敗於既有 3 errors / 3 warnings，未出現 Phase 5C 修改檔案 lint error。
- Hermes grep：`ImagePreview.tsx` 已不以 `images.map` 作為主清單；排序走 `reorderItem`；`ImageCard.tsx` / `ImageCardForMove.tsx` 的刪除/備註/旋轉皆走 ProjectV2 helper，且未呼叫後端 delete。
