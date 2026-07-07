import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SectorPerformance } from "./sector-performance.js";

describe("SectorPerformance", () => {
  test("renders sector performance ranges and crypto rows", () => {
    const html = renderToStaticMarkup(
      React.createElement(SectorPerformance, {
        snapshot: {
          asOf: "2026-07-06",
          source: "Supabase sector_performance",
          rows: [
            {
              name: "科技",
              symbol: "XLK",
              category: "美股板块",
              asOf: "2026-07-06",
              daily: 1.7,
              oneMonth: 1.8,
              threeMonth: 34.2,
              sixMonth: 25.2,
              ytd: 27.2,
            },
            {
              name: "Bitcoin",
              symbol: "BTC",
              category: "加密",
              asOf: "2026-07-05",
              daily: 1.4,
              oneMonth: 4,
              threeMonth: -6.8,
              sixMonth: -30.8,
              ytd: -28.9,
            },
          ],
        },
      })
    );

    expect(html).toContain("板块表现");
    expect(html).toContain("日涨跌");
    expect(html).toContain("1月");
    expect(html).toContain("3月");
    expect(html).toContain("6月");
    expect(html).toContain("今年以来");
    expect(html).toContain("科技");
    expect(html).toContain("加密");
    expect(html).toContain("Bitcoin");
    expect(html).toContain("2026-07-06");
    expect(html).toContain("2026-07-05");
  });

  test("renders loading, error, and empty states compactly", () => {
    expect(renderToStaticMarkup(React.createElement(SectorPerformance, { isLoading: true }))).toContain(
      "板块表现加载中"
    );
    expect(
      renderToStaticMarkup(React.createElement(SectorPerformance, { loadError: "missing table" }))
    ).toContain("板块表现加载失败：missing table");
    expect(
      renderToStaticMarkup(
        React.createElement(SectorPerformance, {
          snapshot: { asOf: null, source: "Supabase sector_performance", rows: [] },
        })
      )
    ).toContain("暂无板块表现数据");
  });
});
