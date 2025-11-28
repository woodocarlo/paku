"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Video, CheckCircle, Bell, 
  AlertCircle, Trash2, Clock, Heart, X, AlignLeft, 
  Calendar as CalendarIcon, Type, Sun, Moon, Coffee, Zap,
  RefreshCw, LogIn, Check
} from 'lucide-react';
import { Button, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

// --- Types & Constants ---
const EVENT_CATEGORIES = [
    { id: 'work', label: 'Work', color: 'purple', bg: 'bg-purple-100/50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
    { id: 'personal', label: 'Personal', color: 'blue', bg: 'bg-blue-100/50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    { id: 'urgent', label: 'Urgent', color: 'red', bg: 'bg-red-100/50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' }
];

const EVENT_TYPES = [
    { id: 'meeting', label: 'Meeting', icon: Video },
    { id: 'task', label: 'Task', icon: CheckCircle },
    { id: 'reminder', label: 'Reminder', icon: Bell },
    { id: 'deadline', label: 'Deadline', icon: AlertCircle },
];

// --- Helper Logic ---
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
    const { config, handleAuthClick } = useGoogle();
    const { currentDate, nextMonth, prevMonth, goToToday, getDaysInMonth } = useCalendarLogic();
    
    // --- State ---
    const [localEvents, setLocalEvents] = useState<any[]>([
        { id: '1', title: 'Physics Grading', date: new Date().toISOString().split('T')[0], time: '14:00', endTime: '15:00', category: 'work', type: 'task', description: 'Chapter 4 assignments.' },
    ]);
    
    const [filter, setFilter] = useState('all'); 
    
    // Sync States
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    // Modals & Popups
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEmptyDateModalOpen, setIsEmptyDateModalOpen] = useState(false);
    const [selectedDateForAction, setSelectedDateForAction] = useState<string | null>(null);

    // Hover Details
    const [hoveredEvent, setHoveredEvent] = useState<any>(null);
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    // AI/Assistant
    const [assistantMessage, setAssistantMessage] = useState<any>(null);
    
    const [newEvent, setNewEvent] = useState({
        title: '', date: '', time: '12:00', endTime: '13:00', category: 'work', type: 'meeting', description: ''
    });

    // --- Google Calendar Logic ---

    const syncWithGoogle = async () => {
        if (!config.accessToken) return;
        setIsSyncing(true);

        try {
            // 1. Calculate start and end of current month for query
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // 2. Fetch from Google
            const response = await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': startOfMonth.toISOString(),
                'timeMax': endOfMonth.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'
            });

            const googleEvents = response.result.items;

            // 3. Transform Google Events to Local Format
            const formattedEvents = googleEvents.map((ev: any) => {
                const start = ev.start.dateTime || ev.start.date; // Handle full day events
                const end = ev.end.dateTime || ev.end.date;
                
                const dateObj = new Date(start);
                const dateStr = dateObj.toISOString().split('T')[0];
                const timeStr = dateObj.toTimeString().substring(0, 5); // "HH:MM"
                
                // Try to preserve existing category if we already have this ID, otherwise default
                const existing = localEvents.find(le => le.id === ev.id);

                return {
                    id: ev.id,
                    title: ev.summary || '(No Title)',
                    date: dateStr,
                    time: timeStr.includes('00:00:00') ? 'All Day' : timeStr,
                    endTime: new Date(end).toTimeString().substring(0, 5),
                    category: existing ? existing.category : 'personal', // Default to personal
                    type: existing ? existing.type : 'meeting',
                    description: ev.description || ''
                };
            });

            // 4. Merge (Simple overwrite for this demo to keep sync clean)
            // In a real app, you might want to merge arrays more carefully
            setLocalEvents(formattedEvents);
            setLastSynced(new Date());

        } catch (error) {
            console.error("Sync Error", error);
            alert("Failed to sync with Google Calendar");
        } finally {
            setIsSyncing(false);
        }
    };

    const addToGoogleCalendar = async (eventData: any) => {
        if (!config.accessToken) return null; // Return null if offline

        try {
            // Construct Google Event Resource
            const resource = {
                summary: eventData.title,
                description: eventData.description,
                start: {
                    dateTime: `${eventData.date}T${eventData.time}:00`,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: `${eventData.date}T${eventData.endTime}:00`,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const response = await window.gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': resource
            });

            return response.result.id; // Return the new Google ID
        } catch (error) {
            console.error("Add to Google Error", error);
            alert("Could not save to Google Calendar (Saved locally only)");
            return Date.now().toString(); // Fallback ID
        }
    };

    // --- AI Logic ---
    useEffect(() => {
        if (!isAddModalOpen || !newEvent.date || !newEvent.time) {
            setAssistantMessage(null);
            return;
        }

        const getMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
        const newStart = getMinutes(newEvent.time);
        const dayOfWeek = new Date(newEvent.date).getDay();

        const sameDayEvents = localEvents.filter(ev => ev.date === newEvent.date);
        const conflict = sameDayEvents.find(ev => {
            const evStart = getMinutes(ev.time);
            return Math.abs(newStart - evStart) < 30;
        });

        if (conflict) {
            setAssistantMessage({
                type: 'warning', icon: AlertCircle,
                text: `Warning: Very close to "${conflict.title}" at ${conflict.time}.`
            });
            return;
        }

        if ((dayOfWeek === 0 || dayOfWeek === 6) && newEvent.category === 'work') {
             setAssistantMessage({
                type: 'care', icon: Coffee,
                text: "It's the weekend! Sure you want to work?"
            });
            return;
        }

        if (newStart > 1080) {
            setAssistantMessage({
                type: 'care', icon: Moon,
                text: "Late evening task? Get enough sleep after."
            });
            return;
        }
        setAssistantMessage(null);
    }, [newEvent.date, newEvent.time, newEvent.category, isAddModalOpen, localEvents]);


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

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalId = Date.now().toString(); // Default local ID

        // If online, save to Google first
        if (config.accessToken) {
            const googleId = await addToGoogleCalendar(newEvent);
            if (googleId) finalId = googleId;
        }

        setLocalEvents(prev => [...prev, { id: finalId, ...newEvent }]);
        setIsAddModalOpen(false);
    };

    const getEventsForDate = (dateStr: string | null) => {
        if(!dateStr) return [];
        return localEvents.filter(ev => ev.date === dateStr && (filter === 'all' || ev.category === filter)).sort((a, b) => a.time.localeCompare(b.time));
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

                <div className="flex gap-3">
                    {/* Sync Button */}
                    {config.accessToken ? (
                        <button 
                            onClick={syncWithGoogle} 
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors text-sm font-bold"
                        >
                            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync Google'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleAuthClick} 
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-bold"
                        >
                            <LogIn size={18} />
                            Connect Google
                        </button>
                    )}

                    <div className="hidden md:flex bg-gray-100/50 p-1 rounded-full">
                        {['all', 'work', 'personal'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{f}</button>
                        ))}
                    </div>
                    <Button onClick={() => handleOpenAddModal()} icon={Plus} className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-5 shadow-lg shadow-gray-300/50">Add Event</Button>
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
                                className={`relative p-2 border-r border-b border-gray-100 transition-all cursor-pointer group ${dayObj.isToday ? 'bg-blue-50/40' : 'hover:bg-gray-50'} ${isWeekend && !dayObj.isToday ? 'bg-orange-50/30' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${dayObj.isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 group-hover:text-gray-800'}`}>
                                        {dayObj.day}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenAddModal(dayObj.fullDate); }} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-600 transition-opacity">
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
                                                className={`text-[10px] px-2 py-1 rounded-md font-medium truncate flex items-center gap-1.5 transition-transform hover:scale-105 ${style.bg} ${style.text}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
                                                <span className="opacity-75">{ev.time}</span>
                                                <span className="truncate">{ev.title}</span>
                                            </div>
                                        );
                                    })}
                                    {events.length > 3 && <div className="text-[9px] text-gray-400 pl-2">+{events.length - 3} more</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* --- Hover Detail Card --- */}
            {hoveredEvent && (
                <div className="fixed z-50 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-4 animate-in fade-in zoom-in-95 duration-200 pointer-events-none" style={{ top: hoverPosition.y, left: hoverPosition.x }}>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-800 text-sm">{hoveredEvent.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${EVENT_CATEGORIES.find(c => c.id === hoveredEvent.category)?.bg} ${EVENT_CATEGORIES.find(c => c.id === hoveredEvent.category)?.text}`}>
                            {hoveredEvent.category}
                        </span>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center gap-2"><Clock size={14} className="text-blue-500"/><span>{hoveredEvent.time} - {hoveredEvent.endTime || '...'}</span></div>
                        <div className="flex items-start gap-2"><AlignLeft size={14} className="text-gray-400 mt-0.5"/><p className="italic">{hoveredEvent.description || "No description provided."}</p></div>
                    </div>
                </div>
            )}

            {/* --- "No Tasks" Modal --- */}
            {isEmptyDateModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsEmptyDateModalOpen(false)}>
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500"><Sun size={32} /></div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Clear Schedule!</h3>
                        <p className="text-gray-500 text-sm mb-6">No tasks scheduled for <span className="font-semibold text-gray-700">{selectedDateForAction}</span>.</p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => handleOpenAddModal(selectedDateForAction)} className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700 py-3 rounded-xl shadow-lg shadow-blue-500/30"><Plus size={18} className="mr-2"/> Add a Task</Button>
                            <button onClick={() => setIsEmptyDateModalOpen(false)} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Enjoy the free time</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Add Event Modal --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800">Add New Event</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500"><X size={20}/></button>
                        </div>

                        <div className={`transition-all duration-300 overflow-hidden ${assistantMessage ? 'max-h-24 opacity-100 p-4 border-b border-gray-100' : 'max-h-0 opacity-0'}`}>
                            {assistantMessage && (
                                <div className={`flex items-start gap-3 rounded-xl p-3 ${assistantMessage.type === 'warning' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                    <assistantMessage.icon size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">{assistantMessage.type === 'warning' ? 'Conflict Alert' : 'Self Care Tip'}</p>
                                        <p className="text-sm font-medium leading-snug">{assistantMessage.text}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAddEvent} className="p-6 space-y-5">
                            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                                {EVENT_CATEGORIES.map(cat => (
                                    <button key={cat.id} type="button" onClick={() => setNewEvent(prev => ({ ...prev, category: cat.id }))} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newEvent.category === cat.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{cat.label}</button>
                                ))}
                            </div>
                            <InputGroup label="Event Title" value={newEvent.title} onChange={(e: any) => setNewEvent({ ...newEvent, title: e.target.value })} icon={Type} placeholder="e.g., Deep Work Session" required />
                            <div className="grid grid-cols-3 gap-4">
                                <InputGroup label="Date" type="date" value={newEvent.date} onChange={(e: any) => setNewEvent({ ...newEvent, date: e.target.value })} required />
                                <InputGroup label="Start" type="time" value={newEvent.time} onChange={(e: any) => setNewEvent({ ...newEvent, time: e.target.value })} icon={Clock} required />
                                <InputGroup label="End" type="time" value={newEvent.endTime} onChange={(e: any) => setNewEvent({ ...newEvent, endTime: e.target.value })} icon={Clock} />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {EVENT_TYPES.map(type => (
                                    <button key={type.id} type="button" onClick={() => setNewEvent(prev => ({ ...prev, type: type.id }))} className={`py-3 rounded-xl text-[10px] font-bold border flex flex-col items-center gap-1 transition-colors ${newEvent.type === type.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                        <type.icon size={14}/> {type.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative group"><AlignLeft size={16} className="absolute top-3 left-3 text-gray-400"/><textarea rows={2} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" placeholder="Add notes or details..." value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea></div>
                            <Button type="submit" className="w-full justify-center py-3 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl shadow-lg shadow-gray-200">Confirm Schedule</Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}