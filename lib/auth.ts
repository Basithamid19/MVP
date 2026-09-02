import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { isColumnError } from "@/lib/prisma-errors";
import { publicImage } from "@/lib/safe-image";

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
// `image` is selected so the JWT can mirror the avatar from the moment of
// sign-in. It used to be filled in by a DB read inside the session() callback
// on every request; that read is now throttled (see TOKEN_SYNC_TTL_MS), so if
// authorize() didn't seed it the avatar would be missing for the first few
// minutes of a session. `image` is part of the initial NextAuth User model, so
// it is safe in the pre-migration fallback select too.
const AUTH_USER_SELECT = {
  id: true, name: true, email: true, password: true, role: true, image: true,
  verifiedAt: true, phone: true,
} as const;

const AUTH_USER_FALLBACK_SELECT = {
  id: true, name: true, email: true, password: true, role: true, image: true,
} as const;

// Columns the JWT mirrors. Kept tiny on purpose — this is the only read the
// throttled token sync performs.
const TOKEN_SYNC_SELECT = { id: true, image: true, role: true } as const;

// How long a token's mirrored role/image is trusted before we re-read the DB.
// The old code re-read on EVERY auth() call, i.e. on every API route and every
// server page render — 1-2 extra round-trips per request, paid twice over on a
// cold lambda. Five minutes keeps role/avatar edits fresh enough while making
// the common authenticated request cost ZERO auth queries.
const TOKEN_SYNC_TTL_MS = 5 * 60 * 1000;

// The JWT session travels as an httpOnly cookie on every request. Vercel caps
// request headers at ~16KB, so we never let an image large enough to blow the
// cookie past that limit into the token. Avatars uploaded as base64 data URLs
// (see app/account/AccountClient.tsx) can easily be 20-80KB — those stay at
// rest in User.image but never enter the JWT. The UI falls back to
// avatarUrl(name) for users whose avatar is oversized, until a proper
// URL-based upload path replaces the data-URL storage.
// The rule itself now lives in lib/safe-image.ts, shared with the read layer so
// the JWT and every API payload agree on what an avatar may be.
function safeImageForToken(img: unknown): string | null {
  return publicImage(img);
}

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
          image: safeImageForToken(user.image),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign-in: persist everything the session needs so subsequent
      // session() calls can hydrate without hitting the DB. authorize() just
      // read the row, so the mirror is fresh — stamp the TTL.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.image = safeImageForToken((user as any).image);
        token.dbSyncedAt = Date.now();
        return token;
      }

      const syncedAt = typeof token.dbSyncedAt === 'number' ? token.dbSyncedAt : 0;
      const isStale = Date.now() - syncedAt > TOKEN_SYNC_TTL_MS;

      // Client-side `update()` forces a DB refresh so profile edits (new
      // avatar, role change) surface without requiring re-login. Otherwise we
      // only re-read once the mirror has aged past the TTL.
      if (trigger !== 'update' && !isStale) return token;

      let queryFailed = false;
      const readUser = async (where: { id: string } | { email: string }) =>
        prisma.user
          .findUnique({ where, select: TOKEN_SYNC_SELECT })
          .catch(() => { queryFailed = true; return null; });

      let dbUser = token.id ? await readUser({ id: token.id as string }) : null;

      // Stale-JWT recovery — deployed tokens from before the 42P05 era carry
      // outdated token.id values. Resolve via email so downstream Prisma reads
      // hit the right row. See CLAUDE.md "Auth `id` cast" lesson: "don't clean
      // up" this fallback. Difference from before: the corrected id is written
      // BACK to the token, so the token heals permanently instead of paying the
      // email lookup on every single request for the rest of its life.
      if (!dbUser && !queryFailed && token.email) {
        dbUser = await readUser({ email: token.email as string });
        if (dbUser) token.id = dbUser.id;
      }

      if (dbUser) {
        token.role = dbUser.role;
        token.image = safeImageForToken(dbUser.image);
      }

      // Only skip the timestamp bump when a query actually errored (DB
      // unreachable / cold pool), so the next request retries immediately and
      // the token keeps its last-known-good role. A clean "no such row" is a
      // real answer — stamp it, or a deleted user would re-query forever.
      if (!queryFailed) token.dbSyncedAt = Date.now();

      return token;
    },
    // Pure token → session mapping. No DB access: the DB sync lives in jwt()
    // above, throttled to once per TTL, so an authenticated request costs zero
    // auth queries in the common case.
    async session({ session, token }) {
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
