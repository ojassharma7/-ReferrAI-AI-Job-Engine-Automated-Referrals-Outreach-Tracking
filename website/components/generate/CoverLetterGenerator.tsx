'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Download } from 'lucide-react';

interface CoverLetterGeneratorProps {
  jobTitle: string;
  company: string;
  jobDescription?: string;
  contactName?: string;
}

export function CoverLetterGenerator({ jobTitle, company, jobDescription, contactName }: CoverLetterGeneratorProps) {
  const [candidateProfile, setCandidateProfile] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!candidateProfile.trim()) {
      setError('Please enter your candidate profile');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCoverLetter(null);

    try {
      const response = await fetch('/api/generate/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateProfile,
          jobTitle,
          company,
          jobDescription: jobDescription || '',
          contactName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setGeneratedCoverLetter(data.coverLetter);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Cover letter generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedCoverLetter) return;
    
    const blob = new Blob([generatedCoverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${company}-${jobTitle.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Cover Letter Generator
        </CardTitle>
        <CardDescription>
          Generate a personalized cover letter for {jobTitle} at {company}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="candidateProfile">Your Profile / Experience</Label>
          <Textarea
            id="candidateProfile"
            placeholder="Describe your background, experience, and relevant skills..."
            value={candidateProfile}
            onChange={(e) => setCandidateProfile(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isLoading || !candidateProfile.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Cover Letter'
          )}
        </Button>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {generatedCoverLetter && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Generated Cover Letter</Label>
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
              <pre className="whitespace-pre-wrap text-sm">{generatedCoverLetter}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

