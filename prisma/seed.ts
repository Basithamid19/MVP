import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vilniuspro.lt' },
    update: {},
    create: {
      email: 'admin@vilniuspro.lt',
      name: 'Admin Vilnius',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('✓ Admin created');

  // 2. Create Categories
  const categories = [
    { name: 'Plumber', slug: 'plumber', icon: 'Droplets', description: 'Fix leaks, install pipes, bathroom repairs' },
    { name: 'Electrician', slug: 'electrician', icon: 'Zap', description: 'Wiring, outlets, lighting installation' },
    { name: 'Handyman', slug: 'handyman', icon: 'Hammer', description: 'General repairs and maintenance' },
    { name: 'Cleaning', slug: 'cleaning', icon: 'Sparkles', description: 'Home and office cleaning services' },
    { name: 'Furniture Assembly', slug: 'furniture-assembly', icon: 'Box', description: 'IKEA and furniture assembly' },
    { name: 'Moving Help', slug: 'moving-help', icon: 'Truck', description: 'Moving and relocation assistance' },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }
  console.log('✓ Categories created');

  // 3. Create Customers
  const customersData = [
    { email: 'jonas@example.lt', name: 'Jonas Jonaitis', address: 'Gedimino pr. 15, Vilnius', phone: '+37061234567' },
    { email: 'asta@example.lt', name: 'Asta Astaitė', address: 'Konstitucijos pr. 7, Vilnius', phone: '+37069876543' },
  ];

  const customers: { id: string; profileId: string }[] = [];
  for (const c of customersData) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        name: c.name,
        password: hashedPassword,
        role: 'CUSTOMER',
        customerProfile: {
          create: {
            address: c.address,
            phone: c.phone,
          },
        },
      },
      include: { customerProfile: true },
    });
    customers.push({ id: user.id, profileId: user.customerProfile!.id });
  }
  console.log('✓ 2 Customers created');

  // 4. Create Providers (8 providers across categories in Vilnius)
  const providersData = [
    { email: 'marius@pro.lt',   name: 'Marius Kazlauskas',   image: 'https://randomuser.me/api/portraits/men/10.jpg',   cat: 'plumber',            bio: 'Professional plumber with 10 years experience in Vilnius. Specializing in bathroom renovations and emergency repairs.', area: 'Senamiestis, Naujamiestis, Žvėrynas' },
    { email: 'tomas@pro.lt',    name: 'Tomas Petrauskas',    image: 'https://randomuser.me/api/portraits/men/20.jpg',   cat: 'electrician',        bio: 'Certified master electrician. Smart home installations, rewiring, and 24/7 emergency services.', area: 'Antakalnis, Verkiai, Fabijoniškės' },
    { email: 'lina@pro.lt',     name: 'Lina Rimkutė',        image: 'https://randomuser.me/api/portraits/women/32.jpg', cat: 'cleaning',           bio: 'Eco-friendly cleaning with premium products. Apartments, offices, post-construction cleanup.', area: 'All Vilnius districts' },
    { email: 'andrius@pro.lt',  name: 'Andrius Butkus',      image: 'https://randomuser.me/api/portraits/men/30.jpg',   cat: 'handyman',           bio: 'Jack of all trades! From hanging pictures to fixing doors. No job too small.', area: 'Pilaitė, Karoliniškės, Lazdynai' },
    { email: 'vytas@pro.lt',    name: 'Vytautas Sabonis',    image: 'https://randomuser.me/api/portraits/men/45.jpg',   cat: 'furniture-assembly', bio: 'IKEA assembly expert. Fast, precise, and clean work. Tools included.', area: 'All Vilnius districts' },
    { email: 'paulius@pro.lt',  name: 'Paulius Jankauskas',  image: 'https://randomuser.me/api/portraits/men/52.jpg',   cat: 'moving-help',        bio: 'Professional moving team with truck. Careful handling of your belongings.', area: 'Vilnius and surrounding areas' },
    { email: 'rokas@pro.lt',    name: 'Rokas Stankevičius',  image: 'https://randomuser.me/api/portraits/men/16.jpg',   cat: 'plumber',            bio: 'Emergency plumbing 24/7. Pipe repairs, drain cleaning, water heater installation.', area: 'Justiniškės, Pašilaičiai, Baltupiai' },
    { email: 'darius@pro.lt',   name: 'Darius Vaitkus',      image: 'https://randomuser.me/api/portraits/men/25.jpg',   cat: 'electrician',        bio: 'Industrial and residential electrical work. EV charger installations specialist.', area: 'Šnipiškės, Žirmūnai, Šeškinė' },
  ];

  const providers: { id: string; profileId: string; email: string }[] = [];
  for (const p of providersData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { image: p.image },
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
            ratingAvg: 4.2 + Math.random() * 0.8,
            completedJobs: 10 + Math.floor(Math.random() * 90),
            isVerified: true,
            verificationTier: 'TIER1_ID_VERIFIED',
            responseTime: 'Usually responds in 30 mins',
            categories: {
              connect: { id: createdCategories[p.cat] },
            },
            offerings: {
              create: [
                { name: 'Standard Service', description: 'Basic service call', price: 25 + Math.random() * 25, priceType: 'HOURLY' },
                { name: 'Emergency Service', description: 'After-hours emergency call', price: 50 + Math.random() * 30, priceType: 'HOURLY' },
              ],
            },
          },
        },
      },
      include: { providerProfile: true },
    });
    providers.push({ id: user.id, profileId: user.providerProfile!.id, email: p.email });
  }
  console.log('✓ 8 Providers created');

  // 5. Create 2 Sample Service Requests
  const request1 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].profileId,
      categoryId: createdCategories['plumber'],
      address: 'Vilniaus g. 22, Vilnius',
      description: 'Leaking faucet in kitchen. Water dripping constantly. Need urgent repair.',
      dateWindow: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      budget: 50,
      isUrgent: true,
      status: 'CHATTING',
    },
  });

  const request2 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[1].profileId,
      categoryId: createdCategories['electrician'],
      address: 'Ozo g. 15-42, Vilnius',
      description: 'Need to install 3 new electrical outlets in living room for home office setup.',
      dateWindow: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      budget: 100,
      isUrgent: false,
      status: 'NEW',
    },
  });
  console.log('✓ 2 Service Requests created');

  // 6. Create 2 Chat Threads with Messages
  const chat1 = await prisma.chatThread.create({
    data: {
      requestId: request1.id,
      customerId: customers[0].id,
      providerId: providers[0].id,
      participants: {
        connect: [{ id: customers[0].id }, { id: providers[0].id }], // Jonas & Marius (plumber)
      },
      messages: {
        create: [
          { senderId: customers[0].id, content: 'Hi! I have a leaking faucet that needs repair. Are you available this week?' },
          { senderId: providers[0].id, content: 'Hello Jonas! Yes, I can come tomorrow afternoon. Can you send me a photo of the faucet?' },
          { senderId: customers[0].id, content: 'Sure, its a standard kitchen mixer tap. The leak is at the base.' },
          { senderId: providers[0].id, content: 'I understand. I\'ll bring the necessary parts. My rate is €35/hour. Should take about 1 hour.' },
        ],
      },
    },
  });

  const chat2 = await prisma.chatThread.create({
    data: {
      requestId: request1.id,
      customerId: customers[0].id,
      providerId: providers[6].id,
      participants: {
        connect: [{ id: customers[0].id }, { id: providers[6].id }], // Jonas & Rokas (plumber)
      },
      messages: {
        create: [
          { senderId: providers[6].id, content: 'Hi! I saw your request for plumbing help. I\'m available today if it\'s urgent!' },
          { senderId: customers[0].id, content: 'Thanks for reaching out! What would be your rate?' },
          { senderId: providers[6].id, content: 'For emergency same-day service, €45/hour. I can be there within 2 hours.' },
        ],
      },
    },
  });
  console.log('✓ 2 Chat Threads created');

  // 7. Create 3 Completed Bookings with Reviews
  // First, create some quotes and bookings for past jobs
  const pastDate1 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
  const pastDate2 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);  // 7 days ago
  const pastDate3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);  // 3 days ago

  // Create past service requests for the bookings
  const pastRequest1 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].profileId,
      categoryId: createdCategories['cleaning'],
      address: 'Gedimino pr. 15, Vilnius',
      description: 'Deep cleaning after renovation',
      dateWindow: pastDate1,
      status: 'ACCEPTED',
    },
  });

  const pastRequest2 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[1].profileId,
      categoryId: createdCategories['furniture-assembly'],
      address: 'Konstitucijos pr. 7, Vilnius',
      description: 'IKEA wardrobe assembly',
      dateWindow: pastDate2,
      status: 'ACCEPTED',
    },
  });

  const pastRequest3 = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].profileId,
      categoryId: createdCategories['handyman'],
      address: 'Gedimino pr. 15, Vilnius',
      description: 'Fix squeaky door and install shelf',
      dateWindow: pastDate3,
      status: 'ACCEPTED',
    },
  });

  // Booking 1 - Lina (cleaning) for Jonas
  const booking1 = await prisma.booking.create({
    data: {
      customerId: customers[0].profileId,
      providerId: providers[2].profileId, // Lina - cleaning
      status: 'COMPLETED',
      scheduledAt: pastDate1,
      totalAmount: 80,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      customerId: customers[0].profileId,
      providerId: providers[2].profileId,
      rating: 5,
      comment: 'Lina did an amazing job! The apartment looks spotless after the renovation cleanup. Very professional and thorough.',
    },
  });

  // Booking 2 - Vytas (furniture) for Asta
  const booking2 = await prisma.booking.create({
    data: {
      customerId: customers[1].profileId,
      providerId: providers[4].profileId, // Vytas - furniture
      status: 'COMPLETED',
      scheduledAt: pastDate2,
      totalAmount: 60,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      customerId: customers[1].profileId,
      providerId: providers[4].profileId,
      rating: 4,
      comment: 'Good work on the wardrobe assembly. Took a bit longer than expected but the result is perfect.',
    },
  });

  // Booking 3 - Andrius (handyman) for Jonas
  const booking3 = await prisma.booking.create({
    data: {
      customerId: customers[0].profileId,
      providerId: providers[3].profileId, // Andrius - handyman
      status: 'COMPLETED',
      scheduledAt: pastDate3,
      totalAmount: 45,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking3.id,
      customerId: customers[0].profileId,
      providerId: providers[3].profileId,
      rating: 5,
      comment: 'Andrius fixed everything quickly. The door doesn\'t squeak anymore and the shelf is perfectly level. Highly recommend!',
    },
  });

  console.log('✓ 3 Reviews created');

  // Update provider ratings based on reviews
  await prisma.providerProfile.update({
    where: { id: providers[2].profileId },
    data: { ratingAvg: 5.0, completedJobs: { increment: 1 } },
  });
  await prisma.providerProfile.update({
    where: { id: providers[4].profileId },
    data: { ratingAvg: 4.0, completedJobs: { increment: 1 } },
  });
  await prisma.providerProfile.update({
    where: { id: providers[3].profileId },
    data: { ratingAvg: 5.0, completedJobs: { increment: 1 } },
  });

  console.log('\n🎉 Seed completed successfully!');
  console.log('   - 1 Admin');
  console.log('   - 2 Customers');
  console.log('   - 8 Providers');
  console.log('   - 6 Categories');
  console.log('   - 2 Active Requests');
  console.log('   - 2 Chat Threads');
  console.log('   - 3 Reviews');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
