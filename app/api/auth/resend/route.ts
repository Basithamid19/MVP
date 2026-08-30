import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { availableChannels } from '@/lib/messaging/channels';
import { canSend } from '@/lib/messaging/tokens';
import { sendVerification } from '@/lib/messaging/verification';

export const dynamic = 'force-dynamic';

// POST { email, channel? } — re-send the verification link/code.
// Unknown or already-verified emails still get a plain 200 so the endpoint
// can't be used to enumerate accounts. The one non-200 is the throttle, which
// only fires for a real unverified account that has already had 3 sends in 15
// minutes — an accepted trade-off to give that user a real explanation.
export async function POST(request: Request) {
  const OK = NextResponse.json({ ok: true });

  try {
    const body = await request.json();
    const email = String(body?.email ?? '').trim().toLowerCase();
    const requested = body?.channel === 'sms' ? 'sms' : 'email';

    if (!email) return OK;

    const user = await prisma.user
      .findUnique({ where: { email }, select: { id: true, email: true, phone: true, verifiedAt: true } })
      .catch(() => null);

    if (!user || user.verifiedAt) return OK;

    if (!(await canSend(user.id, ['EMAIL_VERIFY', 'PHONE_VERIFY']))) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    // Only offer a channel that's configured AND deliverable for this user.
    const channels = availableChannels();
    let channel: 'email' | 'sms' | null = null;
    if (requested === 'sms' && channels.sms && user.phone) channel = 'sms';
    else if (channels.email) channel = 'email';
    else if (channels.sms && user.phone) channel = 'sms';

    if (channel) {
      await sendVerification(user, channel);
    } else {
      console.warn('[resend] no verification channel available for', email);
    }

    return OK;
  } catch (error) {
    console.error('[resend] error:', error);
    return OK;
  }
}
