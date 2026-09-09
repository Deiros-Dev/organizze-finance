-- Banca Day Trade — schema inicial
-- Modo sem login: as policies liberam o role `anon` (a chave publica usada no app).

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------ --
--  Operacoes: resultado consolidado de um dia (ganho ou perda)      --
-- ------------------------------------------------------------------ --
create table if not exists public.operations (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  result     numeric(14, 2) not null,
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists operations_date_idx on public.operations (date);

-- ------------------------------------------------------------------ --
--  Aportes: capital adicionado a banca                              --
-- ------------------------------------------------------------------ --
create table if not exists public.aportes (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  amount     numeric(14, 2) not null check (amount >= 0),
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists aportes_date_idx on public.aportes (date);

-- ------------------------------------------------------------------ --
--  Configuracao: linha unica (id = 1)                               --
-- ------------------------------------------------------------------ --
create table if not exists public.app_settings (
  id                smallint primary key default 1 check (id = 1),
  monthly_goal      numeric(14, 2) not null default 12000,
  starting_bankroll numeric(14, 2) not null default 0,
  currency_display  text not null default 'symbol'
                    check (currency_display in ('symbol', 'code')),
  updated_at        timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------------ --
--  Row Level Security — acesso aberto (sem login)                   --
-- ------------------------------------------------------------------ --
alter table public.operations   enable row level security;
alter table public.aportes      enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "operations_open" on public.operations;
create policy "operations_open" on public.operations
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "aportes_open" on public.aportes;
create policy "aportes_open" on public.aportes
  for all to anon, authenticated using (true) with check (true);

drop policy if exists "app_settings_open" on public.app_settings;
create policy "app_settings_open" on public.app_settings
  for all to anon, authenticated using (true) with check (true);
