import React, { useState } from 'react';
import PlotlyChart from '../components/PlotlyChart';
import { Compass, TrendingUp, BarChart3, Clock, Users, Calendar, AlertCircle, RefreshCw, Info, PieChart } from 'lucide-react';

export default function EDA({ activeDatasetId, analysisData, onAnalyzeNow }) {
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
        <p className="text-slate-400">Please upload a dataset or select an existing cohort from the Dashboard to access EDA.</p>
      </div>
    );
  }

  if (!analysisData || !analysisData.charts) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white">Exploratory Data Analysis</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Statistical distributions, cross-tabulations, and correlation heatmaps</p>
        </div>

        <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>This dataset has not been analyzed yet.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Exploratory Data Analysis metrics and correlation graphs are compiled during the ML training process. Run the pipeline to unlock this view.
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

  const { charts } = analysisData;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">Exploratory Data Analysis</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">Statistical distributions, cross-tabulations, and correlation heatmaps</p>
      </div>

      {/* Cohort Insight Banner */}
      <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-start gap-3">
        <Info className="h-4.5 w-4.5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-bold text-xs">EDA Insights Summary</h4>
          <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
            A strong correlation is identified between **Daily Working Hours** and elevated stress scores. Additionally, minimal leave taking and lower self-reported job satisfaction strongly act as risk accelerators across all major corporate departments.
          </p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: High, Moderate, and Low Stress Distribution */}
        {charts.stress_distribution_pie && (
          <div className="card-panel p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <PieChart className="h-4 w-4 text-indigo-400" />
                <span>High, Moderate, and Low Stress Distribution</span>
              </h3>
              <PlotlyChart chartData={charts.stress_distribution_pie} chartId="chart_dist_pie" />
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">💡 Summary Insight</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Represents the proportion of the workforce segment in each risk category. Low Stress cases are green, Moderate yellow, and High Stress red, highlighting the general stress state of the organization.
              </p>
            </div>
          </div>
        )}


        {/* Department-wise Stress Levels (Grouped Bar Chart) */}
        {charts.department_stress && (
          <div className="card-panel p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <span>Department-wise Stress Levels</span>
              </h3>
              <PlotlyChart chartData={charts.department_stress} chartId="chart_dept_grouped" />
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">💡 Summary Insight</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Grouped breakdown comparison between departments. Helps compare stress distribution categories side-by-side, signaling department workload variations.
              </p>
            </div>
          </div>
        )}

        {/* Stress Count by Department (Stacked Bar Chart) */}
        {charts.department_stress_counts && (
          <div className="card-panel p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" />
                <span>Stress Count by Department</span>
              </h3>
              <PlotlyChart chartData={charts.department_stress_counts} chartId="chart_dept_stacked" />
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">💡 Summary Insight</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Stacked breakdown showing employee volumes by department. Visualizes the headcount ratios of low, moderate, and high risk cases contributing to the total department size.
              </p>
            </div>
          </div>
        )}

        {/* Gender-wise Stress Distribution (Grouped Bar Chart) */}
        {charts.gender_stress && (
          <div className="card-panel p-5 flex flex-col justify-between col-span-1 lg:col-span-2">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>Gender-wise Stress Distribution</span>
              </h3>
              <PlotlyChart chartData={charts.gender_stress} chartId="chart_gender" />
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">💡 Summary Insight</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Grouped bar chart showing stress distributions by gender. Used to review cohort balance and ensure stress or overtime distributions are equitable.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
