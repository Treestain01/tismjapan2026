/**
 * Extract a numeric JPY value from cost strings like:
 *   "¥1,200"  →  1200
 *   "¥12,000 per night"  →  12000
 *   "¥1,250 (ropeway return)"  →  1250
 *   "Free" / "Varies" / null  →  null
 */
export function parseJPY(cost: string | null): number | null {
  if (!cost) return null;
  const match = cost.match(/¥([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ''), 10);
}

/**
 * Format a JPY amount as AUD with cents, e.g. 1200 * 0.0103 → "A$12.36"
 */
export function formatAUDCents(jpy: number, rate: number): string {
  const aud = jpy * rate;
  return `A$${aud.toFixed(2)}`;
}

/**
 * Format a JPY total as AUD rounded to nearest dollar, e.g. 185000 * 0.0103 → "A$1,905"
 */
export function formatAUDRounded(jpy: number, rate: number): string {
  const aud = jpy * rate;
  return `A$${Math.round(aud).toLocaleString('en-AU')}`;
}
