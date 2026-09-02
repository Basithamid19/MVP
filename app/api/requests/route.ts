import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { ensureThreadForRequest, requestThreadsByProvider } from '@/lib/chat-access';
import { withPublicImages } from '@/lib/safe-image';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, address, description, dateWindow, budget, isUrgent, timeOfDay, photoUrls, providerId } = body;

  const customer = await prisma.customerProfile.findUnique({
    where: { userId: (session.user as any).id },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
  }

  // Normalize the time-of-day preference to the known set (defaults to flexible).
  const VALID_TOD = ['morning', 'afternoon', 'evening', 'flexible'];
  const normalizedTimeOfDay = VALID_TOD.includes(timeOfDay) ? timeOfDay : 'flexible';

  // Photo attachments: http(s) URLs only, capped to a sane count.
  const safePhotoUrls: string[] = Array.isArray(photoUrls)
    ? photoUrls.filter((u: unknown) => typeof u === 'string' && /^https?:\/\//.test(u)).slice(0, 10)
    : [];

  // Direct request (from a provider's profile): validate the target exists
  // and actually offers the chosen category; otherwise fall back to an open
  // broadcast so a stale/foreign providerId never blackholes the request.
  let targetProviderId: string | null = null;
  // The target's USER id, kept from the same lookup — the notification href and
  // the ChatThread both need it, and ChatThread.customerId/providerId reference
  // User rather than the profile rows.
  let targetProviderUserId: string | null = null;
  if (typeof providerId === 'string' && providerId) {
    const target = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { id: true, userId: true, categories: { select: { id: true } } },
    });
    if (target && target.categories.some(c => c.id === categoryId)) {
      targetProviderId = target.id;
      targetProviderUserId = target.userId;
    }
  }

  const baseData = {
    customerId: customer.id,
    categoryId,
    address,
    description,
    dateWindow: new Date(dateWindow),
    budget: budget ? parseFloat(budget) : null,
    isUrgent: isUrgent || false,
    status: 'NEW' as const,
  };

  // Persist timeOfDay + photoUrls + targetProviderId; fall back to a create
  // without the newer columns if migrations (20260702/04/06) haven't run yet.
  const serviceRequest = await prisma.serviceRequest.create({
    data: { ...baseData, timeOfDay: normalizedTimeOfDay, photoUrls: safePhotoUrls, targetProviderId },
    include: { category: true },
  }).catch(async (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeOfDay') || msg.includes('photoUrls') || msg.includes('targetProviderId') || msg.includes('column') || msg.includes('P2022')) {
      console.warn('[requests POST] new columns missing, creating without them');
      return prisma.serviceRequest.create({ data: baseData, include: { category: true } });
    }
    throw err;
  });

  const categoryName = serviceRequest.category?.name ?? 'service';
  const urgentPrefix = isUrgent ? '🔴 Urgent: ' : '';

  if (targetProviderId && targetProviderUserId) {
    // Direct request: the conversation opens NOW, before any quote exists.
    // Both parties then see the request in /messages — the provider with a
    // "Send your quote" CTA, the customer waiting on it — and the existing
    // offer → counter → accept machinery takes over from there.
    //
    // Best-effort by construction (ensureThreadForRequest swallows every
    // failure and returns null): a thread problem must never lose the
    // customer's request, so we fall back to the old leads deep link.
    // Open/broadcast requests stay leads-only — no thread per candidate pro.
    const threadId = await ensureThreadForRequest(
      serviceRequest.id,
      customer.userId,
      targetProviderUserId,
    );

    // Direct request: notify ONLY the chosen provider.
    createNotification({
      userId: targetProviderUserId,
      type: 'lead',
      title: `${urgentPrefix}You've received a direct request`,
      body: `A customer chose you for a ${categoryName.toLowerCase()} job${address ? ` in ${address}` : ''}. Send your quote.`,
      href: threadId ? `/messages?thread=${threadId}` : '/provider/leads',
    });
  } else {
    // Open request: broadcast to all providers in this category.
    const matchingProviders = await prisma.providerProfile.findMany({
      where: { categories: { some: { id: categoryId } } },
      select: { userId: true },
    });
    for (const provider of matchingProviders) {
      createNotification({
        userId: provider.userId,
        type: 'lead',
        title: `${urgentPrefix}New ${categoryName} lead`,
        body: `A customer needs ${categoryName.toLowerCase()} help${address ? ` in ${address}` : ''}. Send a quote now.`,
        href: '/provider/leads',
      });
    }
  }

  return NextResponse.json(serviceRequest);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const userId = (session.user as any).id;
    const role = (session.user as any).role;

    // Authorization: full details are only readable by the owning customer,
    // an admin, or a provider who has already submitted a quote on this
    // request. Category-matched providers who have NOT quoted yet are NOT
    // authorized here — lead visibility with a narrower field set will be
    // handled in a dedicated endpoint in a later block.
    // targetProviderId is a new column (20260706) — fall back without it.
    const header: any = await prisma.serviceRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        categoryId: true,
        targetProviderId: true,
        customer: { select: { userId: true } },
      },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('targetProviderId') || msg.includes('column') || msg.includes('P2022')) {
        return prisma.serviceRequest.findUnique({
          where: { id },
          select: { id: true, status: true, categoryId: true, customer: { select: { userId: true } } },
        });
      }
      throw err;
    });
    if (!header) {
      return NextResponse.json(null);
    }

    let authorized = role === 'ADMIN' || header.customer?.userId === userId;

    if (!authorized && role === 'PROVIDER') {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true, categories: { select: { id: true } } },
      });
      if (providerProfile) {
        const quoted = await prisma.quote.findFirst({
          where: { requestId: id, providerId: providerProfile.id },
          select: { id: true },
        });
        if (header.targetProviderId) {
          // Direct request: readable only by its target (or a provider who
          // already quoted, for legacy safety).
          if (quoted || header.targetProviderId === providerProfile.id) authorized = true;
        } else {
          // A provider may read the request if they already quoted on it, OR
          // if it's an open lead in one of their categories — the Quote
          // Builder loads this endpoint before the first quote exists.
          const isMatchingOpenLead =
            ['NEW', 'QUOTED'].includes(header.status) &&
            providerProfile.categories.some((c: any) => c.id === header.categoryId);
          if (quoted || isMatchingOpenLead) authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Never `include: { user: true }` on cross-party reads — that serializes
    // the full User row (password hash, email) into the JSON response.
    const req = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: true,
        customer: { include: { user: { select: { id: true, name: true, image: true } } } },
        quotes: {
          include: {
            provider: { include: { user: { select: { id: true, name: true, image: true } }, categories: true } },
            booking: { select: { id: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!req) return NextResponse.json(null);

    // threadId per quote: the negotiation now lives in /messages, so the
    // request detail page's only per-quote action is opening that conversation.
    // ONE batched lookup for the whole request. Exposed only for threads the
    // viewer is actually in — a provider reading this lead must not learn a
    // rival's thread id (the /api/chat participant check would reject them
    // anyway, but there's no reason to hand it over).
    const threadByProvider = await requestThreadsByProvider(
      req.id,
      req.customer?.user?.id ?? null,
    );
    const viewerProviderUserId = role === 'PROVIDER' ? userId : null;
    const quotes = (req.quotes ?? []).map((q: any) => {
      const quoteProviderUserId = q.provider?.user?.id ?? null;
      const visible = !viewerProviderUserId || viewerProviderUserId === quoteProviderUserId;
      return {
        ...q,
        threadId: visible && quoteProviderUserId
          ? threadByProvider.get(quoteProviderUserId) ?? null
          : null,
      };
    });

    // withPublicImages walks the nested customer.user / quotes[].provider.user
    // relations and nulls any legacy base64 data-URL avatar before it ships —
    // a request with several quotes used to carry one blob per quoting pro
    // (lib/safe-image.ts).
    return NextResponse.json(withPublicImages({ ...req, quotes }));
  }

  const role = (session.user as any).role;
  const userId = (session.user as any).id;

  if (role === 'CUSTOMER') {
    const customer = await prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customer) return NextResponse.json([]);
    
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: customer.id },
      include: { category: true, quotes: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  } else if (role === 'PROVIDER') {
    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { categories: true },
    });
    if (!provider) return NextResponse.json([]);

    const categoryIds = provider.categories.map(c => c.id);
    const categoryFilter = categoryIds.length > 0
      ? { categoryId: { in: categoryIds } }
      : {};

    // Direct requests are visible only to their target provider (see
    // /api/provider/leads for the same rule); open requests broadcast.
    const providerBaseWhere = {
      ...categoryFilter,
      status: { in: ['NEW', 'QUOTED'] as any },
    };
    const PROVIDER_LIST_INCLUDE = {
      category: true,
      customer: { include: { user: { select: { id: true, name: true, image: true } } } },
    } as const;

    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...providerBaseWhere,
        OR: [{ targetProviderId: null }, { targetProviderId: provider.id }],
      },
      include: PROVIDER_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }).catch(async (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('targetProviderId') || msg.includes('column') || msg.includes('P2022')) {
        return prisma.serviceRequest.findMany({
          where: providerBaseWhere,
          include: PROVIDER_LIST_INCLUDE,
          orderBy: { createdAt: 'desc' },
        });
      }
      throw err;
    });
    // Lead list: one customer avatar per row, so a single legacy data-URL row
    // bloated the whole list (lib/safe-image.ts).
    return NextResponse.json(withPublicImages(requests));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
