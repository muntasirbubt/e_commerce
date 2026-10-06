import { db } from "@/lib/db";

export async function getStoreSettings() {
  const defaults = {
    gatewayEnabled: process.env.ENABLE_PAYMENT_GATEWAY === "true",
    activePaymentProviders: (
      process.env.ACTIVE_PAYMENT_PROVIDERS ?? "cod,bank_transfer,order_request"
    )
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
    shippingFee: Number(process.env.SHIPPING_FEE ?? 0),
    lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD ?? 5),
    storeName: process.env.STORE_NAME ?? "Modular Market",
    currency: process.env.STORE_CURRENCY ?? "USD",
    supportEmail: process.env.SUPPORT_EMAIL ?? "",
    supportPhone: process.env.SUPPORT_PHONE ?? "",
    storeAddress: process.env.STORE_ADDRESS ?? "",
  };
  try {
    const saved = await db.storeSettings.findUnique({ where: { id: 1 } });
    return saved
      ? { ...saved, shippingFee: Number(saved.shippingFee) }
      : defaults;
  } catch {
    return defaults;
  }
}

export async function enabledPaymentProviders() {
  const settings = await getStoreSettings();
  return settings.activePaymentProviders.filter((provider) => {
    if (provider === "stripe")
      return (
        settings.gatewayEnabled &&
        Boolean(
          process.env.STRIPE_SECRET_KEY &&
            process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        )
      );
    if (provider === "paypal") return false; // PayPal is withheld until its capture/webhook adapter is configured.
    return true;
  });
}
