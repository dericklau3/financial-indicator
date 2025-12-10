import React, { useState, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { monthlyReturns, upsertMonthlyReturn } from "./data/sp500-monthly.js";
import { marketMetrics, updateMetrics } from "./data/market-metrics.js";
import { Metrics } from "./components/metrics.js";
import { Heatmap } from "./components/heatmap.js";

const h = React.createElement;
const SENTIMENT_CACHE_KEY = "sentiment-cache-v1";
const PARTICIPATION_CACHE_KEY = "spx-participation-cache-v2";

const todayKey = () => new Date().toISOString().slice(0, 10);

const loadSentimentCache = () => {
  try {
    const raw = localStorage.getItem(SENTIMENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date !== todayKey()) return null;
    return parsed.values;
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

const loadParticipationCache = () => {
  try {
    const raw = localStorage.getItem(PARTICIPATION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.date !== todayKey()) return null;
    return parsed.values;
  } catch (err) {
    console.warn("读取参与度缓存失败", err);
    return null;
  }
};

const saveParticipationCache = (values) => {
  try {
    localStorage.setItem(
      PARTICIPATION_CACHE_KEY,
      JSON.stringify({ date: todayKey(), values })
    );
  } catch (err) {
    console.warn("写入参与度缓存失败", err);
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

const Hero = ({ onRefresh, onUpdateSentiment, onUpdateParticipation }) =>
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
    h(
      "div",
      { className: "actions" },
      h("button", { className: "ghost", onClick: onRefresh }, "Refresh View"),
      h("button", { className: "ghost", onClick: onUpdateParticipation }, "更新参与度"),
      h("button", { className: "primary", onClick: onUpdateSentiment }, "更新恐慌/贪婪指数")
    )
  );

function App() {
  const [returns, setReturns] = useState([...monthlyReturns]);
  const [metrics, setMetrics] = useState({ ...marketMetrics });

  const handleRefresh = useCallback(() => {
    setReturns((prev) => [...prev]);
    setMetrics((prev) => ({ ...prev }));
  }, []);

  useEffect(() => {
    const cached = loadSentimentCache();
    if (cached) {
      setMetrics((prev) => updateMetrics({ ...prev, ...cached }));
      return;
    }
    fetchFearGreed()
      .then((vals) => {
        setMetrics((prev) => updateMetrics({ ...prev, ...vals }));
      })
      .catch((err) => {
        console.warn("自动抓取情绪指标失败", err);
      });
  }, []);

  useEffect(() => {
    const cached = loadParticipationCache();
    if (cached) {
      setMetrics((prev) => updateMetrics({ ...prev, ...cached }));
      return;
    }
    fetchParticipationBoth()
      .then((vals) => {
        setMetrics((prev) => updateMetrics({ ...prev, ...vals }));
      })
      .catch((err) => {
        console.warn("自动抓取参与度失败", err);
      });
  }, []);

  const handleUpdateSentiment = useCallback(async () => {
    try {
      const fearGreed = await fetchFearGreed();
      setMetrics((prev) => updateMetrics({ ...prev, ...fearGreed }));
      saveSentimentCache(fearGreed);
      alert("情绪指标已更新。");
    } catch (err) {
      console.error(err);
      alert(`抓取失败：${err.message || err}`);
    }
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

  const handleUpdateParticipation = useCallback(async () => {
    try {
      const vals = await fetchParticipationBoth();
      setMetrics((prev) => updateMetrics({ ...prev, ...vals }));
      alert("标普参与度已更新。");
    } catch (err) {
      console.error(err);
      alert(`抓取失败：${err.message || err}`);
    }
  }, []);

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
  const cached = loadSentimentCache();
  if (cached) {
    return cached;
  }

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

  saveSentimentCache(values);
  return values;
}

function parseCloseFromCsv(text) {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const headerIdx = lines.findIndex((l) => /symbol/i.test(l) && /close/i.test(l));
  const dataIdx = headerIdx >= 0 ? headerIdx + 1 : lines.findIndex((l) => l.split(",").length >= 7);
  if (dataIdx < 0) throw new Error("未找到数据行");

  const header = headerIdx >= 0 ? lines[headerIdx] : "Symbol,Date,Time,Open,High,Low,Close,Volume";
  const headers = header.split(",").map((p) => p.trim().toLowerCase());
  const cells = lines[dataIdx].split(",").map((p) => p.trim());
  const closeIdx = headers.findIndex((h) => h === "close");
  const closeStr = closeIdx >= 0 ? cells[closeIdx] : cells[6];
  const close = Number(closeStr);
  if (!Number.isFinite(close)) throw new Error("收盘价解析失败");
  return close;
}

async function fetchSpxBreadth(ticker) {
  const lower = ticker.toLowerCase();
  const base = `https://stooq.pl/q/l/?s=${lower}&f=sd2t2ohlcv&h&e=csv`;
  const sources = [
    base,
    `https://r.jina.ai/http://stooq.pl/q/l/?s=${lower}&f=sd2t2ohlcv&h&e=csv`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(base)}`,
  ];

  let text = null;
  let lastErr = null;
  for (const url of sources) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const maybeText = await res.text();
      if (maybeText && maybeText.length > 10) {
        text = maybeText;
        break;
      }
    } catch (err) {
      lastErr = err;
    }
  }

  if (!text) {
    throw lastErr || new Error(`获取 ${ticker} 失败`);
  }

  const close = parseCloseFromCsv(text);
  return Math.round(close);
}

async function fetchParticipationBoth() {
  const cached = loadParticipationCache();
  if (cached) return cached;

  const [d20, d50] = await Promise.all([fetchSpxBreadth("s5tw"), fetchSpxBreadth("s5fi")]);
  const values = {
    spParticipation20: d20,
    spParticipation50: d50,
  };
  saveParticipationCache(values);
  return values;
}

  return h(
    "div",
    { className: "page" },
    h(Hero, {
      onRefresh: handleRefresh,
      onUpdateSentiment: handleUpdateSentiment,
      onUpdateParticipation: handleUpdateParticipation,
    }),
    h(Metrics, { metrics }),
    h(Heatmap, { data: returns, onUpdate: handleUpdateReturns })
  );
}

const mount = document.getElementById("root");
const root = createRoot(mount);
root.render(h(App));
