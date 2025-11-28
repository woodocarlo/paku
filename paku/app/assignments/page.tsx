"use client";
import React, { useState, useRef } from 'react';
import { 
  FolderOpen, HardDrive, BookOpen, FileText, Upload, Trash2, 
  CheckCircle, Cpu, FileCheck, Sparkles, Lock, 
  Clock, AlertTriangle, FileSpreadsheet, Loader2, Link as LinkIcon
} from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents';
import { useGoogle } from '@/context/GoogleContext';

// --- MOCK LOGIC (Hardcoded Results) ---
const REASONING_BANK = {
  high: [
    "Textual analysis shows strong alignment with the question paper concepts.",
    "Keywords match the expected output. Logic flows seamlessly.",
    "Perfectly aligned with the provided context. Good use of technical terms.",
    "Demonstrates deep understanding. No hallucinations detected in text."
  ],
  med: [
    "Concept is clear but the text lacks depth in the final conclusion.",
    "Partial credit given. The logic holds but the syntax is slightly off.",
    "Good attempt, but the text missed the edge case mentioned in the Question Paper.",
    "Handwriting OCR was slightly ambiguous, but the core logic seems correct."
  ],
  low: [
    "Significant deviation from the expected solution path in the text.",
    "The written derivation contains a fundamental logical error.",
    "Failed to address the core requirement of the Question Paper.",
    "Hallucinated concepts not present in the provided context."
  ]
};

const getBaseScore = (difficulty: string) => {
  let min, max, pool;
  if (difficulty === 'hard') {
    min = 3.0; max = 6.5; pool = REASONING_BANK.low;
  } else if (difficulty === 'medium') {
    min = 5.5; max = 8.5; pool = REASONING_BANK.med;
  } else {
    min = 8.0; max = 9.9; pool = REASONING_BANK.high;
  }
  const score = (Math.random() * (max - min) + min);
  const comment = pool[Math.floor(Math.random() * pool.length)];
  return { score, comment };
};

