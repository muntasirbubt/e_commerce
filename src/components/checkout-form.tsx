"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Tag, Trash2 } from "lucide-react";
type CartItem = { variantId: string; quantity: number };
type CartRow = {
  id: string;
  sku: string;
  stockQuantity: number;
  price: number;
  salePrice: number | null;
  attributesJson: Record<string, string>;
  product: { title: string };
};
type Coupon = {
  code: string;
  discountAmount: number;
  discountType: "FIXED" | "PERCENTAGE";
  amount: number;
};
export function CheckoutForm({
  providers,
  shippingFee,
  currency,
}: {
  providers: string[];
  shippingFee: number;
  currency: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [rows, setRows] = useState<CartRow[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<Coupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  useEffect(() => {
    const items = JSON.parse(
      localStorage.getItem("cart") ?? "[]",
    ) as CartItem[];
    setCart(items);
    if (items.length)
      fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      })
        .then((r) => r.json())
        .then((d) => setRows(d.items ?? []))
        .catch(() =>
          setError("Could not load your cart. Refresh and try again."),
        );
  }, []);
  const subtotal = useMemo(
    () =>
      rows.reduce(
        (sum, row) =>
          sum +
          (row.salePrice && row.salePrice < row.price
            ? row.salePrice
            : row.price) *
            (cart.find((x) => x.variantId === row.id)?.quantity ?? 0),
        0,
      ),
    [rows, cart],
  );
  async function applyCode() {
    setCouponMessage("");
    setCouponBusy(true);
    const r = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    const data = await r.json();
    setCouponBusy(false);
    if (!r.ok) {
      setApplied(null);
      setCouponMessage(data.error ?? "That code could not be applied.");
      return;
    }
    setApplied(data);
    setCouponMessage(`${data.code} is applied.`);
  }
  async function submit(formData: FormData) {
    setError("");
    setBusy(true);
    const address = {
      line1: String(formData.get("line1")),
      line2: String(formData.get("line2") ?? ""),
      city: String(formData.get("city")),
      region: String(formData.get("region")),
      postalCode: String(formData.get("postalCode")),
      country: String(formData.get("country")),
    };
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerName: formData.get("name"),
        customerEmail: formData.get("email"),
        address,
        paymentMethod: formData.get("paymentMethod"),
        couponCode: applied?.code,
        items: cart,
      }),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to submit your order.");
      return;
    }
    if (result.checkoutUrl) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    localStorage.removeItem("cart");
    setDone(result.orderNumber);
  }
  const discount = applied ? Math.min(subtotal, applied.discountAmount) : 0,
    total = subtotal - discount + shippingFee;
  if (done)
    return (
      <div className="mt-10 rounded-[1.6rem] bg-white p-9 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#eaf2e9] text-[#4e7055]">
          <Check />
        </span>
        <h2 className="mt-4 font-serif text-3xl text-[#1b3b2b]">
          Thank you for your order.
        </h2>
        <p className="mt-3 text-sm text-[#718075]">
          Order reference: <strong className="text-[#304536]">{done}</strong>
        </p>
        <p className="mt-2 text-xs text-[#8a948b]">
          We’ll be in touch with next steps.
        </p>
        <a
          className="mt-6 inline-block rounded-full bg-[#1b3b2b] px-6 py-3 text-xs text-white"
          href="/"
        >
          Continue exploring
        </a>
      </div>
    );
  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_370px]">
      <form action={submit} className="space-y-5">
        <section className="rounded-[1.4rem] border border-[#1b3b2b]/10 bg-white p-6 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
            Where should we send it?
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">
            Your details
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["name", "Full name", "text"],
              ["email", "Email address", "email"],
              ["line1", "Street address", "text"],
              ["line2", "Apartment or suite · optional", "text"],
              ["city", "City", "text"],
              ["region", "State or region", "text"],
              ["postalCode", "Postal code", "text"],
              ["country", "Country", "text"],
            ].map(([id, label, type]) => (
              <label key={id} className="text-xs font-medium text-[#68776b]">
                {label}
                <input
                  name={id}
                  type={type}
                  required={!id.includes("line2")}
                  autoComplete={
                    id === "name"
                      ? "name"
                      : id === "email"
                        ? "email"
                        : id === "line1"
                          ? "street-address"
                          : undefined
                  }
                  className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/10 bg-[#fbfcfa] px-3 py-3 text-sm outline-none focus:border-[#84a98c]"
                />
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-[1.4rem] border border-[#1b3b2b]/10 bg-white p-6 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
            A good way to pay
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">Payment</h2>
          {providers.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {providers.map((p) => (
                <label
                  key={p}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#1b3b2b]/10 p-4 text-xs transition hover:bg-[#f6f8f4]"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={p}
                    required
                    defaultChecked={providers[0] === p}
                  />
                  <span>
                    {(
                      {
                        cod: "Cash on delivery",
                        bank_transfer: "Direct bank transfer",
                        order_request: "Order request",
                        stripe: "Credit / debit card",
                        paypal: "PayPal",
                      } as Record<string, string>
                    )[p] ?? p}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-red-50 p-4 text-xs text-red-700">
              No payment methods are active. Please contact the store.
            </p>
          )}
        </section>
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-xs text-red-700"
          >
            {error}
          </p>
        )}
        <button
          disabled={busy || !cart.length || !providers.length}
          className="inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-7 py-3.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {busy && <LoaderCircle size={15} className="animate-spin" />}
          {busy ? "Placing your order…" : "Place your order"}
        </button>
      </form>
      <aside className="sticky top-24 h-fit rounded-[1.4rem] border border-[#1b3b2b]/10 bg-white p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
          The good things
        </p>
        <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">Your bag</h2>
        {!cart.length && (
          <p className="mt-4 text-xs text-[#7c897f]">
            Your bag is empty.{" "}
            <a href="/#shop" className="underline">
              Browse the shop
            </a>
          </p>
        )}
        {rows.map((row) => {
          const quantity =
              cart.find((x) => x.variantId === row.id)?.quantity ?? 0,
            price =
              row.salePrice && row.salePrice < row.price
                ? row.salePrice
                : row.price;
          return (
            <div
              key={row.id}
              className="mt-5 flex justify-between gap-4 text-xs"
            >
              <span className="text-[#68776b]">
                {row.product.title} × {quantity}
                {Object.values(row.attributesJson).length
                  ? ` · ${Object.values(row.attributesJson).join(" / ")}`
                  : ""}
                <span className="mt-1 block text-[10px] text-[#99a199]">
                  {currency} {price.toFixed(2)} each
                </span>
              </span>
              <span className="shrink-0 text-[#304536]">
                {currency} {(price * quantity).toFixed(2)}
              </span>
            </div>
          );
        })}
        <div className="mt-5 rounded-xl bg-[#f3f6f1] p-3">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-[#617563]">
            A little code, if you have one
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Promo code"
              className="min-w-0 flex-1 rounded-full border border-[#1b3b2b]/10 bg-white px-3 py-2 text-xs outline-none focus:border-[#84a98c]"
            />
            <button
              type="button"
              disabled={couponBusy || !code || subtotal <= 0}
              onClick={applyCode}
              className="rounded-full bg-[#1b3b2b] px-4 py-2 text-[10px] font-medium text-white disabled:opacity-40"
            >
              {couponBusy ? "Checking…" : "Apply"}
            </button>
          </div>
          {applied && (
            <button
              type="button"
              onClick={() => {
                setApplied(null);
                setCouponMessage("");
              }}
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#4b6e52]"
            >
              <Trash2 size={11} /> Remove {applied.code}
            </button>
          )}
          {couponMessage && (
            <p
              role="status"
              className={`mt-2 text-[10px] ${applied ? "text-[#4b6e52]" : "text-red-700"}`}
            >
              {couponMessage}
            </p>
          )}
        </div>
        <div className="mt-5 space-y-2.5 border-t border-[#1b3b2b]/10 pt-4 text-xs text-[#738075]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>
              {currency} {subtotal.toFixed(2)}
            </span>
          </div>
          {applied && (
            <div className="flex justify-between text-[#4b6e52]">
              <span>Offer · {applied.code}</span>
              <span>
                − {currency} {discount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>
              {currency} {shippingFee.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#1b3b2b]/10 pt-3 text-sm font-semibold text-[#1b3b2b]">
            <span>Total</span>
            <span>
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
