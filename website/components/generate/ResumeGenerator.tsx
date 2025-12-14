'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Download } from 'lucide-react';

interface ResumeGeneratorProps {
  jobTitle: string;
  company: string;
  jobDescription?: string;
}

export function ResumeGenerator({ jobTitle, company, jobDescription }: ResumeGeneratorProps) {
  const [baseResume, setBaseResume] = useState('');
  const [keywords, setKeywords] = useState('');
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!baseResume.trim()) {
      setError('Please enter your base resume');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedResume(null);

    try {
      const response = await fetch('/api/generate/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseResume,
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate resume');
      }

      const data = await response.json();
      setGeneratedResume(data.resume);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Resume generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedResume) return;
    
    const blob = new Blob([generatedResume], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume-${company}-${jobTitle.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Generator
        </CardTitle>
        <CardDescription>
          Customize your resume for {jobTitle} at {company}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseResume">Your Base Resume</Label>
          <Textarea
            id="baseResume"
            placeholder="Paste your current resume here..."
            value={baseResume}
            onChange={(e) => setBaseResume(e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords (comma-separated, optional)</Label>
          <Input
            id="keywords"
            placeholder="e.g., Python, Machine Learning, Data Science"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !baseResume.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Customized Resume'
          )}
        </Button>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {generatedResume && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Resume</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
            <div className="rounded-md border bg-gray-50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{generatedResume}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

