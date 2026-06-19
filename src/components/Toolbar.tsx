import { Plus, Package, ListChecks, Filter, X, CheckSquare, Square, ArrowRightLeft, Layers, AlertOctagon, ClipboardCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { STATUS_LABELS, RISK_LABELS, HANDOVER_LABELS, ABNORMAL_TYPE_LABELS, PROCESS_STATUS_LABELS } from '@/types';
import type { BoxStatus, RiskLevel, HandoverStatus, AbnormalType, ProcessStatus, BatchHandoverData } from '@/types';
import { useState, useMemo } from 'react';

export function Toolbar() {
  const {
    boxes,
    selectedBoxIds,
    filters,
    viewMode,
    setFilters,
    resetFilters,
    setViewMode,
    addBox,
    batchUpdateStatus,
    batchCompleteHandover,
    selectAll,
    clearSelection,
  } = usePropStore();

  const [showBatchHandoverModal, setShowBatchHandoverModal] = useState(false);
  const [batchHandoverMode, setBatchHandoverMode] = useState<HandoverStatus>('completed');
  const [batchHandoverData, setBatchHandoverData] = useState<BatchHandoverData>({
    handoverPerson: '',
    receiverPerson: '',
    batchNumber: '',
    handoverResult: 'completed',
    abnormalType: '',
    processStatus: 'resolved',
    processNote: '',
    handoverNote: '',
  });
  const [showFilters, setShowFilters] = useState(true);

  const scenes = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.scene).filter(Boolean))),
    [boxes]
  );
  const persons = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.responsiblePerson).filter(Boolean))),
    [boxes]
  );
  const batchNumbers = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.batchNumber).filter(Boolean))),
    [boxes]
  );

  const handleAddBox = () => {
    const hasEmptyBoxNumber = boxes.some((b) => b.boxNumber.trim() === '');
    if (hasEmptyBoxNumber) {
      alert('已存在未设置箱号的道具箱，请先填写箱号后再新增。');
      const emptyBox = boxes.find((b) => b.boxNumber.trim() === '');
      if (emptyBox) {
        usePropStore.getState().setActiveBox(emptyBox.id);
      }
      return;
    }
    addBox({
      boxNumber: '',
      contentSummary: '',
      scene: scenes[0] || '',
      fragileNote: '',
      status: 'pending_pack',
      supplementNote: '',
      responsiblePerson: persons[0] || '',
      riskLevel: 'low',
      needsReturn: true,
      returnNote: '',
      isChecked: false,
      handoverStatus: 'pending',
      handoverPerson: '',
      handoverTime: '',
      handoverNote: '',
      receiverPerson: '',
      batchNumber: '',
      abnormalType: '',
      processStatus: 'pending',
      processNote: '',
    });
  };

  const handleBatchStatus = (status: BoxStatus) => {
    if (selectedBoxIds.length > 0) {
      batchUpdateStatus(selectedBoxIds, status);
    }
  };

  const openBatchHandoverModal = (handoverStatus: Exclude<HandoverStatus, 'pending'>) => {
    setBatchHandoverMode(handoverStatus);
    setBatchHandoverData({
      handoverPerson: '',
      receiverPerson: '',
      batchNumber: '',
      handoverResult: handoverStatus,
      abnormalType: '',
      processStatus: handoverStatus === 'abnormal' ? 'pending' : 'resolved',
      processNote: '',
      handoverNote: '',
    });
    setShowBatchHandoverModal(true);
  };

  const handleBatchCompleteHandover = () => {
    if (!batchHandoverData.handoverPerson || !batchHandoverData.receiverPerson || !batchHandoverData.batchNumber) {
      alert('请填写交接人、接收人和交接批次');
      return;
    }
    if (batchHandoverMode === 'abnormal' && (!batchHandoverData.abnormalType || !batchHandoverData.handoverNote?.trim())) {
      alert('批量异常交接必须填写异常类型和异常说明');
      return;
    }
    batchCompleteHandover(selectedBoxIds, batchHandoverData);
    setShowBatchHandoverModal(false);
    setBatchHandoverData({
      handoverPerson: '',
      receiverPerson: '',
      batchNumber: '',
      handoverResult: 'completed',
      abnormalType: '',
      processStatus: 'resolved',
      processNote: '',
      handoverNote: '',
    });
  };

  const filteredBoxes = useMemo(() => {
    return boxes
      .filter((b) => !filters.scene || b.scene === filters.scene)
      .filter((b) => !filters.responsiblePerson || b.responsiblePerson === filters.responsiblePerson)
      .filter((b) => !filters.status || b.status === filters.status)
      .filter((b) => !filters.riskLevel || b.riskLevel === filters.riskLevel)
      .filter((b) => !filters.handoverStatus || b.handoverStatus === filters.handoverStatus)
      .filter((b) => !filters.abnormalType || b.abnormalType === filters.abnormalType)
      .filter((b) => !filters.processStatus || b.processStatus === filters.processStatus)
      .filter((b) => !filters.batchNumber || b.batchNumber.includes(filters.batchNumber));
  }, [boxes, filters]);

  const filteredIds = useMemo(() => new Set(filteredBoxes.map((b) => b.id)), [filteredBoxes]);
  const selectedInFilter = selectedBoxIds.filter((id) => filteredIds.has(id));
  const selectedOutOfFilter = selectedBoxIds.filter((id) => !filteredIds.has(id));
  const allFilteredSelected = filteredBoxes.length > 0 && selectedInFilter.length === filteredBoxes.length;
  const someFilteredSelected = selectedInFilter.length > 0 && !allFilteredSelected;
  const filteredCount = filteredBoxes.length;

  const hasActiveFilters =
    filters.scene || filters.responsiblePerson || filters.status || filters.riskLevel ||
    filters.handoverStatus || filters.abnormalType || filters.processStatus || filters.batchNumber;

  const selectButtonLabel = allFilteredSelected
    ? `取消全选当前 (${filteredCount})`
    : someFilteredSelected
      ? `全选剩余 (${filteredCount - selectedInFilter.length})`
      : `全选当前 (${filteredCount})`;

  return (
    <div className="bg-primary-900 text-white shadow-lg">
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-lg font-bold tracking-wide flex items-center gap-2 shrink-0">
              <Package size={22} />
              <span className="hidden sm:inline">道具箱贴签与返场核对系统</span>
              <span className="sm:hidden">道具箱管理</span>
            </h1>
            <div className="flex bg-primary-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('normal')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === 'normal'
                    ? 'bg-white text-primary-900 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <Package size={16} />
                <span className="hidden sm:inline">管理模式</span>
              </button>
              <button
                onClick={() => setViewMode('checklist')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  viewMode === 'checklist'
                    ? 'bg-white text-primary-900 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <ListChecks size={16} />
                <span className="hidden sm:inline">返场总表</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {viewMode === 'normal' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-primary-800 hover:bg-primary-700 text-white text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Filter size={16} />
                <span className="hidden sm:inline">筛选</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                )}
                {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}

            <button
              onClick={handleAddBox}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium shadow-md shrink-0"
            >
              <Plus size={16} />
              新增道具箱
            </button>
          </div>
        </div>

        {viewMode === 'normal' && showFilters && (
          <div className="mt-3 pt-3 border-t border-primary-700/50">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.scene}
                onChange={(e) => setFilters({ scene: e.target.value })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">全部场次</option>
                {scenes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filters.responsiblePerson}
                onChange={(e) => setFilters({ responsiblePerson: e.target.value })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">全部责任人</option>
                {persons.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value as BoxStatus | '' })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">全部状态</option>
                {(Object.keys(STATUS_LABELS) as BoxStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <select
                value={filters.riskLevel}
                onChange={(e) => setFilters({ riskLevel: e.target.value as RiskLevel | '' })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">全部风险</option>
                {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
                  <option key={r} value={r}>{RISK_LABELS[r]}</option>
                ))}
              </select>
              <select
                value={filters.handoverStatus}
                onChange={(e) => setFilters({ handoverStatus: e.target.value as HandoverStatus | '' })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[100px]"
              >
                <option value="">全部交接</option>
                {(Object.keys(HANDOVER_LABELS) as HandoverStatus[]).map((h) => (
                  <option key={h} value={h}>{HANDOVER_LABELS[h]}</option>
                ))}
              </select>
              <select
                value={filters.abnormalType}
                onChange={(e) => setFilters({ abnormalType: e.target.value as AbnormalType | '' })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[110px]"
              >
                <option value="">全部异常类型</option>
                {(Object.keys(ABNORMAL_TYPE_LABELS) as AbnormalType[]).map((a) => (
                  <option key={a} value={a}>{ABNORMAL_TYPE_LABELS[a]}</option>
                ))}
              </select>
              <select
                value={filters.processStatus}
                onChange={(e) => setFilters({ processStatus: e.target.value as ProcessStatus | '' })}
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[110px]"
              >
                <option value="">全部处理状态</option>
                {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((p) => (
                  <option key={p} value={p}>{PROCESS_STATUS_LABELS[p]}</option>
                ))}
              </select>
              <input
                type="text"
                value={filters.batchNumber}
                onChange={(e) => setFilters({ batchNumber: e.target.value })}
                placeholder="搜索批次号..."
                className="bg-primary-800 border border-primary-700 text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-32 placeholder-primary-400"
              />
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-primary-300 hover:text-white transition-colors flex items-center gap-1 text-sm px-2 py-1.5"
                >
                  <X size={14} />
                  清除筛选
                </button>
              )}
            </div>
          </div>
        )}

        {viewMode === 'normal' && (
          <div className="mt-3 pt-3 border-t border-primary-700/50">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                  allFilteredSelected
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-primary-800 hover:bg-primary-700 text-white'
                }`}
              >
                {allFilteredSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                {selectButtonLabel}
              </button>

              {selectedBoxIds.length > 0 && (
                <>
                  {selectedOutOfFilter.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-xs text-primary-300 hover:text-white transition-colors px-2 py-1"
                      title="清空所有选中（含其他筛选范围）"
                    >
                      清空全部 ({selectedBoxIds.length})
                    </button>
                  )}
                  <div className="h-5 w-px bg-primary-700 mx-1 hidden sm:block" />
                  <div className="flex items-center gap-1 bg-primary-800 rounded-md p-0.5">
                    <span className="px-2 py-1 text-xs text-primary-300 hidden md:inline">状态:</span>
                    <button
                      onClick={() => handleBatchStatus('pending_pack')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="待装箱"
                    >
                      待装箱
                    </button>
                    <button
                      onClick={() => handleBatchStatus('pending_return')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="待返场"
                    >
                      待返场
                    </button>
                    <button
                      onClick={() => handleBatchStatus('missing_investigate')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="缺件待查"
                    >
                      缺件待查
                    </button>
                    <button
                      onClick={() => handleBatchStatus('ready_seal')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="可封箱"
                    >
                      可封箱
                    </button>
                  </div>
                  <div className="flex items-center gap-1 bg-primary-800 rounded-md p-0.5">
                    <ArrowRightLeft size={14} className="text-primary-300 mx-1 hidden sm:block" />
                    <span className="px-2 py-1 text-xs text-primary-300 hidden md:inline">交接:</span>
                    <button
                      onClick={() => openBatchHandoverModal('completed')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="标记已交接"
                    >
                      已交接
                    </button>
                    <button
                      onClick={() => openBatchHandoverModal('abnormal')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="标记异常交接"
                    >
                      异常交接
                    </button>
                    <button
                      onClick={() => openBatchHandoverModal('completed')}
                      className="px-2.5 py-1 text-xs rounded hover:bg-teal-600 transition-colors bg-teal-700 text-white flex items-center gap-1"
                      title="批量完成交接"
                    >
                      <ClipboardCheck size={12} />
                      <span className="hidden sm:inline">批量交接</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'normal' && selectedBoxIds.length > 0 && (
        <div className="px-4 pb-3 md:px-6 text-sm text-primary-200">
          <span>
            已选择 <span className="font-semibold text-white">{selectedBoxIds.length}</span> 个道具箱
          </span>
          {selectedOutOfFilter.length > 0 && (
            <span className="ml-2 text-amber-300">
              （含其他筛选范围 {selectedOutOfFilter.length} 个）
            </span>
          )}
          {!allFilteredSelected && filteredBoxes.length > 0 && selectedInFilter.length > 0 && (
            <span className="ml-2 text-primary-300">
              当前筛选范围已选 {selectedInFilter.length}/{filteredCount}
            </span>
          )}
        </div>
      )}

      {showBatchHandoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ClipboardCheck className="text-teal-600" size={20} />
                {batchHandoverMode === 'abnormal' ? '批量异常交接' : '批量完成交接'}
              </h3>
              <button
                onClick={() => setShowBatchHandoverModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                即将为 <span className="font-semibold text-slate-800">{selectedBoxIds.length}</span> 个道具箱
                {batchHandoverMode === 'abnormal' ? '登记异常交接' : '完成交接'}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接批次 <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <select
                    value={batchHandoverData.batchNumber}
                    onChange={(e) => setBatchHandoverData({ ...batchHandoverData, batchNumber: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">选择已有批次</option>
                    {batchNumbers.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={batchHandoverData.batchNumber}
                    onChange={(e) => setBatchHandoverData({ ...batchHandoverData, batchNumber: e.target.value })}
                    placeholder="或输入新批次号"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  交接人 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchHandoverData.handoverPerson}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, handoverPerson: e.target.value })}
                  placeholder="输入交接人姓名"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  接收人 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={batchHandoverData.receiverPerson}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, receiverPerson: e.target.value })}
                  placeholder="输入接收人姓名"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {batchHandoverMode === 'abnormal' ? '异常说明' : '交接备注'}
                  {batchHandoverMode === 'abnormal' && <span className="text-rose-500"> *</span>}
                </label>
                <textarea
                  value={batchHandoverData.handoverNote}
                  onChange={(e) => setBatchHandoverData({ ...batchHandoverData, handoverNote: e.target.value })}
                  placeholder={batchHandoverMode === 'abnormal' ? '填写异常情况说明...' : '填写交接备注（可选）...'}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              {batchHandoverMode === 'abnormal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      异常类型 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={batchHandoverData.abnormalType || ''}
                      onChange={(e) => setBatchHandoverData({ ...batchHandoverData, abnormalType: e.target.value as AbnormalType })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">请选择异常类型</option>
                      {(Object.keys(ABNORMAL_TYPE_LABELS) as AbnormalType[]).map((a) => (
                        <option key={a} value={a}>{ABNORMAL_TYPE_LABELS[a]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      处理状态
                    </label>
                    <select
                      value={batchHandoverData.processStatus || 'pending'}
                      onChange={(e) => setBatchHandoverData({ ...batchHandoverData, processStatus: e.target.value as ProcessStatus })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((p) => (
                        <option key={p} value={p}>{PROCESS_STATUS_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      处理备注
                    </label>
                    <textarea
                      value={batchHandoverData.processNote || ''}
                      onChange={(e) => setBatchHandoverData({ ...batchHandoverData, processNote: e.target.value })}
                      placeholder="填写处理措施或当前进展..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBatchHandoverModal(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleBatchCompleteHandover}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors font-medium"
              >
                {batchHandoverMode === 'abnormal' ? '确认异常交接' : '确认交接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
