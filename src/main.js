import React, { useState, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { monthlyReturns, upsertMonthlyReturn } from "./data/sp500-monthly.js";
import { marketMetrics, updateMetrics } from "./data/market-metrics.js";
import { Metrics } from "./components/metrics.js";
import { Heatmap } from "./components/heatmap.js";
import { Calculator } from "./components/calculator.js";

const h = React.createElement;
const SENTIMENT_CACHE_KEY = "sentiment-cache-v1";

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadSentimentCache = () => {
  try {
    const raw = localStorage.getItem(SENTIMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.values ? { date: parsed?.date, values: parsed.values } : null;
  } catch (err) {
    console.warn("读取情绪缓存失败", err);
    return null;
  }
};

const saveSentimentCache = (values) => {
  try {
    localStorage.setItem(
      SENTIMENT_CACHE_KEY,
      JSON.stringify({ date: todayKey(), values })
    );
  } catch (err) {
    console.warn("写入情绪缓存失败", err);
  }
};

const getStreak = (returns) => {
  if (!returns.length) return "--";
  let count = 1;
  let direction = returns[returns.length - 1].returnPct >= 0 ? "up" : "down";
  for (let i = returns.length - 2; i >= 0; i -= 1) {
    const sign = returns[i].returnPct >= 0 ? "up" : "down";
    if (sign === direction) {
      count += 1;
    } else {
      break;
    }
  }
  const arrow = direction === "up" ? "↑" : "↓";
  return `${arrow} ${count} 月`;
};

const Hero = () =>
  h(
    "header",
    { className: "hero" },
    h(
      "div",
      { className: "brand" },
      h("div", { className: "dot" }),
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "Market Dashboard"),
        h("h1", null, "US Equity & Macro Pulse")
      )
    ),
    h("div", { className: "actions" })
  );

function App() {
  const [returns, setReturns] = useState([...monthlyReturns]);
  const [metrics, setMetrics] = useState({ ...marketMetrics });
  const [view, setView] = useState("dashboard");

  const hasFullSentiment = (values) =>
    typeof values?.vix === "number" &&
    typeof values?.cnnFearGreed === "number" &&
    typeof values?.cryptoFearGreed === "number";

  useEffect(() => {
    refreshSentiment().catch((err) => {
      console.warn("自动抓取情绪指标失败", err);
    });
  }, []);

  const handleUpdateReturns = useCallback(async () => {
    try {
      const latestReturns = await fetchSpxMonthlyReturns();
      setReturns(latestReturns);
      alert("月度回报已更新。");
    } catch (err) {
      console.error(err);
      alert(`抓取失败：${err.message || err}`);
    }
  }, []);

  async function refreshSentiment({ force = false } = {}) {
    const cached = force ? null : loadSentimentCache();
    const cachedValues = cached?.values;
    const cachedIsFresh = cached?.date === todayKey();

    if (cachedValues && hasFullSentiment(cachedValues)) {
      setMetrics((prev) => updateMetrics({ ...prev, ...cachedValues }));
      if (cachedIsFresh) return cachedValues;
    }

    if (cachedValues && !hasFullSentiment(cachedValues)) {
      // Render any cached subset first to reduce perceived latency.
      setMetrics((prev) => updateMetrics({ ...prev, ...cachedValues }));
    }

    const [fearGreed, vix] = await Promise.all([fetchFearGreed(), fetchVix()]);
    const merged = { ...fearGreed, ...vix };
    saveSentimentCache(merged);
    setMetrics((prev) => updateMetrics({ ...prev, ...merged }));
    return merged;
  }

async function fetchSpxMonthlyReturns() {
  const sources = [
    "https://stooq.pl/q/d/l/?s=%5Espx&i=m",
    "https://r.jina.ai/http://stooq.pl/q/d/l/?s=%5Espx&i=m",
    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://stooq.pl/q/d/l/?s=%5Espx&i=m")}`,
  ];

  let text = null;
  let lastErr = null;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
      if (text && text.length > 20) break;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!text) {
    throw lastErr || new Error("获取标普数据失败");
  }

  const lines = text.trim().split("\n");
  // Handle jina proxy wrapping: find the first line that starts with "Data"
  const dataStart = lines.findIndex((l) => l.startsWith("Data") || l.startsWith("data"));
  if (dataStart > 0) {
    lines.splice(0, dataStart);
  }
  if (lines.length < 3 || !lines[0].toLowerCase().startsWith("data")) {
    throw new Error("数据行为空或格式不符");
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = lines[i].split(",");
    if (parts.length < 5) continue;
    const [dateStr, , , , closeStr] = parts;
    const dt = new Date(dateStr);
    const close = Number(closeStr);
    if (!Number.isFinite(close)) continue;
    rows.push({ dt, close });
  }
  rows.sort((a, b) => a.dt - b.dt);
  if (rows.length < 2) throw new Error("有效数据不足");

  const now = new Date();
  const lastComplete = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastCompleteYm = lastComplete.getFullYear() * 12 + (lastComplete.getMonth() + 1);
  // +2 shifts the inclusive window so a 15-year span ends at lastComplete and starts at the Jan of (lastComplete.year - 14)
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
  if (!out.length) throw new Error("未生成月度回报");
  return out;
}

