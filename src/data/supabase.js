const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

function normalizeDateString(value) {
  return typeof value === "string" && value.length >= 10 ? value.slice(0, 10) : null;
}

function toMonthKey(value) {
  return typeof value === "string" && value.length >= 7 ? value.slice(0, 7) : null;
}

function toFiniteNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeHttpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : null;
  } catch (_err) {
    return null;
  }
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
  const vix = toFiniteNumber(row.vix);
  const cnnFearGreed = toFiniteNumber(row.cnn_fear_greed);
  const cryptoFearGreed = toFiniteNumber(row.crypto_fear_greed);

  if (vix !== null) next.vix = vix;
  if (cnnFearGreed !== null) next.cnnFearGreed = cnnFearGreed;
  if (cryptoFearGreed !== null) next.cryptoFearGreed = cryptoFearGreed;
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
    .map((row) => ({
      month: row ? toMonthKey(row.month) : null,
      returnPct: row ? toFiniteNumber(row.return_pct) : null,
    }))
    .filter((row) => typeof row.month === "string" && row.returnPct !== null)
    .map((row) => ({
      month: row.month,
      returnPct: row.returnPct,
    }))
    .sort((a, b) => (a.month > b.month ? 1 : -1));
}

export function mapInvestorLinkRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .map((row) => {
      const url = row ? normalizeHttpsUrl(row.url) : null;
      return row && url ? { ...row, url } : null;
    })
    .filter(
      (row) =>
        row &&
        row.is_active !== false &&
        typeof row.slug === "string" &&
        typeof row.name === "string" &&
        typeof row.description === "string"
    )
    .sort((a, b) => {
      const aOrder = typeof a.display_order === "number" ? a.display_order : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.display_order === "number" ? b.display_order : Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    })
    .map((row) => ({
      id: row.slug,
      name: row.name,
      desc: row.description,
      url: row.url,
    }));
}

export function mapSectorPerformanceRows(rows) {
  if (!Array.isArray(rows)) {
    return {
      asOf: null,
      source: "Supabase sector_performance",
      rows: [],
    };
  }

  const mappedRows = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const asOf = normalizeDateString(row.as_of);
      const daily = toFiniteNumber(row.daily_return_pct);
      const oneMonth = toFiniteNumber(row.one_month_return_pct);
      const threeMonth = toFiniteNumber(row.three_month_return_pct);
      const sixMonth = toFiniteNumber(row.six_month_return_pct);
      const ytd = toFiniteNumber(row.ytd_return_pct);

      if (
        !asOf ||
        typeof row.name !== "string" ||
        typeof row.symbol !== "string" ||
        typeof row.category !== "string" ||
        daily === null ||
        oneMonth === null ||
        threeMonth === null ||
        sixMonth === null ||
        ytd === null
      ) {
        return null;
      }

      return {
        asOf,
        displayOrder: typeof row.display_order === "number" ? row.display_order : Number.MAX_SAFE_INTEGER,
        name: row.name,
        symbol: row.symbol,
        category: row.category,
        daily,
        oneMonth,
        threeMonth,
        sixMonth,
        ytd,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

  return {
    asOf: mappedRows.map((row) => row.asOf).sort().pop() || null,
    source: "Supabase sector_performance",
    rows: mappedRows.map(({ displayOrder: _displayOrder, ...row }) => row),
  };
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

export async function loadInvestorLinksFromSupabase(fetchImpl = fetch, options = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig(options);
  const investorLinksUrl =
    `${supabaseUrl}/rest/v1/investor_links?select=slug,name,description,url,display_order,is_active` +
    `&is_active=eq.true&order=display_order.asc`;

  return mapInvestorLinkRows(await fetchJson(fetchImpl, investorLinksUrl, supabaseAnonKey));
}

export async function loadSectorPerformanceFromSupabase(fetchImpl = fetch, options = {}) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig(options);
  const sectorPerformanceUrl =
    `${supabaseUrl}/rest/v1/sector_performance` +
    `?select=as_of,name,symbol,category,display_order,daily_return_pct,one_month_return_pct,three_month_return_pct,six_month_return_pct,ytd_return_pct` +
    `&order=display_order.asc`;

  return mapSectorPerformanceRows(await fetchJson(fetchImpl, sectorPerformanceUrl, supabaseAnonKey));
}
