import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, FileCode } from 'lucide-react';
import { getAppUser } from '@/lib/auth';
import { listDocuments } from '@/lib/db/documents';

export const dynamic = 'force-dynamic';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function DocumentsPage() {
  const user = await getAppUser();
  const documents = user ? await listDocuments(user) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Tailored resumes and cover letters you&apos;ve generated.
        </p>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <FileText className="h-10 w-10" />
            <p className="max-w-sm">
              {user?.isDemo
                ? 'Demo mode — generated documents are not saved. Connect Supabase to keep a history here. You can still generate and download resumes from the dashboard.'
                : 'No documents yet. Generate a tailored resume from the dashboard and it will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {doc.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {doc.pdf_path && (
                    <Button asChild variant="outline" size="sm">
                      <a href={`/api/documents/${doc.id}/download`}>
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <a href={`/api/documents/${doc.id}/download?format=tex`}>
                      <FileCode className="mr-2 h-4 w-4" />
                      .tex
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
