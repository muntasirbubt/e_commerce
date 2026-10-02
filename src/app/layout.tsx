import type { Metadata } from "next";
import "./globals.css";
import { getStoreSettings } from "@/lib/config";

export const metadata: Metadata = { title: "Modular Market", description: "Thoughtful goods for everyday living." };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await getStoreSettings();
  return <html lang="en"><body><header className="border-b border-black/10 bg-[#f5f4ee]"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><a className="text-xl font-bold tracking-tight" href="/">{settings.storeName}<span className="text-[#719159]">.</span></a><nav className="flex gap-6 text-sm"><a href="/">Shop</a><a href="/admin">Admin</a><a href="/checkout">Cart / Checkout</a></nav></div></header>{children}<footer className="mt-20 border-t border-black/10 px-6 py-8 text-center text-sm text-black/50">© {new Date().getFullYear()} {settings.storeName}</footer></body></html>;
}
