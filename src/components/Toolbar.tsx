import { Plus, Package, ListChecks, Filter, X, CheckSquare, Square, ArrowRightLeft, Layers, AlertOctagon, ClipboardCheck } from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { STATUS_LABELS, RISK_LABELS, HANDOVER_LABELS, ABNORMAL_TYPE_LABELS, PROCESS_STATUS_LABELS } from '@/types';
import type { BoxStatus, RiskLevel, HandoverStatus, AbnormalType, ProcessStatus, BatchHandoverData } from '@/types';
import { useState } from 'react';

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
    loadFromStorage,
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

  const scenes = Array.from(new Set(boxes.map((b) => b.scene)));
  const persons = Array.from(new Set(boxes.map((b) => b.responsiblePerson)));
  const batchNumbers = Array.from(new Set(boxes.map((b) => b.batchNumber).filter(Boolean)));

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
      needsReturn: false,
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

  const filteredBoxes = boxes
    .filter((b) => !filters.scene || b.scene === filters.scene)
    .filter((b) => !filters.responsiblePerson || b.responsiblePerson === filters.responsiblePerson)
    .filter((b) => !filters.status || b.status === filters.status)
    .filter((b) => !filters.riskLevel || b.riskLevel === filters.riskLevel)
    .filter((b) => !filters.handoverStatus || b.handoverStatus === filters.handoverStatus)
    .filter((b) => !filters.abnormalType || b.abnormalType === filters.abnormalType)
    .filter((b) => !filters.processStatus || b.processStatus === filters.processStatus)
    .filter((b) => !filters.batchNumber || b.batchNumber.includes(filters.batchNumber));

  const allFilteredSelected =
    filteredBoxes.length > 0 && filteredBoxes.every((b) => selectedBoxIds.includes(b.id));
  const selectedInFiltered = filteredBoxes.filter((b) => selectedBoxIds.includes(b.id)).length;
  const selectedOutsideFilter = selectedBoxIds.length - selectedInFiltered;

  const filteredCount = filteredBoxes.length;

  const hasActiveFilters =
    filters.scene || filters.responsiblePerson || filters.status || filters.riskLevel || 
    filters.handoverStatus || filters.abnormalType || filters.processStatus || filters.batchNumber;

  return (
    <div className="bg-primary-900 text-white px-4 sm:px-6 py-4 shadow-lg">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <h1 className="text-base sm:text-lg font-bold tracking-wide flex items-center gap-2">
              <Package size={20} className="sm:w-[22px] sm:h-[22px]" />
              <span className="hidden sm:inline">道具箱贴签与返场核对系统</span>
              <span className="sm:hidden">道具箱管理</span>
            </h1>
            <div className="flex bg-primary-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('normal')}
                className={`px-2.5 py-1.5 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${
                  viewMode === 'normal'
                    ? 'bg-white text-primary-900 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <Package size={14} className="sm:w-4 sm:h-4" />
                管理
              </button>
              <button
                onClick={() => setViewMode('checklist')}
                className={`px-2.5 py-1.5 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-1.5 ${
                  viewMode === 'checklist'
                    ? 'bg-white text-primary-900 shadow'
                    : 'text-primary-200 hover:text-white'
                }`}
              >
                <ListChecks size={14} className="sm:w-4 sm:h-4" />
                总表
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {viewMode === 'normal' && (
              <>
                <button
                  onClick={handleAddBox}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md transition-colors flex items-center gap-1 sm:gap-1.5 font-medium shadow-md"
                >
                  <Plus size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">新增道具箱</span>
                  <span className="xs:hidden">新增</span>
                </button>
                <button
                  onClick={loadFromStorage}
                  className="text-primary-300 hover:text-white transition-colors p-1.5"
                  title="重新加载数据"
                >
                  <Filter size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {viewMode === 'normal' && (
          <>
            <div className="bg-primary-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Filter size={14} className="text-primary-300" />
                <span className="text-xs font-medium text-primary-200">筛选条件</span>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="ml-auto text-primary-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                  >
                    <X size={12} />
                    清除筛选
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filters.scene}
                  onChange={(e) => setFilters({ scene: e.target.value })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部场次</option>
                  {scenes.filter(s => s).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.responsiblePerson}
                  onChange={(e) => setFilters({ responsiblePerson: e.target.value })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部责任人</option>
                  {persons.filter(p => p).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ status: e.target.value as BoxStatus | '' })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部状态</option>
                  {(Object.keys(STATUS_LABELS) as BoxStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ riskLevel: e.target.value as RiskLevel | '' })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部风险</option>
                  {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
                    <option key={r} value={r}>
                      {RISK_LABELS[r]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.handoverStatus}
                  onChange={(e) => setFilters({ handoverStatus: e.target.value as HandoverStatus | '' })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部交接</option>
                  {(Object.keys(HANDOVER_LABELS) as HandoverStatus[]).map((h) => (
                    <option key={h} value={h}>
                      {HANDOVER_LABELS[h]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.abnormalType}
                  onChange={(e) => setFilters({ abnormalType: e.target.value as AbnormalType | '' })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部异常</option>
                  {(Object.keys(ABNORMAL_TYPE_LABELS) as AbnormalType[]).map((a) => (
                    <option key={a} value={a}>
                      {ABNORMAL_TYPE_LABELS[a]}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.processStatus}
                  onChange={(e) => setFilters({ processStatus: e.target.value as ProcessStatus | '' })}
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                >
                  <option value="">全部处理</option>
                  {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((p) => (
                    <option key={p} value={p}>
                      {PROCESS_STATUS_LABELS[p]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={filters.batchNumber}
                  onChange={(e) => setFilters({ batchNumber: e.target.value })}
                  placeholder="搜索批次..."
                  className="bg-primary-800 border border-primary-700 text-white text-xs sm:text-sm rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 w-24 sm:w-32 placeholder-primary-400 flex-shrink-0"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={allFilteredSelected ? clearSelection : selectAll}
                className="bg-primary-800 hover:bg-primary-700 text-white text-xs sm:text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 flex-shrink-0"
                title={selectedOutsideFilter > 0 ? `已选中 ${selectedBoxIds.length} 项（含 ${selectedOutsideFilter} 项不在当前筛选结果中）` : ''}
              >
                {allFilteredSelected ? <CheckSquare size={14} className="sm:w-4 sm:h-4" /> : <Square size={14} className="sm:w-4 sm:h-4" />}
                {allFilteredSelected ? '取消全选' : `全选当前 (${filteredCount})`}
                {selectedOutsideFilter > 0 && <span className="text-amber-300 text-xs ml-1">+{selectedOutsideFilter}</span>}
              </button>

              {selectedBoxIds.length > 0 && (
                <>
                  <div className="h-5 w-px bg-primary-700 hidden sm:block" />
                  <div className="flex items-center gap-1 bg-primary-800 rounded-md p-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleBatchStatus('pending_pack')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="待装箱"
                    >
                      待装箱
                    </button>
                    <button
                      onClick={() => handleBatchStatus('pending_return')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="待返场"
                    >
                      待返场
                    </button>
                    <button
                      onClick={() => handleBatchStatus('missing_investigate')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="缺件待查"
                    >
                      缺件待查
                    </button>
                    <button
                      onClick={() => handleBatchStatus('ready_seal')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="可封箱"
                    >
                      可封箱
                    </button>
                  </div>
                  <div className="flex items-center gap-1 bg-primary-800 rounded-md p-0.5 flex-shrink-0">
                    <ArrowRightLeft size={12} className="text-primary-300 mx-1 hidden sm:block" />
                    <button
                      onClick={() => openBatchHandoverModal('completed')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="标记已交接"
                    >
                      已交接
                    </button>
                    <button
                      onClick={() => openBatchHandoverModal('abnormal')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors"
                      title="标记异常交接"
                    >
                      异常交接
                    </button>
                    <button
                      onClick={() => openBatchHandoverModal('completed')}
                      className="px-2 py-1 text-xs rounded hover:bg-primary-700 transition-colors bg-teal-700 flex items-center gap-1"
                      title="批量完成交接"
                    >
                      <ClipboardCheck size={10} className="sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">批量交接</span>
                      <span className="sm:hidden">批量</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {viewMode === 'normal' && selectedBoxIds.length > 0 && (
        <div className="mt-3 text-sm text-primary-200 animate-fade-in">
          已选择 <span className="font-semibold text-white">{selectedBoxIds.length}</span> 个道具箱
          {selectedOutsideFilter > 0 && hasActiveFilters && (
            <span className="text-amber-300 ml-2">
              （当前筛选结果中 {selectedInFiltered} 个，{selectedOutsideFilter} 个在其他筛选范围）
            </span>
          )}
        </div>
      )}

      {showBatchHandoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slide-up">
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
                <div className="flex gap-2">
                  <select
                    value={batchHandoverData.batchNumber}
                    onChange={(e) => setBatchHandoverData({ ...batchHandoverData, batchNumber: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">选择或输入批次</option>
                    {batchNumbers.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={batchHandoverData.batchNumber}
                    onChange={(e) => setBatchHandoverData({ ...batchHandoverData, batchNumber: e.target.value })}
                    placeholder="输入新批次"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
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
                  {persons.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="赵管理员">赵管理员</option>
                  <option value="钱管理员">钱管理员</option>
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
