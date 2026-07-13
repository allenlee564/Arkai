import { useMemo, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, Dumbbell, Footprints, RotateCcw, Save } from 'lucide-react';

type Mobility = '' | 'independent' | 'walker' | 'wheelchair' | 'bedridden';
type SkinCondition = 'none' | 'pressure-injury' | 'redness' | 'wound';

type PhysiologicalAssessment = {
  assessmentId: string;
  mobility: Mobility;
  skinConditions: SkinCondition[];
  skinNote: string;
  visionStatus: string;
  hearingStatus: string;
  depressionTool: string;
  depressionScore: string;
  lifeBackgroundNote: string;
};

const storageKey = 'arkai-physiological-assessment';

const initialAssessment: PhysiologicalAssessment = {
  assessmentId: '',
  mobility: '',
  skinConditions: [],
  skinNote: '',
  visionStatus: '',
  hearingStatus: '',
  depressionTool: 'GDS-5',
  depressionScore: '',
  lifeBackgroundNote: '',
};

const mobilityOptions: Array<{ value: Exclude<Mobility, ''>; label: string }> = [
  { value: 'independent', label: '獨立行走' },
  { value: 'walker', label: '助行器輔助' },
  { value: 'wheelchair', label: '輪椅' },
  { value: 'bedridden', label: '臥床' },
];

const skinOptions: Array<{ value: SkinCondition; label: string }> = [
  { value: 'none', label: '無異常' },
  { value: 'pressure-injury', label: '壓傷' },
  { value: 'redness', label: '紅腫' },
  { value: 'wound', label: '傷口' },
];

const existingAssessments = [
  { name: '認知功能', source: '既有認知評估表', icon: Brain },
  { name: '巴氏量表', source: '既有巴氏量表', icon: CheckCircle2 },
  { name: 'SPPB', source: '既有體能評估表', icon: Dumbbell },
];

