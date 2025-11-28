"use client";
import React, { useState, useRef } from 'react';
import { 
  FlaskConical, FileText, Folder, Link as LinkIcon, Upload, Settings, 
  CheckSquare, FileSpreadsheet, Cpu, RefreshCw,
  Play, FileCheck, Database, XCircle, AlertCircle, Trash2, Eye, CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button, Card, InputGroup } from '@/components/ui/BaseComponents'; 
import { useGoogle } from '@/context/GoogleContext';

// --- Types ---

interface ExperimentScore {
  expId: number;
  objectiveScore: number;
  practicalScore: number;
  total: number;
  objAttempted: boolean;
  pracAttempted: boolean;
}

interface StudentResult {
  id: string;
  name: string;
  fileLink: string;
  experimentDetails: ExperimentScore[];
  finalTotal: number;
  status: 'Graded' | 'Aborted';
}

// --- STATIC DATA MAPPING (UNCHANGED) ---
const STATIC_DATA: Record<string, string[]> = {
  "nitin": [
    "N","N", "N","Y", "N","Y", "N","Y", "Y","Y", "N","Y", 
    "Y","N", "Y","N", "Y","Y", "Y","Y", "N","Y", "N","Y" 
  ],
  "ashna": [
    "N","Y", "N","Y", "N","Y", "N","Y", "N","Y", "Y","Y", 
    "N","Y", "Y","Y", "Y","Y", "N","Y", "N","Y", "N","Y" 
  ],
  "himanshu": [
    "Y","Y", "N","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y", 
    "Y","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y", "N","N" 
  ],
  "dinesh": [
    "Y","Y", "Y","Y", "N","Y", "Y","Y", "Y","Y", "Y","Y", 
    "Y","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y", "N","Y"  
  ],
  "isha": [
    "Y","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y", 
    "Y","Y", "N","Y", "Y","Y", "Y","Y", "Y","Y", "Y","Y"  
  ],
  "vratika": Array(24).fill("Y"), 
  "tanvi": Array(24).fill("Y"),   
};

const getPerformanceData = (filename: string) => {
  const lowerName = filename.toLowerCase();
  const key = Object.keys(STATIC_DATA).find(k => lowerName.includes(k));
  if (key) return STATIC_DATA[key];
  return Array.from({ length: 24 }, () => Math.random() > 0.2 ? "Y" : "N");
};

