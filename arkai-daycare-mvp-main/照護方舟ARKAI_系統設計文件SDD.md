# 照護方舟 ARKAI — 系統設計文件 (SDD)

> 版本：v0.2　│　日期：2026-07-07　│　階段：SD（System Design，重中之重）
> 關聯文件：資料分析報告（需求與臨床邏輯）、discuss.md（討論結論）、GitHub issue #3（地端 AI 閹割版）、架構圖 *.mermaid（本文不重畫）
> 對應評分框架：①架構設計　②資料庫與資料結構　③資安與防護

---

## 目錄

- [0. 文件目的與範圍](#0-文件目的與範圍) — 一句話定位
- [1. 架構設計](#1-架構設計)
  - [1.1 系統分層與組件（前端/後端/雲端/硬體端 Edge）](#11-系統分層與組件前端後端雲端硬體端-edge)
  - [1.2 通訊協定設計（逐條鏈路）](#12-通訊協定設計逐條鏈路)
  - [1.3 資料格式定義（JSON API Schema）](#13-資料格式定義json-api-schema)
  - [1.4 端到端資料流](#14-端到端資料流)
- [2. 資料庫與資料結構設計](#2-資料庫與資料結構設計)
  - [2.1 ER Model（實體與關聯）](#21-er-model實體與關聯)
  - [2.2 資料表設計（DDL）](#22-資料表設計ddl)
  - [2.3 硬體資料暫存與斷線補傳機制](#23-硬體資料暫存與斷線補傳機制)
- [3. 資安與防護設計](#3-資安與防護設計)
  - [3.1 傳輸安全](#31-傳輸安全)
  - [3.2 認證與授權](#32-認證與授權)
  - [3.3 設備安全與金鑰管理](#33-設備安全與金鑰管理)
  - [3.4 去識別 egress 契約（ARKAI 專屬）](#34-去識別-egress-契約arkai-專屬)
- [4. 非功能需求（NFR）](#4-非功能需求nfr)
- [5. MVP 閹割版範圍](#5-mvp-閹割版範圍)
- [6. 風險與待確認](#6-風險與待確認)
  - [6.x 🆕 不填表匯入架構 —— 可行性分析](#6x--不填表匯入架構--可行性分析)
- [附錄：Enum 定義與名詞](#附錄enum-定義與名詞)

> **v0.2 變更說明**：新增「入住前評估報告（面談前置流程）」——涵蓋福利資格判定、家庭支持評估、生理需求評估補充欄位、ICOPE 評估、面談輔助報告；並新增「不填表匯入架構」可行性分析。新增內容於各處以 🆕 標示，不影響 v0.1 既有規格；重複/衝突欄位已於表格註解中標明口徑差異。

---

## 0. 文件目的與範圍

把需求（資料分析報告）轉化為「怎麼做（How）」的工程規格，供 PG（實作）階段照著刻。架構總圖已存在於 repo 的 `arkai_multitenant_v2.mermaid`（三平面）與 L0–L6 資料流圖，本文不重畫，改以文字、資料表 schema、JSON API 規格、時序補完設計細節。

> **一句話系統定位**：機構內一台地端主機（appliance）吃下感測資料，在本地完成 AI 推理、預警、去識別；PII 永不出機構；只有去識別化的趨勢/術語經唯一 egress 閘道上雲。

---

## 1. 架構設計

### 1.1 系統分層與組件（前端/後端/雲端/硬體端 Edge）

本系統有兩層硬體端，這是與一般「device 直連雲」IoT 的關鍵差異：

| 層 | 組件 | 職責 | 部署位置 | 技術（建議） |
|---|---|---|---|---|
| 硬體端 · 感測層 | 智慧手環 | HR/SpO₂/加速度（跌倒） | 長輩身上 | BLE |
| 硬體端 · 感測層 | 智慧床墊 / 雷達 | 離床/呼吸/非接觸心率 | 床邊 | MQTT/TLS 或 RS-485 |
| 硬體端 · 地端主機（★核心） | Ingestion 服務 | 收端點資料、綁 case_id、落 raw | 機構內網 appliance | Mini-PC / Mac mini / Jetson |
| 硬體端 · 地端主機 | AI 服務（地端小模型 + NER + ASR） | SOAP 生成、去識別、量表輔助 | appliance | Ollama + Qwen2.5-7B Q4、faster-whisper |
| 硬體端 · 地端主機 | 規則/閾值引擎 | 開案燈號、人力成本、即時預警 | appliance | 純程式邏輯 |
| 硬體端 · 地端主機 | 地端 RAG | 院內 SOP/照護指引檢索 | appliance | pgvector |
| 硬體端 · 地端主機 | 本地資料庫 | 見 §2 | appliance | PostgreSQL(+Timescale+pgvector) / SQLite |
| 硬體端 · 地端主機 | egress 閘道 | 唯一對外出口，只出去識別資料 | appliance | 見 §3.4 |
| 前端 | 機構智慧照護戰情牆 | 即時狀態、警報、開案初篩、SOAP 助理 | 機構內平板/PC | Web（React）+ WebSocket |
| 前端 | 家屬聯絡簿 | 家屬版每日彙整 | 家屬手機 | Web/推播 |
| 雲端 · 去識別資料平面 | 雲端 LLM 輔助 | 文獻/術語摘要/護理措辭潤稿 | GCP/AWS/自建 | 只收去識別資料 |
| 雲端 · 去識別資料平面 | 去識別常模庫 | 跨租戶趨勢常模（網路效應） | 雲 | 不含 case 連結 |
| 雲端 · 控制平面 | Fleet 管理 | OTA、監控、設定下發、多租戶 RBAC | 雲 | 只中繼、不碰資料 |

> **雲端選型（待確認）**：兩個雲端平面只承載去識別資料，選型限制低（GCP/AWS/自建皆可）。但基於本地信任訴求，建議資料落地台灣 region 或自建。詳見 §6。

### 1.2 通訊協定設計（逐條鏈路）

| # | 鏈路 | 協定 | 方向 | 資料類 | 安全 |
|---|---|---|---|---|---|
| L-a | 手環 → 地端主機 | BLE (GATT) | 上行 | 生理串流 | BLE 配對綁定金鑰 |
| L-b | 床墊/雷達 → 地端主機 | MQTT over TLS (MQTTS) 或 RS-485 序列 | 上行 | 事件/串流 | MQTTS + 每設備憑證 |
| L-c | 語音 → 地端主機 | 端點錄音上傳 → 本地 ASR | 上行 | 語音（含 PII） | 不出機構，本地轉逐字稿 |
| L-d | 前端戰情牆 ↔ 地端主機 | HTTPS REST（查詢/提交）+ WebSocket（即時警報推播） | 雙向 | 臨床資料 | TLS + JWT session（RBAC） |
| L-e | 地端主機 → 去識別平面 | HTTPS REST + mTLS（批次上傳） | 僅上行 | 去識別趨勢/術語查詢 | mTLS + 簽章 + egress 掃描 |
| L-f | 地端主機 ↔ 控制平面 | HTTPS REST + mTLS（appliance 主動 pull）+ heartbeat | 雙向（中繼） | 設定/OTA/監控 metadata | mTLS + JWT，不碰資料 |

**設計原則**：

- 感測層只跟本地 appliance 說話，不直連雲（縮小攻擊面）。
- appliance 對雲一律主動 outbound（pull config、push egress），雲端無法主動連入 appliance → 防火牆只開出站，機構不需 IT 開孔。
- 即時警報走 WebSocket 推到戰情牆（毫秒級），不用前端輪詢。

### 1.3 資料格式定義（JSON API Schema）

統一 JSON。以下為關鍵 API 欄位規格（實作前凍結）。

**① 感測上報**（手環/床墊 → appliance；MQTT topic `tenant/{tid}/case/{cid}/vital`）

```json
{
  "device_id": "wb-00A3",
  "case_id": "C-0007",
  "ts": "2026-07-07T14:05:00+08:00",
  "seq": 48213,
  "metric": "hr",              // hr|spo2|temp|bp_sys|bp_dia|steps|activity
  "value": 82,
  "unit": "bpm",
  "quality": "ok"               // ok|weak|dropout
}
```

**② 監測事件**（床墊/雷達）

```json
{
  "device_id": "bed-03", "case_id": "C-0007", "ts": "2026-07-07T14:03:00+08:00",
  "seq": 991, "type": "out_of_bed", "duration_sec": 720, "payload": {}
}
```

**③ 開案評估提交**（戰情牆 → appliance；`POST /api/v1/assessments`）

```json
// 請求
{
  "case_id": "C-0007", "assessed_at": "2026-07-07T09:30:00+08:00", "assessor": "u-12",
  "barthel": { "feeding":10,"bathing":0,"grooming":5,"dressing":5,"bowels":10,
               "bladder":5,"toilet":10,"transfers":15,"mobility":10,"stairs":5 },
  "iadl": { "total": 3 },
  "npiq": [ {"symptom":"anxiety","severity":2}, {"symptom":"depression","severity":2} ],
  "cognition": { "tool":"SPMSQ", "errors":3 },
  "fall": { "falls_3m":1, "aid":"walker", "sedative":false }
}
```

```json
// 回應（derived，見報告 §4）
{
  "case_id":"C-0007","fall_score":40,"fall_light":"yellow",
  "care_weight":1.80,"est_monthly_cost_twd":4600,
  "exclusion_hit":false,"recommendation":"evaluate_capacity","ruleset_version":"fall-1.0"
}
```

**④ SOAP 生成**（戰情牆 → appliance；`POST /api/v1/nursing-notes:generate`）

```json
// 請求
{ "case_id":"C-0007", "audio_ref":"blob://audio/2026/07/07/abc.wav", "locale":"zh-Hant" }
```

```json
// 回應（O 欄數值附來源+時間戳，防幻覺；status=待護理師確認）
{
  "note_id":"N-5521",
  "soap":{
    "S":"服藥抗拒、情緒不佳",
    "O":"BP128/78(量測 09:10 帶入)、HR82、SpO2 97%；服藥抗拒行為",
    "A":"疑似 BPSD 服藥配合度議題，非生理急性異常",
    "P":"觀察情緒；調整服藥引導；交班護理師"
  },
  "o_values":[ {"metric":"bp","value":"128/78","source":"manual","ts":"09:10"} ],
  "llm_provider":"local", "cloud_polish_used":false, "status":"draft"
}
```

**⑤ 警報推播**（appliance → 戰情牆；WebSocket）

```json
{
  "alert_id":"A-8890","case_id":"C-0007","level":"red","type":"out_of_bed",
  "raised_at":"2026-07-07T14:13:00+08:00","message":"3 號床離床 >10 分"
}
```

**⑥ 去識別趨勢上傳**（appliance → 去識別平面；`POST /v1/deid-trends`，mTLS）

```json
{
  "node_id":"node-A1", "tenant_pseudo":"t-9f2a",
  "cohort":{ "age_band":"80-84","sex":"F","cms":5 },   // 無 case_id、無 PII
  "metric":"resting_hr", "window":"7d", "trend":-8,
  "computed_at":"2026-07-07T02:00:00+08:00", "sig":"<ed25519>"
}
```

**⑦ 🆕 面談前置評估報告生成**（戰情牆 → appliance；`POST /api/v1/pre-interview-report:generate`）

> 本 API 發生在「③開案評估提交」**之前**，目的是在入住面談前，先把福利資格、家庭支持、生理需求、ICOPE 四大構面資料彙整成一份面談輔助報告，供評估人員帶去面談確認，**不等同正式開案決定**。

```json
// 請求
{
  "case_id": "C-0102",
  "eligibility": {
    "age": 68, "category": "disabled_elderly",   // disabled_elderly|indigenous_disabled|dementia|physical_disability|welfare_status
    "cert_ref": "身障手冊-2026-xxxx"
  },
  "family_support": {
    "genogram_ref": "blob://genogram/2026/07/07/g1.json",
    "ecomap_ref": "blob://ecomap/2026/07/07/e1.json",
    "family_support_level": "medium",     // low|medium|high
    "caregiver": { "type": "foreign_caregiver", "hours_per_week": 40 },
    "ltc_capacity_level": 5                // 對應 case.cms_level 口徑
  },
  "physical_needs": {
    "mobility": "walker_assisted",
    "skin_integrity": { "pressure_injury": false, "redness": false, "wound": false, "note": "" },
    "cognition_ref": "assessment_id:A-2201",     // 沿用既有 cognition 表
    "vision_hearing": { "vision": "impaired_corrected", "hearing": "normal" },
    "depression_screen": { "tool": "GDS-5", "score": 2 },
    "life_background": "獨居，子女假日探視",
    "barthel_ref": "assessment_id:A-2201",       // 沿用既有 barthel_score 表
    "sppb_ref": "fitness_assessment_id:F-3301"   // 沿用既有 fitness_assessment 表
  },
  "icope": {
    "domains": { "cognition": 1, "mobility": 1, "vision": 0, "hearing": 0, "malnutrition": 0, "depression": 1 },
    "case_status": "pre_intake"           // pre_intake|active|discharged|referred
  }
}
```

```json
// 回應（供評估人員列印/攜帶去面談；非最終開案決定，僅輔助）
{
  "report_id": "PIR-0088",
  "case_id": "C-0102",
  "generated_at": "2026-07-07T10:00:00+08:00",
  "eligibility_result": { "pass": true, "matched_category": "disabled_elderly" },
  "summary": {
    "family_support_flag": "medium_support_recommend_home_visit",
    "physical_risk_flag": "fall_risk_moderate",
    "icope_flag": "cognition_and_depression_watch"
  },
  "interview_focus_points": [
    "確認皮膚壓傷史與居家照顧人力",
    "確認憂鬱情緒篩檢分數是否需精神科轉介",
    "確認家系圖中主要照顧者穩定度"
  ],
  "status": "draft_for_interview"
}
```

### 1.4 端到端資料流

詳細 input→logic→output trace 見報告 §3.3–3.5（L0–L6 管線）。此處補網路鏈路視角的三條主流：

**A. 案中語音 → SOAP**

```
手環串流(L-a,BLE) ┐
床墊事件(L-b,MQTTS)├→ [appliance] L1 落 raw → L2 NER → L3 分流(含PII，LOCAL)
照服員語音(L-c) ───┘        → 本地 ASR → 地端小模型組 SOAP(O 欄帶入手環實測)
                            → 寫 nursing_note(status=draft) → WebSocket(L-d) 推戰情牆
                            → 護理師確認 → 入正式檔 → (可選) A/P 去識別後經 egress(L-e) 上雲潤稿
```

**B. 即時離床預警**（安全關鍵，全程本地、斷網照跑）

```
床墊事件(L-b) → L1 → L3(串流) → 閾值引擎(離床>10min) → 寫 alert(red)
             → WebSocket(L-d) 推戰情牆閃紅+嗶聲   [不經任何雲端，WAN 斷線不受影響]
```

**C. 🆕 入住前面談評估 → 面談輔助報告**（發生在開案評估提交之前）

```
五大構面資料輸入(福利資格/家庭支持/生理需求/ICOPE) ─┐
（人工填表 或 §6.x 不填表匯入來源）                  ├→ [appliance] 彙整計算
                                                     → 產出 pre_interview_report(status=draft_for_interview)
                                                     → 前端列印/攜帶去面談
                                                     → 面談後人工確認 → 轉入正式 assessment（既有 ③開案評估提交流程）
                                                     → 產出 admission_result（既有欄位，做最終開案決定）
```

> **設計原則**：本流程先於「③開案評估提交」，面談輔助報告不等於開案決定，僅供評估人員帶去面談時參考；面談後才走既有開案評估流程產生正式 `admission_result`。

---

## 2. 資料庫與資料結構設計

**DBMS 選型**：地端主機用 PostgreSQL 16（+ TimescaleDB 生理時序、+ pgvector RAG）；最小封裝可退回 SQLite（去掉 Timescale/pgvector，改檔案式向量）。以下 DDL 以 PostgreSQL 表述。

> **核心設計原則 — PII 與臨床資料分離**：`case_id` 是內部代號（pseudonym）；真實 PII 只存在 `pii_vault`（欄位級加密）。所有臨床/監測表只引用 `case_id`，達成「去識別 by construction」——匯出/egress 走臨床表時天生不帶身分。

### 2.1 ER Model（實體與關聯）

| 父實體 | 關聯 | 子實體 | 基數 | 說明 |
|---|---|---|---|---|
| case | 1–1 | pii_vault | 1:1 | PII 隔離，加密 |
| case | 1–N | chronic_condition | 1:N | 慢性病清單 |
| case | 1–N | assessment | 1:N | 多次開案/複評 |
| assessment | 1–1 | barthel_score / iadl_score / cognition / fall_history / admission_result | 1:1 | 各量表與衍生結果 |
| assessment | 1–N | npiq_symptom | 1:N | BPSD 多症狀 |
| case | 1–N | vital_reading / monitor_event / alert / nursing_note / contact_book / fitness_assessment | 1:N | 案中資料 |
| app_user | 1–N | nursing_note(author) / alert(ack) | 1:N | 護理師/照服員 |
| sop_document | 1–N | sop_chunk | 1:N | RAG 知識庫 |
| deid_trend | — | （無 FK 到 case） | — | 去識別，不可回連個人；唯一 egress 表 |
| audit_log / egress_log | — | 引用 case_id（可空） | — | append-only 稽核 |
| case | 1–N | 🆕 eligibility_check | 1:N | 福利資格判定，入住前可能重複檢核 |
| case | 1–1 | 🆕 family_support | 1:1 | 家庭支持評估（家系圖/生態圖） |
| assessment | 1–1 | 🆕 physical_needs_extra | 1:1 | 生理需求評估補充欄位（沿用既有 assessment_id） |
| case | 1–N | 🆕 icope_assessment | 1:N | ICOPE 評估，可隨個案狀態變化重複記錄 |
| case | 1–N | 🆕 pre_interview_report | 1:N | 面談輔助報告，可回填連結至正式 assessment |

### 2.2 資料表設計（DDL）

**（a）身分／PII** —— 最敏感，欄位級加密，絕不出 appliance

```sql
CREATE TABLE pii_vault (
  case_id        uuid PRIMARY KEY,
  name_enc       bytea NOT NULL,          -- AES-256-GCM
  national_id_enc bytea,
  birth_date_enc bytea,
  address_enc    bytea,
  contact_enc    bytea,
  family_contact_enc bytea,
  key_id         text NOT NULL,           -- 對應 KEK（TPM 內），支援輪替
  created_at     timestamptz NOT NULL DEFAULT now()
);
-- 存取需 RBAC role=nurse/admin；每次讀寫寫 audit_log
```

**（b）個案主檔**（去識別 by construction）

```sql
CREATE TABLE "case" (
  case_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   text NOT NULL,
  status      text NOT NULL CHECK (status IN ('screening','active','discharged')),
  sex         char(1),
  birth_year  int,                        -- 只存年份（k-匿名），非完整生日
  cms_level   int,
  admit_date  date, discharge_date date,
  created_at  timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE chronic_condition (
  id bigserial PRIMARY KEY, case_id uuid REFERENCES "case",
  icd10 text, label text, since date
);
```

**（c）開案評估**

```sql
CREATE TABLE assessment (
  assessment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES "case", assessed_at timestamptz, assessor_user_id uuid
);

CREATE TABLE barthel_score (
  assessment_id uuid PRIMARY KEY REFERENCES assessment,
  feeding int, bathing int, grooming int, dressing int, bowels int, bladder int,
  toilet int, transfers int, mobility int, stairs int,
  total int, level text CHECK (level IN ('total','severe','moderate','mild','independent'))
);

CREATE TABLE npiq_symptom (
  id bigserial PRIMARY KEY, assessment_id uuid REFERENCES assessment,
  symptom text, severity int CHECK (severity BETWEEN 1 AND 3), distress int CHECK (distress BETWEEN 0 AND 5)
);

CREATE TABLE cognition (
  assessment_id uuid PRIMARY KEY REFERENCES assessment,
  tool text, score int, errors int
);

CREATE TABLE fall_history (
  assessment_id uuid PRIMARY KEY REFERENCES assessment,
  falls_3m int, mobility_aid text, sedative boolean
);

CREATE TABLE admission_result (               -- 衍生，見報告 §4
  assessment_id uuid PRIMARY KEY REFERENCES assessment,
  fall_score int, fall_light text, care_weight numeric(4,2),
  est_monthly_cost_twd int, exclusion_hit boolean, exclusion_reason text,
  recommendation text, ruleset_version text, computed_at timestamptz
);
```

**（c-1）🆕 福利資格判定** —— 對應入住前評估五大構面之「福利資格」

```sql
CREATE TABLE eligibility_check (
  id              bigserial PRIMARY KEY,
  case_id         uuid REFERENCES "case",
  category        text CHECK (category IN
                    ('disabled_elderly_65plus','indigenous_disabled_55plus',
                     'dementia_50plus','physical_disability','welfare_status')),
  age_at_check    int,
  cert_ref        text,               -- 證明文件參照（身障手冊/福利身分證明等），文件本體不入庫
  pass            boolean,
  checked_at      timestamptz DEFAULT now(),
  checked_by_user_id uuid
);
-- category 對應「65歲以上失能老人/55歲以上失能原住民/50歲以上失智症者/身障身分/福利身分」五類收案門檻
```

**（c-2）🆕 家庭支持評估** —— 對應「家庭支持」構面（家系圖/生態圖/照服員/長照量能等級）

```sql
CREATE TABLE family_support (
  id                    bigserial PRIMARY KEY,
  case_id               uuid REFERENCES "case",
  genogram_json         jsonb,        -- 家系圖節點與關係，結構化儲存（非影像）
  ecomap_json           jsonb,        -- 生態圖節點與關係
  caregiver_type        text,         -- family|foreign_caregiver|paid_local|none
  caregiver_hours_week  int,
  family_support_level  text CHECK (family_support_level IN ('low','medium','high')),
  ltc_capacity_level    int,          -- 長照量能等級（含 ADLs/IADLs/X量表綜合評定），口徑對應 case.cms_level
  assessed_at           timestamptz,
  assessed_by_user_id   uuid
);
-- ADLs 沿用既有 barthel_score 表、IADLs 沿用既有 iadl_score 表；
-- 此表只存「長照量能等級」綜合評定結果與家庭支持結構，不重複建 ADL/IADL 欄位
```

**（c-3）🆕 生理需求評估補充欄位** —— 對應「生理需求」構面（沿用既有 assessment_id，僅擴充現有量表未涵蓋之項目）

```sql
CREATE TABLE physical_needs_extra (
  assessment_id       uuid PRIMARY KEY REFERENCES assessment,
  mobility            text,           -- independent|walker_assisted|wheelchair|bedridden
  skin_pressure_injury boolean,
  skin_redness        boolean,
  skin_wound          boolean,
  skin_note           text,
  vision_status        text,          -- normal|impaired_corrected|impaired_uncorrected|blind
  hearing_status        text,         -- normal|impaired|deaf
  depression_tool       text,         -- e.g. GDS-5
  depression_score      int,
  life_background_note  text
);
-- 認知功能沿用既有 cognition 表；巴氏量表沿用既有 barthel_score 表；SPPB 沿用既有 fitness_assessment 表，不重複建欄位。
-- ⚠️ 行動能力（mobility）於本表為「入住前初評、整體移動方式分類」，與 barthel_score.mobility（ADL量表子項分數）
--    口徑不同，兩者並存、不可互相取代。
```

**（c-4）🆕 ICOPE 評估** —— 對應「長照福利」構面（整合性長者照護指引）

```sql
CREATE TABLE icope_assessment (
  id              bigserial PRIMARY KEY,
  case_id         uuid REFERENCES "case",
  cognition_flag  int,   -- 0/1
  mobility_flag   int,
  vision_flag     int,
  hearing_flag    int,
  malnutrition_flag int,
  depression_flag int,
  case_status     text CHECK (case_status IN ('pre_intake','active','discharged','referred')),
  assessed_at     timestamptz DEFAULT now()
);
-- case_status 涵蓋「在案中/結案或轉介」等個案狀態；各 flag 為 ICOPE 快篩旗標，
-- 與正式 cognition 表、physical_needs_extra 表的完整評估分數為不同層級（快篩 vs 完整評估），不重複也不互相取代。
```

**（c-5）🆕 面談輔助報告** —— 入住前面談前置流程之產出物

```sql
CREATE TABLE pre_interview_report (
  report_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id         uuid REFERENCES "case",
  generated_at    timestamptz DEFAULT now(),
  eligibility_result jsonb,
  summary         jsonb,
  interview_focus_points jsonb,
  status          text CHECK (status IN ('draft_for_interview','used_in_interview','superseded')),
  linked_assessment_id uuid REFERENCES assessment   -- 面談後轉入正式開案評估時回填連結
);
```

**（d）即時監測（時序）**

```sql
CREATE TABLE vital_reading (
  id bigserial, case_id uuid, ts timestamptz NOT NULL,
  source text, metric text, value numeric, unit text, quality text,
  device_id text, seq bigint
);   -- TimescaleDB: SELECT create_hypertable('vital_reading','ts'); 按日分區
CREATE INDEX ix_vital_case_ts ON vital_reading (case_id, ts DESC);
CREATE UNIQUE INDEX ux_vital_dedup ON vital_reading (device_id, seq);  -- 補傳去重

CREATE TABLE monitor_event (
  event_id bigserial PRIMARY KEY, case_id uuid, ts timestamptz,
  type text, duration_sec int, payload jsonb, device_id text, seq bigint
);
```

**（e）預警**

```sql
CREATE TABLE alert_threshold (             -- 支援個人化 baseline
  id bigserial PRIMARY KEY, case_id uuid,  -- NULL = 全院預設
  metric text, green_lo numeric, green_hi numeric,
  yellow_lo numeric, yellow_hi numeric, red_lo numeric, red_hi numeric,
  personalized boolean DEFAULT false
);

CREATE TABLE alert (
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid,
  raised_at timestamptz, level text, rule_id text, trigger jsonb,
  ack_by_user_id uuid, ack_at timestamptz, resolved_at timestamptz,
  status text CHECK (status IN ('open','ack','resolved'))
);
CREATE INDEX ix_alert_open ON alert (status, raised_at DESC);
```

**（f）護理紀錄 / 聯絡簿 / 體能**

```sql
CREATE TABLE nursing_note (
  note_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid,
  created_at timestamptz, author_user_id uuid,
  raw_audio_ref text, transcript_text text,          -- 含 PII，appliance only
  soap_s text, soap_o text, soap_a text, soap_p text,
  o_values jsonb,                                     -- 每個 O 數值的 source+ts（防幻覺）
  llm_provider text, cloud_polish_used boolean DEFAULT false,
  status text CHECK (status IN ('draft','confirmed')),
  confirmed_by_user_id uuid, confirmed_at timestamptz
);

CREATE TABLE contact_book (
  id bigserial PRIMARY KEY, case_id uuid, day date,
  draft_text text, published boolean DEFAULT false, published_at timestamptz, edited_by uuid
);

CREATE TABLE fitness_assessment (            -- 見報告 §6
  id bigserial PRIMARY KEY, case_id uuid, ts timestamptz,
  resting_hr int, steps_day int, gait_speed_mps numeric(3,2),
  hr_recovery int, chair_stand int, sppb_est int, source text
);
```

**（g）去識別趨勢庫**（唯一可 egress 上雲）

```sql
CREATE TABLE deid_trend (
  id bigserial PRIMARY KEY,
  tenant_pseudo text,          -- 假名，非 tenant_id 明碼
  cohort_key jsonb,            -- {age_band, sex, cms}；★無 case_id
  metric text, window text, trend_value numeric, computed_at timestamptz
);
-- 約束：此表不得含任何可回連個人之欄位；egress 閘道只允許此表 + 匿名術語查詢出門
```

**（h）稽核（append-only）**

```sql
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY, ts timestamptz DEFAULT now(),
  actor text, action text,     -- ingest|ner_mask|route|egress|soap_confirm|pii_access
  case_id uuid, route_decision text,   -- local|cloud|human
  fields_masked jsonb, data_hash text, detail jsonb
);

CREATE TABLE egress_log (       -- 強制「零 PII 封包」佐證
  id bigserial PRIMARY KEY, ts timestamptz DEFAULT now(),
  target text,                 -- cloud_llm|norm_store|control_plane
  payload_class text,          -- deid_trend|term_query|heartbeat
  pii_scan_result text,        -- pass|fail（fail 則不送）
  bytes int, dest_endpoint text
);
```

**（i）使用者 / RBAC / RAG / 設定**

```sql
CREATE TABLE app_user (
  user_id uuid PRIMARY KEY, tenant_id text, role text, name text, auth_ref text
);  -- role: nurse|social_worker|caregiver|admin

CREATE TABLE sop_document (id bigserial PRIMARY KEY, tenant_id text, title text, source text, version text, content text);

CREATE TABLE sop_chunk (id bigserial PRIMARY KEY, doc_id bigint REFERENCES sop_document,
  chunk_text text, embedding vector(1024), metadata jsonb);
CREATE INDEX ix_sop_vec ON sop_chunk USING hnsw (embedding vector_cosine_ops);

CREATE TABLE app_config (key text PRIMARY KEY, value jsonb, updated_at timestamptz, updated_by text);

CREATE TABLE model_registry (id bigserial PRIMARY KEY, model_name text, quant text,
  version text, checksum text, active boolean);   -- OTA 模型更新

CREATE TABLE ruleset_version (id bigserial PRIMARY KEY, name text, version text, effective_at timestamptz);
```

**資料保留（retention）**

| 資料 | 保留策略 |
|---|---|
| raw_audio（語音檔） | SOAP 確認後 ≤7 天清除，只留 transcript+SOAP |
| vital_reading 原始 1 分鐘 | appliance 保留 30–90 天；之後降頻為時/日彙總長留 |
| deid_trend | 長留（可上雲常模庫） |
| audit_log / egress_log | ≥1–3 年（法遵） |
| pii_vault | 依個案生命週期 + 法定保存期；加密 |
| 🆕 genogram_json / ecomap_json（family_support） | 比照 pii_vault 等級保護（含家屬關係資訊），依個案生命週期保留；不得經 egress 上雲 |
| 🆕 pre_interview_report | 轉入正式 assessment 後標記 `status=used_in_interview`，長留供稽核面談前後判斷是否一致 |

### 2.3 硬體資料暫存與斷線補傳機制

兩層緩衝，對應兩層硬體：

**① 感測端點 ↔ 地端主機（本地鏈路斷）**

- 端點內建 ring buffer（手環離線暫存數小時、床墊暫存事件）。
- 每筆帶 `device_id + seq + ts`；重連後回補（backfill）。
- appliance 以 `UNIQUE(device_id, seq)`（見 §2.2d）冪等去重，重複補傳不會重算。

**② 地端主機 → 雲端（WAN 斷）**—— 這是 feature，不是 bug

- 核心臨床功能（開案、預警、SOAP、紀錄）不依賴雲端，斷網 100% 照跑（離線自治）。
- 對雲的去識別上傳走 store-and-forward outbox：

```sql
CREATE TABLE egress_outbox (
  id bigserial PRIMARY KEY, created_at timestamptz DEFAULT now(),
  payload_class text, payload jsonb, idempotency_key text UNIQUE,
  status text DEFAULT 'pending', retries int DEFAULT 0, sent_at timestamptz
);
```

- WAN 恢復 → 背景 worker 依 `idempotency_key` 冪等 flush；雲端重複收也只記一次。
- 控制平面 config/OTA 為 appliance 主動 pull，斷網期間沿用最後一次設定，恢復後續拉。

---

## 3. 資安與防護設計

> **威脅模型（簡）**：主要威脅＝①PII 外洩（傳輸/儲存/雲端集中）②未授權存取 ③設備假冒 ④多租戶資料串接 ⑤金鑰外洩。核心對策＝PII 不出 appliance + 唯一去識別 egress + 每設備身分 + 硬體金鑰。

### 3.1 傳輸安全

| 鏈路 | 傳輸安全 |
|---|---|
| 手環 → appliance | BLE 配對綁定（bonding key），敏感資料 app 層再加密 |
| 床墊/雷達 → appliance | MQTTS（MQTT over TLS 1.2+），每設備憑證；RS-485 走實體隔離內網 |
| 前端 ↔ appliance | HTTPS（TLS 1.3） + WSS（WebSocket over TLS） |
| appliance → 雲端（兩平面） | HTTPS + mTLS（雙向憑證）+ payload 簽章（Ed25519） |

> **原則**：全鏈路禁明文；appliance 只開出站，雲端不可主動連入。

### 3.2 認證與授權

分層身分（對應兩層硬體）：

- **感測端點 → 地端主機（本地）**：每設備獨立憑證/金鑰，註冊在 appliance 的 device registry；未註冊設備拒收。
- **地端主機（Node）→ 雲端**：mTLS client 憑證（每 Node 一張，provisioning 時簽發）+ 短期 JWT 做 API 授權。Node 身分＝憑證 CN＝`node_id + tenant_id`；雲端驗憑證 + JWT + 租戶範圍（tenant scope），杜絕跨租戶存取。
- **使用者 → 前端**：RBAC（nurse / social_worker / caregiver / admin）+ JWT session；`pii_vault` 讀取限 nurse/admin 且寫 audit。

### 3.3 設備安全與金鑰管理

- **金鑰絕不 hardcode**：Node 私鑰、資料加密 KEK 存 TPM 2.0 / secure element，KEK 永不離開硬體；DEK 由 KEK 包裝、支援輪替（見 `pii_vault.key_id`）。
- **Wi-Fi 密碼 / API Key / 憑證**：存 OS secret store（如 secret-tool/keyring）或環境變數注入，不進 repo、不進映像檔；provisioning 走安全 onboarding（首次配對 + 憑證簽發）。
- **Secure Boot + 簽章 OTA**：韌體/模型更新（`model_registry`）需簽章驗證，防止竄改推送。
- **最小權限**：各服務以獨立低權帳號跑；DB 帳號分讀寫角色。

### 3.4 去識別 egress 契約（ARKAI 專屬）

這是產品護城河的技術實作，比一般 IoT 資安多一層：

1. **唯一對外出口** = egress 閘道；程式上只允許 `deid_trend` 表 + 匿名術語查詢兩類 payload 出門。
2. 出門前跑 **PII 掃描**（regex + NER 二次校驗）；命中 PII → 攔下、不送、記 `egress_log.pii_scan_result=fail`。
3. 每次 egress 記 `egress_log`（payload_class、掃描結果、目的地）→ 可稽核「零 PII 封包」。
4. 這條契約同時是 UAT 驗收項（斷網 + egress 抓包，見 issue #3、報告 §9）。

> 🆕 **提醒**：`family_support` 表中的 `genogram_json` / `ecomap_json` 含家屬關係資訊，屬 PII 等級敏感資料，egress 掃描規則需明確涵蓋此表，避免因欄位為 jsonb 而被規則遺漏。

---

## 4. 非功能需求（NFR）

| 面向 | 指標 |
|---|---|
| 延遲 | 即時預警（事件→警報）<2s；SOAP 生成 <6s（地端 7B Q4）；開案試算 <1s |
| 可用性 | 核心臨床功能斷網 100% 可用（離線自治）；雲端輔助 best-effort |
| 併發 | 單機構 20–60 位長輩、低併發；單請求排隊可接受，不需資料中心 GPU |
| 擴展性 | 租戶層 share-nothing：每機構一台獨立 appliance；fleet 水平管理 N 台 |
| 合規 | PII 不出機構；不做診斷（僅輔助 + 人審）；稽核可追溯 ≥1–3 年 |
| 可維運 | OTA 模型/規則更新；`ruleset_version` 讓衍生分數可重現、可回溯 |

---

## 5. MVP 閹割版範圍

詳見 GitHub issue #3。摘要：除「SOAP 生成」用雲端 LLM API 暫時代打（全程假資料 + LLMProvider 抽換層 + 到期日 UAT），整條 PII 路徑（DB、去識別、預警、規則、egress 閘道）自第一週起真跑地端。

| 元件 | MVP | 說明 |
|---|---|---|
| DB / L1 閘道 / 閾值預警 / 規則引擎 / NER 去識別 / egress | 🟢 地端（真） | 皆不吃資源，第一週真跑 |
| 地端小模型「SOAP 生成」 | 🟡 雲端 API 代打 | 唯一吃資源；假資料 + 抽換層 + 到期 UAT |
| 感測串流 | 模擬注入 | Demo 用 mock 資料流 |
| 本地小模型 spike（P0） | 並行進行 | 便宜機器離線跑通 SOAP，證偽「地端資源不足」 |
| 🆕 面談前置評估報告（eligibility_check/family_support/physical_needs_extra/icope_assessment/pre_interview_report） | 🟢 地端（真） | 純規則彙整、無需大模型，第一週可真跑；家系圖/生態圖前端繪製介面另評估 |

---

## 6. 風險與待確認

| # | 項目 | 說明 | 主責 |
|---|---|---|---|
| 1 | 雲端平面選型 | 去識別/控制平面放 GCP/AWS/自建？建議台灣 region 或自建 | 架構 + 法務 |
| 2 | 地端小模型可行性 | 7B Q4 SOAP 品質須 spike 驗證（見 issue #3、報告 §8） | gray |
| 3 | 感測協定 | 手環/床墊實際型號決定 BLE/MQTT/序列細節與暫存能力 | 硬體 |
| 4 | 個人化閾值 | alert_threshold 個人 baseline 校準流程 | 護理長 |
| 5 | 金鑰 provisioning | TPM/secure element 選型與量產 onboarding 流程 | 硬體 + 資安 |
| 6 | 臨床演算法校準 | 跌倒燈號/成本係數須真實個案回歸（報告 §9） | 護理長 + 財務 |
| 7 | 🆕 家系圖/生態圖資料結構 | 目前定為結構化 JSON（節點+關係），需與臨床/社工確認是否足夠取代手繪圖，或需搭配前端繪圖介面 | 社工 + 前端 |
| 8 | 🆕 福利資格串接方式 | 是否需介接政府福利資格資料庫做即時驗證，或先以人工上傳證明文件（cert_ref）為主 | 法務 + gray |
| 9 | 🆕 ICOPE 量表欄位規格 | 現行 icope_assessment 為簡化 flag 版本，正式欄位需與臨床顧問核對 WHO ICOPE 原始工具 | 護理長 |
| 10 | 🆕 不填表匯入架構可行性 | 見下方 §6.x 獨立分析 | 全體 |

### 6.x 🆕 不填表匯入架構 —— 可行性分析

**問題定義**：入住前五大構面（福利資格、家庭支持、生理需求、生活背景、ICOPE）目前預設為評估人員手填表單；本節評估是否能改為系統自動匯入，減少手填負擔。

**可能匯入來源盤點**

| 來源 | 可匯入內容 | 技術可行性 | 備註 |
|---|---|---|---|
| 既有機構管理系統（如照管家）匯出資料 | 個案基本資料、既有生命徵象紀錄、過去照顧計畫 | 高（結構化欄位對應） | 需取得機構授權匯出格式（CSV/API） |
| 政府福利資格資料庫 | 福利身分、身障手冊狀態 | 中（需公部門介接窗口與法規授權） | 短期內建議仍以人工上傳證明文件為主，見風險項 8 |
| 家屬線上填寫小問卷 | 家庭支持、生活背景、照顧人力 | 高（表單本身可線上化，非 AI 匯入問題） | 屬於「減少手填」但非「不填表」，仍是填表，只是換人填 |
| 語音面談口述 → 本地 ASR/NER 結構化 | 生理需求描述、生活背景、家庭支持敘述 | 中（沿用既有 §1.4 A 流程之本地 ASR + NER pipeline，技術路徑已存在） | 需驗證口語敘述轉結構化欄位（如 GDS-5 分數）的準確度，不能全靠 AI 自動判斷分數 |

**風險與限制**

1. 福利資格類（身障手冊、福利身分）具法律效力，**不建議由 AI 自動判讀認定**，仍需人工核對證明文件，AI 僅能輔助預先帶入欄位供人工確認。
2. 家系圖/生態圖屬於社工專業繪製工具，語意複雜，短期內較難單靠語音/文字自動生成，建議仍搭配前端繪圖介面人工確認。
3. 憂鬱情緒（GDS-5）等量表分數屬於臨床判斷結果，若由語音敘述反推分數，需經人員複核，比照現有 SOAP 生成中「o_values 標註來源」的防幻覺設計（見 §1.3④）。

**建議：分階段導入**

| 階段 | 範圍 | 說明 |
|---|---|---|
| 階段一（MVP可做） | 既有機構系統資料匯入 + 家屬線上問卷 | 技術風險低，立即可減少部分手填 |
| 階段二 | 語音口述 → 生活背景/家庭支持描述自動帶入草稿 | 沿用既有本地 ASR/NER pipeline，人工confirm後入庫 |
| 階段三（待確認） | 政府福利資格資料庫介接 | 需法規與跨機關窗口，非技術問題為主，列入風險項 8 持續追蹤 |

---

## 附錄：Enum 定義與名詞

**Enum 定義**

- `metric`：hr, spo2, temp, bp_sys, bp_dia, steps, activity
- `event.type`：out_of_bed, fall_detected, zone_exit
- `alert.level`：green, yellow, red, emergency
- `barthel.level`：total(0–20), severe(21–60), moderate(61–90), mild(91–99), independent(100)
- `npiq.symptom`：delusion, hallucination, agitation, depression, anxiety, euphoria, apathy, disinhibition, irritability, aberrant_motor, sleep, appetite
- `role`：nurse, social_worker, caregiver, admin
- `route_decision`：local, cloud, human
- 🆕 `eligibility_check.category`：disabled_elderly_65plus, indigenous_disabled_55plus, dementia_50plus, physical_disability, welfare_status
- 🆕 `family_support.caregiver_type`：family, foreign_caregiver, paid_local, none
- 🆕 `family_support.family_support_level`：low, medium, high
- 🆕 `physical_needs_extra.mobility`：independent, walker_assisted, wheelchair, bedridden
- 🆕 `physical_needs_extra.vision_status`：normal, impaired_corrected, impaired_uncorrected, blind
- 🆕 `physical_needs_extra.hearing_status`：normal, impaired, deaf
- 🆕 `icope_assessment.case_status`：pre_intake, active, discharged, referred
- 🆕 `pre_interview_report.status`：draft_for_interview, used_in_interview, superseded

**名詞**

- **appliance**＝機構地端主機
- **egress 閘道**＝唯一對外出口
- **de-id**＝去識別
- **PII**＝個人可識別資訊
- **mTLS**＝雙向 TLS
- **RAG**＝檢索增強生成
- **SPPB**＝簡短身體功能量表
- 🆕 **ICOPE**＝Integrated Care for Older People，整合性長者照護指引（WHO）
- 🆕 **家系圖（genogram）**＝呈現家庭成員結構與關係之工具
- 🆕 **生態圖（ecomap）**＝呈現個案與周邊資源/支持系統關係之工具
- 🆕 **面談輔助報告**＝入住面談前產出、供評估人員參考但非最終開案決定之報告

---

*本 SDD 對應資料分析報告的需求層；臨床演算法與量表細節見報告 §4–§6，補助見 §8。所有 schema、協定、閾值為 v0.2 設計，實作前須凍結 API、經合作機構臨床校準。v0.2 新增之入住前評估相關表（eligibility_check、family_support、physical_needs_extra、icope_assessment、pre_interview_report）與既有量表（barthel_score、iadl_score、cognition、fitness_assessment）之欄位口徑差異已於各表註解中標明，避免重複建置或定義衝突。*
