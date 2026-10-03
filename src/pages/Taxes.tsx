import { useMemo, useState } from 'react';
import { Banknote, CalendarClock, Landmark, Receipt, TriangleAlert, Check } from 'lucide-react';
import { useStore } from '../lib/store';
import { monthlyTaxes } from '../lib/calc';
import { brl, brlSigned, dateBR, monthKey, monthLabel, pct, todayISO } from '../lib/format';
import { Button, Card, Field, Input, Toggle, cx } from '../components/ui';
import { TopBar } from '../components/TopBar';

const PRESETS = [15, 20, 27.5];

const toInput = (n: number) => String(n).replace('.', ',');
const fromInput = (s: string) => Number(s.replace(',', '.'));

export function Taxes() {
  const operations = useStore((s) => s.operations);
  const taxRate = useStore((s) => s.settings.taxRate);
  const carry = useStore((s) => s.settings.taxCarryLosses);
  const setSettings = useStore((s) => s.setSettings);

  const [rate, setRate] = useState(toInput(taxRate));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const months = useMemo(
    () => monthlyTaxes(operations, taxRate, carry),
    [operations, taxRate, carry],
  );
  const thisKey = monthKey(todayISO());
  const current = months.find((m) => m.key === thisKey);
  const history = [...months].reverse();
  const lastCarry = months.length ? months[months.length - 1].lossCarry : 0;

  const net = current?.net ?? 0;
  const tax = current?.tax ?? 0;
  const withdrawable = current?.withdrawable ?? 0;

  const save = async (patch: Parameters<typeof setSettings>[0]) => {
    setBusy(true);
    const err = await setSettings(patch);
    setBusy(false);
    setMsg(err ? { ok: false, text: err } : { ok: true, text: 'Salvo.' });
    window.setTimeout(() => setMsg(null), 3000);
  };

  const commitRate = () => {
    const n = fromInput(rate);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setRate(toInput(taxRate));
      return;
    }
    if (n !== taxRate) void save({ taxRate: n });
  };

  return (
    <>
      <TopBar />
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-6 sm:px-8">
        {/* ---------- mês atual ---------- */}
        <Card className="p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <CalendarClock size={15} className="text-faint" />
            <span className="font-medium text-ink">{monthLabel(thisKey)}</span>
            {current && tax > 0 && (
              <span>· vence em {dateBR(current.dueDate)} (último dia útil)</span>
            )}
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Big
              label="Lucro do mês"
              value={brlSigned(net)}
              tone={net < 0 ? 'negative' : 'ink'}
              sub={
                current && current.lossUsed > 0
                  ? `${brl(current.lossUsed)} abatidos de prejuízo anterior`
                  : 'ganhos menos perdas'
              }
            />
            <Big
              label="Imposto a pagar"
              value={brl(tax)}
              tone={tax > 0 ? 'negative' : 'ink'}
              sub={`${pct(taxRate)} sobre ${brl(current?.base ?? 0)}`}
              divider
            />
            <Big
              label="Disponível para retirar"
              value={brl(withdrawable)}
              tone="positive"
              sub="lucro do mês − imposto"
              divider
            />
          </div>
          {net < 0 && (
            <p className="mt-5 text-[13px] text-muted">
              Mês no negativo: não há imposto.
              {carry && ' O prejuízo fica guardado e abate o lucro dos próximos meses.'}
            </p>
          )}
          {lastCarry > 0 && net >= 0 && (
            <p className="mt-5 text-[13px] text-muted">
              Prejuízo acumulado a compensar nos próximos meses:{' '}
              <span className="tnum font-medium text-ink">{brl(lastCarry)}</span>.
            </p>
          )}
        </Card>

        {/* ---------- configuração ---------- */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-sm font-semibold text-ink">Regras do cálculo</h2>
          <Field label="Alíquota do imposto" hint="Padrão 20% (day trade). Confirme com seu contador.">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-32">
                <Input
                  inputMode="decimal"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  onBlur={commitRate}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                />
              </div>
              <span className="text-sm text-faint">%</span>
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={p === taxRate ? 'primary' : 'outline'}
                  disabled={busy}
                  onClick={() => {
                    setRate(toInput(p));
                    void save({ taxRate: p });
                  }}
                >
                  {toInput(p)}%
                </Button>
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
            <div>
              <div className="text-sm font-medium text-ink">Compensar prejuízo</div>
              <div className="text-xs text-faint">
                Perda de um mês abate o lucro dos meses seguintes
              </div>
            </div>
            <Toggle checked={carry} onChange={(v) => void save({ taxCarryLosses: v })} />
          </div>
          {msg && (
            <div
              className={cx(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px]',
                msg.ok
                  ? 'border-positive/30 bg-positive-soft text-positive'
                  : 'border-negative/30 bg-negative-soft text-negative',
              )}
            >
              {msg.ok ? <Check size={15} /> : <TriangleAlert size={15} />}
              {msg.text}
            </div>
          )}
        </Card>

        {/* ---------- histórico ---------- */}
        <Card>
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Receipt size={15} className="text-faint" />
            <h2 className="text-sm font-semibold text-ink">Mês a mês</h2>
          </div>
          {history.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">
              Registre operações para ver o imposto de cada mês.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-faint">
                    <th className="px-4 py-2.5 font-medium">Mês</th>
                    <th className="px-4 py-2.5 text-right font-medium">Resultado</th>
                    <th className="px-4 py-2.5 text-right font-medium">Imposto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Retirável</th>
                    <th className="px-4 py-2.5 text-right font-medium">Vencimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {history.map((m) => (
                    <tr key={m.key}>
                      <td className="px-4 py-3 font-medium text-ink">{monthLabel(m.key)}</td>
                      <td
                        className={cx(
                          'tnum px-4 py-3 text-right',
                          m.net < 0 ? 'text-negative' : 'text-ink',
                        )}
                      >
                        {brlSigned(m.net)}
                      </td>
                      <td className="tnum px-4 py-3 text-right text-ink">{brl(m.tax)}</td>
                      <td className="tnum px-4 py-3 text-right font-medium text-positive">
                        {brl(m.withdrawable)}
                      </td>
                      <td className="tnum px-4 py-3 text-right text-muted">
                        {m.tax > 0 ? dateBR(m.dueDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-faint">
          <Landmark size={14} className="mt-0.5 shrink-0" />
          <span>
            Estimativa: imposto sobre o resultado líquido do mês (ganhos − perdas), pago uma vez
            ao mês até o último dia útil do mês seguinte (feriados não considerados). A alíquota
            e o enquadramento (day trade, ganho no exterior, carnê-leão) dependem da sua
            situação — valide com um contador antes de pagar.
          </span>
        </p>
      </div>
    </>
  );
}

function Big({
  label,
  value,
  sub,
  tone,
  divider,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'ink' | 'positive' | 'negative';
  divider?: boolean;
}) {
  return (
    <div className={cx(divider && 'sm:border-l sm:border-line sm:pl-6')}>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-faint">
        {label === 'Disponível para retirar' && <Banknote size={13} />}
        {label}
      </div>
      <div
        className={cx(
          'tnum mt-1 text-3xl font-semibold',
          tone === 'positive' && 'text-positive',
          tone === 'negative' && 'text-negative',
          tone === 'ink' && 'text-ink',
        )}
      >
        {value}
      </div>
      <div className="tnum mt-1 text-[13px] text-muted">{sub}</div>
    </div>
  );
}
