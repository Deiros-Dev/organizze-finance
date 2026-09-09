import { useMemo } from 'react';
import {
  Wallet,
  RotateCcw,
  TriangleAlert,
  CalendarDays,
  CircleDollarSign,
  Percent,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { computeTotals, project } from '../lib/calc';
import { brl, brlSigned, pct, pctSigned } from '../lib/format';
import { AreaChart, BarChart } from '../components/charts';
import { Button, Card, Slider, Toggle, cx } from '../components/ui';
import { TopBar } from '../components/TopBar';

export function Projection() {
  const p = useStore((s) => s.projection);
  const setProjection = useStore((s) => s.setProjection);
  const resetProjection = useStore((s) => s.resetProjection);
  const operations = useStore((s) => s.operations);
  const aportes = useStore((s) => s.aportes);
  const startingBankroll = useStore((s) => s.settings.startingBankroll);

  const totals = useMemo(
    () => computeTotals(operations, aportes, startingBankroll),
    [operations, aportes, startingBankroll],
  );
  const r = useMemo(() => project(p), [p]);

  const belowBreakEven = p.winRate < r.breakEvenWinRate;

  return (
    <>
      <TopBar
        action={
          <Button variant="ghost" size="sm" onClick={resetProjection}>
            <RotateCcw size={15} />
            Restaurar
          </Button>
        }
      />

      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[340px_1fr]">
        {/* -------- parâmetros -------- */}
        <Card className="flex h-fit flex-col gap-5 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Parâmetros</h2>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-faint">
                Banca
              </span>
              <span className="tnum text-sm font-semibold text-ink">
                {brl(p.bankroll)}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={500000}
              step={1000}
              value={p.bankroll}
              onChange={(e) => setProjection({ bankroll: Number(e.target.value) })}
            />
            <button
              onClick={() =>
                setProjection({ bankroll: Math.round(totals.bankroll) || 1000 })
              }
              className="mt-1 self-start text-[12px] font-medium text-accent hover:underline"
            >
              usar banca atual ({brl(totals.bankroll)})
            </button>
          </div>

          <Slider
            label="Risco por entrada"
            value={p.riskPerOp}
            min={0.5}
            max={10}
            step={0.5}
            suffix="%"
            onChange={(v) => setProjection({ riskPerOp: v })}
          />
          <Slider
            label="Operações por mês"
            value={p.opsPerMonth}
            min={20}
            max={600}
            step={10}
            onChange={(v) => setProjection({ opsPerMonth: v })}
          />
          <Slider
            label="Assertividade"
            value={p.winRate}
            min={40}
            max={90}
            step={1}
            suffix="%"
            onChange={(v) => setProjection({ winRate: v })}
          />
          <Slider
            label="Payout"
            value={p.payout}
            min={50}
            max={100}
            step={1}
            suffix="%"
            onChange={(v) => setProjection({ payout: v })}
          />
          <Slider
            label="Dias operados no mês"
            value={p.tradingDays}
            min={10}
            max={26}
            step={1}
            onChange={(v) => setProjection({ tradingDays: v })}
          />

          <div className="flex items-center justify-between border-t border-line pt-4">
            <div>
              <div className="text-sm font-medium text-ink">Juros compostos</div>
              <div className="text-xs text-faint">Reinveste o lucro no mês</div>
            </div>
            <Toggle
              checked={p.compound}
              onChange={(v) => setProjection({ compound: v })}
            />
          </div>
        </Card>

        {/* -------- resultado -------- */}
        <div className="flex flex-col gap-5">
          {belowBreakEven && (
            <div className="flex items-start gap-3 rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
              <TriangleAlert size={17} className="mt-0.5 shrink-0" />
              <p>
                Com payout de {pct(p.payout, 0)}, o ponto de equilíbrio é{' '}
                <strong>{pct(r.breakEvenWinRate)}</strong> de acerto. Abaixo disso a
                projeção é de <strong>prejuízo</strong> no longo prazo.
              </p>
            </div>
          )}

          <Card className="relative overflow-hidden p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute right-[-10%] top-[-60%] h-72 w-72 rounded-full opacity-70 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)',
              }}
            />
            <div className="relative grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-faint">
                  Lucro mensal projetado
                </div>
                <div
                  className={cx(
                    'tnum mt-1 text-4xl font-semibold',
                    r.monthlyProfit >= 0 ? 'text-ink' : 'text-negative',
                  )}
                >
                  {brlSigned(r.monthlyProfit)}
                </div>
                <div className="tnum mt-1 text-[13px] text-muted">
                  ROI {pctSigned(r.monthlyRoi)} sobre a banca
                </div>
              </div>
              <div className="sm:border-l sm:border-line sm:pl-6">
                <div className="text-xs font-medium uppercase tracking-wide text-faint">
                  Lucro diário médio
                </div>
                <div
                  className={cx(
                    'tnum mt-1 text-4xl font-semibold',
                    r.dailyProfit >= 0 ? 'text-ink' : 'text-negative',
                  )}
                >
                  {brlSigned(r.dailyProfit)}
                </div>
                <div className="tnum mt-1 text-[13px] text-muted">
                  ~{Math.round(p.opsPerMonth / p.tradingDays)} entradas/dia
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Mini
              icon={<CircleDollarSign size={15} />}
              label="Valor por entrada"
              value={brl(r.stake)}
              sub={`${pct(p.riskPerOp)} da banca`}
            />
            <Mini
              icon={<Wallet size={15} />}
              label="Banca no fim do mês"
              value={brl(r.endBankroll)}
              sub={p.compound ? 'com juros compostos' : 'sem reinvestir'}
            />
            <Mini
              icon={<Percent size={15} />}
              label="Ponto de equilíbrio"
              value={pct(r.breakEvenWinRate)}
              sub="acerto mínimo p/ lucro"
            />
          </div>

          <Card className="p-5">
            <div className="mb-1 flex items-center gap-2">
              <CalendarDays size={15} className="text-faint" />
              <h3 className="text-sm font-semibold text-ink">Evolução da banca no mês</h3>
            </div>
            <p className="mb-4 text-[13px] text-muted">
              De {brl(p.bankroll)} a{' '}
              <span className="font-medium text-ink">{brl(r.endBankroll)}</span> ao longo
              de {p.tradingDays} pregões.
            </p>
            <AreaChart data={r.curve} height={160} />
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ink">
              Lucro mensal por assertividade
            </h3>
            <p className="mb-4 text-[13px] text-muted">
              Como o resultado muda se o seu acerto variar.
            </p>
            <BarChart
              height={150}
              format={(v) => brlCompactLocal(v)}
              data={r.scenarios.map((s) => ({
                label: `${s.winRate}%`,
                value: s.monthlyProfit,
                highlight: s.current,
              }))}
            />
          </Card>

          <p className="px-1 text-[12px] leading-relaxed text-faint">
            Projeção estatística baseada em valor esperado. Opções binárias e day trade
            envolvem risco real de perda; sequências negativas acontecem mesmo com
            estatística positiva. Use como referência de planejamento, não como garantia
            de retorno.
          </p>
        </div>
      </div>
    </>
  );
}

function Mini({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-faint">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2">
          {icon}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="tnum text-xl font-semibold text-ink">{value}</div>
      <div className="text-[12px] text-faint">{sub}</div>
    </Card>
  );
}

function brlCompactLocal(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000)
    return `${sign}${(abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return `${sign}${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
