"use client";
import { useState } from "react";
type User = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  createdAt: string;
};
export function UserManager({ initial, actorId }: { initial: User[]; actorId: string }) {
  const [users, setUsers] = useState(initial);
  const [message, setMessage] = useState("");
  async function change(user: User, role: User["role"]) {
    const r = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error ?? "Could not update role.");
      return;
    }
    setUsers(users.map((u) => (u.id === user.id ? { ...u, role: d.role } : u)));
    setMessage(`${user.email} is now a ${d.role.toLowerCase()}.`);
  }
  async function create(form: FormData) {
    setMessage("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Could not create account.");
      return;
    }
    setUsers([result, ...users]);
    setMessage(`Created ${result.role.toLowerCase()} account for ${result.email}.`);
  }
  return (
    <div className="mt-8">
      <form
        action={create}
        className="mb-6 grid gap-3 rounded-2xl border border-[#1b3b2b]/10 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      >
        <label className="text-xs font-medium text-[#566659]">
          Name
          <input
            name="name"
            minLength={2}
            maxLength={80}
            required
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-[#566659]">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-[#566659]">
          Temporary password
          <input
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 px-3 py-2.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-[#566659]">
          Role
          <select
            name="role"
            defaultValue="STAFF"
            className="mt-1.5 block w-full rounded-xl border border-[#1b3b2b]/15 bg-white px-3 py-2.5 text-sm"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="STAFF">Normal user / staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </label>
        <button className="rounded-full bg-[#1b3b2b] px-4 py-2.5 text-sm font-semibold text-white">
          Create user
        </button>
      </form>
      <p role="status" className="mb-4 text-xs text-[#54745b]">
        {message}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
        <div className="grid grid-cols-[1fr_1.3fr_.7fr_.6fr] gap-4 border-b border-[#1b3b2b]/10 bg-[#f5f7f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#78857a]">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Change role</span>
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-[1fr_1.3fr_.7fr_.6fr] items-center gap-4 border-b border-[#1b3b2b]/[.06] px-5 py-4 last:border-0"
          >
            <span className="truncate text-xs font-medium text-[#304536]">
              {u.name || "—"}
              {u.id === actorId && <span className="ml-2 text-[9px] text-[#8a968b]">You</span>}
            </span>
            <span className="truncate text-xs text-[#6e7c71]">{u.email}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#66766a]">{u.role}</span>
            <select
              aria-label={`Role for ${u.email}`}
              value={u.role}
              disabled={u.id === actorId}
              onChange={(event) => void change(u, event.target.value as User["role"])}
              className="rounded-lg border border-[#1b3b2b]/15 bg-white px-2 py-2 text-[10px] text-[#405c47] disabled:opacity-40"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#869188]">
        Staff can work on inventory and order fulfillment but cannot view financial metrics. Your
        own admin access is protected.
      </p>
    </div>
  );
}
