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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        try {
          // Look up by ID first; if that misses (stale JWT), fall back to email
          let dbUser = token.id
            ? await prisma.user.findUnique({
                where: { id: token.id as string },
                select: { id: true, image: true, role: true },
              }).catch(() => null)
            : null;

          if (!dbUser && session.user.email) {
            // token.id is missing or points to a deleted/different record —
            // resolve the correct ID from the email so all downstream queries work
            dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, image: true, role: true },
            }).catch(() => null);
            if (dbUser) {
              console.warn('[auth] token.id mismatch for', session.user.email,
                '— correcting from', token.id, 'to', dbUser.id);
              (session.user as any).id = dbUser.id;
            }
          }

          if (dbUser) {
            session.user.image = dbUser.image;
            (session.user as any).role = dbUser.role;
          } else {
            (session.user as any).role = token.role;
          }
        } catch {
          // DB unavailable — fall back to JWT values so session stays valid
          (session.user as any).role = token.role;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
