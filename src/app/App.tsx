import { useState } from 'react';
import { ClipboardCheck, FilePlus2, HeartPulse, Network, ShieldCheck } from 'lucide-react';
import { EligibilityPage } from '../features/eligibility/EligibilityPage';
import { FamilySupportPage } from '../features/family-support/FamilySupportPage';
import { PhysiologicalAssessmentPage } from '../features/physiological/PhysiologicalAssessmentPage';
import { LandingPage } from '../features/marketing/LandingPage';
import { VariantBPage } from '../features/marketing/VariantBPage';
import { VariantCPage } from '../features/marketing/VariantCPage';

export type AppView = 'eligibility' | 'security' | 'family-support' | 'physiological' | 'blank-one' | 'blank-two';

const navItems = [
  { id: 'eligibility', label: '福利資格判定', icon: ClipboardCheck },
  { id: 'family-support', label: '家庭支持評估', icon: Network },
  { id: 'physiological', label: '生理需求評估', icon: HeartPulse },
  { id: 'blank-one', label: '檔案上傳', icon: FilePlus2 },
  { id: 'blank-two', label: '空白頁面二', icon: FilePlus2 },
  { id: 'security', label: '權限紀錄', icon: ShieldCheck },
] as const;

function BlankPage({ title }: { title: string }) {
  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">開案前 / 待規劃頁面</p>
          <h2>{title}</h2>
        </div>
      </header>
      <div className="workspace single-column">
        <section className="panel placeholder-panel blank-page-panel" aria-label={`${title}內容`} />
      </div>
    </section>
  );
}

function ProductApp() {
  const [activeView, setActiveView] = useState<AppView>('eligibility');

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="返回 ARKAI 官網">
          <div className="brand-mark">A</div>
          <div>
            <p className="brand-kicker">照護方舟</p>
            <h1>ARKAI</h1>
          </div>
        </a>

        <nav className="nav-list" aria-label="主要功能">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                className={`nav-item ${isActive ? 'active' : ''}`}
                type="button"
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {activeView === 'family-support' ? (
        <FamilySupportPage />
      ) : activeView === 'physiological' ? (
        <PhysiologicalAssessmentPage />
      ) : activeView === 'blank-one' ? (
        <BlankPage title="檔案上傳" />
      ) : activeView === 'blank-two' ? (
        <BlankPage title="空白頁面二" />
      ) : (
        <EligibilityPage activeView={activeView} />
      )}
    </main>
  );
}

export function App() {
  const path = window.location.pathname;

  if (path.startsWith('/app')) return <ProductApp />;
  if (path.startsWith('/variant-b')) return <VariantBPage />;
  if (path.startsWith('/variant-c')) return <VariantCPage />;

  return <LandingPage />;
}
