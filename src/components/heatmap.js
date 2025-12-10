import React from "react";
import { formatPct } from "../utils/format.js";

const h = React.createElement;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const colorForValue = (v) => {
  if (v === null || v === undefined) return "#5f6473";
  const maxAbs = 12;
  const clamped = Math.max(-maxAbs, Math.min(maxAbs, v));
  const ratio = Math.abs(clamped) / maxAbs;
  const green = `hsl(134, 65%, ${45 - ratio * 10}%)`;
  const red = `hsl(0, 75%, ${55 - ratio * 15}%)`;
  return v >= 0 ? green : red;
};

const HeatmapCell = ({ value }) => {
  const isEmpty = value === null || value === undefined;
  const bg = colorForValue(value);
  return h(
    "div",
    {
      className: `heatmap__cell ${isEmpty ? "heatmap__cell--empty" : ""}`,
      style: { background: bg },
    },
    isEmpty ? "—" : formatPct(value, 1)
  );
};

export function Heatmap({ data, onUpdate }) {
  const filtered = React.useMemo(() => {
    if (!data.length) return [];
    const toYm = (m) => {
      const [y, mm] = m.split("-").map((s) => Number(s));
      return y * 12 + mm;
    };
    const maxYm = Math.max(...data.map((d) => toYm(d.month)));
    const startYm = maxYm - 15 * 12 + 2; // inclusive start to show 15 years ending at maxYm
    return data.filter((d) => toYm(d.month) >= startYm);
  }, [data]);

  const grouped = React.useMemo(() => {
    const byYear = {};
    filtered.forEach((item) => {
      const [year, month] = item.month.split("-").map((s) => Number(s));
      if (!byYear[year]) byYear[year] = new Array(12).fill(null);
      byYear[year][month - 1] = item.returnPct;
    });
    return Object.entries(byYear)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([year, values]) => ({ year, values }));
  }, [filtered]);

  return h(
    "section",
    { className: "panel heatmap" },
    h(
      "div",
      { className: "panel__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "S&P 500 Monthly Returns"),
        h("h2", null, "最近15年每月回报热力图")
      ),
      onUpdate
        ? h(
            "div",
            { className: "actions" },
            h(
              "button",
              { className: "ghost", onClick: onUpdate },
              "更新月度回报"
            )
          )
        : null
    ),
    h(
      "div",
      { className: "heatmap__body" },
      h(
        "div",
        { className: "heatmap__header heatmap__row" },
        h("div", { className: "heatmap__year" }),
        months.map((m) => h("div", { className: "heatmap__month", key: m }, m))
      ),
      grouped.map((row) =>
        h(
          "div",
          { className: "heatmap__row", key: row.year },
          h("div", { className: "heatmap__year" }, row.year),
          row.values.map((v, idx) => h(HeatmapCell, { value: v, key: `${row.year}-${idx}` }))
        )
      )
    )
  );
}
