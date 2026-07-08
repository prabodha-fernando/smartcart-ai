export const SALE_DISCOUNT = 0.4;
export const SALE_PERCENT = Math.round(SALE_DISCOUNT * 100);

export const SALE_PRODUCT_IDS: readonly number[] = [
  6,
  80,
  90,
  95,
  99,
  130,
  156,
  160,
  173,
  180,
];

const SALE_SET = new Set<number>(SALE_PRODUCT_IDS);

export function isOnSale(id: number): boolean {
  return SALE_SET.has(id);
}

export function salePrice(id: number, price: number): number {
  return isOnSale(id) ? price * (1 - SALE_DISCOUNT) : price;
}
