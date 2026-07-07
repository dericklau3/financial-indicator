create table if not exists public.sector_performance (
  symbol text primary key,
  name text not null,
  category text not null,
  as_of date not null,
  daily_return_pct numeric(8, 2) not null,
  one_month_return_pct numeric(8, 2) not null,
  three_month_return_pct numeric(8, 2) not null,
  six_month_return_pct numeric(8, 2) not null,
  ytd_return_pct numeric(8, 2) not null,
  display_order integer not null,
  updated_at timestamptz not null default now()
);

alter table public.sector_performance enable row level security;

drop policy if exists "Public can read sector performance" on public.sector_performance;

create policy "Public can read sector performance"
  on public.sector_performance
  for select
  to anon, authenticated
  using (true);

grant select on table public.sector_performance to anon, authenticated;

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
) values
  ('XLK', '科技', '美股板块', '2026-07-06', 1.7, 1.8, 34.2, 25.2, 27.2, 1),
  ('XLF', '金融', '美股板块', '2026-07-06', 0.9, 7.3, 12.6, -0.5, 2.2, 2),
  ('XLV', '医疗保健', '美股板块', '2026-07-06', -1.1, 5.8, 10.7, 2.4, 4.1, 3),
  ('XLY', '可选消费', '美股板块', '2026-07-06', 0.8, 2.7, 8.2, -2.5, -0.3, 4),
  ('XLP', '日常消费', '美股板块', '2026-07-06', -1.0, 0.8, 1.7, 8.6, 8.3, 5),
  ('XLI', '工业', '美股板块', '2026-07-06', 0.9, 6.5, 12.7, 14.5, 17.5, 6),
  ('XLE', '能源', '美股板块', '2026-07-06', -0.2, -7.9, -11.0, 16.4, 16.4, 7),
  ('XLU', '公用事业', '美股板块', '2026-07-06', -1.0, 2.1, -1.9, 5.6, 4.9, 8),
  ('XLRE', '房地产', '美股板块', '2026-07-06', -0.9, -0.9, 6.1, 8.8, 9.7, 9),
  ('XLB', '材料', '美股板块', '2026-07-06', -0.1, 2.7, 3.5, 9.4, 12.7, 10),
  ('XLC', '通信服务', '美股板块', '2026-07-06', 0.6, -1.3, -1.4, -6.1, -5.7, 11),
  ('BTC', 'Bitcoin', '加密', '2026-07-06', 1.4, 4.0, -6.8, -30.8, -28.9, 12),
  ('ETH', 'Ethereum', '加密', '2026-07-06', 1.3, 12.9, -14.6, -44.7, -42.3, 13)
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
