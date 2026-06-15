// Download a saved document: PDF (default, via short-lived signed URL) or .tex.
import { NextRequest, NextResponse } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { getDocument, getDocumentSignedUrl } from '@/lib/db/documents';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocument(user, id);
  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const format = request.nextUrl.searchParams.get('format');

  if (format === 'tex') {
    if (!doc.latex_source) {
      return NextResponse.json({ error: 'No LaTeX source' }, { status: 404 });
    }
    return new NextResponse(doc.latex_source, {
      headers: {
        'Content-Type': 'application/x-tex; charset=utf-8',
        'Content-Disposition': `attachment; filename="resume-${id}.tex"`,
      },
    });
  }

  if (doc.pdf_path) {
    const signed = await getDocumentSignedUrl(user, doc.pdf_path);
    if (signed) return NextResponse.redirect(signed);
  }

  return NextResponse.json(
    { error: 'No PDF available for this document' },
    { status: 404 },
  );
}
