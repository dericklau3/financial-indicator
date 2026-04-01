const RETURNS_CACHE_KEY = "sp500-monthly-returns-v1";
const METRICS_CACHE_KEY = "market-metrics-v1";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const isValidMonth = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);

const normalizeMonthlyReturns = (input) => {
  if (!Array.isArray(input)) return null;

  const cleaned = input
    .filter((item) => item && isValidMonth(item.month) && Number.isFinite(item.returnPct))
    .map((item) => ({
      month: item.month,
      returnPct: Number(item.returnPct),
    }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));

  return cleaned.length ? cleaned : null;
};

const normalizeMetrics = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const next = {};

  if (typeof input.vix === "number") next.vix = input.vix;
  if (typeof input.cnnFearGreed === "number") next.cnnFearGreed = input.cnnFearGreed;
  if (typeof input.cryptoFearGreed === "number") next.cryptoFearGreed = input.cryptoFearGreed;
  if (typeof input.vixDate === "string") next.vixDate = input.vixDate;
  if (typeof input.cnnFearGreedDate === "string") next.cnnFearGreedDate = input.cnnFearGreedDate;
  if (typeof input.cryptoFearGreedDate === "string") next.cryptoFearGreedDate = input.cryptoFearGreedDate;

  return next;
};

const readJson = (key) => {
  if (!canUseStorage()) return null;

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`读取缓存失败: ${key}`, err);
    return null;
  }
};

const writeJson = (key, value) => {
  if (!canUseStorage()) return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`写入缓存失败: ${key}`, err);
  }
};

export function loadStoredMonthlyReturns() {
  return normalizeMonthlyReturns(readJson(RETURNS_CACHE_KEY));
}

export function saveStoredMonthlyReturns(values) {
  const normalized = normalizeMonthlyReturns(values);
  if (!normalized) return null;
  writeJson(RETURNS_CACHE_KEY, normalized);
  return normalized;
}

export function loadStoredMetrics() {
  const raw = readJson(METRICS_CACHE_KEY);
  const normalized = normalizeMetrics(raw);
  return normalized === null ? null : normalized;
}

export function saveStoredMetrics(values) {
  const normalized = normalizeMetrics(values);
  if (normalized === null) return null;
  writeJson(METRICS_CACHE_KEY, normalized);
  return normalized;
}

export function clearStoredData() {
  if (!canUseStorage()) return;

  try {
    localStorage.removeItem(RETURNS_CACHE_KEY);
    localStorage.removeItem(METRICS_CACHE_KEY);
  } catch (err) {
    console.warn("清理缓存失败", err);
  }
}
