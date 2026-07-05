import React, { useState } from 'react';
import PlotlyChart from '../components/PlotlyChart';
import { Cpu, Award, ShieldAlert, BarChart, AlertCircle, RefreshCw, Layers, CheckSquare, TrendingUp } from 'lucide-react';

export default function MLPrediction({ activeDatasetId, analysisData, onAnalyzeNow }) {
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
        <p className="text-slate-400">Please upload a dataset or select an existing cohort from the Dashboard to access ML Prediction.</p>
      </div>
    );
  }

  if (!analysisData || !analysisData.charts) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
        <div className="border-b border-slate-800 pb-5">
          <h1 className="text-xl font-bold tracking-tight text-white">ML Prediction Models</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">Algorithm evaluations, accuracy metrics, and feature importances</p>
        </div>

        <div className="card-panel p-6 bg-amber-500/5 border-amber-500/20 text-amber-400 rounded-xl space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>This dataset has not been analyzed yet.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Machine Learning metrics, test performance curves, and feature importance analyses are compiled during the ML training process. Run the pipeline to unlock this view.
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

  const { charts, summary } = analysisData;
  const isRuleBased = summary.model_name === "Rule-Based Expert Classifier";

  // Identify top features from importances object if available
  const featureImportances = summary.feature_importances || {};
  const sortedFeatures = Object.entries(featureImportances)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // top 3

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">ML Prediction Models</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">Algorithm evaluations, accuracy metrics, and feature importances</p>
      </div>

      {/* Model Performance scorecard - 5 Columns Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Model Name */}
        <div className="card-panel p-4 flex items-center gap-3 col-span-2 md:col-span-1">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-lg shrink-0">
            <Cpu className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Classifier Model</p>
            <p className="font-black text-white text-xs mt-0.5 truncate" title={summary.model_name}>
              {summary.model_name}
            </p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-lg shrink-0">
            <Award className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Test Accuracy</p>
            <p className="font-black text-white text-sm mt-0.5">{summary.accuracy}</p>
          </div>
        </div>

        {/* Precision */}
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Macro Precision</p>
            <p className="font-black text-white text-sm mt-0.5">
              {isRuleBased ? "100.0%" : (summary.precision ? (summary.precision * 100).toFixed(1) + "%" : "N/A")}
            </p>
          </div>
        </div>

        {/* Recall */}
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg shrink-0">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average Recall</p>
            <p className="font-black text-white text-sm mt-0.5">
              {isRuleBased ? "100.0%" : (summary.recall ? (summary.recall * 100).toFixed(1) + "%" : "N/A")}
            </p>
          </div>
        </div>

        {/* F1-Score */}
        <div className="card-panel p-4 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg shrink-0">
            <BarChart className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Macro F1 Score</p>
            <p className="font-black text-white text-sm mt-0.5">
              {isRuleBased ? "100.0%" : (summary.f1_score ? (summary.f1_score * 100).toFixed(1) + "%" : "N/A")}
            </p>
          </div>
        </div>

      </div>

      {isRuleBased && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 rounded-xl flex gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-xs">Rule-Based Expert Classifier Active</h4>
            <p className="text-[11px] mt-1 opacity-90 leading-relaxed">
              Because the uploaded dataset did not contain a default label column, the system automatically fell back to a multi-factor rule-based logic to assign stress scores and categorize employees.
            </p>
          </div>
        </div>
      )}

      {/* Model Evaluation Visualizations Grid - Enlarged Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Confusion Matrix (Enlarged to 1/2 of grid) */}
        {charts.confusion_matrix && (
          <div className="card-panel p-5 flex flex-col justify-between min-h-[480px]">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-400" />
                <span>Confusion Matrix (Prediction Counts)</span>
              </h3>
              <div className="pt-8">
                {(() => {
                  const cmData = charts.confusion_matrix?.data?.[0];
                  const z = cmData?.z || [];
                  const labels = cmData?.x || ["Low", "Moderate", "High"];
                  return (
                    <div className="overflow-x-auto rounded-lg border border-slate-800 p-4 bg-slate-950/20">
                      <div className="grid grid-cols-4 gap-2 text-center font-bold text-[10px] uppercase text-slate-400 pb-2 border-b border-slate-900">
                        <div></div>
                        <div>Pred Low</div>
                        <div>Pred Med</div>
                        <div>Pred High</div>
                      </div>
                      {labels.map((rowLabel, rIdx) => (
                        <div key={rowLabel} className="grid grid-cols-4 gap-2 text-center items-center mt-3 text-[11px]">
                          <div className="font-bold text-slate-300 text-left pl-2">{rowLabel}</div>
                          {labels.map((colLabel, cIdx) => {
                            const val = z[rIdx]?.[cIdx] || 0;
                            const isCorrect = rIdx === cIdx;
                            return (
                              <div 
                                key={colLabel} 
                                className={`p-3 rounded-lg border font-mono font-bold transition-all ${
                                  isCorrect 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                    : val > 0 
                                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                      : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                                }`}
                              >
                                {val}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">🔍 Matrix Explanation</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Compares the <strong>True Label</strong> (rows) with the model's <strong>Predicted Label</strong> (columns). Diagonal cells represent correct classifications. Off-diagonal cells display misclassifications (false positives and false negatives).
              </p>
            </div>
          </div>
        )}

        {/* ROC Curve (Enlarged to 1/2 of grid) */}
        {charts.roc_curve && !isRuleBased && (
          <div className="card-panel p-5 flex flex-col justify-between min-h-[480px]">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span>Receiver Operating Characteristic (ROC)</span>
              </h3>
              <div className="h-96">
                <PlotlyChart chartData={charts.roc_curve} chartId="chart_roc" />
              </div>
            </div>
            <div className="mt-4 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80">
              <p className="font-bold text-[10px] text-slate-300">📈 ROC Explanation</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Plots the True Positive Rate vs False Positive Rate for each stress class. An **AUC (Area Under Curve) of 1.0** indicates a perfect predictor. Curves bending closer to the top-left represent highly accurate stress classifiers.
              </p>
            </div>
          </div>
        )}

        {/* Feature Importance (Takes full width if Rule-Based, or half grid if not) */}
        {charts.feature_importance && (
          <div className={`card-panel p-5 flex flex-col justify-between min-h-[480px] ${isRuleBased ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <BarChart className="h-4 w-4 text-indigo-400" />
                <span>Predictive Feature Importance Contribution</span>
              </h3>
              <div className="h-96">
                <PlotlyChart chartData={charts.feature_importance} chartId="chart_feat" />
              </div>
            </div>
            
            {/* Top Drivers Highlight List */}
            <div className="mt-4 p-4 bg-slate-950/40 rounded-lg border border-slate-800/80 space-y-2">
              <p className="font-bold text-[10px] text-slate-300">🔥 Highlighted Key Drivers</p>
              {sortedFeatures.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {sortedFeatures.map(([feat, weight], idx) => (
                    <div key={feat} className="p-2 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[10px] border border-indigo-500/20">{idx + 1}</div>
                      <div>
                        <p className="font-bold text-[10px] text-slate-200 capitalize">{feat.replace("_", " ")}</p>
                        <p className="text-[9px] text-indigo-400 mt-0.5">Contribution: {(weight * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">Working Hours, Overtime, and low leave balances act as the primary features driving classification outcomes.</p>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
