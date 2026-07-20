import { createContext, useCallback, useContext, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { toPng } from 'html-to-image';
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
  ViewportPortal,
  getBezierPath,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronDown, Circle, Copy, Diamond, Download, FileImage, FileText, HeartHandshake, Home, Plus, Redo2, RotateCcw, Save, Square, Trash2, Triangle, Undo2, Upload, UserRoundCheck, Users, WandSparkles } from 'lucide-react';
import { genogramSymbols, symbolGroups, type GenogramSymbol } from './genogramSymbols';

type FamilyTab = 'form' | 'genogram' | 'ecogram' | 'legend';
type Gender = 'male' | 'female' | 'unknown' | 'nonbinary';
type PersonStatus = 'none' | 'index' | 'deceased' | 'caregiver';
type RelationCategory = 'partner' | 'parentChild' | 'interaction' | 'event';
type SupportLevel = 'high' | 'medium' | 'low' | 'none';

type PersonNodeData = {
  name: string;
  role: string;
  gender: Gender;
  status: PersonStatus;
  note: string;
  markers: string[];
  support: SupportLevel;
};

type ResourceNodeData = {
  name: string;
  type: string;
  strength: 'strong' | 'medium' | 'weak' | 'stress';
};

type ResourceStrength = ResourceNodeData['strength'];

type EcogramEdgeData = {
  strength: ResourceStrength;
  label: string;
};

type RelationEdgeData = {
  label: string;
  category: RelationCategory;
  lane: number;
  toolId?: string;
  labelOffsetX?: number;
  labelOffsetY?: number;
};

type RelationLabelDragActions = {
  selectLabel: (edgeId: string) => void;
  beginLabelDrag: () => void;
  moveLabel: (edgeId: string, offsetX: number, offsetY: number) => void;
  getZoom: () => number;
};

const RelationLabelDragContext = createContext<RelationLabelDragActions | null>(null);

type RelationTool = {
  id: string;
  label: string;
  category: RelationCategory;
  style?: Edge['style'];
  animated?: boolean;
  markerEnd?: Edge['markerEnd'];
};

type GenogramSnapshot = {
  nodes: Node<PersonNodeData>[];
  edges: Edge<RelationEdgeData>[];
};

const categoryLane: Record<RelationCategory, number> = {
  partner: 0,
  parentChild: 1,
  interaction: -1,
  event: 2,
};

const supportLabels: Record<SupportLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
  none: '無',
};

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
      toolId: tool.id,
    },
  };
}

function assignRelationLanes(edges: Edge<RelationEdgeData>[]) {
  const occupiedLanes = new Map<string, Set<number>>();

  return edges.map((edge) => {
    if (!edge.data) return edge;

    const pairKey = [edge.source, edge.target].sort().join('::');
    const occupied = occupiedLanes.get(pairKey) ?? new Set<number>();
    const direction = edge.data.category === 'interaction' ? -1 : 1;
    let lane = categoryLane[edge.data.category];

    while (occupied.has(lane)) lane += direction;
    occupied.add(lane);
    occupiedLanes.set(pairKey, occupied);

    return lane === edge.data.lane
      ? edge
      : { ...edge, data: { ...edge.data, lane } };
  });
}

function HouseholdBoundary({ nodes }: { nodes: Node<PersonNodeData>[] }) {
  const householdMembers = nodes.filter((node) => node.data.markers.includes('同住家庭'));
  if (householdMembers.length === 0) return null;

  const paddingX = 44;
  const paddingY = 48;
  const minX = Math.min(...householdMembers.map((node) => node.position.x));
  const minY = Math.min(...householdMembers.map((node) => node.position.y));
  const maxX = Math.max(
    ...householdMembers.map((node) => node.position.x + (node.measured?.width ?? 154)),
  );
  const maxY = Math.max(
    ...householdMembers.map((node) => node.position.y + (node.measured?.height ?? 130)),
  );

  return (
    <ViewportPortal>
      <div
        className="household-boundary"
        style={{
          transform: `translate(${minX - paddingX}px, ${minY - paddingY}px)`,
          width: maxX - minX + paddingX * 2,
          height: maxY - minY + paddingY * 2,
        }}
      >
        <span>同住家庭</span>
      </div>
    </ViewportPortal>
  );
}

const initialGenogramNodes: Node<PersonNodeData>[] = [
  {
    id: 'spouse-deceased',
    type: 'person',
    position: { x: 560, y: 40 },
    data: { name: '陳大明', role: '配偶', gender: 'male', status: 'deceased', note: '111年因心肌梗塞過世', markers: [], support: 'none' },
  },
  {
    id: 'client',
    type: 'person',
    position: { x: 300, y: 40 },
    data: { name: '王秀蘭', role: '案主・78歲', gender: 'female', status: 'index', note: '長照第5級；GDS-15為8分', markers: ['身體疾病', '同住家庭'], support: 'none' },
  },
  {
    id: 'eldest-son',
    type: 'person',
    position: { x: 80, y: 250 },
    data: { name: '王志明', role: '長子・52歲', gender: 'male', status: 'caregiver', note: '同住；主要照顧者；三明治世代壓力', markers: ['同住家庭'], support: 'high' },
  },
  {
    id: 'daughter-in-law',
    type: 'person',
    position: { x: 280, y: 250 },
    data: { name: '李佳玲', role: '長媳・50歲', gender: 'female', status: 'none', note: '同住；共同提供日常照顧', markers: ['同住家庭'], support: 'high' },
  },
  {
    id: 'second-son',
    type: 'person',
    position: { x: 540, y: 250 },
    data: { name: '王志偉', role: '次子・48歲', gender: 'male', status: 'none', note: '居住新北市；假日探視與電話問候', markers: [], support: 'low' },
  },
  {
    id: 'eldest-daughter',
    type: 'person',
    position: { x: 760, y: 250 },
    data: { name: '王美惠', role: '長女・45歲', gender: 'female', status: 'none', note: '居住高雄市；假日探視與電話問候', markers: [], support: 'low' },
  },
  {
    id: 'grandson',
    type: 'person',
    position: { x: 180, y: 470 },
    data: { name: '王小宇', role: '孫子・16歲', gender: 'male', status: 'none', note: '同住；就讀高中', markers: ['同住家庭'], support: 'low' },
  },
];

