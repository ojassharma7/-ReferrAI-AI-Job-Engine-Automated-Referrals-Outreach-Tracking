'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchForm } from '@/components/search/SearchForm';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { SearchRequest, SearchResult } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, FlaskConical, Lock } from 'lucide-react';

export function DashboardClient() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<string>('');

  const handleSearch = async (request: SearchRequest) => {
    setIsLoading(true);
    setError(null);
    setLimitReached(false);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (response.status === 402) {
        setLimitReached(true);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Search failed (${response.status})`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Find your referral</h1>
        <p className="text-muted-foreground">
          Search a company and role to discover the right people and openings.
        </p>
      </div>

      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {results?.isMock && (
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <FlaskConical className="h-4 w-4 shrink-0" />
          <span>
            Showing <strong>demo data</strong>. Add your API keys in{' '}
            <code className="rounded bg-amber-100 px-1">website/.env.local</code> for live
            results.
          </span>
        </div>
      )}

      {limitReached && (
        <Card className="mx-auto max-w-2xl border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <Lock className="h-5 w-5 shrink-0" />
              <p className="text-sm">
                You&apos;ve hit your plan&apos;s limit for this period. Upgrade to keep
                searching.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/billing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="mx-auto max-w-2xl">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="candidateProfile" className="text-sm font-medium">
                Your Profile (used to personalize AI emails, resumes & cover letters)
              </Label>
              <Textarea
                id="candidateProfile"
                placeholder="Describe your background, experience, and relevant skills..."
                value={candidateProfile}
                onChange={(e) => setCandidateProfile(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mx-auto max-w-2xl border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <ResultsDashboard results={results} candidateProfile={candidateProfile} />
      )}
    </div>
  );
}
