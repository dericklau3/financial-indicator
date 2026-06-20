import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const mainSource = readFileSync(new URL("./main.js", import.meta.url), "utf8");

describe("GuruFocus page wiring", () => {
  test("adds a sidebar view for the S&P 500 PE Ratio page", () => {
    expect(mainSource).toContain('id: "sp500pe"');
    expect(mainSource).toContain('label: "S&P 500 PE"');
    expect(mainSource).toContain('desc: "10年估值图表"');
    expect(mainSource).toContain('title: "S&P 500 PE Ratio"');
    expect(mainSource).toContain('sourceUrl: "https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio"');
    expect(mainSource).toContain('iframeTitle: "GuruFocus S&P 500 PE Ratio 10Y page"');
  });

  test("adds a sidebar view for the Nasdaq 100 PE Ratio page", () => {
    expect(mainSource).toContain('id: "nasdaq100pe"');
    expect(mainSource).toContain('label: "Nasdaq 100 PE"');
    expect(mainSource).toContain('title: "Nasdaq 100 PE Ratio"');
    expect(mainSource).toContain('sourceUrl: "https://www.gurufocus.com/economic_indicators/6778/nasdaq-100-pe-ratio"');
    expect(mainSource).toContain('iframeTitle: "GuruFocus Nasdaq 100 PE Ratio 10Y page"');
  });

  test("renders external indicator iframes with restrictive browser policies", () => {
    expect(mainSource).toContain('sandbox: "allow-scripts allow-same-origin allow-popups"');
    expect(mainSource).toContain('referrerPolicy: "no-referrer"');
  });
});
