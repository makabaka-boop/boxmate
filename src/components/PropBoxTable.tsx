import { CheckSquare, Square, AlertTriangle, ArrowRightLeft, Layers, UserCheck, User, AlertOctagon } from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { StatusBadge } from './StatusBadge';
import { RiskBadge } from './RiskBadge';
import { HANDOVER_LABELS, HANDOVER_COLORS, ABNORMAL_TYPE_LABELS, ABNORMAL_TYPE_COLORS, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from '@/types';
import type { PropBox } from '@/types';
import { useMemo } from 'react';

interface PropBoxTableProps {
  highlightedBoxIds?: string[];
}

export function PropBoxTable({ highlightedBoxIds = [] }: PropBoxTableProps) {
  const {
    boxes,
    filters,
    selectedBoxIds,
    activeBoxId,
    alerts,
    toggleBoxSelection,
    setActiveBox,
  } = usePropStore();

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

  const alertBoxIds = useMemo(() => {
    const ids = new Set<string>();
    alerts.forEach((a) => a.affectedBoxIds.forEach((id) => ids.add(id)));
    return ids;
  }, [alerts]);

  const isHighlighted = (box: PropBox) => highlightedBoxIds.includes(box.id);
  const hasAlert = (box: PropBox) => alertBoxIds.has(box.id);

  const getRowClass = (box: PropBox, index: number) => {
    const isSelected = selectedBoxIds.includes(box.id);
    const isActive = activeBoxId === box.id;
    const isHL = isHighlighted(box);

    const bgClass = isHL
      ? 'bg-amber-200'
      : isSelected
        ? 'bg-primary-100'
        : index % 2 === 0
          ? 'bg-white'
          : 'bg-slate-50';

    const ringClass = isActive ? 'ring-2 ring-primary-500 ring-inset' : '';
    const pulseClass = isHL ? 'animate-pulse' : '';
    const hoverClass = !isHL && !isSelected ? 'hover:bg-primary-50/50' : '';

    return `transition-all duration-150 cursor-pointer ${bgClass} ${ringClass} ${pulseClass} ${hoverClass}`;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-t-lg border border-slate-200 overflow-hidden">
      <div className="overflow-auto flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-10">
                <span className="sr-only">选择</span>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-24">
                箱号
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700">
                内容摘要
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-24">
                上场场次
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-28">
                状态
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-24">
                风险等级
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-24">
                责任人
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-28">
                交接状态
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-64">
                交接摘要
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-slate-700 w-12">
                <span className="sr-only">告警</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBoxes.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                  暂无道具箱记录，点击「新增道具箱」添加
                </td>
              </tr>
            ) : (
              filteredBoxes.map((box, index) => (
                <tr
                  key={box.id}
                  className={getRowClass(box, index)}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.select-checkbox')) return;
                    setActiveBox(box.id);
                  }}
                >
                  <td className="px-3 py-2">
                    <button
                      className="select-checkbox p-0.5 rounded hover:bg-slate-200 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBoxSelection(box.id);
                      }}
                    >
                      {selectedBoxIds.includes(box.id) ? (
                        <CheckSquare size={16} className="text-primary-600" />
                      ) : (
                        <Square size={16} className="text-slate-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono font-semibold text-slate-800">
                      {box.boxNumber || <span className="text-slate-400">未设置</span>}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="max-w-xs truncate" title={box.contentSummary}>
                      {box.contentSummary || <span className="text-slate-400">未填写</span>}
                    </div>
                    {box.fragileNote && (
                      <div
                        className="text-xs text-amber-600 mt-0.5 truncate max-w-xs"
                        title={box.fragileNote}
                      >
                        ⚠ {box.fragileNote}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-slate-600">{box.scene}</span>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={box.status} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <RiskBadge level={box.riskLevel} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-slate-700">{box.responsiblePerson}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border ${HANDOVER_COLORS[box.handoverStatus]}`}>
                      <ArrowRightLeft size={10} />
                      {HANDOVER_LABELS[box.handoverStatus]}
                    </span>
                    {box.handoverStatus === 'abnormal' && (
                      <div className="text-xs text-rose-500 mt-0.5 truncate max-w-[100px]" title={box.handoverNote}>
                        {box.handoverNote}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {box.handoverStatus === 'pending' ? (
                      <span className="text-xs text-slate-400">暂未交接</span>
                    ) : (
                      <div className="space-y-1">
                        {box.batchNumber && (
                          <div className="flex items-center gap-1 text-xs text-slate-600">
                            <Layers size={10} className="text-slate-400" />
                            <span className="truncate max-w-[120px]" title={box.batchNumber}>
                              {box.batchNumber}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <User size={10} className="text-slate-400" />
                          <span className="truncate" title={`交接: ${box.handoverPerson}`}>
                            {box.handoverPerson}
                          </span>
                          <span className="text-slate-400">→</span>
                          <UserCheck size={10} className="text-slate-400" />
                          <span className="truncate" title={`接收: ${box.receiverPerson}`}>
                            {box.receiverPerson}
                          </span>
                        </div>
                        {box.abnormalType && (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${ABNORMAL_TYPE_COLORS[box.abnormalType]}`}>
                              <AlertOctagon size={8} className="mr-0.5" />
                              {ABNORMAL_TYPE_LABELS[box.abnormalType]}
                            </span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${PROCESS_STATUS_COLORS[box.processStatus]}`}>
                              {PROCESS_STATUS_LABELS[box.processStatus]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {hasAlert(box) && (
                      <AlertTriangle size={16} className="text-amber-500 animate-pulse" />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        共 {filteredBoxes.length} 条记录
        {filteredBoxes.length !== boxes.length && `（全部 ${boxes.length} 条）`}
      </div>
    </div>
  );
}
