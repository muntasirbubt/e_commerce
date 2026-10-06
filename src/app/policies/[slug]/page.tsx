import { notFound } from "next/navigation";
import type { Metadata } from "next";
const policies: Record<
  string,
  { title: string; updated: string; sections: [string, string][] }
> = {
  terms: {
    title: "Terms of service",
    updated: "Please review before using the store.",
    sections: [
      [
        "Using this site",
        "By browsing or placing an order, you agree to use the site lawfully and provide accurate information at checkout.",
      ],
      [
        "Orders and availability",
        "Products, prices, and availability may change. An order is confirmed when we accept it and send an order confirmation. We may contact you if an item becomes unavailable.",
      ],
      [
        "Pricing and payment",
        "Prices and available payment methods are shown at checkout. You are responsible for applicable local taxes or charges unless the checkout says otherwise.",
      ],
      [
        "Intellectual property",
        "Store content, photography, and design belong to their respective owners and may not be copied for commercial use without permission.",
      ],
      [
        "Contact",
        "Questions about these terms? Use the contact form and include enough detail for our team to help.",
      ],
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated: "Your information, handled with care.",
    sections: [
      [
        "Information we collect",
        "We use the details you provide to create an account, fulfill orders, respond to requests, and improve the store experience.",
      ],
      [
        "How we use information",
        "Order details are used to process purchases, communicate updates, prevent fraud, and provide support. We do not sell personal information.",
      ],
      [
        "Cookies and sessions",
        "The store uses essential session storage for authentication and checkout functionality. Your browser may also store a local shopping cart.",
      ],
      [
        "Retention and your choices",
        "Information is retained only as needed to operate the store and meet applicable obligations. Contact the store to request access or correction of your profile information.",
      ],
      [
        "Contact",
        "For privacy questions, send a note through the contact page.",
      ],
    ],
  },
  returns: {
    title: "Returns & refunds",
    updated: "We’ll help make things right.",
    sections: [
      [
        "Start a return",
        "Contact us with your order number and the item you’d like to return. We’ll explain the available options and next steps.",
      ],
      [
        "Condition and timing",
        "Items should be unused and in their original condition where possible. The store owner should fill in the applicable return window and local requirements before publication.",
      ],
      [
        "Refunds",
        "Once a return is reviewed, any approved refund is issued to the original payment method or arranged with you for non-card orders.",
      ],
      [
        "Exceptions",
        "Some items may not be eligible for return under local law or due to their nature. If any exclusions apply, they should be shown clearly on the product page.",
      ],
      [
        "Need help?",
        "We’d rather talk it through. Contact our team and we’ll work with you.",
      ],
    ],
  },
  shipping: {
    title: "Shipping policy",
    updated: "Careful packing, clear updates.",
    sections: [
      [
        "Processing",
        "Orders are prepared after confirmation. Processing time can vary based on product availability and destination.",
      ],
      [
        "Delivery estimates",
        "Delivery estimates are shared at checkout or in your order confirmation when available. They are not guaranteed dates.",
      ],
      [
        "Shipping cost",
        "Any shipping fee is shown before you place the order. Store promotions may provide complimentary delivery on qualifying orders.",
      ],
      [
        "Tracking and delays",
        "If tracking is available, we’ll share it when the parcel is dispatched. Weather, carrier operations, and customs may affect delivery timing.",
      ],
      [
        "Address details",
        "Please check your delivery address carefully at checkout. Contact us quickly if something needs correcting.",
      ],
    ],
  },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: policies[slug]?.title ?? "Policy" };
}
export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params,
    p = policies[slug];
  if (!p) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
        The details
      </p>
      <h1 className="mt-2 font-serif text-5xl text-[#1b3b2b]">{p.title}</h1>
      <p className="mt-3 text-sm text-[#819086]">{p.updated}</p>
      <div className="mt-9 space-y-7">
        {p.sections.map(([h, b]) => (
          <section key={h}>
            <h2 className="font-serif text-xl text-[#1b3b2b]">{h}</h2>
            <p className="mt-2 text-sm leading-7 text-[#69776c]">{b}</p>
          </section>
        ))}
      </div>
      <p className="mt-12 border-t border-[#1b3b2b]/10 pt-5 text-xs text-[#8a948b]">
        These store policies should be reviewed and customized by the store
        owner for the applicable business and location.
      </p>
    </main>
  );
}
