// API Route: Generate cover letter

import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/gemini-client';
import { getAppUser } from '@/lib/auth';
import { enforceLimit, recordUsage } from '@/lib/usage';
import { saveDocument } from '@/lib/db/documents';

export async function POST(request: NextRequest) {
  try {
    const user = await getAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const limit = await enforceLimit(user, 'generate');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.message, code: 'limit_reached' },
        { status: 402 },
      );
    }

    const body = await request.json();
    const { candidateProfile, jobTitle, company, jobDescription, contactName, jobId } = body;

    if (!candidateProfile || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateProfile, jobTitle, company, jobDescription' },
        { status: 400 }
      );
    }

    const coverLetter = await generateCoverLetter(
      candidateProfile,
      jobTitle,
      company,
      jobDescription,
      contactName
    );

    await saveDocument(user, {
      type: 'cover_letter',
      text_content: coverLetter,
      job_external_id: jobId,
    });
    await recordUsage(user, 'generate');

    return NextResponse.json({
      success: true,
      coverLetter: coverLetter,
    });
  } catch (error: any) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate cover letter' },
      { status: 500 }
    );
  }
}
