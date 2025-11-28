"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, FlaskConical, Video, LayoutDashboard, Settings, Calendar as CalendarIcon, User } from 'lucide-react';

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const pathname = usePathname();

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
      <div className="p-6 flex items-center gap-3 border-b border-gray-100 h-20">
        <div className="bg-blue-600 text-white p-2 rounded-lg"><BookOpen size={24} /></div>
        {isOpen && (
          <div>
            <h1 className="font-bold text-xl tracking-tight text-blue-900">EduAssist</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pro Edition</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              <item.icon size={20} />
              {isOpen && <span>{item.label}</span>}
              {!isOpen && isActive && <div className="absolute left-18 w-2 h-2 bg-blue-500 rounded-full"></div>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
          <User size={20} />
          {isOpen && <span>Jane Doe (Prof)</span>}
        </button>
      </div>
    </aside>
  );
};
export default Sidebar;