const initialGenogramEdges: Edge<RelationEdgeData>[] = [
  makeRelationEdge('e-client-spouse', 'spouse-deceased', 'client', relationTools.marriage),
  makeRelationEdge('e-client-eldest-son', 'client', 'eldest-son', relationTools['biological-child']),
  makeRelationEdge('e-client-second-son', 'client', 'second-son', relationTools['biological-child']),
  makeRelationEdge('e-client-eldest-daughter', 'client', 'eldest-daughter', relationTools['biological-child']),
  makeRelationEdge('e-eldest-couple', 'eldest-son', 'daughter-in-law', relationTools.marriage),
  makeRelationEdge('e-grandson', 'eldest-son', 'grandson', relationTools['biological-child']),
];

const initialEcogramNodes: Node<ResourceNodeData>[] = [
  { id: 'case', type: 'resource', position: { x: 410, y: 250 }, data: { name: '王秀蘭', type: '案主・長照第5級', strength: 'strong' } },
  { id: 'eldest-son-family', type: 'resource', position: { x: 410, y: 20 }, data: { name: '長子家庭（同住）', type: '日常生活照顧・經濟支持', strength: 'strong' } },
  { id: 'home-care', type: 'resource', position: { x: 80, y: 100 }, data: { name: '居家照顧服務', type: '身體照顧・每週3次', strength: 'medium' } },
  { id: 'medical', type: 'resource', position: { x: 40, y: 360 }, data: { name: '醫療（聯合醫院）', type: '骨科回診・血壓控制', strength: 'medium' } },
  { id: 'home-rehab', type: 'resource', position: { x: 280, y: 500 }, data: { name: '居家復健（物理治療）', type: '每週1-2次・下肢肌力訓練', strength: 'medium' } },
  { id: 'government', type: 'resource', position: { x: 750, y: 100 }, data: { name: '政府單位（區公所）', type: '福利諮詢・資源轉介', strength: 'weak' } },
  { id: 'religion', type: 'resource', position: { x: 820, y: 340 }, data: { name: '宗教信仰（佛堂共修）', type: '情緒支持・社交參與', strength: 'weak' } },
  { id: 'community', type: 'resource', position: { x: 650, y: 520 }, data: { name: '社區（里辦公處）', type: '急難通報・日常關懷', strength: 'weak' } },
];

const ecogramRelationStyles: Record<ResourceStrength, { label: string; style: Edge['style']; animated?: boolean }> = {
  strong: { label: '強支持', style: { stroke: '#16805f', strokeWidth: 4 }, animated: true },
  medium: { label: '中度支持', style: { stroke: '#397a9e', strokeWidth: 2 } },
  weak: { label: '弱連結', style: { stroke: '#7b8790', strokeDasharray: '8 6' } },
  stress: { label: '壓力／衝突', style: { stroke: '#b45309', strokeWidth: 2, strokeDasharray: '3 4' } },
};

function makeEcogramEdge(id: string, source: string, target: string, strength: ResourceStrength): Edge<EcogramEdgeData> {
  const relation = ecogramRelationStyles[strength];
  return { id, source, target, label: relation.label, data: { strength, label: relation.label }, style: relation.style, animated: relation.animated };
}

