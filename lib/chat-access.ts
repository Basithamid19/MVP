import prisma from '@/lib/prisma';

// Chat access policy: a customer and provider may only message each other once
// a booking between them is CONFIRMED — deposit held (or later: paid /
// processing / job in progress / completed). Before that, no chat anywhere on
// the platform. Server-only (imports Prisma).

export const CONFIRMED_PAYMENT_STATUSES = ['DEPOSIT_HELD', 'PAID', 'PROCESSING'];
export const ACTIVE_BOOKING_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

// True when the two users (order-independent; one is the customer, one the
// provider) share at least one non-canceled booking whose deposit has been
// paid — or that has already progressed/completed (which implies payment in
// the normal flow and covers legacy rows without a payment record).
export async function hasConfirmedBookingBetween(userIds: string[]): Promise<boolean> {
  const ids = userIds.filter(Boolean);
  if (ids.length < 2) return false;

  const booking = await prisma.booking.findFirst({
    where: {
      status: { not: 'CANCELED' },
      customer: { userId: { in: ids } },
      provider: { userId: { in: ids } },
      OR: [
        { payment: { status: { in: CONFIRMED_PAYMENT_STATUSES } } },
        { status: { in: ACTIVE_BOOKING_STATUSES as any } },
      ],
    },
    select: { id: true },
  });

  return booking != null;
}
