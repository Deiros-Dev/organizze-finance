import { Moon, Sun, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStore } from '../lib/store';
import { Button } from './ui';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Visão geral', subtitle: 'Sua banca e o resultado das operações' },
  operacoes: { title: 'Operações', subtitle: 'Histórico de resultados por dia' },
  aportes: { title: 'Aportes', subtitle: 'Capital investido na banca' },
  projecao: { title: 'Projeção', subtitle: 'Simule o retorno com base na sua estatística' },
  ajustes: { title: 'Ajustes', subtitle: 'Preferências, meta e dados' },
};

export function TopBar({ action }: { action?: ReactNode }) {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.settings.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const meta = TITLES[view] ?? TITLES.dashboard;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-bg/85 px-5 py-4 backdrop-blur-md sm:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-ink">{meta.title}</h1>
        <p className="truncate text-[13px] text-muted">{meta.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
    </header>
  );
}

export { Plus };
