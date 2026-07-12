import {
  Activity,
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  FileSearch,
  Fingerprint,
  Gauge,
  GitBranch,
  LockKeyhole,
  Radar,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';

const modules = [
  {
    title: '資格判定引擎',
    description: '把收案門檻、家戶條件與福利狀態轉成可追蹤的判斷流程。',
    icon: Gauge,
  },
  {
    title: '文件參照圖譜',
    description: '串起證明文件、來源位置、狀態與權限紀錄，降低追件成本。',
    icon: FileSearch,
  },
  {
    title: '照護風險摘要',
    description: '預留家庭支持、ICOPE、生理需求與面談重點的 AI 摘要入口。',
    icon: BrainCircuit,
  },
  {
    title: '地端安全部署',
    description: '以 Docker 部署於 Ubuntu，後續銜接去識別化與出口稽核。',
    icon: ServerCog,
  },
];

const signals = ['Eligibility', 'Family Support', 'ICOPE', 'Documents', 'Audit Trail'];

export function VariantBPage() {
  return (
    <main className="ai-site-shell">
      <header className="ai-nav">
        <a className="ai-brand" href="/variant-b" aria-label="ARKAI AI 科技平台版">
          <span className="ai-brand-mark">A</span>
          <span>ARKAI</span>
        </a>
        <nav aria-label="AI 科技平台導覽">
          <a href="#platform">平台能力</a>
          <a href="#security">安全架構</a>
          <a href="/">目前首頁</a>
          <a href="/app">系統原型</a>
        </nav>
      </header>

      <section className="ai-hero">
        <div className="ai-hero-copy">
          <p className="ai-eyebrow">
            <Sparkles size={16} />
            AI Care Intelligence Platform
          </p>
          <h1>讓開案資料變成可判斷的照護訊號</h1>
          <p>
            ARKAI 將資格判定、證明文件、家庭支持與照護需求整合到同一個 AI 輔助流程，協助團隊更快完成開案前評估與決策準備。
          </p>
          <div className="ai-actions">
            <a className="ai-button ai-primary" href="/app">
              啟動原型
              <ArrowRight size={18} />
            </a>
            <a className="ai-button ai-secondary" href="#platform">
              查看平台能力
            </a>
          </div>
        </div>

        <div className="ai-console" aria-label="ARKAI AI 決策平台示意">
          <div className="console-topbar">
            <span />
            <span />
            <span />
            <strong>ARKAI Signal Console</strong>
          </div>
          <div className="console-grid">
            <section className="signal-panel large">
              <div className="panel-title">
                <Radar size={18} />
                Case Signal
              </div>
              <div className="signal-orbit">
                <span className="orbit-core">AI</span>
                <i />
                <i />
                <i />
              </div>
            </section>
            <section className="signal-panel">
              <div className="panel-title">
                <Activity size={18} />
                Risk Index
              </div>
              <strong className="signal-score">82</strong>
              <p>需補文件 2 項</p>
            </section>
            <section className="signal-panel">
              <div className="panel-title">
                <Workflow size={18} />
                Flow
              </div>
              <div className="mini-flow">
                <span />
                <span />
                <span />
              </div>
            </section>
          </div>
          <div className="signal-ticker">
            {signals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="ai-section" id="platform">
        <div className="ai-section-heading">
          <p className="ai-eyebrow">Platform Modules</p>
          <h2>不是表單堆疊，而是照護決策資料層</h2>
          <p>先把第一階段的資格輸入與文件參照做好，再逐步把 AI 摘要、風險提示與稽核軌跡接上。</p>
        </div>

        <div className="ai-module-grid">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <article className="ai-module-card" key={module.title}>
                <Icon size={24} />
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="ai-section ai-architecture" id="security">
        <div>
          <p className="ai-eyebrow">Security Architecture</p>
          <h2>地端資料處理，雲端只承載可公開展示的產品入口</h2>
        </div>
        <div className="architecture-map">
          <div>
            <Fingerprint size={22} />
            <strong>去識別化</strong>
            <span>個資與照護資料先做分流與遮蔽。</span>
          </div>
          <div>
            <DatabaseZap size={22} />
            <strong>資料暫存</strong>
            <span>斷線補傳與冪等去重預留架構。</span>
          </div>
          <div>
            <LockKeyhole size={22} />
            <strong>文件權限</strong>
            <span>文件參照與存取紀錄可追溯。</span>
          </div>
          <div>
            <ShieldCheck size={22} />
            <strong>出口稽核</strong>
            <span>後續銜接 egress log 與簽章。</span>
          </div>
        </div>
      </section>

      <section className="ai-cta">
        <div>
          <GitBranch size={28} />
          <h2>這是一個可比較的視覺版本</h2>
          <p>目前 `/variant-b` 不會覆蓋正式首頁。你確認喜歡後，我們再把它升級成 `wkbarret.com` 的主頁。</p>
        </div>
        <a className="ai-button ai-primary" href="/variant-b">
          留在此版本
        </a>
      </section>
    </main>
  );
}
