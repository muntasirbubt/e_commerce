/**
 * Shipping for a cart. `subtotal` is the item total after discounts.
 * Free when a threshold is set and the subtotal reaches it.
 * Pure (no DB access) so it can run in both server routes and client components.
 */
export function computeShipping(
  subtotal: number,
  settings: { shippingFee: number; freeShippingThreshold: number | null },
) {
  if (settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold)
    return 0;
  return settings.shippingFee;
}
