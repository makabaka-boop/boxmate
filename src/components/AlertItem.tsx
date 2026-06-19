import { AlertTriangle, XCircle, AlertOctagon } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertItemProps {
  alert: Alert;
  onAffectedBoxClick?: (boxIds: string[]) => void;
}

export function AlertItem({ alert, onAffectedBoxClick }: AlertItemProps) {
  const isError = alert.severity === 'error';
  const Icon = isError ? XCircle : AlertTriangle;
  const bgColor = isError
    ? 'bg-rose-50 border-rose-200 hover:bg-rose-100'
    : 'bg-amber-50 border-amber-200 hover:bg-amber-100';
  const textColor = isError ? 'text-rose-700' : 'text-amber-700';
  const iconColor = isError ? 'text-rose-500' : 'text-amber-500';

  return (
    <div
      className={`p-3 rounded-lg border ${bgColor} transition-all duration-200 animate-slide-up cursor-pointer group`}
      onClick={() => onAffectedBoxClick?.(alert.affectedBoxIds)}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={`mt-0.5 flex-shrink-0 ${iconColor}`} size={18} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${textColor}`}>{alert.message}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            影响 {alert.affectedBoxIds.length} 个箱子 · 点击定位
          </p>
        </div>
        {isError && (
          <AlertOctagon
            size={14}
            className="text-rose-400 animate-pulse flex-shrink-0"
          />
        )}
      </div>
    </div>
  );
}
