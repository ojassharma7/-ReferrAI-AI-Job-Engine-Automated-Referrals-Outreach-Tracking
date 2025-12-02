'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/lib/types';
import { Mail, Linkedin, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
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
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
}

