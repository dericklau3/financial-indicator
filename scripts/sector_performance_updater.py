#!/usr/bin/env python3
import argparse
import calendar
import datetime as dt
import json
import os
import sys
import urllib.parse
import urllib.request
from zoneinfo import ZoneInfo


SECTORS = [
    {"symbol": "XLK", "name": "科技", "category": "美股板块", "display_order": 1, "assetclass": "etf"},
    {"symbol": "XLF", "name": "金融", "category": "美股板块", "display_order": 2, "assetclass": "etf"},
    {"symbol": "XLV", "name": "医疗保健", "category": "美股板块", "display_order": 3, "assetclass": "etf"},
    {"symbol": "XLY", "name": "可选消费", "category": "美股板块", "display_order": 4, "assetclass": "etf"},
    {"symbol": "XLP", "name": "日常消费", "category": "美股板块", "display_order": 5, "assetclass": "etf"},
    {"symbol": "XLI", "name": "工业", "category": "美股板块", "display_order": 6, "assetclass": "etf"},
    {"symbol": "XLE", "name": "能源", "category": "美股板块", "display_order": 7, "assetclass": "etf"},
    {"symbol": "XLU", "name": "公用事业", "category": "美股板块", "display_order": 8, "assetclass": "etf"},
    {"symbol": "XLRE", "name": "房地产", "category": "美股板块", "display_order": 9, "assetclass": "etf"},
    {"symbol": "XLB", "name": "材料", "category": "美股板块", "display_order": 10, "assetclass": "etf"},
    {"symbol": "XLC", "name": "通信服务", "category": "美股板块", "display_order": 11, "assetclass": "etf"},
    {"symbol": "BTC", "name": "Bitcoin", "category": "加密", "display_order": 12, "assetclass": "crypto"},
    {"symbol": "ETH", "name": "Ethereum", "category": "加密", "display_order": 13, "assetclass": "crypto"},
]


def nth_weekday(year, month, weekday, n):
    day = dt.date(year, month, 1)
    offset = (weekday - day.weekday()) % 7
    return day + dt.timedelta(days=offset + 7 * (n - 1))


def last_weekday(year, month, weekday):
    day = dt.date(year, month, calendar.monthrange(year, month)[1])
    return day - dt.timedelta(days=(day.weekday() - weekday) % 7)


def observed_fixed_holiday(year, month, day):
    holiday = dt.date(year, month, day)
    if holiday.weekday() == 5:
        return holiday - dt.timedelta(days=1)
    if holiday.weekday() == 6:
        return holiday + dt.timedelta(days=1)
    return holiday


def easter_date(year):
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return dt.date(year, month, day)


def us_market_holidays(year):
    return {
        observed_fixed_holiday(year, 1, 1),
        nth_weekday(year, 1, 0, 3),
        nth_weekday(year, 2, 0, 3),
        easter_date(year) - dt.timedelta(days=2),
        last_weekday(year, 5, 0),
        observed_fixed_holiday(year, 6, 19),
        observed_fixed_holiday(year, 7, 4),
        nth_weekday(year, 9, 0, 1),
        nth_weekday(year, 11, 3, 4),
        observed_fixed_holiday(year, 12, 25),
    }


def is_us_market_holiday(day):
    return day in us_market_holidays(day.year)


def market_session_date(now=None):
    instant = now or dt.datetime.now(dt.timezone.utc)
    if instant.tzinfo is None:
        instant = instant.replace(tzinfo=dt.timezone.utc)
    return instant.astimezone(ZoneInfo("America/New_York")).date()


def should_run_for_instant(now=None):
    session = market_session_date(now)
    return session.weekday() < 5 and not is_us_market_holiday(session)


def parse_nasdaq_date(value):
    month, day, year = [int(part) for part in value.split("/")]
    return dt.date(year, month, day)


def parse_price(value):
    return float(str(value).replace("$", "").replace(",", ""))


def subtract_months(day, months):
    month = day.month - months
    year = day.year
    while month <= 0:
        month += 12
        year -= 1
    last_day = calendar.monthrange(year, month)[1]
    return dt.date(year, month, min(day.day, last_day))


def pct_change(current, previous):
    return round(((current / previous) - 1) * 100, 2)


def close_at_or_before(closes, target):
    candidates = [row for row in closes if row[0] <= target]
    if not candidates:
        raise ValueError(f"no close at or before {target.isoformat()}")
    return candidates[-1]


