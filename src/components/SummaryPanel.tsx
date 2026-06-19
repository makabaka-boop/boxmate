import { Package, AlertTriangle, CheckCircle, Clock, Search, Users, ArrowRightLeft, Layers, AlertOctagon, ChevronRight, UserCheck } from 'lucide-react';
import { usePropStore } from '@/store/usePropStore';
import { AlertItem } from './AlertItem';
import type { BoxStatus, PropBox } from '@/types';
import { ABNORMAL_TYPE_LABELS, ABNORMAL_TYPE_COLORS, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS } from '@/types';
import { useMemo } from 'react';

interface SummaryPanelProps {
  onAffectedBoxClick?: (boxIds: string[]) => void;
}

const STATUS_ICONS: Record<BoxStatus, typeof Package> = {
  pending_pack: Package,
  pending_return: Clock,
  missing_investigate: Search,
  ready_seal: CheckCircle,
};

const STATUS_LABELS_SHORT: Record<BoxStatus, string> = {
  pending_pack: '待装箱',
  pending_return: '待返场',
  missing_investigate: '缺件待查',
  ready_seal: '可封箱',
};

const STATUS_COLORS_SUMMARY: Record<BoxStatus, string> = {
  pending_pack: 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
  pending_return: 'from-blue-50 to-blue-100 text-blue-700 border-blue-200',
  missing_investigate: 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
  ready_seal: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
};

