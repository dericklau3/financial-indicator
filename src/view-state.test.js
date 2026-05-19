import { describe, expect, test } from "bun:test";
import { getInitialView, saveSelectedView } from "./view-state.js";

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

describe("view state persistence", () => {
  test("restores a valid saved sidebar view", () => {
    expect(getInitialView(createStorage({ "market-pulse-selected-view": "fred" }))).toBe("fred");
    expect(getInitialView(createStorage({ "market-pulse-selected-view": "fedfunds" }))).toBe("fedfunds");
  });

  test("falls back to dashboard when saved view is missing or invalid", () => {
    expect(getInitialView(createStorage())).toBe("dashboard");
    expect(getInitialView(createStorage({ "market-pulse-selected-view": "missing" }))).toBe("dashboard");
  });

  test("saves the selected sidebar view", () => {
    const storage = createStorage();

    saveSelectedView("calculator", storage);

    expect(getInitialView(storage)).toBe("calculator");
  });
});
