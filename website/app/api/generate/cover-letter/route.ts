// API Route: Generate cover letter

import { NextRequest, NextResponse } from 'next/server';
import { generateCoverLetter } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateProfile, jobTitle, company, jobDescription, contactName } = body;

    if (!candidateProfile || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateProfile, jobTitle, company, jobDescription' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const coverLetter = await generateCoverLetter(
      candidateProfile,
      jobTitle,
      company,
      jobDescription,
      contactName
    );

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

