import { useCallback, useMemo, useState } from 'react';
import {
  addEdge,
  Background,
  BaseEdge,
  ConnectionMode,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  getBezierPath,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Circle, Diamond, Download, Home, Save, Square, Trash2, Triangle } from 'lucide-react';
import { genogramSymbols, symbolGroups, type GenogramSymbol } from './genogramSymbols';

type FamilyTab = 'form' | 'genogram' | 'ecogram' | 'legend';
type Gender = 'male' | 'female' | 'unknown' | 'nonbinary';
type PersonStatus = 'none' | 'index' | 'deceased' | 'caregiver';
type RelationCategory = 'partner' | 'parentChild' | 'interaction' | 'event';

type PersonNodeData = {
  name: string;
  role: string;
  gender: Gender;
  status: PersonStatus;
  note: string;
  markers: string[];
};

type ResourceNodeData = {
  name: string;
  type: string;
  strength: 'strong' | 'medium' | 'weak' | 'stress';
};

type RelationEdgeData = {
  label: string;
  category: RelationCategory;
  lane: number;
};

type RelationTool = {
  id: string;
  label: string;
  category: RelationCategory;
  style?: Edge['style'];
  animated?: boolean;
  markerEnd?: Edge['markerEnd'];
};

const categoryLane: Record<RelationCategory, number> = {
  partner: 0,
  parentChild: 1,
  interaction: -1,
  event: 2,
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

const relationTools: Record<string, RelationTool> = {
  marriage: { id: 'marriage', label: '結婚', category: 'partner' },
  cohabitation: { id: 'cohabitation', label: '同居', category: 'partner', style: { strokeDasharray: '8 6' } },
  separation: { id: 'separation', label: '分居', category: 'partner', style: { strokeDasharray: '12 5' } },
  divorce: { id: 'divorce', label: '離婚', category: 'partner', style: { stroke: '#b91c1c' } },
  remarriage: { id: 'remarriage', label: '再婚', category: 'partner', style: { stroke: '#2f9c75' } },
  affair: { id: 'affair', label: '外遇', category: 'partner', style: { strokeDasharray: '3 6' } },
  committed: { id: 'committed', label: '承諾關係', category: 'partner', style: { strokeWidth: 2 } },
  'biological-child': { id: 'biological-child', label: '親生子女', category: 'parentChild' },
  adopted: { id: 'adopted', label: '收養', category: 'parentChild', style: { strokeDasharray: '8 6' } },
  foster: { id: 'foster', label: '寄養', category: 'parentChild', style: { strokeDasharray: '2 6' } },
  twins: { id: 'twins', label: '雙胞胎', category: 'parentChild', style: { strokeWidth: 2 } },
  'identical-twins': { id: 'identical-twins', label: '同卵雙胞胎', category: 'parentChild', style: { strokeWidth: 3 } },
  miscarriage: { id: 'miscarriage', label: '流產', category: 'event', style: { strokeDasharray: '4 4' } },
  stillbirth: { id: 'stillbirth', label: '死胎', category: 'event', style: { stroke: '#b91c1c' } },
  abortion: { id: 'abortion', label: '墮胎', category: 'event', style: { stroke: '#b45309' } },
  'sperm-donor': { id: 'sperm-donor', label: '捐精者', category: 'event', style: { strokeDasharray: '2 5' } },
  close: { id: 'close', label: '親近', category: 'interaction', style: { strokeWidth: 3 } },
  distant: { id: 'distant', label: '疏離', category: 'interaction', style: { strokeDasharray: '7 7' } },
  conflict: { id: 'conflict', label: '衝突', category: 'interaction', style: { stroke: '#b45309' } },
  hostile: { id: 'hostile', label: '敵意', category: 'interaction', style: { stroke: '#b91c1c', strokeWidth: 2 } },
  fused: { id: 'fused', label: '融合', category: 'interaction', style: { strokeWidth: 4 } },
  'close-hostile': { id: 'close-hostile', label: '親近且敵意', category: 'interaction', style: { stroke: '#b45309', strokeWidth: 3 } },
  'emotional-abuse': {
    id: 'emotional-abuse',
    label: '情緒虐待',
    category: 'interaction',
    style: { stroke: '#be123c' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  'physical-abuse': {
    id: 'physical-abuse',
    label: '身體虐待',
    category: 'interaction',
    style: { stroke: '#be123c', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  'sexual-abuse': {
    id: 'sexual-abuse',
    label: '性虐待',
    category: 'interaction',
    style: { stroke: '#be123c', strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  caregiver: {
    id: 'caregiver',
    label: '照顧者',
    category: 'interaction',
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  cutoff: { id: 'cutoff', label: '截斷', category: 'interaction', style: { strokeDasharray: '2 5' } },
  repair: { id: 'repair', label: '關係修復', category: 'interaction', style: { stroke: '#2f9c75' }, animated: true },
};

const defaultRelationTool = relationTools['biological-child'];

function makeRelationEdge(
  id: string,
  source: string,
  target: string,
  tool: RelationTool,
  laneOffset = 0,
): Edge<RelationEdgeData> {
  return {
    id,
    source,
    target,
    type: 'genogramRelation',
    animated: tool.animated,
    style: tool.style,
    markerEnd: tool.markerEnd,
    data: {
      label: tool.label,
      category: tool.category,
      lane: categoryLane[tool.category] + laneOffset,
    },
  };
}

const initialGenogramNodes: Node<PersonNodeData>[] = [
  {
    id: 'grandfather',
    type: 'person',
    position: { x: 120, y: 40 },
    data: { name: '林父', role: '父親', gender: 'male', status: 'deceased', note: '1941-2015', markers: [] },
  },
  {
    id: 'grandmother',
    type: 'person',
    position: { x: 300, y: 40 },
    data: { name: '陳母', role: '母親', gender: 'female', status: 'none', note: '', markers: [] },
  },
  {
    id: 'client',
    type: 'person',
    position: { x: 190, y: 210 },
    data: { name: '林女士', role: '個案本人', gender: 'female', status: 'index', note: '福利資格待確認', markers: ['身體疾病'] },
  },
  {
    id: 'spouse',
    type: 'person',
    position: { x: 430, y: 210 },
    data: { name: '王先生', role: '配偶', gender: 'male', status: 'none', note: '分居', markers: [] },
  },
  {
    id: 'daughter',
    type: 'person',
    position: { x: 240, y: 390 },
    data: { name: '林小安', role: '女兒/主要照顧者', gender: 'female', status: 'caregiver', note: '照顧壓力高', markers: [] },
  },
  {
    id: 'son',
    type: 'person',
    position: { x: 430, y: 390 },
    data: { name: '林小宇', role: '兒子', gender: 'male', status: 'none', note: '外縣市工作', markers: [] },
  },
];

const initialGenogramEdges: Edge<RelationEdgeData>[] = [
  makeRelationEdge('e-grandparents', 'grandfather', 'grandmother', relationTools.marriage),
  makeRelationEdge('e-parent-client', 'grandfather', 'client', relationTools['biological-child']),
  makeRelationEdge('e-spouse', 'client', 'spouse', relationTools.separation),
  makeRelationEdge('e-daughter', 'client', 'daughter', relationTools['biological-child']),
  makeRelationEdge('e-son', 'client', 'son', relationTools['biological-child']),
  makeRelationEdge('e-client-daughter-close', 'client', 'daughter', relationTools.close),
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

function GenogramRelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
  selected,
}: EdgeProps<Edge<RelationEdgeData>>) {
  const lane = data?.lane ?? 0;
  const label = data?.label ?? '';
  const curvature = 0.22 + Math.min(Math.abs(lane), 4) * 0.08;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={24}
        style={{
          strokeWidth: selected ? 3 : 2,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className={`relation-edge-label ${data?.category ?? ''}`}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + lane * 24}px)`,
          }}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function PersonNode({ data, selected }: NodeProps<Node<PersonNodeData>>) {
  const shapeClass = `person-symbol ${data.gender} ${data.status}`;

  return (
    <div className={`genogram-node ${selected ? 'selected' : ''}`}>
      {[
        ['top-source', 'source', Position.Top],
        ['top-target', 'target', Position.Top],
        ['right-source', 'source', Position.Right],
        ['right-target', 'target', Position.Right],
        ['bottom-source', 'source', Position.Bottom],
        ['bottom-target', 'target', Position.Bottom],
        ['left-source', 'source', Position.Left],
        ['left-target', 'target', Position.Left],
      ].map(([id, type, position]) => (
        <Handle
          className={`visible-handle ${id}`}
          id={id}
          key={id}
          type={type as 'source' | 'target'}
          position={position as Position}
        />
      ))}
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
      {data.markers.length > 0 && (
        <div className="node-marker-list">
          {data.markers.slice(0, 3).map((marker) => (
            <small key={marker}>{marker}</small>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceNode({ data }: NodeProps<Node<ResourceNodeData>>) {
  return (
    <div className={`resource-node ${data.strength}`}>
      <Handle className="visible-handle" type="target" position={Position.Top} />
      <Home size={22} />
      <strong>{data.name}</strong>
      <span>{data.type}</span>
      <Handle className="visible-handle" type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = {
  person: PersonNode,
  resource: ResourceNode,
};

const edgeTypes = {
  genogramRelation: GenogramRelationEdge,
};

function isRelationSymbol(symbol: GenogramSymbol) {
  return symbol.group === '伴侶關係' || symbol.group === '親子與出生事件' || symbol.group === '互動關係';
}

export function FamilySupportPage() {
  const [activeTab, setActiveTab] = useState<FamilyTab>('form');
  const [genogramNodes, setGenogramNodes, onGenogramNodesChange] = useNodesState(initialGenogramNodes);
  const [genogramEdges, setGenogramEdges, onGenogramEdgesChange] = useEdgesState(initialGenogramEdges);
  const [ecogramNodes, , onEcogramNodesChange] = useNodesState(initialEcogramNodes);
  const [ecogramEdges, , onEcogramEdgesChange] = useEdgesState(initialEcogramEdges);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('client');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');
  const [activeRelationTool, setActiveRelationTool] = useState<RelationTool>(defaultRelationTool);

  const selectedPerson = genogramNodes.find((node) => node.id === selectedPersonId);
  const selectedEdge = genogramEdges.find((edge) => edge.id === selectedEdgeId);
  const selectedLegend = useMemo(
    () =>
      symbolGroups.map((group) => ({
        group,
        symbols: genogramSymbols.filter((symbol) => symbol.group === group),
      })),
    [],
  );

  const addPerson = (gender: Gender = 'female') => {
    const id = `person-${Date.now()}`;
    const nextPosition = {
      x: 120 + (genogramNodes.length % 4) * 180,
      y: 120 + Math.floor(genogramNodes.length / 4) * 150,
    };

    setGenogramNodes((current) => [
      ...current,
      {
        id,
        type: 'person',
        position: nextPosition,
        selected: true,
        data: {
          name: '新成員',
          role: '家庭成員',
          gender,
          status: 'none',
          note: '',
          markers: [],
        },
      },
    ]);
    setSelectedPersonId(id);
  };

  const deleteSelectedPerson = () => {
    if (!selectedPersonId) return;

    setGenogramNodes((current) => current.filter((node) => node.id !== selectedPersonId));
    setGenogramEdges((current) =>
      current.filter((edge) => edge.source !== selectedPersonId && edge.target !== selectedPersonId),
    );
    setSelectedPersonId('');
    setSelectedEdgeId('');
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;

    setGenogramEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId('');
  };

  const updateSelectedPerson = <K extends keyof PersonNodeData>(key: K, value: PersonNodeData[K]) => {
    if (!selectedPersonId) return;

    setGenogramNodes((current) =>
      current.map((node) =>
        node.id === selectedPersonId
          ? {
              ...node,
              data: {
                ...node.data,
                [key]: value,
              },
            }
          : node,
      ),
    );
  };

  const applySymbol = (symbol: GenogramSymbol) => {
    if (isRelationSymbol(symbol)) {
      setActiveRelationTool(relationTools[symbol.id] ?? { id: symbol.id, label: symbol.label, category: 'interaction' });
      return;
    }

    if (!selectedPerson) return;

    if (symbol.id === 'male' || symbol.id === 'female' || symbol.id === 'unknown' || symbol.id === 'nonbinary') {
      updateSelectedPerson('gender', symbol.id);
      return;
    }

    if (symbol.id === 'index-person') {
      updateSelectedPerson('status', 'index');
      return;
    }

    if (symbol.id === 'death') {
      updateSelectedPerson('status', 'deceased');
      return;
    }

    if (symbol.id === 'caregiver') {
      updateSelectedPerson('status', 'caregiver');
      return;
    }

    const nextMarkers = selectedPerson.data.markers.includes(symbol.label)
      ? selectedPerson.data.markers.filter((marker) => marker !== symbol.label)
      : [...selectedPerson.data.markers, symbol.label];

    updateSelectedPerson('markers', nextMarkers);
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;

      const samePairCount = genogramEdges.filter(
        (edge) =>
          (edge.source === connection.source && edge.target === connection.target) ||
          (edge.source === connection.target && edge.target === connection.source),
      ).length;

      setGenogramEdges((current) =>
        addEdge(
          {
            ...makeRelationEdge(
              `edge-${Date.now()}`,
              connection.source!,
              connection.target!,
              activeRelationTool,
              samePairCount,
            ),
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
          },
          current,
        ),
      );
    },
    [activeRelationTool, genogramEdges, setGenogramEdges],
  );

  const onSelectionChange = useCallback((selection: OnSelectionChangeParams) => {
    const selectedNode = selection.nodes.find((node) => node.type === 'person');
    const selectedRelation = selection.edges[0] as Edge<RelationEdgeData> | undefined;
    setSelectedPersonId(selectedNode?.id ?? '');
    setSelectedEdgeId(selectedNode ? '' : selectedRelation?.id ?? '');
  }, []);

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
            <div>
              <strong>新增人物</strong>
              <button type="button" onClick={() => addPerson('male')}>
                <Square size={16} />
                新增男性
              </button>
              <button type="button" onClick={() => addPerson('female')}>
                <Circle size={16} />
                新增女性
              </button>
              <button type="button" onClick={() => addPerson('unknown')}>
                <Diamond size={16} />
                新增未知
              </button>
              <button type="button" onClick={() => addPerson('nonbinary')}>
                <Triangle size={16} />
                新增非二元
              </button>
            </div>
            <div className="active-relation-tool">
              <strong>目前連線類型</strong>
              <span>{activeRelationTool.label}</span>
              <small>每個角色四邊都有綠色把手，可從任意把手拖到任意角色建立關係。</small>
            </div>
            {selectedLegend.map((group) => (
              <div key={group.group}>
                <strong>{group.group}</strong>
                {group.symbols.map((symbol) => {
                  const Icon = symbol.icon;
                  const isRelation = isRelationSymbol(symbol);
                  const isActiveRelation = activeRelationTool.id === symbol.id;
                  const isAppliedMarker = selectedPerson?.data.markers.includes(symbol.label);
                  return (
                    <button
                      type="button"
                      key={symbol.id}
                      className={isActiveRelation || isAppliedMarker ? 'active-tool' : ''}
                      onClick={() => applySymbol(symbol)}
                    >
                      <Icon size={16} />
                      {isRelation ? `線：${symbol.label}` : symbol.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>
          <section className="panel graph-panel">
            <ReactFlow
              nodes={genogramNodes}
              edges={genogramEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              deleteKeyCode={['Backspace', 'Delete']}
              onNodesChange={onGenogramNodesChange}
              onEdgesChange={onGenogramEdgesChange}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              onEdgesDelete={() => setSelectedEdgeId('')}
              onNodesDelete={() => setSelectedPersonId('')}
              fitView
            >
              <Background />
              <Controls />
            </ReactFlow>
          </section>
          <aside className="panel inspector-panel">
            <h3>屬性面板</h3>
            {selectedPerson ? (
              <>
                <label>
                  姓名
                  <input
                    value={selectedPerson.data.name}
                    onChange={(event) => updateSelectedPerson('name', event.target.value)}
                  />
                </label>
                <label>
                  角色
                  <input
                    value={selectedPerson.data.role}
                    onChange={(event) => updateSelectedPerson('role', event.target.value)}
                  />
                </label>
                <label>
                  性別符號
                  <select
                    value={selectedPerson.data.gender}
                    onChange={(event) => updateSelectedPerson('gender', event.target.value as Gender)}
                  >
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="unknown">未知</option>
                    <option value="nonbinary">非二元</option>
                  </select>
                </label>
                <label>
                  標記
                  <select
                    value={selectedPerson.data.status}
                    onChange={(event) => updateSelectedPerson('status', event.target.value as PersonStatus)}
                  >
                    <option value="none">無</option>
                    <option value="index">個案本人</option>
                    <option value="caregiver">主要照顧者</option>
                    <option value="deceased">死亡</option>
                  </select>
                </label>
                <label>
                  已套用符號
                  <textarea
                    value={selectedPerson.data.markers.join('、')}
                    onChange={(event) =>
                      updateSelectedPerson(
                        'markers',
                        event.target.value
                          .split('、')
                          .map((value) => value.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
                <label>
                  備註
                  <textarea
                    value={selectedPerson.data.note}
                    onChange={(event) => updateSelectedPerson('note', event.target.value)}
                  />
                </label>
                <button type="button" className="danger-button" onClick={deleteSelectedPerson}>
                  <Trash2 size={16} />
                  刪除角色
                </button>
              </>
            ) : selectedEdge ? (
              <div className="relation-inspector">
                <div>
                  <span>關係線</span>
                  <strong>{selectedEdge.data?.label ?? '未命名關係'}</strong>
                </div>
                <div>
                  <span>來源</span>
                  <strong>
                    {genogramNodes.find((node) => node.id === selectedEdge.source)?.data.name ?? selectedEdge.source}
                  </strong>
                </div>
                <div>
                  <span>目標</span>
                  <strong>
                    {genogramNodes.find((node) => node.id === selectedEdge.target)?.data.name ?? selectedEdge.target}
                  </strong>
                </div>
                <button type="button" className="danger-button" onClick={deleteSelectedEdge}>
                  <Trash2 size={16} />
                  刪除關係線
                </button>
              </div>
            ) : (
              <div className="empty-state">請選取角色或關係線，或從左側新增人物。</div>
            )}
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
            <ReactFlow
              nodes={ecogramNodes}
              edges={ecogramEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onEcogramNodesChange}
              onEdgesChange={onEcogramEdgesChange}
              fitView
            >
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
            <p>第一版先完整列出產品要支援的專業符號分類，並讓核心符號能套用到人物或下一條關係線。</p>
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
