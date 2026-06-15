// Server-side Supabase client (for Server Components, Route Handlers, Actions).
// Uses the request cookie store so the auth session is read/refreshed correctly.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll can be called from a Server Component where mutating
          // cookies is not allowed. The middleware refreshes the session,
          // so this is safe to ignore.
        }
      },
    },
  });
}

// Service-role client for trusted server tasks (e.g. Stripe webhooks) that must
// bypass RLS. NEVER import this into client code.
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createServerClient(SUPABASE_URL, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
