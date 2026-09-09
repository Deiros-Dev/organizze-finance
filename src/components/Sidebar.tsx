import {
  LayoutDashboard,
  CandlestickChart,
  ArrowDownToLine,
  TrendingUp,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { View } from '../types';
import { useStore } from '../lib/store';
import { cx } from './ui';

const ITEMS: { view: View; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { view: 'operacoes', label: 'Operações', icon: CandlestickChart },
  { view: 'aportes', label: 'Aportes', icon: ArrowDownToLine },
  { view: 'projecao', label: 'Projeção', icon: TrendingUp },
  { view: 'ajustes', label: 'Ajustes', icon: Settings2 },
];

export function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggle = useStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cx(
        'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-elevated px-3 py-4 transition-[width] duration-200 md:flex',
        collapsed ? 'w-[68px]' : 'w-[228px]',
      )}
    >
      <div
        className={cx(
          'mb-6 flex items-center gap-2.5 px-2',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent">
          <TrendingUp size={17} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink">Banca</div>
            <div className="text-[11px] text-faint">Day Trade</div>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {ITEMS.map(({ view: v, label, icon: Icon }) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              title={collapsed ? label : undefined}
              className={cx(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active
                  ? 'bg-accent-soft text-accent'
                  : 'text-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
              )}
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className={cx(
          'mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-faint transition-colors hover:bg-surface-2 hover:text-ink',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && 'Recolher'}
      </button>
    </aside>
  );
}

export function BottomNav() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-elevated/95 backdrop-blur md:hidden">
      {ITEMS.map(({ view: v, label, icon: Icon }) => {
        const active = view === v;
        return (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-accent' : 'text-faint',
            )}
          >
            <Icon size={19} strokeWidth={active ? 2.5 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
