# 照護方舟 ARKAI — 產品需求文件 (PRD)

> 版本：v0.2　│　日期：2026-07-07　│　階段：PRD / Spec
> v0.2 修訂：灘頭 ICP 收斂至「最抗拒上雲」機構（§2.1、§3.1）；補助銜接具體化（§4.2）；新增 MVP 驗證邊界、不對投資人超賣護城河（§4.2.1、§6.3）；地端 SOAP 硬體可行性由「已定」改回「待 P0 spike 驗證」（§4.4）。
> 基準文件：[系統設計文件 SDD](./照護方舟ARKAI_系統設計文件SDD.md)、[資料分析報告](./照護方舟ARKAI_資料分析報告.md)、[discuss.md](./discuss.md)
> 產品別名：照護方舟 ARKAI（投資人面）／日照中心小助理 MediGuard Flow（產品面）

---

## 1. Executive Summary

ARKAI 是給日照中心使用的**地端 Edge AI 照護助理**，用一台機構內 appliance 接收評估表、感測資料與語音紀錄，在本地完成開案風險/人力成本試算、即時預警、語音轉 SOAP、家屬聯絡簿草稿與去識別分流。MVP 目標是在 5 週內做出三個可展示、可驗收的核心畫面：**開案初篩器、智慧照護戰情牆、生成式 AI 護理紀錄助理**；除 SOAP 生成可暫用雲端 API 代打外，PII、預警、規則引擎、DB、去識別與 egress 稽核必須從第一週起真跑地端。

---

## 2. Problem Statement

### 2.1 Who Has This Problem

主要使用者是對個資、法規與照護人力壓力敏感的日照中心，尤其是負責收案、照護品質、行政紀錄與家屬溝通的機構負責人、護理長、護理師與照服員。

**早期灘頭（beachhead）**：不是「所有日照機構」，而是**對上雲最有顧慮、最抗拒把個資送雲端**的那一群——通常是負責人本人在意法遵風險、或有過個資事件陰影的機構。這是 ARKAI 地端物理隔離主張最能被立即理解、且競品雲端 SaaS 最難跟進的切入點；泛化到「一般想省時間的機構」會讓早期銷售與 demo 失焦。

### 2.2 What Is The Problem

日照中心每天要處理三種高摩擦工作：

1. **開案前難快速判斷能不能收**：機構需要同時評估跌倒風險、照護人力成本、收托紅線與現場量能。
2. **案中照護資訊分散**：生命徵象、離床/跌倒事件、照服員觀察、護理紀錄與家屬聯絡簿分散在不同流程，難以形成即時判斷。
3. **AI 上雲有個資與信任阻力**：雲端 AI 紀錄工具能省時間，但長照/醫療脈絡含 PII 與敏感臨床資料，對機構與法遵形成風險。

### 2.3 Why It Is Painful

- **照護風險**：離床、跌倒、BPSD 情緒/行為變化若不能即時提示，現場只能靠人巡與事後紀錄。
- **人力成本**：開案前無法用一致標準估算照顧負荷，容易收下超出量能的個案。
- **行政負擔**：SOAP、交班與家屬聯絡簿需要大量重複書寫。
- **合規壓力**：競品多以雲端 SaaS 為主，機構需要更容易解釋的「資料不出機構」方案。

### 2.4 Evidence And Assumptions

本 PRD 的 evidence 來自既有內部文件，而非外部重新研究：

- 資料分析報告定義兩大實務項：**確定是否開案**、**在案中個案的內容**。
- SDD 已凍結核心架構方向：**PII 不出 appliance、唯一去識別 egress、核心功能斷網可用**。
- discuss.md 已收斂 MVP 邊界：雲端 API 代打只限 SOAP 生成，且不可成為地端模型失敗時的退路。
- 臨床閾值、成本係數與收托紅線仍需合作機構護理長與財務校準。

---

## 3. Target Users & Personas

### 3.1 Primary Persona：日照中心負責人 / 護理長（對上雲最敏感者）

- **灘頭觸發**：本人在意個資/法遵風險、對「資料送雲端」有明確抗拒或曾有個資事件陰影——這是 ARKAI 最先要拿下的人。
- **目標**：快速判斷是否開案、避免超收高風險個案、降低事故與行政壓力，且**能對家屬/主管機關證明資料不出機構**。
- **痛點**：缺少一致的收案決策依據；法規與個資風險需要能對家屬/主管機關說明；雲端 AI 工具好用但不敢用。
- **成功狀態**：看到一位新個案時，能在同一畫面取得跌倒燈號、人力成本、排除條件與建議；且能指著機器說「資料就在這台、沒出去」。

