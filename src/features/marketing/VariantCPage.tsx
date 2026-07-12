import {
  ArrowRight,
  ClipboardCheck,
  FileHeart,
  HandHeart,
  HeartHandshake,
  Home,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UsersRound,
} from 'lucide-react';

const careSteps = [
  {
    title: '先理解個案',
    description: '把初訪資料、家庭支持與照護需求用清楚的節奏整理起來。',
    icon: UsersRound,
  },
  {
    title: '再確認資格',
    description: '協助照護團隊檢查福利條件、收案門檻與待補資料。',
    icon: ClipboardCheck,
  },
  {
    title: '一起補齊文件',
    description: '讓證明文件參照、來源與狀態不再散落在不同訊息裡。',
    icon: FileHeart,
  },
  {
    title: '形成面談重點',
    description: '後續可銜接 AI 摘要，幫助團隊更快掌握照護方向。',
    icon: MessageCircleHeart,
  },
];

const audienceItems = ['社工師', '照護管理員', '護理師', '個案管理師'];

export function VariantCPage() {
  return (
    <main className="warm-site-shell">
      <header className="warm-nav">
        <a className="warm-brand" href="/variant-c" aria-label="ARKAI 溫暖照護品牌版">
          <span className="warm-brand-mark">A</span>
          <span>ARKAI</span>
        </a>
        <nav aria-label="溫暖照護品牌導覽">
          <a href="#care-flow">照護流程</a>
          <a href="#trust">安心設計</a>
          <a href="/variant-b">AI 科技版</a>
          <a href="/app">系統原型</a>
        </nav>
      </header>

      <section className="warm-hero">
        <div className="warm-hero-copy">
          <p className="warm-eyebrow">
            <SunMedium size={16} />
            Care-first AI Platform
          </p>
          <h1>讓每一次開案，都更清楚也更安心</h1>
          <p>
            ARKAI 陪照護團隊把資格判定、家庭支持、照護需求與證明文件整理成溫和而可靠的流程，讓專業判斷回到人的身上，讓系統承接繁瑣細節。
          </p>
          <div className="warm-actions">
            <a className="warm-button warm-primary" href="/app">
              查看照護流程
              <ArrowRight size={18} />
            </a>
            <a className="warm-button warm-secondary" href="#care-flow">
              了解 ARKAI
            </a>
          </div>
        </div>

        <div className="warm-story-card" aria-label="照護工作流示意">
          <div className="warm-card-header">
            <span>
              <HeartHandshake size={18} />
              今日開案準備
            </span>
            <strong>72%</strong>
          </div>
          <div className="warm-client">
            <div className="warm-avatar">林</div>
            <div>
              <h2>林女士</h2>
              <p>家庭支持不足，待確認福利資格與醫療佐證。</p>
            </div>
          </div>
          <div className="warm-checklist">
            <span>資格資料已填寫</span>
            <span>證明文件待補 2 項</span>
            <span>面談重點已產生草稿</span>
          </div>
          <div className="warm-note">
            <Sparkles size={18} />
            <p>AI 建議先確認主要照顧者狀況與近期跌倒風險，再補上福利資格證明。</p>
          </div>
        </div>
      </section>

      <section className="warm-section warm-audience" aria-label="使用者角色">
        {audienceItems.map((item) => (
          <div key={item}>
            <HandHeart size={20} />
            <span>{item}</span>
          </div>
        ))}
      </section>

      <section className="warm-section" id="care-flow">
        <div className="warm-section-heading">
          <p className="warm-eyebrow">Care Flow</p>
          <h2>從資料輸入到照護判斷，讓團隊知道下一步該做什麼</h2>
          <p>這個版本不強調科技炫技，而是讓使用者感覺系統在幫忙整理、提醒與陪伴工作流程。</p>
        </div>

        <div className="warm-step-grid">
          {careSteps.map((step) => {
            const Icon = step.icon;

            return (
              <article className="warm-step-card" key={step.title}>
                <Icon size={24} />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="warm-section warm-trust" id="trust">
        <div>
          <p className="warm-eyebrow">Trust by Design</p>
          <h2>照護資料需要溫柔，也需要嚴謹</h2>
          <p>ARKAI 的產品敘事可以同時保留「安心照護」與「資料安全」兩件事，讓機構、團隊與家屬都比較容易理解。</p>
        </div>
        <div className="warm-trust-list">
          <div>
            <ShieldCheck size={22} />
            <strong>文件權限</strong>
            <span>證明文件參照與狀態可追蹤。</span>
          </div>
          <div>
            <Home size={22} />
            <strong>地端部署</strong>
            <span>可部署於 Ubuntu / Docker 環境。</span>
          </div>
          <div>
            <HeartHandshake size={22} />
            <strong>照護協作</strong>
            <span>協助跨角色掌握同一份開案脈絡。</span>
          </div>
        </div>
      </section>

      <section className="warm-cta">
        <div>
          <h2>這是一個更親近照護現場的版本</h2>
          <p>如果你想讓 ARKAI 看起來更像照護品牌，而不是純技術平台，我們可以把這版升級成正式首頁。</p>
        </div>
        <a className="warm-button warm-primary" href="/variant-c">
          保留此版本
        </a>
      </section>
    </main>
  );
}
