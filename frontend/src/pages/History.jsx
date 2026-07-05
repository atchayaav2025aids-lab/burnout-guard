import React, { useEffect, useState } from 'react';
import { History, Eye, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function HistoryPage({ backendUrl, token, onSelectDataset }) {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/history`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to load history list.");
      }
      setHistoryList(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch history log.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the analysis history for dataset: ${name}? This will delete the raw file and all predictions.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${backendUrl}/api/history/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete history record.");
      }
      setSuccess(`Successfully deleted analysis record: ${name}`);
      fetchHistory(); // Refresh
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to delete history item.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading && historyList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading analysis history logs...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Analysis History Log</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Manage and review previous machine learning prediction runs</p>
        </div>
        <button
          onClick={fetchHistory}
          className="p-2 border border-slate-300 dark:border-slate-800 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 hover:text-white hover:bg-slate-900 transition cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-lg text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-lg text-xs flex items-start gap-2.5">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* History Cards Grid */}
      {historyList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {historyList.map((item) => (
            <div key={item.id} className="card-panel p-5 space-y-4 relative flex flex-col justify-between">
              
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg">
                    <History className="h-4.5 w-4.5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-900 border border-slate-800 text-slate-400">
                    {item.accuracy === "Rule-Based Expert Classifier" ? "Rule-Based" : "ML Model"}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-bold text-slate-200 text-sm truncate" title={item.dataset_name}>
                    {item.dataset_name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Uploaded at: {item.upload_date}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] font-semibold border-t border-slate-200 dark:border-slate-800/80">
                  <div className="text-emerald-500">Low: {item.risk_summary.low}</div>
                  <div className="text-amber-500">Mod: {item.risk_summary.medium || item.risk_summary.moderate || 0}</div>
                  <div className="text-rose-500">High: {item.risk_summary.high}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={() => onSelectDataset(item.id, 'reports')}
                  className="flex-grow flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded cursor-pointer transition shadow"
                >
                  <Eye className="h-4 w-4" />
                  <span>Load Analysis</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.dataset_name)}
                  className="p-2 border border-rose-900/30 hover:bg-rose-500/10 text-rose-400 rounded cursor-pointer transition"
                  title="Delete analysis record"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 italic py-16 text-center card-panel">No past analysis session logs found.</p>
      )}

    </div>
  );
}
