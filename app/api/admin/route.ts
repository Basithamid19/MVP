import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') return null;
  return session;
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section') || 'overview';

  if (section === 'overview') {
    const [
      pendingVerifications,
      totalRequests,
      totalBookings,
      completedBookings,
      canceledBookings,
      totalProviders,
      totalUsers,
      totalReviews,
      gmvResult,
    ] = await Promise.all([
      prisma.providerVerification.findMany({
        where: { status: 'PENDING' },
        include: { provider: { include: { user: true } } },
      }),
      prisma.serviceRequest.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELED' } }),
      prisma.providerProfile.count(),
      prisma.user.count(),
      prisma.review.count(),
      prisma.booking.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      pendingVerifications,
      stats: {
        totalRequests,
        totalBookings,
        completedBookings,
        canceledBookings,
        totalProviders,
        totalUsers,
        totalReviews,
        gmv: gmvResult._sum.totalAmount ?? 0,
        quoteRate: totalRequests > 0 ? Math.round((totalBookings / totalRequests) * 100) : 0,
        conversionRate: totalRequests > 0 ? Math.round((completedBookings / totalRequests) * 100) : 0,
        cancellationRate: totalBookings > 0 ? Math.round((canceledBookings / totalBookings) * 100) : 0,
      },
    });
  }

  if (section === 'providers') {
    const providers = await prisma.providerProfile.findMany({
      include: {
        user: true,
        categories: true,
        verifications: { orderBy: { createdAt: 'desc' }, take: 3 },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { ratingAvg: 'desc' },
    });
    return NextResponse.json(providers);
  }

  if (section === 'bookings') {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { include: { user: true } },
        provider: { include: { user: true, categories: true } },
        payment: true,
        quote: { include: { request: { include: { category: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(bookings);
  }

  if (section === 'reviews') {
    const reviews = await prisma.review.findMany({
      include: {
        customer: { include: { user: true } },
        provider: { include: { user: true } },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  }

  if (section === 'users') {
    const users = await prisma.user.findMany({
      include: {
        customerProfile: true,
        providerProfile: { select: { ratingAvg: true, completedJobs: true, isVerified: true, verificationTier: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  }

  if (section === 'categories') {
    const categories = await prisma.serviceCategory.findMany({
      include: { _count: { select: { providers: true, requests: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  }

  if (section === 'tickets') {
    const tickets = await prisma.adminTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tickets);
  }

  return NextResponse.json({ error: 'Unknown section' }, { status: 400 });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { action } = body;

  // Legacy / verify provider document
  if (!action || action === 'verify') {
    const { verificationId, status, tier } = body;
    const verification = await prisma.providerVerification.update({
      where: { id: verificationId },
      data: { status },
    });
    if (status === 'APPROVED') {
      await prisma.providerProfile.update({
        where: { id: verification.providerProfileId },
        data: { isVerified: true, verificationTier: tier || 'TIER1_ID_VERIFIED' },
      });
    }
    return NextResponse.json(verification);
  }

  if (action === 'update_provider') {
    const { providerId, isVerified, verificationTier } = body;
    const provider = await prisma.providerProfile.update({
      where: { id: providerId },
      data: { isVerified, ...(verificationTier && { verificationTier }) },
    });
    return NextResponse.json(provider);
  }

  if (action === 'block_review') {
    const review = await prisma.review.update({
      where: { id: body.reviewId },
      data: { isHidden: true },
    });
    return NextResponse.json(review);
  }

  if (action === 'unblock_review') {
    const review = await prisma.review.update({
      where: { id: body.reviewId },
      data: { isHidden: false },
    });
    return NextResponse.json(review);
  }

  if (action === 'refund') {
    const { bookingId } = body;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    const updated = await prisma.booking.update({ where: { id: bookingId }, data: { status: 'CANCELED' } });
    await prisma.payment.upsert({
      where: { bookingId },
      update: { status: 'REFUNDED' },
      create: { bookingId, amount: booking.totalAmount, status: 'REFUNDED' },
    });
    return NextResponse.json(updated);
  }

  if (action === 'create_ticket') {
    const { subject, description, reporterId } = body;
    const ticket = await prisma.adminTicket.create({
      data: { subject, description, reporterId, status: 'OPEN' },
    });
    return NextResponse.json(ticket);
  }

  if (action === 'update_ticket') {
    const ticket = await prisma.adminTicket.update({
      where: { id: body.ticketId },
      data: { status: body.status },
    });
    return NextResponse.json(ticket);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
