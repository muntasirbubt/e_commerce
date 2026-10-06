"use client";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
type Coupon = {
  id: string;
  code: string;
  discountType: "FIXED" | "PERCENTAGE";
  amount: number | string;
  active: boolean;
  redemptionCount: number;
  maxRedemptions: number | null;
  endsAt: string | null;
};
export function CouponManager({ initial }: { initial: Coupon[] }) {
  const [coupons, setCoupons] = useState(initial);
  const [message, setMessage] = useState("");
  async function create(form: FormData) {
    setMessage("");
    const body = {
      code: String(form.get("code")).toUpperCase(),
      discountType: form.get("discountType"),
      amount: Number(form.get("amount")),
      maxRedemptions: form.get("maxRedemptions")
        ? Number(form.get("maxRedemptions"))
        : null,
      startsAt: form.get("startsAt")
        ? new Date(String(form.get("startsAt"))).toISOString()
        : null,
      endsAt: form.get("endsAt")
        ? new Date(String(form.get("endsAt"))).toISOString()
        : null,
    };
    const r = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) {
      setMessage(data.error ?? "Could not create code.");
      return;
    }
    setCoupons([data, ...coupons]);
    setMessage("Promo code created.");
  }
  async function toggle(c: Coupon) {
    const r = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error ?? "Could not update code.");
      return;
    }
    setCoupons(
      coupons.map((x) => (x.id === c.id ? { ...x, active: d.active } : x)),
    );
  }
  return (
    <div className="mt-8 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
      <form
        action={create}
        className="h-fit rounded-2xl border border-[#1b3b2b]/10 bg-white p-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
          Create an offer
        </p>
        <h2 className="mt-2 font-serif text-2xl text-[#1b3b2b]">
          A little thank-you.
        </h2>
        <Field label="Promo code">
          <input
            name="code"
            required
            minLength={3}
            className="field"
            placeholder="WELCOME15"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Discount type">
            <select name="discountType" className="field">
              <option value="PERCENTAGE">Percent</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </Field>
          <Field label="Amount">
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className="field"
            />
          </Field>
        </div>
        <Field label="Maximum redemptions (optional)">
          <input
            name="maxRedemptions"
            type="number"
            min="1"
            className="field"
          />
        </Field>
        <Field label="Starts at (optional)">
          <input name="startsAt" type="datetime-local" className="field" />
        </Field>
        <Field label="Ends at (optional)">
          <input name="endsAt" type="datetime-local" className="field" />
        </Field>
        {message && (
          <p role="status" className="mb-3 text-xs text-[#59765f]">
            {message}
          </p>
        )}
        <button className="inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3 text-xs text-white">
          <Plus size={14} /> Create code
        </button>
        <style jsx>{`
          .field {
            display: block;
            width: 100%;
            margin-top: 0.4rem;
            border: 1px solid rgba(27, 59, 43, 0.13);
            border-radius: 0.8rem;
            background: #fff;
            padding: 0.7rem 0.8rem;
            font-size: 0.8rem;
            outline: none;
          }
          .field:focus {
            border-color: #84a98c;
          }
        `}</style>
      </form>
      <section>
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
            Live & past offers
          </p>
          <h2 className="mt-1 font-serif text-2xl text-[#1b3b2b]">
            Promo codes
          </h2>
        </div>
        <div className="space-y-3">
          {coupons.map((c) => (
            <article
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
            >
              <div>
                <p className="font-mono text-sm font-semibold tracking-wider text-[#1b3b2b]">
                  {c.code}
                </p>
                <p className="mt-1 text-xs text-[#7a887d]">
                  {c.discountType === "PERCENTAGE"
                    ? `${Number(c.amount)}% off`
                    : `${Number(c.amount).toFixed(2)} off`}{" "}
                  · used {c.redemptionCount}
                  {c.maxRedemptions ? ` of ${c.maxRedemptions}` : " times"}
                  {c.endsAt
                    ? ` · ends ${new Date(c.endsAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <button
                onClick={() => toggle(c)}
                className={`rounded-full px-4 py-2 text-xs ${c.active ? "bg-[#edf3eb] text-[#4c6d53]" : "border border-[#1b3b2b]/15 text-[#77857a]"}`}
              >
                {c.active ? (
                  <>
                    <Check size={12} className="mr-1 inline" />
                    Active
                  </>
                ) : (
                  "Paused"
                )}
              </button>
            </article>
          ))}
          {!coupons.length && (
            <div className="rounded-2xl border border-dashed border-[#1b3b2b]/20 p-8 text-sm text-[#77857a]">
              No promo codes yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block text-[10px] font-medium text-[#657468]">
      {label}
      {children}
    </label>
  );
}
