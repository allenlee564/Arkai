import { useMemo, useState } from 'react';
import { CheckCircle2, Download, Eye, FilePlus2, LockKeyhole, RotateCcw, Save, Send, Trash2, UploadCloud } from 'lucide-react';
import type { AppView } from '../../app/App';
import type { DocumentReference, EligibilityFormState } from './types';

const categoryOptions = [
  { value: 'low-income', label: '低收入 / 中低收入' },
  { value: 'disability', label: '身心障礙' },
  { value: 'elderly-alone', label: '獨居或高齡支持不足' },
  { value: 'long-term-care', label: '長照需求' },
  { value: 'urgent-care', label: '急迫照護需求' },
] as const;

const initialForm: EligibilityFormState = {
  caseName: '',
  nationalId: '',
  birthDate: '',
  phone: '',
  category: 'long-term-care',
  householdNote: '',
  careNeedNote: '',
  documents: [],
};

type EligibilityPageProps = {
  activeView: AppView;
};

export function EligibilityPage({ activeView }: EligibilityPageProps) {
  const [form, setForm] = useState<EligibilityFormState>(initialForm);
  const [documentDraft, setDocumentDraft] = useState({
    type: '身份證明',
    name: '',
    source: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  const completion = useMemo(() => {
    const requiredFields = [
      form.caseName,
      form.nationalId,
      form.birthDate,
      form.phone,
      form.householdNote,
      form.careNeedNote,
    ];
    const filled = requiredFields.filter(Boolean).length + (form.documents.length > 0 ? 1 : 0);
    return Math.round((filled / 7) * 100);
  }, [form]);

  const addDocument = () => {
    if (!documentDraft.name.trim() && !selectedFile) return;

    const id = crypto.randomUUID();

    const document: DocumentReference = {
      id,
      type: documentDraft.type,
      name: documentDraft.name.trim() || selectedFile?.name || '未命名文件',
      source: selectedFile ? `本機暫存 · ${selectedFile.name}` : documentDraft.source.trim() || '待補參照位置',
      status: selectedFile || documentDraft.source.trim() ? 'ready' : 'pending',
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      mimeType: selectedFile?.type,
      uploadedAt: selectedFile ? new Date().toISOString() : undefined,
    };

    if (selectedFile) {
      setFileUrls((current) => ({ ...current, [id]: URL.createObjectURL(selectedFile) }));
    }

    setForm((current) => ({
      ...current,
      documents: [...current.documents, document],
    }));
    setDocumentDraft({ type: '身份證明', name: '', source: '' });
    setSelectedFile(null);
    setFileError('');
  };

  const selectDocumentFile = (file?: File) => {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setSelectedFile(null);
      setFileError('單一檔案不可超過 20 MB');
      return;
    }

    setSelectedFile(file);
    setFileError('');
    setDocumentDraft((current) => ({
      ...current,
      name: current.name.trim() ? current.name : file.name.replace(/\.[^.]+$/, ''),
    }));
  };

  const removeDocument = (id: string) => {
    const fileUrl = fileUrls[id];
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrls((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setForm((current) => ({
      ...current,
      documents: current.documents.filter((document) => document.id !== id),
    }));
  };

  const formatFileSize = (size?: number) => {
    if (size === undefined) return '';
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">開案前 / 福利資格判定</p>
          <h2>{activeView === 'documents' ? '證明文件參照' : activeView === 'security' ? '權限紀錄' : '資格輸入'}</h2>
        </div>
        <div className="progress-summary" aria-label={`完成度 ${completion}%`}>
          <span>{completion}%</span>
          <div className="progress-track">
            <div className="progress-bar" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </header>

      {activeView === 'eligibility' && (
        <div className="workspace single-column">
          <form className="panel form-panel">
            <div className="section-heading">
              <h3>個案資格資料</h3>
              <p>先建立前端輸入結構，後續可接資格判定 API。</p>
            </div>

            <div className="form-grid">
              <label>
                個案姓名
                <input
                  value={form.caseName}
                  onChange={(event) => setForm({ ...form, caseName: event.target.value })}
                  placeholder="請輸入姓名"
                />
              </label>
              <label>
                身分證字號
                <input
                  value={form.nationalId}
                  onChange={(event) => setForm({ ...form, nationalId: event.target.value })}
                  placeholder="A123456789"
                />
              </label>
              <label>
                出生日期
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
                />
              </label>
              <label>
                聯絡電話
                <input
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="09xx-xxx-xxx"
                />
              </label>
              <label className="wide">
                資格類別
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as EligibilityFormState['category'] })
                  }
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wide">
                家戶與福利狀態
                <textarea
                  value={form.householdNote}
                  onChange={(event) => setForm({ ...form, householdNote: event.target.value })}
                  placeholder="例如：中低收入戶、家庭支持不足、主要照顧者狀況"
                />
              </label>
              <label className="wide">
                照護需求摘要
                <textarea
                  value={form.careNeedNote}
                  onChange={(event) => setForm({ ...form, careNeedNote: event.target.value })}
                  placeholder="例如：日常生活協助、復能需求、近期風險事件"
                />
              </label>
            </div>

            <div className="actions">
              <button type="button" className="secondary" onClick={() => setForm(initialForm)}>
                <RotateCcw size={16} />
                清除
              </button>
              <button type="button" className="secondary">
                <Save size={16} />
                暫存
              </button>
              <button type="button" className="primary">
                <Send size={16} />
                送出判定
              </button>
            </div>
          </form>
        </div>
      )}

      {activeView === 'documents' && (
        <div className="workspace single-column">
          <section className="panel document-panel">
            <div className="section-heading">
              <h3>證明文件參照</h3>
              <p>可加入參照位置或直接選取檔案；正式上線後再串接伺服器檔案儲存服務。</p>
            </div>

            <div className="document-layout">
              <div className="document-draft">
                <label className="file-upload-field">
                  上傳檔案
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    onChange={(event) => {
                      selectDocumentFile(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                  <span className={`file-upload-zone ${selectedFile ? 'has-file' : ''}`}>
                    <UploadCloud size={22} />
                    <strong>{selectedFile ? selectedFile.name : '選擇要上傳的文件'}</strong>
                    <small>{selectedFile ? `${formatFileSize(selectedFile.size)} · 已選取` : 'PDF、圖片、Office 文件，最大 20 MB'}</small>
                  </span>
                </label>
                {fileError && <p className="file-error" role="alert">{fileError}</p>}
                <label>
                  文件類型
                  <select
                    value={documentDraft.type}
                    onChange={(event) => setDocumentDraft({ ...documentDraft, type: event.target.value })}
                  >
                    <option>身份證明</option>
                    <option>福利資格證明</option>
                    <option>醫療或照護證明</option>
                    <option>其他佐證文件</option>
                  </select>
                </label>
                <label>
                  文件名稱
                  <input
                    value={documentDraft.name}
                    onChange={(event) => setDocumentDraft({ ...documentDraft, name: event.target.value })}
                    placeholder="例如：中低收入證明"
                  />
                </label>
                <label>
                  參照位置
                  <input
                    value={documentDraft.source}
                    onChange={(event) => setDocumentDraft({ ...documentDraft, source: event.target.value })}
                    placeholder="例如：檔案代號、雲端路徑或內部編號"
                  />
                </label>
                <button type="button" className="primary full-width" onClick={addDocument}>
                  <FilePlus2 size={16} />
                  {selectedFile ? '上傳並加入文件' : '加入文件參照'}
                </button>
              </div>

              <div className="document-list">
                {form.documents.length === 0 ? (
                  <div className="empty-state">尚未加入證明文件參照</div>
                ) : (
                  form.documents.map((document) => (
                    <article className="document-item" key={document.id}>
                      <div>
                        <span className="tag">{document.type}</span>
                        <h4>{document.name}</h4>
                        <p>{document.source}</p>
                        {document.fileName && <small className="document-file-meta">{document.mimeType || '檔案'} · {formatFileSize(document.fileSize)}</small>}
                      </div>
                      <div className="document-actions">
                        <span className={`status ${document.status}`}>
                          <CheckCircle2 size={14} />
                          {document.status === 'ready' ? '已參照' : '待補'}
                        </span>
                        {fileUrls[document.id] && (
                          <div className="document-file-actions">
                            <a className="icon-button" href={fileUrls[document.id]} target="_blank" rel="noreferrer" title="開啟文件" aria-label={`開啟 ${document.name}`}>
                              <Eye size={16} />
                            </a>
                            <a className="icon-button" href={fileUrls[document.id]} download={document.fileName} title="下載文件" aria-label={`下載 ${document.name}`}>
                              <Download size={16} />
                            </a>
                          </div>
                        )}
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`刪除 ${document.name}`}
                          onClick={() => removeDocument(document.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeView === 'security' && (
        <div className="workspace single-column">
          <section className="panel placeholder-panel">
            <LockKeyhole size={28} />
            <div>
              <h3>權限紀錄</h3>
              <p>這個區塊會留給後續資安與文件存取權限規格，目前先作為導覽佔位。</p>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
