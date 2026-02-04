# Market Pulse Dashboard

一个基于 **React 18 + Vite** 的 Dashboard，展示近 15 年标普 500 每月回报，并在页面顶部显示市场参与度与恐慌/贪婪指标。点击「更新数据」即可在本地修改最新月度回报和指标。

## 技术架构
- React 18 + ReactDOM 18，基于 Vite 开发/构建。
- 自定义 Canvas 渲染柱状图，避免第三方可视化依赖。
- 模块化拆分：`src/data` 数据源，`src/components` React 组件（含 Canvas 柱状图与热力图），`src/utils` 工具函数。

## 目录结构
- `index.html`：页面入口，挂载组件与样式。
- `styles.css`：视觉样式与布局。
- `src/main.js`：React 应用入口与页面布局。
- `src/components/metrics.js`：顶部指标卡片 React 组件。
- `src/components/heatmap.js`：15 年月度回报热力图（对比示例图的绿色/红色块）。
- `src/utils/format.js`：格式化工具。
- `src/data/sp500-monthly.js`：近 15 年每月回报（当前已替换为来自 Stooq ^spx 月度收盘价计算的回报，截止最新完成月份；如需官方数据请用你自己的源覆盖）。
- `src/data/market-metrics.js`：市场波动（VIX）和恐慌/贪婪指标的默认值。

## 数据来源（点击「更新数据」时实时抓取）
- 标普 500 月度收盘：`https://stooq.pl/q/d/l/?s=%5Espx&i=m`（CSV），若 CORS 受限会自动尝试 `https://r.jina.ai/http://stooq.pl/q/d/l/?s=%5Espx&i=m` 与 `https://api.allorigins.win/raw?url=...` 作为代理。
- VIX：`https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d`，通过 `https://api.allorigins.win/raw?url=...` 和 `https://r.jina.ai/` 代理。
- CNN 恐慌/贪婪指数：`https://production.dataviz.cnn.io/index/fearandgreed/graphdata`，通过 `https://r.jina.ai/` 代理以便前端直接请求。
- Crypto 恐慌/贪婪指数：`https://api.alternative.me/fng/?limit=1`，通过 `https://api.allorigins.win/raw?url=...` 代理以避免跨域限制。

## 本地运行
项目采用 Vite 作为开发服务器与构建工具。

### 安装依赖
```bash
yarn install
```

### 本地开发
```bash
yarn dev
```
默认会在 `http://localhost:5173` 提供热更新开发服务。

### 生产构建
```bash
yarn build
yarn preview  # 预览构建产物
```
