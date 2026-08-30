import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { availableChannels } from '@/lib/messaging/channels';
import { normalizePhone } from '@/lib/messaging/phone';
import { sendVerification } from '@/lib/messaging/verification';

export const dynamic = 'force-dynamic';

// Deliberately permissive but enough to reject the garbage the form used to
// accept ("asdf", "a@b", trailing spaces). Real validation is the verification
// email itself.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: emailRaw, password, name, role: roleRaw, phone: phoneRaw, channel: channelRaw } = body;

    if (!emailRaw || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Allow-list the role. Any value other than PROVIDER (including 'ADMIN',
    // null, garbage, or a missing field) collapses to CUSTOMER. This closes
    // the self-elevation-to-admin vector on the public registration endpoint.
    const role: 'CUSTOMER' | 'PROVIDER' = roleRaw === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';

    // Normalize so login (which also lowercases) can always find the row.
    const email = String(emailRaw).trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 },
      );
    }

    const phone = phoneRaw ? normalizePhone(String(phoneRaw)) : null;
    if (phoneRaw && !phone) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const requested: 'email' | 'sms' = channelRaw === 'sms' ? 'sms' : 'email';
    if (requested === 'sms' && !phone) {
      return NextResponse.json({ error: 'Phone number is required for SMS verification' }, { status: 400 });
    }

    // Pick the channel we can actually deliver on: the requested one when it's
    // configured, otherwise the other one if it's usable (SMS needs a phone).
    const channels = availableChannels();
    let channel: 'email' | 'sms' | null = null;
    if (requested === 'sms' && channels.sms) channel = 'sms';
    else if (requested === 'email' && channels.email) channel = 'email';
    else if (channels.email) channel = 'email';
    else if (channels.sms && phone) channel = 'sms';

    // Narrow select: a bare findUnique reads every column in schema.prisma, so
    // it would P2022 on a database that hasn't run the 20260708 migration yet.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // No provider configured (dev, preview, pre-launch) — auto-verify so the
    // account is still usable instead of being permanently locked out.
    if (!channel) {
      console.warn('[register] no verification channel configured — auto-verifying', email);
    }

    const baseData = {
      email,
      name,
      password: hashedPassword,
      role,
      ...(role === 'PROVIDER' ? {
        providerProfile: {
          create: {
            isVerified: false,
            // `as const` keeps the enum literal type now that this object is a
            // standalone const rather than inline in the create() call.
            verificationTier: 'TIER0_BASIC' as const,
          }
        }
      } : {
        customerProfile: {
          create: {}
        }
      })
    };

    // Migration-safety (CLAUDE.md): if 20260708 hasn't run in this environment
    // the phone/verifiedAt columns don't exist. Retry without them — the login
    // gate treats a missing verifiedAt column as "verified", so the account
    // stays usable rather than the signup 500-ing.
    const user = await prisma.user.create({
      data: {
        ...baseData,
        ...(phone ? { phone } : {}),
        ...(channel ? {} : { verifiedAt: new Date() }),
      },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('P2022') && !msg.includes('verifiedAt') && !msg.includes('phone')) throw err;
      console.warn('[register] verification columns missing — creating user without them');
      channel = null;
      return prisma.user.create({ data: baseData });
    });

    if (channel) {
      // Delivery failures are logged inside the messaging layer; the user still
      // lands on /verify where they can hit "resend".
      await sendVerification({ id: user.id, email: user.email, phone }, channel);
    }

    return NextResponse.json({
      message: 'User created successfully',
      verification: channel ?? 'none',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
