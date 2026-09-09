import { useEffect } from 'react';
import { useStore } from './lib/store';
import { Sidebar, BottomNav } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Operations } from './pages/Operations';
import { Aportes } from './pages/Aportes';
import { Projection } from './pages/Projection';
import { Settings } from './pages/Settings';

export default function App() {
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-clip pb-20 md:pb-0">
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
