import React from 'react';
import { CheckCircle2, ChevronRight, ListCollapse, Database, RefreshCw } from 'lucide-react';

export default function Cleaning({ uploadData, isCleaning, onProceedToAnalyze }) {
  if (!uploadData) return null;
  
  const report = uploadData.validation_report;
  
  // Calculate cleaned projection metrics
  const afterRows = report.total_rows - report.duplicate_rows;
  const afterMissing = 0;
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">Data Cleaning</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">Automated preprocessing pipeline logs and side-by-side details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Before vs After metrics */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white">Cohort Statistics Comparison</h3>
            
            <div className="space-y-3">
              {/* Row Counts */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Row Count</span>
                  <span className="text-white">{report.total_rows} ➔ {afterRows}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(afterRows / report.total_rows) * 100}%` }}></div>
                </div>
              </div>

              {/* Missing Values */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Missing Values</span>
                  <span className="text-white">{report.total_missing} ➔ {afterMissing}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${report.total_missing > 0 ? 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Duplicates */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-500">Duplicates</span>
                  <span className="text-white">{report.duplicate_rows} ➔ 0</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${report.duplicate_rows > 0 ? 100 : 0}%` }}></div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right: Cleaning Logs / Steps */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ListCollapse className="h-4.5 w-4.5 text-indigo-500" />
              <span>Pipeline Process Logs</span>
            </h3>
            
            <div className="space-y-3 font-medium">
              {[
                { title: "Duplicates Removal", log: report.duplicate_rows > 0 ? `Dropped ${report.duplicate_rows} redundant rows to normalize variance.` : "Verified dataset. No redundant rows found." },
                { title: "Missing Imputation", log: report.total_missing > 0 ? `Imputed ${report.total_missing} missing inputs (numerical: median, categorical: mode).` : "Dataset complete. No missing variables detected." },
                { title: "Outlier Capping", log: "Scanned numerical distributions. Trimming out boundary anomalies beyond 3 standard deviations." },
                { title: "Variable Standardization", log: "Encoded string parameters and scaled numeric inputs to [0, 1] range to avoid classifier weight bias." }
              ].map((step, idx) => (
                <div key={idx} className="flex gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <div className="p-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full h-max">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200">{step.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{step.log}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Action panel */}
      <div className="flex justify-between items-center bg-slate-900/10 p-4 border border-slate-200 dark:border-slate-800 rounded-xl mt-6">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700 dark:text-slate-200">Pre-processing and Clean Phase Completed</p>
          <p className="text-[10px] text-slate-400">Trigger multi-model ML classifier comparison and feature correlations mapping.</p>
        </div>
        <button
          onClick={onProceedToAnalyze}
          disabled={isCleaning}
          className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-5 py-3 rounded-lg shadow-md cursor-pointer transition-all disabled:opacity-50"
        >
          {isCleaning ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Training Models...</span>
            </>
          ) : (
            <>
              <span>Run EDA & Predict</span>
              <ChevronRight className="h-4.5 w-4.5" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}
