"use client";
import React, { useState } from 'react';
import { User, Link, Eye, EyeOff, RefreshCw, CheckCircle, LogOut, AlertCircle, Database } from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

export default function SettingsPage() {
    const { config, setConfig, initializeGapi, handleAuthClick, handleSignOut } = useGoogle();
    const [showKeys, setShowKeys] = useState(false);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
            
            <Card title="Google Workspace Integration" description="Connect to access real Drive and Calendar data.">
                <div className="space-y-4">
                    {/* Error Display */}
                    {config.error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-200 flex flex-col gap-1">
                            <div className="flex items-center gap-2 font-bold"><AlertCircle size={16}/> Error</div>
                            <p>{config.error}</p>
                        </div>
                    )}
                    
                    {/* Initialization Form */}
                    {!config.isInitialized ? (
                        <div className="space-y-4 animate-fade-in">
                            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex gap-2">
                                <Database size={16} className="mt-1 shrink-0"/>
                                <div>
                                    <p className="font-semibold">Setup Instructions:</p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>Create a project in Google Cloud Console.</li>
                                        <li>Enable <strong>Drive</strong>, <strong>Calendar</strong>, and <strong>Sheets</strong> APIs.</li>
                                        <li>Create OAuth 2.0 Client ID & API Key.</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <InputGroup 
                                    label="Google Client ID" 
                                    type={showKeys ? "text" : "password"} 
                                    placeholder="...apps.googleusercontent.com" 
                                    value={config.clientId} 
                                    onChange={(e: any) => setConfig({...config, clientId: e.target.value})} 
                                    icon={User} 
                                />
                                <InputGroup 
                                    label="API Key" 
                                    type={showKeys ? "text" : "password"} 
                                    placeholder="AIzaSy..." 
                                    value={config.apiKey} 
                                    onChange={(e: any) => setConfig({...config, apiKey: e.target.value})} 
                                    icon={Link} 
                                />
                            </div>

                            <div className="flex justify-between items-center">
                                <button onClick={() => setShowKeys(!showKeys)} className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700">
                                    {showKeys ? <EyeOff size={14}/> : <Eye size={14}/>} {showKeys ? "Hide Secrets" : "Show Secrets"}
                                </button>
                                <Button onClick={initializeGapi} icon={RefreshCw}>Initialize System</Button>
                            </div>
                        </div>
                    ) : (
                        /* Authenticated View */
                        <div className="space-y-6 animate-slide-up">
                            <div className="flex items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-green-600" size={24} />
                                    <div>
                                        <h4 className="font-semibold text-green-900">System Initialized</h4>
                                        <p className="text-green-700 text-sm">Ready to authenticate users.</p>
                                    </div>
                                </div>
                            </div>

                            {!config.accessToken ? (
                                <div className="text-center py-4">
                                    <p className="text-gray-600 mb-4">Authorize access to Drive and Calendar.</p>
                                    <Button onClick={handleAuthClick} icon={User} className="mx-auto">Sign In with Google</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                         <div className="flex items-center gap-3">
                                             <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">G</div>
                                             <div>
                                                 <p className="font-medium text-blue-900">Authenticated</p>
                                                 <p className="text-xs text-blue-700">Access Token Active</p>
                                             </div>
                                         </div>
                                         <Button variant="danger" onClick={handleSignOut} icon={LogOut}>Sign Out</Button>
                                     </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}