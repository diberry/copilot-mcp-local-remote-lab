export function median(values: readonly number[]) {
  if (!values.length) throw new Error("At least one value is required.");
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function p95(values: readonly number[]) {
  if (!values.length) throw new Error("At least one value is required.");
  return [...values].sort((a, b) => a - b)[
    Math.ceil(values.length * 0.95) - 1
  ]!;
}

export function summarize(values: readonly number[]) {
  return { count: values.length, medianMs: median(values), p95Ms: p95(values) };
}
