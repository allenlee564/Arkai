# ARKAI

照護方舟前端專案，包含對外產品官網與「開案前 / 福利資格判定」系統原型。

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
http://localhost:5173      # 產品官網
http://localhost:5173/app  # 系統原型
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

## 網站路徑

```text
/      對外產品介紹首頁
/app   福利資格判定與證明文件參照系統原型
```
