import { describe, expect, test } from "bun:test";
import { fetchSpxMonthlyReturnsFromSources } from "./sp500-fetch.js";

const createOkResponse = (text) => ({
  ok: true,
  status: 200,
  async text() {
    return text;
  },
});

describe("fetchSpxMonthlyReturnsFromSources", () => {
  test("parses yahoo monthly chart data from jina proxy", async () => {
    const fetchImpl = async () =>
      createOkResponse(
        [
          "Title:",
          "",
          "URL Source: http://query1.finance.yahoo.com/v8/finance/chart/^GSPC?range=20y&interval=1mo&includePrePost=false",
          "",
          "Markdown Content:",
          '{"chart":{"result":[{"timestamp":[1738386000,1740805200,1743480000],"indicators":{"adjclose":[{"adjclose":[6032.3798828125,5881.6298828125,6040.52978515625]}]}}],"error":null}}',
        ].join("\n")
      );

    await expect(
      fetchSpxMonthlyReturnsFromSources(fetchImpl, new Date("2025-05-15T00:00:00Z"))
    ).resolves.toEqual([
      { month: "2025-03", returnPct: -2.5 },
      { month: "2025-04", returnPct: 2.7 },
    ]);
  });

  test("falls through invalid proxy text until a parsable csv is found", async () => {
    const responses = [
      createOkResponse("Access denied"),
      createOkResponse("still not csv"),
      createOkResponse(
        [
          "Date,Open,High,Low,Close,Volume",
          "2025-01-31,0,0,0,6040.53,0",
          "2025-02-28,0,0,0,5954.50,0",
          "2025-03-31,0,0,0,5611.85,0",
        ].join("\n")
      ),
    ];

    const fetchImpl = async () => responses.shift();

    await expect(
      fetchSpxMonthlyReturnsFromSources(fetchImpl, new Date("2025-04-15T00:00:00Z"))
    ).resolves.toEqual([
      { month: "2025-02", returnPct: -1.42 },
      { month: "2025-03", returnPct: -5.75 },
    ]);
  });

  test("throws the last error when all sources fail", async () => {
    const fetchImpl = async () => createOkResponse("not csv anywhere");

    await expect(
      fetchSpxMonthlyReturnsFromSources(fetchImpl, new Date("2025-04-15T00:00:00Z"))
    ).rejects.toThrow("返回内容为空");
  });
});
