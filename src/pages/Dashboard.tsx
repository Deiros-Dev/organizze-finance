import { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  Wallet,
  Target,
  Crosshair,
  Plus,
  ChevronRight,
  CandlestickChart,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { bankrollSeries, computeTotals, groupByMonth } from '../lib/calc';
import { brl, brlSigned, dayMonth, pct, weekday } from '../lib/format';
import { BankrollHero } from '../components/BankrollHero';
import { StatCard } from '../components/StatCard';
import { ValueBadge } from '../components/ValueBadge';
import { OperationDialog } from '../components/EntryDialogs';
import { Button, Card, EmptyState, cx } from '../components/ui';
import { TopBar } from '../components/TopBar';
import type { Operation } from '../types';

export function Dashboard() {
  const operations = useStore((s) => s.operations);
  const aportes = useStore((s) => s.aportes);
  const settings = useStore((s) => s.settings);
  const setView = useStore((s) => s.setView);
  const loadSample = useStore((s) => s.loadSample);
  const status = useStore((s) => s.status);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);

  const totals = useMemo(
    () => computeTotals(operations, aportes, settings.startingBankroll),
    [operations, aportes, settings.startingBankroll],
  );
  const series = useMemo(
    () => bankrollSeries(operations, aportes, settings.startingBankroll),
    [operations, aportes, settings.startingBankroll],
  );

  const currentMonth = useMemo(() => groupByMonth(operations)[0], [operations]);
  const monthNet = currentMonth?.net ?? 0;
  const goal = settings.monthlyGoal;
  const goalPct = goal > 0 ? Math.max(0, Math.min(100, (monthNet / goal) * 100)) : 0;
  const prefix = settings.currencyDisplay === 'code' ? 'BRL' : 'R$';

  const recent = useMemo(
    () =>
      [...operations]
        .sort((a, b) =>
          a.date === b.date
            ? b.createdAt.localeCompare(a.createdAt)
            : b.date.localeCompare(a.date),
        )
        .slice(0, 8),
    [operations],
  );

  const openNew = () => {
    setEditing(null);
    setDialog(true);
  };
  const openEdit = (op: Operation) => {
    setEditing(op);
    setDialog(true);
  };

  const empty =
    status === 'ready' && operations.length === 0 && aportes.length === 0;

  return (
    <>
      <TopBar
        action={
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus size={16} />
            Nova operação
          </Button>
        }
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 sm:px-8">
        <BankrollHero
          bankroll={totals.bankroll}
          todayResult={totals.todayResult}
          totalProfit={totals.totalProfit}
          totalAportes={totals.totalAportes}
          series={series}
          currencyPrefix={prefix}
        />

        {empty && (
          <EmptyState icon={<Wallet size={20} />} title="Sua banca está zerada">
            Adicione seu primeiro aporte e comece a registrar as operações — ou
            <button
              onClick={() => void loadSample()}
              className="mx-1 font-medium text-accent underline-offset-2 hover:underline"
            >
              carregue dados de exemplo
            </button>
            para ver como funciona.
          </EmptyState>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<ArrowDownToLine size={15} />}
            label="Aportes"
            value={brl(totals.totalAportes)}
            sub={`${totals.aporteCount} ${totals.aporteCount === 1 ? 'aporte' : 'aportes'}`}
          />
          <StatCard
            icon={<Wallet size={15} />}
            label="Lucro total"
            value={brlSigned(totals.totalProfit)}
            tone={totals.totalProfit >= 0 ? 'positive' : 'negative'}
            sub={`${totals.opCount} ${totals.opCount === 1 ? 'operação' : 'operações'} · média ${brlSigned(totals.avgDay)}`}
          />
          <StatCard
            icon={<Target size={15} />}
            label="Meta do mês"
            value={brl(goal)}
            sub={
              <span className="tnum">
                {brlSigned(monthNet)} · {pct(goalPct, 0)}
              </span>
            }
          >
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cx(
                  'h-full rounded-full transition-all',
                  monthNet >= 0 ? 'bg-accent' : 'bg-negative',
                )}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </StatCard>
          <StatCard
            icon={<Crosshair size={15} />}
            label="Assertividade"
            value={pct(totals.winRate, 0)}
            sub={`${totals.wins} ${totals.wins === 1 ? 'green' : 'greens'} · ${totals.losses} ${totals.losses === 1 ? 'red' : 'reds'}`}
          />
        </div>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Operações recentes</h2>
            <button
              onClick={() => setView('operacoes')}
              className="inline-flex items-center gap-0.5 text-[13px] font-medium text-accent hover:underline"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="px-4 py-10">
              <EmptyState
                icon={<CandlestickChart size={20} />}
                title="Nenhuma operação registrada"
              >
                Clique em <span className="font-medium text-ink">Nova operação</span> para
                começar.
              </EmptyState>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((op) => (
                <li key={op.id}>
                  <button
                    onClick={() => openEdit(op)}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                  >
                    <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
                      <span className="tnum text-[13px] font-semibold text-ink">
                        {dayMonth(op.date)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium capitalize text-ink">
                        {weekday(op.date)}
                        {op.result > 0 ? ' · green' : op.result < 0 ? ' · red' : ''}
                      </div>
                      {op.note && (
                        <div className="truncate text-[13px] text-muted">{op.note}</div>
                      )}
                    </div>
                    <ValueBadge value={op.result} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <OperationDialog
        open={dialog}
        onClose={() => setDialog(false)}
        editing={editing}
      />
    </>
  );
}
