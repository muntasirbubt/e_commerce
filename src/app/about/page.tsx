import { Leaf, Heart, Compass, Recycle, ArrowRight } from "lucide-react";
import Link from "next/link";
export default function AboutPage() {
  return (
    <main>
      <section className="bg-[#e9efe7]">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            A little about us
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.06] text-[#1b3b2b] sm:text-7xl">
            We believe everyday
            <br />
            can feel <span className="italic text-[#73917a]">remarkable.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#617064]">
            Modular Market is a small collection of useful, enduring things. We
            look for honest materials, thoughtful details, and the kind of
            design that makes sense long after the first impression.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-2 lg:px-8 lg:py-20">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            Our point of view
          </p>
          <h2 className="mt-3 font-serif text-3xl text-[#1b3b2b]">
            Good design earns its place.
          </h2>
        </div>
        <div className="space-y-5 text-sm leading-7 text-[#6d7a70]">
          <p>
            We started with a simple question: what if shopping felt more like
            finding the one thing you’ll keep reaching for? That question guides
            every choice we make.
          </p>
          <p>
            We choose with care, share what we know, and make room for makers
            whose work brings utility and quiet beauty together. We would rather
            offer fewer things, each with a reason to be here.
          </p>
          <p>
            Our mission is to make considered choices easier: clear information,
            fair prices, and pieces worth holding on to.
          </p>
        </div>
      </section>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            What matters to us
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                Leaf,
                "Thoughtful materials",
                "We look for quality, provenance, and a good reason to make.",
              ],
              [
                Heart,
                "Useful by nature",
                "The best details make an ordinary day work a little better.",
              ],
              [
                Compass,
                "Honest choices",
                "We share the details you need to choose with confidence.",
              ],
              [
                Recycle,
                "Made to stay",
                "We favor lasting utility over the next passing thing.",
              ],
            ].map(([Icon, title, body]) => (
              <article key={String(title)} className="soft-card p-5">
                <span className="grid size-10 place-items-center rounded-full bg-[#edf3eb] text-[#52745b]">
                  <Icon size={18} />
                </span>
                <h3 className="mt-5 font-serif text-xl text-[#1b3b2b]">
                  {String(title)}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#78857a]">
                  {String(body)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-5 py-16 sm:flex-row sm:items-center lg:px-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
            A note from our team
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#1b3b2b]">
            Small team, considered choices.
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#748176]">
            We’re a close-knit group of curious people, makers, and careful
            editors. Every item we share has been chosen with the same question:
            would we keep it close?
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 self-start rounded-full border border-[#1b3b2b]/15 px-5 py-3 text-xs font-medium text-[#1b3b2b] sm:self-center"
        >
          Say hello <ArrowRight size={14} />
        </Link>
      </section>
    </main>
  );
}
