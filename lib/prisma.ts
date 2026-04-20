import { PrismaClient } from '@prisma/client';

// Supabase's transaction pooler (port 6543) reuses backend connections across
// clients. Prisma's default prepared-statement cache collides with that reuse
// and throws 42P05 "prepared statement s0 already exists" on every query.
// Forcing pgbouncer=true tells Prisma to disable prepared statements; a tight
// connection_limit further reduces the churn. We rewrite the URL defensively
// in case the deployed env var is missing either flag.
function withPgBouncerFlags(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    const isPooled = u.port === '6543' || u.hostname.includes('pooler');
    if (!isPooled) return raw;
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
