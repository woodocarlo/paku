"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { X, LayoutDashboard, Mail, User } from 'lucide-react';
import { Button } from './ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { config } = useGoogle();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar isOpen={isSidebarOpen} />
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
               {isSidebarOpen ? <X size={20}/> : <LayoutDashboard size={20}/>}
             </button>
             <h2 className="text-xl font-semibold text-gray-800 capitalize">EduAssist</h2>
          </div>
          <div className="flex items-center gap-4">
             {config.accessToken && <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">System Online</div>}
             <Button variant="ghost" icon={Mail} className="hidden md:flex">Support</Button>
             <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 border-2 border-white shadow-sm"><User size={16} /></div>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-5rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}