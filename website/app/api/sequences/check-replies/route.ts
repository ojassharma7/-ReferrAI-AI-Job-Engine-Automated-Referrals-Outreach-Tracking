// Cron worker: detect replies on active sequence threads and auto-stop them.
// Schedule alongside /api/sequences/cron. Same CRON_SECRET auth.
import { NextRequest, NextResponse } from 'next/server';
import { checkReplies } from '@/lib/db/sequences';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get('x-cron-secret');
  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  return header === secret || bearer === secret;
}

async function handle(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await checkReplies();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