export function PhysiologicalAssessmentPage() {
  const [assessment, setAssessment] = useState<PhysiologicalAssessment>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...initialAssessment, ...JSON.parse(saved) } : initialAssessment;
    } catch {
      return initialAssessment;
    }
  });
  const [savedAt, setSavedAt] = useState('');

  const completion = useMemo(() => {
    const fields = [
      assessment.assessmentId,
      assessment.mobility,
      assessment.skinConditions.length > 0 ? 'filled' : '',
      assessment.visionStatus,
      assessment.hearingStatus,
      assessment.depressionTool && assessment.depressionScore,
      assessment.lifeBackgroundNote,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [assessment]);

  const toggleSkinCondition = (condition: SkinCondition) => {
    setAssessment((current) => {
      if (condition === 'none') {
        return { ...current, skinConditions: current.skinConditions.includes('none') ? [] : ['none'] };
      }

      const withoutNone = current.skinConditions.filter((item) => item !== 'none');
      const skinConditions = withoutNone.includes(condition)
        ? withoutNone.filter((item) => item !== condition)
        : [...withoutNone, condition];
      return { ...current, skinConditions };
    });
  };

  const saveAssessment = () => {
    localStorage.setItem(storageKey, JSON.stringify(assessment));
    setSavedAt(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }));
  };

  const clearAssessment = () => {
    localStorage.removeItem(storageKey);
    setAssessment(initialAssessment);
    setSavedAt('');
  };

  return (
    <section className="content physiological-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">開案前 / 生理需求評估</p>
          <h2>生理需求評估補充欄位</h2>
        </div>
        <div className="progress-summary" aria-label={`完成度 ${completion}%`}>
          <span>{completion}%</span>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${completion}%` }} /></div>
        </div>
      </header>

      <div className="physiological-layout">
        <form className="panel physiological-form" onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading">
            <h3>入住前初評補充資料</h3>
            <p>沿用既有開案評估記錄，僅填寫現有量表尚未涵蓋的項目。</p>
          </div>

          <section className="assessment-section">
            <div className="assessment-section-heading">
              <span>01</span><div><h4>評估識別</h4><p>連結既有開案評估記錄。</p></div>
            </div>
            <label>對應開案評估編號<input value={assessment.assessmentId} onChange={(event) => setAssessment({ ...assessment, assessmentId: event.target.value })} placeholder="例如：OA-2026-0001" /></label>
          </section>

          <section className="assessment-section">
            <div className="assessment-section-heading">
              <span>02</span><div><h4>行動能力</h4><p>入住前初評的整體移動方式分類。</p></div>
            </div>
            <div className="segmented-field" role="radiogroup" aria-label="行動能力">
              {mobilityOptions.map((option) => (
                <button type="button" role="radio" aria-checked={assessment.mobility === option.value} className={assessment.mobility === option.value ? 'active' : ''} key={option.value} onClick={() => setAssessment({ ...assessment, mobility: option.value })}>{option.label}</button>
              ))}
            </div>
          </section>

          <section className="assessment-section">
            <div className="assessment-section-heading">
              <span>03</span><div><h4>皮膚完整性</h4><p>記錄壓傷、紅腫、傷口及補充說明。</p></div>
            </div>
            <div className="skin-option-grid">
              {skinOptions.map((option) => (
                <label className={assessment.skinConditions.includes(option.value) ? 'checked' : ''} key={option.value}>
                  <input type="checkbox" checked={assessment.skinConditions.includes(option.value)} onChange={() => toggleSkinCondition(option.value)} />{option.label}
                </label>
              ))}
            </div>
            <label>皮膚狀況備註<textarea value={assessment.skinNote} onChange={(event) => setAssessment({ ...assessment, skinNote: event.target.value })} placeholder="請描述部位、範圍或目前處置情形" /></label>
          </section>

          <section className="assessment-section">
            <div className="assessment-section-heading">
              <span>04</span><div><h4>感官狀態</h4><p>依實際觀察或既有紀錄描述。</p></div>
            </div>
            <div className="form-grid">
              <label>視力狀態<input value={assessment.visionStatus} onChange={(event) => setAssessment({ ...assessment, visionStatus: event.target.value })} placeholder="請描述視力狀態" /></label>
              <label>聽力狀態<input value={assessment.hearingStatus} onChange={(event) => setAssessment({ ...assessment, hearingStatus: event.target.value })} placeholder="請描述聽力狀態" /></label>
            </div>
          </section>

          <section className="assessment-section">
            <div className="assessment-section-heading">
              <span>05</span><div><h4>憂鬱情緒篩檢</h4><p>記錄採用工具與原始分數，不在此表重複判讀。</p></div>
            </div>
            <div className="form-grid">
              <label>採用工具<input value={assessment.depressionTool} onChange={(event) => setAssessment({ ...assessment, depressionTool: event.target.value })} placeholder="例如：GDS-5" /></label>
              <label>分數<input type="number" min="0" step="1" value={assessment.depressionScore} onChange={(event) => setAssessment({ ...assessment, depressionScore: event.target.value })} placeholder="請輸入原始分數" /></label>
            </div>
          </section>

          <section className="assessment-section no-border">
            <div className="assessment-section-heading">
              <span>06</span><div><h4>生活背景備註</h4><p>補充生活習慣、居住背景或其他初評觀察。</p></div>
            </div>
            <label><textarea value={assessment.lifeBackgroundNote} onChange={(event) => setAssessment({ ...assessment, lifeBackgroundNote: event.target.value })} placeholder="請輸入生活背景備註" /></label>
          </section>

          <div className="actions physiological-actions">
            {savedAt && <span className="save-indicator"><CheckCircle2 size={15} />已於 {savedAt} 暫存</span>}
            <button type="button" className="secondary" onClick={clearAssessment}><RotateCcw size={16} />清除</button>
            <button type="button" className="primary" onClick={saveAssessment}><Save size={16} />暫存評估</button>
          </div>
        </form>

        <aside className="physiological-reference-column">
          <section className="panel existing-assessment-panel">
            <div className="section-heading"><h3>沿用既有評估</h3><p>以下項目不在本表重複建立欄位。</p></div>
            <div className="existing-assessment-list">
              {existingAssessments.map((item) => {
                const Icon = item.icon;
                return <div key={item.name}><Icon size={19} /><span><strong>{item.name}</strong><small>{item.source}</small></span><em>沿用</em></div>;
              })}
            </div>
          </section>

          <section className="mobility-warning">
            <AlertTriangle size={20} />
            <div><strong>行動能力口徑提醒</strong><p>本表記錄入住前初評的整體移動方式，與巴氏量表的移位／行走子項分數不同。兩者並存，不可互相取代。</p></div>
          </section>

          <section className="panel assessment-scope-panel">
            <Footprints size={21} />
            <div><strong>補充欄位原則</strong><p>只擴充既有量表未涵蓋項目，後續串接時仍以對應開案評估編號建立關聯。</p></div>
          </section>
        </aside>
      </div>
    </section>
  );
}
