import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Trash2, TriangleAlert } from 'lucide-react';
import type { Aporte, Operation } from '../types';
import { useStore } from '../lib/store';
import { todayISO } from '../lib/format';
import { Button, Dialog, Field, Input, Segmented } from './ui';

/** número -> "1.234,56" para preencher o input */
const toInput = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1.234,56" ou "1234.56" -> number */
const fromInput = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

function ErrorNote({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3 py-2 text-[13px] text-negative">
      <TriangleAlert size={15} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

/* ----------------------------- Operação ----------------------------- */

export function OperationDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Operation | null;
}) {
  const addOperation = useStore((s) => s.addOperation);
  const updateOperation = useStore((s) => s.updateOperation);
  const removeOperation = useStore((s) => s.removeOperation);

  const [date, setDate] = useState(todayISO());
  const [kind, setKind] = useState<'win' | 'loss'>('win');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setErr(null);
    if (editing) {
      setDate(editing.date);
      setKind(editing.result < 0 ? 'loss' : 'win');
      setAmount(toInput(Math.abs(editing.result)));
      setNote(editing.note ?? '');
    } else {
      setDate(todayISO());
      setKind('win');
      setAmount('');
      setNote('');
    }
  }, [open, editing]);

  const parsed = fromInput(amount);
  const valid = Number.isFinite(parsed) && parsed > 0 && !!date;

  const submit = async () => {
    if (!valid || busy) return;
    const result = kind === 'loss' ? -Math.abs(parsed) : Math.abs(parsed);
    setBusy(true);
    setErr(null);
    const error = editing
      ? await updateOperation(editing.id, { date, result, note: note.trim() })
      : await addOperation({ date, result, note: note.trim() });
    setBusy(false);
    if (error) setErr(error);
    else onClose();
  };

  const remove = async () => {
    if (!editing || busy) return;
    setBusy(true);
    setErr(null);
    const error = await removeOperation(editing.id);
    setBusy(false);
    if (error) setErr(error);
    else onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Editar operação' : 'Nova operação'}
      description="Registre o resultado consolidado do dia."
      footer={
        <>
          {editing && (
            <Button variant="danger" className="mr-auto" onClick={remove} disabled={busy}>
              <Trash2 size={16} />
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid || busy}>
            {busy ? 'Salvando…' : editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {err && <ErrorNote>{err}</ErrorNote>}
        <Field label="Resultado">
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { value: 'win', label: 'Ganho', icon: <TrendingUp size={15} /> },
              { value: 'loss', label: 'Perda', icon: <TrendingDown size={15} /> },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <Input
              autoFocus
              inputMode="decimal"
              placeholder="450,00"
              prefix="R$"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Observação" hint="Opcional">
          <Input
            placeholder="Ex.: 12 entradas, 8 greens"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}

/* ------------------------------ Aporte ------------------------------ */

export function AporteDialog({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing?: Aporte | null;
}) {
  const addAporte = useStore((s) => s.addAporte);
  const updateAporte = useStore((s) => s.updateAporte);
  const removeAporte = useStore((s) => s.removeAporte);

  const [date, setDate] = useState(todayISO());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBusy(false);
    setErr(null);
    if (editing) {
      setDate(editing.date);
      setAmount(toInput(editing.amount));
      setNote(editing.note ?? '');
    } else {
      setDate(todayISO());
      setAmount('');
      setNote('');
    }
  }, [open, editing]);

  const parsed = fromInput(amount);
  const valid = Number.isFinite(parsed) && parsed > 0 && !!date;

  const submit = async () => {
    if (!valid || busy) return;
    const amt = Math.abs(parsed);
    setBusy(true);
    setErr(null);
    const error = editing
      ? await updateAporte(editing.id, { date, amount: amt, note: note.trim() })
      : await addAporte({ date, amount: amt, note: note.trim() });
    setBusy(false);
    if (error) setErr(error);
    else onClose();
  };

  const remove = async () => {
    if (!editing || busy) return;
    setBusy(true);
    setErr(null);
    const error = await removeAporte(editing.id);
    setBusy(false);
    if (error) setErr(error);
    else onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Editar aporte' : 'Novo aporte'}
      description="Capital adicionado à banca."
      footer={
        <>
          {editing && (
            <Button variant="danger" className="mr-auto" onClick={remove} disabled={busy}>
              <Trash2 size={16} />
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid || busy}>
            {busy ? 'Salvando…' : editing ? 'Salvar' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {err && <ErrorNote>{err}</ErrorNote>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (R$)">
            <Input
              autoFocus
              inputMode="decimal"
              placeholder="2.500,00"
              prefix="R$"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Observação" hint="Opcional">
          <Input
            placeholder="Ex.: aporte inicial"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
