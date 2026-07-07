import React from "react";

const h = React.createElement;

const PERFORMANCE_RANGES = [
  { key: "daily", label: "日涨跌" },
  { key: "oneMonth", label: "1月" },
  { key: "threeMonth", label: "3月" },
  { key: "sixMonth", label: "6月" },
  { key: "ytd", label: "今年以来" },
];

const SECTOR_DESCRIPTIONS = {
  科技: "涵盖软件、半导体、云计算、硬件设备和 IT 服务公司，通常对企业科技支出和 AI/算力周期更敏感。",
  金融: "涵盖银行、保险、券商、支付和资产管理公司，表现通常受利率、信贷周期和资本市场活跃度影响。",
  医疗保健: "涵盖制药、生物科技、医疗器械、医保服务和医院运营公司，兼具防御属性和研发驱动特征。",
  可选消费: "涵盖汽车、零售、电商、旅游、餐饮和娱乐公司，通常跟居民收入、消费信心和经济周期关系更强。",
  日常消费: "涵盖食品饮料、家庭用品、烟草和日用品零售公司，需求更稳定，常被视为防御型板块。",
  工业: "涵盖航空航天、机械设备、运输、建筑工程和工业服务公司，通常受制造业、基建和资本开支影响。",
  能源: "涵盖石油天然气开采、炼化、油服和能源设备公司，主要受油气价格、供需和地缘政治影响。",
  公用事业: "涵盖电力、燃气、水务和可再生能源公用事业公司，现金流相对稳定，但对利率变化较敏感。",
  房地产: "涵盖 REITs、地产运营和商业地产相关公司，通常受利率、租金、入住率和融资环境影响。",
  材料: "涵盖化工、金属矿业、建材、包装和林产品公司，通常跟大宗商品价格和工业需求相关。",
  通信服务: "涵盖电信运营商、媒体娱乐、广告平台和社交网络公司，受用户增长、广告周期和内容支出影响。",
  Bitcoin: "比特币现货价格代理，反映加密资产风险偏好、流动性环境和数字黄金叙事变化。",
  Ethereum: "以太坊现货价格代理，反映智能合约生态、链上应用活跃度和加密资产风险偏好。",
};

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

function descriptionFor(row) {
  return SECTOR_DESCRIPTIONS[row.name] || `${row.symbol} 对应的${row.category}代理标的。`;
}

function etfdbHoldingsUrl(symbol) {
  return symbol && symbol.startsWith("XL") ? `https://etfdb.com/etf/${symbol}/#holdings` : null;
}

export const SectorPerformance = ({ snapshot, isLoading = false, loadError = null, onSelectSector = null }) => {
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
            h(
              "button",
              {
                className: "sector-table__name",
                type: "button",
                onClick: () => onSelectSector?.(row),
                "aria-label": `查看${row.name}详情`,
              },
              row.name
            ),
            h(
              "span",
              { className: "sector-table__meta" },
              `${row.symbol} · ${row.category}`
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

export const SectorDetail = ({ sector, onBack }) => {
  const holdingsUrl = etfdbHoldingsUrl(sector?.symbol);
  const description = sector ? descriptionFor(sector) : "";

  return h(
    "section",
    { className: "sector-detail" },
    h(
      "div",
      { className: "sector-detail__header" },
      h(
        "div",
        null,
        h("p", { className: "eyebrow" }, "Sector Detail"),
        h("h2", null, sector?.name || "板块详情"),
        h("p", { className: "sector-detail__hint" }, description),
        sector
          ? h("p", { className: "sector-detail__meta" }, `${sector.symbol} · ${sector.category}`)
          : null
      ),
      h(
        "button",
        {
          className: "ghost sector-detail__back",
          type: "button",
          onClick: onBack,
        },
        "返回板块表现"
      )
    ),
    holdingsUrl
      ? h(
          "div",
          { className: "sector-detail__toolbar" },
          h("h3", null, "主要持仓"),
          h(
            "a",
            {
              className: "fred-page__source",
              href: holdingsUrl,
              target: "_blank",
              rel: "noreferrer",
            },
            "打开 ETFDB"
          )
        )
      : h("p", { className: "muted" }, "该资产暂无 ETFDB 持仓页面。")
  );
};
