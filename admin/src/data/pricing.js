// Which NAV price a customer sees, by their price group in nav_ShopCustomers.xml.
// Confirmed by Ihle (email, 26.10.2026): VK01 → <Price>, VK02 → <Price2> in nav_ShopItems.xml.
export const PRICE_GROUPS = [
  { code: 'VK01', priceField: 'price' },
  { code: 'VK02', priceField: 'price2' },
]
