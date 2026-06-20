export const CURRENCY = '₴';
export const formatPrice = (price: number): string => `${price.toFixed(0)} ${CURRENCY}`;

export function apiHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}
