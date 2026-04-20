import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: emailRaw, password, name, role } = body;

    if (!emailRaw || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Normalize so login (which also lowercases) can always find the row.
    const email = String(emailRaw).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role || 'CUSTOMER',
        ...(role === 'PROVIDER' ? {
          providerProfile: {
            create: {
              isVerified: false,
              verificationTier: 'TIER0_BASIC',
            }
          }
        } : {
          customerProfile: {
            create: {}
          }
        })
      },
    });

    return NextResponse.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
