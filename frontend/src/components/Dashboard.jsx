import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  Search, ShieldAlert, ArrowDownToLine, RefreshCw, Filter, 
  ChevronRight, Users, Activity, Smile, Brain
} from 'lucide-react';

export default function Dashboard({ data, sessionId, backendUrl, onReset, onViewDeveloper }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBucket, setFilterBucket] = useState('All');
  const [sortField, setSortField] = useState('risk_score');
  const [sortDirection, setSortDirection] = useState('desc');

  const { summary, developers } = data;

  // Handle CSV export
  const handleExport = () => {
    window.location.href = `${backendUrl}/api/report/export?session_id=${sessionId}`;
  };

  // Format Recharts data for Risk Distribution
  const barChartData = useMemo(() => {
    if (!summary || !summary.risk_distribution) return [];
    return [
      { name: 'Low Stress', count: summary.risk_distribution.low, color: '#10b981' },
      { name: 'Medium Stress', count: summary.risk_distribution.medium, color: '#f59e0b' },
      { name: 'High Stress', count: summary.risk_distribution.high, color: '#f97316' },
    ];
  }, [summary]);

  // Format Recharts data for Scatter Plot (Working Hours vs Tasks)
  const scatterData = useMemo(() => {
    if (!developers) return [];
    return developers.map(dev => {
      const wh = parseFloat(dev.raw_metrics["Working Hours"]) || 0;
      const tasks = parseFloat(dev.raw_metrics["Number of Tasks"]) || 0;
      return {
        id: dev.id,
        wh: Math.round(wh * 10) / 10,
        tasks: Math.round(tasks * 10) / 10,
        riskScore: dev.risk_score,
        bucket: dev.risk_bucket
      };
    });
  }, [developers]);

  // Sort and Filter developers list
  const filteredAndSortedDevelopers = useMemo(() => {
    if (!developers) return [];
    
    return developers
      .filter(dev => {
        const matchesSearch = dev.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterBucket === 'All' || dev.risk_bucket === filterBucket;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [developers, searchTerm, filterBucket, sortField, sortDirection]);

  // Toggle sort order
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get Risk badge color class
  const getRiskBadgeClass = (bucket) => {
    switch (bucket) {
      case 'High':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      case 'Medium':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      default:
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
  };

  const getRiskGlowClass = (score) => {
    if (score > 70) return 'border-l-4 border-l-orange-500';
    if (score > 40) return 'border-l-4 border-l-amber-500';
    return 'border-l-4 border-l-emerald-500';
  };

  const CustomScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 p-3 rounded-lg border border-white/10 text-xs shadow-xl space-y-1">
          <p className="font-bold text-white">ID: {data.id}</p>
          <p className="text-slate-400">Stress Score: <span className="text-white font-semibold">{data.riskScore}%</span></p>
          <p className="text-slate-400">Working Hours: <span className="text-white font-semibold">{data.wh} hrs/day</span></p>
          <p className="text-slate-400">Assigned Tasks: <span className="text-white font-semibold">{data.tasks} tasks</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Team Stress Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            IT Stress Level Cohort: <span className="font-mono text-slate-300">{sessionId.slice(0, 8)}...</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <ArrowDownToLine className="h-4 w-4 text-slate-400" />
            <span>Export CSV Report</span>
          </button>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Upload New Cohort</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Analyzed</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.total_developers}</h3>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <Users className="h-24 w-24 text-white" />
          </div>
        </div>

        {/* Avg Stress Score */}
        <div className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Average Stress Score</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.average_score}%</h3>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <Brain className="h-24 w-24 text-white" />
          </div>
        </div>

        {/* High Stress Count */}
        <div className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">High Stress Tier</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {summary.risk_distribution.high}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({summary.total_developers > 0 ? ((summary.risk_distribution.high / summary.total_developers) * 100).toFixed(0) : 0}%)
              </span>
            </h3>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <ShieldAlert className="h-24 w-24 text-white" />
          </div>
        </div>

        {/* Low Stress Count */}
        <div className="glass-panel p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Smile className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Healthy Tier (Low)</p>
            <h3 className="text-2xl font-bold text-white mt-1">
              {summary.risk_distribution.low}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({summary.total_developers > 0 ? ((summary.risk_distribution.low / summary.total_developers) * 100).toFixed(0) : 0}%)
              </span>
            </h3>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
            <Smile className="h-24 w-24 text-white" />
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Risk Distribution Chart */}
        <div className="glass-panel p-5 shadow-xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Stress Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}
                  itemStyle={{ fontSize: 11, color: '#f59e0b' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Working Hours vs Tasks Scatter Plot */}
        <div className="glass-panel p-5 shadow-xl border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4">Working Hours vs. Assigned Tasks Correlation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" dataKey="wh" name="Working Hours" stroke="#9ca3af" fontSize={11} domain={[4, 14]} />
                <YAxis type="number" dataKey="tasks" name="Tasks" stroke="#9ca3af" fontSize={11} domain={[1, 15]} />
                <ZAxis type="number" dataKey="riskScore" range={[40, 200]} />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }} />
                <Scatter name="Developers" data={scatterData}>
                  {scatterData.map((entry, index) => {
                    const color = entry.riskScore > 70 ? '#f97316' : entry.riskScore > 40 ? '#f59e0b' : '#10b981';
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.6} stroke={color} strokeWidth={1} />;
                  })}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Developer Table Section */}
      <div className="glass-panel p-6 shadow-xl border border-white/5 space-y-4">
        {/* Table Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2">
          <div>
            <h3 className="text-sm font-bold text-white">Cohort Employee Stress Registry</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Filter and sort the team list to review fatigue and task loads.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search Employee ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-lg text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            {/* Risk Tier Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={filterBucket}
                onChange={(e) => setFilterBucket(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-950 text-slate-200">All Tiers</option>
                <option value="High" className="bg-slate-950 text-orange-400">High Stress</option>
                <option value="Medium" className="bg-slate-950 text-amber-400">Medium Stress</option>
                <option value="Low" className="bg-slate-950 text-emerald-400">Low Stress</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <th 
                  className="p-3.5 font-semibold cursor-pointer hover:text-white transition"
                  onClick={() => handleSort('id')}
                >
                  Employee ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th 
                  className="p-3.5 font-semibold text-center cursor-pointer hover:text-white transition"
                  onClick={() => handleSort('risk_score')}
                >
                  Stress Score {sortField === 'risk_score' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-3.5 font-semibold">Stress Level</th>
                <th className="p-3.5 font-semibold">Top Contributing Factor</th>
                <th className="p-3.5 font-semibold text-center">Daily Hours</th>
                <th className="p-3.5 font-semibold text-center">Assigned Tasks</th>
                <th className="p-3.5 font-semibold text-center">Satisfaction</th>
                <th className="p-3.5 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
              {filteredAndSortedDevelopers.length > 0 ? (
                filteredAndSortedDevelopers.map((dev) => (
                  <tr 
                    key={dev.id} 
                    className={`hover:bg-slate-800/20 transition-colors ${getRiskGlowClass(dev.risk_score)}`}
                  >
                    <td className="p-3.5 font-semibold text-slate-200">{dev.id}</td>
                    <td className="p-3.5 text-center font-bold text-sm text-white">
                      {dev.risk_score}%
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskBadgeClass(dev.risk_bucket)}`}>
                        {dev.risk_bucket}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300 max-w-[280px] truncate" title={dev.top_factors.join(', ')}>
                      {dev.top_factors[0] || 'No abnormal indicators'}
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-300">
                      {dev.raw_metrics["Working Hours"] !== 'N/A' ? dev.raw_metrics["Working Hours"] + " hrs" : 'N/A'}
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-300">
                      {dev.raw_metrics["Number of Tasks"] !== 'N/A' ? dev.raw_metrics["Number of Tasks"] : 'N/A'}
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-300">
                      {dev.raw_metrics["Satisfaction Score"] !== 'N/A' ? dev.raw_metrics["Satisfaction Score"] + "/10" : 'N/A'}
                    </td>
                    <td className="p-3.5 text-center">
                      <button 
                        onClick={() => onViewDeveloper(dev.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 border border-white/5 text-[10px] font-semibold rounded hover:bg-slate-800 hover:text-white transition cursor-pointer text-slate-300"
                      >
                        <span>Drill Down</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    No developers found matching the search/filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
