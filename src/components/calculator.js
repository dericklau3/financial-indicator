import React from "react";
import { formatPct } from "../utils/format.js";

const h = React.createElement;

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(2);
};

const clampPct = (val) => Math.max(0, Math.min(300, val));

const PctRow = ({
  label,
  value,
  inputValue,
  onChange,
  onInputChange,
  onChangePrice,
  priceInput,
  onPriceInputChange,
  onPctFocus,
  onPctBlur,
  onPriceFocus,
  onPriceBlur,
  color,
}) =>
  h(
    "div",
    { className: "pct-row" },
    h(
      "div",
      { className: "pct-row__label" },
      h("span", { className: "pill small", style: { color: color, borderColor: color } }, label),
      h("div", { className: "pct-row__value" }, formatPct(value, 0))
    ),
    h(
      "div",
      { className: "field pct-row__input" },
      h("label", null, "百分比"),
      h(
        "div",
        { className: "field__row" },
        h("span", { className: "prefix" }, "%"),
        h("input", {
          type: "number",
          value: inputValue,
          min: 0,
          max: 300,
          step: "0.1",
          onChange: (e) => {
            const next = e.target.value;
            onInputChange(next);
            const num = Number(next);
            if (Number.isFinite(num)) onChange(clampPct(num));
          },
          onFocus: onPctFocus,
          onBlur: onPctBlur,
        })
      )
    ),
    h(
      "div",
      { className: "result-chip" },
      h("span", { className: "muted" }, "对应价格"),
      h(
        "div",
        { className: "result-chip__input" },
        h("span", { className: "prefix" }, "$"),
        h("input", {
          type: "number",
          value: priceInput,
          min: 0,
          step: "0.01",
          onChange: (e) => {
            const next = e.target.value;
            onPriceInputChange(next);
            const num = Number(next);
            if (Number.isFinite(num)) onChangePrice?.(num);
          },
          onFocus: onPriceFocus,
          onBlur: onPriceBlur,
        })
      )
    )
  );

