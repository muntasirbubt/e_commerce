"use client";
import { useState } from "react";
import { Check, Send } from "lucide-react";
export function ContactForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        subject: fd.get("subject"),
        message: fd.get("message"),
      }),
    });
    const d = await r.json();
    setBusy(false);
    setStatus(
      r.ok
        ? "Your note has reached us. We’ll be in touch soon."
        : (d.error ?? "Could not send your note."),
    );
    if (r.ok) e.currentTarget.reset();
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-[1.5rem] border border-[#1b3b2b]/10 bg-white p-6 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <input
            name="name"
            required
            minLength={2}
            className="contact-input"
            placeholder="Name"
          />
        </Field>
        <Field label="Email address">
          <input
            name="email"
            type="email"
            required
            className="contact-input"
            placeholder="you@example.com"
          />
        </Field>
      </div>
      <Field label="Subject">
        <input
          name="subject"
          required
          minLength={3}
          className="contact-input"
          placeholder="What can we help with?"
        />
      </Field>
      <Field label="Your note">
        <textarea
          name="message"
          rows={5}
          required
          minLength={10}
          className="contact-input resize-y"
          placeholder="Tell us a little more…"
        />
      </Field>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-[#54745b]">
          {status}
        </p>
        <button
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3 text-xs font-medium text-white disabled:opacity-60"
        >
          {status.startsWith("Your note") ? (
            <Check size={14} />
          ) : (
            <Send size={14} />
          )}{" "}
          {busy ? "Sending…" : "Send your note"}
        </button>
      </div>
      <style jsx>{`
        .contact-input {
          display: block;
          width: 100%;
          margin-top: 0.45rem;
          border: 1px solid rgba(27, 59, 43, 0.12);
          border-radius: 0.85rem;
          background: #fbfcfa;
          padding: 0.8rem 0.9rem;
          font-size: 0.82rem;
          font-weight: 400;
          outline: none;
        }
        .contact-input:focus {
          border-color: #84a98c;
          box-shadow: 0 0 0 3px rgba(132, 169, 140, 0.14);
        }
      `}</style>
    </form>
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
    <label className="mb-4 block text-xs font-medium text-[#607064]">
      {label}
      {children}
    </label>
  );
}
