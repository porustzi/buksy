export const CURRENCY = '₴';
export const formatPrice = (price: number): string => `${price.toFixed(0)} ${CURRENCY}`;
