// Detects whether Supabase credentials are present and real (not placeholders).
// When false, the app runs in single-user "demo mode": auth is bypassed and
// database persistence becomes a no-op, so the product shell still works
// before you wire up a Supabase project.

function isReal(value: string | undefined, ...placeholders: string[]): boolean {
  if (!value) return false;
  const v = value.trim();
  if (v === '') return false;
  return !placeholders.some((p) => v.includes(p));
}

export function isSupabaseConfigured(): boolean {
  return (
    isReal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'your-project', 'your_supabase') &&
    isReal(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'your_supabase', 'your-anon')
  );
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
