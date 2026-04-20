import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET — public diagnostic. No auth required. Returns row counts so we can tell
// whether the DB is actually populated.
export async function GET() {
  try {
    const [users, providers, customers, categories, requests, bookings, reviews] =
      await Promise.all([
        prisma.user.count(),
        prisma.providerProfile.count(),
        prisma.customerProfile.count(),
        prisma.serviceCategory.count(),
        prisma.serviceRequest.count(),
        prisma.booking.count(),
        prisma.review.count(),
      ]);
    return NextResponse.json({
      ok: true,
      counts: { users, providers, customers, categories, requests, bookings, reviews },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST — secret-gated one-time bootstrap. Requires ?key=<BOOTSTRAP_SECRET>.
// Creates admin + seeded providers/customers if they're missing. Idempotent —
// uses upsert so running it twice won't duplicate rows.
export async function POST(request: Request) {
  const secret = process.env.BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'BOOTSTRAP_SECRET not configured on server.' },
      { status: 503 },
    );
  }
  const { searchParams } = new URL(request.url);
  if (searchParams.get('key') !== secret) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Admin
    await prisma.user.upsert({
      where: { email: 'admin@vilniuspro.lt' },
      update: { role: 'ADMIN' },
      create: {
        email: 'admin@vilniuspro.lt',
        name: 'Admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // 2. Categories
    const catDefs = [
      { name: 'Plumber',            slug: 'plumber',            icon: 'Droplets',  description: 'Fix leaks, install pipes, bathroom repairs' },
      { name: 'Electrician',        slug: 'electrician',        icon: 'Zap',       description: 'Wiring, outlets, lighting installation' },
      { name: 'Handyman',           slug: 'handyman',           icon: 'Hammer',    description: 'General repairs and maintenance' },
      { name: 'Cleaning',           slug: 'cleaning',           icon: 'Sparkles',  description: 'Home and office cleaning services' },
      { name: 'Furniture Assembly', slug: 'furniture-assembly', icon: 'Box',       description: 'IKEA and furniture assembly' },
      { name: 'Moving Help',        slug: 'moving-help',        icon: 'Truck',     description: 'Moving and relocation assistance' },
    ];
    const catMap: Record<string, string> = {};
    for (const cat of catDefs) {
      const c = await prisma.serviceCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
      catMap[cat.slug] = c.id;
    }

    // 3. Providers
    const providerDefs = [
      { email: 'marius@pro.lt',  name: 'Marius Kazlauskas',  image: 'https://randomuser.me/api/portraits/men/10.jpg',   cat: 'plumber',            bio: 'Professional plumber with 10 years experience.',                area: 'Senamiestis, Naujamiestis, Žvėrynas' },
      { email: 'tomas@pro.lt',   name: 'Tomas Petrauskas',   image: 'https://randomuser.me/api/portraits/men/20.jpg',   cat: 'electrician',        bio: 'Certified master electrician. Smart home & emergency.',          area: 'Antakalnis, Verkiai, Fabijoniškės' },
      { email: 'lina@pro.lt',    name: 'Lina Rimkutė',       image: 'https://randomuser.me/api/portraits/women/32.jpg', cat: 'cleaning',           bio: 'Eco-friendly cleaning. Apartments, offices, post-construction.', area: 'All Vilnius districts' },
      { email: 'andrius@pro.lt', name: 'Andrius Butkus',     image: 'https://randomuser.me/api/portraits/men/30.jpg',   cat: 'handyman',           bio: 'From hanging pictures to fixing doors. No job too small.',       area: 'Pilaitė, Karoliniškės, Lazdynai' },
      { email: 'vytas@pro.lt',   name: 'Vytautas Sabonis',   image: 'https://randomuser.me/api/portraits/men/45.jpg',   cat: 'furniture-assembly', bio: 'IKEA assembly expert. Fast, precise, clean work.',                area: 'All Vilnius districts' },
      { email: 'paulius@pro.lt', name: 'Paulius Jankauskas', image: 'https://randomuser.me/api/portraits/men/52.jpg',   cat: 'moving-help',        bio: 'Professional moving team with truck.',                           area: 'Vilnius and surrounding areas' },
      { email: 'rokas@pro.lt',   name: 'Rokas Stankevičius', image: 'https://randomuser.me/api/portraits/men/16.jpg',   cat: 'plumber',            bio: 'Emergency plumbing 24/7. Pipe repairs, drain cleaning.',         area: 'Justiniškės, Pašilaičiai, Baltupiai' },
      { email: 'darius@pro.lt',  name: 'Darius Vaitkus',     image: 'https://randomuser.me/api/portraits/men/25.jpg',   cat: 'electrician',        bio: 'EV charger installations specialist.',                           area: 'Šnipiškės, Žirmūnai, Šeškinė' },
    ];
    let createdProviders = 0;
    for (const p of providerDefs) {
      const existing = await prisma.user.findUnique({
        where: { email: p.email },
        include: { providerProfile: true },
      });
      if (existing?.providerProfile) continue;

      await prisma.user.upsert({
        where: { email: p.email },
        update: {
          image: p.image,
          role: 'PROVIDER',
          providerProfile: {
            create: {
              bio: p.bio,
              serviceArea: p.area,
              languages: ['Lithuanian', 'English'],
              ratingAvg: 4.5 + Math.random() * 0.5,
              completedJobs: 10 + Math.floor(Math.random() * 50),
              isVerified: true,
              verificationTier: 'TIER1_ID_VERIFIED',
              responseTime: 'Usually responds in 30 mins',
              categories: { connect: { id: catMap[p.cat] } },
            },
          },
        },
        create: {
          email: p.email,
          name: p.name,
          image: p.image,
          password: hashedPassword,
          role: 'PROVIDER',
          providerProfile: {
            create: {
              bio: p.bio,
              serviceArea: p.area,
              languages: ['Lithuanian', 'English'],
              ratingAvg: 4.5 + Math.random() * 0.5,
              completedJobs: 10 + Math.floor(Math.random() * 50),
              isVerified: true,
              verificationTier: 'TIER1_ID_VERIFIED',
              responseTime: 'Usually responds in 30 mins',
              categories: { connect: { id: catMap[p.cat] } },
            },
          },
        },
      });
      createdProviders++;
    }

    const counts = {
      users: await prisma.user.count(),
      providers: await prisma.providerProfile.count(),
      categories: await prisma.serviceCategory.count(),
    };

    return NextResponse.json({
      ok: true,
      message: 'Bootstrap complete',
      createdProviders,
      counts,
    });
  } catch (err) {
    console.error('[bootstrap POST] failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
