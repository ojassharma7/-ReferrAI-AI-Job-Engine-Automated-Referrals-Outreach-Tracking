// API Route: Generate referral email

import { NextRequest, NextResponse } from 'next/server';
import { generateReferralEmail } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateProfile, jobTitle, company, contactName, contactTitle, proofPoint } = body;

    if (!candidateProfile || !jobTitle || !company || !contactName || !contactTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateProfile, jobTitle, company, contactName, contactTitle' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const email = await generateReferralEmail(
      candidateProfile,
      jobTitle,
      company,
      contactName,
      contactTitle,
      proofPoint
    );

    return NextResponse.json({
      success: true,
      email: email,
    });
  } catch (error: any) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}