export function SummaryPanel({ onAffectedBoxClick }: SummaryPanelProps) {
  const { boxes, alerts } = usePropStore();

  const statusCounts = useMemo(() => {
    const counts: Record<BoxStatus, number> = {
      pending_pack: 0,
      pending_return: 0,
      missing_investigate: 0,
      ready_seal: 0,
    };
    boxes.forEach((b) => {
      counts[b.status]++;
    });
    return counts;
  }, [boxes]);

  const personLoads = useMemo(() => {
    const loads = new Map<string, number>();
    boxes.forEach((b) => {
      loads.set(b.responsiblePerson, (loads.get(b.responsiblePerson) || 0) + 1);
    });
    return Array.from(loads.entries()).sort((a, b) => b[1] - a[1]);
  }, [boxes]);

  const maxLoad = Math.max(...personLoads.map(([, count]) => count), 1);

  const stats = useMemo(
    () => [
      { label: '总箱数', value: boxes.length, icon: Package, color: 'text-slate-700' },
      {
        label: '高风险箱',
        value: boxes.filter((b) => b.riskLevel === 'high').length,
        icon: AlertTriangle,
        color: 'text-rose-600',
      },
      {
        label: '需返场',
        value: boxes.filter((b) => b.needsReturn).length,
        icon: Clock,
        color: 'text-blue-600',
      },
      {
        label: '已核对',
        value: boxes.filter((b) => b.isChecked).length,
        icon: CheckCircle,
        color: 'text-emerald-600',
      },
      {
        label: '已交接',
        value: boxes.filter((b) => b.handoverStatus === 'completed').length,
        icon: ArrowRightLeft,
        color: 'text-teal-600',
      },
      {
        label: '异常交接',
        value: boxes.filter((b) => b.handoverStatus === 'abnormal').length,
        icon: AlertTriangle,
        color: 'text-rose-600',
      },
    ],
    [boxes]
  );

  const totalBoxes = boxes.length || 1;
  const readyPercent = Math.round((statusCounts.ready_seal / totalBoxes) * 100);

  const handoverStats = useMemo(() => {
    const returnBoxes = boxes.filter((b) => b.needsReturn);
    const total = returnBoxes.length || 1;
    const completed = returnBoxes.filter((b) => b.handoverStatus === 'completed').length;
    const abnormal = returnBoxes.filter((b) => b.handoverStatus === 'abnormal').length;
    const pending = returnBoxes.filter((b) => b.handoverStatus === 'pending').length;
    const completedPercent = Math.round((completed / total) * 100);
    return { total: returnBoxes.length, completed, abnormal, pending, completedPercent };
  }, [boxes]);

  const pendingAbnormalBoxes = useMemo(() => {
    return boxes
      .filter((b) => b.needsReturn && b.handoverStatus === 'abnormal')
      .sort((a, b) => {
        const priority = { pending: 0, in_progress: 1, resolved: 2 };
        return (priority[a.processStatus as keyof typeof priority] || 0) - (priority[b.processStatus as keyof typeof priority] || 0);
      });
  }, [boxes]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-lg border border-slate-200 p-3 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={16} className={stat.color} />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(STATUS_LABELS_SHORT) as BoxStatus[]).map((status, i) => {
          const Icon = STATUS_ICONS[status];
          const count = statusCounts[status];
          return (
            <div
              key={status}
              className={`bg-gradient-to-br ${STATUS_COLORS_SUMMARY[status]} rounded-lg border p-3 animate-slide-up`}
              style={{ animationDelay: `${(i + 4) * 50}ms` }}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} />
                <span className="text-xs font-medium">{STATUS_LABELS_SHORT[status]}</span>
              </div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">整体进度</span>
          <span className="text-sm font-bold text-emerald-600">{readyPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${readyPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {statusCounts.ready_seal} / {totalBoxes} 箱可封箱
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3 animate-slide-up" style={{ animationDelay: '425ms' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft size={16} className="text-teal-600" />
            <span className="text-sm font-medium text-slate-700">交接进度</span>
          </div>
          <span className="text-sm font-bold text-teal-600">{handoverStats.completedPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${handoverStats.completedPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-teal-50 rounded px-2 py-1">
            <div className="font-bold text-teal-700">{handoverStats.completed}</div>
            <div className="text-slate-500">已交接</div>
          </div>
          <div className="bg-slate-50 rounded px-2 py-1">
            <div className="font-bold text-slate-600">{handoverStats.pending}</div>
            <div className="text-slate-500">待交接</div>
          </div>
          <div className={`rounded px-2 py-1 ${handoverStats.abnormal > 0 ? 'bg-rose-50' : 'bg-slate-50'}`}>
            <div className={`font-bold ${handoverStats.abnormal > 0 ? 'text-rose-700' : 'text-slate-600'}`}>{handoverStats.abnormal}</div>
            <div className="text-slate-500">异常</div>
          </div>
        </div>
        {handoverStats.abnormal > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 rounded px-2 py-1.5 border border-rose-200">
            <AlertTriangle size={14} />
            存在 {handoverStats.abnormal} 项异常交接，请及时处理
          </div>
        )}
      </div>

      {pendingAbnormalBoxes.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden animate-slide-up" style={{ animationDelay: '440ms' }}>
          <div className="px-3 py-2 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-500" />
              <span className="text-sm font-medium text-slate-700">待处理异常交接</span>
            </div>
            <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
              {pendingAbnormalBoxes.length}
            </span>
          </div>
          <div className="max-h-48 overflow-auto">
            {pendingAbnormalBoxes.map((box, i) => (
              <div
                key={box.id}
                className="p-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition-colors group"
                onClick={() => onAffectedBoxClick && onAffectedBoxClick([box.id])}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-sm text-slate-800">{box.boxNumber}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${box.abnormalType ? ABNORMAL_TYPE_COLORS[box.abnormalType as keyof typeof ABNORMAL_TYPE_COLORS] : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {box.abnormalType ? ABNORMAL_TYPE_LABELS[box.abnormalType as keyof typeof ABNORMAL_TYPE_LABELS] : '未标记'}
                    </span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${PROCESS_STATUS_COLORS[box.processStatus as keyof typeof PROCESS_STATUS_COLORS] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {PROCESS_STATUS_LABELS[box.processStatus as keyof typeof PROCESS_STATUS_LABELS] || '待处理'}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <div className="text-xs text-slate-600 mb-1 truncate">{box.contentSummary}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  {box.handoverPerson && (
                    <span className="flex items-center gap-1">
                      <UserCheck size={10} />
                      {box.handoverPerson} → {box.receiverPerson || '未知'}
                    </span>
                  )}
                  {box.batchNumber && (
                    <span className="flex items-center gap-1">
                      <Layers size={10} />
                      {box.batchNumber}
                    </span>
                  )}
                </div>
                {box.handoverNote && (
                  <div className="mt-2 p-2 bg-rose-50 rounded text-[11px] text-rose-700 border border-rose-100">
                    {box.handoverNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-3 animate-slide-up" style={{ animationDelay: '460ms' }}>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-slate-600" />
          <span className="text-sm font-medium text-slate-700">责任人负载</span>
        </div>
        <div className="space-y-2">
          {personLoads.map(([person, count], i) => (
            <div key={person} className="flex items-center gap-2">
              <span className="text-xs text-slate-600 w-16 truncate">{person}</span>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    count === maxLoad && maxLoad > 3
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : 'bg-gradient-to-r from-primary-400 to-primary-600'
                  }`}
                  style={{ width: `${(count / maxLoad) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-700 w-6 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-lg border border-slate-200 overflow-hidden animate-slide-up" style={{ animationDelay: '500ms' }}>
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm font-medium text-slate-700">自动检查告警</span>
          </div>
          {alerts.length > 0 && (
            <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-medium">
              {alerts.length}
            </span>
          )}
        </div>
        <div className="overflow-auto p-2 space-y-2 h-[calc(100%-41px)]">
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">
              <CheckCircle size={24} className="mx-auto mb-2 text-emerald-400" />
              暂无告警，一切正常
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAffectedBoxClick={onAffectedBoxClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