### 3.2 Secondary Persona：護理師

- **目標**：快速完成 SOAP、交班與照護紀錄，但保留專業判斷權。
- **痛點**：口述資訊要重新整理成正式紀錄；AI 可能幻覺或編造生理數值。
- **成功狀態**：AI 產生 draft，O 欄數值有來源與時間戳，護理師確認後才入正式紀錄。

### 3.3 Secondary Persona：照服員

- **目標**：即時知道誰需要處理，並用最少輸入留下現場觀察。
- **痛點**：巡房、離床、服藥抗拒、情緒異常都靠人記，容易漏或延遲。
- **成功狀態**：戰情牆即時顯示紅/黃燈；語音口述即可生成可交班草稿。

### 3.4 Secondary Persona：家屬

- **目標**：看懂每天照護狀態與特殊事件。
- **痛點**：專業紀錄不易讀，機構手寫聯絡簿品質不穩定。
- **成功狀態**：收到白話、簡潔、經機構確認的每日聯絡簿內容。

### 3.5 Non-User Stakeholders

- **機構管理者 / 法遵**：需要稽核軌跡、零 PII egress 證明與權限控管。
- **硬體 / IoT 供應商**：未來需對接地端去識別閘道，但不屬於 MVP 主要使用者。

---

## 4. Strategic Context

### 4.1 Product Positioning

ARKAI 不是「Jubo + 照管家 + AIoT 監測」的功能拼裝，而是押注一個架構級差異：**在競品多以雲端資料集中為基礎時，先切入對上雲最敏感的日照機構，用地端物理隔離與去識別 egress 建立信任**。

### 4.2 Business Goals

- 驗證日照中心是否願意為「地端 AI + 個資不出機構」付費或進入場域試用。
- 用 5 週 MVP 支撐投資人 demo、場域討論與補助申請材料。**補助銜接具體化**：MVP 的場域驗證數據（斷網可用、零 PII egress、開案/預警實測）即為補助的實證彈藥（見資料分析報告 §8，場域驗證於評分佔比高）；申請入口以 **SBIR（隨到隨受理，最快）** 為第一順位，驗證獎勵 2026 梯次已截止。
- 建立後續平台化基礎：讓 ARKAI 成為機構內 IoT 與雲端常模庫之間的去識別閘道。

### 4.2.1 MVP 的驗證邊界（不要對投資人超賣）

> **本 MVP 驗證的是「隔離信任 + 減負價值」是否成立;它不驗證、也不宣稱已驗證更深的護城河**（跨機構常模庫的網路效應、多 IoT SDK 的閘道標準地位、創新者兩難）——那三項在 §8.3 明確排除於 MVP 範圍外，屬後續階段。對投資人/場域說明時，「能 demo」≠「護城河已成立」，兩者不可混為一談，以免驗收與盡職調查時被戳破。

### 4.3 Competitive Context

| 類型 | 代表 | ARKAI 差異 |
|---|---|---|
| 雲端 AI 紀錄 | Jubo AI | ARKAI 預設地端處理，雲端只處理去識別 payload |
| 日照管理 SaaS | 照管家 | ARKAI 聚焦即時預警、AI 紀錄與開案決策輔助 |
| AIoT 監測廠商 | 影像/軌跡/離床偵測系統 | ARKAI 把監測、紀錄、開案與去識別閘道整合在機構內 |

### 4.4 Why Now

- 長照機構行政與照護人力壓力上升，AI 紀錄有明確省時價值。
- 個資/資安壓力使純雲端方案在敏感機構面前有信任門檻。
- 低成本 mini-PC / Mac mini / GPU mini-PC **預期足以**承載短上下文 SOAP 生成（推估 NT$2.5–4 萬機器、3–6 秒離線出；見 discuss.md），地端 AI 的實作門檻正在下降。**注意**：此為本專案第一大待驗假設，須由 P0 本地 SOAP spike 實測確認（見 §9.2、FR-05），在 spike 通過前不得當作既定結論寫進對外材料。

---

## 5. Solution Overview

### 5.1 Product Concept

MVP 由一台日照中心內的地端主機提供核心服務。前端提供三個主畫面，後端提供評估規則、模擬感測串流、即時警報、語音轉 SOAP、聯絡簿草稿、去識別分流與稽核紀錄。

