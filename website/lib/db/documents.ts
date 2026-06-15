// Persist generated resumes / cover letters. Best-effort; no-op in demo mode.
import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface SaveDocumentInput {
  type: 'resume' | 'cover_letter';
  text_content?: string;
  latex_source?: string;
  pdf_path?: string;
  job_external_id?: string;
}

export async function saveDocument(
  user: AppUser,
  input: SaveDocumentInput,
): Promise<string | null> {
  if (!isSupabaseConfigured() || user.isDemo) return null;

  try {
    const supabase = await createClient();

    let jobId: string | null = null;
    if (input.job_external_id) {
      const { data } = await supabase
        .from('jobs')
        .select('id')
        .eq('user_id', user.id)
        .eq('external_id', input.job_external_id)
        .maybeSingle();
      jobId = data?.id ?? null;
    }

    const { data } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        job_id: jobId,
        type: input.type,
        text_content: input.text_content ?? null,
        latex_source: input.latex_source ?? null,
        pdf_path: input.pdf_path ?? null,
      })
      .select('id')
      .single();

    return data?.id ?? null;
  } catch (err) {
    console.warn('saveDocument failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
