import { NextResponse } from 'next/server';
import { availableChannels } from '@/lib/messaging/channels';

export const dynamic = 'force-dynamic';

// GET — which verification channels this deployment can deliver on. Public:
// it reports booleans only, never credentials. The register page uses it to
// decide whether to offer the SMS option, and the forgot-password page to
// decide whether a reset is possible at all.
export async function GET() {
  return NextResponse.json(availableChannels());
}
