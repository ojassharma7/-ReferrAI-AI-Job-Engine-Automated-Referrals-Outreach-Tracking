import { getAppUser } from '@/lib/auth';
import { listApplications } from '@/lib/db/applications';
import { PipelineBoard } from '@/components/dashboard/PipelineBoard';

export const dynamic = 'force-dynamic';

export default async function PipelinePage() {
  const user = await getAppUser();
  const applications = user ? await listApplications(user) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Track every application from saved to offer.
        </p>
      </div>
      <PipelineBoard initial={applications} isDemo={!!user?.isDemo} />
    </div>
  );
}
