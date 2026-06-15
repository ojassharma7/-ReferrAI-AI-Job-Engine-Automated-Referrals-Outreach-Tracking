// Cron worker: send any due sequence steps. Point a scheduler (Vercel Cron,
// GitHub Actions, the legacy n8n, etc.) at this on an interval.
//
// Auth: if CRON_SECRET is set, the request must send it via the
// `x-cron-secret` header or `Authorization: Bearer <secret>`. If CRON_SECRET is
// unset (e.g. local dev), the endpoint is open.
import { NextRequest, NextResponse } from 'next/server';
import { processDueSteps } from '@/lib/db/sequences';

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
  const result = await processDueSteps();
  return NextResponse.json({ success: true, ...result });
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