export function Calculator() {
  const [buyPriceInput, setBuyPriceInput] = React.useState("100");
  const [upPct, setUpPct] = React.useState(8);
  const [downPct, setDownPct] = React.useState(6);
  const [upPctInput, setUpPctInput] = React.useState("8");
  const [downPctInput, setDownPctInput] = React.useState("6");
  const [upPriceInput, setUpPriceInput] = React.useState("108.00");
  const [downPriceInput, setDownPriceInput] = React.useState("94.00");
  const [editingUpPct, setEditingUpPct] = React.useState(false);
  const [editingDownPct, setEditingDownPct] = React.useState(false);
  const [editingUpPrice, setEditingUpPrice] = React.useState(false);
  const [editingDownPrice, setEditingDownPrice] = React.useState(false);
  const [strikeInput, setStrikeInput] = React.useState("225");
  const [premiumInput, setPremiumInput] = React.useState("3.2");
  const [contractsInput, setContractsInput] = React.useState("1");
  const [budgetInput, setBudgetInput] = React.useState("10000");
  const [sharePriceInput, setSharePriceInput] = React.useState("150");

  const toNumber = (val, fallback) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const buyPrice = Math.max(0, toNumber(buyPriceInput, 0));
  const strike = Math.max(0, toNumber(strikeInput, 0));
  const premium = Math.max(0, toNumber(premiumInput, 0));
  const contracts = Math.max(1, Math.round(toNumber(contractsInput, 1)));
  const budget = Math.max(0, toNumber(budgetInput, 0));
  const sharePrice = Math.max(0, toNumber(sharePriceInput, 0));

  const upPrice = buyPrice * (1 + upPct / 100);
  const downPrice = buyPrice * (1 - downPct / 100);
  const netCostPerShare = strike - premium;
  const premiumTotal = premium * 100 * contracts;
  const assignmentCost = netCostPerShare * 100 * contracts;
  const shareCount =
    sharePrice > 0 ? Math.max(0, Math.floor(budget / sharePrice)) : 0;
  const remainingCash =
    sharePrice > 0 ? Math.max(0, budget - shareCount * sharePrice) : 0;

  React.useEffect(() => {
    if (!editingUpPct) setUpPctInput(String(upPct));
  }, [upPct, editingUpPct]);

  React.useEffect(() => {
    if (!editingDownPct) setDownPctInput(String(downPct));
  }, [downPct, editingDownPct]);

  React.useEffect(() => {
    if (!editingUpPrice) setUpPriceInput(Number.isFinite(upPrice) ? upPrice.toFixed(2) : "");
  }, [upPrice, editingUpPrice]);

  React.useEffect(() => {
    if (!editingDownPrice) setDownPriceInput(Number.isFinite(downPrice) ? downPrice.toFixed(2) : "");
  }, [downPrice, editingDownPrice]);

  return h(
    "section",
    { className: "panel calculator" },
    h(
      "div",
      { className: "panel__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "Scenario Lab"),
        h("h2", null, "价格波动 & 卖PUT 计算器")
      ),
      h("div", { className: "pill" }, "快速评估持仓与卖权成本")
    ),
    h(
      "div",
      { className: "panel__body calculator__grid" },
      h(
        "div",
        { className: "calc-card" },
        h(
          "header",
          { className: "calc-card__header" },
          h("h3", null, "买入价格 & 涨跌模拟"),
          h("p", { className: "muted" }, "拖动百分比，快速看到对应目标价")
        ),
        h(
          "div",
          { className: "field" },
          h("label", null, "买入价格"),
          h("div", { className: "field__row" },
            h("span", { className: "prefix" }, "$"),
            h("input", {
              type: "number",
              value: buyPriceInput,
              min: 0,
              step: "0.01",
              onChange: (e) => setBuyPriceInput(e.target.value),
            })
          )
      ),
      h(
        "div",
        { className: "pct-list" },
          h(PctRow, {
            label: "上涨",
            value: upPct,
            inputValue: upPctInput,
            onInputChange: setUpPctInput,
            onChange: setUpPct,
            onPctFocus: () => setEditingUpPct(true),
            onPctBlur: () => {
              setEditingUpPct(false);
              setUpPctInput(String(upPct));
            },
            onChangePrice: (price) => {
              if (buyPrice <= 0) return;
              const pct = ((price / buyPrice) - 1) * 100;
              setUpPct(clampPct(pct));
            },
            priceInput: upPriceInput,
            onPriceInputChange: setUpPriceInput,
            onPriceFocus: () => setEditingUpPrice(true),
            onPriceBlur: () => {
              setEditingUpPrice(false);
              setUpPriceInput(Number.isFinite(upPrice) ? upPrice.toFixed(2) : "");
            },
            color: "var(--success)",
          }),
          h(PctRow, {
            label: "下跌",
            value: downPct,
            inputValue: downPctInput,
            onInputChange: setDownPctInput,
            onChange: setDownPct,
            onPctFocus: () => setEditingDownPct(true),
            onPctBlur: () => {
              setEditingDownPct(false);
              setDownPctInput(String(downPct));
            },
            onChangePrice: (price) => {
              if (buyPrice <= 0) return;
              const pct = ((buyPrice - price) / buyPrice) * 100;
              setDownPct(clampPct(pct));
            },
            priceInput: downPriceInput,
            onPriceInputChange: setDownPriceInput,
            onPriceFocus: () => setEditingDownPrice(true),
            onPriceBlur: () => {
              setEditingDownPrice(false);
              setDownPriceInput(Number.isFinite(downPrice) ? downPrice.toFixed(2) : "");
            },
            color: "var(--danger)",
          })
        )
      ),
      h(
        "div",
        { className: "calc-card" },
        h(
          "header",
          { className: "calc-card__header" },
          h("h3", null, "可买股数计算"),
          h("p", { className: "muted" }, "输入金额与股价，快速估算可买数量")
        ),
        h(
          "div",
          { className: "double-field" },
          h(
            "div",
            { className: "field" },
            h("label", null, "投入金额"),
            h("div", { className: "field__row" },
              h("span", { className: "prefix" }, "$"),
              h("input", {
                type: "number",
                value: budgetInput,
                min: 0,
                step: "0.01",
                onChange: (e) => setBudgetInput(e.target.value),
              })
            )
          ),
          h(
            "div",
            { className: "field" },
            h("label", null, "当前股价"),
            h("div", { className: "field__row" },
              h("span", { className: "prefix" }, "$"),
              h("input", {
                type: "number",
                value: sharePriceInput,
                min: 0,
                step: "0.01",
                onChange: (e) => setSharePriceInput(e.target.value),
              })
            )
          )
        ),
        h(
          "div",
          { className: "result-cards" },
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "可买股数"),
            h("div", { className: "metric--lg" }, `${shareCount}`),
            h("p", { className: "muted" }, "按整数股数估算")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "剩余资金"),
            h("div", { className: "metric--lg" }, `$${formatCurrency(remainingCash)}`),
            h("p", { className: "muted" }, "金额 - 股数 × 股价")
          )
        )
      ),
      h(
        "div",
        { className: "calc-card" },
        h(
          "header",
          { className: "calc-card__header" },
          h("h3", null, "Sell Put 成交均价"),
          h("p", { className: "muted" }, "设定行权价与收到的权利金，查看真实持仓成本")
        ),
        h(
          "div",
          { className: "double-field" },
          h(
            "div",
            { className: "field" },
            h("label", null, "行权价"),
            h("div", { className: "field__row" },
              h("span", { className: "prefix" }, "$"),
              h("input", {
                type: "number",
                value: strikeInput,
                min: 0,
                step: "0.5",
                onChange: (e) => setStrikeInput(e.target.value),
              })
            )
          ),
          h(
            "div",
            { className: "field" },
            h("label", null, "收到的权利金"),
            h("div", { className: "field__row" },
              h("span", { className: "prefix" }, "$"),
              h("input", {
                type: "number",
                value: premiumInput,
                min: 0,
                step: "0.1",
                onChange: (e) => setPremiumInput(e.target.value),
              })
            )
          )
        ),
        h(
          "div",
          { className: "field" },
          h("label", null, "合约张数"),
          h("div", { className: "field__row" },
            h("span", { className: "prefix" }, "#"),
            h("input", {
              type: "number",
              value: contractsInput,
              min: 1,
              step: "1",
              onChange: (e) => setContractsInput(e.target.value),
            })
          )
        ),
        h(
          "div",
          { className: "result-cards" },
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "实际成交均价（行权后）"),
            h("div", { className: "metric--lg" }, `$${formatCurrency(netCostPerShare)}`),
            h("p", { className: "muted" }, "行权价 - 权利金")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "收到权利金"),
            h("div", { className: "metric--lg" }, `$${formatCurrency(premiumTotal)}`),
            h("p", { className: "muted" }, `${contracts} 张 · 100 股/张`)
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "若被指派需备资金"),
            h("div", { className: "metric--lg" }, `$${formatCurrency(assignmentCost)}`),
            h("p", { className: "muted" }, "净成本 × 100 股 × 张数")
          )
        )
      )
    )
  );
}
