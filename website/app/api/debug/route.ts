// Debug endpoint to check API key status
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apolloApiKey: !!process.env.APOLLO_API_KEY,
    apolloApiKeyLength: process.env.APOLLO_API_KEY?.length || 0,
    hunterApiKey: !!process.env.HUNTER_API_KEY,
    hunterApiKeyLength: process.env.HUNTER_API_KEY?.length || 0,
    jsearchApiKey: !!process.env.JSEARCH_API_KEY,
    geminiApiKey: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
}

