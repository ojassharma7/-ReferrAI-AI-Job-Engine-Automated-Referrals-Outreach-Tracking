'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  ShieldCheck,
  Github,
  Star,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { VerifiedAssessment, SafeToReferBrief } from '@/lib/verify/schema';
import type { GitHubEvidence } from '@/lib/verify/github';

interface VerifyResponse {
  assessment: VerifiedAssessment;
  brief: SafeToReferBrief | null;
  github: GitHubEvidence;
  isMock: boolean;
}

const VERDICT: Record<string, { label: string; cls: string }> = {
  strong: { label: 'Safe to refer', cls: 'bg-green-100 text-green-800 border-green-200' },
  moderate: { label: 'Refer with a quick check', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  weak: { label: 'Not yet — needs more signal', cls: 'bg-red-100 text-red-700 border-red-200' },
};

export function VerifyClient() {
  const [form, setForm] = useState({
    name: '',
    githubUsername: '',
    portfolioUrl: '',
    highlights: '',
    jdText: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<VerifyResponse | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Verification failed');
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const score = data?.assessment.competenceScore ?? 0;
  const scoreColor = score >= 78 ? 'text-green-600' : score >= 55 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" /> Verify a candidate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={set('name')} placeholder="Ada Lovelace" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gh">GitHub username</Label>
            <Input id="gh" value={form.githubUsername} onChange={set('githubUsername')} placeholder="e.g. gaearon" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf">Portfolio / site (optional)</Label>
            <Input id="pf" value={form.portfolioUrl} onChange={set('portfolioUrl')} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hl">Highlights (impact, experience)</Label>
            <Textarea id="hl" rows={3} value={form.highlights} onChange={set('highlights')} placeholder="Shipped X to 1M users; led team of 4; 30% latency win…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd">Target job description (for the referral brief)</Label>
            <Textarea id="jd" rows={4} value={form.jdText} onChange={set('jdText')} placeholder="Paste the JD to generate a safe-to-refer brief…" />
          </div>
          <Button className="w-full" onClick={run} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {loading ? 'Verifying…' : 'Verify & generate brief'}
          </Button>
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {/* Output */}
      <div className="space-y-6">
        {!data && !loading && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <ShieldCheck className="h-10 w-10" />
              <p className="max-w-xs text-sm">
                Enter a GitHub + a JD and we&apos;ll produce an evidence-backed competence
                score and a <strong>&ldquo;safe-to-refer&rdquo;</strong> brief — the thing that makes an
                employee comfortable vouching for a stranger.
              </p>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            {/* Verified profile */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600" /> Verified profile</span>
                  <span className={`text-3xl font-bold ${scoreColor}`}>{score}<span className="text-base text-muted-foreground">/100</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{data.assessment.summary}</p>

                {data.assessment.verifiedSignals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {data.assessment.verifiedSignals.map((s, i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{s}</span>
                    ))}
                  </div>
                )}

                {data.github.found && data.github.topRepos && data.github.topRepos.length > 0 && (
                  <div className="rounded-md border p-2">
                    <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground"><Github className="h-3.5 w-3.5" /> Evidence (public GitHub)</p>
                    <ul className="space-y-1">
                      {data.github.topRepos.map((r) => (
                        <li key={r.name} className="flex items-center justify-between text-xs">
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{r.name}</a>
                          <span className="flex items-center gap-1 text-muted-foreground"><Star className="h-3 w-3" />{r.stars}{r.language ? ` · ${r.language}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.assessment.strengths.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium">Strengths</p>
                    <ul className="space-y-0.5">
                      {data.assessment.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {data.assessment.gaps.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium">Gaps / unknowns</p>
                    <ul className="space-y-0.5">
                      {data.assessment.gaps.map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-muted-foreground"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safe-to-refer brief — the differentiator */}
            {data.brief && (
              <Card className="border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Safe-to-refer brief</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${VERDICT[data.brief.verdict]?.cls}`}>
                      {VERDICT[data.brief.verdict]?.label} · {data.brief.matchScore}% match
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-medium">{data.brief.headline}</p>
                  {data.brief.reasons.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Why your reputation is protected</p>
                      <ul className="space-y-0.5">
                        {data.brief.reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {data.brief.proofPoints.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {data.brief.proofPoints.map((p, i) => (
                        <span key={i} className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">{p}</span>
                      ))}
                    </div>
                  )}
                  {data.brief.watchouts.length > 0 && (
                    <p className="text-xs text-amber-700">Watch-outs: {data.brief.watchouts.join('; ')}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {data.isMock && (
              <p className="text-center text-xs text-muted-foreground">Demo assessment (add GEMINI_API_KEY for the full AI read). GitHub evidence is live.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