async function fetchFearGreed() {
  const cnnUrl = "https://r.jina.ai/https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
  const cryptoUrl = "https://api.allorigins.win/raw?url=https://api.alternative.me/fng/?limit=1";

  const [cnnText, cryptoJson] = await Promise.all([
    fetch(cnnUrl).then((r) => {
      if (!r.ok) throw new Error(`CNN指数请求失败 ${r.status}`);
      return r.text();
    }),
    fetch(cryptoUrl).then((r) => {
      if (!r.ok) throw new Error(`Crypto指数请求失败 ${r.status}`);
      return r.json();
    }),
  ]);

  const start = cnnText.indexOf("{");
  if (start < 0) throw new Error("CNN 指数解析失败");
  const cnn = JSON.parse(cnnText.slice(start));
  const cnnScore = Number(cnn?.fear_and_greed?.score);
  const cryptoScore = Number(cryptoJson?.data?.[0]?.value);

  const values = {
    cnnFearGreed: Number.isFinite(cnnScore) ? Math.round(cnnScore) : undefined,
    cryptoFearGreed: Number.isFinite(cryptoScore) ? Math.round(cryptoScore) : undefined,
  };

  return values;
}

async function fetchVix() {
  const sources = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d"
    )}`,
    "https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d",
  ];

  const text = await fetchTextFromSources(sources, 20);
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) throw new Error("VIX 数据无效");
  const json = JSON.parse(text.slice(jsonStart));
  const close =
    json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter((v) => Number.isFinite(v)).pop() ??
    json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!Number.isFinite(close)) throw new Error("VIX 数据无效");
  const values = { vix: Number(close.toFixed(2)) };
  return values;
}

function parseCloseFromCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const csvLines = lines.filter((l) => l.includes(","));
  const headerLine = csvLines.find((l) => /symbol/i.test(l) && /close/i.test(l));
  const headerIdx = headerLine ? csvLines.indexOf(headerLine) : -1;
  const headers = headerLine
    ? headerLine.split(",").map((p) => p.trim().toLowerCase())
    : ["symbol", "date", "time", "open", "high", "low", "close", "volume"];

  const dataLine =
    headerIdx >= 0
      ? csvLines.slice(headerIdx + 1).find((l) => l.split(",").length >= headers.length)
      : csvLines.find((l) => l.split(",").length >= headers.length);

  if (!dataLine) throw new Error("未找到数据行");

  const cells = dataLine.split(",").map((p) => p.trim());
  const closeIdx = headers.findIndex((h) => h === "close");
  const scrub = (val) => Number(val.replace(/[^0-9.+-]/g, ""));

  const candidate = closeIdx >= 0 && cells[closeIdx] ? cells[closeIdx] : cells[cells.length - 2] || cells[cells.length - 1];
  let close = candidate ? scrub(candidate) : NaN;

  if (!Number.isFinite(close)) {
    // Fallback: pick the last numeric cell in the row.
    const numerics = cells.map(scrub).filter((n) => Number.isFinite(n));
    close = numerics.length ? numerics[numerics.length - 1] : NaN;
  }

  if (!Number.isFinite(close)) throw new Error("收盘价解析失败");
  return close;
}

async function fetchTextFromSources(sources, minLength = 50) {
  let text = null;
  let lastErr = null;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const maybeText = await res.text();
      if (maybeText && maybeText.length >= minLength) {
        text = maybeText;
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (!text) {
    throw lastErr || new Error("未获取到文本");
  }
  return text;
}

async function fetchTradingViewLast(ticker) {
  const path = `https://www.tradingview.com/symbols/${ticker}/`;
  const sources = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(path)}`,
    `https://r.jina.ai/https://${path.replace("https://", "")}`,
    `https://r.jina.ai/http://${path.replace("https://", "")}`,
  ];

  const text = await fetchTextFromSources(sources, 50);

  const lpMatch = text.match(/\"lp\":\s*([0-9]+(?:\.[0-9]+)?)/);
  if (lpMatch) {
    return Number(lpMatch[1]);
  }

  const priceMatch =
    text.match(/\"regularMarketPrice\":\s*([0-9]+(?:\.[0-9]+)?)/) ||
    text.match(/\"last\"\s*:\s*([0-9]+(?:\.[0-9]+)?)/) ||
    text.match(/\"price\"\s*:\s*([0-9]+(?:\.[0-9]+)?)/);
  if (priceMatch) {
    return Number(priceMatch[1]);
  }

  // Fallback: attempt to parse via CSV if response accidentally a CSV from proxy.
  try {
    const close = parseCloseFromCsv(text);
    return close;
  } catch (e) {
    throw new Error("未解析到最新价");
  }
}

async function fetchTradingViewScanner(tickers) {
  const payload = JSON.stringify({
    symbols: { tickers, query: { types: [] } },
    columns: ["close"],
  });

  const endpoints = [
    "https://scanner.tradingview.com/america/scan",
    "https://cors.isomorphic-git.org/https://scanner.tradingview.com/america/scan",
    "https://thingproxy.freeboard.io/fetch/https://scanner.tradingview.com/america/scan",
  ];

  let lastErr = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://www.tradingview.com",
          Origin: "https://www.tradingview.com",
        },
        body: payload,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json?.data?.length) throw new Error("TradingView 扫描器无数据");

      const map = {};
      json.data.forEach((item) => {
        const symbol = item?.s;
        const [close] = item?.d || [];
        if (symbol && Number.isFinite(close)) {
          map[symbol] = close;
        }
      });

      if (Object.keys(map).length) return map;
      throw new Error("TradingView 扫描器未返回价格");
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("TradingView 扫描器请求失败");
}

async function fetchYahooBreadth(symbol) {
  const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const sources = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`,
    `https://r.jina.ai/https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=5d&interval=1d`,
  ];

  const text = await fetchTextFromSources(sources, 20);
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) throw new Error("Yahoo 数据无效");
  const json = JSON.parse(text.slice(jsonStart));
  const close =
    json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter((v) => Number.isFinite(v)).pop() ??
    json?.chart?.result?.[0]?.meta?.regularMarketPrice;
  if (!Number.isFinite(close)) throw new Error("Yahoo 数据无效");
  return Math.round(close);
}

  async function fetchParticipationBoth() {
    // kept for backward compatibility; participation指标已下线
    throw new Error("参与度已下线");
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", desc: "宏观热力图" },
    { id: "calculator", label: "计算器", desc: "价格波动 / 卖权" },
  ];

  const renderDashboard = () =>
    h(
      React.Fragment,
      null,
      h(Hero),
      h(Metrics, { metrics }),
      h(Heatmap, { data: returns, onUpdate: handleUpdateReturns })
    );

  return h(
    "div",
    { className: "app-shell" },
    h(
      "aside",
      { className: "sidebar" },
      h(
        "div",
        { className: "sidebar__brand" },
        h("div", { className: "dot" }),
        h("div", null, h("p", { className: "eyebrow" }, "Market Pulse"), h("h2", null, "Radar"))
      ),
      h(
        "nav",
        { className: "sidebar__nav" },
        navItems.map((item) =>
          h(
            "button",
            {
              key: item.id,
              className: `sidebar__link ${view === item.id ? "active" : ""}`,
              onClick: () => setView(item.id),
            },
            h("div", { className: "sidebar__link__title" }, item.label),
            h("p", { className: "sidebar__link__desc" }, item.desc)
          )
        )
      ),
      h(
        "div",
        { className: "sidebar__foot" },
        h("span", { className: "pill" }, "每日刷新 · 实时情绪")
      )
    ),
    h(
      "main",
      { className: "content" },
      h("div", { className: "page" }, view === "dashboard" ? renderDashboard() : h(Calculator))
    )
  );
}

const mount = document.getElementById("root");
const root = createRoot(mount);
root.render(h(App));
