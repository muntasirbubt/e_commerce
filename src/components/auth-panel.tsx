"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Leaf,
  LockKeyhole,
  UserRound,
} from "lucide-react";
function AuthForm({ register = false }: { register?: boolean }) {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setError("");
    setBusy(true);
    const email = String(form.get("email")),
      password = String(form.get("password"));
    if (register) {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email, password }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Could not create account.");
        setBusy(false);
        return;
      }
    }
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: params.get("callbackUrl") ?? (register ? "/account" : "/"),
      redirect: false,
    });
    setBusy(false);
    if (result?.error) setError("Email or password was not accepted.");
    else window.location.assign(result?.url ?? "/");
  }
  return (
    <main className="mx-auto grid min-h-[calc(100vh-12rem)] max-w-6xl items-center gap-12 px-5 py-12 md:grid-cols-2 lg:px-8">
      <div className="relative hidden min-h-[480px] overflow-hidden rounded-[2rem] bg-[#1b3b2b] p-10 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute -right-10 -top-16 size-80 rounded-full border border-white/10" />
        <div className="absolute -right-0 -top-6 size-60 rounded-full border border-white/10" />
        <Link
          href="/"
          className="relative inline-flex items-center gap-2 text-sm"
        >
          <Leaf size={17} /> Modular Market
        </Link>
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#b7d1b4]">
            A slower kind of shopping
          </p>
          <h1 className="mt-4 max-w-sm font-serif text-5xl leading-tight">
            Good things,
            <br />
            <span className="italic text-[#a4c19f]">kept close.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
            Keep a little list of the things you love. Pick up where you left
            off, whenever you’re ready.
          </p>
        </div>
        <p className="relative text-xs text-white/45">
          Thoughtfully chosen. Better by design.
        </p>
      </div>
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-xs text-[#768579] md:hidden"
        >
          <ArrowLeft size={14} /> Back to the shop
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
          Your little corner
        </p>
        <h2 className="mt-2 font-serif text-4xl text-[#1b3b2b]">
          {register ? "Create an account" : "Welcome back."}
        </h2>
        <p className="mt-3 text-sm text-[#738075]">
          {register
            ? "A few details, then you’re all set."
            : "Sign in to see your orders and saved details."}
        </p>
        <form
          action={submit}
          className="mt-8 space-y-4 rounded-[1.5rem] border border-[#1b3b2b]/10 bg-white p-6 shadow-[0_14px_50px_rgba(27,59,43,.06)]"
        >
          {register && (
            <label className="block text-xs font-medium text-[#566659]">
              Your name
              <input
                name="name"
                required
                minLength={2}
                autoComplete="name"
                className="auth-input"
                placeholder="How should we call you?"
              />
            </label>
          )}
          <label className="block text-xs font-medium text-[#566659]">
            Email address
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="auth-input"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-xs font-medium text-[#566659]">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={register ? 12 : 1}
              autoComplete={register ? "new-password" : "current-password"}
              className="auth-input"
              placeholder={
                register ? "At least 12 characters" : "Your password"
              }
            />
          </label>
          {register && (
            <p className="text-[10px] leading-5 text-[#849087]">
              Use at least 12 characters. Your details stay private.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-xs text-red-700"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1b3b2b] px-5 py-3.5 text-sm font-medium text-white transition hover:bg-[#294f3b] disabled:opacity-60"
          >
            {register ? <UserRound size={15} /> : <LockKeyhole size={15} />}{" "}
            {busy ? "One moment…" : register ? "Create account" : "Sign in"}{" "}
            <ArrowRight size={14} />
          </button>
        </form>
        <p className="mt-5 text-center text-xs text-[#77857a]">
          {register ? "Already have an account?" : "New around here?"}{" "}
          <Link
            href={register ? "/signin" : "/signup"}
            className="font-semibold text-[#1b3b2b] underline underline-offset-4"
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
      <style jsx>{`
        .auth-input {
          display: block;
          width: 100%;
          margin-top: 0.45rem;
          border: 1px solid rgba(27, 59, 43, 0.12);
          border-radius: 0.8rem;
          background: #fbfcfa;
          padding: 0.8rem 0.9rem;
          font-size: 0.85rem;
          font-weight: 400;
          outline: none;
        }
        .auth-input:focus {
          border-color: #84a98c;
          box-shadow: 0 0 0 3px rgba(132, 169, 140, 0.14);
        }
      `}</style>
    </main>
  );
}
export function AuthPanel({ register = false }: { register?: boolean }) {
  return (
    <Suspense>
      <AuthForm register={register} />
    </Suspense>
  );
}
