create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sector_performance_update_auth (
  key_name text primary key,
  secret_sha256 text not null,
  updated_at timestamptz not null default now()
);

alter table public.sector_performance_update_auth enable row level security;

revoke all on table public.sector_performance_update_auth from anon, authenticated;

create or replace function public.update_sector_performance_from_job(
  p_secret text,
  p_rows jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  expected_hash text;
  updated_count integer;
begin
  select secret_sha256
    into expected_hash
    from public.sector_performance_update_auth
    where key_name = 'server-cron';

  if expected_hash is null or encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex') <> expected_hash then
    raise exception 'invalid updater secret';
  end if;

  if jsonb_typeof(p_rows) <> 'array' then
    raise exception 'p_rows must be a JSON array';
  end if;

  insert into public.sector_performance (
    symbol,
    name,
    category,
    as_of,
    daily_return_pct,
    one_month_return_pct,
    three_month_return_pct,
    six_month_return_pct,
    ytd_return_pct,
    display_order
  )
  select
    symbol,
    name,
    category,
    as_of,
    daily_return_pct,
    one_month_return_pct,
    three_month_return_pct,
    six_month_return_pct,
    ytd_return_pct,
    display_order
  from jsonb_to_recordset(p_rows) as row_data(
    symbol text,
    name text,
    category text,
    as_of date,
    daily_return_pct numeric,
    one_month_return_pct numeric,
    three_month_return_pct numeric,
    six_month_return_pct numeric,
    ytd_return_pct numeric,
    display_order integer
  )
  where
    symbol in ('XLK', 'XLF', 'XLV', 'XLY', 'XLP', 'XLI', 'XLE', 'XLU', 'XLRE', 'XLB', 'XLC', 'BTC', 'ETH') and
    name is not null and
    category in ('美股板块', '加密') and
    as_of is not null and
    display_order between 1 and 13
  on conflict (symbol) do update set
    name = excluded.name,
    category = excluded.category,
    as_of = excluded.as_of,
    daily_return_pct = excluded.daily_return_pct,
    one_month_return_pct = excluded.one_month_return_pct,
    three_month_return_pct = excluded.three_month_return_pct,
    six_month_return_pct = excluded.six_month_return_pct,
    ytd_return_pct = excluded.ytd_return_pct,
    display_order = excluded.display_order,
    updated_at = now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.update_sector_performance_from_job(text, jsonb) from public;
grant execute on function public.update_sector_performance_from_job(text, jsonb) to anon;