const initialEcogramEdges: Edge<EcogramEdgeData>[] = [
  makeEcogramEdge('eco-eldest-son-family', 'case', 'eldest-son-family', 'strong'),
  makeEcogramEdge('eco-home-care', 'case', 'home-care', 'medium'),
  makeEcogramEdge('eco-medical', 'case', 'medical', 'medium'),
  makeEcogramEdge('eco-home-rehab', 'case', 'home-rehab', 'medium'),
  makeEcogramEdge('eco-government', 'case', 'government', 'weak'),
  makeEcogramEdge('eco-religion', 'case', 'religion', 'weak'),
  makeEcogramEdge('eco-community', 'case', 'community', 'weak'),
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
  const labelDragActions = useContext(RelationLabelDragContext);
  const labelDragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    started: boolean;
  } | null>(null);
  const storedLane = data?.lane ?? 0;
  const lane = data?.category === 'interaction' && storedLane >= 0
    ? -(storedLane + 1)
    : storedLane;
  const label = data?.label ?? '';
  const defaultLane = data?.category ? categoryLane[data.category] : 0;
  const parallelIndex = Math.max(0, Math.abs(lane) - Math.abs(defaultLane));
  const labelDirection = data?.category === 'parentChild'
    ? 1
    : data?.category === 'partner'
      ? Math.sign(lane)
      : -1;
  const labelOffset = labelDirection * (14 + parallelIndex * 12);
  const curvature = 0.22 + Math.min(Math.abs(lane), 2) * 0.025;
  const manualOffsetX = data?.labelOffsetX ?? 0;
  const manualOffsetY = data?.labelOffsetY ?? 0;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const handleLabelPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    labelDragActions?.selectLabel(id);
    labelDragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: manualOffsetX,
      offsetY: manualOffsetY,
      started: false,
    };
  };

  const handleLabelPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = labelDragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.started && Math.hypot(deltaX, deltaY) < 2) return;
    if (!drag.started) {
      drag.started = true;
      labelDragActions?.beginLabelDrag();
    }

    const zoom = labelDragActions?.getZoom() ?? 1;
    labelDragActions?.moveLabel(id, drag.offsetX + deltaX / zoom, drag.offsetY + deltaY / zoom);
  };

  const handleLabelPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (labelDragState.current?.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    labelDragState.current = null;
  };

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
        <button
          type="button"
          className={`relation-edge-label nodrag nopan ${data?.category ?? ''}`}
          title="拖曳調整關係標籤位置"
          aria-label={`拖曳調整${label}標籤位置`}
          onPointerDown={handleLabelPointerDown}
          onPointerMove={handleLabelPointerMove}
          onPointerUp={handleLabelPointerUp}
          onPointerCancel={handleLabelPointerUp}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX + manualOffsetX}px, ${labelY + labelOffset + manualOffsetY}px)`,
          }}
        >
          {label}
        </button>
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

function ResourceNode({ data, selected }: NodeProps<Node<ResourceNodeData>>) {
  return (
    <div className={`resource-node ${data.strength} ${selected ? 'selected' : ''}`}>
      <Handle className="visible-handle" id="top" type="source" position={Position.Top} />
      <Handle className="visible-handle" id="right" type="source" position={Position.Right} />
      <Home size={22} />
      <strong>{data.name}</strong>
      <span>{data.type}</span>
      <Handle className="visible-handle" id="bottom" type="source" position={Position.Bottom} />
      <Handle className="visible-handle" id="left" type="source" position={Position.Left} />
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
  const [ecogramNodes, setEcogramNodes, onEcogramNodesChange] = useNodesState(initialEcogramNodes);
  const [ecogramEdges, setEcogramEdges, onEcogramEdgesChange] = useEdgesState(initialEcogramEdges);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('client');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');
  const [activeRelationTool, setActiveRelationTool] = useState<RelationTool>(defaultRelationTool);
  const [selectedResourceId, setSelectedResourceId] = useState('case');
  const [selectedEcogramEdgeId, setSelectedEcogramEdgeId] = useState('');
  const [activeEcogramStrength, setActiveEcogramStrength] = useState<ResourceStrength>('medium');
  const [openToolboxGroups, setOpenToolboxGroups] = useState<string[]>([]);
  const [genogramPast, setGenogramPast] = useState<GenogramSnapshot[]>([]);
  const [genogramFuture, setGenogramFuture] = useState<GenogramSnapshot[]>([]);
  const [genogramAnalysis, setGenogramAnalysis] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const ecogramImportInputRef = useRef<HTMLInputElement>(null);
  const genogramGraphRef = useRef<HTMLElement>(null);
  const ecogramGraphRef = useRef<HTMLElement>(null);
  const genogramInstanceRef = useRef<ReactFlowInstance<Node<PersonNodeData>, Edge<RelationEdgeData>> | null>(null);

  const selectedPerson = genogramNodes.find((node) => node.id === selectedPersonId);
  const selectedEdge = genogramEdges.find((edge) => edge.id === selectedEdgeId);
  const selectedEdgeToolId = selectedEdge?.data?.toolId
    ?? Object.values(relationTools).find((tool) => tool.label === selectedEdge?.data?.label)?.id
    ?? '';
  const selectedResource = ecogramNodes.find((node) => node.id === selectedResourceId);
  const selectedEcogramEdge = ecogramEdges.find((edge) => edge.id === selectedEcogramEdgeId);
  const familySupportFields = useMemo(() => {
    const indexPerson = genogramNodes.find((node) => node.data.status === 'index');
    const caregivers = genogramNodes.filter((node) => node.data.status === 'caregiver');
    const supportedMembers = genogramNodes.filter(
      (node) => node.data.status !== 'index' && (node.data.support === 'high' || node.data.support === 'medium'),
    );
    const coResidents = genogramNodes.filter((node) => node.data.markers.includes('同住家庭'));
    const risks = genogramNodes
      .filter((node) => node.data.status !== 'deceased')
      .map((node) => node.data.note)
      .filter(Boolean)
      .slice(0, 3);
    const resources = ecogramNodes.filter((node) => node.id !== 'case').map((node) => node.data.name);
    return [
      { label: '個案本人', value: indexPerson?.data.name || '尚未指定', tone: 'index' },
      { label: '主要照顧者', value: caregivers.map((node) => node.data.name).join('、') || '尚未指定', tone: 'caregiver' },
      { label: '家庭支持強度', value: `${supportedMembers.length} 位成員提供中度以上支持`, tone: '' },
      { label: '目前風險', value: risks.join('、') || '尚未填寫', tone: '' },
      { label: '同住家庭', value: coResidents.map((node) => node.data.name).join('、') || '尚未標記', tone: 'wide' },
      { label: '外部資源', value: resources.join('、') || '尚未建立', tone: 'wide' },
    ];
  }, [ecogramNodes, genogramNodes]);
  const selectedLegend = useMemo(
    () =>
      symbolGroups.map((group) => ({
        group,
        symbols: genogramSymbols.filter((symbol) => symbol.group === group),
      })),
    [],
  );

  const createGenogramSnapshot = useCallback(
    (): GenogramSnapshot => ({
      nodes: structuredClone(genogramNodes),
      edges: structuredClone(genogramEdges),
    }),
    [genogramEdges, genogramNodes],
  );

  const recordGenogramHistory = useCallback(() => {
    const snapshot = createGenogramSnapshot();
    setGenogramPast((current) => [...current, snapshot].slice(-50));
    setGenogramFuture([]);
  }, [createGenogramSnapshot]);

  const relationLabelDragActions = useMemo<RelationLabelDragActions>(
    () => ({
      selectLabel: (edgeId) => {
        setSelectedPersonId('');
        setSelectedEdgeId(edgeId);
      },
      beginLabelDrag: recordGenogramHistory,
      moveLabel: (edgeId, offsetX, offsetY) => {
        setGenogramEdges((current) =>
          current.map((edge) =>
            edge.id === edgeId
              ? {
                  ...edge,
                  data: {
                    ...edge.data!,
                    labelOffsetX: offsetX,
                    labelOffsetY: offsetY,
                  },
                }
              : edge,
          ),
        );
      },
      getZoom: () => genogramInstanceRef.current?.getZoom() ?? 1,
    }),
    [recordGenogramHistory, setGenogramEdges],
  );

  const undoGenogram = () => {
    if (genogramPast.length === 0) return;
    const previous = genogramPast[genogramPast.length - 1];
    setGenogramFuture((current) => [createGenogramSnapshot(), ...current].slice(0, 50));
    setGenogramPast((current) => current.slice(0, -1));
    setGenogramNodes(previous.nodes);
    setGenogramEdges(previous.edges);
    setSelectedPersonId('');
    setSelectedEdgeId('');
  };

  const redoGenogram = () => {
    if (genogramFuture.length === 0) return;
    const next = genogramFuture[0];
    setGenogramPast((current) => [...current, createGenogramSnapshot()].slice(-50));
    setGenogramFuture((current) => current.slice(1));
    setGenogramNodes(next.nodes);
    setGenogramEdges(next.edges);
    setSelectedPersonId('');
    setSelectedEdgeId('');
  };

  const addPerson = (gender: Gender = 'female') => {
    recordGenogramHistory();
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
          support: 'medium',
        },
      },
    ]);
    setSelectedPersonId(id);
  };

  const addFamilyMember = () => {
    addPerson('unknown');
  };

  const updateFamilyMember = <K extends keyof PersonNodeData>(id: string, key: K, value: PersonNodeData[K]) => {
    setGenogramNodes((current) =>
      current.map((node) => {
        if (key === 'status' && value === 'index' && node.id !== id && node.data.status === 'index') {
          return { ...node, data: { ...node.data, status: 'none' } };
        }
        return node.id === id ? { ...node, data: { ...node.data, [key]: value } } : node;
      }),
    );
  };

  const deleteFamilyMember = (id: string) => {
    recordGenogramHistory();
    setGenogramNodes((current) => current.filter((node) => node.id !== id));
    setGenogramEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedPersonId === id) setSelectedPersonId('');
  };

  const deleteSelectedPerson = () => {
    if (!selectedPersonId) return;

    recordGenogramHistory();
    setGenogramNodes((current) => current.filter((node) => node.id !== selectedPersonId));
    setGenogramEdges((current) =>
      current.filter((edge) => edge.source !== selectedPersonId && edge.target !== selectedPersonId),
    );
    setSelectedPersonId('');
    setSelectedEdgeId('');
  };

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;

    recordGenogramHistory();
    setGenogramEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId('');
  };

  const updateSelectedPerson = <K extends keyof PersonNodeData>(key: K, value: PersonNodeData[K]) => {
    if (!selectedPersonId) return;

    setGenogramNodes((current) =>
      current.map((node) => {
        if (key === 'status' && value === 'index' && node.id !== selectedPersonId && node.data.status === 'index') {
          return { ...node, data: { ...node.data, status: 'none' } };
        }
        return node.id === selectedPersonId
          ? {
              ...node,
              data: {
                ...node.data,
                [key]: value,
              },
            }
          : node;
      }),
    );
  };

  const applySymbol = (symbol: GenogramSymbol) => {
    if (isRelationSymbol(symbol)) {
      setActiveRelationTool(relationTools[symbol.id] ?? { id: symbol.id, label: symbol.label, category: 'interaction' });
      return;
    }

    if (!selectedPerson) return;
    recordGenogramHistory();

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

  const duplicateSelectedPerson = () => {
    if (!selectedPerson) return;
    recordGenogramHistory();
    const id = `person-${Date.now()}`;
    setGenogramNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      {
        ...structuredClone(selectedPerson),
        id,
        position: { x: selectedPerson.position.x + 48, y: selectedPerson.position.y + 48 },
        selected: true,
        data: {
          ...structuredClone(selectedPerson.data),
          name: `${selectedPerson.data.name} 副本`,
          status: selectedPerson.data.status === 'index' ? 'none' : selectedPerson.data.status,
        },
      },
    ]);
    setSelectedPersonId(id);
    setSelectedEdgeId('');
  };

  const addQuickFamilyStructure = (kind: 'spouse' | 'child' | 'parents') => {
    if (!selectedPerson) return;
    recordGenogramHistory();
    const baseId = Date.now();
    const makePerson = (
      id: string,
      name: string,
      role: string,
      gender: Gender,
      position: { x: number; y: number },
    ): Node<PersonNodeData> => ({
      id,
      type: 'person',
      position,
      data: {
        name,
        role,
        gender,
        status: 'none',
        note: '',
        markers: [],
        support: 'medium',
      },
    });

    if (kind === 'spouse') {
      const id = `spouse-${baseId}`;
      const spouseGender: Gender = selectedPerson.data.gender === 'male'
        ? 'female'
        : selectedPerson.data.gender === 'female'
          ? 'male'
          : 'unknown';
      const node = makePerson(
        id,
        '新配偶',
        '配偶',
        spouseGender,
        { x: selectedPerson.position.x + 230, y: selectedPerson.position.y },
      );
      setGenogramNodes((current) => [...current, node]);
      setGenogramEdges((current) => [
        ...current,
        makeRelationEdge(`edge-spouse-${baseId}`, selectedPerson.id, id, relationTools.marriage),
      ]);
      setSelectedPersonId(id);
      return;
    }

    if (kind === 'child') {
      const id = `child-${baseId}`;
      const node = makePerson(
        id,
        '新子女',
        '子女',
        'unknown',
        { x: selectedPerson.position.x + 80, y: selectedPerson.position.y + 190 },
      );
      setGenogramNodes((current) => [...current, node]);
      setGenogramEdges((current) => [
        ...current,
        makeRelationEdge(`edge-child-${baseId}`, selectedPerson.id, id, relationTools['biological-child']),
      ]);
      setSelectedPersonId(id);
      return;
    }

    const fatherId = `father-${baseId}`;
    const motherId = `mother-${baseId}`;
    const father = makePerson(
      fatherId,
      '新父親',
      '父親',
      'male',
      { x: selectedPerson.position.x - 130, y: selectedPerson.position.y - 190 },
    );
    const mother = makePerson(
      motherId,
      '新母親',
      '母親',
      'female',
      { x: selectedPerson.position.x + 130, y: selectedPerson.position.y - 190 },
    );
    setGenogramNodes((current) => [...current, father, mother]);
    setGenogramEdges((current) => [
      ...current,
      makeRelationEdge(`edge-parents-${baseId}`, fatherId, motherId, relationTools.marriage),
      makeRelationEdge(`edge-father-${baseId}`, fatherId, selectedPerson.id, relationTools['biological-child']),
      makeRelationEdge(`edge-mother-${baseId}`, motherId, selectedPerson.id, relationTools['biological-child']),
    ]);
    setSelectedPersonId(fatherId);
  };

  const updateSelectedEdgeTool = (toolId: string) => {
    if (!selectedEdgeId) return;
    const tool = relationTools[toolId];
    if (!tool) return;
    recordGenogramHistory();
    setGenogramEdges((current) =>
      assignRelationLanes(
        current.map((edge) =>
          edge.id === selectedEdgeId
            ? {
                ...edge,
                animated: tool.animated,
                style: tool.style,
                markerEnd: tool.markerEnd,
                data: {
                  ...edge.data,
                  label: tool.label,
                  category: tool.category,
                  lane: categoryLane[tool.category],
                  toolId: tool.id,
                },
              }
            : edge,
        ),
      ),
    );
  };

  const resetSelectedEdgeLabelPosition = () => {
    if (!selectedEdgeId || !selectedEdge?.data) return;
    const { labelOffsetX = 0, labelOffsetY = 0 } = selectedEdge.data;
    if (labelOffsetX === 0 && labelOffsetY === 0) return;

    recordGenogramHistory();
    setGenogramEdges((current) =>
      current.map((edge) =>
        edge.id === selectedEdgeId
          ? {
              ...edge,
              data: {
                ...edge.data!,
                labelOffsetX: 0,
                labelOffsetY: 0,
              },
            }
          : edge,
      ),
    );
  };

  const autoLayoutGenogram = async () => {
    if (genogramNodes.length === 0) return;
    recordGenogramHistory();
    const { default: dagre } = await import('@dagrejs/dagre');
    const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: 'TB', nodesep: 70, ranksep: 110, marginx: 30, marginy: 30 });
    genogramNodes.forEach((node) => graph.setNode(node.id, { width: 160, height: 120 }));
    genogramEdges
      .filter((edge) => edge.data?.category !== 'interaction')
      .forEach((edge) => graph.setEdge(edge.source, edge.target));
    dagre.layout(graph);

    setGenogramNodes((current) =>
      current.map((node) => {
        const position = graph.node(node.id);
        return {
          ...node,
          selected: false,
          position: { x: position.x - 80, y: position.y - 60 },
        };
      }),
    );
    setSelectedPersonId('');
    setSelectedEdgeId('');
    requestAnimationFrame(() => {
      genogramInstanceRef.current?.fitView({ padding: 0.16, duration: 300 });
    });
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;

      recordGenogramHistory();
      setGenogramEdges((current) =>
        assignRelationLanes(
          addEdge(
            {
              ...makeRelationEdge(
                `edge-${Date.now()}`,
                connection.source!,
                connection.target!,
                activeRelationTool,
              ),
              sourceHandle: connection.sourceHandle,
              targetHandle: connection.targetHandle,
            },
            current,
          ),
        ),
      );
    },
    [activeRelationTool, recordGenogramHistory, setGenogramEdges],
  );

  const onSelectionChange = useCallback((selection: OnSelectionChangeParams) => {
    const selectedNode = selection.nodes.find((node) => node.type === 'person');
    const selectedRelation = selection.edges[0] as Edge<RelationEdgeData> | undefined;
    setSelectedPersonId(selectedNode?.id ?? '');
    setSelectedEdgeId(selectedNode ? '' : selectedRelation?.id ?? '');
  }, []);

  const saveGenogram = () => {
    localStorage.setItem(
      'arkai-genogram',
      JSON.stringify({ version: 2, nodes: genogramNodes, edges: genogramEdges, analysis: genogramAnalysis }),
    );
  };

  const normalizePersonNodes = (nodes: Node<PersonNodeData>[]) => {
    let hasIndexPerson = false;
    return nodes.map((node) => {
      const isDuplicateIndex = node.data.status === 'index' && hasIndexPerson;
      if (node.data.status === 'index' && !hasIndexPerson) hasIndexPerson = true;
      return {
        ...node,
        data: {
          ...node.data,
          support: node.data.support ?? 'medium',
          status: isDuplicateIndex ? 'none' : node.data.status,
        },
      };
    });
  };

  const normalizeRelationEdges = (edges: Edge<RelationEdgeData>[]) =>
    assignRelationLanes(edges.map((edge) => {
      const tool = relationTools[edge.data?.toolId ?? '']
        ?? Object.values(relationTools).find((item) => item.label === edge.data?.label);
      return tool
        ? {
            ...edge,
            data: {
              ...edge.data,
              label: tool.label,
              category: tool.category,
              lane: edge.data?.lane ?? categoryLane[tool.category],
              toolId: tool.id,
            },
          }
        : edge;
    }));

  const loadGenogram = () => {
    const saved = localStorage.getItem('arkai-genogram');
    if (!saved) return;
    try {
      const diagram = JSON.parse(saved) as {
        nodes?: Node<PersonNodeData>[];
        edges?: Edge<RelationEdgeData>[];
        analysis?: string;
      };
      if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return;
      recordGenogramHistory();
      setGenogramNodes(normalizePersonNodes(diagram.nodes));
      setGenogramEdges(normalizeRelationEdges(diagram.edges));
      setGenogramAnalysis(typeof diagram.analysis === 'string' ? diagram.analysis : '');
      setSelectedPersonId('');
      setSelectedEdgeId('');
    } catch {
      // Ignore invalid browser data and keep the current diagram intact.
    }
  };

  const exportGenogram = () => {
    const content = JSON.stringify(
      { version: 2, nodes: genogramNodes, edges: genogramEdges, analysis: genogramAnalysis },
      null,
      2,
    );
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `arkai-genogram-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importGenogram = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const diagram = JSON.parse(String(reader.result)) as {
          nodes?: Node<PersonNodeData>[];
          edges?: Edge<RelationEdgeData>[];
          analysis?: string;
        };
        if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return;
        recordGenogramHistory();
        setGenogramNodes(normalizePersonNodes(diagram.nodes));
        setGenogramEdges(normalizeRelationEdges(diagram.edges));
        setGenogramAnalysis(typeof diagram.analysis === 'string' ? diagram.analysis : '');
        setSelectedPersonId('');
        setSelectedEdgeId('');
      } catch {
        // Invalid files leave the current diagram unchanged.
      }
    };
    reader.readAsText(file);
  };

  const saveEcogram = () => {
    localStorage.setItem('arkai-ecogram', JSON.stringify({ version: 1, nodes: ecogramNodes, edges: ecogramEdges }));
  };

  const loadEcogram = () => {
    const saved = localStorage.getItem('arkai-ecogram');
    if (!saved) return;
    try {
      const diagram = JSON.parse(saved) as { nodes?: Node<ResourceNodeData>[]; edges?: Edge<EcogramEdgeData>[] };
      if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return;
      setEcogramNodes(diagram.nodes);
      setEcogramEdges(diagram.edges);
      setSelectedResourceId('');
      setSelectedEcogramEdgeId('');
    } catch {
      // Ignore invalid browser data and keep the current diagram intact.
    }
  };

  const downloadJson = (filename: string, data: object) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportEcogram = () => {
    downloadJson(`arkai-ecogram-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      nodes: ecogramNodes,
      edges: ecogramEdges,
    });
  };

  const importEcogram = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const diagram = JSON.parse(String(reader.result)) as { nodes?: Node<ResourceNodeData>[]; edges?: Edge<EcogramEdgeData>[] };
        if (!Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return;
        setEcogramNodes(diagram.nodes);
        setEcogramEdges(diagram.edges);
        setSelectedResourceId('');
        setSelectedEcogramEdgeId('');
      } catch {
        // Invalid files leave the current diagram unchanged.
      }
    };
    reader.readAsText(file);
  };

  const exportDiagramImage = async (
    graph: { current: HTMLElement | null },
    filename: string,
    format: 'png' | 'pdf',
  ) => {
    const target = graph.current?.querySelector<HTMLElement>('.react-flow');
    if (!target) return;

    const dataUrl = await toPng(target, {
      backgroundColor: '#ffffff',
      cacheBust: true,
      pixelRatio: 2,
      filter: (node) =>
        !(node instanceof Element && (
          node.classList.contains('react-flow__controls') ||
          node.classList.contains('react-flow__handle')
        )),
    });

    if (format === 'png') {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.png`;
      link.click();
      return;
    }

    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const { jsPDF } = await import('jspdf');
    const landscape = image.naturalWidth >= image.naturalHeight;
    const pdf = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const scale = Math.min((pageWidth - margin * 2) / image.naturalWidth, (pageHeight - margin * 2) / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    pdf.addImage(dataUrl, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
    pdf.save(`${filename}.pdf`);
  };

  const addResource = (type: string) => {
    const id = `resource-${Date.now()}`;
    setEcogramNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      {
        id,
        type: 'resource',
        position: { x: 140 + (current.length % 3) * 240, y: 120 + Math.floor(current.length / 3) * 160 },
        selected: true,
        data: { name: `新${type}資源`, type, strength: 'medium' },
      },
    ]);
    setSelectedResourceId(id);
    setSelectedEcogramEdgeId('');
  };

  const updateSelectedResource = <K extends keyof ResourceNodeData>(key: K, value: ResourceNodeData[K]) => {
    setEcogramNodes((current) => current.map((node) => node.id === selectedResourceId ? { ...node, data: { ...node.data, [key]: value } } : node));
  };

  const deleteSelectedResource = () => {
    if (!selectedResourceId) return;
    setEcogramNodes((current) => current.filter((node) => node.id !== selectedResourceId));
    setEcogramEdges((current) => current.filter((edge) => edge.source !== selectedResourceId && edge.target !== selectedResourceId));
    setSelectedResourceId('');
  };

  const updateEcogramEdgeStrength = (strength: ResourceStrength) => {
    if (!selectedEcogramEdgeId) return;
    const relation = ecogramRelationStyles[strength];
    setEcogramEdges((current) => current.map((edge) => edge.id === selectedEcogramEdgeId ? {
      ...edge, label: relation.label, data: { strength, label: relation.label }, style: relation.style, animated: relation.animated,
    } : edge));
  };

  const deleteSelectedEcogramEdge = () => {
    setEcogramEdges((current) => current.filter((edge) => edge.id !== selectedEcogramEdgeId));
    setSelectedEcogramEdgeId('');
  };

  const onEcogramConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) return;
    setEcogramEdges((current) => addEdge({
      ...makeEcogramEdge(`eco-edge-${Date.now()}`, connection.source!, connection.target!, activeEcogramStrength),
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    }, current));
  }, [activeEcogramStrength, setEcogramEdges]);

  const onEcogramSelectionChange = useCallback((selection: OnSelectionChangeParams) => {
    const node = selection.nodes.find((item) => item.type === 'resource');
    const edge = selection.edges[0];
    setSelectedResourceId(node?.id ?? '');
    setSelectedEcogramEdgeId(node ? '' : edge?.id ?? '');
  }, []);

  const toggleSymbolGroup = (group: string) => {
    setOpenToolboxGroups((current) =>
      current.includes(group) ? current.filter((item) => item !== group) : [...current, group],
    );
  };

  return (
    <section className="content family-support-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">開案前 / 家庭支持評估</p>
          <h2>家系圖、生態圖與家庭支持表單</h2>
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
        <div className="family-layout form-only">
          <section className="panel form-panel">
            <div className="section-heading">
              <div>
                <h3>家庭成員與支持摘要</h3>
                <p>此處與家系圖共用同一份人物資料，修改後會立即同步。</p>
              </div>
              <button type="button" className="primary compact-button" onClick={addFamilyMember}>
                <Plus size={16} />新增家庭成員
              </button>
            </div>
            <div className="support-summary-grid">
              {familySupportFields.map((field) => (
                <div className={`support-summary-item ${field.tone ? `${field.tone}-summary` : ''}`} key={field.label}>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                </div>
              ))}
            </div>
            <div className="family-member-editor-list">
              {genogramNodes.map((member) => (
                <article
                  className={`family-member-editor ${member.data.status === 'index' ? 'index-member' : ''} ${member.data.status === 'caregiver' ? 'caregiver-member' : ''}`}
                  key={member.id}
                >
                  {member.data.status === 'index' && (
                    <div className="member-priority-badge index-badge"><UserRoundCheck size={16} />個案本人</div>
                  )}
                  {member.data.status === 'caregiver' && (
                    <div className="member-priority-badge caregiver-badge"><HeartHandshake size={16} />主要照顧者</div>
                  )}
                  <label>姓名<input value={member.data.name} onChange={(event) => updateFamilyMember(member.id, 'name', event.target.value)} /></label>
                  <label>關係／角色<input value={member.data.role} onChange={(event) => updateFamilyMember(member.id, 'role', event.target.value)} /></label>
                  <label>性別<select value={member.data.gender} onChange={(event) => updateFamilyMember(member.id, 'gender', event.target.value as Gender)}>
                    <option value="male">男性</option><option value="female">女性</option><option value="unknown">未知</option><option value="nonbinary">非二元</option>
                  </select></label>
                  <label>支持強度<select value={member.data.support ?? 'medium'} onChange={(event) => updateFamilyMember(member.id, 'support', event.target.value as SupportLevel)}>
                    {Object.entries(supportLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select></label>
                  <label>圖示標記<select value={member.data.status} onChange={(event) => updateFamilyMember(member.id, 'status', event.target.value as PersonStatus)}>
                    <option value="none">無</option><option value="index">個案本人</option><option value="caregiver">主要照顧者</option><option value="deceased">死亡</option>
                  </select></label>
                  <label className="member-note-field">備註<input value={member.data.note} onChange={(event) => updateFamilyMember(member.id, 'note', event.target.value)} /></label>
                  <button type="button" className="icon-button danger-icon" title={`刪除${member.data.name}`} aria-label={`刪除${member.data.name}`} onClick={() => deleteFamilyMember(member.id)}>
                    <Trash2 size={17} />
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'genogram' && (
        <div className="editor-shell">
          <aside className="panel editor-toolbox">
            <h3>符號工具箱</h3>
            <div className={`symbol-tool-group ${openToolboxGroups.includes('diagram-data') ? 'open' : ''}`}>
              <button type="button" className="symbol-tool-toggle" aria-expanded={openToolboxGroups.includes('diagram-data')} onClick={() => toggleSymbolGroup('diagram-data')}>
                <strong>家系圖資料</strong>
                <ChevronDown size={16} />
              </button>
              {openToolboxGroups.includes('diagram-data') && <div className="symbol-tool-content">
                <button type="button" onClick={saveGenogram}><Save size={16} />儲存到本機</button>
                <button type="button" onClick={loadGenogram}><Upload size={16} />載入本機版本</button>
                <button type="button" onClick={exportGenogram}><Download size={16} />匯出 JSON</button>
                <button type="button" onClick={() => importInputRef.current?.click()}><Upload size={16} />匯入 JSON</button>
                <button type="button" onClick={() => exportDiagramImage(genogramGraphRef, `arkai-genogram-${new Date().toISOString().slice(0, 10)}`, 'png')}><FileImage size={16} />匯出 PNG</button>
                <button type="button" onClick={() => exportDiagramImage(genogramGraphRef, `arkai-genogram-${new Date().toISOString().slice(0, 10)}`, 'pdf')}><FileText size={16} />匯出 PDF</button>
                <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => {
                  importGenogram(event.target.files?.[0]);
                  event.target.value = '';
                }} />
              </div>}
            </div>
            <div className={`symbol-tool-group ${openToolboxGroups.includes('add-person') ? 'open' : ''}`}>
              <button type="button" className="symbol-tool-toggle" aria-expanded={openToolboxGroups.includes('add-person')} onClick={() => toggleSymbolGroup('add-person')}>
                <strong>新增人物</strong>
                <ChevronDown size={16} />
              </button>
              {openToolboxGroups.includes('add-person') && <div className="symbol-tool-content">
                <button type="button" onClick={() => addPerson('male')}><Square size={16} />新增男性</button>
                <button type="button" onClick={() => addPerson('female')}><Circle size={16} />新增女性</button>
                <button type="button" onClick={() => addPerson('unknown')}><Diamond size={16} />新增未知</button>
                <button type="button" onClick={() => addPerson('nonbinary')}><Triangle size={16} />新增非二元</button>
              </div>}
            </div>
            <div className={`symbol-tool-group ${openToolboxGroups.includes('quick-family') ? 'open' : ''}`}>
              <button type="button" className="symbol-tool-toggle" aria-expanded={openToolboxGroups.includes('quick-family')} onClick={() => toggleSymbolGroup('quick-family')}>
                <strong>快速建立家庭</strong>
                <ChevronDown size={16} />
              </button>
              {openToolboxGroups.includes('quick-family') && <div className="symbol-tool-content">
                <small className="toolbox-hint">{selectedPerson ? `以「${selectedPerson.data.name}」為中心新增` : '請先選取一位人物'}</small>
                <button type="button" disabled={!selectedPerson} onClick={() => addQuickFamilyStructure('spouse')}><HeartHandshake size={16} />新增配偶</button>
                <button type="button" disabled={!selectedPerson} onClick={() => addQuickFamilyStructure('child')}><Plus size={16} />新增子女</button>
                <button type="button" disabled={!selectedPerson} onClick={() => addQuickFamilyStructure('parents')}><Users size={16} />新增父母組合</button>
              </div>}
            </div>
            {selectedLegend.map((group) => {
              const isOpen = openToolboxGroups.includes(group.group);
              return (
              <div className={`symbol-tool-group ${isOpen ? 'open' : ''}`} key={group.group}>
                <button
                  type="button"
                  className="symbol-tool-toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggleSymbolGroup(group.group)}
                >
                  <strong>{group.group}</strong>
                  <span>{group.symbols.length}</span>
                  <ChevronDown size={16} />
                </button>
                {isOpen && <div className="symbol-tool-content">
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
                </div>}
              </div>
              );
            })}
          </aside>
          <div className="genogram-main-column">
            <section className="panel graph-panel" ref={genogramGraphRef}>
              <div className="canvas-relation-status">
                <span>目前連線類型</span>
                <strong>{activeRelationTool.label}</strong>
              </div>
              <div className="genogram-canvas-toolbar" aria-label="家系圖編輯工具">
                <button type="button" title="復原" aria-label="復原" disabled={genogramPast.length === 0} onClick={undoGenogram}><Undo2 size={17} /></button>
                <button type="button" title="重做" aria-label="重做" disabled={genogramFuture.length === 0} onClick={redoGenogram}><Redo2 size={17} /></button>
                <button type="button" title="自動排版" aria-label="自動排版" onClick={autoLayoutGenogram}><WandSparkles size={17} /></button>
              </div>
              <RelationLabelDragContext.Provider value={relationLabelDragActions}>
                <ReactFlow
                  nodes={genogramNodes}
                  edges={genogramEdges}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  connectionMode={ConnectionMode.Loose}
                  deleteKeyCode={['Backspace', 'Delete']}
                  onNodesChange={onGenogramNodesChange}
                  onEdgesChange={onGenogramEdgesChange}
                  onInit={(instance) => { genogramInstanceRef.current = instance; }}
                  onNodeDragStart={recordGenogramHistory}
                  onConnect={onConnect}
                  onSelectionChange={onSelectionChange}
                  onEdgesDelete={() => {
                    recordGenogramHistory();
                    setSelectedEdgeId('');
                  }}
                  onNodesDelete={() => {
                    recordGenogramHistory();
                    setSelectedPersonId('');
                  }}
                  minZoom={0.3}
                  fitView
                  fitViewOptions={{ padding: 0.16 }}
                >
                  <Background />
                  <HouseholdBoundary nodes={genogramNodes} />
                  <Controls />
                </ReactFlow>
              </RelationLabelDragContext.Provider>
            </section>
            <section className="panel genogram-analysis-panel">
              <div className="section-heading">
                <h3>家系圖綜合分析</h3>
                <p>整理家庭結構、互動模式、照顧角色與潛在風險。</p>
              </div>
              <label>
                分析內容
                <textarea
                  value={genogramAnalysis}
                  onChange={(event) => setGenogramAnalysis(event.target.value)}
                  placeholder="請輸入家系圖綜合分析內容"
                />
              </label>
            </section>
          </div>
          <aside className="panel inspector-panel">
            <h3>屬性面板</h3>
            {selectedPerson ? (
              <>
                <label>
                  姓名
                  <input
                    value={selectedPerson.data.name}
                    onFocus={recordGenogramHistory}
                    onChange={(event) => updateSelectedPerson('name', event.target.value)}
                  />
                </label>
                <label>
                  角色
                  <input
                    value={selectedPerson.data.role}
                    onFocus={recordGenogramHistory}
                    onChange={(event) => updateSelectedPerson('role', event.target.value)}
                  />
                </label>
                <label>
                  性別符號
                  <select
                    value={selectedPerson.data.gender}
                    onFocus={recordGenogramHistory}
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
                    onFocus={recordGenogramHistory}
                    onChange={(event) => updateSelectedPerson('status', event.target.value as PersonStatus)}
                  >
                    <option value="none">無</option>
                    <option value="index">個案本人</option>
                    <option value="caregiver">主要照顧者</option>
                    <option value="deceased">死亡</option>
                  </select>
                  <small className="field-hint">指定為個案本人時，其他人物的個案本人標記會自動取消。</small>
                </label>
                <label>
                  已套用符號
                  <textarea
                    value={selectedPerson.data.markers.join('、')}
                    onFocus={recordGenogramHistory}
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
                    onFocus={recordGenogramHistory}
                    onChange={(event) => updateSelectedPerson('note', event.target.value)}
                  />
                </label>
                <button type="button" className="secondary full-width" onClick={duplicateSelectedPerson}>
                  <Copy size={16} />
                  複製角色
                </button>
                <button type="button" className="danger-button" onClick={deleteSelectedPerson}>
                  <Trash2 size={16} />
                  刪除角色
                </button>
              </>
            ) : selectedEdge ? (
              <div className="relation-inspector">
                <label>
                  關係類型
                  <select value={selectedEdgeToolId} onChange={(event) => updateSelectedEdgeTool(event.target.value)}>
                    <optgroup label="伴侶關係">
                      {Object.values(relationTools).filter((tool) => tool.category === 'partner').map((tool) => <option value={tool.id} key={tool.id}>{tool.label}</option>)}
                    </optgroup>
                    <optgroup label="親子與出生事件">
                      {Object.values(relationTools).filter((tool) => tool.category === 'parentChild' || tool.category === 'event').map((tool) => <option value={tool.id} key={tool.id}>{tool.label}</option>)}
                    </optgroup>
                    <optgroup label="互動關係">
                      {Object.values(relationTools).filter((tool) => tool.category === 'interaction').map((tool) => <option value={tool.id} key={tool.id}>{tool.label}</option>)}
                    </optgroup>
                  </select>
                </label>
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
                <button
                  type="button"
                  className="secondary full-width"
                  disabled={!selectedEdge.data?.labelOffsetX && !selectedEdge.data?.labelOffsetY}
                  onClick={resetSelectedEdgeLabelPosition}
                >
                  <RotateCcw size={16} />
                  重設標籤位置
                </button>
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
            <div className={`symbol-tool-group ${openToolboxGroups.includes('ecogram-data') ? 'open' : ''}`}>
              <button type="button" className="symbol-tool-toggle" aria-expanded={openToolboxGroups.includes('ecogram-data')} onClick={() => toggleSymbolGroup('ecogram-data')}>
                <strong>生態圖資料</strong>
                <ChevronDown size={16} />
              </button>
              {openToolboxGroups.includes('ecogram-data') && <div className="symbol-tool-content">
                <button type="button" onClick={saveEcogram}><Save size={16} />儲存到本機</button>
                <button type="button" onClick={loadEcogram}><Upload size={16} />載入本機版本</button>
                <button type="button" onClick={exportEcogram}><Download size={16} />匯出 JSON</button>
                <button type="button" onClick={() => ecogramImportInputRef.current?.click()}><Upload size={16} />匯入 JSON</button>
                <button type="button" onClick={() => exportDiagramImage(ecogramGraphRef, `arkai-ecogram-${new Date().toISOString().slice(0, 10)}`, 'png')}><FileImage size={16} />匯出 PNG</button>
                <button type="button" onClick={() => exportDiagramImage(ecogramGraphRef, `arkai-ecogram-${new Date().toISOString().slice(0, 10)}`, 'pdf')}><FileText size={16} />匯出 PDF</button>
                <input ref={ecogramImportInputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => {
                  importEcogram(event.target.files?.[0]);
                  event.target.value = '';
                }} />
              </div>}
            </div>
            {['家庭', '鄰里', '醫療', '社福', '日照', '居服', '宗教', '政府補助'].map((item) => (
              <button type="button" key={item} onClick={() => addResource(item)}>
                <Home size={16} />
                新增{item}
              </button>
            ))}
            <div className="active-relation-tool">
              <strong>新增關係強度</strong>
              <select value={activeEcogramStrength} onChange={(event) => setActiveEcogramStrength(event.target.value as ResourceStrength)}>
                {Object.entries(ecogramRelationStyles).map(([value, relation]) => <option key={value} value={value}>{relation.label}</option>)}
              </select>
              <small>選擇強度後，從任一資源節點邊緣拖曳到另一個節點。</small>
            </div>
          </aside>
          <section className="panel graph-panel" ref={ecogramGraphRef}>
            <ReactFlow
              nodes={ecogramNodes}
              edges={ecogramEdges}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              deleteKeyCode={['Backspace', 'Delete']}
              onNodesChange={onEcogramNodesChange}
              onEdgesChange={onEcogramEdgesChange}
              onConnect={onEcogramConnect}
              onSelectionChange={onEcogramSelectionChange}
              onNodesDelete={() => setSelectedResourceId('')}
              onEdgesDelete={() => setSelectedEcogramEdgeId('')}
              minZoom={0.3}
              fitView
              fitViewOptions={{ padding: 0.16 }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </section>
          <aside className="panel inspector-panel">
            <h3>資源與關係設定</h3>
            {selectedResource ? (
              <>
                <label>資源名稱<input value={selectedResource.data.name} onChange={(event) => updateSelectedResource('name', event.target.value)} /></label>
                <label>資源類型<input value={selectedResource.data.type} onChange={(event) => updateSelectedResource('type', event.target.value)} /></label>
                <label>資源狀態<select value={selectedResource.data.strength} onChange={(event) => updateSelectedResource('strength', event.target.value as ResourceStrength)}>
                  {Object.entries(ecogramRelationStyles).map(([value, relation]) => <option key={value} value={value}>{relation.label}</option>)}
                </select></label>
                <button type="button" className="danger-button" onClick={deleteSelectedResource}><Trash2 size={16} />刪除資源</button>
              </>
            ) : selectedEcogramEdge ? (
              <div className="relation-inspector">
                <div><span>來源</span><strong>{ecogramNodes.find((node) => node.id === selectedEcogramEdge.source)?.data.name}</strong></div>
                <div><span>目標</span><strong>{ecogramNodes.find((node) => node.id === selectedEcogramEdge.target)?.data.name}</strong></div>
                <label>關係強度<select value={selectedEcogramEdge.data?.strength ?? 'medium'} onChange={(event) => updateEcogramEdgeStrength(event.target.value as ResourceStrength)}>
                  {Object.entries(ecogramRelationStyles).map(([value, relation]) => <option key={value} value={value}>{relation.label}</option>)}
                </select></label>
                <button type="button" className="danger-button" onClick={deleteSelectedEcogramEdge}><Trash2 size={16} />刪除關係</button>
              </div>
            ) : <div className="empty-state">選取資源或關係線以進行編輯。</div>}
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
