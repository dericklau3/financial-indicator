import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calculator,
  calculateActualCashRequired,
  calculateSellPutAnnualizedYield,
  normalizeNumericInput,
  parseNumericInput,
} from "./calculator.js";

describe("Calculator numeric inputs", () => {
  test("renders a clean calculator without default input values", () => {
    const html = renderToStaticMarkup(React.createElement(Calculator));

    expect(html).not.toContain('value="100"');
    expect(html).not.toContain('value="8"');
    expect(html).not.toContain('value="6"');
    expect(html).not.toContain('value="10000"');
    expect(html).not.toContain('value="150"');
    expect(html).not.toContain('value="225"');
    expect(html).not.toContain('value="3.2"');
    expect(html).not.toContain('value="1"');
    expect(html).not.toContain("$--");
    expect(html).not.toContain(">0</div>");
    expect(html).not.toContain(">0 张");
  });

  test("keeps decimal editing states while rejecting invalid characters", () => {
    expect(normalizeNumericInput("12.")).toBe("12.");
    expect(normalizeNumericInput(".5")).toBe(".5");
    expect(normalizeNumericInput("")).toBe("");
    expect(normalizeNumericInput("12..3", "12.")).toBe("12.");
    expect(normalizeNumericInput("abc", "")).toBe("");
  });

  test("parses only meaningful numeric input for calculations", () => {
    expect(parseNumericInput("12.")).toBe(12);
    expect(parseNumericInput(".5")).toBe(0.5);
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput(".")).toBeNull();
  });

  test("renders preset budget buttons and expiration based annualized yield fields", () => {
    const html = renderToStaticMarkup(React.createElement(Calculator));

    expect(html).toContain("10000");
    expect(html).toContain("20000");
    expect(html).toContain("50000");
    expect(html).toContain("到期日");
    expect(html).toContain("年化收益");
    expect(html).toContain("按行权价占用资金年化");
  });

  test("annualizes sell put premium by occupied strike capital and days to expiration", () => {
    expect(
      calculateSellPutAnnualizedYield({
        strike: 60,
        premium: 7,
        contracts: 2,
        expirationDate: "2026-08-20",
        currentDate: new Date(2026, 6, 21),
      })
    ).toBeCloseTo(1.419444, 6);

    expect(
      calculateSellPutAnnualizedYield({
        strike: 0,
        premium: 7,
        contracts: 2,
        expirationDate: "2026-08-20",
        currentDate: new Date(2026, 6, 21),
      })
    ).toBeNull();
  });

  test("calculates actual cash required after applying received premium", () => {
    expect(
      calculateActualCashRequired({
        strike: 60,
        premium: 12.5,
        contracts: 4,
      })
    ).toBe(19000);

    expect(
      calculateActualCashRequired({
        strike: 60,
        premium: 70,
        contracts: 4,
      })
    ).toBe(0);
  });
});
