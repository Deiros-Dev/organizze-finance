import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { useStore } from '../lib/store';
import { brl, brlSigned, dateBR, todayISO } from '../lib/format';
import { ACCEPTED_TYPES, photoUrl, removePhotos, uploadPhoto } from '../lib/storage';
import { PhotoLightbox } from './Photos';
import { Button, Card, Dialog, Field, Input, cx } from './ui';

const fromInput = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

/** Print do saldo na corretora, comparado com a banca calculada pelo app. */
export function BankrollProofs({ appBankroll }: { appBankroll: number }) {
  const proofs = useStore((s) => s.proofs);
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);

  const latest = proofs[0];
  const diff = latest ? latest.balance - appBankroll : 0;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent" />
          <h2 className="text-sm font-semibold text-ink">Banca real na corretora</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
          <ImagePlus size={15} />
          Novo print
        </Button>
      </div>

      {!latest ? (
        <p className="mt-3 text-[13px] text-muted">
          Anexe um print do saldo da conta na corretora (ex.: Olymptrade) para comprovar a banca.
          O app mostra a diferença entre o print e o que está registrado aqui.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => setViewing(0)}
            className="h-40 w-full shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2 sm:w-28"
          >
            <img
              src={photoUrl(latest.photo)}
              alt="Print da banca na corretora"
              className="h-full w-full object-cover object-top"
            />
          </button>
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <Stat label="Saldo no print" value={brl(latest.balance)} sub={dateBR(latest.date)} />
            <Stat label="Banca no app" value={brl(appBankroll)} sub="aportes + resultados" />
            <Stat
              label="Diferença"
              value={Math.abs(diff) < 0.005 ? 'Bate certinho' : brlSigned(diff)}
              tone={Math.abs(diff) < 0.005 ? 'positive' : 'negative'}
              sub={
                Math.abs(diff) < 0.005
                  ? 'app e corretora iguais'
                  : diff > 0
                    ? 'corretora tem mais que o app'
                    : 'app tem mais que a corretora'
              }
            />
          </div>
        </div>
      )}

      {proofs.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto border-t border-line pt-4">
          {proofs.slice(1).map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setViewing(i + 1)}
              className="shrink-0 text-left"
            >
              <div className="h-20 w-14 overflow-hidden rounded-md border border-line bg-surface-2">
                <img src={photoUrl(p.photo)} alt="" className="h-full w-full object-cover object-top" />
              </div>
              <div className="tnum mt-1 text-[11px] text-faint">{dateBR(p.date).slice(0, 5)}</div>
            </button>
          ))}
        </div>
      )}

      <ProofDialog open={adding} onClose={() => setAdding(false)} />
      {viewing !== null && proofs[viewing] && (
        <ProofViewer index={viewing} onIndex={setViewing} onClose={() => setViewing(null)} />
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'positive' | 'negative';
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-faint">{label}</div>
      <div
        className={cx(
          'tnum mt-1 text-lg font-semibold',
          tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-ink',
        )}
      >
        {value}
      </div>
      <div className="text-[12px] text-faint">{sub}</div>
    </div>
  );
}

function ProofViewer({
  index,
  onIndex,
  onClose,
}: {
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const proofs = useStore((s) => s.proofs);
  const removeProof = useStore((s) => s.removeProof);
  const [busy, setBusy] = useState(false);
  const p = proofs[index];

  return (
    <>
      <PhotoLightbox
        photos={proofs.map((x) => x.photo)}
        index={index}
        onClose={onClose}
        onIndexChange={onIndex}
      />
      <div className="fixed inset-x-0 top-4 z-[70] flex justify-center gap-3 px-16">
        <div className="tnum rounded-full bg-black/60 px-3 py-1 text-[13px] text-white/90">
          {dateBR(p.date)} · {brl(p.balance)}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm('Excluir este print?')) return;
            setBusy(true);
            const err = await removeProof(p.id);
            setBusy(false);
            if (err) window.alert(err);
            else onClose();
          }}
          className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[13px] text-white/90 hover:text-negative disabled:opacity-50"
        >
          <Trash2 size={13} />
          Excluir
        </button>
      </div>
    </>
  );
}

function ProofDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addProof = useStore((s) => s.addProof);
  const inputRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayISO());
  const [balance, setBalance] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(todayISO());
    setBalance('');
    setPhoto(null);
    setErr(null);
    setBusy(false);
  }, [open]);

  const parsed = fromInput(balance);
  const valid = !!photo && Number.isFinite(parsed) && parsed >= 0 && balance.trim() !== '' && !!date;

  const handleClose = () => {
    if (busy) return;
    if (photo) void removePhotos([photo]); // enviado mas nunca salvo
    onClose();
  };

  const pick = async (file: File) => {
    setErr(null);
    setUploading(true);
    if (photo) void removePhotos([photo]);
    const { path, error } = await uploadPhoto(file);
    setUploading(false);
    setPhoto(path);
    if (error) setErr(error);
  };

  const submit = async () => {
    if (!valid || busy || !photo) return;
    setBusy(true);
    const error = await addProof({ date, balance: parsed, photo });
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    setPhoto(null); // agora pertence ao registro
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Print da banca real"
      description="Screenshot do saldo na corretora e o valor que aparece nele."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={submit} disabled={!valid || busy || uploading}>
            {busy ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3 py-2 text-[13px] text-negative">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-44 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-2 bg-surface-2 text-faint transition-colors hover:border-accent hover:text-accent"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : photo ? (
            <img src={photoUrl(photo)} alt="Print" className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1.5 text-[13px] font-medium">
              <ImagePlus size={20} />
              Escolher print
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void pick(f);
            e.target.value = '';
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Saldo no print">
            <Input
              inputMode="decimal"
              placeholder="62.121,83"
              prefix="R$"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
            />
          </Field>
          <Field label="Data">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}
