import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return null;
  return session.user;
}

export async function requireStaff() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "STAFF") return null;
  return session.user;
}
