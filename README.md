# Market Pulse Dashboard

一个基于 **React 18 + Vite + Bun** 的美股市场面板，展示最近 15 年标普 500 月度回报、VIX、CNN 恐慌与贪婪指数和 Crypto 恐慌与贪婪指数。

项目不再在仓库里保存默认业务数据。页面会优先读取浏览器 `localStorage`，不会在进入页面时自动抓取远程数据；需要手动点击按钮更新并覆盖本地缓存。

## 技术栈

- React 18 + ReactDOM 18
- Vite 5
- Bun 作为包管理器和脚本运行器
- 浏览器 `localStorage` 作为唯一持久化存储

## 目录结构

- `index.html`：页面入口
- `styles.css`：页面样式
- `src/main.js`：应用入口、远程抓取和状态管理
- `src/components/metrics.js`：顶部指标卡片
- `src/components/heatmap.js`：标普 500 月度回报热力图
- `src/components/calculator.js`：价格波动和卖 PUT 计算器
- `src/data/storage.js`：`localStorage` 读写与数据校验
- `src/data/sp500-monthly.js`：月度回报仓储封装
- `src/data/market-metrics.js`：指标空状态与合并逻辑
- `src/utils/format.js`：格式化工具

## 数据获取方式

页面中的数据全部由前端在浏览器里直接请求外部接口获取。

### 标普 500 月度回报

- 主数据源：`https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=20y&interval=1mo&includePrePost=false`
- 数据格式：Yahoo 月线 JSON
- 处理方式：读取月线时间戳和收盘价/复权收盘价，计算最近 15 年已完成月份的月度涨跌幅
- 主代理：
  - `https://r.jina.ai/http://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=20y&interval=1mo&includePrePost=false`
- 兜底回退：
  - `https://r.jina.ai/http://stooq.pl/q/d/l/?s=%5Espx&i=m`
  - `https://api.allorigins.win/raw?url=...`

### VIX

- 数据源：`https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d`
- 处理方式：读取最近有效收盘值和对应日期
- 代理回退：
  - `https://api.allorigins.win/raw?url=...`
  - `https://r.jina.ai/https://query1.finance.yahoo.com/...`

### CNN 恐慌与贪婪指数

- 数据源：`https://production.dataviz.cnn.io/index/fearandgreed/graphdata`
- 处理方式：读取当前分数，并尽量提取最新日期
- 代理方式：
  - `https://r.jina.ai/https://production.dataviz.cnn.io/index/fearandgreed/graphdata`

### Crypto 恐慌与贪婪指数

- 数据源：`https://api.alternative.me/fng/?limit=1`
- 处理方式：读取最新分数和时间戳
- 代理回退：
  - `https://api.allorigins.win/raw?url=...`
  - `https://r.jina.ai/https://api.alternative.me/fng/?limit=1`

## 数据存储方式

项目只把数据保存在当前浏览器的 `localStorage` 中，不会写回仓库，也不依赖 Supabase、后端或数据库。

当前使用的本地缓存键：

- `sp500-monthly-returns-v1`
- `market-metrics-v1`

这意味着：

- 同一个浏览器刷新页面后，数据会继续保留
- 更换浏览器、清理站点数据或使用无痕模式后，需要重新抓取
- 首次访问如果远程源不可用，页面会显示空状态而不是内置假数据

## 页面更新逻辑

- 首次打开页面：
  - 先读 `localStorage`
  - 如果没有缓存，就保持空状态
- 手动更新：
  - 点击“更新月度回报”会重新抓取并覆盖本地月度回报缓存
  - 点击“更新情绪指数”会重新抓取并覆盖本地指标缓存
- 失败回退：
  - 如果已经有缓存但本次请求失败，页面保留旧缓存

## 本地开发

### 安装依赖

```bash
bun install
```

### 启动开发环境

```bash
bun dev
```

默认地址是 `http://localhost:5173`。

### 运行测试

```bash
bun test
```

### 构建与预览

```bash
bun run build
bun run preview
```

## GitHub Pages

项目仍然可以作为纯静态站点部署到 GitHub Pages。由于数据抓取和缓存都在浏览器端完成，部署时不需要额外服务端。
