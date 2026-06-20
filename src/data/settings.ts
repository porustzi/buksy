export const CURRENCY = '₴';
export const formatPrice = (price: number): string => `${price.toFixed(0)} ${CURRENCY}`;

const API_SECRET = import.meta.env.VITE_API_SECRET || '';

export function apiHeaders(): Record<string, string> {
  var headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_SECRET) headers['X-API-Key'] = API_SECRET;
  return headers;
}