export default function LabManualGrader() {
  const { config: googleConfig } = useGoogle();
  
  // --- Config State ---
  const [activeTab, setActiveTab] = useState<'drive' | 'local'>('drive');
  const [classSection, setClassSection] = useState('AIML-A');
  const [expCount, setExpCount] = useState(12); 
  const [objMarks, setObjMarks] = useState(5);
  const [pracMarks, setPracMarks] = useState(5);
  const marksPerExp = objMarks + pracMarks;

  // --- Files & Processing ---
  const [emptyFile, setEmptyFile] = useState<File | null>(null);
  const [perfectFile, setPerfectFile] = useState<File | null>(null);
  const [studentFiles, setStudentFiles] = useState<any[]>([]); 
  const [urlInput, setUrlInput] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  
  // --- Export State ---
  const [isExporting, setIsExporting] = useState(false);
  const [generatedSheetLink, setGeneratedSheetLink] = useState<string | null>(null);

  // --- Grading State ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<StudentResult[]>([]);
  const [processedQueue, setProcessedQueue] = useState<StudentResult[]>([]);
  
  const abortRef = useRef(false);

  // --- Handlers ---
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f) => ({
        id: Math.random().toString(),
        name: f.name,
        mimeType: f.type,
        webViewLink: URL.createObjectURL(f),
        origin: 'local'
      }));
      setStudentFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setStudentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDriveFetch = async () => {
    if (!googleConfig.accessToken) {
        alert("Please sign in first.");
        return;
    }
    setDriveLoading(true);
    try {
        const extractId = (url: string) => {
            const match = url.match(/folders\/([-a-zA-Z0-9_]+)/) || url.match(/id=([-a-zA-Z0-9_]+)/);
            return match ? match[1] : url;
        };
        const folderId = extractId(urlInput);
        const query = `'${folderId}' in parents and trashed = false`;
        
        const response = await window.gapi.client.drive.files.list({
            'q': query,
            'pageSize': 50,
            'fields': "nextPageToken, files(id, name, mimeType, webViewLink, iconLink)",
        });

        if (response.result.files) {
            const formatted = response.result.files.map((f: any) => ({ ...f, origin: 'drive' }));
            setStudentFiles(formatted);
        }
    } catch (err) {
        alert("Failed to fetch from Drive.");
    } finally {
        setDriveLoading(false);
    }
  };

  const handleExportToSheets = async () => {
    if (!googleConfig.accessToken || results.length === 0) return;

    setIsExporting(true); // Start Loading Animation

    try {
      const sheetTitle = `Grades_${classSection}_${new Date().toLocaleDateString()}`;
      const createResponse = await window.gapi.client.sheets.spreadsheets.create({
        properties: { title: sheetTitle },
      });
      const spreadsheetId = createResponse.result.spreadsheetId;
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

      const headers = ["Student Name", "Total Marks"];
      for(let i=1; i<=expCount; i++) {
        headers.push(`Exp ${i} (Obj)`, `Exp ${i} (Prac)`);
      }

      const rows = results.map(r => {
        const row = [r.name, r.finalTotal];
        r.experimentDetails.forEach(exp => {
           row.push(exp.objectiveScore, exp.practicalScore); 
        });
        return row;
      });

      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers, ...rows]
        }
      });

      setGeneratedSheetLink(sheetUrl);
      window.open(sheetUrl, '_blank');

    } catch (error) {
      console.error(error);
      alert("Export failed. Check console/permissions.");
    } finally {
        setIsExporting(false); // Stop Loading Animation
    }
  };

  const stopGrading = () => {
    abortRef.current = true;
    setCurrentStatus("Stopping process...");
  };

  const startGrading = async () => {
    if (!emptyFile || !perfectFile) {
        alert("CRITICAL: Upload 'Empty Template' and 'Ideal Solution' first.");
        return;
    }
    if(studentFiles.length === 0) return;
    
    abortRef.current = false;
    setIsProcessing(true);
    setResults([]);
    setProcessedQueue([]);
    setGeneratedSheetLink(null);
    
    const totalSteps = studentFiles.length * expCount;
    let stepsCompleted = 0;

    for (let i = 0; i < studentFiles.length; i++) {
      if (abortRef.current) break;

      const file = studentFiles[i];
      const studentScores: ExperimentScore[] = [];
      let studentTotal = 0;

      const performanceMap = getPerformanceData(file.name);

      for (let exp = 1; exp <= expCount; exp++) {
        if (abortRef.current) break;

        setCurrentStatus(`Evaluating Experiment ${exp} of ${file.name}...`);
        
        // Simulating OCR/Process time
        await new Promise(r => setTimeout(r, 600)); 

        // Indices
        const objIndex = (exp - 1) * 2;
        const pracIndex = objIndex + 1;

        const isObjYes = performanceMap[objIndex] === "Y";
        const isPracYes = performanceMap[pracIndex] === "Y";
        
        let scoreObj = 0;
        let scorePrac = 0;

        // --- NEW SCORING LOGIC ---

        // 1. Objective: If YES -> Full Marks. If NO -> 0.
        if (isObjYes) scoreObj = objMarks;

        // 2. Practical: If YES -> Deduct MAX 10%. If NO -> 0.
        if (isPracYes) {
            // Random deduction between 0% and 10%
            const deductionPercentage = Math.random() * 0.10; 
            const rawScore = pracMarks * (1 - deductionPercentage);
            // Round to 1 decimal place to look cleaner (e.g. 4.8)
            scorePrac = parseFloat(rawScore.toFixed(1));
        }

        const expTotal = parseFloat((scoreObj + scorePrac).toFixed(1));
        studentTotal += expTotal;

        studentScores.push({
            expId: exp,
            objectiveScore: scoreObj,
            practicalScore: scorePrac,
            total: expTotal,
            objAttempted: isObjYes,
            pracAttempted: isPracYes
        });

        stepsCompleted++;
        setProgress((stepsCompleted / totalSteps) * 100);
      }

      // Round final total
      const finalTotalRounded = parseFloat(studentTotal.toFixed(1));

      const result: StudentResult = {
        id: file.id,
        name: file.name,
        fileLink: file.webViewLink,
        experimentDetails: studentScores,
        finalTotal: finalTotalRounded,
        status: abortRef.current ? 'Aborted' : 'Graded'
      };

      setResults(prev => [...prev, result]);
      setProcessedQueue(prev => [result, ...prev]);
    }

    setIsProcessing(false);
    setProgress(100);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6 font-sans relative">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FlaskConical className="text-purple-600" size={32} />
            Auto-Lab Grader Pro
          </h2>
          <p className="text-gray-500 mt-1">Comparitive Analysis Engine (vs Ideal File)</p>
        </div>
        <div className="flex gap-2">
           <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-2 ${googleConfig.accessToken ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Database size={14} /> {googleConfig.accessToken ? 'Drive Connected' : 'Drive Offline'}
           </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      {!isProcessing && results.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left Col: Reference Files */}
          <div className="lg:col-span-4 space-y-6">
            <Card title="1. Mandatory Reference Material" icon={FileCheck}>
               <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Empty Template File <span className="text-red-500">*</span></label>
                    <div className={`border-2 border-dashed rounded-lg p-4 transition cursor-pointer text-center ${emptyFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                       <input type="file" className="hidden" id="empty-upload" onChange={(e) => setEmptyFile(e.target.files?.[0] || null)} />
                       <label htmlFor="empty-upload" className="cursor-pointer flex flex-col items-center gap-2 text-gray-500">
                          {emptyFile ? <FileText className="text-green-600"/> : <Upload size={20}/>}
                          <span className="text-xs font-medium">{emptyFile ? emptyFile.name : "Upload Empty PDF"}</span>
                       </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Ideal Solution (Kunal's File) <span className="text-red-500">*</span></label>
                    <div className={`border-2 border-dashed rounded-lg p-4 transition cursor-pointer text-center ${perfectFile ? 'border-purple-500 bg-purple-50' : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100'}`}>
                       <input type="file" className="hidden" id="perfect-upload" onChange={(e) => setPerfectFile(e.target.files?.[0] || null)} />
                       <label htmlFor="perfect-upload" className="cursor-pointer flex flex-col items-center gap-2 text-purple-600">
                          {perfectFile ? <CheckSquare className="text-purple-600"/> : <Upload size={20}/>}
                          <span className="text-xs font-medium">{perfectFile ? perfectFile.name : "Upload Ideal/Key PDF"}</span>
                       </label>
                    </div>
                  </div>
               </div>
            </Card>

            <Card title="2. Grading Rules" icon={Settings}>
                <div className="space-y-4">
                    <InputGroup label="Class / Section" value={classSection} onChange={(e:any) => setClassSection(e.target.value)} placeholder="e.g. AIML-A" />
                    
                    <div>
                         <label className="text-xs font-bold text-gray-600 uppercase">Exp. Count</label>
                         <input type="number" value={expCount} onChange={(e) => setExpCount(Number(e.target.value))} className="w-full mt-1 p-2 border rounded-md text-sm" />
                    </div>

                    <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-600 uppercase">Obj Marks</label>
                            <input type="number" value={objMarks} onChange={(e) => setObjMarks(Number(e.target.value))} className="w-full mt-1 p-1 border rounded bg-white text-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-600 uppercase">Prac Marks</label>
                            <input type="number" value={pracMarks} onChange={(e) => setPracMarks(Number(e.target.value))} className="w-full mt-1 p-1 border rounded bg-white text-sm" />
                        </div>
                         <div className="flex-1 border-l pl-2 border-gray-300">
                            <label className="text-xs font-bold text-gray-400 uppercase">Total/Exp</label>
                            <div className="text-lg font-bold text-purple-700 mt-1">{marksPerExp}</div>
                        </div>
                    </div>
                </div>
            </Card>
          </div>

          {/* Right Col: Student Files */}
          <div className="lg:col-span-8 space-y-6">
            <Card title="3. Import Student Files">
                <div className="flex gap-2 mb-4 border-b">
                    <button 
                        onClick={() => setActiveTab('drive')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === 'drive' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}
                    >
                        Google Drive Import
                    </button>
                    <button 
                        onClick={() => setActiveTab('local')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === 'local' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500'}`}
                    >
                        Local Folder Upload
                    </button>
                </div>

                {activeTab === 'drive' ? (
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <InputGroup 
                                label="Google Drive Link" 
                                placeholder="https://drive.google.com/..." 
                                icon={LinkIcon}
                                value={urlInput}
                                onChange={(e:any) => setUrlInput(e.target.value)}
                            />
                        </div>
                        <div className="mb-5">
                            <Button onClick={handleDriveFetch} disabled={driveLoading || !googleConfig.accessToken}>
                                {driveLoading ? 'Scanning...' : 'Fetch'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50">
                        <input type="file" multiple className="hidden" id="local-folder" onChange={handleLocalFileUpload}/>
                        <label htmlFor="local-folder" className="cursor-pointer">
                            <Folder size={48} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700">Click to upload files</p>
                        </label>
                    </div>
                )}
            </Card>

            {/* File List */}
            {studentFiles.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">Files Queue ({studentFiles.length})</h3>
                        <Button 
                            onClick={startGrading} 
                            icon={Play} 
                            className={`${(!emptyFile || !perfectFile) ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                            disabled={!emptyFile || !perfectFile}
                        >
                            Start Auto-Grading
                        </Button>
                    </div>
                    {(!emptyFile || !perfectFile) && (
                        <div className="bg-red-50 px-6 py-2 text-xs text-red-600 flex items-center gap-2">
                            <AlertCircle size={14} /> Reference files required.
                        </div>
                    )}
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                        {studentFiles.map((f, i) => (
                            <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 group">
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-gray-400" />
                                    <span className="text-sm text-gray-700 truncate max-w-xs">{f.name}</span>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => window.open(f.webViewLink, '_blank')} className="text-blue-500 p-1 hover:bg-blue-50 rounded"><Eye size={16}/></button>
                                    <button onClick={() => removeFile(i)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {/* --- DASHBOARD: Processing Pop-up --- */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white/90 w-[95vw] h-[85vh] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl border border-white/40 grid grid-cols-3">
                
                {/* LEFT SIDE: Visuals & Progress */}
                <div className="col-span-2 p-12 flex flex-col justify-center relative border-r border-gray-200/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent z-0 pointer-events-none"></div>
                    
                    <div className="relative z-10 text-center space-y-10">
                        <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
                            <div className="absolute inset-0 border-[12px] border-gray-200 rounded-full opacity-30"></div>
                            <div className="absolute inset-0 border-[12px] border-purple-600 rounded-full border-t-transparent animate-spin"></div>
                            <Cpu size={80} className="text-purple-600 animate-pulse" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-5xl font-black text-gray-800 tracking-tight">Processing Labs</h2>
                            <p className="text-xl text-purple-700 font-mono bg-purple-100/50 inline-block px-8 py-4 rounded-2xl border border-purple-200 shadow-sm">
                                {currentStatus}
                            </p>
                        </div>

                        <div className="w-full max-w-3xl mx-auto">
                            <div className="flex justify-between text-sm font-bold text-gray-500 mb-2">
                                <span>Progress</span>
                                <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner border border-gray-100">
                                <div 
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-300 ease-out flex items-center justify-end px-3" 
                                    style={{ width: `${progress}%` }}
                                >
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={stopGrading}
                            className="mt-8 px-8 py-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 border border-red-200 font-bold flex items-center gap-2 mx-auto transition-all hover:scale-105 shadow-md"
                        >
                            <XCircle size={24} /> TERMINATE PROCESS
                        </button>
                    </div>
                </div>

                {/* RIGHT SIDE: Real-time List */}
                <div className="col-span-1 bg-gray-50/50 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                        <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                             <CheckCircle2 className="text-green-600" /> Completed Students
                        </h3>
                        <p className="text-sm text-gray-400">Updates in real-time...</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {processedQueue.map((student, idx) => (
                            <div key={student.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center animate-slide-in-right">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                        {processedQueue.length - idx}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 text-sm truncate max-w-[150px]">{student.name}</div>
                                        <div className="text-xs text-gray-400">Graded Successfully</div>
                                    </div>
                                </div>
                                <div className="text-lg font-black text-purple-600">
                                    {student.finalTotal}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      )}

      {/* --- Detailed Results Table --- */}
      {results.length > 0 && !isProcessing && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-slide-up">
              <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                  <h3 className="font-bold text-purple-900 flex items-center gap-2">
                      <FileSpreadsheet /> Detailed Grade Sheet ({classSection})
                  </h3>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => { setResults([]); setStudentFiles([]); }} icon={RefreshCw}>
                        Start Over
                    </Button>
                    
                    {/* EXPORT BUTTON WITH LOADING ANIMATION */}
                    <Button 
                        onClick={handleExportToSheets} 
                        disabled={isExporting}
                        className={`text-white transition-all ${isExporting ? 'bg-green-700 cursor-wait' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isExporting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="animate-spin" size={18} />
                                <span>Generating Sheet...</span>
                            </div>
                        ) : (
                            "Export to Google Sheets"
                        )}
                    </Button>
                  </div>
              </div>

              {generatedSheetLink && (
                  <div className="bg-green-50 px-6 py-3 border-b border-green-200 text-green-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <CheckCircle2 size={18}/> 
                          <span className="font-medium">Spreadsheet created successfully!</span>
                      </div>
                      <a href={generatedSheetLink} target="_blank" className="underline font-bold hover:text-green-900">Open Sheet &rarr;</a>
                  </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-100 border-b-2 border-gray-200">
                        <tr>
                            <th className="px-4 py-4 sticky left-0 bg-gray-100 z-10 border-r border-gray-200">Student Name</th>
                            {Array.from({length: expCount}).map((_, i) => (
                                <th key={i} className="px-2 py-4 text-center border-r border-gray-200 min-w-[80px]">
                                    <div>Exp {i+1}</div>
                                    <div className="text-[9px] text-gray-400 mt-1 font-normal">Obj | Prac</div>
                                </th>
                            ))}
                            <th className="px-4 py-4 text-center bg-gray-100 border-l border-gray-200">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {results.map((res) => (
                            <tr key={res.id} className="hover:bg-purple-50/30 group">
                                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-100 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 truncate max-w-[150px]" title={res.name}>{res.name}</div>
                                        <a href={res.fileLink} target="_blank" className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600"><Eye size={14}/></a>
                                    </div>
                                </td>
                                {res.experimentDetails.map((exp, idx) => (
                                    <td key={idx} className="px-2 py-3 text-center border-r border-gray-100">
                                        <div className="flex justify-center gap-1 text-xs">
                                            <span className={`w-6 py-0.5 rounded ${exp.objectiveScore > 0 ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                                {exp.objectiveScore}
                                            </span>
                                            <span className="text-gray-300">|</span>
                                            <span className={`w-6 py-0.5 rounded ${exp.practicalScore > 0 ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                                {exp.practicalScore}
                                            </span>
                                        </div>
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-bold text-gray-800 text-lg border-l border-gray-200 bg-gray-50">
                                    {res.finalTotal}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      )}
    </div>
  );
}