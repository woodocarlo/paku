"use client";
export const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fillBar { from { width: 0%; } to { width: 100%; } }
    @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
    .animate-slide-up { animation: slideUp 0.3s ease-out forwards; }
    .animate-pop-in { animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
    .hover-progress-bar { animation: fillBar 1.5s linear forwards; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
  `}</style>
);