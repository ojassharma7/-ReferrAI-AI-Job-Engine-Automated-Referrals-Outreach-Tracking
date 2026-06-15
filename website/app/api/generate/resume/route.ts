// API Route: Generate a tailored, format-locked LaTeX resume (+ compiled PDF).
//
// Pipeline: tailor (AI -> structured ResumeData) -> render (fixed LaTeX
// template) -> compile (pdflatex) -> store (Supabase storage + documents row).
//
// Runs on the Node.js runtime because PDF compilation shells out to a TeX
// engine via child_process.

import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { enforceLimit, recordUsage } from '@/lib/usage';
import { saveDocument, uploadResumePdf } from '@/lib/db/documents';
import { tailorResume } from '@/lib/resume/tailor';
import {
  renderResumeLatex,
  renderResumeText,
  TEMPLATES,
  DEFAULT_TEMPLATE,
} from '@/lib/resume/latex';
import { compileLatex } from '@/lib/resume/compile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await getAppUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const limit = await enforceLimit(user, 'generate');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: limit.message, code: 'limit_reached' },
        { status: 402 },
      );
    }

    const body = await request.json();
    const {
      baseResume,
      jobTitle,
      company,
      jobDescription,
      keywords,
      jobId,
      template,
    } = body;

    if (!baseResume || !jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: baseResume, jobTitle, company, jobDescription',
        },
        { status: 400 },
      );
    }

    const templateId = template && TEMPLATES[template] ? template : DEFAULT_TEMPLATE;

    // 1. AI tailoring -> structured ResumeData (+ keyword match report).
    const { result, isMock, warning } = await tailorResume({
      baseResume,
      jobTitle,
      company,
      jobDescription,
      keywords: Array.isArray(keywords) ? keywords : undefined,
    });

    // 2. Render the fixed LaTeX template + a plain-text version.
    const tex = renderResumeLatex(result.resume, templateId);
    const text = renderResumeText(result.resume);

    // 3. Compile to PDF (graceful: null if no TeX toolchain present).
    const compiled = await compileLatex(tex);
    const pdfBase64 = compiled.pdf ? compiled.pdf.toString('base64') : null;

    // 4. Persist: upload PDF to storage, save a documents row (best-effort).
    let pdfPath: string | null = null;
    if (compiled.pdf) {
      const safeCompany = String(company)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40);
      pdfPath = await uploadResumePdf(
        user,
        compiled.pdf,
        `resume-${safeCompany || 'job'}-${Date.now()}.pdf`,
      );
    }

    const documentId = await saveDocument(user, {
      type: 'resume',
      text_content: text,
      latex_source: tex,
      pdf_path: pdfPath,
      job_external_id: jobId,
    });

    await recordUsage(user, 'generate');

    return NextResponse.json({
      success: true,
      resumeData: result.resume,
      matchReport: result.match,
      tex,
      pdfBase64,
      pdfAvailable: compiled.available,
      pdfError: compiled.pdf ? null : compiled.log,
      templateId,
      isMock,
      warning,
      documentId,
      // Backward-compatible plain-text field.
      resume: text,
    });
  } catch (error: any) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate resume' },
      { status: 500 },
    );
  }
}
