import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import type { SeriesPoint } from '../lib/calc';
import { brl, brlSigned, pctSigned } from '../lib/format';
import { AreaChart } from './charts';
import { cx } from './ui';

export function BankrollHero({
  bankroll,
  todayResult,
  totalProfit,
  totalAportes,
  series,
  currencyPrefix,
}: {
  bankroll: number;
  todayResult: number;
  totalProfit: number;
  totalAportes: number;
  series: SeriesPoint[];
  currencyPrefix: string;
}) {
  const [intPart, decPart] = brl(bankroll, '')
    .trim()
    .split(',');
  const roi = totalAportes > 0 ? (totalProfit / totalAportes) * 100 : 0;
  const Icon =
    todayResult > 0 ? ArrowUpRight : todayResult < 0 ? ArrowDownRight : Minus;
  const todayTone =
    todayResult > 0
      ? 'text-positive bg-positive-soft'
      : todayResult < 0
        ? 'text-negative bg-negative-soft'
        : 'text-muted bg-surface-2';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-elevated shadow-card">
      {/* brilho radial */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-30%] h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, var(--accent-soft) 0%, transparent 68%)',
        }}
      />
      <div className="grid-surface absolute inset-0 opacity-40" aria-hidden />

      <div className="relative flex flex-col items-center px-6 pb-0 pt-10 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-faint">
          Banca total
        </span>

        <div className="mt-3 flex items-start justify-center gap-1.5">
          <span className="mt-2 text-xl font-medium text-muted sm:mt-3 sm:text-2xl">
            {currencyPrefix}
          </span>
          <span className="tnum text-[44px] font-semibold leading-none tracking-tight text-ink sm:text-[64px]">
            {intPart}
            <span className="text-faint">,{decPart}</span>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span
            className={cx(
              'tnum inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold',
              todayTone,
            )}
          >
            <Icon size={14} strokeWidth={2.6} />
            {brlSigned(todayResult)} hoje
          </span>
          <span className="tnum inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[13px] font-medium text-muted">
            Lucro {brlSigned(totalProfit)}
          </span>
          <span
            className={cx(
              'tnum inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-[13px] font-medium',
              roi >= 0 ? 'text-positive' : 'text-negative',
            )}
          >
            ROI {pctSigned(roi)}
          </span>
        </div>

        <div className="mt-6 w-[calc(100%+3rem)] -mb-px">
          <AreaChart data={series.map((s) => s.value)} height={120} />
        </div>
      </div>
    </section>
  );
}
