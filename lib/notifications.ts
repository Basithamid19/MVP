import prisma from '@/lib/prisma';

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  href: string;
}) {
  try {
    return await prisma.notification.create({ data: params });
  } catch {
    // Silently fail — notifications should never break core flows
    return null;
  }
}
