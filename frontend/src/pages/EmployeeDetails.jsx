import React, { useState, useMemo } from 'react';
import { Users, Search, Filter, AlertCircle, FileDown, Smile, ShieldAlert, RefreshCw, X, ArrowLeft, ArrowUpRight, Flame, CheckCircle } from 'lucide-react';

export default function EmployeeDetails({ activeDatasetId, uploadData, analysisData, onAnalyzeNow }) {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [analyzingState, setAnalyzingState] = useState(false);

  const handleAnalyzeNow = async () => {
    setAnalyzingState(true);
    try {
      await onAnalyzeNow();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingState(false);
    }
  };

  if (!activeDatasetId) {
    return (
      <div className="p-6 text-center text-slate-400 italic text-xs card-panel max-w-xl mx-auto mt-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
        <h3 className="font-bold text-white text-sm">No dataset loaded.</h3>
        <p className="text-slate-400">Please upload a dataset or select an existing cohort from the Dashboard to access Employee Details.</p>
      </div>
    );
  }

  if (!analysisData || !analysisData.employees) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white">Employee Details Registry</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Individual employee risk profiles and recommended interventions</p>
        </div>

        <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>This dataset has not been analyzed yet.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Employee stress classification scores and customized intervention recommenders are calculated during ML model training. Run the pipeline to unlock this view.
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
      </div>
    );
  }

  const { employees } = analysisData;

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return ['All', ...Array.from(set)];
  }, [employees]);

  // Filter and Search logic
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = e.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'All' || e.department === deptFilter;
      const matchesRisk = riskFilter === 'All' || e.risk_level === riskFilter;
      return matchesSearch && matchesDept && matchesRisk;
    });
  }, [employees, searchTerm, deptFilter, riskFilter]);

  // Export to CSV helper
  const handleExport = () => {
    const headers = ["Employee ID", "Name", "Department", "Gender", "Age", "Stress Score %", "Stress Level", "Top Recommendation"];
    const rows = filteredEmployees.map(e => [
      e.id, e.name, e.department, e.gender, e.age, e.stress_score, e.risk_level, e.recommendation
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Employee_Stress_Registry.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      case 'Moderate':
      case 'Medium': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs relative">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Employee Stress Registry</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Filter, search, and drill-down into individual stress risk analysis</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-slate-800 text-white font-bold px-3.5 py-2.5 rounded-lg cursor-pointer transition shadow"
        >
          <FileDown className="h-4 w-4 text-slate-400" />
          <span>Export Registry CSV</span>
        </button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-grow sm:flex-grow-0">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-slate-800 dark:text-white outline-none transition"
          />
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-transparent border-none text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            {departments.map(dept => (
              <option key={dept} value={dept} className="bg-slate-950 text-slate-200">{dept === 'All' ? 'All Departments' : dept}</option>
            ))}
          </select>
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-transparent border-none text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            <option value="All" className="bg-slate-950 text-slate-200">All Risk Levels</option>
            <option value="High" className="bg-slate-950 text-rose-400">High Risk</option>
            <option value="Moderate" className="bg-slate-950 text-amber-400">Moderate Risk</option>
            <option value="Low" className="bg-slate-950 text-emerald-400">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Registry Table */}
      <div className="card-panel overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Age / Gender</th>
                <th className="text-center">Stress Score</th>
                <th>Risk Level</th>
                <th>Primary Recommendation</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-bold text-slate-800 dark:text-white">{emp.id}</td>
                    <td className="text-slate-700 dark:text-slate-200">{emp.name}</td>
                    <td className="text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="text-slate-600 dark:text-slate-400">{emp.age} yrs / {emp.gender}</td>
                    <td className="text-center font-bold text-sm text-slate-800 dark:text-white">{emp.stress_score}%</td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getRiskColor(emp.risk_level)}`}>
                        {emp.risk_level}
                      </span>
                    </td>
                    <td className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={emp.recommendation}>{emp.recommendation}</td>
                    <td className="text-center">
                      <button
                        onClick={() => setSelectedEmp(emp)}
                        className="p-1 px-2 border border-slate-800 rounded bg-slate-950 text-[10px] hover:bg-slate-900 hover:text-white transition cursor-pointer text-slate-400"
                      >
                        Drill Down
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">No employees match criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-out Employee Detail Drawer */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg card-panel h-full rounded-none border-y-0 border-r-0 flex flex-col justify-between overflow-y-auto p-6 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Detailed Analysis</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedEmp.id} • {selectedEmp.name}</p>
              </div>
              <button 
                onClick={() => setSelectedEmp(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content body */}
            <div className="space-y-6 flex-grow">
              
              {/* Risk Gauge */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${getRiskColor(selectedEmp.risk_level)}`}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider font-bold opacity-80">Stress Level Gauge</p>
                  <h4 className="text-3xl font-extrabold mt-1">{selectedEmp.stress_score}%</h4>
                  <p className="text-[10px] font-bold mt-0.5 uppercase">{selectedEmp.risk_level} Stress Segment</p>
                </div>
                <div className="w-28 space-y-1">
                  <div className="w-full h-2 bg-slate-950/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${selectedEmp.stress_score}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[8px] opacity-75">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Employee Indicators Profile */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">Workload Indicators Profile</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Working Hours", val: `${selectedEmp.raw_metrics["Working Hours"] || selectedEmp.raw_metrics["Weekly Working Hours"] || 8.0} hrs/day` },
                    { label: "Daily Overtime", val: `${selectedEmp.raw_metrics["Overtime Hours"] || selectedEmp.raw_metrics["Overtime"] || 0} hrs/day` },
                    { label: "Sleep Hours", val: `${selectedEmp.raw_metrics["Sleep Hours"] || 7.0} hrs/day` },
                    { label: "Job Satisfaction", val: `${selectedEmp.raw_metrics["Job Satisfaction"] || 7.0} / 10` },
                    { label: "Work-Life Balance", val: `${selectedEmp.raw_metrics["Work-Life Balance"] || 3.0} / 5` },
                    { label: "Leave Balance", val: `${selectedEmp.raw_metrics["Leave Count"] || selectedEmp.raw_metrics["Leaves"] || 12} days` },
                  ].map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-slate-900/10 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold">{item.label}</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{item.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                  <span>Personalized Action Steps</span>
                </h4>
                <ul className="space-y-1.5 font-medium text-slate-600 dark:text-slate-300">
                  {selectedEmp.all_recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  )) || <li>{selectedEmp.recommendation}</li>}
                </ul>
              </div>

            </div>

            {/* Footer close */}
            <button
              onClick={() => setSelectedEmp(null)}
              className="w-full py-2.5 border border-slate-300 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-white transition cursor-pointer text-slate-400 font-semibold text-center"
            >
              Close Drawer
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
}
