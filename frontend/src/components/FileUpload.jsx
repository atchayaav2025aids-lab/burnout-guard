import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, Shield, ArrowRight } from 'lucide-react';

export default function FileUpload({ onUploadSuccess, modelInfo, backendUrl }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadData, setUploadData] = useState(null); // { session_id, preview, column_mapping_report }
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const validateAndProcessFile = (file) => {
    const filename = file.name.toLowerCase();
    const isExcelOrCsv = filename.endsWith('.csv') || filename.endsWith('.xlsx') || filename.endsWith('.xls');
    
    if (!isExcelOrCsv) {
      setError("Invalid file format. Please upload a CSV or Excel (.xlsx/.xls) file.");
      setFile(null);
      setUploadData(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError("File size exceeds the 10MB limit.");
      setFile(null);
      setUploadData(null);
      return;
    }

    setError(null);
    setFile(file);
    uploadFile(file);
  };

  const uploadFile = async (selectedFile) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload file.");
      }

      const data = await response.json();
      setUploadData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred while uploading the file.");
      setUploadData(null);
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = () => {
    if (uploadData && uploadData.session_id) {
      onUploadSuccess(uploadData.session_id, uploadData.column_mapping_report);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadData(null);
    setError(null);
  };

  // Helper to format category names for UI
  const formatCategory = (name) => {
    return name.replace(/_encoded/g, '').replace(/ \(.*\)/g, '');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* App Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
          Burnout<span className="text-amber-500">Guard</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base text-slate-400">
          AI-powered organizational wellbeing analytics. Upload your team's work-pattern exports to identify burnout risks and rebalance workloads before developer fatigue sets in.
        </p>

        {/* Model Info Banner */}
        {modelInfo && (
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 border border-white/5 text-xs text-slate-300">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${modelInfo.source === 'synthetic' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${modelInfo.source === 'synthetic' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span>
              Model Source: <strong className="text-white capitalize">{modelInfo.source === 'synthetic' ? 'Synthetic Fallback' : 'Real Kaggle Data'}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span>R² Accuracy: <strong className="text-white">{typeof modelInfo.r2_score === 'number' ? (modelInfo.r2_score * 100).toFixed(1) : modelInfo.r2_score}%</strong></span>
          </div>
        )}
      </div>

      {/* Upload Zone & Results Section */}
      {!uploadData ? (
        <div className="glass-panel p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <form 
            onDragEnter={handleDrag}
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center"
          >
            <input
              ref={fileInputRef}
              type="file"
              id="input-file-upload"
              className="hidden"
              multiple={false}
              onChange={handleChange}
              accept=".csv,.xlsx,.xls"
            />
            
            <div 
              className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                dragActive 
                  ? "border-amber-500 bg-amber-500/5" 
                  : "border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60"
              }`}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <div className="p-4 bg-slate-900 rounded-xl border border-white/5 mb-4 text-amber-500">
                <Upload className="h-8 w-8 animate-pulse" />
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1">
                Drag and drop your dataset here
              </h3>
              <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
                Supports CSV, XLSX, and XLS formats up to 10MB.
              </p>
              
              <button 
                type="button" 
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold rounded-lg text-sm transition shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Browse Files
              </button>
            </div>
          </form>

          {loading && (
            <div className="mt-8 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-300">Parsing data and mapping columns...</p>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Upload Error</h4>
                <p className="text-xs text-red-300/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="mt-8 flex items-center justify-center gap-2.5 text-xs text-slate-500 border-t border-slate-800/80 pt-6">
            <Shield className="h-4 w-4 text-emerald-500/80" />
            <span>Privacy Guard: All data is processed entirely in-session and cleared when you close the tab. No persistent database storage.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Mapping Report Panel */}
          <div className="glass-panel p-6 shadow-xl border border-white/5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Data Pre-Check</h2>
                <p className="text-xs text-slate-400">Review column mapping matches before launching predictive analysis.</p>
              </div>
              <button 
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-white/5 transition"
              >
                Upload Different File
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mapped columns */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>MAPPED FEATURES ({Object.keys(uploadData.column_mapping_report.mapped).length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(uploadData.column_mapping_report.mapped).map(([expected, uploaded]) => (
                    <div key={expected} className="px-2.5 py-1 rounded bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300" title={`Uploaded: ${uploaded}`}>
                      <span className="font-semibold text-white">{formatCategory(expected)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing optional/imputed columns */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span>IMPUTED COLUMNS ({uploadData.column_mapping_report.missing.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {uploadData.column_mapping_report.missing.length > 0 ? (
                    uploadData.column_mapping_report.missing.map((missingCol) => (
                      <div key={missingCol} className="px-2.5 py-1 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300" title="This column is missing; median/mode will be imputed.">
                        <span>{formatCategory(missingCol)}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No missing features. Perfect match!</span>
                  )}
                </div>
              </div>

              {/* Unmapped source columns */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <HelpCircle className="h-4 w-4" />
                  <span>IGNORED COLUMNS ({uploadData.column_mapping_report.unmapped.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                  {uploadData.column_mapping_report.unmapped.length > 0 ? (
                    uploadData.column_mapping_report.unmapped.map((colName) => (
                      <div key={colName} className="px-2 py-0.5 rounded bg-slate-900/80 border border-white/5 text-[10px] text-slate-400">
                        <span>{colName}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">No extra columns ignored.</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Warning if many columns missing */}
            {uploadData.column_mapping_report.missing.length > 5 && (
              <div className="mt-5 p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-[11px] text-amber-300">
                <strong>Notice:</strong> Multiple features were missing from your file. The system will auto-impute defaults, but adding designations, resource allocations, or fatigue scores will yield much more accurate burnout predictions.
              </div>
            )}
          </div>

          {/* Dataset Preview Section */}
          <div className="glass-panel p-6 shadow-xl overflow-hidden border border-white/5">
            <h3 className="text-base font-bold text-white mb-4">Dataset Preview (First 10 Rows)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                    {uploadData.preview.length > 0 && Object.keys(uploadData.preview[0]).map((h) => (
                      <th key={h} className="p-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
                  {uploadData.preview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      {Object.values(row).map((val, cellIdx) => (
                        <td key={cellIdx} className="p-3 text-slate-300 max-w-[150px] truncate">
                          {val === null || val === undefined ? (
                            <span className="text-slate-600 italic">null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleStartAnalysis}
              className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold rounded-xl shadow-xl shadow-amber-500/10 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Analyze Burnout Risk</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
