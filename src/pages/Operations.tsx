import { useMemo, useState } from 'react';
import { Plus, CandlestickChart, Pencil } from 'lucide-react';
import { useStore } from '../lib/store';
import { groupByMonth } from '../lib/calc';
import { brlSigned, dateBR, dayMonth, monthLabel, pct, weekday } from '../lib/format';
import { OperationDialog } from '../components/EntryDialogs';
import { ValueBadge } from '../components/ValueBadge';
import { DailyBars } from '../components/charts';
import { Button, Card, EmptyState } from '../components/ui';
import { TopBar } from '../components/TopBar';
import type { Operation } from '../types';

export function Operations() {
  const operations = useStore((s) => s.operations);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);

  const groups = useMemo(() => groupByMonth(operations), [operations]);

  const open = (op: Operation | null) => {
    setEditing(op);
    setDialog(true);
  };

  return (
    <>
      <TopBar
        action={
          <Button variant="primary" size="sm" onClick={() => open(null)}>
            <Plus size={16} />
            Nova operação
          </Button>
        }
      />
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-6 sm:px-8">
        {groups.length === 0 && (
          <EmptyState
            icon={<CandlestickChart size={20} />}
            title="Nenhuma operação registrada"
          >
            Registre o resultado consolidado de cada dia operado.
          </EmptyState>
        )}

        {groups.map((g) => {
          const bars = [...g.operations]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((o) => ({ label: dayMonth(o.date), value: o.result }));
          return (
            <Card key={g.key} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <div>
                  <h2 className="text-sm font-semibold capitalize text-ink">
                    {monthLabel(g.key)}
                  </h2>
                  <p className="text-[13px] text-muted">
                    {g.operations.length}{' '}
                    {g.operations.length === 1 ? 'operação' : 'operações'} ·{' '}
                    {g.wins}G / {g.losses}R · {pct(g.winRate, 0)} acerto
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-faint">
                    Resultado
                  </div>
                  <ValueBadge value={g.net} size="lg" />
                </div>
              </div>

              {bars.length > 1 && (
                <div className="border-b border-line px-4 py-4">
                  <DailyBars data={bars} />
                </div>
              )}

              <ul className="divide-y divide-line">
                {g.operations.map((op) => (
                  <li key={op.id}>
                    <button
                      onClick={() => open(op)}
                      className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-surface-2"
                    >
                      <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-2">
                        <span className="tnum text-[13px] font-semibold text-ink">
                          {dayMonth(op.date)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium capitalize text-ink">
                          {weekday(op.date)} · {dateBR(op.date)}
                        </div>
                        {op.note && (
                          <div className="truncate text-[13px] text-muted">
                            {op.note}
                          </div>
                        )}
                      </div>
                      <Pencil
                        size={14}
                        className="text-faint opacity-0 transition-opacity group-hover:opacity-100"
                      />
                      <ValueBadge value={op.result} />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <OperationDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />
    </>
  );
}
