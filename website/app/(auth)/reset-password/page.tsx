import { redirect } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Note: no "redirect if logged in" guard here — the recovery link creates a
// temporary session, and the user needs to reach this page to set a new password.
export default function ResetPasswordPage() {
  if (!isSupabaseConfigured()) redirect('/login');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm />
      </CardContent>
    </Card>
  );
}
