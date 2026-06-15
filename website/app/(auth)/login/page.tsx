import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAppUser } from '@/lib/auth';

export default async function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <DemoModeNotice />;
  }
  const user = await getAppUser();
  if (user && !user.isDemo) redirect('/dashboard');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </CardContent>
    </Card>
  );
}

function DemoModeNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Demo mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Accounts are disabled because Supabase isn&apos;t configured yet. The app
          is running in single-user demo mode — you can explore everything without
          signing in.
        </p>
        <p>
          Add <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
          and{' '}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
          to <code className="rounded bg-muted px-1">website/.env.local</code> to
          enable real accounts.
        </p>
        <Link href="/dashboard" className="font-medium text-primary hover:underline">
          Go to the dashboard →
        </Link>
      </CardContent>
    </Card>
  );
}
