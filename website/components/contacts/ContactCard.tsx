'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Contact } from '@/lib/types';
import { Mail, Linkedin, Phone, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { EmailComposer } from '@/components/generate/EmailComposer';

interface ContactCardProps {
  contact: Contact;
  jobTitle?: string;
  company?: string;
  candidateProfile?: string;
}

export function ContactCard({ contact, jobTitle, company, candidateProfile }: ContactCardProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const getEmailStatusIcon = () => {
    if (contact.email_verified) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getEmailStatusBadge = () => {
    if (contact.email_verified) {
      return <Badge variant="default" className="bg-green-500">Verified</Badge>;
    }
    if (contact.email_status === 'likely') {
      return <Badge variant="secondary">Likely</Badge>;
    }
    return <Badge variant="outline">Unverified</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{contact.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{contact.title}</p>
          </div>
          {getEmailStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{contact.email}</span>
          {getEmailStatusIcon()}
        </div>
        
        {contact.linkedin_url && (
          <div className="flex items-center gap-2 text-sm">
            <Linkedin className="h-4 w-4 text-blue-600" />
            <a 
              href={contact.linkedin_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              LinkedIn Profile
            </a>
          </div>
        )}

        {contact.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{contact.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline">{contact.seniority}</Badge>
          <Badge variant="outline">Score: {contact.relevance_score}</Badge>
        </div>

        {jobTitle && company && (
          <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mt-2" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Compose Email</DialogTitle>
                <DialogDescription>
                  Generate and send a personalized referral email to {contact.full_name}
                </DialogDescription>
              </DialogHeader>
              <EmailComposer
                contact={contact}
                jobTitle={jobTitle}
                company={company}
                candidateProfile={candidateProfile}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

