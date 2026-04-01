import { parseSpxMonthlyReturnsCsv } from "./sp500-parser.js";
import { parseYahooMonthlyReturns } from "./sp500-yahoo.js";

export async function fetchSpxMonthlyReturnsFromSources(fetchImpl, now = new Date()) {
  const sources = [
    {
      url: "https://r.jina.ai/http://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=20y&interval=1mo&includePrePost=false",
      parse: parseYahooMonthlyReturns,
    },
    {
      url: "https://r.jina.ai/http://query1.finance.yahoo.com/v8/finance/chart/^GSPC?range=20y&interval=1mo&includePrePost=false",
      parse: parseYahooMonthlyReturns,
    },
    {
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent("https://stooq.pl/q/d/l/?s=%5Espx&i=m")}`,
      parse: parseSpxMonthlyReturnsCsv,
    },
    {
      url: "https://r.jina.ai/http://stooq.pl/q/d/l/?s=%5Espx&i=m",
      parse: parseSpxMonthlyReturnsCsv,
    },
  ];

  let lastErr = null;

  for (const source of sources) {
    try {
      const res = await fetchImpl(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      if (!text || text.length <= 20) {
        throw new Error("返回内容为空");
      }

      return source.parse(text, now);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("获取标普数据失败");
}