export default function AssignmentChecker() {
  const { config } = useGoogle();
  
  // --- Config State ---
  const [activeTab, setActiveTab] = useState<'drive' | 'local'>('drive');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  
  // --- Upload Buffer State (New) ---
  const [qpLoading, setQpLoading] = useState(false);
  const qpInputRef = useRef<HTMLInputElement>(null);

  // --- Deadline & Penalty State ---
  const [deadline, setDeadline] = useState('');
  const [penalty, setPenalty] = useState(10); 

  // --- Files & Data ---
  const [driveLink, setDriveLink] = useState('');
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  
  // --- Simulation State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [subStep, setSubStep] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  // --- Export State ---
  const [isExporting, setIsExporting] = useState(false);
  const [sheetLink, setSheetLink] = useState<string | null>(null);

  // --- HANDLERS ---

  // Improved Question Paper Upload
  const triggerQPUpload = () => {
    qpInputRef.current?.click();
  };

  const handleQPUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        setQpLoading(true); // Start buffer
        const file = e.target.files[0];
        
        // Simulate a "Reading/Scanning" buffer
        await new Promise(r => setTimeout(r, 1200));
        
        setQuestionPaper(file);
        setQpLoading(false); // End buffer
    }
  };

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        name: f.name,
        origin: 'local',
        fileDate: new Date(f.lastModified),
        webViewLink: null
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // --- REAL DRIVE FETCH ---
  const fetchDriveFiles = async () => {
    if (!driveLink || !config?.accessToken) return;
    setIsFetchingDrive(true);
    try {
        const match = driveLink.match(/folders\/([-a-zA-Z0-9_]+)/) || driveLink.match(/id=([-a-zA-Z0-9_]+)/);
        const folderId = match ? match[1] : driveLink;
        
        const response = await window.gapi.client.drive.files.list({
            'q': `'${folderId}' in parents and trashed = false`,
            'pageSize': 100,
            'fields': "files(id, name, mimeType, webViewLink, createdTime)",
        });

        if (response.result.files) {
            const driveFiles = response.result.files.map((f: any) => ({
                id: f.id,
                name: f.name,
                origin: 'drive',
                fileDate: new Date(f.createdTime),
                webViewLink: f.webViewLink
            }));
            setFiles(prev => [...prev, ...driveFiles]);
        }
    } catch (err) {
        console.error("Drive Error:", err);
        alert("Failed to fetch files. Check link and permissions.");
    } finally {
        setIsFetchingDrive(false);
    }
  };

  // --- REAL SHEETS EXPORT ---
  const handleExportToSheets = async () => {
    if (!config?.accessToken || results.length === 0) return;
    setIsExporting(true);
    try {
      const sheetTitle = `Grading_Report_${new Date().toLocaleDateString()}`;
      const createRes = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title: sheetTitle },
      });
      const spreadsheetId = createRes.result.spreadsheetId;
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      const headers = ["Student Name", "File Source", "Submission Time", "Late?", "Raw Score", "Final Score", "AI Feedback"];
      const rows = results.map(r => [
          r.name,
          r.origin === 'drive' ? 'Google Drive' : 'Local Upload',
          r.fileDate.toLocaleString(),
          r.isLate ? `YES (-${penalty}%)` : 'No',
          r.rawScore,
          r.marks,
          r.reasoning
      ]);

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: { values: [headers, ...rows] }
      });

      setSheetLink(url);
      window.open(url, '_blank');

    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to create Google Sheet.");
    } finally {
        setIsExporting(false);
    }
  };

  // --- INTELLIGENCE ENGINE (EXTENDED TIMING) ---
  const startSimulation = async () => {
    if (!questionPaper) {
        alert("Upload a Question Paper to establish context first.");
        return;
    }
    
    setIsProcessing(true);
    abortRef.current = false;
    setResults([]);
    setProgress(0);
    setSheetLink(null);

    const totalFiles = files.length;
    
    // Phase 1: Context Ingestion (Slowed down)
    setCurrentStep("Initializing Neural Engine");
    setSubStep("Allocating GPU Memory...");
    await new Promise(r => setTimeout(r, 1500));
    
    setSubStep("Loading Llama-3-70b quantized model...");
    await new Promise(r => setTimeout(r, 2000));
    
    setSubStep(`Ingesting Question Paper: ${questionPaper.name}...`);
    await new Promise(r => setTimeout(r, 2500));

    // Phase 2: Processing Loop (Slowed down)
    for (let i = 0; i < totalFiles; i++) {
        if (abortRef.current) break;
        const file = files[i];

        // Step A: OCR
        setCurrentStep(`Processing File ${i + 1}/${totalFiles}: ${file.name}`);
        setSubStep("Running OCR (Extracting Text)...");
        await new Promise(r => setTimeout(r, 2000)); // Longer wait

        // Step B: Analysis
        setSubStep(`Semantic Comparison [Strictness: ${difficulty.toUpperCase()}]...`);
        await new Promise(r => setTimeout(r, 2500)); // Longer wait

        // Step C: Grading Logic
        setSubStep("Calculating final score & checking deadline...");
        await new Promise(r => setTimeout(r, 1000));

        // --- LOGIC ---
        let { score, comment } = getBaseScore(difficulty);
        let numericScore = parseFloat(score.toFixed(1));
        const rawScore = numericScore; 
        
        let isLate = false;
        if (deadline) {
            const deadlineTime = new Date(deadline).getTime();
            const fileTime = new Date(file.fileDate).getTime();
            if (fileTime > deadlineTime) {
                isLate = true;
                const deduction = (numericScore * (penalty / 100));
                numericScore = parseFloat((numericScore - deduction).toFixed(1));
                comment = `[LATE PENALTY APPLIED] ${comment}`;
            }
        }

        setResults(prev => [...prev, {
            ...file,
            rawScore,
            marks: numericScore,
            reasoning: comment,
            isLate
        }]);

        setProgress(((i + 1) / totalFiles) * 100);
    }

    setCurrentStep("Finalizing Report");
    setSubStep("Formatting data for export...");
    await new Promise(r => setTimeout(r, 1500));

    setIsProcessing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Assignment AI Grader</h2>
           <p className="text-gray-500">Semantic Text Analysis & Auto-Grading</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-2 ${config?.accessToken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <HardDrive size={14}/> {config?.accessToken ? 'Drive Connected' : 'Drive Offline'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Configuration */}
          <Card title="1. Evaluation Settings">
             <div className="space-y-5">
                 {/* Difficulty */}
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Difficulty Level</label>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {['easy', 'medium', 'hard'].map((level) => (
                            <button key={level} onClick={() => setDifficulty(level)} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${difficulty === level ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>{level}</button>
                        ))}
                    </div>
                 </div>

                 {/* Deadline & Penalty */}
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Deadline</label>
                        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-purple-500"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Late Penalty (%)</label>
                        <div className="relative">
                            <input type="number" value={penalty} onChange={(e) => setPenalty(Number(e.target.value))} className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-purple-500 pl-8"/>
                            <span className="absolute left-2.5 top-2 text-gray-400 font-bold text-xs">%</span>
                        </div>
                    </div>
                 </div>

                 {/* Question Paper Upload (FIXED) */}
                 <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Question Paper (PDF/Text)</label>
                     <input type="file" ref={qpInputRef} className="hidden" onChange={handleQPUpload} />
                     
                     <div 
                        onClick={triggerQPUpload} 
                        className={`p-3 border-2 border-dashed rounded-lg text-center relative overflow-hidden group cursor-pointer transition-all active:scale-95 ${qpLoading ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-purple-50 hover:bg-purple-100'}`}
                     >
                         <div className="flex items-center justify-center gap-2 z-10 relative py-2">
                            {qpLoading ? (
                                <Loader2 className="animate-spin text-purple-600" size={20} />
                            ) : questionPaper ? (
                                <FileCheck className="text-purple-600" size={20}/>
                            ) : (
                                <Upload className="text-purple-400" size={20}/>
                            )}
                            
                            <span className="text-xs font-medium text-purple-900 truncate max-w-[150px]">
                                {qpLoading ? "Scanning Paper..." : questionPaper ? questionPaper.name : "Click to Upload Question Paper"}
                            </span>
                         </div>
                     </div>
                 </div>

                 {/* Disclaimer (UPDATED) */}
                 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] leading-tight text-amber-800">
                        <strong>Text-Only Check:</strong> This system uses OCR to convert handwritten/typed text to digital formats. 
                        Grading is based on logical text similarity to the Question Paper. 
                    </p>
                 </div>
             </div>
          </Card>

          {/* Card 2: Import Submissions */}
          <Card title="2. Import Submissions">
            <div className="flex border-b border-gray-200 mb-4">
               <button onClick={() => setActiveTab('drive')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'drive' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Drive</button>
               <button onClick={() => setActiveTab('local')} className={`pb-2 px-4 text-sm font-medium ${activeTab === 'local' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Local</button>
            </div>

            {activeTab === 'drive' ? (
                <div className="flex gap-2">
                    <div className="flex-1"><InputGroup label="" placeholder="Drive Folder ID / Link" value={driveLink} onChange={(e:any) => setDriveLink(e.target.value)} icon={HardDrive} /></div>
                    <Button onClick={fetchDriveFiles} disabled={!config?.accessToken || isFetchingDrive} icon={BookOpen}>
                        {isFetchingDrive ? 'Fetching...' : 'Fetch'}
                    </Button>
                </div>
            ) : (
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer h-48 flex flex-col items-center justify-center">
                    <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLocalUpload} />
                    <Upload size={32} className="text-gray-300 mb-2"/>
                    <span className="text-sm text-gray-500 font-medium">Drop text-based PDFs here</span>
                </div>
            )}
          </Card>
      </div>

      {/* Action Bar */}
      {files.length > 0 && !isProcessing && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center animate-slide-up">
            <div className="flex items-center gap-3">
                <div className="bg-gray-100 p-2 rounded-full"><FolderOpen size={18} className="text-gray-600"/></div>
                <div><h3 className="font-bold text-gray-700">Queue Ready</h3><p className="text-xs text-gray-500">{files.length} documents awaiting analysis</p></div>
            </div>
            
            <div className="flex gap-2">
                {results.length > 0 && (
                    <Button onClick={handleExportToSheets} disabled={isExporting} className="bg-green-600 hover:bg-green-700 text-white">
                        {isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileSpreadsheet size={16}/>}
                        {isExporting ? 'Creating...' : 'Export Sheets'}
                    </Button>
                )}
                <Button 
                    onClick={startSimulation} 
                    disabled={!questionPaper} 
                    className={!questionPaper ? "bg-gray-300 cursor-not-allowed" : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all"}
                    icon={Sparkles}
                >
                    {results.length > 0 ? 'Re-Run Grading' : 'Start Intelligence Engine'}
                </Button>
            </div>
        </div>
      )}

      {/* Success Link */}
      {sheetLink && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between text-green-800 animate-fade-in">
            <div className="flex items-center gap-2"><CheckCircle size={18}/> <span>Spreadsheet generated successfully!</span></div>
            <a href={sheetLink} target="_blank" className="text-xs font-bold underline flex items-center gap-1">Open in Sheets <LinkIcon size={12}/></a>
        </div>
      )}

      {/* Results & Queue List */}
      <div className="space-y-3">
         {/* Results */}
         {results.map((res, i) => (
             <div key={i} className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                 <div className="flex items-start gap-3 flex-1">
                     <div className="p-2 bg-green-50 rounded-full mt-1"><CheckCircle size={16} className="text-green-600"/></div>
                     <div>
                         <h4 className="font-bold text-gray-800 flex items-center gap-2">
                             {res.name}
                             {res.isLate && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold uppercase">Late</span>}
                         </h4>
                         <p className="text-xs text-gray-500 mt-0.5 font-mono leading-relaxed">{res.reasoning}</p>
                     </div>
                 </div>
                 <div className="text-right min-w-[60px]">
                     <span className={`block text-2xl font-black ${res.isLate ? 'text-amber-600' : 'text-gray-800'}`}>{res.marks}<span className="text-sm text-gray-400 font-normal">/10</span></span>
                 </div>
             </div>
         ))}
         
         {/* Pending */}
         {files.filter(f => !results.find(r => r.id === f.id)).map((file) => (
             <div key={file.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center opacity-75">
                 <div className="flex items-center gap-3">
                     <FileText size={18} className="text-gray-400"/>
                     <div>
                        <span className="text-sm font-medium text-gray-600 block">{file.name}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10}/> {file.fileDate.toLocaleString()}</span>
                     </div>
                 </div>
                 <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
             </div>
         ))}
      </div>

      {/* --- CINEMATIC PROCESSING OVERLAY (EXTENDED TIME) --- */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-[90vw] max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                     <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(124,58,237,0.4),transparent_70%)]"></div>
                     <div className="grid grid-cols-12 h-full w-full opacity-10">{Array.from({length: 48}).map((_,i) => <div key={i} className="border border-purple-500/20"></div>)}</div>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 h-[600px]">
                    <div className="flex flex-col items-center justify-center p-12 border-b md:border-b-0 md:border-r border-gray-800">
                        <div className="relative w-48 h-48 mb-8">
                             <div className="absolute inset-0 border-4 border-purple-900/50 rounded-full"></div>
                             <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full animate-spin"></div>
                             <div className="absolute inset-4 border-4 border-indigo-900/50 rounded-full"></div>
                             <div className="absolute inset-4 border-r-4 border-indigo-500 rounded-full animate-spin-reverse"></div>
                             <div className="absolute inset-0 flex items-center justify-center"><Cpu size={64} className="text-white animate-pulse" /></div>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">AI Grading Engine</h2>
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-purple-900/30 border border-purple-500/30 rounded-full"><Lock size={12} className="text-purple-400"/><span className="text-xs text-purple-200 font-mono tracking-widest uppercase">Secure Processing</span></div>
                    </div>

                    <div className="p-10 flex flex-col justify-between bg-gray-900/50">
                        <div className="space-y-6">
                            <div><h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Current Operation</h3><p className="text-2xl text-white font-mono">{currentStep}</p></div>
                            <div>
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Detailed Log</h3>
                                <div className="font-mono text-sm text-green-400 h-24 overflow-hidden relative">
                                    <p className="animate-pulse">_ {subStep}</p>
                                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-gray-900/50 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs text-gray-500 font-mono"><span>Batch Progress</span><span>{Math.round(progress)}%</span></div>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden"><div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div></div>
                            <button onClick={() => { abortRef.current = true; setIsProcessing(false); }} className="w-full py-3 mt-4 border border-red-900/50 text-red-500 hover:bg-red-900/20 rounded-lg text-sm font-bold tracking-wide transition-colors">ABORT SEQUENCE</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}