import { CheckoutForm } from "@/components/checkout-form";
import { enabledPaymentProviders, getStoreSettings } from "@/lib/config";
export default async function CheckoutPage() {
  const [settings, providers] = await Promise.all([getStoreSettings(), enabledPaymentProviders()]);
  return <main className="mx-auto max-w-5xl px-6 py-12"><p className="text-sm uppercase tracking-widest text-[#719159]">Your order</p><h1 className="mt-2 text-4xl font-semibold">Checkout</h1><CheckoutForm providers={providers} shippingFee={settings.shippingFee} currency={settings.currency}/></main>;
}
