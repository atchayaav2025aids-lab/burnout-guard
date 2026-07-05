import React, { useEffect, useState } from 'react';
import { 
  Users, Smile, AlertTriangle, ShieldAlert, Brain, LineChart, 
  Cpu, Clock, Upload, FileDown, RefreshCw, AlertCircle, HelpCircle, CheckCircle2, Moon
} from 'lucide-react';

export default function Dashboard({ 
  backendUrl, 
  token, 
  onNavigate, 
  onSelectDataset, 
  activeDatasetId, 
  uploadData, 
  onAnalyzeNow 
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [analyzingState, setAnalyzingState] = useState(false);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = activeDatasetId 
        ? `${backendUrl}/api/dashboard?dataset_id=${activeDatasetId}&_t=${Date.now()}` 
        : `${backendUrl}/api/dashboard?_t=${Date.now()}`;
        
      const response = await fetch(url, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const stats = await response.json();
      if (!response.ok) {
        throw new Error(stats.detail || "Failed to load dashboard statistics.");
      }
      setData(stats);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [activeDatasetId]);

  const handleAnalyzeNow = async () => {
    setAnalyzingState(true);
    setSuccessMsg(null);
    try {
      await onAnalyzeNow();
      setSuccessMsg("Analysis Completed Successfully");
      fetchDashboardStats();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingState(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading dashboard analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-start gap-3 p-4 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-lg text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h4 className="font-bold">Dashboard Error</h4>
            <p className="mt-1">{error}</p>
            <button onClick={fetchDashboardStats} className="mt-3 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded font-semibold cursor-pointer">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback structure
  const kpis = data || {
    has_data: false,
    total_employees: 0,
    avg_stress_score: 0,
    overall_stress_risk_pct: 0,
    risk_distribution: { low: 0, medium: 0, high: 0 },
    model_accuracy: "N/A",
    last_upload_time: "N/A",
    recent_uploads: [],
    recent_reports: []
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-lg text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[10px] text-emerald-400 hover:text-white cursor-pointer font-bold px-2">Dismiss</button>
        </div>
      )}

      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Workspace Dashboard</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {activeDatasetId 
              ? `Active Dataset: ${kpis.active_dataset_name || 'Selected Cohort'}` 
              : 'No dataset loaded.'}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 py-2.5 rounded-lg shadow-md cursor-pointer transition-all"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Dataset</span>
          </button>
          
          <button
            onClick={() => onNavigate('reports')}
            disabled={!kpis.has_data}
            className={`flex items-center gap-2 border text-white font-bold px-4 py-2.5 rounded-lg transition ${
              kpis.has_data 
                ? 'bg-slate-950 border-white/10 hover:bg-slate-800 cursor-pointer' 
                : 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title={kpis.has_data ? "View Executive HR Reports" : "Download report is disabled until analysis is complete"}
          >
            <FileDown className="h-4 w-4" />
            <span>HR Reports</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Employees */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Employees</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {activeDatasetId ? kpis.total_employees : 0} Employees
            </h3>
          </div>
        </div>

        {/* High Stress Count */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">High Stress Employees</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? kpis.risk_distribution.high : 0} High
            </h3>
          </div>
        </div>

        {/* Moderate Stress Count */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Moderate Stress Employees</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? kpis.risk_distribution.medium : 0} Moderate
            </h3>
          </div>
        </div>

        {/* Low Stress Count */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Low Stress Employees</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? kpis.risk_distribution.low : 0} Low
            </h3>
          </div>
        </div>

        {/* Average Working Hours */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Working Hours</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? `${kpis.avg_working_hours} hrs/day` : '0 hrs/day'}
            </h3>
          </div>
        </div>

        {/* Average Sleep Hours */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Moon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Sleep Hours</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? `${kpis.avg_sleep_hours} hrs/day` : '0 hrs/day'}
            </h3>
          </div>
        </div>

        {/* Average Stress Score */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Average Stress Score</p>
            <h3 className="text-2xl font-black text-white mt-1">
              {kpis.has_data ? `${kpis.avg_stress_score}%` : '0%'}
            </h3>
          </div>
        </div>

        {/* Model Accuracy */}
        <div className="card-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-lg">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Model Accuracy</p>
            <h3 className="text-xs font-black text-white mt-2 truncate" title={kpis.model_accuracy}>
              {activeDatasetId ? kpis.model_accuracy : 'N/A'}
            </h3>
          </div>
        </div>

      </div>

      {/* Conditionally render if no dataset is active */}
      {!activeDatasetId && (
        <div className="card-panel p-8 text-center space-y-4 max-w-2xl mx-auto">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto" />
          <h2 className="text-base font-bold text-white">No dataset loaded.</h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
            Please upload a new workforce CSV/Excel cohort or choose an existing dataset from the uploads log below to begin stress risk profiling.
          </p>
        </div>
      )}

      {/* Conditionally render if dataset is loaded but pending analysis */}
      {activeDatasetId && !kpis.has_data && (
        <div className="space-y-6">
          {/* Analyze Now Banner */}
          <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <AlertCircle className="h-5 w-5" />
              <span>This dataset has not been analyzed yet.</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              You have successfully loaded the cohort "{kpis.active_dataset_name || 'Selected Cohort'}". Run the predictive machine learning models to clean the variables, run stress classifications, and generate metrics report cards.
            </p>
            <button
              onClick={handleAnalyzeNow}
              disabled={analyzingState}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow disabled:opacity-50"
            >
              {analyzingState ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Dataset...</span>
                </>
              ) : (
                <span>Analyze Now</span>
              )}
            </button>
          </div>

          {/* Raw Preview Details (loaded from uploadData props) */}
          {uploadData && (
            <div className="space-y-6">
              {/* Variable pills */}
              <div className="card-panel p-5 space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Ingested Variables Schema</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {Object.entries(uploadData.data_types || {}).map(([col, dtype]) => (
                    <div key={col} className="p-2 rounded bg-slate-900/40 border border-slate-800 text-center">
                      <p className="text-[9px] text-slate-400 font-bold truncate" title={col}>{col}</p>
                      <p className="text-[9px] text-indigo-400 font-mono mt-0.5">{dtype}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Preview Table */}
              <div className="card-panel p-5 space-y-3">
                <h3 className="text-xs font-bold text-white">Dataset Raw Preview (First 15 Rows)</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="custom-table text-[10px]">
                    <thead>
                      <tr>
                        {(uploadData.columns || []).map((col) => (
                          <th key={col} className="whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(uploadData.preview || []).map((row, rIdx) => (
                        <tr key={rIdx}>
                          {(uploadData.columns || []).map((col) => (
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
            </div>
          )}
        </div>
      )}

      {/* Uploads and Reports lists details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Dataset Uploads */}
        <div className="card-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Recent Uploaded Cohorts</h3>
          {kpis.recent_uploads.length > 0 ? (
            <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto pr-1">
              {kpis.recent_uploads.map((up) => (
                <div key={up.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">{up.filename}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{up.rows} rows • {up.cols} cols • {up.uploaded_at}</p>
                  </div>
                  <button
                    onClick={() => onSelectDataset(up.id, 'dashboard')}
                    className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded cursor-pointer transition text-[10px]"
                  >
                    Load Dataset
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic py-8 text-center">No uploaded datasets found.</p>
          )}
        </div>

        {/* Recent Reports / Analyses */}
        <div className="card-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">Recent Analyses Run</h3>
          {kpis.recent_reports.length > 0 ? (
            <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto pr-1">
              {kpis.recent_reports.map((rep) => {
                const hasAnalysis = true; // By definition these in recent_reports list exist
                return (
                  <div key={rep.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{rep.dataset_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Average stress: {rep.average_score}% • {rep.accuracy} • {rep.upload_date}</p>
                    </div>
                    <button
                      onClick={() => onSelectDataset(rep.id, 'reports')}
                      disabled={!hasAnalysis}
                      className="px-2.5 py-1 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold rounded cursor-pointer transition text-[10px]"
                    >
                      View Result
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 italic py-8 text-center">No analysis available for this dataset.</p>
          )}
        </div>

      </div>

    </div>
  );
}
