---
type: deployment-guide
schema_version: 1
status: current
canonical: true
scope: image-pigeon
path_semantics: repository-root-relative
updated_at: 2026-08-24
---

# 純前端靜態主機部署指南

## 適用範圍

本文件說明如何以 HTTPS 靜態主機提供 `pnpm run build` 產生的 `dist/`。這是部署規格與驗證指南，不代表正式部署已獲核准或已執行。

正式應用程式只需要靜態檔案服務，不需要 Python、Node、FastAPI、uvicorn、資料庫、本機 HTTP server、寫入目錄或背景工作程序。Node 僅用於建置階段，不是正式執行階段依賴。

`vite.config.ts` 使用 `base: './'`，因此同一份 `dist/` 可掛載在 HTTPS 網站根目錄或子路徑，例如 `https://example.gov.tw/image-pigeon/`。不支援也不承諾直接以 `file://` 雙擊 `index.html`；必須由 HTTP(S) 靜態主機提供。

子路徑網址必須保留尾端斜線。主機應將 `/image-pigeon` 以 301 或 308 導向 `/image-pigeon/`；否則瀏覽器會把 `./assets/*` 相對於上一層路徑解析。上線前必須同時探測無尾端斜線的導向，以及尾端有斜線頁面的 JavaScript、CSS、Logo 與圖片回應。

## 建置與發布內容

```bash
pnpm install --frozen-lockfile
pnpm run test:frontend
pnpm run lint
pnpm run build
```

只發布 `dist/` 內的檔案。不要發布 `src/`、Python 原始碼、`node_modules/`、測試、Git 資料或本機設定。正式部署仍是獨立核准閘門，本文件不授權上傳或切換流量。

## MIME 類型

靜態主機至少必須回傳下列正確的 `Content-Type`：

| 副檔名 | MIME |
|---|---|
| `.html` | `text/html; charset=utf-8` |
| `.css` | `text/css; charset=utf-8` |
| `.js` | `application/javascript; charset=utf-8` |
| `.svg` | `image/svg+xml` |
| `.png` | `image/png` |
| `.jpg`／`.jpeg` | `image/jpeg` |

不要把 JavaScript 或 CSS 以 `text/plain` 提供，也不要為未知檔案回傳 `index.html` 後仍標示錯誤 MIME。

## 路由與 fallback

目前應用程式沒有由網址驅動的前端路由，載入入口只有實際存在的 `index.html`，因此不需要全域 SPA fallback。若靜態平台強制設定 fallback，只能對瀏覽器導覽請求回傳 `index.html`；`/assets/*`、圖片及其他有副檔名的不存在檔案必須維持 `404`，不得回傳 HTML 冒充資產。

## 快取與壓縮

- `index.html`：`Cache-Control: no-cache`，或 `max-age=0, must-revalidate`，確保能取得最新 hashed asset 清單。
- `/assets/*` 中含內容 hash 的檔案：`Cache-Control: public, max-age=31536000, immutable`。
- 未含內容 hash 的根目錄靜態檔，例如 `Logo.svg`：使用短快取並允許重新驗證，不得套用永久 immutable。
- 啟用 Brotli（`br`）與 gzip；優先即時或預壓縮 HTML、CSS、JavaScript、SVG。已壓縮的 JPEG／PNG 不必重複壓縮。
- 回應壓縮版本時保留 `Vary: Accept-Encoding`。

部署新版本時應先上傳新的 hashed assets，再原子替換或最後更新 `index.html`；回退時使用前一版完整 `dist/`，不要只回退 HTML。

## HTTPS 與安全標頭

正式環境必須使用 HTTPS，HTTP 應導向 HTTPS。建議由靜態主機回傳以下標頭：

```text
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
```

內容安全政策（Content Security Policy, CSP）的 `connect-src 'self'` 只允許同源讀取，不允許背景連線到外部 API。`font-src 'self'`、`script-src 'self'` 與 `style-src 'self'` 禁止第三方字型、腳本及樣式；目前版本不載入 Google Fonts，使用瀏覽器／作業系統字型。`style-src` 保留 `'unsafe-inline'` 是因既有 React UI 使用行內 style 屬性；不得擴張成第三方樣式來源。

若主機以子路徑提供應用程式，CSP 請以 HTTP response header 設定，不要新增會改變 URL 解譯的 `<base>` 標籤。

## 網路與零上傳邊界

圖片、專案及輸出資料全程留在瀏覽器記憶體或由使用者明確下載：

- 一般圖片與長截圖在瀏覽器以 Blob／Canvas 處理。
- `.ipigeon` 專案、圖片 ZIP 及 Word DOCX 都由 `URL.createObjectURL()` 建立本機下載，不從應用伺服器下載使用者內容。
- 列印／PDF 使用瀏覽器列印功能。
- 應用程式不得發出任何背景 `fetch`／XMLHttpRequest，也不得對圖片、專案或輸出內容發出 POST、PUT、PATCH、DELETE 或其他上傳請求。
- 使用者明確點擊聯繫作者、回饋表單、鴿手、交通鴿手或功能介紹中的原始碼連結後開啟外站，屬受控外部導覽。這些固定入口集中於 `browserExternalNavigation.ts`，新分頁一律使用 `noopener noreferrer`；導覽不包含專案、圖片、備註或應用程式狀態。
- 不得加入動態外部導覽、分析、telemetry、追蹤像素或遠端資源。
- `blob:`／object URL 是瀏覽器本機資料讀取，不是網路傳輸。

這個零上傳邊界不代表瀏覽器不會取得靜態資產；HTML、CSS、JavaScript、Logo 及圖片等同源 GET 是正常的靜態主機流量。

## 上線前驗證清單

1. 在乾淨環境執行前端測試、lint 與 production build。
2. 確認無尾端斜線的子路徑會 301／308 導向尾端有斜線的網址，且 `dist/index.html` 的 JavaScript、CSS、Logo 路徑可在該 HTTPS 子路徑解析。
3. 確認靜態資產 MIME、`Cache-Control`、`Content-Encoding`、`Vary`、CSP 與其他安全標頭。
4. 對不存在的 `/assets/*` 確認回傳 `404`，不是 `index.html`。
5. 在網路面板或有界攔截器執行匯入、編輯、專案儲存／開啟、圖片 ZIP、Word 及列印預覽；只允許同源靜態 GET 與本機 `blob:` 讀取，不得出現背景外部 API 請求。
6. 確認沒有 Python／Node runtime、本機監聽連接埠、資料庫或可寫入伺服器目錄。
7. 目標 Windows 11／Microsoft Edge／Microsoft 365 Word 的完整 UAT 仍依 C10 執行；其他平台成功不得替代該證據。

## 平台設定範例

以下只示意必要語意，實際語法依核准的靜態平台調整：

```nginx
location = /image-pigeon {
    return 308 /image-pigeon/;
}

location /image-pigeon/ {
    alias /srv/www/image-pigeon/;
    try_files $uri $uri/ =404;
}

location /image-pigeon/assets/ {
    alias /srv/www/image-pigeon/assets/;
    try_files $uri =404;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```

不要在此靜態站新增 `/api` reverse proxy、圖片上傳服務或 Python fallback。若部署平台無法正確提供相對資產路徑、MIME、安全標頭或 HTTPS，停止上線並先修正平台設定。
