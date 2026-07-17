# 照護方舟 ARKAI

ARKAI 是照護團隊使用的前端原型，整合福利資格判定、證明文件參照、家庭支持評估、家系圖、生態圖與生理需求評估。

團隊既有的需求、架構與設計文件保留在 [`arkai-daycare-mvp-main/`](./arkai-daycare-mvp-main/) 目錄。

## 技術架構

- React 19
- TypeScript
- Vite
- React Flow
- Docker
- Nginx

## 本機開發

```powershell
pnpm install
pnpm dev
```

開發伺服器預設網址：

```text
http://localhost:5173/           官方網站
http://localhost:5173/app        系統原型
http://localhost:5173/variant-b  AI 科技平台版本
http://localhost:5173/variant-c  溫暖照護品牌版本
```

## 程式檢查

```powershell
pnpm lint
pnpm build
```

## Docker

```bash
docker compose up --build -d
```

容器啟動後可從 `http://localhost` 開啟。Nginx 設定已預留 `wkbarret.com` 與 `www.wkbarret.com`。

## 目前資料儲存方式

家系圖、生態圖及生理需求補充欄位目前使用瀏覽器 `localStorage` 儲存，並支援 JSON 匯入與匯出。文件上傳目前為前端暫存預覽；正式跨裝置保存仍需串接後端 API 與檔案儲存服務。
