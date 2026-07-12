import { ClipboardCheck, FileUp, ShieldCheck } from 'lucide-react';
import { EligibilityPage } from '../features/eligibility/EligibilityPage';

export function App() {
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
          <a className="nav-item active" href="#eligibility">
            <ClipboardCheck size={18} />
            福利資格判定
          </a>
          <a className="nav-item" href="#documents">
            <FileUp size={18} />
            文件參照
          </a>
          <a className="nav-item" href="#security">
            <ShieldCheck size={18} />
            權限紀錄
          </a>
        </nav>
      </aside>

      <EligibilityPage />
    </main>
  );
}
