import { describe, expect, test } from "bun:test";
import { parseSpxMonthlyReturnsCsv } from "./sp500-parser.js";

describe("parseSpxMonthlyReturnsCsv", () => {
  test("parses stooq csv with Date header", () => {
    const csv = [
      "Date,Open,High,Low,Close,Volume",
      "2025-01-31,0,0,0,6040.53,0",
      "2025-02-28,0,0,0,5954.5,0",
      "2025-03-31,0,0,0,5611.85,0",
    ].join("\n");

    expect(parseSpxMonthlyReturnsCsv(csv, new Date("2025-04-15T00:00:00Z"))).toEqual([
      { month: "2025-02", returnPct: -1.42 },
      { month: "2025-03", returnPct: -5.75 },
    ]);
  });

  test("parses proxy-wrapped csv content", () => {
    const csv = [
      "Title: cached response",
      "",
      "Date,Open,High,Low,Close,Volume",
      "2025-08-29,0,0,0,6433.12,0",
      "2025-09-30,0,0,0,6660.78,0",
      "2025-10-31,0,0,0,6811.83,0",
    ].join("\n");

    expect(parseSpxMonthlyReturnsCsv(csv, new Date("2025-11-20T00:00:00Z"))).toEqual([
      { month: "2025-09", returnPct: 3.54 },
      { month: "2025-10", returnPct: 2.27 },
    ]);
  });

  test("throws when csv header is missing", () => {
    expect(() => parseSpxMonthlyReturnsCsv("no csv here", new Date("2025-04-15T00:00:00Z"))).toThrow(
      "数据行为空或格式不符"
    );
  });
});
