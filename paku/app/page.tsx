"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, FlaskConical, BarChart3, Cloud, Sun, 
  BookOpen, Quote, ChevronDown, ChevronUp, 
  GraduationCap, Calendar as CalendarIcon, RefreshCw,
  MapPin, CloudRain, Wind, CloudFog, CloudLightning, Moon, Star
} from 'lucide-react';

// Import the Google Context (Same as your CalendarPage)
import { useGoogle } from '@/context/GoogleContext';

// --- UI Components ---
const Card = ({ children, className = "", onClick }: any) => (
  <div onClick={onClick} className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon }: any) => {
  const baseStyle = "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95";
  const styles = {
    primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${styles[variant as keyof typeof styles]} ${className}`}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

// --- API & Logic Hooks ---

// 1. Dynamic Background Hook
const useTimeTheme = () => {
  const [themeClass, setThemeClass] = useState("bg-gray-50");
  const [textColor, setTextColor] = useState("text-gray-900");

  useEffect(() => {
    const hour = new Date().getHours();
    
    // Gradients that start strong at top and fade to white at bottom
    if (hour >= 5 && hour < 12) {
      // Morning: Orange/Amber Sunrise
      setThemeClass("bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-300 via-amber-100 to-white");
      setTextColor("text-orange-950");
    } else if (hour >= 12 && hour < 17) {
      // Afternoon: Bright Blue Sky
      setThemeClass("bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 via-blue-100 to-white");
      setTextColor("text-blue-950");
    } else if (hour >= 17 && hour < 20) {
      // Evening: Sunset Purple/Pink
      setThemeClass("bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400 via-purple-200 to-white");
      setTextColor("text-indigo-950");
    } else {
      // Night: Dark Blue/Black with "Stars" feel
      // Using a very dark gradient that fades to white
      setThemeClass("bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-800 to-white");
      setTextColor("text-white"); // Header text becomes white at night for contrast
    }
  }, []);

  return { themeClass, textColor };
};

// 2. Google Calendar Integration Hook (Adapted from CalendarPage)
const useCalendarAgenda = () => {
    const { config } = useGoogle(); // Uses your existing context
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTodayEvents = async () => {
        if (!config.accessToken || !window.gapi) return;
        setLoading(true);

        try {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            const response = await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': startOfDay.toISOString(),
                'timeMax': endOfDay.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'
            });

            const googleEvents = response.result.items;

            const formattedEvents = googleEvents.map((ev: any) => {
                const start = ev.start.dateTime || ev.start.date;
                const dateObj = new Date(start);
                const timeStr = dateObj.toTimeString().substring(0, 5);
                
                // Determine urgency based on keywords or proximity
                const isUrgent = ev.summary?.toLowerCase().includes('urgent') || ev.summary?.toLowerCase().includes('deadline');

                return {
                    id: ev.id,
                    title: ev.summary || '(No Title)',
                    time: timeStr.includes('00:00:00') ? 'All Day' : timeStr,
                    type: ev.eventType || 'event',
                    urgent: isUrgent,
                    link: ev.htmlLink
                };
            });
            setEvents(formattedEvents);
        } catch (error) {
            console.error("Agenda Sync Error", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (config.accessToken) {
            fetchTodayEvents();
        }
    }, [config.accessToken]);

    return { events, loading, refresh: fetchTodayEvents, isConnected: !!config.accessToken };
};

// 3. Location Hook
const useLocation = () => {
  const [location, setLocation] = useState({ lat: 28.61, long: 77.20, city: "New Delhi" });
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const cityRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const cityData = await cityRes.json();
          setLocation({ lat: latitude, long: longitude, city: cityData.city || cityData.locality || "Your Location" });
        } catch (e) { setLocation({ lat: latitude, long: longitude, city: "Unknown Location" }); }
      });
    }
  }, []);
  return location;
};

// 4. Weather Hook
const useWeather = (lat: number, long: number) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current_weather=true&temperature_unit=celsius`)
      .then(res => res.json()).then(data => { setWeather(data.current_weather); setLoading(false); })
      .catch(err => setLoading(false));
  }, [lat, long]);
  return { weather, loading };
};

