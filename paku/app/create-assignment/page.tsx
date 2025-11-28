"use client";
import React, { useState } from 'react';
import { Plus, FileText, Calendar, Clock, Save, X } from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents';

export default function CreateAssignmentPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [points, setPoints] = useState(10);
  const [subject, setSubject] = useState('');
  const [instructions, setInstructions] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSave = () => {
    // TODO: Implement save logic (e.g., API call to save assignment)
    console.log('Saving assignment:', { title, description, deadline, points, subject, instructions, attachments });
    alert('Assignment created successfully!');
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plus size={24} className="text-blue-600" />
            Create New Assignment
          </h2>
          <p className="text-gray-500">Design and publish assignments for your students</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white" icon={Save}>
          Publish Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Assignment Details">
            <div className="space-y-4">
              <InputGroup
                label="Assignment Title"
                placeholder="Enter assignment title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                icon={FileText}
              />

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the assignment requirements..."
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Detailed Instructions</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Provide step-by-step instructions..."
                  className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-blue-500 resize-none"
                  rows={6}
                />
              </div>
            </div>
          </Card>

          <Card title="Attachments">
            <div className="space-y-4">
              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
                id="attachment-upload"
              />
              <label
                htmlFor="attachment-upload"
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <Plus size={20} className="text-gray-400" />
                <span className="text-sm text-gray-500">Add attachments (PDFs, images, etc.)</span>
              </label>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Settings">
            <div className="space-y-4">
              <InputGroup
                label="Subject"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                icon={FileText}
              />

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Deadline</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Total Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" icon={FileText}>
                Save as Draft
              </Button>
              <Button variant="outline" className="w-full justify-start" icon={Calendar}>
                Schedule for Later
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
