# 2026-07-03-0948 列印預覽 / PDF 流程結果

## 完成項目
- 建立 `src/features/PrintPreview/*` 列印預覽功能模組：
  - `printLayout.ts`：列印設定型別、圖片編號與 slot 對應工具
  - `usePrintImageReadiness.ts`：追蹤圖片載入完成 / 失敗狀態，供列印按鈕控制
  - `PrintableSlot.tsx`：列印 slot 元件，呈現圖片、編號與備註
  - `PrintablePage.tsx`：按五種 auto-collage template 輸出 A4 頁面
  - `PrintableDocument.tsx`：組裝整體可列印文件
  - `PrintPreviewView.tsx`：全頁預覽主視圖與「返回編輯 / 列印 / 另存PDF」動作
  - `printPreview.css`：預覽與 `@media print` A4 樣式
- 整合 app state：`App.tsx` 加入 `editor` / `print-preview` 狀態切換，預覽 mode 直接顯示不含 Nav/Sidebar 的全頁 `PrintPreviewView`。
- 透過輸出 modal 導入：
  - `layout/Sidebar.tsx` 新增 `onPrintPreview` 事件傳遞
  - `features/Output/ModalOutput.tsx` 新增「預覽列印 / PDF」tab，關閉 modal 後切到列印預覽
  - 提供列印標題、說明文字對齊、字體大小設定，帶入同一份正式預覽 DOM
- 文件更新：`README.md` 在 `What's New` 與「特色功能」新增列印預覽 / 另存 PDF 項目。
- 新增 `.gitignore` 忽略 root `web_cache/`，避免本機 session 暫存圖被誤提交。

## 修改檔案
- `.gitignore`
- `README.md`
- `src/App.tsx`
- `src/layout/Sidebar.tsx`
- `src/features/Output/ModalOutput.tsx`
- `src/features/PrintPreview/index.ts`
- `src/features/PrintPreview/PrintPreviewView.tsx`
- `src/features/PrintPreview/PrintableDocument.tsx`
- `src/features/PrintPreview/PrintablePage.tsx`
- `src/features/PrintPreview/PrintableSlot.tsx`
- `src/features/PrintPreview/printLayout.ts`
- `src/features/PrintPreview/printPreview.css`
- `src/features/PrintPreview/usePrintImageReadiness.ts`
- `docs/plans/2026-07-03-0948-print-preview-pdf.md`
- `docs/plans/2026-07-03-0948-print-preview-pdf-opencode-workorder.md`

## 驗證
- `pnpm run lint`
  - 成功，無報錯
- `pnpm run build`
  - 成功通過 TypeScript 檢查與 Vite 打包
- `python3` 靜態 contract 檢查
  - 確認未新增 `react-router` dependency
  - 確認前端使用 `window.print()`
  - 確認未新增 `/api/export/pdf` 呼叫
  - 確認 `App.tsx` 以 `viewMode === 'print-preview'` 切到全頁預覽
  - 確認五種 auto-collage template 字串仍存在於列印路徑
- Browser smoke：`pnpm run dev -- --host 127.0.0.1 --port 5173`
  - 首頁可載入，左側操作列與 README 新增的「預覽列印 / 另存 PDF」文案可顯示
  - browser console 無 JavaScript error

## 手動 Smoke 測試（待執行）
- 開啟輸出檔案 modal，點選「預覽列印 / PDF」tab。
- 確認進入全頁預覽，圖片載入完成後「列印 / 另存PDF」可點擊。
- 點選「列印」後 `window.print()` 導向系統列印面板。
- 點選「另存PDF」確認顯示提示與啟動列印對話框。
- `返回編輯` 後回到原本編輯畫面，專案順序維持不變。

## 未完成 / 待補強
- 尚未在 pywebview macOS / Windows packaged app 內實機確認 `window.print()` 對系統列印對話框的行為。
- 尚未做 Word 輸出版與前端列印版逐頁視覺比對；目前目標是接近現行 Word 排版，不承諾 pixel-perfect。
