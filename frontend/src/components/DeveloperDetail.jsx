import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  X, AlertCircle, ArrowLeft, CheckCircle, Flame, 
  Sparkles, Sliders, Shield, RefreshCw
} from 'lucide-react';

export default function DeveloperDetail({ developerId, allDevelopers, sessionId, backendUrl, onClose }) {
  const [error, setError] = useState(null);
  
  // Base developer metrics (original)
  const developer = useMemo(() => {
    return allDevelopers.find(d => d.id === developerId);
  }, [allDevelopers, developerId]);

  // Cohort averages computation
  const cohortAverages = useMemo(() => {
    if (!allDevelopers || allDevelopers.length === 0) return {};
    const keys = [
      "Working Hours", "Overtime Hours", "Number of Tasks", "Meeting Hours",
      "Satisfaction Score", "Leave Count", "Project Deadlines", "Code Commits",
      "Work-Life Balance Rating", "Response Time"
    ];
    
    const sums = {};
    const counts = {};
    
    allDevelopers.forEach(dev => {
      keys.forEach(key => {
        const val = parseFloat(dev.raw_metrics[key]);
        if (!isNaN(val)) {
          sums[key] = (sums[key] || 0) + val;
          counts[key] = (counts[key] || 0) + 1;
        }
      });
    });
    
    const avgs = {};
    keys.forEach(key => {
      avgs[key] = counts[key] ? Math.round((sums[key] / counts[key]) * 10) / 10 : 0;
    });
    return avgs;
  }, [allDevelopers]);

  // Simulator Sliders State - initialized from developer raw metrics
  const [simParams, setSimParams] = useState({
    working_hours: 8.0,
    overtime_hours: 1.0,
    tasks: 5,
    meetings: 10.0,
    satisfaction: 7,
    leaves: 12
  });

  // Simulated output state
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Set initial slider parameters when developer changes
  useEffect(() => {
    if (developer) {
      const getVal = (key, fallback) => {
        const val = developer.raw_metrics[key];
        return val === "N/A" || isNaN(parseFloat(val)) ? fallback : parseFloat(val);
      };

      setSimParams({
        working_hours: getVal("Working Hours", 8.0),
        overtime_hours: getVal("Overtime Hours", 1.0),
        tasks: parseInt(getVal("Number of Tasks", 5)),
        meetings: getVal("Meeting Hours", 10.0),
        satisfaction: parseInt(getVal("Satisfaction Score", 7)),
        leaves: parseInt(getVal("Leave Count", 12))
      });
      setSimResult(null);
    }
  }, [developer]);

  // Trigger Live Simulation on param change
  const runSimulation = async () => {
    if (!developer) return;
    setIsSimulating(true);
    setError(null);

    const payload = {
      dev_id: developer.id,
      working_hours: parseFloat(simParams.working_hours),
      overtime_hours: parseFloat(simParams.overtime_hours),
      tasks: intval(simParams.tasks),
      meetings: parseFloat(simParams.meetings),
      satisfaction: intval(simParams.satisfaction),
      leaves: intval(simParams.leaves)
    };

    try {
      const response = await fetch(`${backendUrl}/api/simulate?session_id=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Simulation endpoint failed.");
      }

      const data = await response.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
      setError("Unable to update live simulator. Please verify backend connection.");
    } finally {
      setIsSimulating(false);
    }
  };

  const intval = (val) => {
    const parsed = parseInt(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Run simulation automatically when inputs change (debounced)
  useEffect(() => {
    if (developer) {
      const delayDebounce = setTimeout(() => {
        runSimulation();
      }, 250);
      return () => clearTimeout(delayDebounce);
    }
  }, [simParams, developer]);

  // Reset sliders to original developer values
  const handleResetSliders = () => {
    if (!developer) return;
    const getVal = (key, fallback) => {
      const val = developer.raw_metrics[key];
      return val === "N/A" || isNaN(parseFloat(val)) ? fallback : parseFloat(val);
    };

    setSimParams({
      working_hours: getVal("Working Hours", 8.0),
      overtime_hours: getVal("Overtime Hours", 1.0),
      tasks: parseInt(getVal("Number of Tasks", 5)),
      meetings: getVal("Meeting Hours", 10.0),
      satisfaction: parseInt(getVal("Satisfaction Score", 7)),
      leaves: parseInt(getVal("Leave Count", 12))
    });
    setSimResult(null);
  };

  // Generate Comparison Chart Data (6 model features)
  const chartData = useMemo(() => {
    if (!developer) return [];
    
    const keyLabels = {
      "Working Hours": "Work Hours/Day",
      "Overtime Hours": "Overtime/Day",
      "Number of Tasks": "Task Load",
      "Meeting Hours": "Meetings/Week",
      "Satisfaction Score": "Satisfaction (1-10)",
      "Leave Count": "Leaves Taken"
    };

    return Object.entries(keyLabels).map(([key, label]) => {
      const devVal = parseFloat(developer.raw_metrics[key]);
      const teamVal = cohortAverages[key] || 0;
      return {
        name: label,
        Developer: isNaN(devVal) ? 0 : devVal,
        "Team Average": teamVal
      };
    });
  }, [developer, cohortAverages]);

  if (!developer) return null;

  const displayScore = simResult ? simResult.risk_score : developer.risk_score;
  const displayBucket = simResult ? simResult.risk_bucket : developer.risk_bucket;
  const displayRecs = simResult ? simResult.recommendations : developer.recommendations;
  const displayFactors = simResult ? simResult.top_factors : developer.top_factors;

  // Color classes
  const getRiskColor = (bucket) => {
    switch (bucket) {
      case 'High': return 'text-orange-500 border-orange-500/20 bg-orange-500/5';
      case 'Medium': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  const getRiskMeterBg = (score) => {
    if (score > 70) return 'bg-gradient-to-r from-amber-500 to-orange-500';
    if (score > 40) return 'bg-gradient-to-r from-emerald-500 to-amber-500';
    return 'bg-gradient-to-r from-emerald-600 to-emerald-400';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex justify-center items-start p-4 md:p-6 animate-fade-in">
      <div className="w-full max-w-6xl glass-panel border border-white/10 shadow-2xl relative overflow-hidden mt-6 mb-6">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-950 border border-white/5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Stress Drill-Down: <span className="font-mono text-amber-500">{developer.id}</span>
              </h2>
              <p className="text-[10px] text-slate-400">IT Company Stress Level Analysis • Cohort Cohere</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          
          {/* LEFT: Summary, Metrics and Comparison Chart */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Risk Gauge Panel */}
            <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-center gap-6 justify-between ${getRiskColor(displayBucket)}`}>
              <div className="space-y-1.5 text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-85">Stress Level Indicator</span>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h3 className="text-4xl font-extrabold">{displayScore}%</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-white/5 font-bold uppercase">{displayBucket} Stress</span>
                </div>
                <p className="text-xs opacity-75 max-w-sm">
                  {displayBucket === 'High' 
                    ? "Immediate wellness intervention recommended. Developer is in the High Stress segment with critical workloads." 
                    : displayBucket === 'Medium' 
                      ? "Medium stress levels detected. Workload and satisfaction scores should be audited soon."
                      : "Low stress. Maintain current healthy patterns and boundaries."}
                </p>
              </div>
              
              {/* Score visual meter */}
              <div className="w-full md:w-44 flex flex-col items-center gap-2">
                <div className="w-full h-3 bg-slate-900 rounded-full border border-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${getRiskMeterBg(displayScore)}`} style={{ width: `${displayScore}%` }}></div>
                </div>
                <div className="flex justify-between w-full text-[10px] opacity-70">
                  <span>0% (Low)</span>
                  <span>100% (High)</span>
                </div>
              </div>
            </div>

            {/* Comparison Chart */}
            <div className="glass-panel p-5 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-white">IT Workload Profile (vs. Team Averages)</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Developer" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Team Average" fill="rgba(255, 255, 255, 0.15)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* IT Indicator Details (10 columns grid) */}
            <div className="glass-panel p-5 border border-white/5">
              <h4 className="text-xs font-bold text-white mb-3">All Work-Related Indicators</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { label: "Working Hours", val: developer.raw_metrics["Working Hours"] + " h/day" },
                  { label: "Overtime", val: developer.raw_metrics["Overtime Hours"] + " h/day" },
                  { label: "Number of Tasks", val: developer.raw_metrics["Number of Tasks"] },
                  { label: "Meetings", val: developer.raw_metrics["Meeting Hours"] + " h/wk" },
                  { label: "Satisfaction Score", val: developer.raw_metrics["Satisfaction Score"] + "/10" },
                  { label: "Leaves Taken", val: developer.raw_metrics["Leave Count"] + " days" },
                  { label: "Project Deadlines", val: developer.raw_metrics["Project Deadlines"] + "/mo" },
                  { label: "Code Commits", val: developer.raw_metrics["Code Commits"] + "/wk" },
                  { label: "WLB Rating", val: developer.raw_metrics["Work-Life Balance Rating"] + "/5" },
                  { label: "Response Time", val: developer.raw_metrics["Response Time"] + " min" },
                ].map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-900/60 border border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 font-medium truncate">{item.label}</p>
                    <p className="text-xs font-bold text-white mt-1">{item.val === "N/A h/day" || item.val === "N/A/10" ? "N/A" : item.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contributing Factors & Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Factors */}
              <div className="glass-panel p-5 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 text-amber-500">
                  <Flame className="h-4 w-4" />
                  <span>Key Stress Factors</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  {displayFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="glass-panel p-5 border border-white/5 space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle className="h-4 w-4" />
                  <span>Recommendations</span>
                </h4>
                <ul className="space-y-2 text-xs">
                  {displayRecs.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* RIGHT: What-If Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 border border-white/10 shadow-lg relative overflow-hidden bg-slate-950/20">
              <div className="absolute top-0 right-0 p-3 text-amber-500/10 pointer-events-none">
                <Sliders className="h-24 w-24" />
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>IT stress Simulator</span>
                </h3>
                <div className="flex items-center gap-2">
                  {isSimulating && <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />}
                  <button 
                    onClick={handleResetSliders}
                    className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-white/5 transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-5">
                Simulate work indicators below to trigger the classifier model and formula live.
              </p>

              {error && (
                <div className="mb-4 p-2 bg-red-950/20 border border-red-900/30 text-[10px] text-red-300 rounded">
                  {error}
                </div>
              )}

              {/* Sliders container */}
              <div className="space-y-4 text-xs">
                
                {/* Working Hours */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Daily Working Hours</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.working_hours} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="4.0"
                    max="14.0"
                    step="0.1"
                    value={simParams.working_hours}
                    onChange={(e) => setSimParams({...simParams, working_hours: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Overtime Hours */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Daily Overtime Hours</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.overtime_hours} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="6.0"
                    step="0.1"
                    value={simParams.overtime_hours}
                    onChange={(e) => setSimParams({...simParams, overtime_hours: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Number of Tasks */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Daily Assigned Tasks</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.tasks} tasks</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={simParams.tasks}
                    onChange={(e) => setSimParams({...simParams, tasks: parseInt(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Meetings */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Weekly Meeting Hours</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.meetings} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="30.0"
                    step="0.5"
                    value={simParams.meetings}
                    onChange={(e) => setSimParams({...simParams, meetings: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Satisfaction score */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Satisfaction Survey Score</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.satisfaction} / 10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={simParams.satisfaction}
                    onChange={(e) => setSimParams({...simParams, satisfaction: parseInt(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Leave Count */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-medium">Leave Count (Days/Year)</span>
                    <span className="font-mono text-white bg-slate-900 px-1.5 py-0.5 rounded">{simParams.leaves} days</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="1"
                    value={simParams.leaves}
                    onChange={(e) => setSimParams({...simParams, leaves: parseInt(e.target.value)})}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

              </div>

              {simResult && (
                <div className="mt-5 p-3 rounded-lg bg-indigo-950/20 border border-indigo-900/30 text-[10px] text-indigo-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span><strong>Live Simulator Active:</strong> Recalculated stress score is {simResult.risk_score}%, matching a {simResult.risk_bucket} Stress label.</span>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
