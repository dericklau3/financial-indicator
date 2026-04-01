const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function normalizeDateString(value) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : null;
}

function toMonthKey(value) {
  return typeof value === "string" && value.length >= 7 ? value.slice(0, 7) : null;
}

function getSupabaseConfig(options = {}) {
  const supabaseUrl = options.supabaseUrl ?? import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = options.supabaseAnonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("缺少 VITE_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    throw new Error("缺少 VITE_SUPABASE_ANON_KEY");
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    supabaseAnonKey,
  };
}

async function fetchJson(fetchImpl, url, supabaseAnonKey) {
  const response = await fetchImpl(url, {
    headers: {
      ...DEFAULT_HEADERS,
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = await response.text();
    } catch (_err) {
      detail = "";
    }
    throw new Error(`Supabase 请求失败 ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return response.json();
}

export function mapCronRowToMetrics(row) {
  if (!row || typeof row !== "object") {
    return {};
  }

  const date = normalizeDateString(row.date);
  const next = {};

  if (typeof row.vix === "number") next.vix = row.vix;
  if (typeof row.cnn_fear_greed === "number") next.cnnFearGreed = row.cnn_fear_greed;
  if (typeof row.crypto_fear_greed === "number") next.cryptoFearGreed = row.crypto_fear_greed;
  if (date) {
    next.vixDate = date;
    next.cnnFearGreedDate = date;
    next.cryptoFearGreedDate = date;
  }

  return next;
}

export function mapMonthlyReturnRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((row) => row && typeof row.return_pct === "number")
    .map((row) => ({
      month: toMonthKey(row.month),
      returnPct: row.return_pct,
    }))
    .filter((row) => typeof row.month === "string")
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}

export async function loadDashboardDataFromSupabase(fetchImpl = fetch, options = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig(options);
  const cronUrl =
    `${supabaseUrl}/rest/v1/cron_data?select=key,date,vix,cnn_fear_greed,crypto_fear_greed` +
    `&key=eq.singleton&limit=1`;
  const returnsUrl =
    `${supabaseUrl}/rest/v1/sp500_monthly_returns?select=month,return_pct&order=month.asc`;

  const [cronRows, returnRows] = await Promise.all([
    fetchJson(fetchImpl, cronUrl, supabaseAnonKey),
    fetchJson(fetchImpl, returnsUrl, supabaseAnonKey),
  ]);

  return {
    metrics: mapCronRowToMetrics(Array.isArray(cronRows) ? cronRows[0] : null),
    returns: mapMonthlyReturnRows(returnRows),
  };
}
