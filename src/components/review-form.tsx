"use client";
import { useState } from "react";
import { Star } from "lucide-react";
export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5),
    [body, setBody] = useState(""),
    [title, setTitle] = useState(""),
    [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, rating, title, body }),
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error ?? "Could not submit review.");
      return;
    }
    setMessage("Thank you. Your review is live.");
    setBody("");
    setTitle("");
  }
  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-[#1b3b2b]/10 bg-white p-5"
    >
      <h3 className="font-serif text-xl text-[#1b3b2b]">
        Leave a considered review
      </h3>
      <div className="mt-4 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} stars`}
            className="p-1"
          >
            <Star
              size={18}
              className={
                n <= rating ? "fill-[#89a58c] text-[#89a58c]" : "text-[#c8d0c9]"
              }
            />
          </button>
        ))}
      </div>
      <input
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="A short title (optional)"
        className="mt-3 w-full rounded-xl border border-[#1b3b2b]/10 px-3 py-2.5 text-sm outline-none focus:border-[#84a98c]"
      />
      <textarea
        minLength={10}
        maxLength={2000}
        required
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What did you think?"
        rows={4}
        className="mt-3 w-full rounded-xl border border-[#1b3b2b]/10 px-3 py-2.5 text-sm outline-none focus:border-[#84a98c]"
      />
      <div className="mt-3 flex items-center justify-between">
        <p role="status" className="text-xs text-[#718075]">
          {message}
        </p>
        <button className="rounded-full bg-[#1b3b2b] px-5 py-2.5 text-xs font-medium text-white">
          Submit review
        </button>
      </div>
    </form>
  );
}
