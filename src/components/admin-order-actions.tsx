"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Truck, X } from "lucide-react";

type Line = { variantId: string; quantity: number; price: number; label: string };
type Address = {
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  landmark?: string;
  deliveryNotes?: string;
};
type VariantOption = { id: string; sku: string; price: number; title: string };

export function AdminOrderActions({
  order,
  variants,
  currency,
}: {
  order: {
    id: string;
    status: string;
    paymentMethod: string;
    items: Line[];
    shippingAddress: Address;
    discountAmount: number;
    shippingAmount: number;
  };
  variants: VariantOption[];
  currency: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState(order.items.map((line) => ({ ...line })));
  const [address, setAddress] = useState({ ...order.shippingAddress });
  const [discount, setDiscount] = useState(String(order.discountAmount));
  const [shipping, setShipping] = useState(String(order.shippingAmount));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const editable = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  async function update(payload: object) {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(data.error ?? "Could not update the order.");
      return;
    }
    setMessage("Order updated.");
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void update({ status: "DELIVERED" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1b3b2b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Truck size={13} /> Mark delivered
        </button>
      )}
      {editable && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-full border border-[#1b3b2b]/20 px-3 py-2 text-xs font-semibold text-[#1b3b2b]"
        >
          {open ? "Close editor" : "Edit order"}
        </button>
      )}
      {editable && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Cancel this order and return its items to inventory?"))
              void update({ status: "CANCELLED" });
          }}
          className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
        >
          Cancel order
        </button>
      )}
      {open && (
        <div className="mt-2 w-full rounded-xl border border-[#1b3b2b]/10 bg-[#f8faf7] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1b3b2b]">Edit items and delivery</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close editor">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div
                key={`${line.variantId}-${index}`}
                className="grid gap-2 sm:grid-cols-[1fr_90px_120px_auto]"
              >
                <select
                  value={line.variantId}
                  onChange={(event) => {
                    const v = variants.find((item) => item.id === event.target.value);
                    if (v)
                      setLines(
                        lines.map((x, i) =>
                          i === index
                            ? { ...x, variantId: v.id, price: v.price, label: v.title }
                            : x,
                        ),
                      );
                  }}
                  className="rounded-lg border border-[#1b3b2b]/15 bg-white px-2 py-2 text-xs text-[#263a2c]"
                >
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title} · {v.sku}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(event) =>
                    setLines(
                      lines.map((x, i) =>
                        i === index ? { ...x, quantity: Number(event.target.value) } : x,
                      ),
                    )
                  }
                  className="rounded-lg border border-[#1b3b2b]/15 px-2 py-2 text-xs"
                />
                <label className="flex items-center gap-1 rounded-lg border border-[#1b3b2b]/15 bg-white px-2 text-xs text-[#56645a]">
                  {currency}
                  <input
                    aria-label="Unit price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.price}
                    onChange={(event) =>
                      setLines(
                        lines.map((x, i) =>
                          i === index ? { ...x, price: Number(event.target.value) } : x,
                        ),
                      )
                    }
                    className="w-full py-2 text-xs text-[#263a2c] outline-none"
                  />
                </label>
                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                  className="rounded-lg p-2 text-red-700"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const v = variants[0];
              if (v)
                setLines([
                  ...lines,
                  { variantId: v.id, quantity: 1, price: v.price, label: v.title },
                ]);
            }}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#315a3b]"
          >
            <Plus size={14} /> Add item
          </button>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                "line1",
                "line2",
                "city",
                "region",
                "postalCode",
                "country",
                "landmark",
                "deliveryNotes",
              ] as const
            ).map((key) => (
              <label key={key} className="text-[10px] font-semibold text-[#56645a]">
                {key === "line1"
                  ? "Street address"
                  : key === "line2"
                    ? "Address line 2"
                    : key === "postalCode"
                      ? "Postal code"
                      : key === "deliveryNotes"
                        ? "Delivery notes"
                        : key[0].toUpperCase() + key.slice(1)}
                <input
                  value={address[key] ?? ""}
                  onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 bg-white px-2.5 py-2 text-xs"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-[10px] font-semibold text-[#56645a]">
              Discount
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 bg-white px-2.5 py-2 text-xs"
              />
            </label>
            <label className="text-[10px] font-semibold text-[#56645a]">
              Shipping
              <input
                type="number"
                min="0"
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 bg-white px-2.5 py-2 text-xs"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={
              busy || !lines.length || lines.some((line) => line.quantity < 1 || line.price < 0)
            }
            onClick={() =>
              void update({
                items: lines.map(({ variantId, quantity, price }) => ({
                  variantId,
                  quantity,
                  price,
                })),
                shippingAddress: address,
                discountAmount: Number(discount),
                shippingAmount: Number(shipping),
              })
            }
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Save size={14} /> Save order changes
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="w-full text-xs text-[#526156]">
          {message}
        </p>
      )}
    </div>
  );
}
