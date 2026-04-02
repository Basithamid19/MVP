import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create new Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin2@vilniuspro.lt' },
    update: { password: hashedPassword },
    create: {
      email: 'admin2@vilniuspro.lt',
      name: 'Admin Aladdin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin created:', admin.email);

  // 2. Fetch categories to assign to providers
  const categories = await prisma.serviceCategory.findMany();
  if (categories.length === 0) {
    console.log('⚠ No categories found. Run the main seed first.');
    return;
  }

  const providers = [
    {
      email: 'marius.jonaitis@vilniuspro.lt',
      name: 'Marius Jonaitis',
      bio: 'Experienced plumber with 10+ years in Vilnius. Specializing in bathroom renovations and pipe installations.',
      serviceArea: 'Vilnius Center, Žirmūnai, Antakalnis',
      slug: 'plumber',
      tier: 'TIER2_TRADE_VERIFIED',
      rating: 4.8,
      jobs: 87,
    },
    {
      email: 'laura.kazlauskaite@vilniuspro.lt',
      name: 'Laura Kazlauskaitė',
      bio: 'Professional house cleaner. Deep cleaning, post-renovation, and regular maintenance packages available.',
      serviceArea: 'Vilnius Center, Naujamiestis, Šnipiškės',
      slug: 'cleaning',
      tier: 'TIER1_ID_VERIFIED',
      rating: 4.9,
      jobs: 142,
    },
    {
      email: 'tomas.petrauskas@vilniuspro.lt',
      name: 'Tomas Petrauskas',
      bio: 'Certified electrician. Wiring, panel upgrades, EV charger installation, and smart home setups.',
      serviceArea: 'All Vilnius districts',
      slug: 'electrician',
      tier: 'TIER3_ENHANCED',
      rating: 4.7,
      jobs: 203,
    },
    {
      email: 'egle.stankeviciene@vilniuspro.lt',
      name: 'Eglė Stankevičienė',
      bio: 'Handyman services for all home repairs. Furniture assembly, painting, and minor renovations.',
      serviceArea: 'Vilnius Center, Pašilaičiai, Fabijoniškės',
      slug: 'handyman',
      tier: 'TIER1_ID_VERIFIED',
      rating: 4.6,
      jobs: 58,
    },
    {
      email: 'andrius.mackevičius@vilniuspro.lt',
      name: 'Andrius Mackevičius',
      bio: 'Moving specialist. Careful packing, loading, and transport across Vilnius and Lithuania.',
      serviceArea: 'Vilnius and surroundings',
      slug: 'moving-help',
      tier: 'TIER1_ID_VERIFIED',
      rating: 4.5,
      jobs: 74,
    },
    {
      email: 'ruta.dimšaitė@vilniuspro.lt',
      name: 'Rūta Dimšaitė',
      bio: 'IKEA and flat-pack furniture assembly expert. Fast, affordable, and tidy.',
      serviceArea: 'Vilnius Center, Lazdynai, Karoliniškės',
      slug: 'furniture-assembly',
      tier: 'TIER0_BASIC',
      rating: 4.4,
      jobs: 31,
    },
    {
      email: 'jonas.urbonas@vilniuspro.lt',
      name: 'Jonas Urbonas',
      bio: 'General plumbing and heating systems. Emergency call-outs available 24/7.',
      serviceArea: 'Vilnius, Kaunas',
      slug: 'plumber',
      tier: 'TIER2_TRADE_VERIFIED',
      rating: 4.9,
      jobs: 115,
    },
    {
      email: 'viktorija.jankauskiene@vilniuspro.lt',
      name: 'Viktorija Jankauskienė',
      bio: 'Office and residential cleaning. Eco-friendly products. Flexible scheduling.',
      serviceArea: 'Vilnius Center, Žirmūnai',
      slug: 'cleaning',
      tier: 'TIER1_ID_VERIFIED',
      rating: 4.7,
      jobs: 98,
    },
    {
      email: 'paulius.balsys@vilniuspro.lt',
      name: 'Paulius Balsys',
      bio: 'Electrician with commercial and residential experience. Fast turnaround times.',
      serviceArea: 'All Vilnius districts, Kaunas',
      slug: 'electrician',
      tier: 'TIER2_TRADE_VERIFIED',
      rating: 4.6,
      jobs: 167,
    },
    {
      email: 'aiste.vaitiekunaite@vilniuspro.lt',
      name: 'Aistė Vaitiekūnaitė',
      bio: 'Handywoman and painter. Interior painting, wallpaper hanging, and small repairs done right.',
      serviceArea: 'Vilnius Center, Naujamiestis, Antakalnis',
      slug: 'handyman',
      tier: 'TIER1_ID_VERIFIED',
      rating: 4.8,
      jobs: 44,
    },
  ];

  for (const p of providers) {
    const category = categories.find(c => c.slug === p.slug);

    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { password: hashedPassword },
      create: {
        email: p.email,
        name: p.name,
        password: hashedPassword,
        role: 'PROVIDER',
      },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: user.id },
      update: {
        ratingAvg: p.rating,
        completedJobs: p.jobs,
        isVerified: p.tier !== 'TIER0_BASIC',
        verificationTier: p.tier as any,
      },
      create: {
        userId: user.id,
        bio: p.bio,
        serviceArea: p.serviceArea,
        languages: ['Lithuanian', 'English'],
        ratingAvg: p.rating,
        completedJobs: p.jobs,
        isVerified: p.tier !== 'TIER0_BASIC',
        verificationTier: p.tier as any,
        responseTime: 'Usually responds in 1 hour',
        ...(category ? { categories: { connect: [{ id: category.id }] } } : {}),
      },
    });

    console.log(`✓ Provider created: ${p.name} (${p.email})`);
  }

  console.log('\n🎉 Done! New accounts created:');
  console.log('  Admin:     admin2@vilniuspro.lt  /  password123');
  console.log('  Providers: see list above         /  password123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
