'use client';

import React from 'react';
import { Download, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface PDFPreviewProps {
  pdfUrl: string;
  onSendEmail: () => void;
  isSending: boolean;
  onDownload: () => void;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ pdfUrl, onSendEmail, isSending, onDownload }) => {
  return (
    <div className="flex flex-col space-y-8 py-8 items-center max-w-4xl mx-auto px-4">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold text-navy mb-2">
          ✓ Your Biography is Ready
        </h1>
        <p className="text-charcoal-light max-w-md mx-auto">
          We&apos;ve captured your memories and transformed them into a beautiful, lasting story.
        </p>
      </div>

      <Card className="w-full bg-cream border-2 border-navy/5 shadow-lg overflow-hidden flex flex-col items-center">
        <div className="w-full aspect-[1/1.4] max-h-[600px] border-2 border-navy/10 rounded-lg shadow-inner overflow-auto bg-white p-8">
           <iframe
             src={pdfUrl}
             className="w-full h-full border-none"
             title="Biography PDF Preview"
           />
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          variant="primary"
          className="flex-1"
          onClick={onSendEmail}
          isLoading={isSending}
        >
          <Mail className="mr-2 h-5 w-5" />
          Send to My Email
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-copper text-copper hover:bg-copper/5"
          onClick={onDownload}
        >
          <Download className="mr-2 h-5 w-5" />
          Download PDF
        </Button>
      </div>
    </div>
  );
};
