import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim();
        const password = String(credentials.password);

        // Try exact match first (fast path for correctly-cased emails).
        // Then try lowercased (in case DB stored it that way).
        let user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
        if (!user) {
          const lower = email.toLowerCase();
          if (lower !== email) {
            user = await prisma.user.findUnique({ where: { email: lower } }).catch(() => null);
          }
        }

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in: persist everything the session needs so subsequent
      // session() calls can hydrate without hitting the DB.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.image = (user as any).image ?? null;
      }

      // Client-side `update()` forces a DB refresh so profile edits (new
      // avatar, role change) surface without requiring re-login.
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, image: true, role: true },
        }).catch(() => null);
        if (fresh) {
          token.role = fresh.role;
          token.image = fresh.image ?? null;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Hydrate from the JWT only — no DB round-trip. This used to query
      // Prisma on every request (page nav, API call, middleware auth()),
      // which was the dominant latency for logged-in users.
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        if (token.image !== undefined) {
          session.user.image = token.image as string | null;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
