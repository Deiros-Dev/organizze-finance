-- Calculadora de impostos (aliquota + compensacao de prejuizo) e
-- comprovantes da banca real (prints do saldo na corretora).

alter table public.app_settings
  add column if not exists tax_rate numeric(5, 2) not null default 20
    check (tax_rate >= 0 and tax_rate <= 100),
  add column if not exists tax_carry_losses boolean not null default true;

create table if not exists public.bankroll_proofs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  date       date not null,
  balance    numeric(14, 2) not null,
  photo      text not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists bankroll_proofs_user_date_idx
  on public.bankroll_proofs (user_id, date desc);

alter table public.bankroll_proofs enable row level security;

drop policy if exists "bankroll_proofs_own" on public.bankroll_proofs;
create policy "bankroll_proofs_own" on public.bankroll_proofs
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
