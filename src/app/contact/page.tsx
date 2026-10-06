import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import { getStoreSettings } from "@/lib/config";
import { ContactForm } from "@/components/contact-form";
import Link from "next/link";
export default async function ContactPage() {
  const settings = await getStoreSettings();
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73917a]">
        We’re listening
      </p>
      <h1 className="mt-2 font-serif text-5xl text-[#1b3b2b]">Let’s talk.</h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#718075]">
        A question about an order, a product, or a good idea? Leave us a note
        and our small team will get back to you.
      </p>
      <div className="mt-9 grid gap-9 lg:grid-cols-[1.1fr_.9fr]">
        <ContactForm />
        <aside>
          <div className="rounded-[1.5rem] bg-[#1b3b2b] p-7 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#b6ceb2]">
              The details
            </p>
            <h2 className="mt-2 font-serif text-2xl">
              A real person is on the other end.
            </h2>
            <div className="mt-6 space-y-4 text-sm">
              {settings.supportEmail && (
                <a
                  className="flex items-center gap-3 text-white/80"
                  href={`mailto:${settings.supportEmail}`}
                >
                  <Mail size={16} />
                  {settings.supportEmail}
                </a>
              )}
              {settings.supportPhone && (
                <a
                  className="flex items-center gap-3 text-white/80"
                  href={`tel:${settings.supportPhone}`}
                >
                  <Phone size={16} />
                  {settings.supportPhone}
                </a>
              )}
              {settings.storeAddress && (
                <p className="flex items-start gap-3 text-white/80">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  {settings.storeAddress}
                </p>
              )}
              {!settings.supportEmail &&
                !settings.supportPhone &&
                !settings.storeAddress && (
                  <p className="text-xs leading-6 text-white/65">
                    Contact details and store location will appear here when
                    configured by the store owner. The message form is open in
                    the meantime.
                  </p>
                )}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-[#1b3b2b]/10 bg-white p-6">
            <h2 className="font-serif text-xl text-[#1b3b2b]">
              Need a quick answer?
            </h2>
            <p className="mt-2 text-xs leading-5 text-[#7a887d]">
              We’ve collected the useful bits about orders, delivery, and
              returns.
            </p>
            <Link
              href="/faq"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-[#4c6d53]"
            >
              Visit the FAQs <ArrowRight size={13} />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
