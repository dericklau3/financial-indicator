import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calculator,
  calculateActualCashRequired,
  calculateSellPutPremiumYield,
  calculateSellPutAnnualizedYield,
  formatTargetPriceInput,
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

  test("does not use browser numeric patterns that block decimal editing", () => {
    const html = renderToStaticMarkup(React.createElement(Calculator));

    expect(html).not.toContain("pattern=");
  });

  test("reserves enough desktop width for tiny target price inputs", () => {
    const css = readFileSync("styles.css", "utf8");

    expect(css).toContain("minmax(240px, 1.2fr)");
    expect(css).toContain("grid-template-columns: 38px minmax(0, 1fr)");
  });

  test("keeps decimal editing states while rejecting invalid characters", () => {
    expect(normalizeNumericInput("12.")).toBe("12.");
    expect(normalizeNumericInput(".5")).toBe(".5");
    expect(normalizeNumericInput("")).toBe("");
    expect(normalizeNumericInput("12..3", "12.")).toBe("12.3");
    expect(normalizeNumericInput("12.3.", "12.3")).toBe("123.");
    expect(normalizeNumericInput("12..3", "12.3")).toBe("12.3");
    expect(normalizeNumericInput("12。", "12")).toBe("12.");
    expect(normalizeNumericInput("12．3", "12")).toBe("12.3");
    expect(normalizeNumericInput("12,3", "12")).toBe("12.3");
    expect(normalizeNumericInput("abc", "")).toBe("");
  });

  test("parses only meaningful numeric input for calculations", () => {
    expect(parseNumericInput("12.")).toBe(12);
    expect(parseNumericInput(".5")).toBe(0.5);
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput(".")).toBeNull();
  });

  test("keeps tiny target prices visible instead of rounding them to zero", () => {
    expect(formatTargetPriceInput(0.000000123)).toBe("0.000000123");
    expect(formatTargetPriceInput(12.3456)).toBe("12.35");
    expect(formatTargetPriceInput(null)).toBe("");
  });

  test("renders preset budget buttons and expiration based annualized yield fields", () => {
    const html = renderToStaticMarkup(React.createElement(Calculator));

    expect(html).toContain("10000");
    expect(html).toContain("20000");
    expect(html).toContain("50000");
    expect(html).toContain("到期日");
    expect(html).toContain("权利金收益率");
    expect(html).toContain("收到权利金 ÷ 占用资金");
    expect(html).toContain("年化收益");
    expect(html).toContain("按行权价占用资金年化");
  });

  test("calculates sell put premium yield against occupied strike capital", () => {
    expect(
      calculateSellPutPremiumYield({
        strike: 60,
        premium: 12,
        contracts: 4,
      })
    ).toBeCloseTo(0.2, 6);

    expect(
      calculateSellPutPremiumYield({
        strike: 0,
        premium: 12,
        contracts: 4,
      })
    ).toBeNull();
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
