-- Link publico (somente leitura) da banca: um token secreto por usuario.
-- Quem tem o link ve saldo, aportes, lucro e os prints; nao ve operacoes
-- individuais nem observacoes. Revogar = apagar a linha.

create table if not exists public.public_shares (
  user_id    uuid primary key default auth.uid()
             references auth.users (id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.public_shares enable row level security;

drop policy if exists "public_shares_own" on public.public_shares;
create policy "public_shares_own" on public.public_shares
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_public_bankroll(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid;
  start_b numeric;
  total_aportes numeric;
  total_profit numeric;
  proofs json;
begin
  select user_id into uid from public_shares where token = p_token;
  if uid is null then
    return null;
  end if;

  select coalesce(starting_bankroll, 0) into start_b
    from app_settings where user_id = uid;
  select coalesce(sum(amount), 0) into total_aportes from aportes where user_id = uid;
  select coalesce(sum(result), 0) into total_profit from operations where user_id = uid;

  select coalesce(json_agg(json_build_object(
           'date', date, 'balance', balance, 'photo', photo
         ) order by date desc, created_at desc), '[]'::json)
    into proofs from bankroll_proofs where user_id = uid;

  return json_build_object(
    'bankroll', coalesce(start_b, 0) + total_aportes + total_profit,
    'aportes', total_aportes,
    'profit', total_profit,
    'proofs', proofs
  );
end;
$$;

revoke all on function public.get_public_bankroll(uuid) from public;
grant execute on function public.get_public_bankroll(uuid) to anon, authenticated;
