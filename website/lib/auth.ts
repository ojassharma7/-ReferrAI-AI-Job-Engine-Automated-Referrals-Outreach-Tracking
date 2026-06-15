// Auth helpers shared by Server Components and Route Handlers.
//
// Behavior:
//   - Supabase configured + logged in  -> real user
//   - Supabase configured + logged out -> null (caller redirects / returns 401)
//   - Supabase NOT configured          -> a synthetic demo user (no persistence)
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Fixed id used in demo mode. Not a real auth.users row, so DB writes are
// skipped for it (see lib/db/*).
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface AppUser {
  id: string;
  email: string | null;
  isDemo: boolean;
}

export async function getAppUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) {
    return { id: DEMO_USER_ID, email: 'demo@referrai.local', isDemo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { id: user.id, email: user.email ?? null, isDemo: false };
}
