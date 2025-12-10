import { monthlyReturns, upsertMonthlyReturn } from "./data/sp500-monthly.js";
import { marketMetrics, updateMetrics } from "./data/market-metrics.js";
import { renderMetrics } from "./components/metrics.js";
import {
  renderReturnsChart,
  calculateReturnStats,
} from "./components/returnsChart.js";
import { formatPct, formatMonth } from "./utils/format.js";

const state = {
  returns: [...monthlyReturns],
  metrics: { ...marketMetrics },
};

const metricsContainer = document.getElementById("metrics");
const chartCanvas = document.getElementById("returnsChart");
const cagrEl = document.getElementById("cagr");
const bestMonthEl = document.getElementById("bestMonth");
const worstMonthEl = document.getElementById("worstMonth");
const winRateEl = document.getElementById("winRate");
const quickStatsEl = document.getElementById("quickStats");

function render() {
  const stats = calculateReturnStats(state.returns);
  renderMetrics(metricsContainer, state.metrics);
  renderReturnsChart(chartCanvas, state.returns);
  cagrEl.textContent = formatPct(stats.cagr * 100, 2);
  bestMonthEl.textContent = stats.best
    ? `${formatMonth(stats.best.month)} · ${formatPct(stats.best.returnPct, 2)}`
    : "--";
  worstMonthEl.textContent = stats.worst
    ? `${formatMonth(stats.worst.month)} · ${formatPct(stats.worst.returnPct, 2)}`
    : "--";
  winRateEl.textContent = formatPct(stats.winRate * 100, 1);
  quickStatsEl.innerHTML = buildQuickStats(stats, state.returns);
}

function buildQuickStats(stats, returns) {
  const last = returns[returns.length - 1];
  const streak = getStreak(returns);
  return [
    ["最新月份", last ? `${formatMonth(last.month)} · ${formatPct(last.returnPct, 2)}` : "--"],
    ["平均单月", formatPct(stats.avg, 2)],
    ["波动率（单月）", formatPct(stats.std, 2)],
    ["连胜/连败", streak],
    ["数据点", `${returns.length} 个月`],
  ]
    .map(
      ([label, value]) => `
        <div class="quick-stats__row">
          <span>${label}</span>
          <span class="pill">${value}</span>
        </div>
      `
    )
    .join("");
}

function getStreak(returns) {
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
}

document.getElementById("updateButton").addEventListener("click", () => {
  const month = prompt("输入月份（YYYY-MM）", new Date().toISOString().slice(0, 7));
  if (!month || !/\\d{4}-\\d{2}/.test(month)) return;

  const value = prompt("该月标普500回报率（例如 2.5 表示 +2.5%）", "0.8");
  if (value === null) return;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return;

  const sp20 = prompt("标普20日参与度（0-100，可留空跳过）", "");
  const sp50 = prompt("标普50日参与度（0-100，可留空跳过）", "");
  const cnn = prompt("CNN恐慌/贪婪指数（0-100，可留空跳过）", "");
  const crypto = prompt("Crypto恐慌/贪婪指数（0-100，可留空跳过）", "");

  state.returns = upsertMonthlyReturn(month, parsed);
  state.metrics = updateMetrics({
    spParticipation20: toNumberOrUndefined(sp20),
    spParticipation50: toNumberOrUndefined(sp50),
    cnnFearGreed: toNumberOrUndefined(cnn),
    cryptoFearGreed: toNumberOrUndefined(crypto),
  });
  render();
});

document.getElementById("refreshButton").addEventListener("click", render);

function toNumberOrUndefined(value) {
  if (value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

render();
