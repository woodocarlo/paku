"use client";
import React, { useState } from 'react';
import { FolderOpen, Plus, ExternalLink, HardDrive, BookOpen, Sheet, FileText } from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

export default function AssignmentChecker() {
  const { config } = useGoogle();
  const [driveLink, setDriveLink] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [creationStatus, setCreationStatus] = useState<any>(null);

  const extractFolderId = (url: string) => {
      const match = url.match(/folders\/([-a-zA-Z0-9_]+)/);
      return match ? match[1] : url; 
  };

  const fetchFiles = async () => {
    if (!driveLink) return;
    setError(null);
    setIsProcessing(true);
    setFiles([]);
    try {
        const folderId = extractFolderId(driveLink);
        const response = await window.gapi.client.drive.files.list({
            'pageSize': 20,
            'fields': "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, createdTime)",
            'q': `'${folderId}' in parents and trashed = false`
        });
        setFiles(response.result.files || []);
    } catch (err: any) {
        console.error("Drive API Error", err);
        setError("Failed to fetch files. Ensure access.");
    } finally {
        setIsProcessing(false);
    }
  };

  const createFolder = async () => {
      if (!newFolderName) return;
      setCreationStatus({ type: 'loading', msg: 'Creating...' });
      try {
          const response = await window.gapi.client.drive.files.create({
              resource: { 'name': newFolderName, 'mimeType': 'application/vnd.google-apps.folder' },
              fields: 'id, name, webViewLink'
          });
          setCreationStatus({ type: 'success', msg: `Created '${response.result.name}' successfully!`, link: response.result.webViewLink });
          setNewFolderName('');
      } catch (err) {
          setCreationStatus({ type: 'error', msg: 'Failed to create folder.' });
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-gray-800">Assignment Manager</h2><p className="text-gray-500">Create folders and collect submissions.</p></div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${config?.accessToken ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>{config?.accessToken ? 'Drive Connected' : 'Drive Offline'}</div>
      </div>
      <div className="grid grid-cols-1 gap-6">
          <Card title="Create New Assignment Folder">
              <div className="flex gap-4 items-end">
                  <div className="flex-1"><InputGroup label="Folder Name" placeholder="e.g., Physics 101" value={newFolderName} onChange={(e: any) => setNewFolderName(e.target.value)} icon={FolderOpen} /></div>
                  <div className="mb-4"><Button onClick={createFolder} disabled={!newFolderName || !config?.accessToken} icon={Plus}>Create Folder</Button></div>
              </div>
              {creationStatus && <div className={`mt-2 text-sm p-3 rounded-lg flex items-center justify-between ${creationStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}><span>{creationStatus.msg}</span>{creationStatus.link && <a href={creationStatus.link} target="_blank" className="flex items-center gap-1 font-semibold underline">Open <ExternalLink size={12}/></a>}</div>}
          </Card>
          <Card title="View Folder Contents">
            <div className="flex gap-4 items-end">
              <div className="flex-1"><InputGroup label="Folder Link / ID" placeholder="Paste ID..." value={driveLink} onChange={(e: any) => setDriveLink(e.target.value)} icon={HardDrive} /></div>
              <div className="mb-4"><Button onClick={fetchFiles} disabled={isProcessing || !driveLink || !config?.accessToken} icon={BookOpen}>{isProcessing ? 'Fetching...' : 'Fetch Files'}</Button></div>
            </div>
            {error && <p className="text-red-600 text-sm mt-2 bg-red-50 p-2 rounded">{error}</p>}
          </Card>
      </div>
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slide-up">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center"><h3 className="font-semibold text-gray-700">Contents ({files.length})</h3><Button variant="secondary" icon={Sheet} className="text-xs h-8">Export</Button></div>
            <div className="divide-y divide-gray-100">
                {files.map(file => (
                    <div key={file.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-red-100 text-red-600 p-2 rounded-lg">{file.mimeType.includes('folder') ? <FolderOpen size={20}/> : <FileText size={20}/>}</div>
                            <div className="min-w-0"><h4 className="text-sm font-medium text-gray-900 truncate pr-4">{file.name}</h4><div className="flex gap-2 text-xs text-gray-500"><span>{new Date(file.createdTime).toLocaleDateString()}</span></div></div>
                        </div>
                        <a href={file.webViewLink} target="_blank" className="text-blue-600 hover:text-blue-800 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Open</a>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}