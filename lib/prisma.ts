import { PrismaClient } from '@prisma/client';

// ── DATABASE_URL normalisation ──────────────────────────────────────────────
// Supabase offers three connection modes, and on serverless the difference
// between them is the difference between "works" and "max clients reached":
//
//   1. Transaction pooler (port 6543, host contains `pooler.supabase.com`):
//      PgBouncer in transaction mode. THE CORRECT RUNTIME CHOICE for Vercel
//      lambdas — a backend connection is only held for the duration of a
//      statement, so hundreds of lambdas multiplex over a handful of Postgres
//      slots. Its catch is that reusing backends across Prisma clients makes
//      Prisma's prepared-statement cache throw "42P05 prepared statement s0
//      already exists", which is what `pgbouncer=true` disables.
//      → force `pgbouncer=true`, and `connection_limit=1`: one engine
//        connection per lambda is the documented serverless setting. PgBouncer
//        already does the pooling; a per-lambda Prisma pool of 5 just multiplies
//        held slots by the number of warm lambdas for no throughput gain.
//
//   2. Session pooler (port 5432, host contains `pooler.supabase.com`):
//      PgBouncer in SESSION mode. A backend slot is pinned for the whole life
//      of the client connection, and the pool is hard-capped (15 slots on the
//      small instance sizes). Warm lambdas each keep their sessions open, so a
//      handful of concurrent lambdas exhausts it and every further connection —
//      including `prisma migrate deploy` during the Vercel build — dies with
//      `FATAL: (EMAXCONNSESSION) max clients reached in session mode`. Observed
//      in production: this is what produced the fail-empty pages and the
//      post-deploy error windows.
//      → force `connection_limit=1` as a MISCONFIGURATION GUARD so one lambda
//        can never hold more than one of the 15 slots. Deliberately no
//        `pgbouncer=true`: session mode supports prepared statements, and
//        keeping the cache is free speed. This is damage limitation, not a
//        blessing — DATABASE_URL should point at the transaction pooler (6543).
//
//   3. Direct (port 5432, host `db.<ref>.supabase.co`): real Postgres, prepared
//      statements, low connection ceiling. Used for DIRECT_URL / migrations.
//      → left completely untouched.
//
// An explicit `connection_limit` (or `pgbouncer`) already present in the URL is
// always respected — this only ever fills in a missing default.
//
// `pool_timeout` is deliberately not set: Prisma's 10s default is generous
// relative to our query shapes, and lowering it would just convert queueing
// into P2024s. `connection_limit` is the actual fix.
function withPgBouncerFlags(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const isSupabasePooler = u.hostname.includes('pooler.supabase.com');
    const isTransactionPooler = u.port === '6543';
    const isSessionPooler = isSupabasePooler && u.port === '5432';

    if (!isTransactionPooler && !isSessionPooler) return raw;

    // Transaction mode only: Prisma must stop using prepared statements.
    if (isTransactionPooler && !u.searchParams.has('pgbouncer')) {
      u.searchParams.set('pgbouncer', 'true');
    }
    // Both pooled modes: one engine connection per lambda.
    if (!u.searchParams.has('connection_limit')) {
      u.searchParams.set('connection_limit', '1');
    }
    return u.toString();
  } catch {
    return raw;
  }
}

// ── Cold-window connection retry ────────────────────────────────────────────
// For the first minute or two after a deploy every lambda is cold: Prisma has
// to start its engine and open a fresh PgBouncer connection before running any
// statement. That window is exactly when P1001 (can't reach database) and
// P2024 (timed out fetching a connection from the pool) fire, and a single one
// of them turned into a visible "couldn't load your data" banner.
//
// Retrying ALL operations — reads and writes alike — is safe for these specific
// codes because they are raised BEFORE the statement is sent to Postgres: the
// client never acquired a usable connection, so nothing was executed and there
// is nothing to double-apply. We deliberately do NOT retry anything else (a
// unique-constraint violation, a P2022 missing column, a query timeout mid
// statement), because those may have had side effects or need the migration
// fallbacks in the route to run.
const CONNECTION_ERROR_CODES = ['P1001', 'P1002', 'P2024'];
const CONNECTION_ERROR_MESSAGE = /Can't reach database|Connection reset|ECONNRESET|Closed/i;
const RETRY_DELAY_MS = 400;

function isConnectionError(err: unknown): boolean {
  if (!err) return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && CONNECTION_ERROR_CODES.includes(code)) return true;
  const msg = err instanceof Error ? err.message : String(err);
  // Prisma sometimes only surfaces the code inside the message (wrapped errors,
  // engine panics), so check there too.
  if (CONNECTION_ERROR_CODES.some((c) => msg.includes(c))) return true;
  return CONNECTION_ERROR_MESSAGE.test(msg);
}

function withConnectionRetry(client: PrismaClient): PrismaClient {
  const extended = client.$extends({
    name: 'connection-retry',
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (!isConnectionError(err)) throw err;
          console.warn(
            '[prisma] connection-level error, retrying once:',
            err instanceof Error ? err.message.slice(0, 160) : String(err),
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          return query(args);
        }
      },
    },
  });
  // $extends narrows the client type (drops $use/$on and rewrites model types).
  // Every call site imports the default export and expects the plain
  // PrismaClient surface — including $transaction / $executeRawUnsafe and the
  // migration-safety `.catch` ladders — so we hand back the original type.
  return extended as unknown as PrismaClient;
}

const prismaClientSingleton = () => {
  const datasourceUrl = withPgBouncerFlags(process.env.DATABASE_URL);
  return withConnectionRetry(
    new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined),
  );
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

// Cache in both dev (HMR) and production (serverless warm invocations) so we
// don't spawn a fresh client per module eval and multiply prepared-statement
// collisions across concurrent lambdas.
globalThis.prisma = prisma;

export default prisma;
