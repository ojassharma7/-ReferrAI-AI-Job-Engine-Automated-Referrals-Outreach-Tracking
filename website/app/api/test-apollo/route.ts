// Test endpoint to check Apollo.io directly
import { NextRequest, NextResponse } from 'next/server';
import { searchRecruiters, searchDomainEmployees } from '@/lib/apollo-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company') || 'Microsoft';
    const role = searchParams.get('role') || 'Data Scientist';

    console.log(`🧪 Testing Apollo.io with company: ${company}, role: ${role}`);

    let recruiters: any[] = [];
    let domainEmployees: any[] = [];

    try {
      console.log('Testing recruiter search...');
      recruiters = await searchRecruiters(company);
      console.log(`✅ Recruiters found: ${recruiters.length}`);
    } catch (error: any) {
      console.error('❌ Recruiter search failed:', error.message);
      return NextResponse.json({
        error: 'Recruiter search failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }, { status: 500 });
    }

    try {
      console.log('Testing domain employee search...');
      domainEmployees = await searchDomainEmployees(company, role);
      console.log(`✅ Domain employees found: ${domainEmployees.length}`);
    } catch (error: any) {
      console.error('❌ Domain employee search failed:', error.message);
      return NextResponse.json({
        error: 'Domain employee search failed',
        message: error.message,
        recruiters: recruiters,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      company,
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

