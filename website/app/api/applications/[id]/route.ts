// Update (status/notes) or delete a pipeline application.
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import {
  updateApplication,
  deleteApplication,
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/lib/db/applications';

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

  if (body.status && !APPLICATION_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const ok = await updateApplication(user, id, {
    status: body.status as ApplicationStatus | undefined,
    notes: body.notes,
  });
  return NextResponse.json({ success: ok });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteApplication(user, id);
  return NextResponse.json({ success: ok });
}
