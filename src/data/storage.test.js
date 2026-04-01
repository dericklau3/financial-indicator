import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  clearStoredData,
  loadStoredMetrics,
  loadStoredMonthlyReturns,
  saveStoredMetrics,
  saveStoredMonthlyReturns,
} from "./storage.js";

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

const createStorage = () => {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
};

describe("storage helpers", () => {
  beforeEach(() => {
    const storage = createStorage();
    globalThis.localStorage = storage;
    globalThis.window = { localStorage: storage };
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
  });

  test("returns null for empty caches", () => {
    expect(loadStoredMonthlyReturns()).toBeNull();
    expect(loadStoredMetrics()).toBeNull();
  });

  test("ignores invalid cached payloads", () => {
    localStorage.setItem("sp500-monthly-returns-v1", JSON.stringify([{ month: "bad" }]));
    localStorage.setItem("market-metrics-v1", JSON.stringify({ vix: "bad" }));

    expect(loadStoredMonthlyReturns()).toBeNull();
    expect(loadStoredMetrics()).toEqual({});
  });

  test("round-trips normalized values", () => {
    saveStoredMonthlyReturns([
      { month: "2025-02", returnPct: -1.42 },
      { month: "2025-01", returnPct: 2.7 },
    ]);
    saveStoredMetrics({
      vix: 18.21,
      cnnFearGreed: 44,
      cryptoFearGreed: 31,
      vixDate: "2026-03-31",
    });

    expect(loadStoredMonthlyReturns()).toEqual([
      { month: "2025-01", returnPct: 2.7 },
      { month: "2025-02", returnPct: -1.42 },
    ]);
    expect(loadStoredMetrics()).toEqual({
      vix: 18.21,
      cnnFearGreed: 44,
      cryptoFearGreed: 31,
      vixDate: "2026-03-31",
    });
  });

  test("saveStoredMetrics preserves partial metric payloads", () => {
    saveStoredMetrics({ vix: 16.4 });
    expect(loadStoredMetrics()).toEqual({ vix: 16.4 });
  });

  test("metrics module merges values without seeded defaults", async () => {
    const { createEmptyMetrics, updateMetrics } = await import("./market-metrics.js");

    expect(createEmptyMetrics()).toEqual({
      vix: null,
      cnnFearGreed: null,
      cryptoFearGreed: null,
      vixDate: null,
      cnnFearGreedDate: null,
      cryptoFearGreedDate: null,
    });

    expect(updateMetrics(createEmptyMetrics(), { vix: 14.8 })).toEqual({
      vix: 14.8,
      cnnFearGreed: null,
      cryptoFearGreed: null,
      vixDate: null,
      cnnFearGreedDate: null,
      cryptoFearGreedDate: null,
    });
  });

  test("clears both caches", () => {
    saveStoredMonthlyReturns([{ month: "2025-01", returnPct: 2.7 }]);
    saveStoredMetrics({ vix: 18.21 });

    clearStoredData();

    expect(loadStoredMonthlyReturns()).toBeNull();
    expect(loadStoredMetrics()).toBeNull();
  });
});
