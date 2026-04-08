import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

/** GET — returns current DB row counts so the admin can see what's there */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [users, providers, customers, requests, bookings, reviews, categories] =
    await Promise.all([
      prisma.user.count(),
      prisma.providerProfile.count(),
      prisma.customerProfile.count(),
      prisma.serviceRequest.count(),
      prisma.booking.count(),
      prisma.review.count(),
      prisma.serviceCategory.count(),
    ]);

  return NextResponse.json({ users, providers, customers, requests, bookings, reviews, categories });
}

/** POST — seeds the database with demo data if it is empty */
export async function POST() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Only seed if DB is empty (protect against double-seeding)
  const existingCustomers = await prisma.customerProfile.count();
  if (existingCustomers > 0) {
    return NextResponse.json({ seeded: false, message: 'Database already has data — skipped.' });
  }

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Categories
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
      where: { slug: cat.slug }, update: {}, create: cat,
    });
    catMap[cat.slug] = c.id;
  }

  // 2. Customers
  const customerDefs = [
    { email: 'jonas@example.lt',  name: 'Jonas Jonaitis', address: 'Gedimino pr. 15, Vilnius', phone: '+37061234567' },
    { email: 'asta@example.lt',   name: 'Asta Astaitė',   address: 'Konstitucijos pr. 7, Vilnius', phone: '+37069876543' },
  ];
  const customers: { userId: string; profileId: string }[] = [];
  for (const c of customerDefs) {
    const u = await prisma.user.upsert({
      where: { email: c.email }, update: {},
      create: {
        email: c.email, name: c.name, password: hashedPassword, role: 'CUSTOMER',
        customerProfile: { create: { address: c.address, phone: c.phone } },
      },
      include: { customerProfile: true },
    });
    customers.push({ userId: u.id, profileId: u.customerProfile!.id });
  }

  // 3. Providers
  const providerDefs = [
    { email: 'marius@pro.lt',  name: 'Marius Kazlauskas',  image: 'https://randomuser.me/api/portraits/men/10.jpg',   cat: 'plumber',            bio: 'Professional plumber with 10 years experience.', area: 'Senamiestis, Naujamiestis, Žvėrynas' },
    { email: 'tomas@pro.lt',   name: 'Tomas Petrauskas',   image: 'https://randomuser.me/api/portraits/men/20.jpg',   cat: 'electrician',        bio: 'Certified master electrician. Smart home & emergency.', area: 'Antakalnis, Verkiai, Fabijoniškės' },
    { email: 'lina@pro.lt',    name: 'Lina Rimkutė',       image: 'https://randomuser.me/api/portraits/women/32.jpg', cat: 'cleaning',           bio: 'Eco-friendly cleaning. Apartments, offices, post-construction.', area: 'All Vilnius districts' },
    { email: 'andrius@pro.lt', name: 'Andrius Butkus',     image: 'https://randomuser.me/api/portraits/men/30.jpg',   cat: 'handyman',           bio: 'From hanging pictures to fixing doors. No job too small.', area: 'Pilaitė, Karoliniškės, Lazdynai' },
    { email: 'vytas@pro.lt',   name: 'Vytautas Sabonis',   image: 'https://randomuser.me/api/portraits/men/45.jpg',   cat: 'furniture-assembly', bio: 'IKEA assembly expert. Fast, precise, clean work.', area: 'All Vilnius districts' },
    { email: 'paulius@pro.lt', name: 'Paulius Jankauskas', image: 'https://randomuser.me/api/portraits/men/52.jpg',   cat: 'moving-help',        bio: 'Professional moving team with truck.', area: 'Vilnius and surrounding areas' },
    { email: 'rokas@pro.lt',   name: 'Rokas Stankevičius', image: 'https://randomuser.me/api/portraits/men/16.jpg',   cat: 'plumber',            bio: 'Emergency plumbing 24/7. Pipe repairs, drain cleaning.', area: 'Justiniškės, Pašilaičiai, Baltupiai' },
    { email: 'darius@pro.lt',  name: 'Darius Vaitkus',     image: 'https://randomuser.me/api/portraits/men/25.jpg',   cat: 'electrician',        bio: 'EV charger installations specialist.', area: 'Šnipiškės, Žirmūnai, Šeškinė' },
  ];
  const providers: { userId: string; profileId: string }[] = [];
  for (const p of providerDefs) {
    const u = await prisma.user.upsert({
      where: { email: p.email }, update: { image: p.image },
      create: {
        email: p.email, name: p.name, image: p.image, password: hashedPassword, role: 'PROVIDER',
        providerProfile: {
          create: {
            bio: p.bio, serviceArea: p.area,
            languages: ['Lithuanian', 'English'],
            ratingAvg: 4.2 + Math.random() * 0.8,
            completedJobs: 10 + Math.floor(Math.random() * 90),
            isVerified: true, verificationTier: 'TIER1_ID_VERIFIED',
            responseTime: 'Usually responds in 30 mins',
            categories: { connect: { id: catMap[p.cat] } },
            offerings: {
              create: [
                { name: 'Standard Service', description: 'Basic service call', price: 25 + Math.random() * 25, priceType: 'HOURLY' },
                { name: 'Emergency Service', description: 'After-hours emergency', price: 50 + Math.random() * 30, priceType: 'HOURLY' },
              ],
            },
          },
        },
      },
      include: { providerProfile: true },
    });
    providers.push({ userId: u.id, profileId: u.providerProfile!.id });
  }

  // 4. Requests + Bookings + Reviews
  const pastDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

  const req1 = await prisma.serviceRequest.create({ data: { customerId: customers[0].profileId, categoryId: catMap['plumber'], address: 'Vilniaus g. 22, Vilnius', description: 'Leaking kitchen faucet — urgent repair.', dateWindow: new Date(Date.now() + 3 * 86400000), budget: 50, isUrgent: true, status: 'CHATTING' } });
  const req2 = await prisma.serviceRequest.create({ data: { customerId: customers[1].profileId, categoryId: catMap['electrician'], address: 'Ozo g. 15-42, Vilnius', description: 'Install 3 electrical outlets in living room.', dateWindow: new Date(Date.now() + 7 * 86400000), budget: 100, isUrgent: false, status: 'NEW' } });

  // Chat threads
  await prisma.chatThread.create({
    data: {
      requestId: req1.id, customerId: customers[0].userId, providerId: providers[0].userId,
      participants: { connect: [{ id: customers[0].userId }, { id: providers[0].userId }] },
      messages: { create: [
        { senderId: customers[0].userId, content: 'Hi! I have a leaking faucet. Are you available this week?' },
        { senderId: providers[0].userId, content: 'Hello! Yes, I can come tomorrow. My rate is €35/hour.' },
      ]},
    },
  });

  // Past requests + completed bookings + reviews
  const pastRequests = [
    { cat: 'cleaning', desc: 'Deep cleaning after renovation', addr: 'Gedimino pr. 15', custIdx: 0, provIdx: 2, amount: 80, rating: 5, comment: 'Lina did an amazing job! Very professional and thorough.', daysAgo: 14 },
    { cat: 'furniture-assembly', desc: 'IKEA wardrobe assembly', addr: 'Konstitucijos pr. 7', custIdx: 1, provIdx: 4, amount: 60, rating: 4, comment: 'Good work on the wardrobe. The result is perfect.', daysAgo: 7 },
    { cat: 'handyman', desc: 'Fix squeaky door and install shelf', addr: 'Gedimino pr. 15', custIdx: 0, provIdx: 3, amount: 45, rating: 5, comment: "Andrius fixed everything quickly. Highly recommend!", daysAgo: 3 },
  ];

  for (const pr of pastRequests) {
    await prisma.serviceRequest.create({
      data: { customerId: customers[pr.custIdx].profileId, categoryId: catMap[pr.cat], address: `${pr.addr}, Vilnius`, description: pr.desc, dateWindow: pastDate(pr.daysAgo), status: 'ACCEPTED' },
    });
    const booking = await prisma.booking.create({
      data: { customerId: customers[pr.custIdx].profileId, providerId: providers[pr.provIdx].profileId, status: 'COMPLETED', scheduledAt: pastDate(pr.daysAgo), totalAmount: pr.amount },
    });
    await prisma.review.create({
      data: { bookingId: booking.id, customerId: customers[pr.custIdx].profileId, providerId: providers[pr.provIdx].profileId, rating: pr.rating, comment: pr.comment },
    });
    await prisma.providerProfile.update({
      where: { id: providers[pr.provIdx].profileId },
      data: { ratingAvg: pr.rating === 5 ? 5.0 : 4.0, completedJobs: { increment: 1 } },
    });
  }

  return NextResponse.json({
    seeded: true,
    message: 'Database seeded with demo data.',
    summary: { categories: catDefs.length, providers: providerDefs.length, customers: customerDefs.length, bookings: pastRequests.length, reviews: pastRequests.length },
  });
}
