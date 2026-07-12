# ARKAI

照護方舟前端專案，負責「開案前 / 福利資格判定」中的資格輸入與證明文件參照上傳頁面。

## 技術

- React
- TypeScript
- Vite
- Docker
- Nginx

## 本機開發

```powershell
pnpm install
pnpm dev
```

預設開發網址：

```text
http://localhost:5173
```

## 建置

```powershell
pnpm build
```

## Docker 執行

```powershell
docker compose up --build
```

預設會把網站掛在：

```text
http://localhost
```

## Ubuntu Server 部署方向

之後伺服器可以從 GitHub 取得專案後執行：

```bash
docker compose up --build -d
```

目前 `nginx.conf` 已預留：

```text
wkbarret.com
www.wkbarret.com
```

DNS A record 指到 Ubuntu 伺服器 IP 後，即可先用 HTTP 連線。HTTPS 憑證可在正式部署時補上。
