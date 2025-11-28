"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Video, CheckCircle, Bell, 
  Trash2, Clock, X, AlignLeft, Calendar as CalendarIcon, 
  Type, Sun, Moon, Coffee, Zap, Loader2, RefreshCw
} from 'lucide-react';
import { Button, InputGroup } from '@/components/ui/BaseComponents'; 
import { useGoogle } from '@/context/GoogleContext';

// --- Types & Constants ---
// 1. Removed 'Urgent' as requested
const EVENT_CATEGORIES = [
    { id: 'work', label: 'Work', color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    { id: 'personal', label: 'Personal', color: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
];

const EVENT_TYPES = [
    { id: 'meeting', label: 'Meeting', icon: Video },
    { id: 'task', label: 'Task', icon: CheckCircle },
    { id: 'reminder', label: 'Reminder', icon: Bell },
];

const useCalendarLogic = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date());
    
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        
        const days = Array(firstDayOfMonth).fill({ day: null, fullDate: null, isToday: false });
        
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ 
                day: i, 
                fullDate: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
                isToday: new Date().toDateString() === new Date(year, month, i).toDateString()
            });
        }
        
        const remaining = 42 - days.length;
        for(let i=0; i<remaining; i++) days.push({ day: null, fullDate: null, isToday: false });
        
        return days;
    };
    return { currentDate, nextMonth, prevMonth, goToToday, getDaysInMonth };
};

