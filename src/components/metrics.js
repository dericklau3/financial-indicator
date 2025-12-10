import React from "react";
const h = React.createElement;
const formatPercent = (value) => value.toFixed(0);
const formatNumber = (value) => (typeof value === "number" ? value.toFixed(2) : "--");

export function Metrics({ metrics }) {
  const cards = [
    {
      title: "VIX (CBOE)",
      value: formatNumber(metrics.vix),
    },
    {
      title: "CNN恐慌/贪婪指数",
      value: formatPercent(metrics.cnnFearGreed),
    },
    {
      title: "Crypto恐慌/贪婪指数",
      value: formatPercent(metrics.cryptoFearGreed),
    },
  ];

  return h(
    "section",
    { className: "metrics" },
    cards.map((card) =>
      h(
        "article",
        { className: "metric-card", key: card.title },
        h("p", { className: "metric-card__title" }, card.title),
        h("p", { className: "metric-card__value" }, card.value)
      )
    )
  );
}
