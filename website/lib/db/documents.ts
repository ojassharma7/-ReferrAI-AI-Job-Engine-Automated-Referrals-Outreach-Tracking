// Persist generated resumes / cover letters. Best-effort; no-op in demo mode.
import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface SaveDocumentInput {
  type: 'resume' | 'cover_letter';
  text_content?: string;
  latex_source?: string;
  pdf_path?: string | null;
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

const BUCKET = 'documents';

// Upload a generated PDF to the private per-user storage bucket. Returns the
// object path (e.g. "<uid>/resume-123.pdf") or null in demo / no-Supabase mode.
export async function uploadResumePdf(
  user: AppUser,
  pdf: Buffer,
  filename: string,
): Promise<string | null> {
  if (!isSupabaseConfigured() || user.isDemo) return null;
  try {
    const path = `${user.id}/${filename}`;
    const supabase = await createClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdf, { contentType: 'application/pdf', upsert: true });
    if (error) {
      console.warn('uploadResumePdf failed:', error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.warn('uploadResumePdf failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

export interface DocumentRow {
  id: string;
  type: 'resume' | 'cover_letter';
  created_at: string;
  pdf_path: string | null;
  text_content: string | null;
  job_id: string | null;
}

// List a user's saved documents (most recent first). Empty in demo mode.
export async function listDocuments(user: AppUser): Promise<DocumentRow[]> {
  if (!isSupabaseConfigured() || user.isDemo) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('documents')
      .select('id,type,created_at,pdf_path,text_content,job_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    return (data as DocumentRow[]) ?? [];
  } catch (err) {
    console.warn('listDocuments failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

// Fetch a single document the user owns (RLS-scoped). Null in demo mode.
export async function getDocument(
  user: AppUser,
  id: string,
): Promise<{
  pdf_path: string | null;
  latex_source: string | null;
  text_content: string | null;
  type: 'resume' | 'cover_letter';
} | null> {
  if (!isSupabaseConfigured() || user.isDemo) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('documents')
      .select('pdf_path,latex_source,text_content,type')
      .eq('user_id', user.id)
      .eq('id', id)
      .maybeSingle();
    return data ?? null;
  } catch (err) {
    console.warn('getDocument failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// Short-lived signed URL so the browser can download a private PDF.
export async function getDocumentSignedUrl(
  user: AppUser,
  path: string | null,
  expiresInSeconds = 600,
): Promise<string | null> {
  if (!path || !isSupabaseConfigured() || user.isDemo) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);
    return data?.signedUrl ?? null;
  } catch (err) {
    console.warn('getDocumentSignedUrl failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
