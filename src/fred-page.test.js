import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const mainSource = readFileSync(new URL("./main.js", import.meta.url), "utf8");

describe("FRED page wiring", () => {
  test("adds a FRED sidebar view backed by the official T5YIFR graph page embed", () => {
    expect(mainSource).toContain('id: "fred"');
    expect(mainSource).toContain('graphUrl: "https://fred.stlouisfed.org/graph/?id=T5YIFR"');
    expect(mainSource).toContain('iframeTitle: "FRED T5YIFR series page"');
    expect(mainSource).toContain("当通胀率处于低位时，是一个好的买入点");
  });

  test("adds a second FRED sidebar view backed by the official FEDFUNDS graph page embed", () => {
    expect(mainSource).toContain('id: "fedfunds"');
    expect(mainSource).toContain('desc: "联储利率图表"');
    expect(mainSource).toContain('sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS"');
    expect(mainSource).toContain('graphUrl: "https://fred.stlouisfed.org/graph/?id=FEDFUNDS"');
    expect(mainSource).toContain('iframeTitle: "FRED FEDFUNDS series page"');
  });

  test("renders external indicator iframes with restrictive browser policies", () => {
    expect(mainSource).toContain('sandbox: "allow-scripts allow-same-origin allow-popups"');
    expect(mainSource).toContain('referrerPolicy: "no-referrer"');
  });
});
