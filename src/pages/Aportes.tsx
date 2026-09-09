import { useMemo, useState } from 'react';
import { Plus, ArrowDownToLine, Pencil } from 'lucide-react';
import { useStore } from '../lib/store';
import { brl, dateBR, weekday } from '../lib/format';
import { AporteDialog } from '../components/EntryDialogs';
import { Button, Card, EmptyState } from '../components/ui';
import { TopBar } from '../components/TopBar';
import type { Aporte } from '../types';

export function Aportes() {
  const aportes = useStore((s) => s.aportes);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Aporte | null>(null);

  const sorted = useMemo(
    () => [...aportes].sort((a, b) => b.date.localeCompare(a.date)),
    [aportes],
  );
  const total = useMemo(() => aportes.reduce((s, a) => s + a.amount, 0), [aportes]);

  const open = (a: Aporte | null) => {
    setEditing(a);
    setDialog(true);
  };

  return (
    <>
      <TopBar
        action={
          <Button variant="primary" size="sm" onClick={() => open(null)}>
            <Plus size={16} />
            Novo aporte
          </Button>
        }
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-6 sm:px-8">
        <Card className="flex items-center justify-between p-5">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-faint">
              Total aportado
            </div>
            <div className="tnum mt-1 text-3xl font-semibold text-ink">{brl(total)}</div>
          </div>
          <div className="text-right text-[13px] text-muted">
            {aportes.length} {aportes.length === 1 ? 'aporte' : 'aportes'}
          </div>
        </Card>

        {sorted.length === 0 ? (
          <EmptyState icon={<ArrowDownToLine size={20} />} title="Nenhum aporte ainda">
            O valor da banca é a soma dos aportes com o lucro das operações.
          </EmptyState>
        ) : (
          <Card className="overflow-hidden">
            <ol className="relative divide-y divide-line">
              {sorted.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => open(a)}
                    className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <ArrowDownToLine size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium capitalize text-ink">
                        {weekday(a.date)} · {dateBR(a.date)}
                      </div>
                      {a.note && (
                        <div className="truncate text-[13px] text-muted">{a.note}</div>
                      )}
                    </div>
                    <Pencil
                      size={14}
                      className="text-faint opacity-0 transition-opacity group-hover:opacity-100"
                    />
                    <span className="tnum text-sm font-semibold text-ink">
                      {brl(a.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>

      <AporteDialog open={dialog} onClose={() => setDialog(false)} editing={editing} />
    </>
  );
}
