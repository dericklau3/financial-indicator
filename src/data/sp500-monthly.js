import { loadStoredMonthlyReturns, saveStoredMonthlyReturns } from "./storage.js";

export function loadMonthlyReturns() {
  return loadStoredMonthlyReturns() || [];
}

export function saveMonthlyReturns(returns) {
  return saveStoredMonthlyReturns(returns) || [];
}

export function upsertMonthlyReturn(month, returnPct) {
  const current = loadStoredMonthlyReturns() || [];
  const idx = current.findIndex((item) => item.month === month);

  if (idx >= 0) {
    current[idx].returnPct = returnPct;
  } else {
    current.push({ month, returnPct });
    current.sort((a, b) => (a.month > b.month ? 1 : -1));
  }

  return saveMonthlyReturns(current);
}
