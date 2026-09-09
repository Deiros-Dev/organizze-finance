import type { ReactNode } from 'react';
import { Card, cx } from './ui';

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'default',
  children,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'positive' | 'negative';
  children?: ReactNode;
}) {
  const valueTone =
    tone === 'positive'
      ? 'text-positive'
      : tone === 'negative'
        ? 'text-negative'
        : 'text-ink';
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 text-faint">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className={cx('tnum text-2xl font-semibold', valueTone)}>{value}</div>
      {sub && <div className="text-[13px] text-muted">{sub}</div>}
      {children}
    </Card>
  );
}
