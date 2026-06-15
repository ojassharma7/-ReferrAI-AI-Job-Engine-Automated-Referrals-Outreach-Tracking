// Create an outreach sequence (AI-drafted initial + follow-ups).
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { createSequence } from '@/lib/db/sequences';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.contactName || !body?.company || !body?.jobTitle) {
    return NextResponse.json(
      { error: 'contactName, company and jobTitle are required' },
      { status: 400 },
    );
  }

  const result = await createSequence(user, {
    contactEmail: body.contactEmail,
    contactName: body.contactName,
    contactTitle: body.contactTitle,
    company: body.company,
    jobTitle: body.jobTitle,
    jobExternalId: body.jobExternalId,
    candidateProfile: body.candidateProfile,
    proofPoint: body.proofPoint,
  });

  return NextResponse.json({ success: true, ...result });
}
