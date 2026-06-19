export type BoxStatus = 'pending_pack' | 'pending_return' | 'missing_investigate' | 'ready_seal';

export type RiskLevel = 'low' | 'medium' | 'high';

export type HandoverStatus = 'pending' | 'completed' | 'abnormal';

export type AbnormalType = 'damaged' | 'missing' | 'wrong_item' | 'quality_issue' | 'other';

export type ProcessStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type AlertType = 'duplicate_box' | 'missing_return_note' | 'high_risk_excess' | 'unbalanced_load' | 'checked_not_handed_over' | 'abnormal_without_note';

export type ViewMode = 'normal' | 'checklist';

export type ChecklistFilterMode = 'all' | 'incomplete_handover' | 'abnormal_handover';

export interface HandoverRecord {
  id: string;
  boxId: string;
  batchNumber: string;
  handoverResult: HandoverStatus;
  handoverPerson: string;
  receiverPerson: string;
  abnormalType: AbnormalType | '';
  abnormalNote: string;
  processStatus: ProcessStatus;
  processNote: string;
  handoverTime: string;
  processedAt: string;
  createdBy: string;
}

export interface PropBox {
  id: string;
  boxNumber: string;
  contentSummary: string;
  scene: string;
  fragileNote: string;
  status: BoxStatus;
  supplementNote: string;
  responsiblePerson: string;
  riskLevel: RiskLevel;
  needsReturn: boolean;
  returnNote: string;
  isChecked: boolean;
  handoverStatus: HandoverStatus;
  handoverPerson: string;
  receiverPerson: string;
  handoverTime: string;
  handoverNote: string;
  batchNumber: string;
  abnormalType: AbnormalType | '';
  processStatus: ProcessStatus;
  processNote: string;
  handoverRecords: HandoverRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface FilterCriteria {
  scene: string;
  responsiblePerson: string;
  status: BoxStatus | '';
  riskLevel: RiskLevel | '';
  handoverStatus: HandoverStatus | '';
  abnormalType: AbnormalType | '';
  processStatus: ProcessStatus | '';
  batchNumber: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: 'warning' | 'error';
  message: string;
  affectedBoxIds: string[];
}

export interface AppState {
  boxes: PropBox[];
  selectedBoxIds: string[];
  activeBoxId: string | null;
  filters: FilterCriteria;
  viewMode: ViewMode;
  alerts: Alert[];
  checklistFilterMode: ChecklistFilterMode;
}

export interface BatchHandoverData {
  handoverPerson: string;
  receiverPerson: string;
  batchNumber: string;
  handoverResult?: HandoverStatus;
  abnormalType?: AbnormalType | '';
  processStatus?: ProcessStatus;
  processNote?: string;
  handoverNote?: string;
}

export interface BatchHandoverResult {
  handoverPerson: string;
  receiverPerson: string;
  batchNumber: string;
  handoverResult: HandoverStatus;
  abnormalType?: AbnormalType;
  abnormalNote?: string;
  handoverNote?: string;
}

export interface AppActions {
  addBox: (box: Omit<PropBox, 'id' | 'createdAt' | 'updatedAt' | 'handoverRecords'>) => void;
  updateBox: (id: string, updates: Partial<PropBox>) => void;
  deleteBox: (id: string) => void;
  toggleBoxSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  batchUpdateStatus: (ids: string[], status: BoxStatus) => void;
  batchUpdateHandover: (ids: string[], handoverStatus: HandoverStatus) => void;
  batchCompleteHandover: (ids: string[], data: BatchHandoverData) => void;
  addHandoverRecord: (boxId: string, record: Omit<HandoverRecord, 'id' | 'boxId' | 'handoverTime' | 'processedAt'>) => void;
  updateHandoverRecord: (boxId: string, recordId: string, updates: Partial<HandoverRecord>) => void;
  setFilters: (filters: Partial<FilterCriteria>) => void;
  resetFilters: () => void;
  setViewMode: (mode: ViewMode) => void;
  setChecklistFilterMode: (mode: ChecklistFilterMode) => void;
  setActiveBox: (id: string | null) => void;
  runAutoCheck: () => Alert[];
  toggleCheck: (id: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const STATUS_LABELS: Record<BoxStatus, string> = {
  pending_pack: '待装箱',
  pending_return: '待返场',
  missing_investigate: '缺件待查',
  ready_seal: '可封箱',
};

export const STATUS_COLORS: Record<BoxStatus, string> = {
  pending_pack: 'bg-amber-100 text-amber-800 border-amber-200',
  pending_return: 'bg-blue-100 text-blue-800 border-blue-200',
  missing_investigate: 'bg-rose-100 text-rose-800 border-rose-200',
  ready_seal: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const HANDOVER_LABELS: Record<HandoverStatus, string> = {
  pending: '待交接',
  completed: '已交接',
  abnormal: '异常交接',
};

export const HANDOVER_COLORS: Record<HandoverStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  abnormal: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ABNORMAL_TYPE_LABELS: Record<AbnormalType, string> = {
  damaged: '损坏',
  missing: '缺失',
  wrong_item: '物品错误',
  quality_issue: '质量问题',
  other: '其他',
};

export const ABNORMAL_TYPE_COLORS: Record<AbnormalType, string> = {
  damaged: 'bg-rose-100 text-rose-700 border-rose-200',
  missing: 'bg-amber-100 text-amber-700 border-amber-200',
  wrong_item: 'bg-purple-100 text-purple-700 border-purple-200',
  quality_issue: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const PROCESS_STATUS_COLORS: Record<ProcessStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const CHECKLIST_FILTER_LABELS: Record<ChecklistFilterMode, string> = {
  all: '全部',
  incomplete_handover: '仅看未完成交接',
  abnormal_handover: '仅看异常交接',
};
