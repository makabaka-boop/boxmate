import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  User,
  AlertTriangle,
  Package,
  Clock,
  CheckSquare,
  ArrowRightLeft,
  Layers,
  UserCheck,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { HANDOVER_LABELS, HANDOVER_COLORS, CHECKLIST_FILTER_LABELS, ABNORMAL_TYPE_LABELS, ABNORMAL_TYPE_COLORS, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from '@/types';
import type { PropBox, HandoverStatus, ChecklistFilterMode, BatchHandoverData } from '@/types';

export function ChecklistView() {
  const { boxes, toggleCheck, updateBox, batchUpdateStatus, checklistFilterMode, setChecklistFilterMode, batchCompleteHandover, addHandoverRecord } = usePropStore();
  const returnBoxes = useMemo(
    () => boxes.filter((b) => b.needsReturn),
    [boxes]
  );

  const [showBatchHandoverModal, setShowBatchHandoverModal] = useState(false);
  const [batchHandoverScene, setBatchHandoverScene] = useState<string>('');
  const [batchHandoverData, setBatchHandoverData] = useState<BatchHandoverData>({
    handoverPerson: '',
    receiverPerson: '',
    batchNumber: '',
    handoverNote: '',
  });

  const [showSingleHandoverModal, setShowSingleHandoverModal] = useState(false);
  const [singleHandoverBox, setSingleHandoverBox] = useState<PropBox | null>(null);
  const [singleHandoverStatus, setSingleHandoverStatus] = useState<HandoverStatus>('completed');
  const [singleHandoverData, setSingleHandoverData] = useState({
    handoverPerson: '',
    receiverPerson: '',
    batchNumber: '',
    abnormalType: '' as any,
    abnormalNote: '',
    processStatus: 'pending' as any,
    processNote: '',
  });

  const filteredReturnBoxes = useMemo(() => {
    switch (checklistFilterMode) {
      case 'incomplete_handover':
        return returnBoxes.filter((b) => b.handoverStatus === 'pending');
      case 'abnormal_handover':
        return returnBoxes.filter((b) => b.handoverStatus === 'abnormal');
      default:
        return returnBoxes;
    }
  }, [returnBoxes, checklistFilterMode]);

  const groupedByScene = useMemo(() => {
    const groups = new Map<string, PropBox[]>();
    filteredReturnBoxes.forEach((box) => {
      const existing = groups.get(box.scene) || [];
      groups.set(box.scene, [...existing, box]);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredReturnBoxes]);

  const allSceneKeys = useMemo(
    () => groupedByScene.map(([scene]) => scene),
    [groupedByScene]
  );

  const [expandedScenes, setExpandedScenes] = useState<Set<string> | null>(null);

  const effectiveExpanded = useMemo(() => {
    if (expandedScenes !== null) return expandedScenes;
    return new Set(allSceneKeys);
  }, [expandedScenes, allSceneKeys]);

  const toggleScene = (scene: string) => {
    setExpandedScenes((prev) => {
      const current = prev ?? new Set(allSceneKeys);
      const next = new Set(current);
      if (next.has(scene)) {
        next.delete(scene);
      } else {
        next.add(scene);
      }
      return next;
    });
  };

  const getSceneStats = (sceneBoxes: PropBox[]) => {
    const total = sceneBoxes.length;
    const checked = sceneBoxes.filter((b) => b.isChecked).length;
    const ready = sceneBoxes.filter((b) => b.status === 'ready_seal').length;
    const missing = sceneBoxes.filter((b) => b.status === 'missing_investigate').length;
    const handoverCompleted = sceneBoxes.filter((b) => b.handoverStatus === 'completed').length;
    const handoverAbnormal = sceneBoxes.filter((b) => b.handoverStatus === 'abnormal').length;
    const handoverPending = sceneBoxes.filter((b) => b.handoverStatus === 'pending').length;
    return { total, checked, ready, missing, handoverCompleted, handoverAbnormal, handoverPending };
  };

  const handleMarkAllChecked = (scene: string, sceneBoxes: PropBox[]) => {
    sceneBoxes.forEach((box) => {
      if (!box.isChecked) {
        toggleCheck(box.id);
      }
    });
  };

  const handleMarkAllReady = (scene: string, sceneBoxes: PropBox[]) => {
    const ids = sceneBoxes
      .filter((b) => b.status !== 'ready_seal')
      .map((b) => b.id);
    if (ids.length > 0) {
      batchUpdateStatus(ids, 'ready_seal');
    }
  };

  const handleBatchHandoverScene = (scene: string) => {
    setBatchHandoverScene(scene);
    setShowBatchHandoverModal(true);
    setBatchHandoverData({
      handoverPerson: '',
      receiverPerson: '',
      batchNumber: '',
      handoverNote: '',
    });
  };

  const handleConfirmBatchHandover = () => {
    if (!batchHandoverData.handoverPerson || !batchHandoverData.receiverPerson || !batchHandoverData.batchNumber) {
      alert('请填写交接人、接收人和交接批次');
      return;
    }
    const sceneBoxes = groupedByScene.find(([s]) => s === batchHandoverScene)?.[1] || [];
    const pendingIds = sceneBoxes
      .filter((b) => b.handoverStatus === 'pending' && b.isChecked)
      .map((b) => b.id);
    if (pendingIds.length > 0) {
      batchCompleteHandover(pendingIds, batchHandoverData);
    }
    setShowBatchHandoverModal(false);
  };

  const openSingleHandoverModal = (box: PropBox, status: HandoverStatus) => {
    if (status === 'pending') {
      updateBox(box.id, {
        handoverStatus: 'pending',
        handoverTime: '',
        handoverPerson: '',
        receiverPerson: '',
        batchNumber: '',
        abnormalType: '',
        processStatus: 'pending',
        processNote: '',
        handoverNote: '',
      });
      return;
    }

    setSingleHandoverBox(box);
    setSingleHandoverStatus(status);
    setSingleHandoverData({
      handoverPerson: box.handoverPerson || '',
      receiverPerson: box.receiverPerson || '',
      batchNumber: box.batchNumber || '',
      abnormalType: status === 'abnormal' ? box.abnormalType || '' : '',
      abnormalNote: status === 'abnormal' ? box.handoverNote || '' : '',
      processStatus: status === 'abnormal' ? 'pending' : 'resolved',
      processNote: '',
    });
    setShowSingleHandoverModal(true);
  };

  const handleConfirmSingleHandover = () => {
    if (!singleHandoverBox) return;
    
    if (!singleHandoverData.handoverPerson || !singleHandoverData.receiverPerson || !singleHandoverData.batchNumber) {
      alert('请填写交接人、接收人和交接批次');
      return;
    }
    if (singleHandoverStatus === 'abnormal' && (!singleHandoverData.abnormalType || !singleHandoverData.abnormalNote?.trim())) {
      alert('异常交接必须填写异常类型和异常说明');
      return;
    }

    addHandoverRecord(singleHandoverBox.id, {
      batchNumber: singleHandoverData.batchNumber,
      handoverResult: singleHandoverStatus,
      handoverPerson: singleHandoverData.handoverPerson,
      receiverPerson: singleHandoverData.receiverPerson,
      abnormalType: singleHandoverStatus === 'abnormal' ? singleHandoverData.abnormalType : '',
      abnormalNote: singleHandoverStatus === 'abnormal' ? singleHandoverData.abnormalNote : '',
      processStatus: singleHandoverStatus === 'abnormal' ? singleHandoverData.processStatus : 'resolved',
      processNote: singleHandoverStatus === 'abnormal' ? singleHandoverData.processNote : '',
      createdBy: singleHandoverData.handoverPerson,
    });
    setShowSingleHandoverModal(false);
    setSingleHandoverBox(null);
  };

  const handleHandoverNoteChange = (boxId: string, note: string) => {
    updateBox(boxId, { handoverNote: note });
  };

  const totalAll = returnBoxes.length;
  const checkedAll = returnBoxes.filter((b) => b.isChecked).length;
  const readyAll = returnBoxes.filter((b) => b.status === 'ready_seal').length;
  const handoverCompletedAll = returnBoxes.filter((b) => b.handoverStatus === 'completed').length;
  const handoverAbnormalAll = returnBoxes.filter((b) => b.handoverStatus === 'abnormal').length;
  const handoverPendingAll = returnBoxes.filter((b) => b.handoverStatus === 'pending').length;
  const progressPercent = totalAll > 0 ? Math.round((checkedAll / totalAll) * 100) : 0;
  const handoverPercent = totalAll > 0 ? Math.round((handoverCompletedAll / totalAll) * 100) : 0;

  return (
    <div className="h-full flex flex-col bg-slate-100 p-6 overflow-hidden">
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg mb-4 p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare className="text-primary-600" size={28} />
              返场总表 · 逐项核对
            </h2>
            <p className="text-slate-500 mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-emerald-600">
              {progressPercent}%
            </div>
            <div className="text-sm text-slate-500">
              {checkedAll} / {totalAll} 已核对
            </div>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <Package size={20} className="mx-auto text-slate-500 mb-1" />
            <div className="text-xl font-bold text-slate-700">{totalAll}</div>
            <div className="text-xs text-slate-500">需返场箱数</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <CheckCircle2 size={20} className="mx-auto text-emerald-500 mb-1" />
            <div className="text-xl font-bold text-emerald-700">{checkedAll}</div>
            <div className="text-xs text-slate-500">已核对</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Clock size={20} className="mx-auto text-blue-500 mb-1" />
            <div className="text-xl font-bold text-blue-700">
              {totalAll - checkedAll}
            </div>
            <div className="text-xs text-slate-500">待核对</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3 text-center">
            <Package size={20} className="mx-auto text-emerald-500 mb-1" />
            <div className="text-xl font-bold text-emerald-700">{readyAll}</div>
            <div className="text-xs text-slate-500">可封箱</div>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <ArrowRightLeft size={20} className="mx-auto text-teal-500 mb-1" />
            <div className="text-xl font-bold text-teal-700">{handoverCompletedAll}</div>
            <div className="text-xs text-slate-500">已交接</div>
          </div>
          <div className={`rounded-lg p-3 text-center ${handoverAbnormalAll > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <AlertTriangle size={20} className={`mx-auto mb-1 ${handoverAbnormalAll > 0 ? 'text-rose-500' : 'text-slate-500'}`} />
            <div className={`text-xl font-bold ${handoverAbnormalAll > 0 ? 'text-rose-700' : 'text-slate-700'}`}>{handoverAbnormalAll}</div>
            <div className="text-xs text-slate-500">异常交接</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">核对进度</span>
              <span className="text-xs font-bold text-emerald-600">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">交接进度</span>
              <span className="text-xs font-bold text-teal-600">{handoverPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${handoverPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 font-medium">视图切换:</span>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(Object.keys(CHECKLIST_FILTER_LABELS) as ChecklistFilterMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setChecklistFilterMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  checklistFilterMode === mode
                    ? 'bg-white text-primary-700 shadow'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                {CHECKLIST_FILTER_LABELS[mode]}
              </button>
            ))}
          </div>
          {checklistFilterMode !== 'all' && (
            <span className="text-xs text-slate-500">
              显示 {filteredReturnBoxes.length} 条记录
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {groupedByScene.map(([scene, sceneBoxes], sceneIndex) => {
          const stats = getSceneStats(sceneBoxes);
          const isExpanded = effectiveExpanded.has(scene);
          const allChecked = stats.checked === stats.total;

          return (
            <div
              key={scene}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${sceneIndex * 100}ms` }}
            >
              <div
                className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleScene(scene)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={20} className="text-slate-400" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      {scene}
                      {allChecked && (
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500"
                        />
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {stats.checked}/{stats.total} 已核对 · {stats.ready} 可封箱
                      {stats.missing > 0 && (
                        <span className="text-rose-500 ml-2">
                          · {stats.missing} 缺件待查
                        </span>
                      )}
                      {stats.handoverCompleted > 0 && (
                        <span className="text-teal-600 ml-2">
                          · {stats.handoverCompleted} 已交接
                        </span>
                      )}
                      {stats.handoverAbnormal > 0 && (
                        <span className="text-rose-600 ml-2 font-semibold">
                          · {stats.handoverAbnormal} 异常交接
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allChecked
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                          : 'bg-gradient-to-r from-primary-400 to-primary-600'
                      }`}
                      style={{
                        width: `${stats.total > 0 ? (stats.checked / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMarkAllChecked(scene, sceneBoxes)}
                      className="px-3 py-1.5 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors font-medium"
                    >
                      全部已核对
                    </button>
                    <button
                      onClick={() => handleMarkAllReady(scene, sceneBoxes)}
                      className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors font-medium"
                    >
                      全部可封箱
                    </button>
                    {stats.handoverPending > 0 && (
                      <button
                        onClick={() => handleBatchHandoverScene(scene)}
                        className="px-3 py-1.5 text-xs bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors font-medium flex items-center gap-1"
                      >
                        <ClipboardCheck size={12} />
                        批量交接 ({stats.handoverPending})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="divide-y divide-slate-100">
                  {sceneBoxes.map((box, boxIndex) => {
                    const isAbnormal = box.handoverStatus === 'abnormal';
                    const isHandoverCompleted = box.handoverStatus === 'completed';

                    return (
                      <div
                        key={box.id}
                        className={`px-5 py-4 flex items-center gap-4 transition-all duration-300 ${
                          isAbnormal
                            ? 'bg-rose-50/70 border-l-4 border-l-rose-400'
                            : isHandoverCompleted
                              ? 'bg-teal-50/50'
                              : box.isChecked
                                ? 'bg-emerald-50/50'
                                : 'hover:bg-slate-50'
                        }`}
                        style={{
                          animationDelay: `${sceneIndex * 100 + boxIndex * 30}ms`,
                        }}
                      >
                        <button
                          onClick={() => toggleCheck(box.id)}
                          className={`p-0.5 rounded transition-all duration-200 ${
                            box.isChecked
                              ? 'text-emerald-500'
                              : 'text-slate-300 hover:text-primary-500'
                          }`}
                        >
                          {box.isChecked ? (
                            <CheckCircle2
                              size={24}
                              className="animate-fade-in"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Circle size={24} strokeWidth={2} />
                          )}
                        </button>

                        <div
                          className={`font-mono font-semibold text-lg w-20 ${
                            box.isChecked
                              ? 'text-slate-400 line-through'
                              : 'text-slate-800'
                          }`}
                        >
                          {box.boxNumber}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium ${
                              box.isChecked
                                ? 'text-slate-400 line-through'
                                : 'text-slate-800'
                            }`}
                          >
                            {box.contentSummary}
                          </div>
                          {box.returnNote && (
                            <div
                              className={`text-sm mt-0.5 ${
                                box.isChecked ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              备注：{box.returnNote}
                            </div>
                          )}
                          {box.fragileNote && (
                            <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                              <AlertTriangle size={12} />
                              {box.fragileNote}
                            </div>
                          )}
                          {isAbnormal && box.handoverNote && (
                            <div className="flex items-center gap-1 text-xs text-rose-600 mt-0.5 font-medium">
                              <AlertTriangle size={12} />
                              交接异常：{box.handoverNote}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              box.isChecked ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            <User size={14} />
                            {box.responsiblePerson}
                          </div>
                          <RiskBadge level={box.riskLevel} size="sm" />
                          <StatusBadge status={box.status} size="sm" />
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${HANDOVER_COLORS[box.handoverStatus]}`}>
                              <ArrowRightLeft size={10} />
                              {HANDOVER_LABELS[box.handoverStatus]}
                            </span>
                            {box.batchNumber && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                <Layers size={10} />
                                {box.batchNumber}
                              </span>
                            )}
                            {box.handoverPerson && box.receiverPerson && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                                <User size={10} />
                                {box.handoverPerson} → <UserCheck size={10} /> {box.receiverPerson}
                              </span>
                            )}
                            {isAbnormal && box.abnormalType && (
                              <div className="flex gap-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${ABNORMAL_TYPE_COLORS[box.abnormalType]}`}>
                                  {ABNORMAL_TYPE_LABELS[box.abnormalType]}
                                </span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${PROCESS_STATUS_COLORS[box.processStatus]}`}>
                                  {PROCESS_STATUS_LABELS[box.processStatus]}
                                </span>
                              </div>
                            )}
                          </div>
                          {box.isChecked && (
                            <div className="flex flex-col gap-1">
                              <div className="flex gap-1">
                                {box.handoverStatus !== 'completed' && (
                                  <button
                                    onClick={() => openSingleHandoverModal(box, 'completed')}
                                    className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors font-medium whitespace-nowrap"
                                  >
                                    确认交接
                                  </button>
                                )}
                                {box.handoverStatus !== 'abnormal' && (
                                  <button
                                    onClick={() => openSingleHandoverModal(box, 'abnormal')}
                                    className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors font-medium whitespace-nowrap"
                                  >
                                    异常交接
                                  </button>
                                )}
                                {box.handoverStatus !== 'pending' && (
                                  <button
                                    onClick={() => openSingleHandoverModal(box, 'pending')}
                                    className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors font-medium whitespace-nowrap"
                                  >
                                    重置为待交接
                                  </button>
                                )}
                              </div>
                              {isAbnormal && (
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={box.handoverNote}
                                    onChange={(e) => handleHandoverNoteChange(box.id, e.target.value)}
                                    placeholder="请填写异常说明..."
                                    onClick={(e) => e.stopPropagation()}
                                    className={`flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                                      box.handoverNote.trim() === ''
                                        ? 'border-rose-300 bg-rose-50'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          <select
                            value={box.status}
                            onChange={(e) =>
                              updateBox(box.id, {
                                status: e.target.value as typeof box.status,
                              })
                            }
                            className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="pending_pack">待装箱</option>
                            <option value="pending_return">待返场</option>
                            <option value="missing_investigate">缺件待查</option>
                            <option value="ready_seal">可封箱</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {groupedByScene.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">暂无需要返场的道具箱</p>
            <p className="text-sm mt-1">在管理模式中标记「需要返场」即可在此显示</p>
          </div>
        )}
      </div>

      {showBatchHandoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-teal-600" size={20} />
                按场次批量完成交接
              </h3>
              <button
                onClick={() => setShowBatchHandoverModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-teal-50 rounded-lg p-3 text-sm text-teal-700">
                场次：<span className="font-semibold">{batchHandoverScene}</span>
                <br />
                将为该场次中<span className="font-semibold">已核对且待交接</span>的道具箱完成交接
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接批次 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchHandoverData.batchNumber}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, batchNumber: e.target.value })}
                  placeholder="如 BATCH-2026-001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接人 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={batchHandoverData.handoverPerson}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, handoverPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">请选择交接人</option>
                  <option value="赵管理员">赵管理员</option>
                  <option value="钱管理员">钱管理员</option>
                  <option value="孙管理员">孙管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  接收人 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={batchHandoverData.receiverPerson}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, receiverPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">请选择接收人</option>
                  <option value="仓管小王">仓管小王</option>
                  <option value="仓管小李">仓管小李</option>
                  <option value="仓管老张">仓管老张</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接备注
                </label>
                <textarea
                  value={batchHandoverData.handoverNote}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, handoverNote: e.target.value })}
                  placeholder="填写交接备注（可选）..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBatchHandoverModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmBatchHandover}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors font-medium"
              >
                确认交接
              </button>
            </div>
          </div>
        </div>
      )}

      {showSingleHandoverModal && singleHandoverBox && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className={singleHandoverStatus === 'abnormal' ? 'text-rose-600' : 'text-teal-600'} size={20} />
                {singleHandoverStatus === 'abnormal' ? '异常交接登记' : '确认完成交接'}
              </h3>
              <button
                onClick={() => { setShowSingleHandoverModal(false); setSingleHandoverBox(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className={`rounded-lg p-3 text-sm ${singleHandoverStatus === 'abnormal' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'}`}>
                箱号：<span className="font-mono font-semibold">{singleHandoverBox.boxNumber}</span>
                <br />
                {singleHandoverBox.contentSummary}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接批次 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={singleHandoverData.batchNumber}
                  onChange={(e) => setSingleHandoverData({ ...singleHandoverData, batchNumber: e.target.value })}
                  placeholder="如 BATCH-2026-001"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接人 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={singleHandoverData.handoverPerson}
                  onChange={(e) => setSingleHandoverData({ ...singleHandoverData, handoverPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">请选择交接人</option>
                  <option value="赵管理员">赵管理员</option>
                  <option value="钱管理员">钱管理员</option>
                  <option value="孙管理员">孙管理员</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  接收人 <span className="text-rose-500">*</span>
                </label>
                <select
                  value={singleHandoverData.receiverPerson}
                  onChange={(e) => setSingleHandoverData({ ...singleHandoverData, receiverPerson: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">请选择接收人</option>
                  <option value="仓管小王">仓管小王</option>
                  <option value="仓管小李">仓管小李</option>
                  <option value="仓管老张">仓管老张</option>
                </select>
              </div>

              {singleHandoverStatus === 'abnormal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      异常类型 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={singleHandoverData.abnormalType || ''}
                      onChange={(e) => setSingleHandoverData({ ...singleHandoverData, abnormalType: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="">请选择异常类型</option>
                      {(Object.keys(ABNORMAL_TYPE_LABELS) as any[]).map((a) => (
                        <option key={a} value={a}>{ABNORMAL_TYPE_LABELS[a]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      处理状态
                    </label>
                    <select
                      value={singleHandoverData.processStatus || 'pending'}
                      onChange={(e) => setSingleHandoverData({ ...singleHandoverData, processStatus: e.target.value as any })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      {(Object.keys(PROCESS_STATUS_LABELS) as any[]).map((p) => (
                        <option key={p} value={p}>{PROCESS_STATUS_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      异常说明 <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={singleHandoverData.abnormalNote}
                      onChange={(e) => setSingleHandoverData({ ...singleHandoverData, abnormalNote: e.target.value })}
                      placeholder="详细描述异常情况..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      处理备注
                    </label>
                    <textarea
                      value={singleHandoverData.processNote}
                      onChange={(e) => setSingleHandoverData({ ...singleHandoverData, processNote: e.target.value })}
                      placeholder="处理措施或当前进展..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowSingleHandoverModal(false); setSingleHandoverBox(null); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSingleHandover}
                className={`px-4 py-2 text-sm text-white rounded-md transition-colors font-medium ${
                  singleHandoverStatus === 'abnormal' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-teal-600 hover:bg-teal-500'
                }`}
              >
                {singleHandoverStatus === 'abnormal' ? '确认异常登记' : '确认交接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
