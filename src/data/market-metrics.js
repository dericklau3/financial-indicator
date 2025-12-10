export const marketMetrics = {
  vix: 15.2,
  cnnFearGreed: 54,
  cryptoFearGreed: 48,
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
  return { ...marketMetrics };
}
