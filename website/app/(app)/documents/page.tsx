import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Resumes and cover letters you&apos;ve generated.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <FileText className="h-10 w-10" />
          <p className="max-w-sm">
            Generated documents will be saved here. The format-preserving LaTeX
            resume engine lands in Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
