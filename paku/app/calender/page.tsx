"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Video, CheckCircle, Bell, AlertCircle, Trash2, Clock, Heart, X, AlignLeft, Calendar as CalendarIcon, Type } from 'lucide-react';
import { Button, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

// --- Types & Constants specific to Calendar ---
const EVENT_CATEGORIES = [
    { id: 'work', label: 'Work', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', fill: 'bg-purple-500' },
    { id: 'personal', label: 'Personal', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', fill: 'bg-blue-500' }
];

const EVENT_TYPES = [
    { id: 'meeting', label: 'Meeting', icon: Video },
    { id: 'task', label: 'Task', icon: CheckCircle },
    { id: 'reminder', label: 'Reminder', icon: Bell },
    { id: 'deadline', label: 'Deadline', icon: AlertCircle },
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
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push({ day: null, fullDate: null, isToday: false });
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ 
                day: i, 
                fullDate: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
                isToday: new Date().toDateString() === new Date(year, month, i).toDateString()
            });
        }
        return days;
    };
    return { currentDate, nextMonth, prevMonth, goToToday, getDaysInMonth };
};

export default function CalendarPage() {
    const { config } = useGoogle(); // Can be used to sync later
    const { currentDate, nextMonth, prevMonth, goToToday, getDaysInMonth } = useCalendarLogic();
    
    // State
    const [localEvents, setLocalEvents] = useState([
        { id: '1', title: 'Grade Physics Papers', date: new Date().toISOString().split('T')[0], time: '14:00', endTime: '15:00', category: 'work', type: 'task', description: 'Chapter 4 assignments.' },
        { id: '2', title: 'Grocery Run', date: new Date().toISOString().split('T')[0], time: '18:00', endTime: '', category: 'personal', type: 'task', description: 'Milk, eggs, bread' },
    ]);
    const [filter, setFilter] = useState('all'); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDayViewOpen, setIsDayViewOpen] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<any>({});
    
    const [hoveredEventId, setHoveredEventId] = useState<string|null>(null);
    const [detailsEventId, setDetailsEventId] = useState<string|null>(null); 
    const [conflictWarning, setConflictWarning] = useState<any>(null);
    const hoverTimerRef = useRef<any>(null);

    const [newEvent, setNewEvent] = useState({
        title: '', date: '', time: '12:00', endTime: '', category: 'work', type: 'meeting', description: ''
    });

    // Handlers
    const handleEventMouseEnter = (eventId: string) => {
        setHoveredEventId(eventId);
        hoverTimerRef.current = setTimeout(() => { setDetailsEventId(eventId); setHoveredEventId(null); }, 1500);
    };

    const handleEventMouseLeave = () => {
        if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null; }
        setHoveredEventId(null);
    };

    const handleOpenModal = (date: string | null = null) => {
        setNewEvent({
            title: '', date: date || new Date().toISOString().split('T')[0], time: '09:00', endTime: '', category: 'work', type: 'meeting', description: ''
        });
        setIsModalOpen(true);
        setConflictWarning(null);
    };

    useEffect(() => {
        if (isModalOpen && newEvent.date && newEvent.time) {
             const getMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
             const newStart = getMinutes(newEvent.time);
             const conflicts = localEvents
                .filter(ev => ev.date === newEvent.date)
                .map(ev => ({ ...ev, diff: Math.abs(newStart - getMinutes(ev.time)) }))
                .sort((a,b) => a.diff - b.diff);
             if (conflicts[0] && conflicts[0].diff < 45) {
                 setConflictWarning({ title: conflicts[0].title, time: conflicts[0].time, diff: conflicts[0].diff });
             } else {
                 setConflictWarning(null);
             }
        }
    }, [newEvent.date, newEvent.time, isModalOpen, localEvents]);

    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalEvents(prev => [...prev, { id: Date.now().toString(), ...newEvent }]);
        setIsModalOpen(false);
    };

    const handleDeleteEvent = (e: any, id: string) => {
        if(e) e.stopPropagation(); 
        setLocalEvents(prev => prev.filter(ev => ev.id !== id));
        if (detailsEventId === id) setDetailsEventId(null);
    };

    useEffect(() => {
        const handleClickOutside = () => setDetailsEventId(null);
        if (detailsEventId) window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [detailsEventId]);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = getDaysInMonth(currentDate);
    const getEventsForDate = (dateStr: string | null) => {
        if(!dateStr) return [];
        return localEvents.filter(ev => ev.date === dateStr && (filter === 'all' || ev.category === filter)).sort((a, b) => a.time.localeCompare(b.time));
    };

    // --- Render ---
    return (
        <div className="h-full flex flex-col space-y-5">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100 gap-6">
                <div className="flex items-center gap-5">
                    <div className="flex bg-gray-100 rounded-xl p-1 shadow-inner">
                        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-lg transition-all text-gray-600 shadow-sm hover:shadow"><ChevronLeft size={20}/></button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-lg transition-all text-gray-600 shadow-sm hover:shadow"><ChevronRight size={20}/></button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-baseline gap-2">
                        {monthNames[currentDate.getMonth()]} <span className="text-gray-400 text-lg font-medium">{currentDate.getFullYear()}</span>
                    </h2>
                    <Button variant="secondary" className="hidden md:flex text-xs px-4 py-1.5 h-9" onClick={goToToday}>Today</Button>
                </div>
                <div className="flex bg-gray-100/80 p-1.5 rounded-full relative backdrop-blur-sm">
                    {['all', 'work', 'personal'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 capitalize ${filter === f ? 'bg-white text-gray-800 shadow-md transform scale-105' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
                    ))}
                </div>
                <Button onClick={() => handleOpenModal()} icon={Plus} className="shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 bg-gradient-to-r from-blue-600 to-indigo-600 px-6">New Event</Button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col relative z-0">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 grid-rows-5 flex-1 min-h-[600px]">
                    {days.map((dayObj, index) => {
                        if (!dayObj.day) return <div key={index} className="bg-gray-50/30 border-b border-r border-gray-100"></div>; 
                        const events = getEventsForDate(dayObj.fullDate);
                        const displayEvents = events.slice(0, 3);
                        return (
                            <div key={index} className={`min-h-[120px] p-2 border-b border-r border-gray-100 relative group transition-colors ${dayObj.isToday ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'}`} onClick={() => { setSelectedDayEvents({ date: dayObj.fullDate, list: events }); setIsDayViewOpen(true); }}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${dayObj.isToday ? 'bg-blue-600 text-white shadow-md scale-105' : 'text-gray-700 group-hover:bg-gray-200/80'}`}>{dayObj.day}</span>
                                    <button className="text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110" onClick={(e) => { e.stopPropagation(); handleOpenModal(dayObj.fullDate); }}><Plus size={18} /></button>
                                </div>
                                <div className="space-y-1.5 mt-2 relative">
                                    {displayEvents.map((ev) => {
                                        const style = EVENT_CATEGORIES.find(c => c.id === ev.category) || EVENT_CATEGORIES[0];
                                        const typeObj = EVENT_TYPES.find(t => t.id === ev.type) || EVENT_TYPES[0];
                                        const TypeIcon = typeObj.icon;
                                        return (
                                            <div key={ev.id} className={`text-[10px] px-2 py-1.5 rounded-lg border-l-[3px] truncate font-semibold cursor-pointer relative ${style.bg} ${style.text} ${style.border}`}
                                                onMouseEnter={() => handleEventMouseEnter(ev.id)} onMouseLeave={handleEventMouseLeave} onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-1.5 relative z-10">
                                                    <TypeIcon size={10} className="opacity-70" />
                                                    <span className="opacity-75 font-normal">{ev.time}</span>
                                                    <span className="truncate">{ev.title}</span>
                                                </div>
                                                {hoveredEventId === ev.id && <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-30 hover-progress-bar z-0"></div>}
                                                {detailsEventId === ev.id && (
                                                    <div className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-pop-in cursor-default" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                                                            <div><h4 className="font-bold text-gray-800 text-sm">{ev.title}</h4></div>
                                                            <button onClick={(e) => handleDeleteEvent(e, ev.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                        </div>
                                                        <div className="space-y-2 text-xs text-gray-600">
                                                            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg"><Clock size={12}/><span className="font-medium">{ev.time} - {ev.endTime}</span></div>
                                                            <div className="p-2 bg-blue-50/50 rounded-lg italic">{ev.description || "No notes."}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {events.length > 3 && <div className="text-[10px] text-gray-500 font-medium text-center py-0.5 bg-gray-50 rounded">+{events.length - 3} more...</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-gray-100">
                        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-xl text-gray-800">New Item</h3>
                            <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
                        </div>
                        {conflictWarning && <div className="mx-8 mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3"><Heart size={18} className="text-orange-600"/><p className="text-xs text-orange-700">Conflict with <strong>{conflictWarning.title}</strong>.</p></div>}
                        <form onSubmit={handleAddEvent} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {EVENT_CATEGORIES.map(cat => (
                                    <button key={cat.id} type="button" onClick={() => setNewEvent(prev => ({ ...prev, category: cat.id }))} className={`py-3 px-4 rounded-xl text-sm font-bold border ${newEvent.category === cat.id ? `${cat.bg} ${cat.border} ${cat.text} ring-2 ring-${cat.color}-100` : 'bg-white border-gray-200'}`}>{cat.label}</button>
                                ))}
                            </div>
                            <InputGroup label="Title" value={newEvent.title} onChange={(e: any) => setNewEvent({ ...newEvent, title: e.target.value })} icon={Type} required />
                            <div className="grid grid-cols-3 gap-4">
                                <InputGroup label="Date" type="date" value={newEvent.date} onChange={(e: any) => setNewEvent({ ...newEvent, date: e.target.value })} icon={CalendarIcon} required />
                                <InputGroup label="Start" type="time" value={newEvent.time} onChange={(e: any) => setNewEvent({ ...newEvent, time: e.target.value })} icon={Clock} required />
                                {newEvent.type === 'meeting' && <InputGroup label="End" type="time" value={newEvent.endTime} onChange={(e: any) => setNewEvent({ ...newEvent, endTime: e.target.value })} icon={Clock} />}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {EVENT_TYPES.map(type => (
                                    <button key={type.id} type="button" onClick={() => setNewEvent(prev => ({ ...prev, type: type.id }))} className={`py-2 px-1 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 ${newEvent.type === type.id ? 'bg-gray-800 text-white' : 'bg-white border-gray-200'}`}><type.icon size={16}/>{type.label}</button>
                                ))}
                            </div>
                            <div className="relative group"><div className="absolute top-3 left-3 text-gray-400"><AlignLeft size={18}/></div><textarea rows={2} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Notes..." value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea></div>
                            <Button type="submit" className="w-full justify-center py-3.5" icon={Plus}>Add to Calendar</Button>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Day View Overflow Modal (Simplified) */}
            {isDayViewOpen && selectedDayEvents.list && (
                 <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsDayViewOpen(false)}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between mb-4"><h3 className="font-bold">Events on {selectedDayEvents.date}</h3><X className="cursor-pointer" onClick={() => setIsDayViewOpen(false)}/></div>
                        <div className="space-y-3">
                            {selectedDayEvents.list.map((ev: any) => (
                                <div key={ev.id} className="p-3 border rounded-lg">
                                    <div className="font-bold">{ev.title}</div>
                                    <div className="text-sm text-gray-500">{ev.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}