// Flash-sale config. Only these 10 hand-picked products are discounted, and the
// discount must show anywhere they appear (cards, product page, sale page,
// cart). Everything here is derived from this single source of truth.

export const SALE_DISCOUNT = 0.4; // 40% off
export const SALE_PERCENT = Math.round(SALE_DISCOUNT * 100); // 40

// The 10 products currently on sale (DummyJSON ids, spread across categories).
export const SALE_PRODUCT_IDS: readonly number[] = [
  6, // Calvin Klein CK One (fragrances)
  80, // Huawei Matebook X Pro (laptops)
  90, // Puma Future Rider Trainers (mens-shoes)
  95, // Rolex Cellini Date Black Dial (mens-watches)
  99, // Amazon Echo Plus (mobile-accessories)
  130, // Realme XT (smartphones)
  156, // Green and Black Glasses (sunglasses)
  160, // Samsung Galaxy Tab S8 Plus (tablets)
  173, // Heshe Women's Leather Bag (womens-bags)
  180, // Dress Pea (womens-dresses)
];

const SALE_SET = new Set<number>(SALE_PRODUCT_IDS);

export function isOnSale(id: number): boolean {
  return SALE_SET.has(id);
}

// The price to charge/show for a product: discounted if it's on sale, otherwise
// unchanged.
export function salePrice(id: number, price: number): number {
  return isOnSale(id) ? price * (1 - SALE_DISCOUNT) : price;
}
