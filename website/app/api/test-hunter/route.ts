// Test endpoint to check Hunter.io directly
import { NextRequest, NextResponse } from 'next/server';
import { searchRecruiters, searchDomainEmployees } from '@/lib/hunter-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'microsoft.com';
    const role = searchParams.get('role') || 'Data Scientist';

    console.log(`🧪 Testing Hunter.io with domain: ${domain}, role: ${role}`);

    if (!process.env.HUNTER_API_KEY) {
      return NextResponse.json({
        error: 'HUNTER_API_KEY is not set',
      }, { status: 400 });
    }

    let recruiters: any[] = [];
    let domainEmployees: any[] = [];

    try {
      console.log('Testing recruiter search...');
      recruiters = await searchRecruiters(domain);
      console.log(`✅ Recruiters found: ${recruiters.length}`);
    } catch (error: any) {
      console.error('❌ Recruiter search failed:', error.message);
      return NextResponse.json({
        error: 'Recruiter search failed',
        message: error.message,
      }, { status: 500 });
    }

    try {
      console.log('Testing domain employee search...');
      domainEmployees = await searchDomainEmployees(domain, role);
      console.log(`✅ Domain employees found: ${domainEmployees.length}`);
    } catch (error: any) {
      console.error('❌ Domain employee search failed:', error.message);
      return NextResponse.json({
        error: 'Domain employee search failed',
        message: error.message,
        recruiters: recruiters,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      domain,
      role,
      recruiters: recruiters,
      domainEmployees: domainEmployees,
      totalRecruiters: recruiters.length,
      totalDomainEmployees: domainEmployees.length,
    });
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error.message,
    }, { status: 500 });
  }
}

