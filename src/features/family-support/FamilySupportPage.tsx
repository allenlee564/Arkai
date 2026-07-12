import { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Circle, Diamond, Download, Home, Save, Square, Triangle } from 'lucide-react';
import { genogramSymbols, symbolGroups } from './genogramSymbols';

type FamilyTab = 'form' | 'genogram' | 'ecogram' | 'legend';

type PersonNodeData = {
  name: string;
  role: string;
  gender: 'male' | 'female' | 'unknown' | 'nonbinary';
  status?: 'index' | 'deceased' | 'caregiver';
  note?: string;
};

type ResourceNodeData = {
  name: string;
  type: string;
  strength: 'strong' | 'medium' | 'weak' | 'stress';
};

const familyMembers = [
  { name: '林女士', relation: '個案本人', support: '中', caregiver: '否', risk: '跌倒風險、文件待補' },
  { name: '王先生', relation: '配偶', support: '低', caregiver: '否', risk: '長期分居' },
  { name: '林小安', relation: '女兒', support: '高', caregiver: '是', risk: '照顧壓力高' },
  { name: '林小宇', relation: '兒子', support: '中', caregiver: '否', risk: '外縣市工作' },
];

const supportFields = [
  { label: '主要照顧者', value: '林小安（女兒）' },
  { label: '家庭支持強度', value: '中度支持，主要依賴單一照顧者' },
  { label: '目前風險', value: '照顧者負荷高、福利資格證明待補' },
  { label: '外部資源', value: '里長、居服單位、日照中心待評估' },
];

const initialGenogramNodes: Node<PersonNodeData>[] = [
  { id: 'grandfather', type: 'person', position: { x: 120, y: 40 }, data: { name: '林父', role: '父親', gender: 'male', status: 'deceased' } },
  { id: 'grandmother', type: 'person', position: { x: 300, y: 40 }, data: { name: '陳母', role: '母親', gender: 'female' } },
  { id: 'client', type: 'person', position: { x: 190, y: 210 }, data: { name: '林女士', role: '個案本人', gender: 'female', status: 'index' } },
  { id: 'spouse', type: 'person', position: { x: 430, y: 210 }, data: { name: '王先生', role: '配偶', gender: 'male', note: '分居' } },
  { id: 'daughter', type: 'person', position: { x: 240, y: 390 }, data: { name: '林小安', role: '女兒/主要照顧者', gender: 'female', status: 'caregiver' } },
  { id: 'son', type: 'person', position: { x: 430, y: 390 }, data: { name: '林小宇', role: '兒子', gender: 'male' } },
];

const initialGenogramEdges: Edge[] = [
  { id: 'e-grandparents', source: 'grandfather', target: 'grandmother', type: 'straight', label: '結婚' },
  { id: 'e-parent-client', source: 'grandfather', target: 'client', type: 'smoothstep', label: '親子' },
  { id: 'e-spouse', source: 'client', target: 'spouse', type: 'straight', label: '分居', style: { strokeDasharray: '8 6' } },
  { id: 'e-daughter', source: 'client', target: 'daughter', type: 'smoothstep', label: '親子' },
  { id: 'e-son', source: 'client', target: 'son', type: 'smoothstep', label: '親子' },
];

const initialEcogramNodes: Node<ResourceNodeData>[] = [
  { id: 'case', type: 'resource', position: { x: 360, y: 220 }, data: { name: '林女士', type: '個案', strength: 'strong' } },
  { id: 'daughter-care', type: 'resource', position: { x: 80, y: 80 }, data: { name: '女兒', type: '主要照顧者', strength: 'strong' } },
  { id: 'daycare', type: 'resource', position: { x: 640, y: 90 }, data: { name: '日照中心', type: '待評估資源', strength: 'medium' } },
  { id: 'hospital', type: 'resource', position: { x: 110, y: 390 }, data: { name: '醫院', type: '醫療資源', strength: 'medium' } },
  { id: 'spouse-resource', type: 'resource', position: { x: 660, y: 390 }, data: { name: '配偶', type: '壓力來源', strength: 'stress' } },
];

const initialEcogramEdges: Edge[] = [
  { id: 'eco-daughter', source: 'case', target: 'daughter-care', label: '強支持', animated: true },
  { id: 'eco-daycare', source: 'case', target: 'daycare', label: '待連結', style: { strokeDasharray: '8 6' } },
  { id: 'eco-hospital', source: 'case', target: 'hospital', label: '中度支持' },
  { id: 'eco-spouse', source: 'case', target: 'spouse-resource', label: '緊張', style: { stroke: '#b45309' } },
];

