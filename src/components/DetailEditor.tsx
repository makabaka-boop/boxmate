import { Trash2, Save, AlertTriangle, ArrowRightLeft, Layers, UserCheck, User, AlertOctagon, Clock, CheckCircle2, XCircle, Plus, History } from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { STATUS_LABELS, RISK_LABELS, HANDOVER_LABELS, HANDOVER_COLORS, ABNORMAL_TYPE_LABELS, ABNORMAL_TYPE_COLORS, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from '@/types';
import type { BoxStatus, RiskLevel, HandoverStatus, AbnormalType, ProcessStatus, HandoverRecord, PropBox } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';

export function DetailEditor() {
  const {
    boxes,
    activeBoxId,
    updateBox,
    deleteBox,
    setActiveBox,
    addHandoverRecord,
    updateHandoverRecord,
  } = usePropStore();

  const [hasChanges, setHasChanges] = useState(false);
  const prevActiveBoxIdRef = useRef<string | null>(null);
  const [showNewHandoverForm, setShowNewHandoverForm] = useState(false);
  const [newHandoverRecord, setNewHandoverRecord] = useState<Partial<HandoverRecord>>({
    batchNumber: '',
    handoverResult: 'completed',
    handoverPerson: '',
    receiverPerson: '',
    abnormalType: '',
    abnormalNote: '',
    processStatus: 'resolved',
    processNote: '',
    createdBy: '',
  });

  const activeBox = useMemo(
    () => boxes.find((b) => b.id === activeBoxId) || null,
    [boxes, activeBoxId]
  );

  useEffect(() => {
    if (activeBoxId !== prevActiveBoxIdRef.current) {
      setHasChanges(false);
      prevActiveBoxIdRef.current = activeBoxId;
    }
  }, [activeBoxId]);

  const scenes = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.scene))),
    [boxes]
  );
  const persons = useMemo(
    () => Array.from(new Set(boxes.map((b) => b.responsiblePerson))),
    [boxes]
  );

  const handleChange = (field: string, value: string | boolean) => {
    if (!activeBox) return;
    updateBox(activeBox.id, { [field]: value });
    setHasChanges(true);
  };

  const handleSceneChange = (value: string) => {
    if (!activeBox) return;
    if (value === '__add_new_scene__') {
      const input = window.prompt('请输入新的场次名称');
      const trimmed = (input || '').trim();
      if (!trimmed) return;
      updateBox(activeBox.id, { scene: trimmed });
      setHasChanges(true);
      return;
    }
    handleChange('scene', value);
  };

  const handleResponsiblePersonChange = (value: string) => {
    if (!activeBox) return;
    if (value === '__add_new_person__') {
      const input = window.prompt('请输入新的责任人姓名');
      const trimmed = (input || '').trim();
      if (!trimmed) return;
      updateBox(activeBox.id, { responsiblePerson: trimmed });
      setHasChanges(true);
      return;
    }
    handleChange('responsiblePerson', value);
  };

  const getLatestHandoverRecord = () => {
    if (!activeBox || !activeBox.handoverRecords || activeBox.handoverRecords.length === 0) return null;
    return activeBox.handoverRecords[activeBox.handoverRecords.length - 1];
  };

  const handleHandoverFieldChange = (field: 'batchNumber' | 'handoverPerson' | 'receiverPerson' | 'handoverNote' | 'abnormalType' | 'processStatus' | 'processNote', value: string) => {
    if (!activeBox) return;
    updateBox(activeBox.id, { [field]: value });
    setHasChanges(true);

    const latest = getLatestHandoverRecord();
    const hasMatchingLatest = latest && latest.handoverResult === activeBox.handoverStatus;

    if (hasMatchingLatest) {
      const recordUpdates: Partial<HandoverRecord> = {};
      if (field === 'batchNumber') recordUpdates.batchNumber = value;
      else if (field === 'handoverPerson') recordUpdates.handoverPerson = value;
      else if (field === 'receiverPerson') recordUpdates.receiverPerson = value;
      else if (field === 'handoverNote') {
        if (activeBox.handoverStatus === 'abnormal') recordUpdates.abnormalNote = value;
      } else if (field === 'abnormalType') {
        recordUpdates.abnormalType = value as AbnormalType | '';
      } else if (field === 'processStatus') {
        recordUpdates.processStatus = value as ProcessStatus;
      } else if (field === 'processNote') {
        recordUpdates.processNote = value;
      }

      if (Object.keys(recordUpdates).length > 0) {
        updateHandoverRecord(activeBox.id, latest.id, recordUpdates);
      }
      return;
    }

    if (activeBox.handoverStatus === 'pending') return;

    const next = { ...activeBox, [field]: value } as PropBox;
    const hasBaseInfo =
      (next.batchNumber || '').trim() !== '' &&
      (next.handoverPerson || '').trim() !== '' &&
      (next.receiverPerson || '').trim() !== '';

    if (!hasBaseInfo) return;

    if (next.handoverStatus === 'abnormal') {
      const hasAbnormalInfo =
        !!next.abnormalType && (next.handoverNote || '').trim() !== '';
      if (!hasAbnormalInfo) return;
    }

    addHandoverRecord(activeBox.id, {
      batchNumber: next.batchNumber,
      handoverResult: next.handoverStatus,
      handoverPerson: next.handoverPerson,
      receiverPerson: next.receiverPerson,
      abnormalType: next.handoverStatus === 'abnormal' ? next.abnormalType : '',
      abnormalNote: next.handoverStatus === 'abnormal' ? next.handoverNote : '',
      processStatus: next.handoverStatus === 'abnormal' ? next.processStatus : 'resolved',
      processNote: next.handoverStatus === 'abnormal' ? next.processNote : '',
      createdBy: next.handoverPerson || next.responsiblePerson,
    });
  };

  const handleHandoverStatusChange = (status: HandoverStatus) => {
    if (!activeBox) return;

    if (status === 'pending') {
      updateBox(activeBox.id, {
        handoverStatus: 'pending',
        handoverTime: '',
        handoverPerson: '',
        receiverPerson: '',
        batchNumber: '',
        abnormalType: '',
        processStatus: 'pending',
        processNote: '',
      });
      setHasChanges(true);
      return;
    }

    const hasRequiredInfo =
      activeBox.batchNumber.trim() !== '' &&
      activeBox.handoverPerson.trim() !== '' &&
      activeBox.receiverPerson.trim() !== '';

    if (!hasRequiredInfo) {
      updateBox(activeBox.id, {
        handoverStatus: status,
        processStatus: status === 'abnormal' ? activeBox.processStatus || 'pending' : 'resolved',
      });
      setHasChanges(true);
      alert('已切换交接状态，请补充完整批次/交接人/接收人信息后系统将自动生成交接历史记录。');
      return;
    }

    if (status === 'abnormal' && (!activeBox.abnormalType || activeBox.handoverNote.trim() === '')) {
      updateBox(activeBox.id, {
        handoverStatus: status,
        processStatus: activeBox.processStatus || 'pending',
      });
      setHasChanges(true);
      alert('已切换为异常交接，请填写异常类型与异常说明后系统将自动生成异常交接历史记录。');
      return;
    }

    addHandoverRecord(activeBox.id, {
      batchNumber: activeBox.batchNumber,
      handoverResult: status,
      handoverPerson: activeBox.handoverPerson,
      receiverPerson: activeBox.receiverPerson,
      abnormalType: status === 'abnormal' ? activeBox.abnormalType : '',
      abnormalNote: status === 'abnormal' ? activeBox.handoverNote : '',
      processStatus: status === 'abnormal' ? activeBox.processStatus : 'resolved',
      processNote: status === 'abnormal' ? activeBox.processNote : '',
      createdBy: activeBox.handoverPerson || activeBox.responsiblePerson,
    });
    setHasChanges(true);
  };

  const handleDelete = () => {
    if (!activeBox) return;
    if (confirm(`确定要删除道具箱「${activeBox.boxNumber || '未命名'}」吗？`)) {
      deleteBox(activeBox.id);
    }
  };

  if (!activeBox) {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h3 className="font-semibold text-slate-700">道具箱详情</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
          点击表格中的道具箱查看详情
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-slate-700">道具箱详情</h3>
          <StatusBadge status={activeBox.status} size="sm" />
          <RiskBadge level={activeBox.riskLevel} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <Save size={12} />
              已自动保存
            </span>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setActiveBox(null)}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            关闭
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              箱号 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={activeBox.boxNumber}
              onChange={(e) => handleChange('boxNumber', e.target.value)}
              placeholder="如 A-01"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              上场场次 <span className="text-rose-500">*</span>
            </label>
            <select
              value={activeBox.scene}
              onChange={(e) => handleSceneChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {!scenes.includes(activeBox.scene) && activeBox.scene && (
                <option value={activeBox.scene}>{activeBox.scene}</option>
              )}
              {scenes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="__add_new_scene__">+ 新增场次...</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              内容摘要 <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={activeBox.contentSummary}
              onChange={(e) => handleChange('contentSummary', e.target.value)}
              placeholder="填写箱内物品清单..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              <AlertTriangle size={12} className="inline mr-1 text-amber-500" />
              脆弱提醒
            </label>
            <input
              type="text"
              value={activeBox.fragileNote}
              onChange={(e) => handleChange('fragileNote', e.target.value)}
              placeholder="易碎、贵重、特殊处理要求等..."
              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                activeBox.fragileNote
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-300'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              返场状态
            </label>
            <select
              value={activeBox.status}
              onChange={(e) => handleChange('status', e.target.value as BoxStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {(Object.keys(STATUS_LABELS) as BoxStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              风险等级
            </label>
            <select
              value={activeBox.riskLevel}
              onChange={(e) => handleChange('riskLevel', e.target.value as RiskLevel)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
                <option key={r} value={r}>
                  {RISK_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              责任人 <span className="text-rose-500">*</span>
            </label>
            <select
              value={activeBox.responsiblePerson}
              onChange={(e) => handleResponsiblePersonChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {!persons.includes(activeBox.responsiblePerson) && activeBox.responsiblePerson && (
                <option value={activeBox.responsiblePerson}>{activeBox.responsiblePerson}</option>
              )}
              {persons.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__add_new_person__">+ 新增责任人...</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              补件备注
            </label>
            <input
              type="text"
              value={activeBox.supplementNote}
              onChange={(e) => handleChange('supplementNote', e.target.value)}
              placeholder="需补充的物品..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="needsReturn"
                checked={activeBox.needsReturn}
                onChange={(e) => handleChange('needsReturn', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
              <label
                htmlFor="needsReturn"
                className="text-sm font-medium text-slate-700"
              >
                需要返场
              </label>
            </div>
            {activeBox.needsReturn && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  返场备注
                </label>
                <textarea
                  value={activeBox.returnNote}
                  onChange={(e) => handleChange('returnNote', e.target.value)}
                  placeholder="返场时需要注意的事项..."
                  rows={2}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                    activeBox.returnNote.trim() === ''
                      ? 'border-amber-300'
                      : 'border-slate-300'
                  }`}
                />
                {activeBox.returnNote.trim() === '' && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠ 建议填写返场备注以确保核对无误
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-primary-600" />
                <span className="text-sm font-medium text-slate-700">交接记录中心</span>
              </div>
              <button
                onClick={() => {
                  setShowNewHandoverForm(true);
                  setNewHandoverRecord({
                    batchNumber: '',
                    handoverResult: 'completed',
                    handoverPerson: '',
                    receiverPerson: '',
                    abnormalType: '',
                    abnormalNote: '',
                    processStatus: 'resolved',
                    processNote: '',
                    createdBy: '',
                  });
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors font-medium"
              >
                <Plus size={12} />
                新增交接记录
              </button>
            </div>

            {showNewHandoverForm && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-teal-800">新增交接记录</h4>
                  <button
                    onClick={() => setShowNewHandoverForm(false)}
                    className="text-teal-500 hover:text-teal-700"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      交接批次 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newHandoverRecord.batchNumber || ''}
                      onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, batchNumber: e.target.value })}
                      placeholder="如 BATCH-2026-001"
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      交接结果 <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newHandoverRecord.handoverResult || 'completed'}
                      onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, handoverResult: e.target.value as HandoverStatus })}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      {(Object.keys(HANDOVER_LABELS) as HandoverStatus[]).filter(h => h !== 'pending').map((h) => (
                        <option key={h} value={h}>
                          {HANDOVER_LABELS[h]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      交接人 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newHandoverRecord.handoverPerson || ''}
                      onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, handoverPerson: e.target.value })}
                      placeholder="交接人姓名"
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      接收人 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newHandoverRecord.receiverPerson || ''}
                      onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, receiverPerson: e.target.value })}
                      placeholder="接收人姓名"
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  {newHandoverRecord.handoverResult === 'abnormal' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          异常类型 <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={newHandoverRecord.abnormalType || ''}
                          onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, abnormalType: e.target.value as AbnormalType })}
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          <option value="">请选择异常类型</option>
                          {(Object.keys(ABNORMAL_TYPE_LABELS) as AbnormalType[]).map((a) => (
                            <option key={a} value={a}>
                              {ABNORMAL_TYPE_LABELS[a]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          处理状态
                        </label>
                        <select
                          value={newHandoverRecord.processStatus || 'pending'}
                          onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, processStatus: e.target.value as ProcessStatus })}
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((p) => (
                            <option key={p} value={p}>
                              {PROCESS_STATUS_LABELS[p]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          异常说明 <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={newHandoverRecord.abnormalNote || ''}
                          onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, abnormalNote: e.target.value })}
                          placeholder="详细描述异常情况..."
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          处理备注
                        </label>
                        <textarea
                          value={newHandoverRecord.processNote || ''}
                          onChange={(e) => setNewHandoverRecord({ ...newHandoverRecord, processNote: e.target.value })}
                          placeholder="处理措施或进展..."
                          rows={2}
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowNewHandoverForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      if (!newHandoverRecord.batchNumber || !newHandoverRecord.handoverPerson || !newHandoverRecord.receiverPerson) {
                        alert('请填写交接批次、交接人和接收人');
                        return;
                      }
                      if (newHandoverRecord.handoverResult === 'abnormal' && (!newHandoverRecord.abnormalType || !newHandoverRecord.abnormalNote)) {
                        alert('异常交接必须填写异常类型和异常说明');
                        return;
                      }
                      const isAbnormal = newHandoverRecord.handoverResult === 'abnormal';
                      const completeRecord: Omit<HandoverRecord, 'id' | 'boxId' | 'handoverTime' | 'processedAt'> = {
                        batchNumber: newHandoverRecord.batchNumber || '',
                        handoverResult: (newHandoverRecord.handoverResult || 'completed') as HandoverStatus,
                        handoverPerson: newHandoverRecord.handoverPerson || '',
                        receiverPerson: newHandoverRecord.receiverPerson || '',
                        abnormalType: isAbnormal ? (newHandoverRecord.abnormalType || '') : '',
                        abnormalNote: isAbnormal ? (newHandoverRecord.abnormalNote || '') : '',
                        processStatus: isAbnormal ? (newHandoverRecord.processStatus || 'pending') : 'resolved',
                        processNote: isAbnormal ? (newHandoverRecord.processNote || '') : '',
                        createdBy: newHandoverRecord.createdBy || newHandoverRecord.handoverPerson || activeBox.responsiblePerson,
                      };
                      addHandoverRecord(activeBox.id, completeRecord);
                      setShowNewHandoverForm(false);
                      setHasChanges(true);
                    }}
                    className="px-3 py-1.5 text-xs bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors font-medium"
                  >
                    确认提交
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  当前交接状态
                </label>
                <select
                  value={activeBox.handoverStatus}
                  onChange={(e) => handleHandoverStatusChange(e.target.value as HandoverStatus)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {(Object.keys(HANDOVER_LABELS) as HandoverStatus[]).map((h) => (
                    <option key={h} value={h}>
                      {HANDOVER_LABELS[h]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  交接批次
                </label>
                <input
                  type="text"
                  value={activeBox.batchNumber}
                  onChange={(e) => handleHandoverFieldChange('batchNumber', e.target.value)}
                  placeholder="交接批次号"
                  disabled={activeBox.handoverStatus === 'pending'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  交接人
                </label>
                <input
                  type="text"
                  value={activeBox.handoverPerson}
                  onChange={(e) => handleHandoverFieldChange('handoverPerson', e.target.value)}
                  placeholder="交接人姓名"
                  disabled={activeBox.handoverStatus === 'pending'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  接收人
                </label>
                <input
                  type="text"
                  value={activeBox.receiverPerson}
                  onChange={(e) => handleHandoverFieldChange('receiverPerson', e.target.value)}
                  placeholder="接收人姓名"
                  disabled={activeBox.handoverStatus === 'pending'}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {activeBox.handoverTime && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    交接时间
                  </label>
                  <div className="px-3 py-2 text-sm text-slate-600 bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-400" />
                    {new Date(activeBox.handoverTime).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}

              {activeBox.handoverStatus === 'abnormal' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      异常类型
                    </label>
                    <select
                      value={activeBox.abnormalType || ''}
                      onChange={(e) => handleHandoverFieldChange('abnormalType', e.target.value)}
                      disabled={activeBox.handoverStatus !== 'abnormal'}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">请选择</option>
                      {(Object.keys(ABNORMAL_TYPE_LABELS) as AbnormalType[]).map((a) => (
                        <option key={a} value={a}>
                          {ABNORMAL_TYPE_LABELS[a]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      处理状态
                    </label>
                    <select
                      value={activeBox.processStatus}
                      onChange={(e) => handleHandoverFieldChange('processStatus', e.target.value)}
                      disabled={activeBox.handoverStatus !== 'abnormal'}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {(Object.keys(PROCESS_STATUS_LABELS) as ProcessStatus[]).map((p) => (
                        <option key={p} value={p}>
                          {PROCESS_STATUS_LABELS[p]}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className={activeBox.handoverStatus === 'abnormal' ? 'col-span-2' : activeBox.handoverTime ? 'col-span-2' : 'col-span-2'}>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {activeBox.handoverStatus === 'abnormal' ? '异常说明' : '交接备注'}
                  {activeBox.handoverStatus === 'abnormal' && (
                    <span className="text-rose-500 ml-1">*</span>
                  )}
                </label>
                <textarea
                  value={activeBox.handoverNote}
                  onChange={(e) => handleHandoverFieldChange('handoverNote', e.target.value)}
                  placeholder={activeBox.handoverStatus === 'abnormal' ? '详细描述异常情况...' : '交接备注信息...'}
                  rows={2}
                  disabled={activeBox.handoverStatus === 'pending'}
                  className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-400 ${
                    activeBox.handoverStatus === 'abnormal' && activeBox.handoverNote.trim() === ''
                      ? 'border-rose-300 bg-rose-50'
                      : 'border-slate-300'
                  }`}
                />
                {activeBox.handoverStatus === 'abnormal' && activeBox.handoverNote.trim() === '' && (
                  <p className="text-xs text-rose-600 mt-1">
                    ⚠ 异常交接必须填写异常说明
                  </p>
                )}
              </div>

              {activeBox.handoverStatus === 'abnormal' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    处理备注
                  </label>
                  <textarea
                    value={activeBox.processNote}
                    onChange={(e) => handleHandoverFieldChange('processNote', e.target.value)}
                    placeholder="处理措施或进展..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>
              )}
            </div>

            {activeBox.handoverRecords && activeBox.handoverRecords.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <History size={14} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">交接历史记录</span>
                  <span className="text-xs text-slate-400">({activeBox.handoverRecords.length} 条)</span>
                </div>
                <div className="space-y-3 max-h-48 overflow-auto">
                  {[...activeBox.handoverRecords].reverse().map((record, index) => (
                    <div
                      key={record.id}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${HANDOVER_COLORS[record.handoverResult]}`}>
                            {HANDOVER_LABELS[record.handoverResult]}
                          </span>
                          {record.batchNumber && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-200 text-slate-700 rounded">
                              <Layers size={10} />
                              {record.batchNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {new Date(record.handoverTime).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <User size={10} className="text-slate-400" />
                          交接: {record.handoverPerson}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCheck size={10} className="text-slate-400" />
                          接收: {record.receiverPerson}
                        </div>
                      </div>
                      {record.abnormalType && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${ABNORMAL_TYPE_COLORS[record.abnormalType]}`}>
                              <AlertOctagon size={8} className="mr-0.5" />
                              {ABNORMAL_TYPE_LABELS[record.abnormalType]}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${PROCESS_STATUS_COLORS[record.processStatus]}`}>
                              {PROCESS_STATUS_LABELS[record.processStatus]}
                            </span>
                          </div>
                          {record.abnormalNote && (
                            <p className="text-xs text-rose-600 mt-1">
                              <AlertTriangle size={10} className="inline mr-1" />
                              {record.abnormalNote}
                            </p>
                          )}
                          {record.processNote && (
                            <p className="text-xs text-slate-500 mt-1">
                              处理: {record.processNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        创建于 {new Date(activeBox.createdAt).toLocaleString('zh-CN')}
        {activeBox.updatedAt !== activeBox.createdAt && (
          <span className="ml-2">
            · 更新于 {new Date(activeBox.updatedAt).toLocaleString('zh-CN')}
          </span>
        )}
      </div>
    </div>
  );
}
