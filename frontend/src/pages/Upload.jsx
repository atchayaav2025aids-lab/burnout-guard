import React, { useState } from 'react';
import { 
  Upload, Database, AlertCircle, FileText, CheckCircle2, 
  HelpCircle, RefreshCw, ChevronRight, CheckSquare, ShieldAlert
} from 'lucide-react';

export default function UploadPage({ backendUrl, token, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadData, setUploadData] = useState(null);
  const [error, setError] = useState(null);

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    const filename = selectedFile.name.toLowerCase();
    if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx") && !filename.endsWith(".xls")) {
      setError("Unsupported format. Please select a CSV or Excel (.xlsx) file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadData(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      if (response.status === 401 || response.status === 410 || response.status === 403) {
        localStorage.removeItem("stress_token");
        localStorage.removeItem("stress_username");
        alert("Your authentication session has expired or the server restarted. Redirecting to login page...");
        window.location.reload();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload and validate dataset.");
      }

      setUploadData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to upload file. Please verify server connection.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToClean = () => {
    if (uploadData) {
      onUploadSuccess(uploadData.dataset_id, uploadData);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">Upload Dataset</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">Ingest employee metrics cohort for clean-up and analysis</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-lg text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Ingest Board */}
      {!uploadData && (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-4 transition ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-500/5' 
              : 'border-slate-300 dark:border-slate-800 bg-slate-900/10 hover:border-slate-400 hover:bg-slate-900/20'
          }`}
        >
          {loading ? (
            <div className="space-y-3">
              <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mx-auto" />
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200">Ingesting and Validating Dataset...</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Checking missing values, duplicates, types, and outliers...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-2xl">
                <Upload className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Drag & drop your cohort file here</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports CSV, Excel (.xlsx, .xls) up to 15MB</p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  id="file-input"
                  onChange={handleChange}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                />
                <label
                  htmlFor="file-input"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md cursor-pointer transition"
                >
                  Browse Files
                </label>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dataset Summary & Preview */}
      {uploadData && (
        <div className="space-y-6">
          {/* Metadata KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="card-panel p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 rounded-lg">
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">File Rows</p>
                <p className="font-black text-white text-base">{uploadData.row_count}</p>
              </div>
            </div>

            <div className="card-panel p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 dark:text-purple-400 rounded-lg">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">File Columns</p>
                <p className="font-black text-white text-base">{uploadData.col_count}</p>
              </div>
            </div>

            <div className="card-panel p-4 flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 rounded-lg">
                <HelpCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Missing Cells</p>
                <p className="font-black text-white text-base">{uploadData.validation_report.total_missing}</p>
              </div>
            </div>

            <div className="card-panel p-4 flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg">
                <AlertCircle className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Duplicate Rows</p>
                <p className="font-black text-white text-base">{uploadData.validation_report.duplicate_rows}</p>
              </div>
            </div>

          </div>

          {/* Validation report alert */}
          <div className={`p-4 rounded-xl border ${
            uploadData.validation_report.is_valid 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <h4 className="font-bold flex items-center gap-1.5 text-xs">
              {uploadData.validation_report.is_valid ? <CheckCircle2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
              <span>Data Validation Status: {uploadData.validation_report.is_valid ? 'Validation Passed' : 'Anomalies Detected'}</span>
            </h4>
            {uploadData.validation_report.consistency_issues.length > 0 ? (
              <ul className="list-disc list-inside mt-2 space-y-1 text-[11px] opacity-90">
                {uploadData.validation_report.consistency_issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] mt-1.5 opacity-90">Columns are consistent with model schema. Ready for preprocessing and cleaning.</p>
            )}
          </div>

          {/* Dataset Schema Types List */}
          <div className="card-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-white">Ingested Variables Schema</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Object.entries(uploadData.data_types).map(([col, dtype]) => (
                <div key={col} className="p-2 rounded bg-slate-900/40 border border-slate-800 text-center">
                  <p className="text-[9px] text-slate-400 font-bold truncate" title={col}>{col}</p>
                  <p className="text-[9px] text-indigo-400 font-mono mt-0.5">{dtype}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Preview rows table */}
          <div className="card-panel p-5 space-y-3">
            <h3 className="text-xs font-bold text-white">Dataset Raw Preview (First 15 Rows)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="custom-table text-[10px]">
                <thead>
                  <tr>
                    {uploadData.columns.map((col) => (
                      <th key={col} className="whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uploadData.preview.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {uploadData.columns.map((col) => (
                        <td key={col} className="whitespace-nowrap text-slate-200">
                          {row[col] === null || row[col] === undefined ? 'N/A' : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Proceed control */}
          <div className="flex justify-between items-center bg-slate-900/10 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-700 dark:text-slate-200">Validate Phase Completed</p>
              <p className="text-[10px] text-slate-400">Click to automatically trigger duplicate removal, missing imputation, and scaling.</p>
            </div>
            <button
              onClick={handleProceedToClean}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-5 py-3 rounded-lg shadow-md cursor-pointer transition-all"
            >
              <span>Proceed to Cleaning</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
