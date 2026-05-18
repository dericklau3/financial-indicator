import React from "react";
const h = React.createElement;
const formatPercent = (value) => (typeof value === "number" ? value.toFixed(0) : "--");
const formatNumber = (value) => (typeof value === "number" ? value.toFixed(2) : "--");

const breadthWidgets = [
  {
    symbol: "INDEX:NCTW",
    label: "NCTW",
    title: "Nasdaq Comp Stocks Above 20-Day Average",
    pageUrl: "https://www.tradingview.com/symbols/INDEX-NCTW/",
  },
  {
    symbol: "INDEX:S5TW",
    label: "S5TW",
    title: "S&P 500 Stocks Above 20-Day Average",
    pageUrl: "https://www.tradingview.com/symbols/INDEX-S5TW/",
  },
  {
    symbol: "INDEX:S5FI",
    label: "S5FI",
    title: "S&P 500 Stocks Above 50-Day Average",
    pageUrl: "https://www.tradingview.com/symbols/INDEX-S5FI/",
  },
];

function TradingViewQuote({ widget }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    container.innerHTML = "";

    const widgetHost = document.createElement("div");
    widgetHost.className = "tradingview-widget-container__widget";
    container.appendChild(widgetHost);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: widget.symbol,
      width: "100%",
      isTransparent: true,
      colorTheme: "dark",
      locale: "en",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [widget.symbol]);

  return h(
    "div",
    {
      className: "tradingview-card__body tradingview-widget-container",
      "data-symbol": widget.symbol,
      ref: containerRef,
    },
    h(
      "a",
      {
        className: "tradingview-card__fallback",
        href: widget.pageUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      },
      "打开 TradingView"
    )
  );
}

export function Metrics({ metrics }) {
  const cards = [
    {
      title: "VIX (CBOE)",
      value: formatNumber(metrics.vix),
      sourceUrl: "https://finance.yahoo.com/quote/%5EVIX/",
    },
    {
      title: "CNN恐慌/贪婪指数",
      value: formatPercent(metrics.cnnFearGreed),
      sourceUrl: "https://www.cnn.com/markets/fear-and-greed",
    },
    {
      title: "Crypto恐慌/贪婪指数",
      value: formatPercent(metrics.cryptoFearGreed),
      sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
    },
  ];

  return h(
    React.Fragment,
    null,
    h(
      "section",
      { className: "metrics" },
      cards.map((card) =>
        h(
          "article",
          { className: "metric-card", key: card.title },
          h(
            "p",
            { className: "metric-card__title" },
            card.sourceUrl
              ? h(
                  "a",
                  {
                    href: card.sourceUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "metric-card__source-link",
                    title: "打开数据来源",
                  },
                  card.title
                )
              : card.title
          ),
          h("p", { className: "metric-card__value" }, card.value)
        )
      )
    ),
    h(
      "section",
      { className: "tradingview-breadth", "aria-label": "TradingView breadth indicators" },
      breadthWidgets.map((widget) =>
        h(
          "article",
          { className: "tradingview-card", key: widget.symbol },
          h(
            "a",
            {
              className: "tradingview-card__header",
              href: widget.pageUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              title: "打开 TradingView 页面",
            },
            h("span", { className: "tradingview-card__symbol" }, widget.label),
            h("span", { className: "tradingview-card__title" }, widget.title)
          ),
          h(TradingViewQuote, { widget })
        )
      )
    )
  );
}