### 5.2 Core Screens

| Screen | Name | Primary User | Purpose |
|---|---|---|---|
| 1 | AI 門檻效益初篩器 | 負責人 / 護理長 | 輸入開案量表，輸出跌倒風險、人力成本、開案建議 |
| 2 | 智慧照護戰情牆 | 護理師 / 照服員 | 顯示所有個案即時狀態、離床/跌倒/生理警報 |
| 3 | 生成式 AI 護理紀錄助理 | 護理師 / 照服員 | 語音口述生成 SOAP，護理師確認後入檔 |

### 5.3 Core User Flows

#### Flow A：開案初篩

1. 使用者建立或選擇個案。
2. 輸入 Barthel、IADL、NPI-Q、認知、跌倒史、輔具、用藥等欄位。
3. 系統本地計算 fall_score、fall_light、care_weight、est_monthly_cost_twd、exclusion_hit。
4. 系統顯示開案建議與規則版本。
5. 使用者可保存評估結果，供後續追蹤。

#### Flow B：案中即時預警

1. 模擬手環/床墊事件送進 appliance。
2. 系統寫入 vital_reading / monitor_event。
3. 閾值引擎判斷是否觸發 yellow/red alert。
4. 戰情牆用 WebSocket 即時顯示警報。
5. 使用者 ack / resolve，系統寫入 audit_log。

#### Flow C：語音轉 SOAP

1. 照服員或護理師上傳/錄製語音。
2. 系統本地 ASR 轉逐字稿，NER 標記 PII。
3. SOAP 生成器產生 draft；O 欄數值只能從地端實測或人工量測帶入。
4. 護理師確認或修改。
5. 確認後寫入正式 nursing_note；必要時生成家屬聯絡簿草稿。

#### Flow D：去識別 Egress

1. 系統只從 deid_trend 或匿名術語查詢建立 outbound payload。
2. egress 閘道執行 regex + NER PII 掃描。
3. pass 才送出；fail 擋下並寫 egress_log。
4. UAT 必須能用抓包與 egress_log 證明零 PII 封包。

---

## 6. Success Metrics

### 6.1 Primary MVP Metric

**5 週內完成三畫面端到端 demo，且核心資料安全敘事可被驗收。**

可驗收標準：

- 開案初篩器可完成一筆個案評估並輸出跌倒燈號、人力成本、開案建議。
- 戰情牆可接收模擬事件並在離床 >10 分鐘時觸發 red alert。
- 護理紀錄助理可由語音/文字輸入產生 SOAP draft，並要求護理師確認。
- 斷網時開案、預警、SOAP draft、紀錄查詢仍可在地端執行。
- egress 測試中 PII payload 必須被擋下並留下 fail log。

### 6.2 Product / Operational Metrics

| Metric | MVP Target | Source |
|---|---:|---|
| 開案試算延遲 | <1s | SDD NFR |
| 即時警報延遲 | 事件到 alert <2s | SDD NFR |
| SOAP 生成延遲 | <6s（地端小模型目標） | SDD NFR |
| O 欄數值來源覆蓋率 | 100% O 欄生理數值需有 source + ts | SDD API |
| egress PII 放行率 | 0 | UAT |
| 核心功能斷網可用 | 100% | UAT |

### 6.3 Guardrail Metrics

- AI 不得自動下醫療診斷；所有 SOAP / 建議均為輔助，需人審。
- 雲端 API 代打不得接收真實 PII 或可重識別臨床脈絡。
- 若本地 SOAP spike 未通過，不能把「改全雲端」當作正式產品退路。
- 對外溝通不得把「MVP 能 demo」等同於「平台/常模庫網路效應護城河已成立」（見 §4.2.1）。

---

## 7. User Stories & Requirements

### 7.1 Epic Hypothesis

我們相信，為日照中心提供一套地端 Edge AI 照護助理，能降低開案決策不確定性與日常紀錄負擔，並用 PII 不出機構的架構降低 AI 導入阻力。成功與否以三畫面 demo、斷網可用、零 PII egress、護理師可確認 SOAP draft 作為 MVP 驗證。

### 7.2 Functional Requirements

#### FR-01 開案評估表

**As a** 護理長，**I want** 輸入標準量表與風險欄位，**so that** 系統能一致地評估個案收托風險。

Acceptance Criteria:

