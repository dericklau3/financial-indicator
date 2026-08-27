import React from "react";
import { formatPct } from "../utils/format.js";

const h = React.createElement;

const formatCurrency = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(2);
};

const formatCurrencyValue = (value) => {
  if (!Number.isFinite(value)) return "--";
  return `$${formatCurrency(value)}`;
};

export const formatTargetPriceInput = (value) => {
  if (!Number.isFinite(value)) return "";
  if (Math.abs(value) >= 0.01) return value.toFixed(2);
  return value
    .toFixed(9)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
};

const formatPercentValue = (value) => {
  if (!Number.isFinite(value)) return "--";
  return formatPct(value * 100, 2);
};

const clampPct = (val) => Math.max(0, Math.min(300, val));

const NUMERIC_INPUT_RE = /^\d*(?:\.\d*)?$/;
const NUMERIC_EDIT_INPUT_RE = /^[\d.]*$/;
const DECIMAL_SEPARATOR_RE = /[。．，,]/g;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const BUDGET_PRESETS = ["10000", "20000", "50000"];

export const normalizeNumericInput = (nextValue, previousValue = "") => {
  const normalizedValue = nextValue.replace(DECIMAL_SEPARATOR_RE, ".");
  const normalizedPreviousValue = previousValue.replace(DECIMAL_SEPARATOR_RE, ".");

  if (NUMERIC_INPUT_RE.test(normalizedValue)) return normalizedValue;
  if (!NUMERIC_EDIT_INPUT_RE.test(normalizedValue)) return normalizedPreviousValue;

  const dotCount = [...normalizedValue].filter((char) => char === ".").length;
  const previousDotCount = [...normalizedPreviousValue].filter((char) => char === ".").length;
  if (dotCount <= 1 || previousDotCount === 0) return normalizedPreviousValue;

  let insertedDotIndex = normalizedValue.lastIndexOf(".");
  for (let index = 0; index < normalizedValue.length; index += 1) {
    if (normalizedValue[index] !== normalizedPreviousValue[index]) {
      insertedDotIndex = index;
      break;
    }
  }

  const digitCountBeforeInsertedDot = normalizedValue
    .slice(0, insertedDotIndex)
    .replaceAll(".", "")
    .length;
  const digits = normalizedValue.replaceAll(".", "");
  return `${digits.slice(0, digitCountBeforeInsertedDot)}.${digits.slice(digitCountBeforeInsertedDot)}`;
};

export const parseNumericInput = (value) => {
  if (value === "" || value === ".") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const numericInputProps = {
  type: "text",
  inputMode: "decimal",
};

const updateNumericInput = (setter) => (nextValue) => {
  setter((previousValue) => normalizeNumericInput(nextValue, previousValue));
};

const parseDateInput = (value) => {
  if (!value) return null;
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

export const calculateSellPutAnnualizedYield = ({
  strike,
  premium,
  contracts,
  expirationDate,
  currentDate = new Date(),
}) => {
  const expiration = parseDateInput(expirationDate);
  if (
    !expiration ||
    !Number.isFinite(strike) ||
    !Number.isFinite(premium) ||
    !Number.isFinite(contracts) ||
    strike <= 0 ||
    premium < 0 ||
    contracts <= 0
  ) {
    return null;
  }

  const currentDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate()
  );
  const daysToExpiration = Math.ceil((expiration.getTime() - currentDay.getTime()) / MS_PER_DAY);
  if (daysToExpiration <= 0) return null;

  const premiumTotal = premium * 100 * contracts;
  const occupiedCapital = strike * 100 * contracts;
  return (premiumTotal / occupiedCapital / daysToExpiration) * 365;
};

export const calculateSellPutPremiumYield = ({ strike, premium, contracts }) => {
  if (
    !Number.isFinite(strike) ||
    !Number.isFinite(premium) ||
    !Number.isFinite(contracts) ||
    strike <= 0 ||
    premium < 0 ||
    contracts <= 0
  ) {
    return null;
  }

  const premiumTotal = premium * 100 * contracts;
  const occupiedCapital = strike * 100 * contracts;
  return premiumTotal / occupiedCapital;
};

export const calculateActualCashRequired = ({ strike, premium, contracts }) => {
  if (
    !Number.isFinite(strike) ||
    !Number.isFinite(premium) ||
    !Number.isFinite(contracts) ||
    strike <= 0 ||
    premium < 0 ||
    contracts <= 0
  ) {
    return null;
  }

  const occupiedCapital = strike * 100 * contracts;
  const premiumTotal = premium * 100 * contracts;
  return Math.max(0, occupiedCapital - premiumTotal);
};

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
      h("div", { className: "pct-row__value" }, Number.isFinite(value) ? formatPct(value, 0) : "--")
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
          ...numericInputProps,
          value: inputValue,
          onChange: (e) => {
            const next = normalizeNumericInput(e.target.value, inputValue);
            onInputChange(next);
            const num = parseNumericInput(next);
            onChange(num === null ? null : clampPct(num));
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
          ...numericInputProps,
          value: priceInput,
          onChange: (e) => {
            const next = normalizeNumericInput(e.target.value, priceInput);
            onPriceInputChange(next);
            onChangePrice?.(parseNumericInput(next));
          },
          onFocus: onPriceFocus,
          onBlur: onPriceBlur,
        })
      )
    )
  );

