import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { RISK_LABELS, RISK_COLORS } from '@/types';
import type { RiskLevel } from '@/types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, size = 'md' }: RiskBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 12 : 14;

  const Icon =
    level === 'high' ? ShieldAlert : level === 'medium' ? AlertTriangle : Shield;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${RISK_COLORS[level]} ${sizeClasses} transition-colors duration-200`}
    >
      <Icon size={iconSize} />
      {RISK_LABELS[level]}
    </span>
  );
}