// 5. News Hook
const useNews = (category: string) => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    let rssUrl = "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en";
    if(category === 'Science') rssUrl = "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en";
    
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok' && data.items) setNews(data.items.slice(0, 5));
        else throw new Error("No data");
        setLoading(false);
      })
      .catch(() => {
        setNews([
           { title: "New AI Chip Architecture Revealed by Tech Giants", source: "TechCrunch", pubDate: new Date().toISOString(), link: "#" },
           { title: "The Future of Quantum Computing in 2025", source: "Wired", pubDate: new Date().toISOString(), link: "#" }
        ]);
        setLoading(false);
      });
  }, [category]);
  return { news, loading };
};

// 6. Quotes Hook
const useQuote = () => {
  const [quote, setQuote] = useState<any>(null);
  useEffect(() => {
    fetch('https://dummyjson.com/quotes/random').then(res => res.json()).then(data => setQuote(data));
  }, []);
  return quote;
};

// --- Mock Data for Classes ---
const CLASSES = [
  { id: 1, name: 'Advanced Physics A', subject: 'Science', students: 24, nextClass: '10:30 AM', color: 'bg-blue-50 text-blue-700' },
  { id: 2, name: 'Intro to Chemistry', subject: 'Science', students: 30, nextClass: '01:00 PM', color: 'bg-purple-50 text-purple-700' },
  { id: 3, name: '10th Grade Homeroom', subject: 'General', students: 18, nextClass: '08:00 AM', color: 'bg-emerald-50 text-emerald-700' }
];

const NEWS_CATEGORIES = ["Technology", "AI", "Science", "Education"];

