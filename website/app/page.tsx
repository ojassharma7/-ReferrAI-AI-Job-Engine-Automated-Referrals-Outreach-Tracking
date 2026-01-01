'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/search/SearchForm';
import { ResultsDashboard } from '@/components/results/ResultsDashboard';
import { SearchRequest, SearchResult } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<string>('');

  const handleSearch = async (request: SearchRequest) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw new Error(errorData.error || `Search failed (${response.status})`);
      }

      const data = await response.json();
      console.log('🔍 Full API Response:', data);
      console.log('Search response received:', {
        company: data.company?.name,
        recruiters: data.recruiters?.length || 0,
        domainEmployees: data.domainEmployees?.length || 0,
        jobs: data.jobs?.length || 0,
        totalContacts: data.totalContacts || 0,
      });
      
      // Log detailed breakdown
      if (data.recruiters) {
        console.log('Recruiters array:', data.recruiters);
      }
      if (data.domainEmployees) {
        console.log('Domain employees array:', data.domainEmployees);
      }
      
      setResults(data);
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Search error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            ReferrAI
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover contacts, find jobs, and automate your referral outreach
          </p>
        </div>

        {/* Search Form */}
        <div className="mb-8">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Candidate Profile Input (optional, for AI generation) */}
        {results && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="candidateProfile" className="text-sm font-medium">
                  Your Profile (Optional - for AI-generated emails/resumes)
                </Label>
                <Textarea
                  id="candidateProfile"
                  placeholder="Describe your background, experience, and relevant skills. This helps AI generate better personalized content..."
                  value={candidateProfile}
                  onChange={(e) => setCandidateProfile(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This information is used to personalize AI-generated resumes, cover letters, and emails. It's stored locally and not sent anywhere except to generate content.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {results && <ResultsDashboard results={results} candidateProfile={candidateProfile} />}

        {/* Empty State */}
        {!results && !isLoading && !error && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Enter a company name and job role to discover contacts and job openings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
