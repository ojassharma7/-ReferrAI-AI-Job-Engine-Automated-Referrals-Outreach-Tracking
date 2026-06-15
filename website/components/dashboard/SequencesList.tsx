'use client';

import { useState } from 'react';
import {
  SEQ_STATUS_META,
  STEP_STATUS_META,
  type SequenceView,
  type SequenceStatus,
} from '@/lib/outreach/constants';
import { Button } from '@/components/ui/button';
import { Building2, User, Info, CheckCircle2, XCircle } from 'lucide-react';

function when(step: { status: string; scheduled_for: string | null; sent_at: string | null }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (step.status === 'sent' && step.sent_at) return `Sent ${fmt(step.sent_at)}`;
  if (step.status === 'skipped') return 'Skipped';
  if (step.scheduled_for) {
    const days = Math.round((new Date(step.scheduled_for).getTime() - Date.now()) / 86_400_000);
    if (days <= 0) return 'Due now';
    return `In ${days} day${days === 1 ? '' : 's'}`;
  }
  return 'Scheduled';
}

export function SequencesList({
  initial,
  isDemo,
}: {
  initial: SequenceView[];
  isDemo: boolean;
}) {
  const [seqs, setSeqs] = useState<SequenceView[]>(initial);

  async function setStatus(id: string, action: 'replied' | 'stop') {
    const prev = seqs;
    const newStatus: SequenceStatus = action === 'replied' ? 'replied' : 'stopped';
    setSeqs((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              status: newStatus,
              steps: s.steps.map((st) =>
                st.status === 'pending' ? { ...st, status: 'skipped' } : st,
              ),
            }
          : s,
      ),
    );
    try {
      const res = await fetch(`/api/sequences/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) setSeqs(prev);
    } catch {
      setSeqs(prev);
    }
  }

  if (seqs.length === 0) {
    return (
      <div className="rounded-md border py-16 text-center text-muted-foreground">
        No sequences yet. Open a contact from a search and click “Start sequence”.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isDemo && (
        <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Demo sequences with sample data. Connect Supabase to save real ones,
            and point a scheduler at <code>/api/sequences/cron</code> to send due
            follow-ups automatically (auto-stops when a contact replies).
          </span>
        </div>
      )}

      {seqs.map((seq) => {
        const meta = SEQ_STATUS_META[seq.status];
        return (
          <div key={seq.id} className="rounded-md border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {seq.contact_name || 'Unknown contact'}
                  {seq.contact_title ? (
                    <span className="font-normal text-muted-foreground">
                      — {seq.contact_title}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {seq.job_title || 'Role'} @ {seq.company || 'Company'}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                {meta.label}
              </span>
            </div>

            <ol className="mt-3 space-y-2 border-l pl-4">
              {seq.steps.map((step) => {
                const sm = STEP_STATUS_META[step.status];
                return (
                  <li key={step.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-border" />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium">
                        Step {step.step_no}
                        {step.subject ? (
                          <span className="ml-2 font-normal text-muted-foreground">
                            {step.subject}
                          </span>
                        ) : null}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-muted-foreground">{when(step)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] ${sm.badge}`}>
                          {sm.label}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>

            {seq.status === 'active' && (
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStatus(seq.id, 'replied')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark replied
                </Button>
                <Button variant="outline" size="sm" onClick={() => setStatus(seq.id, 'stop')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
