import { Card, CardContent } from '@/components/ui/card';
import { KanbanSquare } from 'lucide-react';

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground">
          Track every application from saved to offer.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <KanbanSquare className="h-10 w-10" />
          <p className="max-w-sm">
            Your kanban board (saved → contacted → replied → referred → interview)
            arrives in Phase 5. Searches and outreach you run now are already saved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
