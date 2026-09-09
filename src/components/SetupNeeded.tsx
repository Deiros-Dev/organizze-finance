import { Database } from 'lucide-react';

export function SetupNeeded() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Database size={20} />
        </div>
        <h1 className="text-lg font-semibold text-ink">Configurar o banco de dados</h1>
        <p className="mt-1.5 text-sm text-muted">
          Defina as variáveis de ambiente do Supabase para o app conectar.
        </p>

        <div className="mt-4 rounded-lg border border-line bg-elevated p-3 font-mono text-[12px] leading-relaxed text-muted">
          VITE_SUPABASE_URL=<span className="text-faint">https://xxxx.supabase.co</span>
          <br />
          VITE_SUPABASE_ANON_KEY=<span className="text-faint">eyJhbGci…</span>
        </div>

        <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
          <li>
            <span className="text-ink">Local:</span> copie{' '}
            <code className="rounded bg-surface-2 px-1">.env.example</code> para{' '}
            <code className="rounded bg-surface-2 px-1">.env.local</code> e preencha.
          </li>
          <li>
            <span className="text-ink">Vercel:</span> Project → Settings → Environment
            Variables.
          </li>
        </ul>
        <p className="mt-4 text-[13px] text-faint">
          Os valores estão em Supabase → Project Settings → API. Depois recarregue a
          página.
        </p>
      </div>
    </div>
  );
}
