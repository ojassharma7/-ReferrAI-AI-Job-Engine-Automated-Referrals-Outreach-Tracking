// Profile data access. No-ops gracefully in demo mode (no Supabase / no real user).
import { createClient } from '@/lib/supabase/server';
import { getAppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface Profile {
  id: string;
  full_name: string | null;
  headline: string | null;
  candidate_profile: string | null;
  base_resume_text: string | null;
  base_resume_latex: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  stripe_customer_id: string | null;
}

export type ProfilePatch = Partial<
  Pick<
    Profile,
    'full_name' | 'headline' | 'candidate_profile' | 'base_resume_text' | 'base_resume_latex'
  >
>;

export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getAppUser();
  if (!user || user.isDemo) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (data as Profile) ?? null;
}

export async function updateProfile(patch: ProfilePatch): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const user = await getAppUser();
  if (!user || user.isDemo) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Profile;
}
