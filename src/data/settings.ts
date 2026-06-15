export const CURRENCY = '₴';
export const formatPrice = (price: number): string => `${CURRENCY}${price.toFixed(0)}`;
