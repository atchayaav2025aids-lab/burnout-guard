import React from 'react';
import { Brain, ArrowRight, ShieldCheck, BarChart4, ClipboardList, Database, Sparkles } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
            <Brain className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Stress<span className="text-indigo-400">Risk</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 hover:bg-white/5 rounded-lg transition cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition cursor-pointer shadow-md shadow-blue-500/20"
          >
            Register
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center space-y-6 relative">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl -z-10"></div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
          Employee Stress Risk Analysis System
        </h1>
        
        <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
          Unlock workforce resilience. Upload employee metrics, apply data cleaning pipelines, compare machine learning algorithms, and download executive briefs to preempt employee stress.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate('signup')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs px-6 py-3.5 rounded-lg shadow-lg shadow-purple-500/20 transition cursor-pointer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-white/10 text-white px-6 py-3.5 rounded-lg transition cursor-pointer"
          >
            Sign In to Continue
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-slate-900/30 border-y border-white/5 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Data-Driven Wellbeing for High-Performance Teams
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              StressRisk matches workforce metrics like working hours, overtime levels, leaves, and satisfaction indices against advanced predictive models to help HR administrators identify departments or individuals facing moderate or high stress levels.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5">
                <h4 className="font-bold text-white text-lg">93.0%</h4>
                <p className="text-[10px] text-slate-400 mt-1">Classification Accuracy</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-white/5">
                <h4 className="font-bold text-white text-lg">Realtime</h4>
                <p className="text-[10px] text-slate-400 mt-1">"What-If" Workload Simulator</p>
              </div>
            </div>
          </div>
          
          <div className="relative p-6 bg-gradient-to-tr from-blue-900/10 to-purple-900/10 border border-white/10 rounded-2xl shadow-xl flex items-center justify-center">
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-slate-400 font-mono">Cohort: core_engineering.csv</span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Completed</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span>Total Employees</span> <span className="font-bold">2,000</span></div>
                <div className="flex justify-between"><span>Overall Stress Risk</span> <span className="font-bold text-orange-400">18.5%</span></div>
                <div className="flex justify-between"><span>Selected Predictor</span> <span className="font-bold text-indigo-400">Random Forest</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-extrabold text-white">Full-Stack Capability Breakdown</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Everything you need to ingest, analyze, predict, and export employee stress diagnostics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Unified Hosting", desc: "FastAPI serving both the prediction backend and static React assets on one port.", icon: Database },
            { title: "Data Cleaning", desc: "Automated duplicate removal, outlier capping, missing value imputation, and scaling.", icon: ShieldCheck },
            { title: "Exploratory Plots", desc: "Interactive Plotly visual charts for demographics, sleep metrics, and work correlations.", icon: BarChart4 },
            { title: "HR Reporting", desc: "Generate professional executive briefs downloadable as PDF, Excel spreadsheets, and CSV.", icon: ClipboardList },
          ].map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-6 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 hover:bg-slate-900/60 transition">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg w-max mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-white mb-2">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-slate-950">
        &copy; {new Date().getFullYear()} StressRisk Analysis System. Built with FastAPI, SQLite, Scikit-Learn, and React.
      </footer>
    </div>
  );
}
