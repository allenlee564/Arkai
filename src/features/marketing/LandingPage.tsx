import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  FileCheck2,
  HeartPulse,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const solutionItems = [
  {
    title: '開案前評估',
    description: '把初訪、資格、家庭支持與照護需求整理成同一條前端工作流。',
    icon: ClipboardList,
  },
  {
    title: '福利資格判定',
    description: '依照收案門檻建立可追蹤的輸入資料，後續可串接判定 API。',
    icon: BadgeCheck,
  },
  {
    title: '證明文件參照',
    description: '先記錄文件來源與狀態，後續銜接上傳、權限與稽核紀錄。',
    icon: FileCheck2,
  },
  {
    title: '生理與 ICOPE 評估',
    description: '預留長者功能、風險旗標與面談摘要的資料結構。',
    icon: HeartPulse,
  },
];

const trustItems = [
  '地端去識別化處理',
  '文件參照權限控管',
  '出口稽核與補傳機制',
  '可部署於 Ubuntu / Docker',
];

export function LandingPage() {
  return (
    <main className="site-shell">
      <header className="site-nav">
        <a className="site-brand" href="/" aria-label="ARKAI 首頁">
          <span className="site-brand-mark">A</span>
          <span>ARKAI</span>
        </a>
        <nav aria-label="網站導覽">
          <a href="#solutions">解決方案</a>
          <a href="#security">資料安全</a>
          <a href="/app">系統原型</a>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-interface" aria-hidden="true">
          <div className="mock-sidebar">
            <span />
            <span />
            <span />
          </div>
          <div className="mock-main">
            <div className="mock-topline" />
            <div className="mock-grid">
              <div />
              <div />
              <div />
              <div />
            </div>
            <div className="mock-records">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="hero-copy">
          <p className="site-eyebrow">AI 輔助開案與照護決策平台</p>
          <h1>ARKAI 照護方舟</h1>
          <p>
            協助照護團隊把資格判定、家庭支持、生理需求與證明文件參照整理成清楚流程，讓開案前評估更快進入可判斷、可追蹤、可稽核的狀態。
          </p>
          <div className="hero-actions">
            <a className="site-button primary-link" href="/app">
              查看系統原型
              <ArrowRight size={18} />
            </a>
            <a className="site-button secondary-link" href="#solutions">
              了解方案
            </a>
          </div>
        </div>
      </section>

      <section className="site-section compact-section" aria-label="核心價值">
        <div className="metric-strip">
          <div>
            <strong>開案前</strong>
            <span>聚焦訪視與收案資料</span>
          </div>
          <div>
            <strong>文件參照</strong>
            <span>保留來源與權限線索</span>
          </div>
          <div>
            <strong>Docker</strong>
            <span>可部署到 Ubuntu 伺服器</span>
          </div>
        </div>
      </section>

      <section className="site-section" id="solutions">
        <div className="section-intro">
          <p className="site-eyebrow">Solutions</p>
          <h2>從開案資料到照護判斷，先把流程穩住</h2>
          <p>ARKAI 目前先以福利資格判定與文件參照為第一個切入點，逐步擴展到家庭支持、ICOPE 與面談輔助報告。</p>
        </div>

        <div className="solution-grid">
          {solutionItems.map((item) => {
            const Icon = item.icon;

            return (
              <article className="solution-card" key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-section feature-band">
        <div>
          <p className="site-eyebrow">Product Preview</p>
          <h2>展示首頁介紹產品，系統原型留給操作 Demo</h2>
          <p>
            對外展示時使用正式官網；需要操作功能時，再切到 `/app` 的資格輸入與證明文件參照原型。之後可再加登入、Demo 帳號與後端 API。
          </p>
        </div>
        <a className="site-button primary-link" href="/app">
          開啟 Demo
          <ArrowRight size={18} />
        </a>
      </section>

      <section className="site-section security-section" id="security">
        <div className="section-intro">
          <p className="site-eyebrow">Security & Deployment</p>
          <h2>以資料安全與部署彈性作為產品基礎</h2>
        </div>

        <div className="security-layout">
          <div className="security-visual">
            <ShieldCheck size={42} />
            <h3>wkbarret.com</h3>
            <p>首頁可先作為產品介紹入口，後續再加 HTTPS、正式 API 與登入權限。</p>
          </div>
          <div className="trust-list">
            {trustItems.map((item) => (
              <div className="trust-row" key={item}>
                <LockKeyhole size={18} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section cta-section">
        <div>
          <Sparkles size={28} />
          <h2>準備把 ARKAI 放到正式網域</h2>
          <p>下一步可以把 GitHub 專案部署到 Ubuntu Docker，讓 `wkbarret.com` 直接顯示這個官網。</p>
        </div>
        <div className="cta-actions">
          <a className="site-button primary-link" href="/app">
            看目前原型
            <ArrowRight size={18} />
          </a>
          <a className="site-button secondary-link" href="https://github.com/allenlee564/Arkai">
            GitHub Repo
            <Network size={18} />
          </a>
        </div>
      </section>
    </main>
  );
}
