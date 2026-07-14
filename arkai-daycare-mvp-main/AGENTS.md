# AGENTS.md — AI 協作規約（人與 AI 共用正本）

> 給**所有 AI 協作工具**在動這個 repo 前讀的規約，人也適用。
> 目的：5 個人用 5 種不同的 AI（Claude Code / Cursor / Copilot / Codex / 網頁版 ChatGPT・Claude・Gemini），產出仍收斂在同一份規格、同一條流程上。
>
> **接線方式**：Cursor / Copilot / Codex 會自動讀本檔；Claude Code 經 `CLAUDE.md` 載入；**用網頁版 AI 的人，開工先把本檔全文貼進對話**。

## 1. 權威鏈（衝突時誰說了算）

| 問題 | 正本 | 規則 |
|---|---|---|
| 做什麼、何時做（範圍/排程） | [PM 甘特圖](https://docs.google.com/spreadsheets/d/1bf4ZHbd4LKtcgKQ41dK05Nljj_hrE7RrIK_xcZdKdQQ/edit)（issue #2，PM＝Barret） | 不在甘特圖上的功能＝不做。想加 → 開 issue 問 PM，不要讓 AI「順手」加 |
| 怎麼做（DDL / API / 協定 / 資安） | [SDD](./照護方舟ARKAI_系統設計文件SDD.md) | 程式必須對齊 SDD。要改 → **先改 SDD 再寫碼**（PR 標題加 `spec:`） |
| 驗收什麼（FR / NFR） | [PRD](./照護方舟ARKAI_產品需求文件PRD.md) | 技術域衝突以 SDD 為準、產品範圍以 PRD 為準（分域仲裁見 PRD 文末） |
| 業務規則（量表邏輯、權重、門檻、開案評估） | **PM 提供的 spec 與 raw-data**（待交付） | 這是社工專業域，PM spec 未到之前**不得讓 AI 用猜的先寫死**；資料分析報告裡的公式（§4.3/§4.4）是佔位假設，落地一律掛 `ruleset_version` 版本化 |
| 已經決定了什麼 | [discuss.md](./discuss.md) ＋ GitHub issues | **和 AI 聊天裡拍板的事不算數**——落進 discuss.md 或 issue 才算團隊決策 |

## 2. 分支政策

**不要直接在 `main` 修改或 push。所有變更：開分支 → 提交 → 對 `main` 發 Pull Request → 由 gray review / merge。**

- 適用所有協作者（achunitechh、wkbarret-eng、allenlee564、taiyuhuang591-lang）。唯一例外：repo owner **gray（Graylee0128）**。
- 本 repo 是免費私有 repo，branch protection 被付費牆鎖住、無法技術強制——此政策靠**團隊約定 + git 可 rollback** 執行。
- ⚠️ **任何情況都不要對 `main` force-push**（會改寫歷史，rollback 安全網就失效）。要修正歷史用 `git revert`。
- 日後 owner 升 GitHub Pro 即可用 ruleset 自動強制本節。

```bash
git switch -c feat/你的主題        # 從最新 main 開分支（feat/ fix/ docs/ chore/）
# ...改動、commit（訊息格式 <type>: <描述>）...
git push -u origin feat/你的主題
gh pr create --base main           # reviewer = Graylee0128，不自行 merge
```

## 3. AI 使用鐵則（防漂移核心）

1. **最小 diff**：禁止讓 AI 重寫、重排、重新生成整份既有檔案——只改需要的行。（2026-07-07 的格式毀損事故就是這樣來的。）
2. **不自創 schema / API**：資料表照 SDD §2.2 DDL、介面照 SDD §1.3 JSON Schema。欄位不夠用 → 開 `spec:` PR 改 SDD，不要讓 AI 現場發明。
3. **不建平行文件**：新增 .md 前先找既有檔案；同一主題只有一個正本。AI 想「幫你整理一份新的總覽」時，拒絕它。
4. **測試資料一律合成假資料**：真實個資（姓名、身分證、地址、電話、病歷）禁止進 repo、進 prompt、進任何雲端 AI。這條同時是產品護城河（地端 PII 不出門）的開發紀律版。
5. **禁止硬編密鑰**：API key / 密碼 / token 一律走環境變數。CI 有密鑰掃描，掃到直接紅燈。
6. **新增任何對外網路呼叫必須走 egress 閘道**（SDD §3.4），不得繞道直連。
7. **PR 錨定甘特圖**：標題格式 `[甘特#N·職位] 描述`（N=1–19，職位=資料庫/後端/前端/資安），例：`[甘特#12·後端] 閾值引擎與警報觸發`。
8. **PR 保持小**：單一 PR 目標 ≤ 400 行 diff（純文件除外）；大功能拆多個 PR。AI 一次吐兩千行 = 拆。
9. **業務邏輯不搶跑**：開案評估等社工域的邏輯與權重，等 PM spec 到了才實作；等待期間可以先做不依賴 spec 的部分（資料表、API 骨架、測試假資料產生器），把權重留成 `ruleset_version` 可換的設定，不寫死。

## 4. Definition of Done

程式對齊 SDD ＋ 附單元測試 ＋ PR 模板 checklist 全勾 ＋ CI 綠燈 ＋ gray merge。缺一即不算完成。