- [ ] 支援輸入 case_id、assessed_at、assessor、Barthel、IADL、NPI-Q、cognition、fall 欄位。
- [ ] Barthel 10 項分數可計算 total 與依賴分級。
- [ ] 高敏感 PII 不得寫入臨床/監測表，只能進 PII vault 或 demo 等效隔離層。
- [ ] 儲存評估時需記錄 ruleset_version。

#### FR-02 開案規則引擎

**As a** 日照中心負責人，**I want** 看到跌倒風險、人力成本與開案建議，**so that** 我能快速判斷是否收案。

Acceptance Criteria:

- [ ] 系統依資料分析報告 §4.3 計算 fall_score 與 green/yellow/red fall_light。
- [ ] 系統依資料分析報告 §4.4 計算 care_weight 與 est_monthly_cost_twd。
- [ ] 任一排除條件命中時，recommendation 必須為不建議收托或轉介。
- [ ] 未命中排除條件時，recommendation 必須由跌倒燈號 × 人力成本矩陣產出。
- [ ] 同一輸入重算結果必須可重現。

#### FR-03 智慧照護戰情牆

**As a** 照服員，**I want** 在一個畫面看到所有個案狀態，**so that** 我能先處理最急迫的人。

Acceptance Criteria:

- [ ] 顯示 active cases 的最新 vital status、alert level、last event time。
- [ ] 支援 green/yellow/red/emergency 視覺狀態。
- [ ] 支援模擬手環與床墊事件注入。
- [ ] 當 alert 狀態變更時，前端不需手動刷新即可更新。

#### FR-04 離床 / 生理警報

**As a** 護理師，**I want** 系統在離床過久或生理值異常時通知我，**so that** 現場能即時處理。

Acceptance Criteria:

- [ ] 離床 5-10 分鐘產生 yellow alert。
- [ ] 離床 >10 分鐘產生 red alert。
- [ ] 心率、SpO2、體溫、血壓可依初版閾值產生觀察/警示狀態。
- [ ] alert 可 ack、resolve，且記錄 ack_by_user_id、ack_at、resolved_at。
- [ ] WAN 斷線不影響本地警報。

#### FR-05 語音 / 文字轉 SOAP Draft

**As a** 護理師，**I want** 從口述快速生成 SOAP 草稿，**so that** 我能減少重複書寫。

Acceptance Criteria:

- [ ] 支援 audio_ref 或文字輸入產生 SOAP draft。
- [ ] SOAP 必須包含 S/O/A/P 四欄。
- [ ] O 欄的生命徵象數值只能引用 vital_reading 或人工量測資料，並附 source + ts。
- [ ] note status 初始必須為 draft。
- [ ] 護理師 confirmed 後才可進正式紀錄。
- [ ] cloud_polish_used 必須清楚標記 true/false。

#### FR-06 家屬聯絡簿草稿

**As a** 護理師，**I want** 從當日紀錄產生家屬版摘要，**so that** 家屬能看懂照護狀態。

Acceptance Criteria:

- [ ] 可彙整當日生理趨勢、活動、飲食、情緒與特殊事件。
- [ ] 產出必須是 draft，需人工確認後才 publish。
- [ ] 家屬版內容不得包含不必要的內部術語、PII 擴散或未確認診斷。

#### FR-07 地端 NER / 去識別分流

**As a** 法遵/資安負責人，**I want** 系統標記並攔截敏感資料，**so that** 個資不會外流。

Acceptance Criteria:

- [ ] 文字資料需標記姓名、身分證、地址、聯絡方式等高敏感 PII。
- [ ] 含 PII 或不確定內容必須留在 local 或進人工確認佇列。
- [ ] 去識別 payload 才可進 egress 流程。
- [ ] 每次 route decision 需寫 audit_log。

#### FR-08 Egress Gateway

**As a** 機構管理者，**I want** 所有對外資料都經過唯一出口，**so that** 我能稽核零 PII 外送。

Acceptance Criteria:

- [ ] 對外只允許 deid_trend 與匿名術語查詢兩類 payload。
- [ ] 出門前需執行 PII scan。
- [ ] scan fail 必須阻擋，不得送出。
- [ ] 每次 egress 需寫 egress_log，含 target、payload_class、pii_scan_result、bytes、dest_endpoint。
- [ ] WAN 斷線時 payload 進 outbox，恢復後以 idempotency_key 補送。

#### FR-09 RBAC / PII Vault

