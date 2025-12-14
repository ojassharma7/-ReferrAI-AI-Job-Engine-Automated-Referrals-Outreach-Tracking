// API Route: Generate customized resume

import { NextRequest, NextResponse } from 'next/server';
import { generateResume } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseResume, jobTitle, company, jobDescription, keywords } = body;

    if (!baseResume || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: baseResume, jobTitle, company, jobDescription' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const customizedResume = await generateResume(
      baseResume,
      jobTitle,
      company,
      jobDescription,
      keywords || []
    );

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