function PersonNode({ data }: NodeProps<Node<PersonNodeData>>) {
  const shapeClass = `person-symbol ${data.gender} ${data.status ?? ''}`;

  return (
    <div className="genogram-node">
      <Handle type="target" position={Position.Top} />
      <div className={shapeClass}>
        {data.gender === 'male' && <Square size={38} />}
        {data.gender === 'female' && <Circle size={40} />}
        {data.gender === 'unknown' && <Diamond size={40} />}
        {data.gender === 'nonbinary' && <Triangle size={40} />}
        {data.status === 'deceased' && <span className="death-mark">X</span>}
      </div>
      <strong>{data.name}</strong>
      <span>{data.role}</span>
      {data.note && <em>{data.note}</em>}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function ResourceNode({ data }: NodeProps<Node<ResourceNodeData>>) {
  return (
    <div className={`resource-node ${data.strength}`}>
      <Handle type="target" position={Position.Top} />
      <Home size={22} />
      <strong>{data.name}</strong>
      <span>{data.type}</span>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  person: PersonNode,
  resource: ResourceNode,
};

export function FamilySupportPage() {
  const [activeTab, setActiveTab] = useState<FamilyTab>('form');
  const [genogramNodes] = useState(initialGenogramNodes);
  const [genogramEdges] = useState(initialGenogramEdges);
  const [ecogramNodes] = useState(initialEcogramNodes);
  const [ecogramEdges] = useState(initialEcogramEdges);
  const selectedLegend = useMemo(
    () =>
      symbolGroups.map((group) => ({
        group,
        symbols: genogramSymbols.filter((symbol) => symbol.group === group),
      })),
    [],
  );

  return (
    <section className="content family-support-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">開案前 / 家庭支持評估</p>
          <h2>家系圖、生態圖與家庭支持表單</h2>
        </div>
        <div className="family-actions">
          <button type="button" className="secondary">
            <Save size={16} />
            暫存
          </button>
          <button type="button" className="primary">
            <Download size={16} />
            匯出
          </button>
        </div>
      </header>

      <div className="family-tabs" role="tablist" aria-label="家庭支持評估功能">
        {[
          ['form', '家庭支持表單'],
          ['genogram', '家系圖編輯器'],
          ['ecogram', '生態圖編輯器'],
          ['legend', '完整符號圖例'],
        ].map(([id, label]) => (
          <button
            type="button"
            key={id}
            className={activeTab === id ? 'active' : ''}
            onClick={() => setActiveTab(id as FamilyTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <div className="family-layout">
          <section className="panel form-panel">
            <div className="section-heading">
              <h3>家庭成員與支持摘要</h3>
              <p>第一版先以 mock 資料建立結構，後續可銜接家庭支持 API。</p>
            </div>
            <div className="support-summary-grid">
              {supportFields.map((field) => (
                <div className="support-summary-item" key={field.label}>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                </div>
              ))}
            </div>
            <div className="family-table">
              {familyMembers.map((member) => (
                <article key={member.name}>
                  <strong>{member.name}</strong>
                  <span>{member.relation}</span>
                  <span>支持：{member.support}</span>
                  <span>主要照顧者：{member.caregiver}</span>
                  <p>{member.risk}</p>
                </article>
              ))}
            </div>
          </section>
          <aside className="panel symbol-preview-panel">
            <div className="section-heading">
              <h3>常用符號快捷</h3>
              <p>完整符號請切換到圖例頁籤。</p>
            </div>
            <div className="symbol-chip-list">
              {genogramSymbols.slice(0, 14).map((symbol) => {
                const Icon = symbol.icon;
                return (
                  <button type="button" key={symbol.id}>
                    <Icon size={16} />
                    {symbol.label}
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'genogram' && (
        <div className="editor-shell">
          <aside className="panel editor-toolbox">
            <h3>符號工具箱</h3>
            {selectedLegend.slice(0, 4).map((group) => (
              <div key={group.group}>
                <strong>{group.group}</strong>
                {group.symbols.slice(0, 8).map((symbol) => {
                  const Icon = symbol.icon;
                  return (
                    <button type="button" key={symbol.id}>
                      <Icon size={16} />
                      {symbol.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>
          <section className="panel graph-panel">
            <ReactFlow
              nodes={genogramNodes}
              edges={genogramEdges.map((edge) => ({
                ...edge,
                markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
              }))}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </section>
          <aside className="panel inspector-panel">
            <h3>屬性面板</h3>
            <label>
              姓名
              <input value="林女士" readOnly />
            </label>
            <label>
              角色
              <input value="個案本人" readOnly />
            </label>
            <label>
              標記
              <select defaultValue="index">
                <option value="index">個案本人</option>
                <option value="caregiver">主要照顧者</option>
                <option value="deceased">死亡</option>
              </select>
            </label>
            <label>
              備註
              <textarea defaultValue="福利資格待確認，女兒為主要照顧者。" />
            </label>
          </aside>
        </div>
      )}

      {activeTab === 'ecogram' && (
        <div className="editor-shell ecogram-shell">
          <aside className="panel editor-toolbox">
            <h3>生態資源</h3>
            {['家庭', '鄰里', '醫療', '社福', '日照', '居服', '宗教', '政府補助'].map((item) => (
              <button type="button" key={item}>
                <Home size={16} />
                {item}
              </button>
            ))}
          </aside>
          <section className="panel graph-panel">
            <ReactFlow nodes={ecogramNodes} edges={ecogramEdges} nodeTypes={nodeTypes} fitView>
              <Background />
              <Controls />
            </ReactFlow>
          </section>
          <aside className="panel inspector-panel">
            <h3>關係強度</h3>
            <div className="relationship-legend">
              <span className="strong">強支持</span>
              <span className="medium">中度支持</span>
              <span className="weak">弱連結</span>
              <span className="stress">壓力/衝突</span>
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'legend' && (
        <section className="panel legend-panel">
          <div className="section-heading">
            <h3>標準家系圖符號系統</h3>
            <p>第一版先完整列出產品要支援的專業符號分類，後續會逐步讓每個符號都能拖曳到畫布。</p>
          </div>
          <div className="legend-group-grid">
            {selectedLegend.map((group) => (
              <article className="legend-group" key={group.group}>
                <h4>{group.group}</h4>
                <div>
                  {group.symbols.map((symbol) => {
                    const Icon = symbol.icon;
                    return (
                      <span key={symbol.id}>
                        <Icon size={16} />
                        <strong>{symbol.label}</strong>
                        <em>{symbol.description}</em>
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
