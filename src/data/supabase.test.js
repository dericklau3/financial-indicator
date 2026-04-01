import { describe, expect, test } from "bun:test";
import {
  loadDashboardDataFromSupabase,
  mapCronRowToMetrics,
  mapMonthlyReturnRows,
} from "./supabase.js";

describe("supabase dashboard data helpers", () => {
  test("maps cron_data row into dashboard metrics", () => {
    expect(
      mapCronRowToMetrics({
        date: "2026-04-01",
        vix: 24.83,
        cnn_fear_greed: 16,
        crypto_fear_greed: 8,
      })
    ).toEqual({
      vix: 24.83,
      cnnFearGreed: 16,
      cryptoFearGreed: 8,
      vixDate: "2026-04-01",
      cnnFearGreedDate: "2026-04-01",
      cryptoFearGreedDate: "2026-04-01",
    });
  });

  test("maps monthly return rows into heatmap data", () => {
    expect(
      mapMonthlyReturnRows([
        { month: "2011-04-01", return_pct: 2.4634 },
        { month: "2011-05-01", return_pct: -0.969 },
      ])
    ).toEqual([
      { month: "2011-04", returnPct: 2.4634 },
      { month: "2011-05", returnPct: -0.969 },
    ]);
  });

  test("loads cron_data singleton and ordered monthly returns from supabase", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        async json() {
          if (String(url).includes("cron_data")) {
            return [
              {
                key: "singleton",
                date: "2026-04-01",
                vix: 24.83,
                cnn_fear_greed: 16,
                crypto_fear_greed: 8,
              },
            ];
          }

          return [
            { month: "2011-05-01", return_pct: -0.969 },
            { month: "2011-04-01", return_pct: 2.4634 },
          ];
        },
      };
    };

    const result = await loadDashboardDataFromSupabase(fetchImpl, {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    });

    expect(result.metrics).toEqual({
      vix: 24.83,
      cnnFearGreed: 16,
      cryptoFearGreed: 8,
      vixDate: "2026-04-01",
      cnnFearGreedDate: "2026-04-01",
      cryptoFearGreedDate: "2026-04-01",
    });
    expect(result.returns).toEqual([
      { month: "2011-04", returnPct: 2.4634 },
      { month: "2011-05", returnPct: -0.969 },
    ]);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("cron_data");
    expect(calls[1]).toContain("sp500_monthly_returns");
  });
});
