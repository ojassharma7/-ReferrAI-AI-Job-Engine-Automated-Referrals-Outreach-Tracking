'use client';

import { useState } from 'react';
import {
  APPLICATION_STATUSES,
  STATUS_META,
  type ApplicationCard,
  type ApplicationStatus,
} from '@/lib/pipeline/constants';
import { Building2, Trash2, User, Info } from 'lucide-react';

export function PipelineBoard({
  initial,
  isDemo,
}: {
  initial: ApplicationCard[];
  isDemo: boolean;
}) {
  const [cards, setCards] = useState<ApplicationCard[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const byStatus = (s: ApplicationStatus) => cards.filter((c) => c.status === s);

  async function move(id: string, status: ApplicationStatus) {
    const prev = cards;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status } : c)));
    setBusy(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) setCards(prev); // revert on failure
    } catch {
      setCards(prev);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    const prev = cards;
    setCards((cs) => cs.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) setCards(prev);
    } catch {
      setCards(prev);
    }
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Demo board with sample data. Connect Supabase to save your real
            pipeline — moves and deletes here won&apos;t persist on reload.
          </span>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="rounded-md border py-16 text-center text-muted-foreground">
          No applications yet. Run a search and click “Add to pipeline” on a job.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {APPLICATION_STATUSES.map((status) => {
            const col = byStatus(status);
            const meta = STATUS_META[status];
            return (
              <div key={status} className="w-72 shrink-0">
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className="text-xs text-muted-foreground">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((card) => (
                    <PipelineCardView
                      key={card.id}
                      card={card}
                      busy={busy === card.id}
                      onMove={move}
                      onRemove={remove}
                    />
                  ))}
                  {col.length === 0 && (
                    <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PipelineCardView({
  card,
  busy,
  onMove,
  onRemove,
}: {
  card: ApplicationCard;
  busy: boolean;
  onMove: (id: string, status: ApplicationStatus) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className={`rounded-md border bg-card p-3 shadow-sm ${busy ? 'opacity-60' : ''}`}>
      <p className="text-sm font-medium leading-snug">{card.job?.title || 'Untitled role'}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Building2 className="h-3 w-3" />
        {card.job?.company || 'Unknown company'}
        {card.job?.location ? ` · ${card.job.location}` : ''}
      </p>
      {card.contact?.full_name && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {card.contact.full_name}
          {card.contact.title ? ` — ${card.contact.title}` : ''}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <select
          aria-label="Move to status"
          value={card.status}
          onChange={(e) => onMove(card.id, e.target.value as ApplicationStatus)}
          className="h-7 flex-1 rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <button
          aria-label="Delete"
          onClick={() => onRemove(card.id)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
