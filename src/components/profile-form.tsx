"use client";
import { useState } from "react";
export function ProfileForm({ name }: { name: string }) {
  const [value, setValue] = useState(name);
  const [status, setStatus] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: value }),
    });
    const d = await r.json();
    setStatus(
      r.ok
        ? "Your profile is saved."
        : (d.error ?? "Could not update profile."),
    );
  }
  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
    >
      <h2 className="font-serif text-xl text-[#1b3b2b]">Your details</h2>
      <label className="mt-4 block text-xs text-[#607064]">
        Display name
        <input
          required
          minLength={2}
          maxLength={80}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-[#1b3b2b]/10 px-3 py-3 text-sm outline-none focus:border-[#84a98c]"
        />
      </label>
      <div className="mt-3 flex items-center justify-between">
        <p role="status" className="text-xs text-[#64806a]">
          {status}
        </p>
        <button className="rounded-full bg-[#1b3b2b] px-5 py-2.5 text-xs text-white">
          Save profile
        </button>
      </div>
    </form>
  );
}
