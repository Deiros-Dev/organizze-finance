import { useState } from 'react';
import { TrendingUp, TriangleAlert, CheckCircle2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { Button, Field, Input } from './ui';

type Mode = 'signIn' | 'signUp';

export function Auth() {
  const signIn = useStore((s) => s.signIn);
  const signUp = useStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const valid =
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 6 &&
    (mode === 'signIn' || password === confirm);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    if (mode === 'signIn') {
      const err = await signIn(email, password);
      setBusy(false);
      if (err) setError(err);
    } else {
      const { error: err, needsEmailConfirm } = await signUp(email, password);
      setBusy(false);
      if (err) setError(err);
      else if (needsEmailConfirm) setCheckEmail(true);
    }
  };

  if (checkEmail) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <CheckCircle2 size={20} />
          </div>
          <h1 className="text-lg font-semibold text-ink">Confirme seu e-mail</h1>
          <p className="mt-1.5 text-sm text-muted">
            Enviamos um link de confirmação para{' '}
            <strong className="text-ink">{email}</strong>. Clique nele para ativar sua
            conta e entrar.
          </p>
          <Button
            variant="outline"
            className="mt-5 w-full"
            onClick={() => {
              setCheckEmail(false);
              setMode('signIn');
            }}
          >
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-card">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <TrendingUp size={20} />
        </div>
        <h1 className="text-lg font-semibold text-ink">
          {mode === 'signIn' ? 'Entrar' : 'Criar conta'}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === 'signIn'
            ? 'Entre para ver sua banca.'
            : 'Cada conta tem sua própria banca, operações e aportes.'}
        </p>

        <form
          className="mt-5 flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-negative/30 bg-negative-soft px-3 py-2 text-[13px] text-negative">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field label="E-mail">
            <Input
              type="email"
              autoFocus
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Senha" hint={mode === 'signUp' ? 'Mínimo de 6 caracteres' : undefined}>
            <Input
              type="password"
              autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {mode === 'signUp' && (
            <Field label="Confirmar senha">
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          )}
          <Button type="submit" variant="primary" disabled={!valid || busy} className="mt-1 w-full">
            {busy ? 'Enviando…' : mode === 'signIn' ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <button
          onClick={() => {
            setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
            setError(null);
          }}
          className="mt-4 w-full text-center text-[13px] text-muted hover:text-ink"
        >
          {mode === 'signIn' ? (
            <>
              Não tem conta? <span className="font-medium text-accent">Criar uma</span>
            </>
          ) : (
            <>
              Já tem conta? <span className="font-medium text-accent">Entrar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
