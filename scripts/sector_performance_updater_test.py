import datetime as dt
import pathlib
import sys
import unittest
from zoneinfo import ZoneInfo

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

from sector_performance_updater import (
    SECTORS,
    build_rows,
    calculate_returns,
    is_us_market_holiday,
    should_run_for_instant,
)


class SectorPerformanceUpdaterTest(unittest.TestCase):
    def test_skips_weekends_and_us_market_holidays(self):
        self.assertFalse(should_run_for_instant(dt.datetime(2026, 7, 5, 5, 30, tzinfo=ZoneInfo("Asia/Shanghai"))))
        self.assertTrue(is_us_market_holiday(dt.date(2026, 7, 3)))
        self.assertFalse(should_run_for_instant(dt.datetime(2026, 7, 4, 5, 30, tzinfo=ZoneInfo("Asia/Shanghai"))))

    def test_runs_after_regular_us_trading_day_close(self):
        self.assertTrue(should_run_for_instant(dt.datetime(2026, 7, 7, 5, 30, tzinfo=ZoneInfo("Asia/Shanghai"))))

    def test_calculates_daily_and_period_returns_from_closes(self):
        closes = [
            ("2026-01-02", 100.0),
            ("2026-01-06", 105.0),
            ("2026-04-06", 110.0),
            ("2026-06-05", 120.0),
            ("2026-07-02", 125.0),
            ("2026-07-06", 130.0),
        ]

        result = calculate_returns(closes, dt.date(2026, 7, 6))

        self.assertEqual(result["as_of"], "2026-07-06")
        self.assertEqual(result["daily_return_pct"], 4.0)
        self.assertEqual(result["one_month_return_pct"], 8.33)
        self.assertEqual(result["three_month_return_pct"], 18.18)
        self.assertEqual(result["six_month_return_pct"], 23.81)
        self.assertEqual(result["ytd_return_pct"], 30.0)

    def test_rejects_stale_etf_closes_before_writing(self):
        original_sectors = list(SECTORS)
        try:
            SECTORS[:] = [
                {"symbol": "XLK", "name": "科技", "category": "美股板块", "display_order": 1, "assetclass": "etf"}
            ]

            def fake_fetch(*_args):
                return [
                    ("2026-01-02", 100.0),
                    ("2026-07-03", 120.0),
                    ("2026-07-06", 130.0),
                ]

            import sector_performance_updater

            original_fetch = sector_performance_updater.fetch_nasdaq_closes
            sector_performance_updater.fetch_nasdaq_closes = fake_fetch
            with self.assertRaisesRegex(ValueError, "XLK latest close is 2026-07-06"):
                build_rows(dt.date(2026, 7, 7))
        finally:
            SECTORS[:] = original_sectors
            sector_performance_updater.fetch_nasdaq_closes = original_fetch


if __name__ == "__main__":
    unittest.main()
