import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserManager } from "@/components/user-manager";
export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin?callbackUrl=/admin/users");
  if (session.user.role !== "ADMIN") redirect("/");
  const users = await db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <Link href="/admin" className="text-xs text-[#718075]">
        ← Dashboard
      </Link>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#73917a]">
        People
      </p>
      <h1 className="mt-1 font-serif text-4xl text-[#1b3b2b]">
        Customers & access
      </h1>
      <p className="mt-2 text-sm text-[#748176]">
        Manage customer and store-owner roles.
      </p>
      <UserManager
        initial={JSON.parse(JSON.stringify(users))}
        actorId={session.user.id}
      />
    </main>
  );
}
