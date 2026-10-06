import type { Metadata } from "next";
import "./globals.css";
import { getStoreSettings } from "@/lib/config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "Modular Market — Considered goods for everyday",
    template: "%s | Modular Market",
  },
  description: "Thoughtful, enduring goods for everyday living.",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getStoreSettings();
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9f5] text-[#212529] antialiased">
        <SiteHeader storeName={settings.storeName} />
        {children}
        <SiteFooter storeName={settings.storeName} />
      </body>
    </html>
  );
}
