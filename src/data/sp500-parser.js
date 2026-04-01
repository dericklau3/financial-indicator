const parseCsvRows = (text) =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export function parseSpxMonthlyReturnsCsv(text, now = new Date()) {
  const lines = parseCsvRows(text);
  const headerIndex = lines.findIndex((line) => /^date\s*,/i.test(line));

  if (headerIndex < 0) {
    throw new Error("数据行为空或格式不符");
  }

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;

    const [dateStr, , , , closeStr] = parts;
    const dt = new Date(dateStr);
    const close = Number(closeStr);

    if (Number.isNaN(dt.getTime()) || !Number.isFinite(close)) continue;
    rows.push({ dt, close });
  }

  rows.sort((a, b) => a.dt - b.dt);
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

    const ret = (rows[i].close / rows[i - 1].close - 1) * 100;
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
