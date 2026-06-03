import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createEmptyMetrics, updateMetrics } from "./data/market-metrics.js";
import { loadDashboardDataFromSupabase, loadInvestorLinksFromSupabase } from "./data/supabase.js";
import { Metrics } from "./components/metrics.js";
import { Heatmap } from "./components/heatmap.js";
import { Calculator } from "./components/calculator.js";
import { getInitialView, saveSelectedView } from "./view-state.js";

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

const ExternalIndicatorPage = ({ eyebrow, title, hint, sourceUrl, graphUrl, iframeTitle }) =>
  h(
    "section",
    { className: "fred-page" },
    h(
      "div",
      { className: "fred-page__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, eyebrow),
        h("h2", null, title),
        h(
          "p",
          { className: "fred-page__hint" },
          hint
        )
      ),
      h(
        "a",
        {
          className: "fred-page__source",
          href: sourceUrl,
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
        src: graphUrl,
        title: iframeTitle,
        loading: "lazy",
      })
    )
  );

function App() {
  const [returns, setReturns] = useState([]);
  const [metrics, setMetrics] = useState(() => createEmptyMetrics());
  const [investorLinks, setInvestorLinks] = useState([]);
  const [view, setView] = useState(() => getInitialView());
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
    { id: "fedfunds", label: "FRED 利率", desc: "联储利率图表" },
    { id: "sp500pe", label: "S&P 500 PE", desc: "10年估值图表" },
    { id: "nasdaq100pe", label: "Nasdaq 100 PE", desc: "10年估值图表" },
    { id: "calculator", label: "计算器", desc: "价格波动 / 卖权" },
    { id: "investors", label: "名人持仓", desc: "名人持仓" },
  ];

  const selectView = (nextView) => {
    saveSelectedView(nextView);
    setView(nextView);
  };

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
    if (view === "fred") {
      return h(ExternalIndicatorPage, {
        eyebrow: "FRED Series",
        title: "5-Year, 5-Year Forward Inflation Expectation Rate",
        hint: "当通胀率处于低位时，是一个好的买入点",
        sourceUrl: "https://fred.stlouisfed.org/series/T5YIFR",
        graphUrl: "https://fred.stlouisfed.org/graph/?id=T5YIFR",
        iframeTitle: "FRED T5YIFR series page",
      });
    }
    if (view === "fedfunds") {
      return h(ExternalIndicatorPage, {
        eyebrow: "FRED Series",
        title: "Federal Funds Effective Rate",
        hint: "跟踪美联储有效联邦基金利率，观察利率周期和货币政策环境",
        sourceUrl: "https://fred.stlouisfed.org/series/FEDFUNDS",
        graphUrl: "https://fred.stlouisfed.org/graph/?id=FEDFUNDS",
        iframeTitle: "FRED FEDFUNDS series page",
      });
    }
    if (view === "sp500pe") {
      return h(ExternalIndicatorPage, {
        eyebrow: "GuruFocus Market Valuation",
        title: "S&P 500 PE Ratio",
        hint: "建议查看 10Y 区间，用于观察标普500估值所处位置",
        sourceUrl: "https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio",
        graphUrl: "https://www.gurufocus.com/economic_indicators/57/sp-500-pe-ratio",
        iframeTitle: "GuruFocus S&P 500 PE Ratio 10Y page",
      });
    }
    if (view === "nasdaq100pe") {
      return h(ExternalIndicatorPage, {
        eyebrow: "GuruFocus Market Valuation",
        title: "Nasdaq 100 PE Ratio",
        hint: "建议查看 10Y 区间，用于观察纳斯达克100估值所处位置",
        sourceUrl: "https://www.gurufocus.com/economic_indicators/6778/nasdaq-100-pe-ratio",
        graphUrl: "https://www.gurufocus.com/economic_indicators/6778/nasdaq-100-pe-ratio",
        iframeTitle: "GuruFocus Nasdaq 100 PE Ratio 10Y page",
      });
    }
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
              onClick: () => selectView(item.id),
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
