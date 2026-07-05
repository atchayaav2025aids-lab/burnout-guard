import React, { useEffect, useState } from 'react';
import { 
  FileText, FileDown, CheckCircle2, ShieldAlert, 
  HelpCircle, AlertCircle, RefreshCw, Search, Filter, Cpu, Database
} from 'lucide-react';

export default function Reports({ 
  datasetId, 
  backendUrl, 
  token, 
  analysisData, 
  onAnalyzeNow 
}) {
  const [data, setData] = useState(analysisData || null);
  const [loading, setLoading] = useState(!analysisData && datasetId);
  const [error, setError] = useState(null);
  const [analyzingState, setAnalyzingState] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Search & filter states for Employee Risk Table
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');

  const fetchAnalysisDetails = async () => {
    if (!datasetId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/history/${datasetId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const resData = await response.json();
      if (response.status === 404) {
        // Dataset exists but has not been analyzed yet
        setData(null);
      } else if (!response.ok) {
        throw new Error(resData.detail || "Failed to load report summary.");
      } else {
        setData(resData);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to fetch report summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (analysisData) {
      setData(analysisData);
      setLoading(false);
    } else {
      fetchAnalysisDetails();
    }
  }, [datasetId, analysisData]);

  const handleAnalyzeNow = async () => {
    setAnalyzingState(true);
    setSuccessMsg(null);
    try {
      await onAnalyzeNow();
      setSuccessMsg("Analysis Completed Successfully");
      fetchAnalysisDetails();
    } catch (err) {
      console.error(err);
      setError(err.message || "Analysis pipeline failed.");
    } finally {
      setAnalyzingState(false);
    }
  };

  const downloadFile = async (format, fileExtension) => {
    try {
      const response = await fetch(`${backendUrl}/api/report/download/${format}?dataset_id=${datasetId}`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Download failed.");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Stress_Risk_Report_${data?.summary?.dataset_name?.replace('.csv', '') || 'Cohort'}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setSuccessMsg("Report Generated Successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to download file. Please try again.");
    }
  };

  if (!datasetId) {
    return (
      <div className="p-6 text-center text-slate-400 italic text-xs card-panel max-w-xl mx-auto mt-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
        <h3 className="font-bold text-white text-sm">No dataset loaded.</h3>
        <p className="text-slate-400">Please upload a dataset or select an existing cohort from the Dashboard to access reports.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Compiling executive report details...</p>
      </div>
    );
  }

  // Render "Analyze Now" banner if dataset is loaded but not yet analyzed
  if (!data) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white">Executive Report</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Polished cohort analysis briefs and download options</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-lg text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>This dataset has not been analyzed yet.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            You cannot view analysis reports or download documents for this cohort yet. Run the predictive models first to calculate employee stress risk metrics.
          </p>
          <button
            onClick={handleAnalyzeNow}
            disabled={analyzingState}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow disabled:opacity-50"
          >
            {analyzingState ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Running Analysis Pipeline...</span>
              </>
            ) : (
              <span>Analyze Now</span>
            )}
          </button>
        </div>

        {/* Disabled Download Panel Mockup for Aesthetics */}
        <div className="card-panel p-5 opacity-40 select-none pointer-events-none space-y-3">
          <h3 className="font-bold text-white text-xs">Download Options</h3>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 bg-slate-900 border border-white/5 text-slate-600 font-bold px-3.5 py-2 rounded-lg">
              <FileDown className="h-4 w-4" />
              <span>Excel Sheet</span>
            </button>
            <button className="flex items-center gap-1.5 bg-slate-900 border border-white/5 text-slate-600 font-bold px-3.5 py-2 rounded-lg">
              <FileDown className="h-4 w-4" />
              <span>CSV File</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const s = data.summary;
  const employees = data.employees || [];
  const dist = s.risk_distribution || { low: 0, medium: 0, high: 0 };
  const totalEmployees = s.total_developers || employees.length || 1;

  // Filter employees for Employee Risk Table
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    const matchesRisk = riskFilter === 'All' || emp.risk_level === riskFilter;
    
    return matchesSearch && matchesDept && matchesRisk;
  });

  const departments = ['All', ...new Set(employees.map(emp => emp.department))];

  const getRiskColor = (level) => {
    if (level === 'High' || level === 'Severe') return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    if (level === 'Moderate' || level === 'Medium') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Executive Report</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Polished cohort analysis briefs and download options</p>
        </div>
        
        {/* Download Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadFile('excel', 'xlsx')}
            className="flex items-center gap-1.5 bg-slate-950 border border-white/10 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg cursor-pointer transition"
          >
            <FileDown className="h-4 w-4 text-slate-400" />
            <span>Excel Sheet</span>
          </button>
          <button
            onClick={() => downloadFile('csv', 'csv')}
            className="flex items-center gap-1.5 bg-slate-950 border border-white/10 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg cursor-pointer transition"
          >
            <FileDown className="h-4 w-4 text-slate-400" />
            <span>CSV File</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Summaries */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dataset Info & Preprocessing Summary */}
          <div className="card-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Database className="h-4.5 w-4.5 text-indigo-400" />
              <span>Dataset & Preprocessing Summary</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Filename</p>
                <p className="text-xs font-bold text-white mt-1 truncate" title={s.dataset_name}>{s.dataset_name}</p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Total Rows</p>
                <p className="text-base font-black text-white mt-0.5">{totalEmployees} Rows</p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Missing Imputed</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">Yes (100% Clear)</p>
              </div>
              <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
                <p className="text-[9px] text-slate-400 uppercase font-bold">Duplicates Removed</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">Yes</p>
              </div>
            </div>
          </div>

          {/* ML Model Performance Summary */}
          <div className="card-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Cpu className="h-4.5 w-4.5 text-indigo-400" />
              <span>Model Classifier Evaluation Summary</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg">
                <p className="text-[9px] text-indigo-400 font-bold uppercase">Classifier Model</p>
                <p className="text-xs font-bold text-white mt-1.5 truncate" title={s.model_name}>{s.model_name}</p>
              </div>
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                <p className="text-[9px] text-blue-400 font-bold uppercase">Validation Accuracy</p>
                <p className="text-base font-black text-white mt-0.5">{s.accuracy}</p>
              </div>
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                <p className="text-[9px] text-emerald-400 font-bold uppercase">Precision Score</p>
                <p className="text-base font-black text-white mt-0.5">{(s.precision * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3.5 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                <p className="text-[9px] text-purple-400 font-bold uppercase">F1 Macro Score</p>
                <p className="text-base font-black text-white mt-0.5">{(s.f1_score * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Executive Summary Brief Card */}
          <div className="card-panel p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Stress Risk Distribution</h2>
            <p className="text-slate-400 leading-relaxed">
              Diagnostic classification shows that out of {totalEmployees} employees, the overall stress risk percentage sits at <strong>{s.overall_stress_risk_percentage}%</strong> (representing flagged High Risk cases).
            </p>
            
            <div className="grid grid-cols-3 gap-4 pt-2 text-center">
              <div className="p-3.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-[10px] text-emerald-400 font-bold">🟢 Low Risk</p>
                <p className="text-lg font-black text-white mt-1">{dist.low}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{((dist.low / totalEmployees) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3.5 rounded bg-amber-500/5 border border-amber-500/10">
                <p className="text-[10px] text-amber-400 font-bold">🟡 Moderate Risk</p>
                <p className="text-lg font-black text-white mt-1">{dist.medium}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{((dist.medium / totalEmployees) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3.5 rounded bg-rose-500/5 border border-rose-500/10">
                <p className="text-[10px] text-rose-400 font-bold">🔴 High Risk</p>
                <p className="text-lg font-black text-white mt-1">{dist.high}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{((dist.high / totalEmployees) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* AI Recommended Interventions */}
          <div className="card-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
              <span>Recommended Interventions</span>
            </h3>
            <div className="space-y-3 font-medium text-slate-300">
              {[
                "Limit maximum daily working hours to 9.5 hours to mitigate cognitive exhaustion.",
                "Introduce async updates to reduce weekly meeting load by at least 25%.",
                "Establish active check-ins for the flagged High Stress employees.",
                "Encourage immediate PTO usage for employees with low leave balances."
              ].map((rec, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right column: Flagged List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white">Flagged High Stress Employees ({dist.high})</h3>
            <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {employees.filter(e => e.risk_level === 'High').map((emp) => (
                <div key={emp.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-200">{emp.id} - {emp.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{emp.department} • Score: {emp.stress_score}%</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">HIGH</span>
                </div>
              ))}
              {employees.filter(e => e.risk_level === 'High').length === 0 && (
                <p className="text-slate-400 italic py-8 text-center">No high stress employees flagged.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Complete Employee Risk Table */}
      <div className="card-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-bold text-white">Complete Employee Risk Registry</h3>
          
          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 w-48 sm:w-60">
              <Search className="h-3.5 w-3.5 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Search ID, Name, Dept..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-slate-200 outline-none text-xs w-full"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-transparent border-none text-slate-200 outline-none text-xs cursor-pointer"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-slate-950 text-slate-200">{dept === 'All' ? 'All Depts' : dept}</option>
                ))}
              </select>
            </div>

            {/* Risk Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-transparent border-none text-slate-200 outline-none text-xs cursor-pointer"
              >
                <option value="All" className="bg-slate-950 text-slate-200">All Risks</option>
                <option value="High" className="bg-slate-950 text-rose-400">High</option>
                <option value="Moderate" className="bg-slate-950 text-amber-400">Moderate</option>
                <option value="Low" className="bg-slate-950 text-emerald-400">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable risk table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-[500px]">
          <table className="custom-table text-[11px]">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Age / Gender</th>
                <th className="text-center">Stress Score</th>
                <th>Risk Level</th>
                <th>Primary Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-bold text-white">{emp.id}</td>
                    <td className="text-slate-200">{emp.name}</td>
                    <td className="text-slate-400">{emp.department}</td>
                    <td className="text-slate-400">{emp.age} yrs / {emp.gender}</td>
                    <td className="text-center font-bold text-white">{emp.stress_score}%</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getRiskColor(emp.risk_level)}`}>
                        {emp.risk_level}
                      </span>
                    </td>
                    <td className="text-slate-400 max-w-[300px] truncate" title={emp.recommendation}>{emp.recommendation}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">No employees match criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
