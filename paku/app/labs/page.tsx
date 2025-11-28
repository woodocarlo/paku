"use client";
import React, { useState } from 'react';
import { FlaskConical, Search, FileText, Folder, ExternalLink, AlertTriangle, Link as LinkIcon } from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

export default function LabManualsPage() {
  const { config } = useGoogle();
  
  // State
  const [urlInput, setUrlInput] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderIdFound, setFolderIdFound] = useState<string | null>(null);

  // --- Logic: Extract ID (Matches your Python Regex) ---
  const extractFolderId = (url: string) => {
    // Pattern 1: .../folders/123456...
    const matchFolder = url.match(/folders\/([-a-zA-Z0-9_]+)/);
    if (matchFolder) return matchFolder[1];

    // Pattern 2: ...?id=123456...
    const matchId = url.match(/id=([-a-zA-Z0-9_]+)/);
    if (matchId) return matchId[1];

    // Pattern 3: Assume user pasted just the ID
    return url;
  };

  // --- Logic: Fetch Files (Matches your Python Service Call) ---
  const handleFetchFiles = async () => {
    // 1. Basic Validation
    if (!config.accessToken) {
        setError("Please go to Settings > Initialize System > Sign In first.");
        return;
    }
    if (!urlInput) {
        setError("Please enter a link.");
        return;
    }

    setLoading(true);
    setError(null);
    setFiles([]);
    setFolderIdFound(null);

    try {
        const folderId = extractFolderId(urlInput);
        setFolderIdFound(folderId);

        // 2. Build Query: "'folder_id' in parents"
        const query = `'${folderId}' in parents and trashed = false`;

        // 3. Call Google Drive API
        // Equivalent to: service.files().list(...)
        const response = await window.gapi.client.drive.files.list({
            'q': query,
            'pageSize': 20, // Fetch up to 20 files
            'fields': "nextPageToken, files(id, name, mimeType, webViewLink, iconLink)",
            'orderBy': 'folder, name' // Folders first, then alphabetical
        });

        const fetchedFiles = response.result.files;

        if (fetchedFiles && fetchedFiles.length > 0) {
            setFiles(fetchedFiles);
        } else {
            setError("No files found in this folder (or folder is empty).");
        }

    } catch (err: any) {
        console.error("Drive Fetch Error:", err);
        if (err.result && err.result.error && err.result.error.code === 404) {
             setError("Folder not found. Check permissions or the link.");
        } else {
             setError("Failed to fetch. Make sure the folder is 'Shared' with this account.");
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Lab Manual Validator</h2>
          <p className="text-gray-500">Fetch and analyze files from Drive.</p>
        </div>
        {/* Auth Status Indicator */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${config.accessToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
             {config.accessToken ? 'System Ready' : 'Authentication Needed'}
        </div>
      </div>

      {/* Input Section */}
      <Card title="Source Folder">
        {!config.accessToken && (
            <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} />
                <span><strong>System not initialized.</strong> Go to Settings to connect Google Drive.</span>
            </div>
        )}
        
        <div className="flex gap-4 items-end">
            <div className="flex-1">
                <InputGroup 
                    label="Google Drive Link" 
                    placeholder="https://drive.google.com/drive/folders/..." 
                    value={urlInput}
                    onChange={(e: any) => setUrlInput(e.target.value)}
                    icon={LinkIcon}
                />
            </div>
            <div className="mb-5">
                <Button 
                    onClick={handleFetchFiles} 
                    disabled={loading || !config.accessToken}
                    icon={loading ? undefined : Search}
                >
                    {loading ? 'Scanning...' : 'Fetch Files'}
                </Button>
            </div>
        </div>

        {folderIdFound && !error && (
            <p className="text-xs text-gray-400 mt-[-10px]">Target ID: <span className="font-mono">{folderIdFound}</span></p>
        )}
        
        {error && (
            <div className="mt-4 bg-orange-50 text-orange-700 p-3 rounded-lg text-sm border border-orange-200">
                {error}
            </div>
        )}
      </Card>

      {/* Results Section */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-slide-up">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <FlaskConical size={18} className="text-purple-600"/> 
                    Found Files ({files.length})
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {files.map((file) => {
                    // Determine Icon based on MimeType (similar to your Python "Qw" logic)
                    const isFolder = file.mimeType.includes('folder');
                    const isPDF = file.mimeType.includes('pdf');
                    
                    return (
                        <div key={file.id} className="p-4 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg ${isFolder ? 'bg-blue-100 text-blue-600' : isPDF ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {isFolder ? <Folder size={20}/> : <FileText size={20}/>}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-sm">{file.name}</h4>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {file.id}</p>
                                </div>
                            </div>
                            
                            <a 
                                href={file.webViewLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 px-3 py-1.5 rounded-full"
                            >
                                Open <ExternalLink size={12}/>
                            </a>
                        </div>
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
}