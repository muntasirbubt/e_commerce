"use client";
import { useState } from "react";
type User = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
};
export function UserManager({
  initial,
  actorId,
}: {
  initial: User[];
  actorId: string;
}) {
  const [users, setUsers] = useState(initial);
  const [message, setMessage] = useState("");
  async function change(user: User) {
    const role = user.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
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
  return (
    <div className="mt-8">
      <p role="status" className="mb-4 text-xs text-[#54745b]">
        {message}
      </p>
      <div className="overflow-hidden rounded-2xl border border-[#1b3b2b]/10 bg-white">
        <div className="grid grid-cols-[1fr_1.3fr_.7fr_.6fr] gap-4 border-b border-[#1b3b2b]/10 bg-[#f5f7f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[#78857a]">
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Access</span>
        </div>
        {users.map((u) => (
          <div
            key={u.id}
            className="grid grid-cols-[1fr_1.3fr_.7fr_.6fr] items-center gap-4 border-b border-[#1b3b2b]/[.06] px-5 py-4 last:border-0"
          >
            <span className="truncate text-xs font-medium text-[#304536]">
              {u.name || "—"}
              {u.id === actorId && (
                <span className="ml-2 text-[9px] text-[#8a968b]">You</span>
              )}
            </span>
            <span className="truncate text-xs text-[#6e7c71]">{u.email}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#66766a]">
              {u.role}
            </span>
            <button
              disabled={u.id === actorId}
              onClick={() => change(u)}
              className="rounded-full border border-[#1b3b2b]/15 px-3 py-2 text-[10px] text-[#405c47] disabled:opacity-40"
            >
              {u.role === "ADMIN" ? "Demote" : "Promote"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#869188]">
        To add another administrator, have them create a customer account first,
        then promote them here. Your own admin access is protected.
      </p>
    </div>
  );
}
