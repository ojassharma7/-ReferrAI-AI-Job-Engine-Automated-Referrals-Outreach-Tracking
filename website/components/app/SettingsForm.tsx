'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';

interface SettingsValues {
  full_name: string;
  headline: string;
  candidate_profile: string;
  base_resume_text: string;
}

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [values, setValues] = useState<SettingsValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SettingsValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={values.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={values.headline}
                onChange={(e) => set('headline', e.target.value)}
                placeholder="Senior Data Scientist"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidate_profile">Background / profile</Label>
            <Textarea
              id="candidate_profile"
              rows={4}
              value={values.candidate_profile}
              onChange={(e) => set('candidate_profile', e.target.value)}
              placeholder="A short summary of your experience and skills. Used to personalize AI output."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base_resume_text">Master resume (plain text)</Label>
            <Textarea
              id="base_resume_text"
              rows={10}
              value={values.base_resume_text}
              onChange={(e) => set('base_resume_text', e.target.value)}
              placeholder="Paste your full resume here. AI tailors from this without inventing experience."
              className="font-mono text-xs"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