export function Calculator() {
  const [buyPriceInput, setBuyPriceInput] = React.useState("");
  const [upPct, setUpPct] = React.useState(null);
  const [downPct, setDownPct] = React.useState(null);
  const [upPctInput, setUpPctInput] = React.useState("");
  const [downPctInput, setDownPctInput] = React.useState("");
  const [upPriceInput, setUpPriceInput] = React.useState("");
  const [downPriceInput, setDownPriceInput] = React.useState("");
  const [editingUpPct, setEditingUpPct] = React.useState(false);
  const [editingDownPct, setEditingDownPct] = React.useState(false);
  const [editingUpPrice, setEditingUpPrice] = React.useState(false);
  const [editingDownPrice, setEditingDownPrice] = React.useState(false);
  const [strikeInput, setStrikeInput] = React.useState("");
  const [premiumInput, setPremiumInput] = React.useState("");
  const [contractsInput, setContractsInput] = React.useState("");
  const [budgetInput, setBudgetInput] = React.useState("");
  const [sharePriceInput, setSharePriceInput] = React.useState("");
  const [expirationInput, setExpirationInput] = React.useState("");

  const buyPrice = parseNumericInput(buyPriceInput);
  const strike = parseNumericInput(strikeInput);
  const premium = parseNumericInput(premiumInput);
  const contractsValue = parseNumericInput(contractsInput);
  const budget = parseNumericInput(budgetInput);
  const sharePrice = parseNumericInput(sharePriceInput);
  const contracts =
    contractsValue === null ? null : Math.max(0, Math.round(contractsValue));
  const contractsForCalculation = contracts ?? 0;

  const upPrice =
    buyPrice !== null && upPct !== null ? buyPrice * (1 + upPct / 100) : null;
  const downPrice =
    buyPrice !== null && downPct !== null ? buyPrice * (1 - downPct / 100) : null;
  const netCostPerShare =
    strike !== null && premium !== null ? strike - premium : null;
  const premiumTotal =
    premium !== null && contracts !== null ? premium * 100 * contractsForCalculation : null;
  const occupiedCapital =
    strike !== null && contracts !== null
      ? strike * 100 * contractsForCalculation
      : null;
  const actualCashRequired = calculateActualCashRequired({
    strike,
    premium,
    contracts,
  });
  const premiumYield = calculateSellPutPremiumYield({
    strike,
    premium,
    contracts,
  });
  const annualizedYield = calculateSellPutAnnualizedYield({
    strike,
    premium,
    contracts,
    expirationDate: expirationInput,
  });
  const shareCount =
    budget !== null && sharePrice !== null && sharePrice > 0
      ? Math.max(0, Math.floor(budget / sharePrice))
      : null;
  const remainingCash =
    budget !== null && sharePrice !== null && sharePrice > 0
      ? Math.max(0, budget - shareCount * sharePrice)
      : null;

  React.useEffect(() => {
    if (!editingUpPct) setUpPctInput(upPct === null ? "" : String(upPct));
  }, [upPct, editingUpPct]);

  React.useEffect(() => {
    if (!editingDownPct) setDownPctInput(downPct === null ? "" : String(downPct));
  }, [downPct, editingDownPct]);

  React.useEffect(() => {
    if (!editingUpPrice) setUpPriceInput(formatTargetPriceInput(upPrice));
  }, [upPrice, editingUpPrice]);

  React.useEffect(() => {
    if (!editingDownPrice) setDownPriceInput(formatTargetPriceInput(downPrice));
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
              ...numericInputProps,
              value: buyPriceInput,
              onChange: (e) => updateNumericInput(setBuyPriceInput)(e.target.value),
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
              setUpPctInput(upPct === null ? "" : String(upPct));
            },
            onChangePrice: (price) => {
              if (price === null) {
                setUpPct(null);
                return;
              }
              if (buyPrice === null || buyPrice <= 0) return;
              const pct = ((price / buyPrice) - 1) * 100;
              setUpPct(clampPct(pct));
            },
            priceInput: upPriceInput,
            onPriceInputChange: setUpPriceInput,
            onPriceFocus: () => setEditingUpPrice(true),
            onPriceBlur: () => {
              setEditingUpPrice(false);
              setUpPriceInput(formatTargetPriceInput(upPrice));
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
              setDownPctInput(downPct === null ? "" : String(downPct));
            },
            onChangePrice: (price) => {
              if (price === null) {
                setDownPct(null);
                return;
              }
              if (buyPrice === null || buyPrice <= 0) return;
              const pct = ((buyPrice - price) / buyPrice) * 100;
              setDownPct(clampPct(pct));
            },
            priceInput: downPriceInput,
            onPriceInputChange: setDownPriceInput,
            onPriceFocus: () => setEditingDownPrice(true),
            onPriceBlur: () => {
              setEditingDownPrice(false);
              setDownPriceInput(formatTargetPriceInput(downPrice));
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
                ...numericInputProps,
                value: budgetInput,
                onChange: (e) => updateNumericInput(setBudgetInput)(e.target.value),
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
                ...numericInputProps,
                value: sharePriceInput,
                onChange: (e) => updateNumericInput(setSharePriceInput)(e.target.value),
              })
            )
          )
        ),
        h(
          "div",
          { className: "preset-buttons", "aria-label": "投入金额快捷选择" },
          BUDGET_PRESETS.map((preset) =>
            h(
              "button",
              {
                key: preset,
                type: "button",
                className: "preset-button",
                onClick: () => setBudgetInput(preset),
              },
              preset
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
            h("div", { className: "metric--lg" }, shareCount === null ? "--" : `${shareCount}`),
            h("p", { className: "muted" }, "按整数股数估算")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "剩余资金"),
            h("div", { className: "metric--lg" }, formatCurrencyValue(remainingCash)),
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
                ...numericInputProps,
                value: strikeInput,
                onChange: (e) => updateNumericInput(setStrikeInput)(e.target.value),
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
                ...numericInputProps,
                value: premiumInput,
                onChange: (e) => updateNumericInput(setPremiumInput)(e.target.value),
              })
            )
          )
        ),
        h(
          "div",
          { className: "double-field" },
          h(
            "div",
            { className: "field" },
            h("label", null, "合约张数"),
            h("div", { className: "field__row" },
              h("span", { className: "prefix" }, "#"),
              h("input", {
                ...numericInputProps,
                value: contractsInput,
                onChange: (e) => updateNumericInput(setContractsInput)(e.target.value),
              })
            )
          ),
          h(
            "div",
            { className: "field" },
            h("label", null, "到期日"),
            h("input", {
              type: "date",
              value: expirationInput,
              onChange: (e) => setExpirationInput(e.target.value),
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
            h("div", { className: "metric--lg" }, formatCurrencyValue(netCostPerShare)),
            h("p", { className: "muted" }, "行权价 - 权利金")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "收到权利金"),
            h("div", { className: "metric--lg" }, formatCurrencyValue(premiumTotal)),
            h("p", { className: "muted" }, `${contracts === null ? "--" : contracts} 张 · 100 股/张`)
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "占用资金"),
            h("div", { className: "metric--lg" }, formatCurrencyValue(occupiedCapital)),
            h("p", { className: "muted" }, "行权价 × 100 股 × 张数")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "实际出资资金"),
            h("div", { className: "metric--lg" }, formatCurrencyValue(actualCashRequired)),
            h("p", { className: "muted" }, "占用资金 - 已收权利金")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "权利金收益率"),
            h("div", { className: "metric--lg" }, formatPercentValue(premiumYield)),
            h("p", { className: "muted" }, "收到权利金 ÷ 占用资金")
          ),
          h(
            "div",
            { className: "result-card" },
            h("p", { className: "label" }, "年化收益"),
            h("div", { className: "metric--lg" }, formatPercentValue(annualizedYield)),
            h("p", { className: "muted" }, "按行权价占用资金年化")
          )
        )
      )
    )
  );
}
