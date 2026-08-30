// Single-use credentials for account verification and password reset.
// Everything here fails soft on a missing AuthToken table (the 20260708
// migration may not have run in every environment yet) so registration and
// login never 500 because of it — see CLAUDE.md "migration-safety pattern".

import crypto from 'crypto';
import prisma from '@/lib/prisma';

export type AuthTokenType = 'EMAIL_VERIFY' | 'PHONE_VERIFY' | 'PASSWORD_RESET';

// Sends allowed per user per window, counted across token types.
const THROTTLE_WINDOW_MINUTES = 15;
const THROTTLE_MAX_SENDS = 3;

function generateToken(type: AuthTokenType): string {
  if (type === 'PHONE_VERIFY') {
    // Crypto-random 6-digit code, zero-padded so every code is 6 chars.
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }
  return crypto.randomBytes(24).toString('hex'); // 48 hex chars
}

// Issues a fresh token. Any earlier token of the same type is expired (not
// deleted) so only one link/code per purpose ever works, while the row still
// counts towards canSend() — deleting them would reset the throttle on every
// resend. Rows older than the throttle window are swept at the same time.
// Returns null when the token could not be stored.
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlMinutes: number,
): Promise<string | null> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  try {
    // Sweep only rows that are BOTH past the throttle window AND already
    // expired — a pending 48h email link must survive a later password reset.
    await prisma.authToken.deleteMany({
      where: {
        userId,
        createdAt: { lt: new Date(now.getTime() - THROTTLE_WINDOW_MINUTES * 60 * 1000) },
        expiresAt: { lt: now },
      },
    });
    await prisma.authToken.updateMany({
      where: { userId, type, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });

    // `token` is globally unique, so a 6-digit code can collide with another
    // user's live code. Retry with a fresh value instead of failing the signup.
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = generateToken(type);
      try {
        await prisma.authToken.create({ data: { userId, type, token, expiresAt } });
        return token;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes('P2002')) throw err;
      }
    }

    console.error('[auth-token] create failed: could not find a free token value');
    return null;
  } catch (err) {
    console.error('[auth-token] create failed:', err);
    return null;
  }
}

// Validates + burns a token. Returns the owning userId, or null when the token
// is unknown, of the wrong type, or expired.
export async function consumeAuthToken(
  token: string,
  type: AuthTokenType,
): Promise<string | null> {
  if (!token) return null;

  try {
    const row = await prisma.authToken.findUnique({ where: { token } });
    if (!row || row.type !== type) return null;

    // Expired tokens are deleted too — no reason to keep them around.
    if (row.expiresAt.getTime() < Date.now()) {
      await prisma.authToken.delete({ where: { id: row.id } }).catch(() => null);
      return null;
    }

    await prisma.authToken.delete({ where: { id: row.id } });
    return row.userId;
  } catch (err) {
    console.error('[auth-token] consume failed:', err);
    return null;
  }
}

// DB-backed send throttle: max 3 tokens of the given types per 15 minutes.
// Fails open (returns true) if the table can't be read — a broken throttle
// must not block a legitimate signup.
export async function canSend(userId: string, types: string[]): Promise<boolean> {
  try {
    const since = new Date(Date.now() - THROTTLE_WINDOW_MINUTES * 60 * 1000);
    const recent = await prisma.authToken.count({
      where: { userId, type: { in: types }, createdAt: { gte: since } },
    });
    return recent < THROTTLE_MAX_SENDS;
  } catch (err) {
    console.error('[auth-token] throttle check failed:', err);
    return true;
  }
}