export default function CalendarPage() {
    // --- Google Context ---
    const { config, handleAuthClick } = useGoogle();
    const { currentDate, nextMonth, prevMonth, goToToday, getDaysInMonth } = useCalendarLogic();
    
    // --- State ---
    const [localEvents, setLocalEvents] = useState<any[]>([]);
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    
    const [filter, setFilter] = useState('all'); 
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEmptyDateModalOpen, setIsEmptyDateModalOpen] = useState(false);
    const [selectedDateForAction, setSelectedDateForAction] = useState<string | null>(null);

    // Hover Details
    const [hoveredEvent, setHoveredEvent] = useState<any>(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    // AI/Assistant Message
    const [assistantMessage, setAssistantMessage] = useState<any>(null);
    
    const [newEvent, setNewEvent] = useState({
        title: '', date: '', time: '12:00', endTime: '13:00', category: 'work', type: 'meeting', description: ''
    });

    // --- Google Calendar Fetching Logic ---
    const fetchGoogleEvents = async () => {
        if (!config.accessToken || !window.gapi?.client?.calendar) return;

        setIsLoadingGoogle(true);
        try {
            // Fetch events for the current month view
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const response = await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': startOfMonth.toISOString(),
                'timeMax': endOfMonth.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 100,
                'orderBy': 'startTime'
            });

            const events = response.result.items.map((item: any) => {
                const start = item.start.dateTime || item.start.date;
                const end = item.end.dateTime || item.end.date;
                const isAllDay = !item.start.dateTime;
                
                return {
                    id: item.id,
                    title: item.summary || 'No Title',
                    date: start.split('T')[0], // Extract YYYY-MM-DD
                    time: isAllDay ? 'All Day' : new Date(start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}),
                    endTime: isAllDay ? '' : new Date(end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}),
                    category: 'work', // Defaulting Google events to work (or you could infer based on colorId)
                    type: 'meeting',
                    description: item.description || '',
                    isGoogle: true
                };
            });
            setGoogleEvents(events);
        } catch (error) {
            console.error("Error fetching Google Calendar events", error);
        } finally {
            setIsLoadingGoogle(false);
        }
    };

    // Re-fetch when month changes or auth changes
    useEffect(() => {
        if(config.accessToken) fetchGoogleEvents();
    }, [config.accessToken, currentDate]);


    // --- AI/Assistant Sticker Logic ---
    useEffect(() => {
        if (!isAddModalOpen || !newEvent.date || !newEvent.time) {
            setAssistantMessage(null);
            return;
        }

        const getMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const newStart = getMinutes(newEvent.time);
        const dayOfWeek = new Date(newEvent.date).getDay();

        // Combine events for conflict check
        const allEvents = [...localEvents, ...googleEvents];
        const sameDayEvents = allEvents.filter(ev => ev.date === newEvent.date);
        
        // Conflict Warning
        const conflict = sameDayEvents.find(ev => {
            if(ev.time === 'All Day') return false;
            const evStart = getMinutes(ev.time);
            return Math.abs(newStart - evStart) < 30; 
        });

        if (conflict) {
            setAssistantMessage({
                bg: 'bg-red-100',
                sticker: '🚨',
                title: 'Oop! Tight Squeeze',
                text: `You have "${conflict.title}" at ${conflict.time}. Maybe give yourself some breathing room?`
            });
            return;
        }

        // Weekend "Self Care" Sticker
        if (dayOfWeek === 0 || dayOfWeek === 6) {
             if (newEvent.category === 'work') {
                setAssistantMessage({
                    bg: 'bg-orange-100',
                    sticker: '🧘',
                    title: 'Weekend Warrior?',
                    text: "It's the weekend! Don't forget to relax and touch grass."
                });
                return;
             }
        }

        // Late Night Sticker
        if (newStart > 1080) { // After 6 PM
            setAssistantMessage({
                bg: 'bg-indigo-100',
                sticker: '🌙',
                title: 'Night Owl Mode',
                text: "Scheduling late? Make sure to get your beauty sleep!"
            });
            return;
        }

        // Busy Day Sticker
        if (sameDayEvents.length > 3) {
            setAssistantMessage({
                bg: 'bg-yellow-100',
                sticker: '⚡',
                title: 'Power User',
                text: "Wow, busy day! Remember to hydrate between tasks."
            });
            return;
        }

        setAssistantMessage(null);

    }, [newEvent.date, newEvent.time, newEvent.category, isAddModalOpen, localEvents, googleEvents]);


    // --- Handlers ---
    const handleDateClick = (dateStr: string) => {
        const events = getEventsForDate(dateStr);
        setSelectedDateForAction(dateStr);
        if (events.length === 0) {
            setIsEmptyDateModalOpen(true);
        } else {
            handleOpenAddModal(dateStr);
        }
    };

    const handleOpenAddModal = (date: string | null = null) => {
        setNewEvent({
            title: '', date: date || new Date().toISOString().split('T')[0], time: '09:00', endTime: '10:00', category: 'work', type: 'meeting', description: ''
        });
        setIsEmptyDateModalOpen(false);
        setIsAddModalOpen(true);
    };

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        // If syncing back to Google is needed, you'd add the API call here.
        // For now, we save locally.
        setLocalEvents(prev => [...prev, { id: Date.now().toString(), ...newEvent }]);
        setIsAddModalOpen(false);
    };

    const getEventsForDate = (dateStr: string | null) => {
        if(!dateStr) return [];
        const combined = [...localEvents, ...googleEvents];
        return combined.filter(ev => ev.date === dateStr && (filter === 'all' || ev.category === filter))
            .sort((a, b) => a.time.localeCompare(b.time));
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = getDaysInMonth(currentDate);

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 font-sans text-gray-700">
            {/* --- Header --- */}
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-white shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                         <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            {monthNames[currentDate.getMonth()]} 
                            <span className="text-gray-400 font-normal ml-2">{currentDate.getFullYear()}</span>
                        </h2>
                    </div>
                    <div className="flex bg-gray-100 rounded-full p-1">
                        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow"><ChevronLeft size={18}/></button>
                        <button onClick={goToToday} className="px-4 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600">Today</button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow"><ChevronRight size={18}/></button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Google Status Indicator */}
                    {config.accessToken ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                            {isLoadingGoogle ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12} onClick={fetchGoogleEvents} className="cursor-pointer"/>}
                            <span>Synced</span>
                        </div>
                    ) : (
                        <button onClick={handleAuthClick} className="text-xs text-blue-600 hover:underline">
                            Connect Google
                        </button>
                    )}

                    <div className="hidden md:flex bg-gray-100/50 p-1 rounded-full">
                        {['all', 'work', 'personal'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{f}</button>
                        ))}
                    </div>
                    <Button onClick={() => handleOpenAddModal()} icon={Plus} className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl px-5 shadow-lg shadow-indigo-200">Add Event</Button>
                </div>
            </div>

            {/* --- Main Calendar Grid --- */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="grid grid-cols-7 border-b border-gray-100">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <div key={day} className={`py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] ${i === 0 || i === 6 ? 'text-orange-400 bg-orange-50/10' : 'text-gray-400'}`}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 grid-rows-6 flex-1">
                    {days.map((dayObj, index) => {
                        const isWeekend = index % 7 === 0 || index % 7 === 6;
                        if (!dayObj.day) return <div key={index} className={`bg-gray-50/20 border-r border-b border-gray-50 ${isWeekend ? 'bg-orange-50/20' : ''}`}></div>;
                        const events = getEventsForDate(dayObj.fullDate);
                        
                        return (
                            <div 
                                key={index} 
                                onClick={() => handleDateClick(dayObj.fullDate)}
                                className={`
                                    relative p-2 border-r border-b border-gray-100 transition-all cursor-pointer group
                                    ${dayObj.isToday ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}
                                    ${isWeekend && !dayObj.isToday ? 'bg-orange-50/30' : ''}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${dayObj.isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 group-hover:text-gray-800'}`}>
                                        {dayObj.day}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenAddModal(dayObj.fullDate); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-indigo-600 transition-opacity">
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <div className="mt-1 space-y-1">
                                    {events.slice(0, 3).map((ev) => {
                                        const style = EVENT_CATEGORIES.find(c => c.id === ev.category) || EVENT_CATEGORIES[0];
                                        return (
                                            <div 
                                                key={ev.id}
                                                onMouseEnter={(e) => {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setHoverPosition({ x: rect.right + 10, y: rect.top });
                                                    setHoveredEvent(ev);
                                                }}
                                                onMouseLeave={() => setHoveredEvent(null)}
                                                className={`text-[10px] px-2 py-1 rounded-md font-medium truncate flex items-center gap-1.5 transition-transform hover:scale-105 ${ev.isGoogle ? 'bg-green-50 text-green-700 border border-green-100' : `${style.bg} ${style.text}`}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${ev.isGoogle ? 'bg-green-500' : style.dot}`}></div>
                                                <span className="opacity-75">{ev.time}</span>
                                                <span className="truncate">{ev.title}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Hover Detail Card --- */}
            {hoveredEvent && (
                <div 
                    className="fixed z-50 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{ top: hoverPosition.y, left: hoverPosition.x }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 text-sm">{hoveredEvent.title}</h4>
                        {hoveredEvent.isGoogle && <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">G-Cal</span>}
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500"/>
                            <span>{hoveredEvent.time} {hoveredEvent.endTime ? `- ${hoveredEvent.endTime}` : ''}</span>
                        </div>
                        {hoveredEvent.description && (
                             <div className="flex items-start gap-2 bg-gray-50 p-2 rounded-lg">
                                <AlignLeft size={14} className="text-gray-400 mt-0.5 shrink-0"/>
                                <p className="italic line-clamp-3">{hoveredEvent.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Add/Edit Event Modal (New Color Scheme) --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white transform transition-all">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                            <div>
                                <h3 className="font-bold text-xl text-indigo-950">New Schedule</h3>
                                <p className="text-xs text-indigo-400 font-medium">Add to your timeline</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-full hover:bg-indigo-100 text-indigo-300 hover:text-indigo-600 transition-colors"><X size={20}/></button>
                        </div>

                        {/* AI Sticker Message */}
                        <div className={`transition-all duration-300 overflow-hidden ${assistantMessage ? 'max-h-32 opacity-100 px-8 pt-6' : 'max-h-0 opacity-0'}`}>
                            {assistantMessage && (
                                <div className={`flex items-center gap-4 rounded-2xl p-4 ${assistantMessage.bg} border border-white shadow-sm`}>
                                    <div className="text-4xl filter drop-shadow-sm animate-bounce-slow">{assistantMessage.sticker}</div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0.5">{assistantMessage.title}</p>
                                        <p className="text-sm font-semibold leading-snug text-gray-800">{assistantMessage.text}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddEvent} className="p-8 space-y-6">
                            {/* Categories */}
                            <div className="flex gap-3">
                                {EVENT_CATEGORIES.map(cat => (
                                    <button 
                                        key={cat.id} type="button" 
                                        onClick={() => setNewEvent(prev => ({ ...prev, category: cat.id }))} 
                                        className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all border-2 ${newEvent.category === cat.id ? `border-${cat.color}-100 ${cat.bg} ${cat.text}` : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            <InputGroup label="Title" value={newEvent.title} onChange={(e: any) => setNewEvent({ ...newEvent, title: e.target.value })} icon={Type} placeholder="What's happening?" required />
                            
                            <div className="grid grid-cols-2 gap-5">
                                <InputGroup label="Date" type="date" value={newEvent.date} onChange={(e: any) => setNewEvent({ ...newEvent, date: e.target.value })} required />
                                <div className="flex gap-2">
                                    <InputGroup label="Start" type="time" value={newEvent.time} onChange={(e: any) => setNewEvent({ ...newEvent, time: e.target.value })} icon={Clock} required />
                                    {/* 3. Conditional End Time */}
                                    {newEvent.type === 'meeting' && (
                                         <InputGroup label="End" type="time" value={newEvent.endTime} onChange={(e: any) => setNewEvent({ ...newEvent, endTime: e.target.value })} icon={Clock} />
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                                {EVENT_TYPES.map(type => (
                                    <button 
                                        key={type.id} type="button" 
                                        onClick={() => setNewEvent(prev => ({ ...prev, type: type.id }))} 
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${newEvent.type === type.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <type.icon size={14}/>
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            <Button type="submit" className="w-full justify-center py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-200 font-bold text-lg">
                                Save Event
                            </Button>
                        </form>
                    </div>
                </div>
            )}
            
             {/* Empty State Modal (Reusing functionality, just simplified) */}
             {isEmptyDateModalOpen && (
                <div className="fixed inset-0 bg-indigo-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsEmptyDateModalOpen(false)}>
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                         <Sun size={48} className="mx-auto text-orange-400 mb-4"/>
                         <h3 className="text-lg font-bold text-gray-800">No plans yet!</h3>
                         <Button onClick={() => handleOpenAddModal(selectedDateForAction)} className="mt-6 w-full justify-center bg-indigo-600 text-white py-3">Create Plan</Button>
                    </div>
                </div>
            )}
        </div>
    );
}