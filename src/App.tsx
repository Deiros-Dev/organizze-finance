import { useEffect } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useStore } from './lib/store';
import { supabaseReady } from './lib/supabase';
import { Sidebar, BottomNav } from './components/Sidebar';
import { SetupNeeded } from './components/SetupNeeded';
import { Auth } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Aportes } from './pages/Aportes';
import { Projection } from './pages/Projection';
import { Settings } from './pages/Settings';

export default function App() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.settings.theme);
  const status = useStore((s) => s.status);
  const error = useStore((s) => s.error);
  const loadData = useStore((s) => s.loadData);
  const authStatus = useStore((s) => s.authStatus);
  const initAuth = useStore((s) => s.initAuth);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!supabaseReady) return;
    return initAuth();
  }, [initAuth]);

  if (!supabaseReady) return <SetupNeeded />;

  if (authStatus === 'unknown') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Loader2 size={22} className="animate-spin text-faint" />
      </div>
    );
  }

  if (authStatus === 'unauthenticated') return <Auth />;

  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-clip pb-20 md:pb-0">
        {status === 'error' && (
          <div className="flex items-center gap-3 border-b border-negative/30 bg-negative-soft px-5 py-2.5 text-[13px] text-negative sm:px-8">
            <AlertTriangle size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              Não foi possível carregar os dados{error ? `: ${error}` : ''}.
            </span>
            <button
              onClick={() => void loadData()}
              className="inline-flex shrink-0 items-center gap-1.5 font-medium hover:underline"
            >
              <RefreshCw size={13} />
              Tentar de novo
            </button>
          </div>
        )}
        {status === 'loading' && (
          <div className="flex items-center gap-2 border-b border-line bg-surface px-5 py-2 text-[13px] text-muted sm:px-8">
            <Loader2 size={14} className="animate-spin" />
            Carregando…
          </div>
        )}

        {view === 'dashboard' && <Dashboard />}
        {view === 'operacoes' && <Operations />}
        {view === 'aportes' && <Aportes />}
        {view === 'projecao' && <Projection />}
        {view === 'ajustes' && <Settings />}
      </main>
      <BottomNav />
    </div>
  );
}
