import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import type { BoxStatus } from '@/types';

interface StatusBadgeProps {
  status: BoxStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${STATUS_COLORS[status]} ${sizeClasses} transition-colors duration-200`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
