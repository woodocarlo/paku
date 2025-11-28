"use client";
import React from 'react';
import { Video } from 'lucide-react';

export default function MeetingPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-center pt-20">
        <Video size={48} className="mx-auto text-gray-300 mb-4"/>
        <h2 className="text-2xl font-bold text-gray-800">Meeting Assistant</h2>
        <p className="text-gray-500">Feature currently in development.</p>
    </div>
  );
}