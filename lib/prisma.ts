import { PrismaClient } from '@prisma/client';

// Supabase offers three connection modes:
//   - Direct (port 5432, hostname `db.<ref>.supabase.co`): supports prepared
//     statements; limited concurrent connections.
//   - Session pooler (port 5432, hostname contains `pooler.supabase.com`):
//     PgBouncer in session mode, supports prepared statements, scales well.
//   - Transaction pooler (port 6543, hostname contains `pooler.supabase.com`):
//     PgBouncer in transaction mode. Reuses backend connections across Prisma
//     clients, which makes Prisma's prepared-statement cache throw
//     "42P05 prepared statement s0 already exists" on every query.
//
// We only need to force pgbouncer=true + a tight connection_limit for the
// transaction pooler. Session pooler and direct connections are fine as-is
// and get the benefit of Prisma's prepared-statement cache for speed.
function withPgBouncerFlags(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const isTransactionPooler = u.port === '6543';
    if (!isTransactionPooler) return raw;
    if (!u.searchParams.has('pgbouncer')) u.searchParams.set('pgbouncer', 'true');
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '5');
    return u.toString();
  } catch {
    return raw;
  }
}

const prismaClientSingleton = () => {
  const datasourceUrl = withPgBouncerFlags(process.env.DATABASE_URL);
  return new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);
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
