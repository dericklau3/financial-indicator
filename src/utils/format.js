export const formatPct = (value, digits = 1) => `${value.toFixed(digits)}%`;

export const formatMonth = (monthKey) => {
  const [y, m] = monthKey.split("-");
  return `${y}.${m}`;
};
