import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isColumnError } from "@/lib/prisma-errors";

// NextAuth v5 surfaces `code` from a CredentialsSignin subclass on the
// signIn() result, which is how the login page tells "you haven't verified
// yet" apart from "wrong password".
class UnverifiedError extends CredentialsSignin {
  code = "UNVERIFIED";
}

// Explicit selects (never `include`/bare findUnique) so a database that hasn't
// run the 20260708 verification migration doesn't blow up every login with a
// P2022. On that path we re-query the pre-migration columns and treat the
// account as verified — see CLAUDE.md "migration-safety pattern".
const AUTH_USER_SELECT = {
  id: true, name: true, email: true, password: true, role: true,
  verifiedAt: true, phone: true,
} as const;

const AUTH_USER_FALLBACK_SELECT = {
  id: true, name: true, email: true, password: true, role: true,
} as const;

async function findAuthUser(email: string) {
  return prisma.user
    .findUnique({ where: { email }, select: AUTH_USER_SELECT })
    .catch(async (err: unknown) => {
      if (!isColumnError(err)) return null;
      const legacy = await prisma.user
        .findUnique({ where: { email }, select: AUTH_USER_FALLBACK_SELECT })
        .catch(() => null);
      return legacy ? { ...legacy, verifiedAt: new Date(), phone: null } : null;
    });
}

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
        let user = await findAuthUser(email);
        if (!user) {
          const lower = email.toLowerCase();
          if (lower !== email) {
            user = await findAuthUser(lower);
          }
        }

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Verification gate. Distinct error so the login page can offer
        // "resend verification" instead of "invalid email or password".
        if (!user.verifiedAt) throw new UnverifiedError();

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
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        if (token.image !== undefined) {
          session.user.image = token.image as string | null;
        }

        // Stale-JWT recovery — deployed tokens from before the 42P05 era carry
        // outdated token.id values. Resolve via email so downstream Prisma reads
        // hit the right row. See CLAUDE.md "Auth `id` cast" lesson: "don't
        // clean up" this fallback.
        try {
          let dbUser = token.id
            ? await prisma.user.findUnique({
                where: { id: token.id as string },
                select: { id: true, image: true, role: true },
              }).catch(() => null)
            : null;

          if (!dbUser && session.user.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: session.user.email },
              select: { id: true, image: true, role: true },
            }).catch(() => null);
            if (dbUser) {
              (session.user as any).id = dbUser.id;
            }
          }

          if (dbUser) {
            (session.user as any).role = dbUser.role;
            if (session.user.image == null) {
              session.user.image = dbUser.image;
            }
          }
        } catch {
          // DB unreachable — keep JWT-only values so the session stays valid.
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
