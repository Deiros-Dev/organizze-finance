import { useRef, useState } from 'react';
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Target,
  Coins,
  Database,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { brl } from '../lib/format';
import { Button, Card, Field, Input, Segmented, cx } from '../components/ui';
import { TopBar } from '../components/TopBar';

export function Settings() {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const operations = useStore((s) => s.operations);
  const aportes = useStore((s) => s.aportes);
  const projection = useStore((s) => s.projection);
  const loadSample = useStore((s) => s.loadSample);
  const clearAll = useStore((s) => s.clearAll);
  const importData = useStore((s) => s.importData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [goal, setGoal] = useState(String(settings.monthlyGoal));
  const [confirmClear, setConfirmClear] = useState(false);

  const commitGoal = () => {
    const n = Number(goal.replace(/\./g, '').replace(',', '.'));
    setSettings({ monthlyGoal: Number.isFinite(n) && n >= 0 ? n : 0 });
  };

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ operations, aportes, settings, projection }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banca-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        importData(data);
      } catch {
        alert('Arquivo inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <TopBar />
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-5 py-6 sm:px-8">
        {/* Aparência */}
        <Card className="flex flex-col gap-4 p-5">
          <SectionTitle>Aparência</SectionTitle>
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink">Tema</div>
            <Segmented
              value={settings.theme}
              onChange={(v) => setSettings({ theme: v })}
              options={[
                { value: 'dark', label: 'Escuro', icon: <Moon size={15} /> },
                { value: 'light', label: 'Claro', icon: <Sun size={15} /> },
              ]}
            />
          </div>
          <div className="flex items-center justify-between border-t border-line pt-4">
            <div className="text-sm text-ink">Exibição da moeda</div>
            <Segmented
              value={settings.currencyDisplay}
              onChange={(v) => setSettings({ currencyDisplay: v })}
              options={[
                { value: 'symbol', label: 'R$', icon: <Coins size={15} /> },
                { value: 'code', label: 'BRL' },
              ]}
            />
          </div>
        </Card>

        {/* Meta */}
        <Card className="flex flex-col gap-3 p-5">
          <SectionTitle>Meta mensal</SectionTitle>
          <Field
            label="Objetivo de lucro no mês"
            hint={`Atual: ${brl(settings.monthlyGoal)}`}
          >
            <div className="flex gap-2">
              <Input
                inputMode="decimal"
                prefix="R$"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onBlur={commitGoal}
              />
              <Button variant="primary" onClick={commitGoal}>
                <Target size={16} />
                Salvar
              </Button>
            </div>
          </Field>
        </Card>

        {/* Dados */}
        <Card className="flex flex-col gap-4 p-5">
          <SectionTitle>Dados</SectionTitle>
          <p className="text-[13px] text-muted">
            {operations.length} operações e {aportes.length} aportes salvos neste
            navegador. Faça backup exportando o JSON.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download size={16} />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload size={16} />
              Importar
            </Button>
            <Button variant="outline" onClick={loadSample}>
              <Database size={16} />
              Dados de exemplo
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = '';
              }}
            />
          </div>

          <div className="border-t border-line pt-4">
            {confirmClear ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-negative">
                  Apagar todas as operações e aportes?
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    clearAll();
                    setConfirmClear(false);
                  }}
                >
                  Sim, apagar tudo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className={cx(
                  'inline-flex items-center gap-2 text-[13px] font-medium text-negative hover:underline',
                )}
              >
                <Trash2 size={15} />
                Limpar todos os dados
              </button>
            )}
          </div>
        </Card>

        <p className="px-1 text-center text-[12px] text-faint">
          Banca · Day Trade — dados salvos localmente no seu navegador.
        </p>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
      {children}
    </h2>
  );
}
