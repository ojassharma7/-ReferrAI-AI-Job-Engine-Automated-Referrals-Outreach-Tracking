// POST /api/verify — the verified-referral engine.
// Input: a candidate (GitHub / portfolio / highlights) + optional job description.
// Output: an evidence-backed competence assessment + a "safe-to-refer" brief.
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { verifyCandidate } from '@/lib/verify/assess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.githubUsername && !body?.highlights && !body?.resumeText) {
    return NextResponse.json(
      { error: 'Provide at least a GitHub username, highlights, or resume text.' },
      { status: 400 },
    );
  }

  const result = await verifyCandidate(
    {
      name: body.name,
      targetRole: body.targetRole,
      githubUsername: body.githubUsername,
      portfolioUrl: body.portfolioUrl,
      linkedinUrl: body.linkedinUrl,
      highlights: body.highlights,
      resumeText: body.resumeText,
      liveAnswer: body.liveAnswer,
    },
    body.jdText,
  );

  return NextResponse.json({ success: true, ...result });
}
