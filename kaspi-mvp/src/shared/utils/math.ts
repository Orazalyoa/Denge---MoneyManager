export function evaluateMathExpression(expression: string): number | null {
  const normalized = expression.replace(/,/g, ".").trim();

  if (!normalized) return null;
  if (!/^[\d+\-*/().\s]+$/.test(normalized)) return null;

  try {
    const result = Function(`\"use strict\"; return (${normalized});`)() as number;
    if (!Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}
