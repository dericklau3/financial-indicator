const SELECTED_VIEW_KEY = "market-pulse-selected-view";
const VALID_VIEWS = new Set(["dashboard", "fred", "calculator", "investors"]);

const getStorage = (storage) => {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
};

export const getInitialView = (storage) => {
  const viewStorage = getStorage(storage);
  const savedView = viewStorage?.getItem(SELECTED_VIEW_KEY);
  return VALID_VIEWS.has(savedView) ? savedView : "dashboard";
};

export const saveSelectedView = (view, storage) => {
  if (!VALID_VIEWS.has(view)) return;
  const viewStorage = getStorage(storage);
  viewStorage?.setItem(SELECTED_VIEW_KEY, view);
};
