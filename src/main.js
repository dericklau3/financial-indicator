import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createEmptyMetrics, updateMetrics } from "./data/market-metrics.js";
import { loadDashboardDataFromSupabase, loadInvestorLinksFromSupabase } from "./data/supabase.js";
import { Metrics } from "./components/metrics.js";
import { Heatmap } from "./components/heatmap.js";
import { Calculator } from "./components/calculator.js";

const h = React.createElement;

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
    )
  );

const SentimentDates = ({ metrics }) => {
  const latestDate =
    [metrics?.vixDate, metrics?.cnnFearGreedDate, metrics?.cryptoFearGreedDate]
      .filter((d) => typeof d === "string" && d.length)
      .sort()
      .pop() || "--";
  return h(
    "div",
    { className: "sentiment-date" },
    h("span", { className: "sentiment-date__label" }, "数据日期"),
    h("span", { className: "sentiment-date__value" }, latestDate)
  );
};

const FredPage = () =>
  h(
    "section",
    { className: "fred-page" },
    h(
      "div",
      { className: "fred-page__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "FRED Series"),
        h("h2", null, "5-Year, 5-Year Forward Inflation Expectation Rate")
      ),
      h(
        "a",
        {
          className: "fred-page__source",
          href: "https://fred.stlouisfed.org/series/T5YIFR",
          target: "_blank",
          rel: "noreferrer",
        },
        "打开原网页"
      )
    ),
    h(
      "div",
      { className: "fred-embed" },
      h("iframe", {
        src: "https://fred.stlouisfed.org/graph/?id=T5YIFR",
        title: "FRED T5YIFR series page",
        loading: "lazy",
      })
    )
  );

function App() {
  const [returns, setReturns] = useState([]);
  const [metrics, setMetrics] = useState(() => createEmptyMetrics());
  const [investorLinks, setInvestorLinks] = useState([]);
  const [view, setView] = useState("dashboard");
  const [loadError, setLoadError] = useState(null);
  const [investorLoadError, setInvestorLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        const { metrics: nextMetrics, returns: nextReturns } = await loadDashboardDataFromSupabase();
        if (cancelled) return;
        setMetrics(updateMetrics(createEmptyMetrics(), nextMetrics));
        setReturns(nextReturns);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInvestorLinks() {
      try {
        const links = await loadInvestorLinksFromSupabase();
        if (cancelled) return;
        setInvestorLinks(links);
        setInvestorLoadError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setInvestorLoadError(err instanceof Error ? err.message : String(err));
      }
    }

    loadInvestorLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", desc: "宏观热力图" },
    { id: "fred", label: "FRED", desc: "通胀预期图表" },
    { id: "calculator", label: "计算器", desc: "价格波动 / 卖权" },
    { id: "investors", label: "名人持仓", desc: "名人持仓" },
  ];

  const renderDashboard = () =>
    h(
      React.Fragment,
      null,
      h(Hero),
      h(SentimentDates, { metrics }),
      loadError
        ? h("p", { className: "eyebrow", role: "alert" }, `数据加载失败：${loadError}`)
        : null,
      h(Metrics, { metrics }),
      h(Heatmap, { data: returns })
    );

  const renderInvestors = () =>
    h(
      "section",
      { className: "investor-page" },
      h("p", { className: "eyebrow" }, "Investor Radar"),
      h("h2", null, "名人持仓跟踪"),
      investorLoadError
        ? h("p", { className: "eyebrow", role: "alert" }, `持仓链接加载失败：${investorLoadError}`)
        : null,
      h(
        "div",
        { className: "investor-grid" },
        investorLinks.length
          ? investorLinks.map((item) =>
              h(
                "a",
                {
                  key: item.id,
                  className: "investor-card",
                  href: item.url,
                  target: "_blank",
                  rel: "noreferrer",
                },
                h("div", { className: "investor-card__title" }, item.name),
                h("p", { className: "investor-card__desc" }, item.desc),
                h("span", { className: "investor-card__cta" }, "查看持仓 →")
              )
            )
          : h("p", { className: "muted" }, "暂无持仓链接")
      )
    );

  const renderPage = () => {
    if (view === "dashboard") return renderDashboard();
    if (view === "fred") return h(FredPage);
    if (view === "calculator") return h(Calculator);
    if (view === "investors") return renderInvestors();
    return null;
  };

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
      h("div", { className: "page" }, renderPage())
    )
  );
}

const mount = document.getElementById("root");
const root = createRoot(mount);
root.render(h(App));
