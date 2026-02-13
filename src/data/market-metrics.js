export const marketMetrics = {
  vix: 15.2,
  cnnFearGreed: 54,
  cryptoFearGreed: 48,
  vixDate: null,
  cnnFearGreedDate: null,
  cryptoFearGreedDate: null,
};

/**
 * Quick helper to update metrics in place.
 */
export function updateMetrics(next) {
  if (typeof next.vix === "number") {
    marketMetrics.vix = next.vix;
  }
  if (typeof next.cnnFearGreed === "number") {
    marketMetrics.cnnFearGreed = next.cnnFearGreed;
  }
  if (typeof next.cryptoFearGreed === "number") {
    marketMetrics.cryptoFearGreed = next.cryptoFearGreed;
  }
  if (typeof next.vixDate === "string") {
    marketMetrics.vixDate = next.vixDate;
  }
  if (typeof next.cnnFearGreedDate === "string") {
    marketMetrics.cnnFearGreedDate = next.cnnFearGreedDate;
  }
  if (typeof next.cryptoFearGreedDate === "string") {
    marketMetrics.cryptoFearGreedDate = next.cryptoFearGreedDate;
  }
  return { ...marketMetrics };
}
