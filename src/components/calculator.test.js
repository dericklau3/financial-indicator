import { describe, expect, test } from "bun:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Calculator,
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
});
