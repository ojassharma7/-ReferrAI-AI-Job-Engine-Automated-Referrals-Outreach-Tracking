import { getAppUser } from '@/lib/auth';
import { listSequences } from '@/lib/db/sequences';
import { SequencesList } from '@/components/dashboard/SequencesList';

export const dynamic = 'force-dynamic';

export default async function OutreachPage() {
  const user = await getAppUser();
  const sequences = user ? await listSequences(user) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Outreach</h1>
        <p className="text-muted-foreground">
          Multi-step referral sequences that follow up for you — and stop the
          moment someone replies.
        </p>
      </div>
      <SequencesList initial={sequences} isDemo={!!user?.isDemo} />
    </div>
  );
}
