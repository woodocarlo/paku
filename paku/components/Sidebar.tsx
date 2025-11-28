"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  FlaskConical, 
  Video, 
  LayoutDashboard, 
  Settings, 
  Calendar as CalendarIcon, 
  User,
  LogOut 
} from 'lucide-react';
import { useGoogle } from '@/context/GoogleContext';

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();
  const { config, handleAuthClick, handleSignOut } = useGoogle();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { href: '/assignments', label: 'Assignment Checker', icon: BookOpen },
    { href: '/labs', label: 'Lab Manuals', icon: FlaskConical },
    { href: '/meeting', label: 'Meeting Assistant', icon: Video },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-20`}>
      
      {/* Header */}
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 h-20">
        <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0 shadow-lg shadow-blue-200">
          <BookOpen size={24} />
        </div>
        {isOpen && (
          <div className="animate-in fade-in duration-300">
            <h1 className="font-bold text-xl tracking-tight text-blue-900">EduAssist</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Pro Edition</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap group
                ${isActive 
                  ? 'bg-blue-50 text-blue-700 font-medium shadow-sm' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon size={20} className={`shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              
              {isOpen && <span className="animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
              
              {!isOpen && isActive && (
                <div className="absolute left-18 w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Auth Section */}
      <div className="p-4 border-t border-gray-100 pb-8 mb-2">
        {config.userProfile ? (
          /* LOGGED IN STATE */
          <div className={`flex flex-col gap-2 ${!isOpen && 'items-center'}`}>
            <div className={`flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100 transition-all ${!isOpen ? 'justify-center p-3' : ''}`}>
              {(config.userProfile as any).picture ? (
                 // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={(config.userProfile as any).picture} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-1.5 rounded-full text-blue-700">
                  <User size={18} />
                </div>
              )}
              {isOpen && (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate">{config.userProfile.name}</p>
                  <p className="text-xs text-gray-500 truncate">Developer</p>
                </div>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className={`flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg transition-colors w-full ${!isOpen ? 'justify-center' : ''}`}
            >
              <LogOut size={16} />
              {isOpen && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          /* LOGGED OUT STATE - SLEEK BUTTON */
          <button
            onClick={handleAuthClick}
            className={`
              relative group w-full flex items-center gap-3 rounded-xl transition-all duration-300
              ${isOpen 
                ? 'px-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5' 
                : 'justify-center p-3 bg-blue-600 text-white shadow-md hover:bg-blue-700'
              }
            `}
          >
            {/* Simple Shine Effect on Hover (Only visible when open) */}
            {isOpen && <div className="absolute inset-0 rounded-xl bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />}

            {/* Icon */}
            <div className={isOpen ? "p-1 bg-white/20 rounded-full" : ""}>
               <User size={18} className="shrink-0" />
            </div>

            {/* Text */}
            {isOpen && (
              <div className="flex flex-col items-start">
                <span className="text-xs font-medium text-blue-100 uppercase tracking-wider">Access</span>
                <span className="font-bold text-sm leading-tight">Connect Google</span>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;