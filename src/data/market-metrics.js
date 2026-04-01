export function createEmptyMetrics() {
  return {
    vix: null,
    cnnFearGreed: null,
    cryptoFearGreed: null,
    vixDate: null,
    cnnFearGreedDate: null,
    cryptoFearGreedDate: null,
  };
}

export function updateMetrics(current, next) {
  const base = { ...createEmptyMetrics(), ...(current || {}) };
  const incoming = next || {};

  if (typeof incoming.vix === "number") {
    base.vix = incoming.vix;
  }
  if (typeof incoming.cnnFearGreed === "number") {
    base.cnnFearGreed = incoming.cnnFearGreed;
  }
  if (typeof incoming.cryptoFearGreed === "number") {
    base.cryptoFearGreed = incoming.cryptoFearGreed;
  }
  if (typeof incoming.vixDate === "string") {
    base.vixDate = incoming.vixDate;
  }
  if (typeof incoming.cnnFearGreedDate === "string") {
    base.cnnFearGreedDate = incoming.cnnFearGreedDate;
  }
  if (typeof incoming.cryptoFearGreedDate === "string") {
    base.cryptoFearGreedDate = incoming.cryptoFearGreedDate;
  }

  return base;
}
