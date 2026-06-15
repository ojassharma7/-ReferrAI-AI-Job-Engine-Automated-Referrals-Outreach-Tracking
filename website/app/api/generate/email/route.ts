// API Route: Generate referral email

import { NextRequest, NextResponse } from 'next/server';
import { generateReferralEmail } from '@/lib/gemini-client';
import { getAppUser } from '@/lib/auth';
import { enforceLimit, recordUsage } from '@/lib/usage';

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
    const { candidateProfile, jobTitle, company, contactName, contactTitle, proofPoint } = body;

    if (!candidateProfile || !jobTitle || !company || !contactName || !contactTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: candidateProfile, jobTitle, company, contactName, contactTitle' },
        { status: 400 }
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

    await recordUsage(user, 'generate');

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
