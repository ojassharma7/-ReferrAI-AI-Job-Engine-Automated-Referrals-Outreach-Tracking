// Stop a sequence or mark it as replied (both skip remaining steps).
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { updateSequenceStatus } from '@/lib/db/sequences';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  // action 'replied' | 'stop' (default), or an explicit status.
  const status =
    body.action === 'replied'
      ? 'replied'
      : body.action === 'reactivate'
        ? 'active'
        : 'stopped';

  const ok = await updateSequenceStatus(user, id, status);
  return NextResponse.json({ success: ok, status });
}
