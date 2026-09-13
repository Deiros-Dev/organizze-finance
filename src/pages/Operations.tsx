import { useMemo, useState } from 'react';
import {
  Plus,
  CandlestickChart,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { groupByMonth } from '../lib/calc';
import {
  brlSigned,
  dayMonth,
  monthAbbrev,
  monthLabel,
  parseISO,
  pct,
  todayISO,
  weekdayFull,
} from '../lib/format';
import { OperationDialog } from '../components/EntryDialogs';
import { ValueBadge } from '../components/ValueBadge';
import { PhotoLightbox, PhotoStrip } from '../components/Photos';
import { DailyBars } from '../components/charts';
import { Button, Card, EmptyState, cx } from '../components/ui';
import { TopBar } from '../components/TopBar';
import type { Operation } from '../types';

type LightboxState = { photos: string[]; index: number };

export function Operations() {
  const operations = useStore((s) => s.operations);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Operation | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

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
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-5 py-6 sm:px-8">
        {groups.length === 0 && (
          <EmptyState
            icon={<CandlestickChart size={20} />}
            title="Nenhuma operação registrada"
          >
            Registre o resultado consolidado de cada dia operado — dá pra anexar os
            prints das entradas também.
          </EmptyState>
        )}

        {groups.map((g) => {
          const bars = [...g.operations]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((o) => ({ label: dayMonth(o.date), value: o.result }));
          return (
            <section key={g.key} className="flex flex-col gap-3">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
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
                  <div className="border-t border-line px-4 py-4">
                    <DailyBars data={bars} />
                  </div>
                )}
              </Card>

              <div className="flex flex-col gap-2.5">
                {g.operations.map((op) => (
                  <DayCard
                    key={op.id}
                    op={op}
                    onEdit={() => open(op)}
                    onOpenPhoto={(index) => setLightbox({ photos: op.photos, index })}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <OperationDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />

      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) => setLightbox((s) => (s ? { ...s, index } : s))}
        />
      )}
    </>
  );
}

function DayCard({
  op,
  onEdit,
  onOpenPhoto,
}: {
  op: Operation;
  onEdit: () => void;
  onOpenPhoto: (index: number) => void;
}) {
  const isToday = op.date === todayISO();
  const win = op.result > 0;
  const loss = op.result < 0;
  const Icon = win ? ArrowUpRight : loss ? ArrowDownRight : Minus;

  return (
    <button
      onClick={onEdit}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 text-left shadow-card transition-colors hover:bg-surface-2 sm:gap-4 sm:px-4"
    >
      <div
        className={cx(
          'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border sm:h-14 sm:w-14',
          win && 'border-positive/25 bg-positive-soft',
          loss && 'border-negative/25 bg-negative-soft',
          !win && !loss && 'border-line bg-surface-2',
        )}
      >
        <span className="tnum text-base font-bold leading-none text-ink sm:text-lg">
          {parseISO(op.date).getDate()}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase text-faint">
          {monthAbbrev(op.date)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium capitalize text-ink">
            {weekdayFull(op.date)}
          </span>
          {isToday && (
            <span className="shrink-0 rounded-full bg-accent-soft px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-wide text-accent">
              Hoje
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[13px] text-muted">
          {op.note || (win ? 'Operação positiva' : 'Operação negativa')}
        </p>
      </div>

      <PhotoStrip photos={op.photos} onOpen={onOpenPhoto} size={38} />

      <div
        className={cx(
          'flex shrink-0 items-center gap-1 tnum text-base font-bold sm:text-lg',
          win && 'text-positive',
          loss && 'text-negative',
        )}
      >
        <Icon size={16} strokeWidth={2.6} className="hidden sm:block" />
        {brlSigned(op.result)}
      </div>

      <Pencil
        size={14}
        className="hidden shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100 md:block"
      />
    </button>
  );
}
