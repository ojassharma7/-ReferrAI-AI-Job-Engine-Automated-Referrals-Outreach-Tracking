import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { getAppUser } from '@/lib/auth';

export default async function RegisterPage() {
  if (!isSupabaseConfigured()) {
    redirect('/login');
  }
  const user = await getAppUser();
  if (user && !user.isDemo) redirect('/dashboard');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <AuthForm mode="register" />
        </Suspense>
      </CardContent>
    </Card>
  );
}
