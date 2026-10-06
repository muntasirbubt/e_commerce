"use client";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
export function NotifyForm({
  productId,
  launchAt,
}: {
  productId: string;
  launchAt?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [left, setLeft] = useState("");
  useEffect(() => {
    if (!launchAt) return;
    const target = new Date(launchAt).getTime();
    const render = () => {
      const n = Math.max(0, target - Date.now());
      const d = Math.floor(n / 86400000),
        h = Math.floor((n % 86400000) / 3600000),
        m = Math.floor((n % 3600000) / 60000);
      setLeft(n === 0 ? "Launching now" : `${d}d ${h}h ${m}m`);
    };
    render();
    const timer = setInterval(render, 60000);
    return () => clearInterval(timer);
  }, [launchAt]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const r = await fetch("/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, productId }),
    });
    const data = await r.json();
    setMessage(
      r.ok ? "You’re on the list." : (data.error ?? "Try again shortly."),
    );
    if (r.ok) setEmail("");
  }
  return (
    <div className="mt-5">
      {left && (
        <p className="mb-4 text-xs uppercase tracking-wider text-[#73917a]">
          Launching in{" "}
          <span className="font-semibold text-[#1b3b2b]">{left}</span>
        </p>
      )}
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="min-w-0 flex-1 rounded-full border border-[#1b3b2b]/15 bg-white/75 px-4 py-3 text-sm outline-none focus:border-[#84a98c]"
        />
        <button className="inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#294f3b]">
          <Bell size={15} /> Notify me
        </button>
      </form>
      {message && (
        <p
          role="status"
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#496b50]"
        >
          <Check size={13} />
          {message}
        </p>
      )}
    </div>
  );
}
