'use client';

import { SearchResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactCard } from '@/components/contacts/ContactCard';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Briefcase } from 'lucide-react';

interface ResultsDashboardProps {
  results: SearchResult;
}

export function ResultsDashboard({ results }: ResultsDashboardProps) {
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
          <div className="flex gap-4">
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
          {results.recruiters.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No recruiters found for this company.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.recruiters.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
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
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {results.jobs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No job openings found. Job search integration coming soon!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {results.jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>
                      {job.location} • {job.job_type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{job.jd_text}</p>
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

