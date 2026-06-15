import { getProfile } from '@/lib/db/profiles';
import { SettingsForm } from '@/components/app/SettingsForm';

export default async function SettingsPage() {
  const profile = await getProfile();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Your master profile powers AI-tailored resumes, cover letters, and emails.
        </p>
      </div>
      <SettingsForm
        initial={{
          full_name: profile?.full_name ?? '',
          headline: profile?.headline ?? '',
          candidate_profile: profile?.candidate_profile ?? '',
          base_resume_text: profile?.base_resume_text ?? '',
        }}
      />
    </div>
  );
}
