import { redirect } from 'next/navigation';
import type React from 'react';
import { auth } from '@/lib/auth';

// Reading the session forces this subtree to render per-request; declaring it
// keeps the build from attempting a static prerender of the admin shell.
export const dynamic = 'force-dynamic';

/**
 * Server-side gate for the whole /admin subtree. Previously there was no admin
 * layout at all: only /api/admin/* checked the role, so the console shell would
 * render for any logged-in user and merely show empty modules. This bounces
 * non-admins before any admin UI is sent.
 *
 * Pure guard — no chrome. The admin console owns its own shell in
 * app/admin/dashboard/page.tsx.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const role = (session.user as any).role;
  if (role !== 'ADMIN') {
    redirect(role === 'PROVIDER' ? '/provider/dashboard' : '/dashboard');
  }

  return <>{children}</>;
}
