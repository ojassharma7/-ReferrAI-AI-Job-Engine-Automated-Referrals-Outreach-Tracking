import { NextResponse, type NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { updateProfile } from '@/lib/db/profiles';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function PUT(request: NextRequest) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const patch = {
    full_name: body.full_name ?? null,
    headline: body.headline ?? null,
    candidate_profile: body.candidate_profile ?? null,
    base_resume_text: body.base_resume_text ?? null,
  };

  if (!isSupabaseConfigured() || user.isDemo) {
    // Demo mode: nothing to persist, but report success so the UI flows.
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const profile = await updateProfile(patch);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save profile' },
      { status: 500 },
    );
  }
}
