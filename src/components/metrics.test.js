import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Metrics } from "./metrics.js";

describe("Metrics", () => {
  test("renders TradingView breadth widgets below the sentiment cards", () => {
    const html = renderToStaticMarkup(
      React.createElement(Metrics, {
        metrics: {
          vix: 18.43,
          cnnFearGreed: 63,
          cryptoFearGreed: 31,
        },
      })
    );

    expect(html).toContain("Nasdaq Comp Stocks Above 20-Day Average");
    expect(html).toContain("S&amp;P 500 Stocks Above 20-Day Average");
    expect(html).toContain("S&amp;P 500 Stocks Above 50-Day Average");
    expect(html).toContain('data-symbol="INDEX:NCTW"');
    expect(html).toContain('data-symbol="INDEX:S5TW"');
    expect(html).toContain('data-symbol="INDEX:S5FI"');
  });
});
