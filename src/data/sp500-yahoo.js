const getJsonPayload = (text) => {
  const start = text.indexOf("{");
  if (start < 0) {
    throw new Error("未获取到有效的 Yahoo 月线数据");
  }

  return JSON.parse(text.slice(start));
};

export function parseYahooMonthlyReturns(text, now = new Date()) {
  const json = getJsonPayload(text);
  const result = json?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const adjClose = result?.indicators?.adjclose?.[0]?.adjclose || [];
  const close = result?.indicators?.quote?.[0]?.close || [];

  const rows = timestamps
    .map((timestamp, index) => ({
      dt: new Date(timestamp * 1000),
      price: adjClose[index] ?? close[index],
    }))
    .filter((item) => !Number.isNaN(item.dt.getTime()) && Number.isFinite(item.price));

  if (rows.length < 2) {
    throw new Error("有效数据不足");
  }

  const lastComplete = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastCompleteYm = lastComplete.getFullYear() * 12 + (lastComplete.getMonth() + 1);
  const startYm = lastCompleteYm - 15 * 12 + 2;
  const out = [];

  for (let i = 1; i < rows.length; i += 1) {
    const ym = rows[i].dt.getFullYear() * 12 + (rows[i].dt.getMonth() + 1);
    if (ym > lastCompleteYm) break;

    const ret = (rows[i].price / rows[i - 1].price - 1) * 100;
    if (ym >= startYm) {
      out.push({
        month: rows[i].dt.toISOString().slice(0, 7),
        returnPct: Number(ret.toFixed(2)),
      });
    }
  }

  if (!out.length) {
    throw new Error("未生成月度回报");
  }

  return out;
}
