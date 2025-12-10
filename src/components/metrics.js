import React from "react";
const h = React.createElement;
const formatPercent = (value) => `${value.toFixed(0)}%`;

export function Metrics({ metrics }) {
  const cards = [
    {
      title: "标普20日参与度",
      value: formatPercent(metrics.spParticipation20),
      hint: "过去20日上涨股票占比",
    },
    {
      title: "标普50日参与度",
      value: formatPercent(metrics.spParticipation50),
      hint: "过去50日上涨股票占比",
    },
    {
      title: "CNN恐慌/贪婪指数",
      value: formatPercent(metrics.cnnFearGreed),
      hint: "0 恐慌 · 100 贪婪",
    },
    {
      title: "Crypto恐慌/贪婪指数",
      value: formatPercent(metrics.cryptoFearGreed),
      hint: "0 恐慌 · 100 贪婪",
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
        h("p", { className: "metric-card__value" }, card.value),
        h("p", { className: "metric-card__delta" }, card.hint)
      )
    )
  );
}
