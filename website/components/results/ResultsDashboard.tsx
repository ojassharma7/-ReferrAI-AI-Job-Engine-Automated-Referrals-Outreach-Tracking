'use client';

import { useState } from 'react';
import { SearchResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ResumeGenerator } from '@/components/generate/ResumeGenerator';
import { CoverLetterGenerator } from '@/components/generate/CoverLetterGenerator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Users, Briefcase, FileText, Mail, Sparkles, Plus, Check, Loader2 } from 'lucide-react';

interface ResultsDashboardProps {
  results: SearchResult;
  candidateProfile?: string;
}

export function ResultsDashboard({ results, candidateProfile }: ResultsDashboardProps) {
  const [selectedJob, setSelectedJob] = useState<typeof results.jobs[0] | null>(null);
  const [isResumeDialogOpen, setIsResumeDialogOpen] = useState(false);
  const [isCoverLetterDialogOpen, setIsCoverLetterDialogOpen] = useState(false);
  const [pipelineState, setPipelineState] = useState<Record<string, 'idle' | 'adding' | 'added'>>({});

  const addToPipeline = async (job: typeof results.jobs[0]) => {
    setPipelineState((s) => ({ ...s, [job.id]: 'adding' }));
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobExternalId: job.id,
          jobTitle: job.title,
          company: results.company.name,
          jobLocation: job.location,
          jdText: job.jd_text,
          jdUrl: job.jd_url,
          jobSource: job.source,
        }),
      });
      setPipelineState((s) => ({ ...s, [job.id]: res.ok ? 'added' : 'idle' }));
    } catch {
      setPipelineState((s) => ({ ...s, [job.id]: 'idle' }));
    }
  };

  // Get job title and company from first job or use defaults
  const jobTitle = selectedJob?.title || results.jobs[0]?.title || '';
  const company = results.company.name;
  const jobDescription = selectedJob?.jd_text || results.jobs[0]?.jd_text || '';

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{results.company.name}</CardTitle>
              <CardDescription className="mt-1">
                {results.company.domain} • {results.company.industry}
                {results.company.location && ` • ${results.company.location}`}
              </CardDescription>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-2xl font-bold">{results.totalContacts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recruiters</p>
              <p className="text-2xl font-bold">{results.recruiters.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Domain Employees</p>
              <p className="text-2xl font-bold">{results.domainEmployees.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Job Openings</p>
              <p className="text-2xl font-bold">{results.totalJobs}</p>
            </div>
            {jobTitle && (
              <div className="flex gap-2 items-end">
                <Dialog open={isResumeDialogOpen} onOpenChange={setIsResumeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Resume
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Resume Generator</DialogTitle>
                      <DialogDescription>
                        Customize your resume for {jobTitle} at {company}
                      </DialogDescription>
                    </DialogHeader>
                    <ResumeGenerator
                      jobTitle={jobTitle}
                      company={company}
                      jobDescription={jobDescription}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={isCoverLetterDialogOpen} onOpenChange={setIsCoverLetterDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Mail className="mr-2 h-4 w-4" />
                      Generate Cover Letter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Cover Letter Generator</DialogTitle>
                      <DialogDescription>
                        Generate a personalized cover letter for {jobTitle} at {company}
                      </DialogDescription>
                    </DialogHeader>
                    <CoverLetterGenerator
                      jobTitle={jobTitle}
                      company={company}
                      jobDescription={jobDescription}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs defaultValue="recruiters" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recruiters">
            <Users className="mr-2 h-4 w-4" />
            Recruiters ({results.recruiters.length})
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="mr-2 h-4 w-4" />
            Domain Employees ({results.domainEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <Briefcase className="mr-2 h-4 w-4" />
            Jobs ({results.totalJobs})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recruiters" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recruiters &amp; talent/HR who can route a referral.
            </span>
            <a
              href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
                `recruiter ${company}`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
            >
              Find {company} recruiters on LinkedIn →
            </a>
          </div>
          {results.recruiters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recruiters found in Hunter for this company — try the LinkedIn link above.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.recruiters.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  jobTitle={jobTitle}
                  company={company}
                  candidateProfile={candidateProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          {results.domainEmployees.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No domain-specific employees found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.domainEmployees.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  jobTitle={jobTitle}
                  company={company}
                  candidateProfile={candidateProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {results.jobsMock
                ? 'Showing demo jobs — add ADZUNA_APP_ID / ADZUNA_APP_KEY for live postings.'
                : 'Live openings via Adzuna — coverage varies by company, so also check LinkedIn for the full list.'}
            </span>
            <a
              href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                `${jobTitle ? jobTitle + ' ' : ''}${company}`.trim(),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
            >
              See all {company} openings on LinkedIn →
            </a>
          </div>
          {results.jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="mb-2">No job openings found for this company and role.</p>
                <p className="text-xs">
                  {process.env.JSEARCH_API_KEY 
                    ? 'Try adjusting your search terms or check back later.'
                    : 'Job search requires JSEARCH_API_KEY. Add it to your .env file to enable job search.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.jobs.map((job) => (
                <Card
                  key={job.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{job.location}</span>
                          {job.job_type && (
                            <>
                              <span>•</span>
                              <span>{job.job_type}</span>
                            </>
                          )}
                          {job.posted_at && (
                            <>
                              <span>•</span>
                              <span className="text-xs">
                                {new Date(job.posted_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {job.source}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {job.jd_text}
                    </p>
                    <div className="flex items-center gap-2">
                      {job.jd_url && (
                        <a
                          href={job.jd_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Job & Apply →
                        </a>
                      )}
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pipelineState[job.id] === 'adding' || pipelineState[job.id] === 'added'}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToPipeline(job);
                          }}
                        >
                          {pipelineState[job.id] === 'added' ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Added
                            </>
                          ) : pipelineState[job.id] === 'adding' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding…
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add to pipeline
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            setIsResumeDialogOpen(true);
                          }}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

