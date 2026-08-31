import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
    };
  }
  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Mirrors User.id. Healed from the email lookup when a deployed JWT is stale. */
    id?: string;
    role?: string;
    image?: string | null;
    /**
     * ms epoch of the last successful DB sync of role/image in the jwt()
     * callback. Absent or older than the TTL in lib/auth.ts triggers a re-read;
     * left untouched when the read errors so the next request retries.
     */
    dbSyncedAt?: number;
  }
}
