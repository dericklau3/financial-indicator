import React from "react";

const h = React.createElement;

const PERFORMANCE_RANGES = [
  { key: "daily", label: "日涨跌" },
  { key: "oneMonth", label: "1月" },
  { key: "threeMonth", label: "3月" },
  { key: "sixMonth", label: "6月" },
  { key: "ytd", label: "今年以来" },
];

function formatPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

function toneFor(value) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

export const SectorPerformance = ({ snapshot, isLoading = false, loadError = null }) => {
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const asOf = snapshot?.asOf || "--";
  const source = snapshot?.source || "Supabase sector_performance";

  return h(
    "section",
    { className: "sector-page" },
    h(
      "div",
      { className: "sector-page__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "Sector Returns"),
        h("h2", null, "板块表现"),
        h(
          "p",
          { className: "sector-page__hint" },
          `按代理标的收盘价计算，数据日期 ${asOf}，来源 ${source}`
        )
      ),
      h("span", { className: "pill" }, "美股 + 加密")
    ),
    isLoading ? h("p", { className: "muted" }, "板块表现加载中") : null,
    loadError ? h("p", { className: "eyebrow", role: "alert" }, `板块表现加载失败：${loadError}`) : null,
    h(
      "div",
      { className: "sector-table" },
      h(
        "div",
        { className: "sector-table__row sector-table__head" },
        h("div", null, "板块"),
        PERFORMANCE_RANGES.map((range) => h("div", { key: range.key }, range.label))
      ),
      rows.length
        ? rows.map((row) =>
        h(
          "div",
          { key: row.symbol, className: "sector-table__row" },
          h(
            "div",
            { className: "sector-table__sector" },
            h("span", { className: "sector-table__name" }, row.name),
            h(
              "span",
              { className: "sector-table__meta" },
              `${row.symbol} · ${row.category} · ${row.asOf || asOf}`
            )
          ),
          PERFORMANCE_RANGES.map((range) =>
            h(
              "div",
              {
                key: range.key,
                className: `sector-table__value ${toneFor(row[range.key])}`,
              },
              formatPercent(row[range.key])
            )
          )
        )
          )
        : h("p", { className: "sector-table__empty muted" }, "暂无板块表现数据")
    )
  );
};
