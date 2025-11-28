"use client";
import React from 'react';
import { FlaskConical } from 'lucide-react';
import { Card } from '@/components/ui/BaseComponents';

export default function LabManualsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lab Manual Validator</h2>
          <p className="text-gray-500">Compare manuals and sync results to Google Sheets.</p>
        </div>
      </div>
      <Card title="Demo Feature" className="text-center py-10">
           <FlaskConical size={48} className="mx-auto text-purple-200 mb-4"/>
           <p className="text-gray-600">
             This module uses complex PDF parsing which requires a backend. 
             <br/>Please use the <strong>Assignment Manager</strong> or <strong>Calendar</strong> tabs to test the real Google API integration.
           </p>
      </Card>
    </div>
  );
}