**As an** admin，**I want** 依角色限制資料存取，**so that** 只有授權者能看到敏感資料。

Acceptance Criteria:

- [ ] 支援 nurse、social_worker、caregiver、admin 角色。
- [ ] PII vault 讀取限 nurse/admin 或專案定義的等效最小權限角色。
- [ ] 每次 PII access 必須寫 audit_log。
- [ ] app_user 必須綁 tenant_id。

#### FR-10 Offline-First Core

**As a** 日照中心，**I want** 斷網時仍能使用核心功能，**so that** 照護不中斷。

Acceptance Criteria:

- [ ] 開案評估、規則試算、戰情牆、警報、SOAP draft 可在 WAN 斷線時執行。
- [ ] 雲端輔助功能失敗時，系統不可阻塞核心流程。
- [ ] 對雲資料需 store-and-forward，不得遺失或重複計算。

#### FR-11 體能鑑測卡（MVP 延伸）

**As a** 護理長，**I want** 看見個案活動量與體能趨勢，**so that** 我能評估自立支援效果。

Acceptance Criteria:

- [ ] MVP 可用模擬資料顯示步數、步速、靜息心率或心率恢復。
- [ ] 必須標示為輔助趨勢，不作醫療診斷。
- [ ] 可延後於三主畫面完成後實作。

### 7.3 Non-Functional Requirements

| Category | Requirement |
|---|---|
| Latency | 開案試算 <1s；警報 <2s；SOAP 生成目標 <6s |
| Availability | 核心臨床功能斷網 100% 可用 |
| Privacy | PII 不出機構；去識別 by construction |
| Security | HTTPS/WSS/mTLS；設備憑證；JWT session；RBAC |
| Auditability | audit_log / egress_log 可追溯，UAT 可驗零 PII egress |
| Scale | 單機構 20-60 位長輩、低併發 |
| Maintainability | ruleset_version、model_registry、LLMProvider 抽換層 |

---

## 8. MVP Scope

### 8.1 In Scope

- 開案量表輸入、跌倒風險燈號、人力成本試算、開案決策矩陣。
- 戰情牆 UI、模擬手環/床墊串流、離床/跌倒/生理閾值預警。
- 語音或文字轉 SOAP draft，O 欄數值來源綁定，護理師確認流程。
- 家屬聯絡簿草稿。
- 地端 DB、PII 隔離、基本 RBAC、audit_log。
- NER/regex 去識別展示。
- egress gateway、egress_log、零 PII UAT。
- LLMProvider 抽換層。
- 本地小模型 SOAP spike。

### 8.2 Simulated Or Stubbed In MVP

- 實體手環/床墊資料可用模擬串流代替。
- SOAP 生成可暫由雲端 API 代打，但僅限假資料或去識別資料。
- 體能鑑測卡可用模擬資料展示。
- 控制平面 / OTA / fleet 管理可做最小 mock 或文件化，不阻塞三畫面。

### 8.3 Out Of Scope For MVP

- 真實醫療器材認證或診斷功能。
- 跨機構常模庫完整產品化。
- 多 IoT 廠商正式 SDK 生態。
- 完整 OTA 模型更新平台。
- 生產級硬體 provisioning / TPM 量產流程。
- 家屬端完整 app；MVP 只需聯絡簿草稿或簡化展示。
- 政府補助申請文件完整包；PRD 僅支撐產品與 demo 範圍。

---

## 9. Dependencies & Risks

### 9.1 Dependencies

| Dependency | Needed For | Owner |
|---|---|---|
| 合作機構量表版本 | 開案表單欄位凍結 | 護理長 |
| 跌倒/成本校準資料 | fall_score、care_weight、k 值可信度 | 護理長 + 財務 |
| 本地 SOAP spike | 證明地端模型可行 | gray |
| LLMProvider 抽換層 | 雲端代打可退場 | gray |
| 感測設備型號 | BLE/MQTT/RS-485 實作細節 | 硬體 |
| 法遵/資安審查 | PII、egress、audit 驗收 | 法務 + 資安 |

