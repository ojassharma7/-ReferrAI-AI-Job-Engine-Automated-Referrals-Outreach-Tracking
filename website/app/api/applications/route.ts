// Create a pipeline application (from a search result or manually).
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { createApplication } from '@/lib/db/applications';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.jobTitle || !body?.company) {
    return NextResponse.json(
      { error: 'jobTitle and company are required' },
      { status: 400 },
    );
  }

  const { id, demo } = await createApplication(user, {
    jobExternalId: body.jobExternalId,
    jobTitle: body.jobTitle,
    company: body.company,
    jobLocation: body.jobLocation,
    jdText: body.jdText,
    jdUrl: body.jdUrl,
    jobSource: body.jobSource,
    contactEmail: body.contactEmail,
    contactName: body.contactName,
    contactTitle: body.contactTitle,
    status: body.status,
  });

  return NextResponse.json({ success: true, id, demo });
}
