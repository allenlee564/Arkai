import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Ban,
  Circle,
  CircleDot,
  Cross,
  Diamond,
  HeartPulse,
  Home,
  Link2Off,
  Pill,
  Square,
  Triangle,
  Users,
  Waves,
  Wine,
} from 'lucide-react';

export type GenogramSymbol = {
  id: string;
  label: string;
  group: string;
  description: string;
  icon: LucideIcon;
};

export const genogramSymbols: GenogramSymbol[] = [
  { id: 'male', label: '男性', group: '個人節點', description: '方形節點', icon: Square },
  { id: 'female', label: '女性', group: '個人節點', description: '圓形節點', icon: Circle },
  { id: 'unknown', label: '未知性別', group: '個人節點', description: '菱形節點', icon: Diamond },
  { id: 'nonbinary', label: '非二元', group: '個人節點', description: '拱形或自訂性別節點', icon: CircleDot },
  { id: 'intersex', label: '雙性', group: '個人節點', description: '複合性別符號', icon: CircleDot },
  { id: 'index-person', label: '個案本人', group: '個人節點', description: '雙框或強調外框', icon: Users },
  { id: 'death', label: '死亡', group: '個人節點', description: '節點內 X 與死亡日期', icon: Cross },
  { id: 'pet', label: '寵物', group: '個人節點', description: '菱形寵物節點', icon: Diamond },
  { id: 'physical-illness', label: '身體疾病', group: '健康與成癮', description: '節點陰影或象限標記', icon: HeartPulse },
  { id: 'mental-illness', label: '心理疾病', group: '健康與成癮', description: '節點局部填色', icon: HeartPulse },
  { id: 'alcohol', label: '酒精濫用', group: '健康與成癮', description: '酒精濫用狀態', icon: Wine },
  { id: 'drug', label: '藥物濫用', group: '健康與成癮', description: '藥物濫用狀態', icon: Pill },
  { id: 'suspected', label: '疑似狀態', group: '健康與成癮', description: '波紋或虛線標記', icon: Waves },
  { id: 'recovery', label: '康復中', group: '健康與成癮', description: '康復中狀態', icon: CircleDot },
  { id: 'treatment', label: '治療中', group: '健康與成癮', description: '治療中狀態', icon: Pill },
  { id: 'marriage', label: '結婚', group: '伴侶關係', description: '實線伴侶關係', icon: Link2Off },
  { id: 'cohabitation', label: '同居', group: '伴侶關係', description: '虛線或標註同居', icon: Home },
  { id: 'separation', label: '分居', group: '伴侶關係', description: '斜線切分伴侶線', icon: Ban },
  { id: 'divorce', label: '離婚', group: '伴侶關係', description: '雙斜線切分伴侶線', icon: Ban },
  { id: 'remarriage', label: '再婚', group: '伴侶關係', description: '多段伴侶線與日期', icon: Link2Off },
  { id: 'affair', label: '外遇', group: '伴侶關係', description: '三角關係或虛線標註', icon: Triangle },
  { id: 'committed', label: '承諾關係', group: '伴侶關係', description: '承諾伴侶線', icon: Link2Off },
  { id: 'biological-child', label: '親生子女', group: '親子與出生事件', description: '親子垂直線', icon: Baby },
  { id: 'adopted', label: '收養', group: '親子與出生事件', description: '虛線或收養標記', icon: Baby },
  { id: 'foster', label: '寄養', group: '親子與出生事件', description: '寄養關係線', icon: Baby },
  { id: 'miscarriage', label: '流產', group: '親子與出生事件', description: '小黑點或標註', icon: CircleDot },
  { id: 'stillbirth', label: '死胎', group: '親子與出生事件', description: '死亡出生事件', icon: Cross },
  { id: 'abortion', label: '墮胎', group: '親子與出生事件', description: '出生事件終止標記', icon: Ban },
  { id: 'twins', label: '雙胞胎', group: '親子與出生事件', description: '雙分支親子線', icon: Users },
  { id: 'identical-twins', label: '同卵雙胞胎', group: '親子與出生事件', description: '雙胞胎間加連線', icon: Users },
  { id: 'sperm-donor', label: '捐精者', group: '親子與出生事件', description: '捐贈者標記', icon: Users },
  { id: 'close', label: '親近', group: '互動關係', description: '雙線或加粗線', icon: Link2Off },
  { id: 'distant', label: '疏離', group: '互動關係', description: '虛線互動關係', icon: Link2Off },
  { id: 'conflict', label: '衝突', group: '互動關係', description: '鋸齒線', icon: Waves },
  { id: 'hostile', label: '敵意', group: '互動關係', description: '強烈鋸齒線', icon: Waves },
  { id: 'fused', label: '融合', group: '互動關係', description: '多重緊密線', icon: Link2Off },
  { id: 'close-hostile', label: '親近且敵意', group: '互動關係', description: '親近線加衝突線', icon: Waves },
  { id: 'emotional-abuse', label: '情緒虐待', group: '互動關係', description: '虐待方向線', icon: Waves },
  { id: 'physical-abuse', label: '身體虐待', group: '互動關係', description: '身體虐待方向線', icon: Waves },
  { id: 'sexual-abuse', label: '性虐待', group: '互動關係', description: '性虐待方向線', icon: Waves },
  { id: 'caregiver', label: '照顧者', group: '互動關係', description: '照顧方向箭頭', icon: Users },
  { id: 'cutoff', label: '截斷', group: '互動關係', description: '截斷關係線', icon: Ban },
  { id: 'repair', label: '關係修復', group: '互動關係', description: '修復中的關係線', icon: Link2Off },
  { id: 'household', label: '同住框線', group: '家戶與背景', description: '家戶外框', icon: Home },
  { id: 'migration', label: '移民', group: '家戶與背景', description: '移民標記', icon: Waves },
  { id: 'income', label: '收入', group: '家戶與背景', description: '收入與地區標記', icon: CircleDot },
  { id: 'culture', label: '文化地區', group: '家戶與背景', description: '文化或族群背景', icon: CircleDot },
  { id: 'institution', label: '機構連結', group: '家戶與背景', description: '醫院、長照或社福單位', icon: Home },
];

export const symbolGroups = Array.from(new Set(genogramSymbols.map((symbol) => symbol.group)));
