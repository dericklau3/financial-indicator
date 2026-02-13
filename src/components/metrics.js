import React from "react";
const h = React.createElement;
const formatPercent = (value) => value.toFixed(0);
const formatNumber = (value) => (typeof value === "number" ? value.toFixed(2) : "--");

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
  );
}
