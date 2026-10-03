import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { photoUrl } from '../lib/storage';
import { brl, brlSigned, dateBR } from '../lib/format';
import { Card, EmptyState, cx } from '../components/ui';
import { PhotoLightbox } from '../components/Photos';

type Data = {
  bankroll: number;
  aportes: number;
  profit: number;
  proofs: { date: string; balance: number; photo: string }[];
};

/** Visão somente leitura aberta pelo link `?share=<token>`. */
export function PublicBankroll({ token }: { token: string }) {
  const [data, setData] = useState<Data | null | undefined>(undefined);
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    void supabase.rpc('get_public_bankroll', { p_token: token }).then(({ data: d, error }) => {
      setData(error || !d ? null : (d as Data));
    });
  }, [token]);

  if (data === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Loader2 size={22} className="animate-spin text-faint" />
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <EmptyState icon={<ShieldCheck size={20} />} title="Link indisponível">
          Este link não existe ou foi desativado pelo dono da banca.
        </EmptyState>
      </div>
    );
  }

  const latest = data.proofs[0];
  const diff = latest ? latest.balance - data.bankroll : 0;

  return (
    <div className="min-h-dvh bg-bg">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-5 py-8 sm:px-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-accent" />
          <h1 className="text-lg font-semibold text-ink">Banca — acompanhamento</h1>
        </div>

        <Card className="grid gap-6 p-6 sm:grid-cols-3">
          <Stat label="Banca registrada" value={brl(data.bankroll)} />
          <Stat label="Aportes" value={brl(data.aportes)} />
          <Stat
            label="Lucro total"
            value={brlSigned(data.profit)}
            tone={data.profit >= 0 ? 'positive' : 'negative'}
          />
        </Card>

        {latest && (
          <Card className="p-5">
            <div className="tnum text-[13px] text-muted">
              Último print ({dateBR(latest.date)}): saldo na corretora{' '}
              <span className="font-semibold text-ink">{brl(latest.balance)}</span>
              {' · '}
              {Math.abs(diff) < 0.005 ? 'bate com a banca registrada' : `diferença de ${brlSigned(diff)}`}
            </div>
          </Card>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Prints da corretora</h2>
          {data.proofs.length === 0 ? (
            <p className="text-sm text-muted">Nenhum print enviado ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.proofs.map((p, i) => (
                <button key={p.photo} type="button" onClick={() => setViewing(i)} className="text-left">
                  <div className="aspect-[3/5] overflow-hidden rounded-lg border border-line bg-surface-2">
                    <img src={photoUrl(p.photo)} alt="" className="h-full w-full object-cover object-top" />
                  </div>
                  <div className="tnum mt-1.5 text-[12px] text-muted">
                    {dateBR(p.date)} · {brl(p.balance)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewing !== null && (
        <PhotoLightbox
          photos={data.proofs.map((p) => p.photo)}
          index={viewing}
          onClose={() => setViewing(null)}
          onIndexChange={setViewing}
        />
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-faint">{label}</div>
      <div
        className={cx(
          'tnum mt-1 text-2xl font-semibold',
          tone === 'positive' ? 'text-positive' : tone === 'negative' ? 'text-negative' : 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  );
}
