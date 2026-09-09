import { brlSigned } from '../lib/format';
import { cx } from './ui';

export function ValueBadge({
  value,
  size = 'md',
  plain = false,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  plain?: boolean;
}) {
  const tone =
    value > 0 ? 'text-positive' : value < 0 ? 'text-negative' : 'text-muted';
  const bg =
    value > 0
      ? 'bg-positive-soft'
      : value < 0
        ? 'bg-negative-soft'
        : 'bg-surface-2';
  const sizes = {
    sm: 'text-[12px] px-1.5 py-0.5',
    md: 'text-[13px] px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  if (plain) {
    return <span className={cx('tnum font-semibold', tone)}>{brlSigned(value)}</span>;
  }

  return (
    <span
      className={cx(
        'tnum inline-flex items-center rounded-md font-semibold',
        sizes[size],
        bg,
        tone,
      )}
    >
      {brlSigned(value)}
    </span>
  );
}
