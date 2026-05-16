import { describe, expect, test } from "bun:test";
import {
  loadDashboardDataFromSupabase,
  loadInvestorLinksFromSupabase,
  mapInvestorLinkRows,
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

  test("maps supabase numeric strings into dashboard metrics", () => {
    expect(
      mapCronRowToMetrics({
        date: "2026-05-16",
        vix: "18.43",
        cnn_fear_greed: "63",
        crypto_fear_greed: "31",
      })
    ).toEqual({
      vix: 18.43,
      cnnFearGreed: 63,
      cryptoFearGreed: 31,
      vixDate: "2026-05-16",
      cnnFearGreedDate: "2026-05-16",
      cryptoFearGreedDate: "2026-05-16",
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

  test("maps supabase numeric strings into heatmap data", () => {
    expect(
      mapMonthlyReturnRows([
        { month: "2026-04-01", return_pct: "10.4233" },
        { month: "2026-03-01", return_pct: "-5.0933" },
      ])
    ).toEqual([
      { month: "2026-03", returnPct: -5.0933 },
      { month: "2026-04", returnPct: 10.4233 },
    ]);
  });

  test("maps investor link rows into card data sorted by display order", () => {
    expect(
      mapInvestorLinkRows([
        {
          slug: "buffett",
          name: "巴菲特",
          description: "Berkshire Hathaway 持仓",
          url: "https://www.dataroma.com/m/holdings.php?m=BRK",
          display_order: 2,
          is_active: true,
        },
        {
          slug: "hidden",
          name: "Hidden",
          description: "Hidden holding",
          url: "https://example.com/hidden",
          display_order: 3,
          is_active: false,
        },
        {
          slug: "duanyongping",
          name: "段永平",
          description: "H&H Holdings 持仓",
          url: "https://www.dataroma.com/m/holdings.php?m=HH",
          display_order: 1,
          is_active: true,
        },
      ])
    ).toEqual([
      {
        id: "duanyongping",
        name: "段永平",
        desc: "H&H Holdings 持仓",
        url: "https://www.dataroma.com/m/holdings.php?m=HH",
      },
      {
        id: "buffett",
        name: "巴菲特",
        desc: "Berkshire Hathaway 持仓",
        url: "https://www.dataroma.com/m/holdings.php?m=BRK",
      },
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

  test("loads active investor links from supabase", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        async json() {
          return [
            {
              slug: "duanyongping",
              name: "段永平",
              description: "H&H Holdings 持仓",
              url: "https://www.dataroma.com/m/holdings.php?m=HH",
              display_order: 1,
              is_active: true,
            },
          ];
        },
      };
    };

    const result = await loadInvestorLinksFromSupabase(fetchImpl, {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    });

    expect(result).toEqual([
      {
        id: "duanyongping",
        name: "段永平",
        desc: "H&H Holdings 持仓",
        url: "https://www.dataroma.com/m/holdings.php?m=HH",
      },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("investor_links");
    expect(calls[0]).toContain("is_active=eq.true");
    expect(calls[0]).toContain("order=display_order.asc");
  });
});
