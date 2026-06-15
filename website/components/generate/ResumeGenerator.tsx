'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Download, FileCode, Info } from 'lucide-react';

interface ResumeGeneratorProps {
  jobTitle: string;
  company: string;
  jobDescription?: string;
}

interface MatchReport {
  score: number;
  matched: string[];
  missing: string[];
  notes?: string;
}

interface GenerateResult {
  tex: string;
  pdfBase64: string | null;
  pdfAvailable: boolean;
  pdfError?: string | null;
  matchReport: MatchReport;
  templateId: string;
  isMock: boolean;
  warning?: string;
}

const TEMPLATE_OPTIONS = [
  { id: 'modern', label: 'Modern — slate accent' },
  { id: 'compact', label: 'Compact — fits more on a page' },
];

function base64ToBlob(b64: string, type = 'application/pdf'): Blob {
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type });
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ResumeGenerator({ jobTitle, company, jobDescription }: ResumeGeneratorProps) {
  const [baseResume, setBaseResume] = useState('');
  const [keywords, setKeywords] = useState('');
  const [templateId, setTemplateId] = useState('modern');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build (and clean up) an object URL for the PDF preview.
  useEffect(() => {
    if (!result?.pdfBase64) {
      setPdfUrl(null);
      return;
    }
    const url = URL.createObjectURL(base64ToBlob(result.pdfBase64));
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result?.pdfBase64]);

  const fileStem = `resume-${company}-${jobTitle}`.replace(/[^a-z0-9]+/gi, '-');

  const handleGenerate = async () => {
    if (!baseResume.trim()) {
      setError('Please paste your base resume first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseResume,
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
          template: templateId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate resume');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume engine
        </CardTitle>
        <CardDescription>
          Tailored for {jobTitle} at {company}. Your content, a fixed template — the
          formatting never breaks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseResume">Your base resume</Label>
          <Textarea
            id="baseResume"
            placeholder="Paste your current resume here (any format — the AI structures it)..."
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="keywords">Priority keywords (optional)</Label>
            <Input
              id="keywords"
              placeholder="Python, Machine Learning, SQL"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <select
              id="template"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {TEMPLATE_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isLoading || !baseResume.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Tailoring &amp; compiling…
            </>
          ) : (
            'Generate tailored resume'
          )}
        </Button>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            {(result.isMock || result.warning) && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {result.warning ||
                    'Demo mode — add GEMINI_API_KEY for real AI tailoring. The PDF below is really compiled from your input.'}
                </span>
              </div>
            )}

            <MatchReportPanel report={result.matchReport} />

            <div className="flex flex-wrap gap-2">
              {result.pdfBase64 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download(base64ToBlob(result.pdfBase64!), `${fileStem}.pdf`)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  download(new Blob([result.tex], { type: 'application/x-tex' }), `${fileStem}.tex`)
                }
              >
                <FileCode className="mr-2 h-4 w-4" />
                Download .tex
              </Button>
            </div>

            {pdfUrl ? (
              <iframe
                title="Resume preview"
                src={pdfUrl}
                className="h-[600px] w-full rounded-md border"
              />
            ) : (
              <div className="rounded-md border bg-gray-50 p-4 text-sm text-muted-foreground">
                {result.pdfAvailable
                  ? 'PDF compilation failed for this input. Download the .tex above and compile on Overleaf.'
                  : 'No LaTeX engine in this environment, so no PDF was compiled. Download the .tex above and open it on Overleaf — the formatting is identical.'}
                {result.pdfError && (
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-red-600">
                    {result.pdfError}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MatchReportPanel({ report }: { report: MatchReport }) {
  if (!report) return null;
  const score = Math.round(report.score ?? 0);
  const color = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">JD match</span>
        <span className={`text-2xl font-bold ${color}`}>{score}%</span>
      </div>
      {report.matched?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Matched keywords</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {report.matched.map((k) => (
              <span key={k} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
      {report.missing?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Missing — consider adding</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {report.missing.map((k) => (
              <span key={k} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
      {report.notes && <p className="mt-3 text-xs text-muted-foreground">{report.notes}</p>}
    </div>
  );
}
