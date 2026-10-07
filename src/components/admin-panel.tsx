"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  ClipboardList,
  History,
  PackageSearch,
  Settings2,
} from "lucide-react";
import Link from "next/link";
import { OrderStatusTracker } from "@/components/order-status-tracker";
type Variant = {
  id: string;
  sku: string;
  price: number | string;
  stockQuantity: number;
  attributesJson: Record<string, string>;
};
type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  isPublished: boolean;
  imageUrl: string | null;
  categoryId: string | null;
  category: { name: string } | null;
  variants: Variant[];
};
type Settings = {
  gatewayEnabled: boolean;
  activePaymentProviders: string[];
  shippingFee: number;
  freeShippingThreshold: number | null;
  lowStockThreshold: number;
  storeName: string;
  currency: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
};
type Props = {
  products: Product[];
  orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    totalAmount: number | string;
    paymentMethod: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: { variant: { product: { title: string } } }[];
  }[];
  logs: {
    id: string;
    changeQuantity: number;
    reason: string;
    createdAt: string;
    variant: { sku: string; product: { title: string } };
  }[];
  settings: Settings;
};
const providers = ["cod", "bank_transfer", "order_request", "stripe", "paypal"];
const adminTabs = [
  { id: "inventory", label: "Inventory", Icon: Boxes },
  { id: "orders", label: "Orders", Icon: ClipboardList },
  { id: "products", label: "Products", Icon: PackageSearch },
  { id: "settings", label: "Settings", Icon: Settings2 },
  { id: "activity", label: "Stock activity", Icon: History },
];
export function AdminPanel({
  products: initial,
  orders,
  logs: initialLogs,
  settings: initialSettings,
}: Props) {
  const [products, setProducts] = useState(initial);
  const [logs, setLogs] = useState(initialLogs);
  const [settings, setSettings] = useState({
    ...initialSettings,
    shippingFee: Number(initialSettings.shippingFee),
  });
  const [note, setNote] = useState("");
  const [tab, setTab] = useState("inventory");
  const [inventoryQuery, setInventoryQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [orderQuery, setOrderQuery] = useState("");
  const visibleOrders = orders.filter((order) => {
    const query = orderQuery.trim().toLocaleLowerCase();
    return (
      !query ||
      order.orderNumber.toLocaleLowerCase().includes(query) ||
      order.customerName.toLocaleLowerCase().includes(query) ||
      order.customerEmail.toLocaleLowerCase().includes(query) ||
      order.items.some((item) => item.variant.product.title.toLocaleLowerCase().includes(query))
    );
  });
  const visibleInventory = products
    .flatMap((p) => p.variants.map((v) => ({ product: p, variant: v })))
    .filter(({ product, variant }) => {
      const q = inventoryQuery.trim().toLocaleLowerCase();
      const matches =
        !q ||
        product.title.toLocaleLowerCase().includes(q) ||
        (product.category?.name ?? "").toLocaleLowerCase().includes(q) ||
        variant.sku.toLocaleLowerCase().includes(q) ||
        Object.values(variant.attributesJson).some((x) => x.toLocaleLowerCase().includes(q));
      const status =
        variant.stockQuantity === 0
          ? "out"
          : variant.stockQuantity <= settings.lowStockThreshold
            ? "low"
            : "available";
      return matches && (stockFilter === "all" || stockFilter === status);
    });
  async function request(url: string, method: string, body: unknown) {
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }
  async function adjust(form: FormData) {
    setNote("");
    try {
      const data = await request("/api/admin/inventory", "POST", {
        variantId: form.get("variantId"),
        changeQuantity: Number(form.get("changeQuantity")),
        reason: form.get("reason"),
      });
      setProducts(
        products.map((p) => ({
          ...p,
          variants: p.variants.map((v) =>
            v.id === form.get("variantId") ? { ...v, stockQuantity: data.stockQuantity } : v,
          ),
        })),
      );
      setNote("Inventory updated.");
      window.location.reload();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not update inventory.");
    }
  }
  async function saveSettings(form: FormData) {
    const next = {
      ...settings,
      storeName: String(form.get("storeName")),
      currency: String(form.get("currency")).toUpperCase(),
      shippingFee: Number(form.get("shippingFee")),
      freeShippingThreshold:
        String(form.get("freeShippingThreshold") ?? "").trim() === ""
          ? null
          : Number(form.get("freeShippingThreshold")),
      lowStockThreshold: Number(form.get("lowStockThreshold")),
      gatewayEnabled: form.get("gatewayEnabled") === "on",
      activePaymentProviders: form.getAll("providers").map(String),
      supportEmail: String(form.get("supportEmail")),
      supportPhone: String(form.get("supportPhone")),
      storeAddress: String(form.get("storeAddress")),
    };
    try {
      await request("/api/admin/settings", "PUT", next);
      setSettings(next);
      setNote("Settings saved.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not save settings.");
    }
  }
  async function createProduct(form: FormData) {
    const title = String(form.get("title"));
    const attributesJson: Record<string, string> = {};
    if (form.get("size")) attributesJson.Size = String(form.get("size"));
    if (form.get("color")) attributesJson.Color = String(form.get("color"));
    try {
      const created = await request("/api/admin/products", "POST", {
        title,
        slug: String(form.get("slug")),
        description: String(form.get("description")),
        isPublished: form.get("isPublished") === "on",
        variants: [
          {
            sku: String(form.get("sku")),
            price: Number(form.get("price")),
            stockQuantity: Number(form.get("stockQuantity")),
            attributesJson,
          },
        ],
      });
      setProducts([created, ...products]);
      setNote("Product created.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not create product.");
    }
  }
  async function editProduct(product: Product) {
    const title = window.prompt("Product title", product.title);
    if (!title) return;
    const description = window.prompt("Product description", product.description);
    if (description === null) return;
    try {
      await request(`/api/admin/products/${product.id}`, "PUT", {
        title,
        slug: product.slug,
        description,
        isPublished: product.isPublished,
        imageUrl: product.imageUrl ?? "",
        categoryId: product.categoryId,
      });
      setProducts(products.map((p) => (p.id === product.id ? { ...p, title, description } : p)));
      setNote("Product details saved.");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not edit product.");
    }
  }
  async function toggleProduct(product: Product) {
    try {
      await request(`/api/admin/products/${product.id}`, "PUT", {
        title: product.title,
        slug: product.slug,
        description: product.description,
        isPublished: !product.isPublished,
        imageUrl: product.imageUrl ?? "",
        categoryId: product.categoryId,
      });
      setProducts(
        products.map((p) => (p.id === product.id ? { ...p, isPublished: !p.isPublished } : p)),
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Could not update product.");
    }
  }
  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2 border-b border-[#1b3b2b]/10 pb-4">
        {adminTabs.map(({ id, label, Icon }) => {
          const selected = tab === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={selected}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition ${
                selected
                  ? "bg-[#1b3b2b] text-white ring-2 ring-[#84a98c]/40"
                  : "border border-[#1b3b2b]/15 bg-white text-[#34473b] hover:bg-[#f0f5ef]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
      {note && <p className="my-4 rounded-xl bg-[#e7eddf] p-3 text-sm">{note}</p>}
      {tab === "inventory" && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white">
          <div className="grid gap-3 border-b border-[#1b3b2b]/10 p-4 sm:grid-cols-[1fr_200px]">
            <label className="text-xs font-semibold text-[#34473b]">
              Search inventory
              <input
                aria-label="Search inventory by product, category, SKU, or variant"
                value={inventoryQuery}
                onChange={(e) => setInventoryQuery(e.target.value)}
                placeholder="Product, category, SKU, color, size…"
                className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm font-normal text-[#212529] placeholder:text-[#66736a]"
              />
            </label>
            <label className="text-xs font-semibold text-[#34473b]">
              Stock status
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm font-normal text-[#34473b]"
              >
                <option value="all">All stock levels</option>
                <option value="available">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[#4f5d53]">
                  <th className="p-4">Product / variant</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleInventory.map(({ product: p, variant: v }) => (
                  <tr key={v.id} className="border-b border-black/5">
                    <td className="p-4 font-medium text-[#263a2c]">
                      {p.title}
                      <div className="mt-1 text-xs font-normal text-[#56645a]">
                        {p.category?.name ?? "Uncategorized"} ·{" "}
                        {Object.values(v.attributesJson).join(" / ") || "Default option"}
                      </div>
                    </td>
                    <td className="p-4">{v.sku}</td>
                    <td className="p-4">
                      {settings.currency} {Number(v.price).toFixed(2)}
                    </td>
                    <td className="p-4 font-semibold">{v.stockQuantity}</td>
                    <td className="p-4">
                      {v.stockQuantity === 0 ? (
                        <span className="text-red-700">Out of stock</span>
                      ) : v.stockQuantity <= settings.lowStockThreshold ? (
                        <span className="text-amber-700">Low stock</span>
                      ) : (
                        "In stock"
                      )}
                    </td>
                  </tr>
                ))}
                {!visibleInventory.length && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-[#56645a]">
                      No inventory matches this search and filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <form action={adjust} className="flex flex-wrap items-end gap-3 border-t p-5">
            <label className="text-xs text-[#34473b]">
              Variant
              <select
                name="variantId"
                required
                className="mt-1 block rounded-lg border bg-white p-2"
              >
                {products.flatMap((p) =>
                  p.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {p.title} / {v.sku} ({v.stockQuantity})
                    </option>
                  )),
                )}
              </select>
            </label>
            <label className="text-xs text-[#34473b]">
              Change (+ restock / − reduce)
              <input
                name="changeQuantity"
                type="number"
                required
                className="mt-1 block w-40 rounded-lg border p-2"
              />
            </label>
            <label className="text-xs text-[#34473b]">
              Reason
              <input
                name="reason"
                required
                minLength={3}
                placeholder="Restock delivery"
                className="mt-1 block rounded-lg border p-2"
              />
            </label>
            <button className="rounded-full bg-[#17231f] px-4 py-2 text-sm text-white">
              Adjust stock
            </button>
          </form>
        </div>
      )}
      {tab === "products" && (
        <div className="mt-6 space-y-5">
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#1b3b2b] p-6 text-white">
            <div>
              <h2 className="font-serif text-2xl">Full product editor</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
                Add product photos, edit variants, prices, stock, specifications, and search details
                in the Catalog Studio.
              </p>
            </div>
            <a
              href="/admin/catalog"
              style={{ backgroundColor: "#f1f5ef", color: "#163823" }}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <span className="grid size-7 place-items-center rounded-full bg-[#1b3b2b] text-white">
                <ArrowUpRight size={15} />
              </span>
              Open Catalog Studio
            </a>
          </section>
          <div className="space-y-3">
            {products.map((p) => (
              <article
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[#263a2c]">{p.title}</p>
                  <p className="mt-1 text-xs text-[#56645a]">
                    /{p.slug} · {p.variants.length} variant(s)
                  </p>
                </div>
                <a
                  href="/admin/catalog"
                  className="rounded-full border border-[#1b3b2b]/20 px-4 py-2 text-sm font-medium text-[#1b3b2b]"
                >
                  Edit in Catalog Studio
                </a>
              </article>
            ))}
            {!products.length && (
              <p className="rounded-xl bg-white p-5 text-sm text-[#56645a]">
                No products yet. Use the Catalog Studio to create your first listing and upload
                images.
              </p>
            )}
          </div>
        </div>
      )}
      {tab === "orders" && (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1b3b2b]/10 p-5">
            <div>
              <h2 className="font-serif text-2xl text-[#1b3b2b]">Today’s orders</h2>
              <p className="mt-1 text-xs text-[#56645a]">
                {orders.length} order{orders.length === 1 ? "" : "s"} placed today
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full border border-[#1b3b2b]/20 bg-[#f1f5ef] px-4 py-2.5 text-sm font-semibold text-[#163823]"
            >
              View all orders <ArrowUpRight size={15} />
            </Link>
          </div>
          <label className="block p-4 text-xs font-semibold text-[#34473b]">
            Search today’s orders
            <input
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              placeholder="Order number, customer name, email, or product"
              className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 px-3 py-2.5 text-sm font-normal text-[#212529] placeholder:text-[#66736a]"
            />
          </label>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[#4f5d53]">
                  {[
                    "Order",
                    "Customer / phone",
                    "Total",
                    "Status progress",
                    "Placed",
                    "Quick edit",
                  ].map((heading) => (
                    <th key={heading} className="p-4">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((order) => (
                  <tr key={order.id} className="border-b border-black/5 hover:bg-[#fbfcfa]">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#1b3b2b]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap text-xs font-medium text-[#34473b]">
                        {order.customerName}
                      </span>
                      <span className="mt-1 block whitespace-nowrap text-[10px] text-[#718075]">
                        {order.customerPhone || "No phone"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-[#1b3b2b]">
                      {settings.currency} {Number(order.totalAmount).toFixed(2)}
                      {order.paymentMethod === "cod" && (
                        <span className="ml-2 rounded-full bg-[#edf3eb] px-2 py-1 text-[9px] font-semibold text-[#315a3b]">
                          COD
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusTracker status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-[#56645a]">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders?q=${encodeURIComponent(order.orderNumber)}`}
                        className="whitespace-nowrap rounded-full border border-[#1b3b2b]/15 px-3 py-2 text-[10px] font-semibold text-[#315a3b] hover:bg-[#f0f5ef]"
                      >
                        Open / edit
                      </Link>
                    </td>
                  </tr>
                ))}
                {!visibleOrders.length && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#56645a]">
                      {orders.length
                        ? "No orders match this search."
                        : "No orders have been placed today."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "settings" && (
        <form
          action={saveSettings}
          className="mt-6 grid max-w-3xl gap-5 rounded-2xl bg-white p-6 sm:grid-cols-2"
        >
          <h2 className="text-xl font-semibold sm:col-span-2">Store settings</h2>
          <label className="text-sm">
            Store name
            <input
              name="storeName"
              defaultValue={settings.storeName}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Currency (ISO code)
            <input
              name="currency"
              defaultValue={settings.currency}
              maxLength={3}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Shipping fee
            <input
              name="shippingFee"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.shippingFee}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Free shipping from (blank = off)
            <input
              name="freeShippingThreshold"
              type="number"
              min="0"
              step="0.01"
              defaultValue={settings.freeShippingThreshold ?? ""}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Low stock threshold
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={settings.lowStockThreshold}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Support email
            <input
              name="supportEmail"
              type="email"
              defaultValue={settings.supportEmail}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm">
            Support phone
            <input
              name="supportPhone"
              defaultValue={settings.supportPhone}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Store address or service area
            <input
              name="storeAddress"
              defaultValue={settings.storeAddress}
              className="mt-1 block w-full rounded-lg border p-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input name="gatewayEnabled" type="checkbox" defaultChecked={settings.gatewayEnabled} />{" "}
            Enable online payment gateways
          </label>
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">Active payment providers</legend>
            {providers.map((p) => (
              <label key={p} className="mr-5 inline-flex items-center gap-2 text-sm">
                <input
                  name="providers"
                  type="checkbox"
                  value={p}
                  defaultChecked={settings.activePaymentProviders.includes(p)}
                />
                {
                  (
                    {
                      cod: "Cash on delivery",
                      bank_transfer: "Bank transfer",
                      order_request: "Order request",
                      stripe: "Stripe",
                      paypal: "PayPal",
                    } as Record<string, string>
                  )[p]
                }
              </label>
            ))}
          </fieldset>
          <button className="w-fit rounded-full bg-[#1b3b2b] px-5 py-3 text-sm text-white">
            Save settings
          </button>
        </form>
      )}
      {tab === "activity" && (
        <div className="mt-6 space-y-3">
          {logs.map((log) => (
            <article
              key={log.id}
              className="flex flex-wrap justify-between gap-3 rounded-xl bg-white p-4 text-sm"
            >
              <div>
                <p className="font-medium">
                  {log.variant.product.title} · {log.variant.sku}
                </p>
                <p className="mt-1 text-black/50">{log.reason}</p>
              </div>
              <div className="text-right">
                <p className={log.changeQuantity > 0 ? "text-[#496b50]" : "text-amber-700"}>
                  {log.changeQuantity > 0 ? "+" : ""}
                  {log.changeQuantity} units
                </p>
                <p className="mt-1 text-xs text-black/40">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
          {!logs.length && (
            <p className="rounded-xl bg-white p-5 text-sm text-black/50">No stock activity yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
