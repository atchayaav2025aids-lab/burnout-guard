import React, { useState } from 'react';
import { 
  Home, Upload, CheckCircle2, BarChart3, Cpu, LineChart, 
  FileText, Users, History, Settings, LogOut, Brain, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, onLogout, isDarkMode, setIsDarkMode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'upload', name: 'Upload Dataset', icon: Upload },
    { id: 'cleaning', name: 'Data Cleaning', icon: CheckCircle2 },
    { id: 'eda', name: 'Exploratory Data Analysis', icon: BarChart3 },
    { id: 'predict', name: 'ML Prediction', icon: Cpu },
    { id: 'visualizations', name: 'Visualizations', icon: LineChart },
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'employee_details', name: 'Employee Details', icon: Users },
    { id: 'history', name: 'Analysis History', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar-panel text-[var(--text-primary)] min-h-screen flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <div>
        {/* App Logo & Toggle Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/20 h-16">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white shadow-md shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-extrabold text-base tracking-tight text-[var(--text-primary)] animate-fade-in">
                Stress<span className="text-indigo-400">Risk</span>
              </span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-slate-500/10 text-slate-400 hover:text-[var(--text-primary)] cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'
                } ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white shadow-lg font-bold' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-500/10 dark:hover:bg-slate-900/60'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                {!isCollapsed && <span className="animate-fade-in">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Toggle & Logout */}
      <div className="p-4 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onLogout}
          className={`w-full flex items-center rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer ${
            isCollapsed ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'
          }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
