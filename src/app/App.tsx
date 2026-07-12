import { useState } from 'react';
import { ClipboardCheck, FileUp, ShieldCheck } from 'lucide-react';
import { EligibilityPage } from '../features/eligibility/EligibilityPage';

export type AppView = 'eligibility' | 'documents' | 'security';

const navItems = [
  { id: 'eligibility', label: '福利資格判定', icon: ClipboardCheck },
  { id: 'documents', label: '文件參照', icon: FileUp },
  { id: 'security', label: '權限紀錄', icon: ShieldCheck },
] as const;

export function App() {
  const [activeView, setActiveView] = useState<AppView>('eligibility');

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <p className="brand-kicker">照護方舟</p>
            <h1>ARKAI</h1>
          </div>
        </div>

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

      <EligibilityPage activeView={activeView} />
    </main>
  );
}
