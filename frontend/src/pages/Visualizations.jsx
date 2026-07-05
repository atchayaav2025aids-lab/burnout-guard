import React, { useState, useMemo } from 'react';
import PlotlyChart from '../components/PlotlyChart';
import { Filter, AlertCircle, RefreshCw } from 'lucide-react';

const round = (num, decimals) => {
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
};

export default function Visualizations({ activeDatasetId, analysisData, onAnalyzeNow, isDarkMode }) {
  const [analyzingState, setAnalyzingState] = useState(false);

  // Filter States
  const [deptFilter, setDeptFilter] = useState('All');
  const [gendFilter, setGendFilter] = useState('All');
  const [stressFilter, setStressFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');

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

  const employees = useMemo(() => {
    return analysisData?.employees || [];
  }, [analysisData]);

  // Extract unique departments for filters
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [employees]);

  // Filter employees list dynamically
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (deptFilter !== 'All' && emp.department !== deptFilter) return false;
      if (gendFilter !== 'All' && emp.gender !== gendFilter) return false;
      if (stressFilter !== 'All' && emp.risk_level !== stressFilter) return false;
      if (ageFilter !== 'All') {
        const age = emp.age;
        if (ageFilter === 'Under 25' && age >= 25) return false;
        if (ageFilter === '25-34' && (age < 25 || age > 34)) return false;
        if (ageFilter === '35-44' && (age < 35 || age > 44)) return false;
        if (ageFilter === '45+' && age < 45) return false;
      }
      return true;
    });
  }, [employees, deptFilter, gendFilter, stressFilter, ageFilter]);

  // Reset Filters
  const handleResetFilters = () => {
    setDeptFilter('All');
    setGendFilter('All');
    setStressFilter('All');
    setAgeFilter('All');
  };

  // Determine colors based on theme
  const textColor = isDarkMode ? "#e2e8f0" : "#334155";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";

  // Fuzzy case-insensitive metric value extractor helper
  const findMetricValue = (rawMetrics, aliases) => {
    if (!rawMetrics) return 0;
    for (const alias of aliases) {
      const aliasLower = alias.toLowerCase();
      for (const key of Object.keys(rawMetrics)) {
        if (key.toLowerCase().includes(aliasLower)) {
          const val = rawMetrics[key];
          if (val !== "N/A" && val !== undefined && val !== null) {
            const num = parseFloat(val);
            if (!isNaN(num)) return num;
          }
        }
      }
    }
    return 0;
  };

  // JavaScript helper to bin continuous numbers for robust bar-chart histograms
  const computeHistogramBins = (values, numBins = 8) => {
    if (!values || values.length === 0) return { x: [], y: [] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    if (range === 0) {
      return {
        x: [`${min}`],
        y: [values.length]
      };
    }
    
    const binWidth = range / numBins;
    const bins = Array(numBins).fill(0);
    const binLabels = [];
    
    for (let i = 0; i < numBins; i++) {
      const start = min + i * binWidth;
      const end = start + binWidth;
      binLabels.push(`${round(start, 1)} - ${round(end, 1)}`);
    }
    
    values.forEach(v => {
      let binIdx = Math.floor((v - min) / binWidth);
      if (binIdx >= numBins) binIdx = numBins - 1; // handle maximum boundary
      if (binIdx < 0) binIdx = 0;
      bins[binIdx]++;
    });
    
    return {
      x: binLabels,
      y: bins
    };
  };

  // 1. PIE CHART: High, Moderate, and Low Stress Distribution
  const pieChartData = useMemo(() => {
    const counts = { 'Low': 0, 'Moderate': 0, 'High': 0 };
    filteredEmployees.forEach(e => {
      const lvl = e.risk_level || 'Low';
      if (counts[lvl] !== undefined) counts[lvl]++;
    });
    return {
      data: [{
        values: Object.values(counts),
        labels: Object.keys(counts),
        type: 'pie',
        marker: {
          colors: ['#10b981', '#f59e0b', '#ef4444']
        },
        hoverinfo: 'label+percent+value',
        textinfo: 'percent'
      }],
      layout: {
        title: 'High, Moderate, and Low Stress Distribution',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 },
        margin: { t: 40, b: 20, l: 20, r: 20 },
        showlegend: true
      }
    };
  }, [filteredEmployees, textColor]);

  // 2. BAR CHART: Department-wise Stress Levels (Grouped Bar Chart)
  const deptGroupedChartData = useMemo(() => {
    const depts = [...new Set(filteredEmployees.map(e => e.department).filter(Boolean))];
    const deptData = depts.map(d => {
      const matches = filteredEmployees.filter(e => e.department === d);
      return {
        dept: d,
        low: matches.filter(e => e.risk_level === 'Low').length,
        med: matches.filter(e => e.risk_level === 'Moderate').length,
        high: matches.filter(e => e.risk_level === 'High').length
      };
    });
    return {
      data: [
        { x: depts, y: deptData.map(d => d.low), name: 'Low Stress', type: 'bar', marker: { color: '#10b981' } },
        { x: depts, y: deptData.map(d => d.med), name: 'Moderate Stress', type: 'bar', marker: { color: '#f59e0b' } },
        { x: depts, y: deptData.map(d => d.high), name: 'High Stress', type: 'bar', marker: { color: '#ef4444' } }
      ],
      layout: {
        title: 'Department-wise Stress Levels',
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 },
        margin: { t: 40, b: 35, l: 40, r: 20 },
        xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
        yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Headcount' }
      }
    };
  }, [filteredEmployees, textColor, gridColor]);

  // 3. BAR CHART: Stress Count by Department (Stacked Bar Chart)
  const deptStackedChartData = useMemo(() => {
    return {
      data: deptGroupedChartData.data,
      layout: {
        ...deptGroupedChartData.layout,
        title: 'Stress Count by Department',
        barmode: 'stack'
      }
    };
  }, [deptGroupedChartData]);

  // 4. BAR CHART: Gender-wise Stress Distribution (Grouped Bar Chart)
  const genderChartData = useMemo(() => {
    const genders = [...new Set(filteredEmployees.map(e => e.gender).filter(Boolean))];
    const dataByGend = genders.map(g => {
      const matches = filteredEmployees.filter(e => e.gender === g);
      return {
        gender: g,
        low: matches.filter(e => e.risk_level === 'Low').length,
        med: matches.filter(e => e.risk_level === 'Moderate').length,
        high: matches.filter(e => e.risk_level === 'High').length
      };
    });
    return {
      data: [
        { x: genders, y: dataByGend.map(g => g.low), name: 'Low Stress', type: 'bar', marker: { color: '#10b981' } },
        { x: genders, y: dataByGend.map(g => g.med), name: 'Moderate Stress', type: 'bar', marker: { color: '#f59e0b' } },
        { x: genders, y: dataByGend.map(g => g.high), name: 'High Stress', type: 'bar', marker: { color: '#ef4444' } }
      ],
      layout: {
        title: 'Gender-wise Stress Distribution',
        barmode: 'group',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 },
        margin: { t: 40, b: 35, l: 40, r: 20 },
        xaxis: { gridcolor: gridColor, zerolinecolor: gridColor },
        yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Headcount' }
      }
    };
  }, [filteredEmployees, textColor, gridColor]);

  // 5. HISTOGRAM: Working Hours Distribution (Grouped Bar Histogram)
  const workingHoursHistData = useMemo(() => {
    const whValues = filteredEmployees.map(e => findMetricValue(e.raw_metrics, ["work", "hour"])).filter(v => v > 0);
    const bins = computeHistogramBins(whValues, 8);
    return {
      data: [{
        x: bins.x,
        y: bins.y,
        type: 'bar',
        marker: { color: '#2563eb', opacity: 0.85 }
      }],
      layout: {
        title: 'Working Hours Distribution',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 },
        margin: { t: 40, b: 35, l: 40, r: 20 },
        xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Hours Range' },
        yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Headcount' }
      }
    };
  }, [filteredEmployees, textColor, gridColor]);

  // 6. HISTOGRAM: Sleep Hours Distribution (Grouped Bar Histogram)
  const sleepHoursHistData = useMemo(() => {
    const shValues = filteredEmployees.map(e => findMetricValue(e.raw_metrics, ["sleep"])).filter(v => v > 0);
    const bins = computeHistogramBins(shValues, 8);
    return {
      data: [{
        x: bins.x,
        y: bins.y,
        type: 'bar',
        marker: { color: '#8b5cf6', opacity: 0.85 }
      }],
      layout: {
        title: 'Sleep Hours Distribution',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: textColor, size: 10 },
        margin: { t: 40, b: 35, l: 40, r: 20 },
        xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Hours Range' },
        yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, title: 'Headcount' }
      }
    };
  }, [filteredEmployees, textColor, gridColor]);



  if (!activeDatasetId) {
    return (
      <div className="p-6 text-center text-slate-400 italic text-xs card-panel max-w-xl mx-auto mt-12 space-y-4">
        <AlertCircle className="h-8 w-8 text-slate-500 mx-auto" />
        <h3 className="font-bold text-white text-sm">No dataset loaded.</h3>
        <p className="text-slate-400">Please upload a dataset or select an existing cohort from the Dashboard to access Cohort Visualizations.</p>
      </div>
    );
  }

  if (!analysisData || !analysisData.charts) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white">Cohort Visualizations</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Explore interactive analytical breakdowns and correlations</p>
        </div>

        <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>This dataset has not been analyzed yet.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Interactive breakdown charts and correlation heatmaps are generated during the ML training process. Run the pipeline to unlock this view.
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

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Cohort Visualizations</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Explore interactive analytical breakdowns and correlations</p>
        </div>
        
        {/* Reset Filter Action */}
        <button
          onClick={handleResetFilters}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-lg cursor-pointer transition text-[10px]"
        >
          Reset Filters
        </button>
      </div>

      {/* Interactive Filter Control Panel - Responsive Row */}
      <div className="card-panel p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/10">
        
        {/* Department Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3 text-indigo-400" />
            <span>Department</span>
          </label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-lg p-2 outline-none text-xs cursor-pointer focus:border-indigo-500"
          >
            {departments.map(d => (
              <option key={d} value={d} className="bg-slate-950">{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3 text-indigo-400" />
            <span>Gender</span>
          </label>
          <select
            value={gendFilter}
            onChange={(e) => setGendFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-lg p-2 outline-none text-xs cursor-pointer focus:border-indigo-500"
          >
            <option value="All" className="bg-slate-950">All Genders</option>
            <option value="Male" className="bg-slate-950">Male</option>
            <option value="Female" className="bg-slate-950">Female</option>
          </select>
        </div>

        {/* Stress Level Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3 text-indigo-400" />
            <span>Stress Level</span>
          </label>
          <select
            value={stressFilter}
            onChange={(e) => setStressFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-lg p-2 outline-none text-xs cursor-pointer focus:border-indigo-500"
          >
            <option value="All" className="bg-slate-950">All Stress Tiers</option>
            <option value="Low" className="bg-slate-950 text-emerald-400">Low Stress</option>
            <option value="Moderate" className="bg-slate-950 text-amber-400">Moderate Stress</option>
            <option value="High" className="bg-slate-950 text-rose-400">High Stress</option>
          </select>
        </div>

        {/* Age Group Filter */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3 w-3 text-indigo-400" />
            <span>Age Group</span>
          </label>
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800/80 text-slate-200 rounded-lg p-2 outline-none text-xs cursor-pointer focus:border-indigo-500"
          >
            <option value="All" className="bg-slate-950">All Ages</option>
            <option value="Under 25" className="bg-slate-950">Under 25 yrs</option>
            <option value="25-34" className="bg-slate-950">25 to 34 yrs</option>
            <option value="35-44" className="bg-slate-950">35 to 44 yrs</option>
            <option value="45+" className="bg-slate-950">45 yrs and Over</option>
          </select>
        </div>

      </div>

      {/* Filter Stats Badge */}
      <div className="flex items-center gap-2 text-slate-400 text-[10px] pl-1">
        <span>Filtered Cohort Count:</span>
        <strong className="text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded font-mono">
          {filteredEmployees.length} / {employees.length}
        </strong>
      </div>

      {/* Visualizations Panels Grid */}
      {filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Pie Chart: High, Moderate, and Low Stress Distribution */}
          <div className="card-panel p-5 space-y-3 relative group">
            <PlotlyChart chartData={pieChartData} chartId="viz_pie" />
          </div>

          {/* Department-wise Stress Levels (Grouped Bar Chart) */}
          <div className="card-panel p-5 space-y-3 relative group">
            <PlotlyChart chartData={deptGroupedChartData} chartId="viz_dept_grouped" />
          </div>

          {/* Stress Count by Department (Stacked Bar Chart) */}
          <div className="card-panel p-5 space-y-3 relative group">
            <PlotlyChart chartData={deptStackedChartData} chartId="viz_dept_stacked" />
          </div>

          {/* Gender-wise Stress Distribution (Grouped Bar Chart) */}
          <div className="card-panel p-5 space-y-3 relative group">
            <PlotlyChart chartData={genderChartData} chartId="viz_gender" />
          </div>

        </div>
      ) : (
        <div className="card-panel p-12 text-center space-y-4 max-w-xl mx-auto">
          <AlertCircle className="h-10 w-10 text-slate-500 mx-auto" />
          <h3 className="font-bold text-white text-sm">No Matching Records Found</h3>
          <p className="text-slate-400 text-xs">
            No employees match the selected filters combination. Try expanding your search parameters or resetting the filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg cursor-pointer transition shadow"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}