export default function Dashboard() {
  const { themeClass, textColor } = useTimeTheme();
  const location = useLocation();
  const { weather, loading: weatherLoading } = useWeather(location.lat, location.long);
  const [activeCategory, setActiveCategory] = useState("Technology");
  const { news, loading: newsLoading } = useNews(activeCategory);
  const quote = useQuote();
  
  // Real Calendar Data
  const { events: calendarEvents, loading: calendarLoading, isConnected } = useCalendarAgenda();

  const [expandedClass, setExpandedClass] = useState<number | null>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun size={24} className="text-amber-500" />;
    return <Cloud size={24} className="text-slate-500" />;
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 ease-in-out p-6 font-sans text-gray-800 space-y-8 ${themeClass}`}>
      
      {/* --- Header Row --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className={`text-4xl font-extrabold tracking-tight mb-2 transition-colors duration-500 text-gray-900`}>
            {getGreeting()}, Professor.
          </h1>
          <p className={`font-medium flex items-center gap-2 opacity-80 text-gray-900`}>
            <CalendarIcon size={16} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Weather Widget */}
        <Card className="px-5 py-3 flex items-center gap-4 border-white/40 min-w-[240px]">
          {weatherLoading ? (
             <div className="flex items-center gap-2 text-sm text-gray-400">
                <RefreshCw className="animate-spin" size={16} /> Fetching...
             </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50/80 rounded-full shadow-inner">
                {weather ? getWeatherIcon(weather.weathercode) : <Sun size={24} />}
              </div>
              <div>
                <div className="text-3xl font-bold flex items-center gap-1 text-gray-800">
                  {weather ? Math.round(weather.temperature) : '--'}°
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                  <MapPin size={10} className="text-blue-500" /> {location.city}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Left Column --- */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quote Widget */}
          {quote && (
            <div className="bg-gradient-to-br from-gray-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl shadow-gray-900/10 border border-white/10">
              <Quote className="opacity-30 mb-2" size={24} />
              <p className="text-lg font-medium italic leading-relaxed text-indigo-50">"{quote.quote}"</p>
              <p className="mt-3 text-sm font-bold opacity-60 uppercase tracking-widest text-indigo-200">— {quote.author}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-blue-500">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-xs font-bold uppercase">Pending Grading</p><h2 className="text-3xl font-extrabold text-gray-800 mt-1">24</h2></div>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><FileText size={20} /></div>
              </div>
            </Card>
            <Card className="p-5 border-l-4 border-l-purple-500">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-xs font-bold uppercase">Reports Scanned</p><h2 className="text-3xl font-extrabold text-gray-800 mt-1">45</h2></div>
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600"><FlaskConical size={20} /></div>
              </div>
            </Card>
            <Card className="p-5 border-l-4 border-l-emerald-500">
              <div className="flex justify-between items-start">
                <div><p className="text-gray-500 text-xs font-bold uppercase">Class Average</p><h2 className="text-3xl font-extrabold text-gray-800 mt-1">87%</h2></div>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><BarChart3 size={20} /></div>
              </div>
            </Card>
          </div>

          {/* Classes Section */}
          <div className="space-y-4">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${textColor} transition-colors duration-500`}>
              <BookOpen size={20} className="opacity-70" /> Your Classes
            </h3>
            <div className="space-y-3">
              {CLASSES.map((cls) => (
                <Card key={cls.id} className={`overflow-hidden transition-all duration-300 ${expandedClass === cls.id ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                  <div onClick={() => setExpandedClass(expandedClass === cls.id ? null : cls.id)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cls.color}`}><GraduationCap size={24} /></div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{cls.name}</h4>
                        <p className="text-sm text-gray-500">{cls.subject} • {cls.students} Students</p>
                      </div>
                    </div>
                    {expandedClass === cls.id ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className="space-y-6">
          
          {/* Calendar Agenda Widget (Live Data) */}
          <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><CalendarIcon size={18} className="text-blue-500" /> Today's Agenda</h3>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{calendarEvents.length} Events</span>
            </div>
            
            <div className="space-y-3 min-h-[150px]">
                {!isConnected ? (
                     <div className="text-center py-8 flex flex-col items-center gap-2 text-gray-400">
                         <CloudRain size={32} className="opacity-50" />
                         <span className="text-xs">Calendar not connected</span>
                     </div>
                ) : calendarLoading ? (
                    <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-gray-300" /></div>
                ) : calendarEvents.length > 0 ? (
                    calendarEvents.map(ev => (
                        <div key={ev.id} className="group flex gap-3 items-start p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => window.open(ev.link, '_blank')}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${ev.urgent ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-blue-400'}`}></div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ev.urgent ? 'text-red-600' : 'text-gray-700'} truncate`}>{ev.title}</p>
                            <p className="text-xs text-gray-400">{ev.time} • {ev.type}</p>
                        </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400 text-xs">
                         <Sun size={24} className="mx-auto mb-2 text-amber-400 opacity-50"/>
                         No events scheduled for today.
                    </div>
                )}
            </div>
          </Card>

          {/* News Widget */}
          <Card className="p-5">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Latest Updates</h3>
                <RefreshCw size={14} className={`text-gray-400 cursor-pointer ${newsLoading ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {NEWS_CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {newsLoading ? (
                <div className="text-center py-8 text-gray-400 text-xs">Fetching updates...</div>
              ) : (
                news.map((item, idx) => (
                  <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="block group">
                    <h4 className="text-sm font-medium text-gray-700 group-hover:text-blue-600 leading-snug mb-1 line-clamp-2">{item.title}</h4>
                    <div className="flex justify-between items-center text-[10px] text-gray-400"><span>{item.source}</span><span>{new Date(item.pubDate).toLocaleDateString()}</span></div>
                    {idx < news.length - 1 && <div className="h-px bg-gray-50 mt-3" />}
                  </a>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
