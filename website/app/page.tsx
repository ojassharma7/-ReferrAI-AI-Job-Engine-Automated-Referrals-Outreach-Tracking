import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { Search, FileText, Send, KanbanSquare, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Find the right people',
    desc: 'Search any company and role to surface recruiters and employees in that exact position — with verified email, LinkedIn, and phone where available.',
  },
  {
    icon: FileText,
    title: 'Format-locked resumes',
    desc: 'Paste a job description and get a resume tailored to it, built from your LaTeX template so the formatting never breaks. Plus an AI cover letter.',
  },
  {
    icon: Send,
    title: 'Warm referral outreach',
    desc: 'Generate concise, personalized referral emails and send them from your own inbox — referral-first, not just another application.',
  },
  {
    icon: KanbanSquare,
    title: 'Track every reply',
    desc: 'A pipeline from saved to offer, with reply detection and follow-ups so nothing slips through the cracks.',
  },
];

export default function LandingPage() {
  const authed = isSupabaseConfigured();
  const primaryHref = authed ? '/register' : '/dashboard';

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="container mx-auto flex h-16 items-center justify-between px-4">
        <span className="text-lg font-bold tracking-tight">ReferrAI</span>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/pricing">Pricing</Link>
          </Button>
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/dashboard">Open app</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight">
          Land the interview through a referral, not the resume black hole.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-muted-foreground">
          ReferrAI finds the right person at any company, tailors your resume and cover
          letter to the job, and sends a personalized referral request — all in one flow.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link href={primaryHref}>
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </section>

      <section className="container mx-auto grid grid-cols-1 gap-6 px-4 pb-24 md:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border bg-card p-6 shadow-sm">
            <Icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="mb-1 text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
