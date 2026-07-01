import { VerifyClient } from '@/components/verify/VerifyClient';

export const dynamic = 'force-dynamic';

export default function VerifyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verify</h1>
        <p className="text-muted-foreground">
          Turn a candidate&apos;s real proof into an evidence-backed competence score and a
          <strong> safe-to-refer brief</strong> — so an employee will vouch for them.
        </p>
      </div>
      <VerifyClient />
    </div>
  );
}
