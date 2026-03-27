import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const PROVIDER_IMAGES: Record<string, string> = {
  'marius@pro.lt':  'https://randomuser.me/api/portraits/men/10.jpg',
  'tomas@pro.lt':   'https://randomuser.me/api/portraits/men/20.jpg',
  'lina@pro.lt':    'https://randomuser.me/api/portraits/women/32.jpg',
  'andrius@pro.lt': 'https://randomuser.me/api/portraits/men/30.jpg',
  'vytas@pro.lt':   'https://randomuser.me/api/portraits/men/45.jpg',
  'paulius@pro.lt': 'https://randomuser.me/api/portraits/men/52.jpg',
  'rokas@pro.lt':   'https://randomuser.me/api/portraits/men/16.jpg',
  'darius@pro.lt':  'https://randomuser.me/api/portraits/men/25.jpg',
};

export async function GET() {
  const results: string[] = [];
  for (const [email, image] of Object.entries(PROVIDER_IMAGES)) {
    const updated = await prisma.user.updateMany({ where: { email }, data: { image } });
    results.push(`${email}: ${updated.count} updated`);
  }
  return NextResponse.json({ ok: true, results });
}