### 9.2 Risks And Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| 本地 SOAP 品質不足 | 地端敘事受損 | P0 spike；限制任務為短上下文抽取+格式化；保留人審 |
| 雲端 API 代打變成正式退路 | 護城河被拆掉 | PRD 明定雲端代打只限 MVP 腳手架，UAT 前需替換 |
| NER 去識別漏抓 | PII 外洩 | regex + NER + fail-close；不確定走人工確認 |
| 閾值未校準造成誤報 | 現場不信任 | 初版標示為 demo/輔助；導入個人化 baseline |
| 成本試算被誤當報價 | 商務風險 | UI/文件標示為相對排序，需機構財務校準 |
| 硬體鏈路未定 | 實作延誤 | MVP 使用模擬注入，接口依 SDD API schema 先凍結 |

---

## 10. Open Questions

1. 雲端去識別平面與控制平面採 GCP、AWS、台灣 region 或自建？
2. 合作機構實際使用的 Barthel / NPI-Q / SPMSQ 版本是否與報告一致？
3. 收托排除條件是否要依機構建立可編輯設定？
4. 生理閾值個人化 baseline 在 MVP 要做到哪一層？
5. 本地 SOAP spike 的最低品質門檻是什麼？人工修改率、延遲或護理師主觀評分？
6. UAT 的 egress 抓包驗收由誰執行，驗收腳本是否需要進 repo？
7. 家屬聯絡簿是否要納入第一版 demo 必做，或排在三主畫面之後？
8. GitHub issue #3 的雲端代打邊界是否已由 PM 正式 ack？

---

## 11. 5-Week Delivery Plan

| Week | Deliverable | Exit Criteria |
|---|---|---|
| 1 | 資料模型、開案表單、LLMProvider 抽換層骨架 | 可儲存 assessment；可切換 local/cloud provider 介面 |
| 2 | 跌倒風險、人力成本、決策矩陣 | 畫面一可 demo；同輸入可重現同輸出 |
| 3 | 戰情牆、模擬串流、閾值/離床預警 | 畫面二可 demo；離床 >10 分鐘出 red alert |
| 4 | 語音/文字轉 SOAP、O 欄帶入、確認流程 | 畫面三可 demo；draft/confirmed 狀態可追蹤 |
| 5 | NER 遮蔽、egress 稽核、體能卡、整體打磨 | 斷網測試與零 PII egress 測試可通過 |

---

## 12. Acceptance Checklist

- [ ] 三個核心畫面可串成一段完整 demo。
- [ ] 開案結果包含 fall_score、fall_light、care_weight、est_monthly_cost_twd、recommendation、ruleset_version。
- [ ] 戰情牆可由模擬事件觸發 yellow/red alert。
- [ ] SOAP draft 必須經護理師確認才入正式紀錄。
- [ ] O 欄所有生理數值都有 source + ts。
- [ ] WAN 斷線時核心流程仍可用。
- [ ] egress 只允許去識別 payload。
- [ ] PII scan fail 時 payload 被阻擋並寫 egress_log。
- [ ] audit_log 可追蹤 PII access、route decision、soap_confirm、egress。
- [ ] 文件需與 SDD 的 API schema、DDL、NFR 不矛盾。

---

## 13. Source Mapping

| PRD Section | Source |
|---|---|
| Problem / Positioning | 資料分析報告 §0-§2、discuss.md |
| Solution / Flows | SDD §1、資料分析報告 §3-§5 |
| Data / API Constraints | SDD §1.3、§2 |
| Security / Egress | SDD §3、discuss.md |
| NFR / UAT | SDD §4、§5、discuss.md |
| MVP Build Order | 資料分析報告 §7 |

---

### 文件序與同步（治理）

本專案的產出順序是 **SDD 先、PRD 後**（與慣例 PRD→SDD 相反）——因為技術架構在 discuss.md 先收斂並凍結成 SDD v0.1，PRD 再回頭補上 what/why 與驗收。這不是錯誤，但代表**兩份很容易漂移**，故定下分域仲裁與同步規則：

- **分域仲裁**：API schema、DDL、通訊協定、資安、NFR 衝突 → **以 SDD 為準**；產品範圍、使用者價值、優先序、驗收條件衝突 → **以本 PRD 為準**。（不是「SDD 永遠贏」，而是各管各的域。）
- **同步規則**：任一改動涉及對方文件（例：PRD 新增一條 FR 影響 DDL，或 SDD 改 API 欄位影響 §7 驗收），**須在同一次提交同時更新兩份**，並更新下方「上次對帳」日期。
- **對帳錨點**：§13 Source Mapping 是兩份的對照表，維持它即維持同步。

*上次對帳：2026-07-07，SDD v0.1 ↔ PRD v0.2，無已知衝突。*
