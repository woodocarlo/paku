"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Send, Construction, AlertTriangle, Terminal } from 'lucide-react';
// Note: We removed the top-level flv.js import to prevent SSR crashes

export default function MeetingPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // We store the player instance in a ref to manage cleanup without triggering re-renders
  const playerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initPlayer = async () => {
      // Prevent duplicate initialization if player already exists
      if (playerRef.current) return;

      try {
        const flvjs = (await import('flv.js')).default;

        if (flvjs.isSupported() && videoRef.current) {
          const flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: 'http://localhost:5010/stream.flv',
            isLive: true,
            hasAudio: true
          }, {
            enableStashBuffer: false
          });
          
          flvPlayer.attachMediaElement(videoRef.current);
          flvPlayer.load();
          
          // --- FIX STARTS HERE ---
          // play() returns a Promise. We must catch errors to prevent the App crash.
          const playPromise = flvPlayer.play();
          
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              // We explicitly ignore AbortError, as it happens during React cleanup
              if (error.name === 'AbortError') {
                console.log("Stream play aborted (expected during re-renders)");
              } else {
                console.error("Stream play failed:", error);
              }
            });
          }
          // --- FIX ENDS HERE ---
          
          if (mounted) {
            playerRef.current = flvPlayer;
          }
        }
      } catch (err) {
        console.error("Failed to load flv.js", err);
      }
    };

    initPlayer();

    return () => {
      mounted = false;
      if (playerRef.current) {
        // Optional: Pause before destroying to be safe
        playerRef.current.pause(); 
        playerRef.current.unload();
        playerRef.current.detachMediaElement();
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      await fetch('http://localhost:5010/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt })
      });
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Failed to connect to Python backend (Is WSL running?)");
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-yellow-500 font-mono relative overflow-hidden">
      
      {/* Background 'Hazard' Stripes */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 20px, #eab308 20px, #eab308 40px)' }}>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto pt-10 px-4">
        
        {/* Header */}
        <div className="flex items-center justify-center space-x-4 mb-8 border-b-2 border-yellow-500 pb-4">
          <Construction size={40} />
          <h1 className="text-4xl font-black uppercase tracking-widest">
            Prototype <span className="text-white">Zone</span>
          </h1>
          <Construction size={40} />
        </div>

        {/* Video Container */}
        <div className="relative bg-black border-4 border-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.3)] aspect-video mb-6 group">
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain" 
            controls={false} 
            autoPlay 
            muted={false} 
          />
          
          {/* Overlay when loading/idle */}
          <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-xs text-green-400 border border-green-900 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            LIVE FEED: PORT 5056
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-neutral-800 p-6 border-2 border-dashed border-neutral-600 rounded-lg">
          <div className="flex items-center gap-2 mb-2 text-sm text-neutral-400">
            <Terminal size={16} />
            <span>COMMAND INPUT</span>
          </div>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter text to initialize LipSync..."
              className="flex-1 bg-black border border-yellow-700 text-white p-4 focus:outline-none focus:border-yellow-400 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`px-8 py-4 font-bold uppercase tracking-wider transition-all
                ${isGenerating 
                  ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed' 
                  : 'bg-yellow-600 hover:bg-yellow-500 text-black hover:shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                }`}
            >
              {isGenerating ? 'Processing...' : <Send size={20} />}
            </button>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-xs text-neutral-500">
            <AlertTriangle size={14} className="text-yellow-600" />
            <p>WARNING: Model initialization may cause latency. Backend must be active in WSL.</p>
          </div>
        </div>
      </div>
    </div>
  );
}