"use client";

import { useMemo, useState } from "react";

type StockRow = { id: string; sku: string; stockQuantity: number; attrs: string; title: string };
type StaffOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  items: { title: string; quantity: number }[];
};
type StockLog = {
  id: string;
  changeQuantity: number;
  reason: string;
  createdAt: string;
  sku: string;
  title: string;
};

export function StaffOperations({
  stock,
  orders: initialOrders,
  logs: initialLogs,
  lowStockThreshold,
}: {
  stock: StockRow[];
  orders: StaffOrder[];
  logs: StockLog[];
  lowStockThreshold: number;
}) {
  const [inventory, setInventory] = useState(stock);
  const [orders, setOrders] = useState(initialOrders);
  const [logs, setLogs] = useState(initialLogs);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const visibleStock = useMemo(
    () =>
      inventory.filter((row) =>
        `${row.title} ${row.sku} ${row.attrs}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [inventory, query],
  );
  const visibleOrders = useMemo(
    () =>
      orders.filter((order) =>
        `${order.orderNumber} ${order.customerName} ${order.customerPhone}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [orders, query],
  );

  async function adjust(form: FormData) {
    setMessage("");
    const variantId = String(form.get("variantId"));
    const response = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        variantId,
        changeQuantity: Number(form.get("changeQuantity")),
        reason: form.get("reason"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not adjust stock.");
      return;
    }
    setInventory(
      inventory.map((row) =>
        row.id === variantId ? { ...row, stockQuantity: result.stockQuantity } : row,
      ),
    );
    setLogs(
      [
        {
          id: crypto.randomUUID(),
          changeQuantity: Number(form.get("changeQuantity")),
          reason: String(form.get("reason")),
          createdAt: new Date().toISOString(),
          sku: inventory.find((row) => row.id === variantId)?.sku ?? "",
          title: inventory.find((row) => row.id === variantId)?.title ?? "",
        },
        ...logs,
      ].slice(0, 20),
    );
    setMessage("Stock movement recorded.");
  }

  async function updateStatus(order: StaffOrder, status: string) {
    setMessage("");
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not update order.");
      return;
    }
    setOrders(
      orders.map((item) => (item.id === order.id ? { ...item, status: result.status } : item)),
    );
    setMessage(`${order.orderNumber} status updated.`);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
        Store operations · Staff
      </p>
      <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">Fulfillment workspace</h1>
      <p className="mt-2 text-sm text-[#657367]">
        Manage stock movements and today’s delivery queue.
      </p>
      {message && (
        <p role="status" className="mt-4 rounded-xl bg-[#e7eddf] p-3 text-sm text-[#315a3b]">
          {message}
        </p>
      )}
      <label className="mt-6 block max-w-xl text-xs font-semibold text-[#34473b]">
        Search orders and inventory
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Order number, customer, product, SKU"
          className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm font-normal"
        />
      </label>

      <section className="mt-7 overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
        <div className="border-b border-[#1b3b2b]/10 px-5 py-4">
          <h2 className="font-serif text-2xl text-[#1b3b2b]">Today’s fulfillment queue</h2>
          <p className="mt-1 text-xs text-[#718075]">
            Update each order as it moves through dispatch and delivery.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#f5f7f3] text-[10px] uppercase tracking-wider text-[#6a786d]">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b3b2b]/[.07]">
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-semibold text-[#1b3b2b]">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-xs text-[#34473b]">
                    {order.customerName}
                    <span className="mt-1 block text-[#718075]">{order.customerPhone}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#56645a]">
                    {order.items.map((item, index) => (
                      <span key={`${item.title}-${index}`} className="mr-2">
                        {item.title} × {item.quantity}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#56645a]">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      disabled={order.status === "DELIVERED" || order.status === "CANCELLED"}
                      onChange={(event) => void updateStatus(order, event.target.value)}
                      className="rounded-lg border border-[#1b3b2b]/15 bg-white px-2 py-2 text-xs text-[#34473b]"
                    >
                      <option value={order.status}>{statusLabel(order.status)}</option>
                      {nextStatuses(order.status).map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleOrders.length === 0 && (
            <p className="p-6 text-sm text-[#718075]">
              No orders in today’s queue match this search.
            </p>
          )}
        </div>
      </section>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <section className="overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
          <div className="border-b border-[#1b3b2b]/10 px-5 py-4">
            <h2 className="font-serif text-2xl text-[#1b3b2b]">Inventory</h2>
            <p className="mt-1 text-xs text-[#718075]">
              Low stock is highlighted at {lowStockThreshold} units or below.
            </p>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#f5f7f3] text-[10px] uppercase tracking-wider text-[#6a786d]">
                <tr>
                  <th className="px-4 py-3">Product / SKU</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">On hand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b3b2b]/[.07]">
                {visibleStock.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-xs font-medium text-[#34473b]">
                      {row.title}
                      <span className="mt-1 block text-[#718075]">{row.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#56645a]">{row.attrs || "Standard"}</td>
                    <td
                      className={`px-4 py-3 text-sm font-semibold ${row.stockQuantity <= lowStockThreshold ? "text-amber-700" : "text-[#1b3b2b]"}`}
                    >
                      {row.stockQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form
            action={adjust}
            className="grid gap-3 border-t border-[#1b3b2b]/10 p-4 sm:grid-cols-2"
          >
            <label className="text-xs font-medium text-[#56645a]">
              Variant
              <select
                name="variantId"
                required
                className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 bg-white px-2.5 py-2 text-xs"
              >
                {inventory.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title} · {row.sku} ({row.stockQuantity})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-[#56645a]">
              Units in / out
              <input
                name="changeQuantity"
                type="number"
                required
                min="-10000"
                max="10000"
                className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 px-2.5 py-2 text-xs"
              />
            </label>
            <label className="text-xs font-medium text-[#56645a] sm:col-span-2">
              Reason
              <input
                name="reason"
                required
                minLength={3}
                maxLength={200}
                placeholder="Stock received, damaged, or counted"
                className="mt-1 block w-full rounded-lg border border-[#1b3b2b]/15 px-2.5 py-2 text-xs"
              />
            </label>
            <button className="rounded-full bg-[#1b3b2b] px-4 py-2.5 text-xs font-semibold text-white sm:col-span-2">
              Record stock movement
            </button>
          </form>
        </section>
        <section className="overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
          <div className="border-b border-[#1b3b2b]/10 px-5 py-4">
            <h2 className="font-serif text-2xl text-[#1b3b2b]">Recent stock activity</h2>
          </div>
          <div className="divide-y divide-[#1b3b2b]/[.07]">
            {logs.map((log) => (
              <article key={log.id} className="px-4 py-3">
                <p className="text-xs font-medium text-[#34473b]">
                  {log.title} · {log.sku}
                </p>
                <p className="mt-1 text-xs text-[#718075]">
                  {log.changeQuantity > 0 ? "+" : ""}
                  {log.changeQuantity} units · {log.reason}
                </p>
                <time className="mt-1 block text-[10px] text-[#9aa39b]">
                  {new Date(log.createdAt).toLocaleString()}
                </time>
              </article>
            ))}
            {!logs.length && (
              <p className="p-5 text-sm text-[#718075]">No stock movements recorded.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function nextStatuses(status: string) {
  if (status === "PENDING") return ["PROCESSING"];
  if (status === "PROCESSING") return ["SHIPPED"];
  if (status === "SHIPPED") return ["DELIVERED"];
  return [];
}
function statusLabel(status: string) {
  return status === "DELIVERED" ? "Delivery done" : status[0] + status.slice(1).toLowerCase();
}
function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DELIVERED"
      ? "bg-emerald-100 text-emerald-800"
      : status === "CANCELLED"
        ? "bg-red-100 text-red-800"
        : status === "SHIPPED"
          ? "bg-blue-100 text-blue-800"
          : status === "PROCESSING"
            ? "bg-amber-100 text-amber-800"
            : "bg-stone-100 text-stone-700";
  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}
    >
      {statusLabel(status)}
    </span>
  );
}
