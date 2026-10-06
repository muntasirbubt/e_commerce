import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import Link from "next/link";
const faqs = [
  [
    "When will my order arrive?",
    "Once your order is on its way, we’ll share delivery details by email. Timing depends on your location and the items in your order.",
  ],
  [
    "Can I return an item?",
    "We want you to feel good about what you choose. If something isn’t right, get in touch and we’ll help you understand your options under our returns policy.",
  ],
  [
    "How do I track my order?",
    "Sign in and visit your account’s order history to see your order status. We’ll also send updates when the order moves along.",
  ],
  [
    "Can I change or cancel an order?",
    "Please contact us as soon as possible with your order reference. If the parcel has already left us, we’ll guide you through the return options.",
  ],
  [
    "Which payment methods can I use?",
    "Available methods appear at checkout and may include cash on delivery, bank transfer, order request, or card, depending on store settings.",
  ],
  [
    "How do I care for my purchase?",
    "Care instructions vary by material and product. Check the specifications on the product page, or send us a note if you need more detail.",
  ],
];
export default function FAQPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
      <div className="grid size-12 place-items-center rounded-full bg-[#e9f0e8] text-[#4d7053]">
        <MessageCircleQuestion size={20} />
      </div>
      <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
        The useful answers
      </p>
      <h1 className="mt-2 font-serif text-5xl text-[#1b3b2b]">
        A few good questions.
      </h1>
      <p className="mt-4 text-sm text-[#718075]">
        If you can’t find what you’re looking for, we’re happy to help.
      </p>
      <div className="mt-9 divide-y divide-[#1b3b2b]/10 rounded-2xl border border-[#1b3b2b]/10 bg-white px-5">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-[#2c4031]">
              <span>{q}</span>
              <ChevronDown
                size={16}
                className="shrink-0 text-[#7c9280] transition group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#728075]">
              {a}
            </p>
          </details>
        ))}
      </div>
      <div className="mt-7 rounded-2xl bg-[#1b3b2b] p-6 text-white">
        <h2 className="font-serif text-2xl">Still wondering?</h2>
        <p className="mt-2 text-sm text-white/65">
          Send a note. We’ll find the right answer together.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block rounded-full bg-[#e8f0e6] px-5 py-3 text-xs font-medium text-[#1b3b2b]"
        >
          Contact the team
        </Link>
      </div>
    </main>
  );
}
