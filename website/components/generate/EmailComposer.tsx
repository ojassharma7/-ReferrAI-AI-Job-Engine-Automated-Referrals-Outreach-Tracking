'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Sparkles, Mail } from 'lucide-react';
import { Contact } from '@/lib/types';

interface EmailComposerProps {
  contact: Contact;
  jobTitle: string;
  company: string;
  candidateProfile?: string;
}

export function EmailComposer({ contact, jobTitle, company, candidateProfile }: EmailComposerProps) {
  const [proofPoint, setProofPoint] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<{ subject_a: string; subject_b: string; body: string } | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<'a' | 'b'>('a');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!candidateProfile) {
      setError('Candidate profile is required. Please provide it in the form.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedEmail(null);

    try {
      const response = await fetch('/api/generate/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateProfile: candidateProfile || 'Experienced professional',
          jobTitle,
          company,
          contactName: contact.full_name,
          contactTitle: contact.title,
          proofPoint: proofPoint || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate email');
      }

      const data = await response.json();
      setGeneratedEmail(data.email);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Email generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!generatedEmail) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: contact.email,
          subject: selectedSubject === 'a' ? generatedEmail.subject_a : generatedEmail.subject_b,
          emailBody: generatedEmail.body,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const data = await response.json();
      setSuccess(`Email sent successfully! Thread ID: ${data.threadId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Email sending error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Composer
        </CardTitle>
        <CardDescription>
          Generate and send referral email to {contact.full_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="proofPoint">Proof Point (optional)</Label>
          <Textarea
            id="proofPoint"
            placeholder="e.g., Improved loss forecasting by 13% through credit risk modeling"
            value={proofPoint}
            onChange={(e) => setProofPoint(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            A quantified achievement that demonstrates your fit for the role
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Email with AI
            </>
          )}
        </Button>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {generatedEmail && (
          <div className="space-y-4 rounded-md border bg-gray-50 p-4">
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v as 'a' | 'b')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">{generatedEmail.subject_a}</SelectItem>
                  <SelectItem value="b">{generatedEmail.subject_b}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Body</Label>
              <div className="rounded-md border bg-white p-4">
                <pre className="whitespace-pre-wrap text-sm">{generatedEmail.body}</pre>
              </div>
            </div>

            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
