import clsx from 'clsx';
import { RiskLevel } from '@shared/types';

interface MetricBadgeProps {
  label: string;
  value: string | number;
  riskLevel?: RiskLevel;
  className?: string;
}

export function MetricBadge({ label, value, riskLevel, className }: MetricBadgeProps) {
  const getRiskColors = (risk?: RiskLevel) => {
    switch (risk) {
      case RiskLevel.Low:
        return 'bg-status-success/10 text-status-success border-status-success/20';
      case RiskLevel.Medium:
        return 'bg-status-warning/10 text-status-warning border-status-warning/20';
      case RiskLevel.High:
        return 'bg-status-error/10 text-status-error border-status-error/20';
      case RiskLevel.Critical:
        return 'bg-status-error text-bg-primary border-status-error';
      default:
        return 'bg-bg-tertiary text-fg-primary border-border-light';
    }
  };

  return (
    <div className={clsx(
      'flex flex-col items-center justify-center p-2 rounded border',
      getRiskColors(riskLevel),
      className
    )}>
      <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-mono font-bold mt-1">{value}</span>
    </div>
  );
}

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const getColors = () => {
    switch (level) {
      case RiskLevel.Low: return 'bg-status-success/10 text-status-success border-status-success/20';
      case RiskLevel.Medium: return 'bg-status-warning/10 text-status-warning border-status-warning/20';
      case RiskLevel.High: return 'bg-status-error/10 text-status-error border-status-error/20';
      case RiskLevel.Critical: return 'bg-status-error/20 text-status-error border-status-error/50';
    }
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium border', getColors())}>
      {level.toUpperCase()}
    </span>
  );
}