def first_close_at_or_after(closes, target):
    candidates = [row for row in closes if row[0] >= target]
    if not candidates:
        raise ValueError(f"no close at or after {target.isoformat()}")
    return candidates[0]


def calculate_returns(closes, session_date):
    parsed = [
        (dt.date.fromisoformat(day) if isinstance(day, str) else day, float(close))
        for day, close in closes
    ]
    parsed.sort(key=lambda row: row[0])
    latest_index = max((idx for idx, row in enumerate(parsed) if row[0] <= session_date), default=None)
    if latest_index is None or latest_index == 0:
        raise ValueError(f"not enough closes for {session_date.isoformat()}")

    latest_day, latest_close = parsed[latest_index]
    previous_day, previous_close = parsed[latest_index - 1]
    one_month_close = close_at_or_before(parsed, subtract_months(latest_day, 1))[1]
    three_month_close = close_at_or_before(parsed, subtract_months(latest_day, 3))[1]
    six_month_close = close_at_or_before(parsed, subtract_months(latest_day, 6))[1]
    ytd_close = first_close_at_or_after(parsed, dt.date(latest_day.year, 1, 1))[1]

    return {
        "as_of": latest_day.isoformat(),
        "daily_return_pct": pct_change(latest_close, previous_close),
        "one_month_return_pct": pct_change(latest_close, one_month_close),
        "three_month_return_pct": pct_change(latest_close, three_month_close),
        "six_month_return_pct": pct_change(latest_close, six_month_close),
        "ytd_return_pct": pct_change(latest_close, ytd_close),
    }


def fetch_nasdaq_closes(symbol, assetclass, start_date, end_date):
    query = urllib.parse.urlencode(
        {
            "assetclass": assetclass,
            "fromdate": start_date.isoformat(),
            "todate": end_date.isoformat(),
            "limit": "9999",
        }
    )
    url = f"https://api.nasdaq.com/api/quote/{symbol}/historical?{query}"
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    rows = payload.get("data", {}).get("tradesTable", {}).get("rows", [])
    closes = [
        (parse_nasdaq_date(row["date"]), parse_price(row["close"]))
        for row in rows
        if row.get("date") and row.get("close")
    ]
    closes.sort(key=lambda row: row[0])
    if len(closes) < 2:
        raise ValueError(f"{symbol} returned fewer than 2 closes")
    return closes


def build_rows(session_date):
    start_date = session_date - dt.timedelta(days=230)
    rows = []
    for item in SECTORS:
        closes = fetch_nasdaq_closes(item["symbol"], item["assetclass"], start_date, session_date)
        returns = calculate_returns(closes, session_date)
        rows.append(
            {
                "symbol": item["symbol"],
                "name": item["name"],
                "category": item["category"],
                "display_order": item["display_order"],
                **returns,
            }
        )
    return rows


def load_config(path):
    with open(path, "r", encoding="utf-8") as handle:
        config = json.load(handle)
    for key in ["supabase_url", "supabase_anon_key", "update_secret"]:
        if not config.get(key):
            raise ValueError(f"missing config field: {key}")
    return config


def call_supabase_rpc(config, rows):
    url = config["supabase_url"].rstrip("/") + "/rest/v1/rpc/update_sector_performance_from_job"
    body = json.dumps({"p_secret": config["update_secret"], "p_rows": rows}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": config["supabase_anon_key"],
            "Authorization": f"Bearer {config['supabase_anon_key']}",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8") or "null")


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Update Supabase sector performance rows.")
    parser.add_argument("--config", default=os.environ.get("SECTOR_UPDATER_CONFIG", "config.json"))
    parser.add_argument("--as-of", help="Override market session date as YYYY-MM-DD.")
    parser.add_argument("--force", action="store_true", help="Run even if the session date is not a market day.")
    parser.add_argument("--dry-run", action="store_true", help="Print rows without writing Supabase.")
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    session = dt.date.fromisoformat(args.as_of) if args.as_of else market_session_date()
    if not args.force and (session.weekday() >= 5 or is_us_market_holiday(session)):
        print(json.dumps({"skipped": True, "session_date": session.isoformat()}, ensure_ascii=False))
        return 0

    rows = build_rows(session)
    if args.dry_run:
        print(json.dumps({"rows": rows}, ensure_ascii=False, indent=2))
        return 0

    config = load_config(args.config)
    result = call_supabase_rpc(config, rows)
    print(json.dumps({"updated": len(rows), "session_date": session.isoformat(), "result": result}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
