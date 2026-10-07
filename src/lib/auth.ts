import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user || !(await compare(credentials.password, user.passwordHash))) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as "ADMIN" | "STAFF" | "CUSTOMER",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: "ADMIN" | "STAFF" | "CUSTOMER" }).role;
      if (token.sub) {
        const currentUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });
        token.role = currentUser?.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as "ADMIN" | "STAFF" | "CUSTOMER";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
