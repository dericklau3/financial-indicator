import { describe, expect, test } from "bun:test";
import {
  loadDashboardDataFromSupabase,
  loadInvestorLinksFromSupabase,
  loadSectorPerformanceFromSupabase,
  mapInvestorLinkRows,
  mapCronRowToMetrics,
  mapMonthlyReturnRows,
  mapSectorPerformanceRows,
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

  test("drops investor links with unsafe URL schemes", () => {
    expect(
      mapInvestorLinkRows([
        {
          slug: "script",
          name: "Script Link",
          description: "Should not render",
          url: "javascript:alert(1)",
          display_order: 1,
          is_active: true,
        },
        {
          slug: "plain-http",
          name: "Plain HTTP Link",
          description: "Should not render",
          url: "http://example.com/holdings",
          display_order: 2,
          is_active: true,
        },
        {
          slug: "safe",
          name: "Safe Link",
          description: "Should render",
          url: "https://example.com/holdings",
          display_order: 3,
          is_active: true,
        },
      ])
    ).toEqual([
      {
        id: "safe",
        name: "Safe Link",
        desc: "Should render",
        url: "https://example.com/holdings",
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
            {
              slug: "lilu",
              name: "李录",
              description: "Himalaya Capital 持仓",
              url: "https://www.dataroma.com/m/holdings.php?m=HC",
              display_order: 7,
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
      {
        id: "lilu",
        name: "李录",
        desc: "Himalaya Capital 持仓",
        url: "https://www.dataroma.com/m/holdings.php?m=HC",
      },
    ]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("investor_links");
    expect(calls[0]).toContain("is_active=eq.true");
    expect(calls[0]).toContain("order=display_order.asc");
  });

  test("maps sector performance rows into ordered dashboard data", () => {
    expect(
      mapSectorPerformanceRows([
        {
          as_of: "2026-07-06",
          name: "Bitcoin",
          symbol: "BTC",
          category: "加密",
          display_order: 20,
          daily_return_pct: "1.4",
          one_month_return_pct: "4.0",
          three_month_return_pct: "-6.8",
          six_month_return_pct: "-30.8",
          ytd_return_pct: "-28.9",
        },
        {
          as_of: "2026-07-06",
          name: "科技",
          symbol: "XLK",
          category: "美股板块",
          display_order: 1,
          daily_return_pct: 1.7,
          one_month_return_pct: 1.8,
          three_month_return_pct: 34.2,
          six_month_return_pct: 25.2,
          ytd_return_pct: 27.2,
        },
      ])
    ).toEqual({
      asOf: "2026-07-06",
      source: "Supabase sector_performance",
      rows: [
        {
          asOf: "2026-07-06",
          name: "科技",
          symbol: "XLK",
          category: "美股板块",
          daily: 1.7,
          oneMonth: 1.8,
          threeMonth: 34.2,
          sixMonth: 25.2,
          ytd: 27.2,
        },
        {
          asOf: "2026-07-06",
          name: "Bitcoin",
          symbol: "BTC",
          category: "加密",
          daily: 1.4,
          oneMonth: 4,
          threeMonth: -6.8,
          sixMonth: -30.8,
          ytd: -28.9,
        },
      ],
    });
  });

  test("loads sector performance from supabase", async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        async json() {
          return [
            {
              as_of: "2026-07-06",
              name: "科技",
              symbol: "XLK",
              category: "美股板块",
              display_order: 1,
              daily_return_pct: 1.7,
              one_month_return_pct: 1.8,
              three_month_return_pct: 34.2,
              six_month_return_pct: 25.2,
              ytd_return_pct: 27.2,
            },
          ];
        },
      };
    };

    const result = await loadSectorPerformanceFromSupabase(fetchImpl, {
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].daily).toBe(1.7);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("sector_performance");
    expect(calls[0]).toContain("order=display_order.asc");
  });
});
