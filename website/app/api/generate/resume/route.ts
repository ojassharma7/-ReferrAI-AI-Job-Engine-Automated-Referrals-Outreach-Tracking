// API Route: Generate customized resume

import { NextRequest, NextResponse } from 'next/server';
import { generateResume } from '@/lib/gemini-client';
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
    const { baseResume, jobTitle, company, jobDescription, keywords, jobId } = body;

    if (!baseResume || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: baseResume, jobTitle, company, jobDescription' },
        { status: 400 }
      );
    }

    // Falls back to mock content automatically when GEMINI_API_KEY is missing.
    const customizedResume = await generateResume(
      baseResume,
      jobTitle,
      company,
      jobDescription,
      keywords || []
    );

    await saveDocument(user, {
      type: 'resume',
      text_content: customizedResume,
      job_external_id: jobId,
    });
    await recordUsage(user, 'generate');

    return NextResponse.json({
      success: true,
      resume: customizedResume,
    });
  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
