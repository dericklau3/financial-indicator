export const marketMetrics = {
  spParticipation20: 68,
  spParticipation50: 62,
  cnnFearGreed: 54,
  cryptoFearGreed: 48,
};

/**
 * Quick helper to update metrics in place.
 */
export function updateMetrics(next) {
  if (typeof next.spParticipation20 === "number") {
    marketMetrics.spParticipation20 = next.spParticipation20;
  }
  if (typeof next.spParticipation50 === "number") {
    marketMetrics.spParticipation50 = next.spParticipation50;
  }
  if (typeof next.cnnFearGreed === "number") {
    marketMetrics.cnnFearGreed = next.cnnFearGreed;
  }
  if (typeof next.cryptoFearGreed === "number") {
    marketMetrics.cryptoFearGreed = next.cryptoFearGreed;
  }
  return { ...marketMetrics };
}
