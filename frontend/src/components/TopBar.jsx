import React, { useState } from 'react';
import { Bell, User, Sun, Moon, Calendar, LogOut } from 'lucide-react';

export default function TopBar({ username, isDarkMode, setIsDarkMode, onLogout, notifications = [] }) {
  const [showNotif, setShowNotif] = useState(false);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="h-16 topbar-panel rounded-none flex items-center justify-between px-6 z-20 shrink-0">
      {/* Page Context Date */}
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
        <Calendar className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
        <span>{currentDate}</span>
      </div>

      {/* Profile & Notifications Actions */}
      <div className="flex items-center gap-4">
        {/* Dark Mode toggle quick action */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500"></span>
            )}
          </button>
          
          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 card-panel p-4 shadow-xl z-50 animate-fade-in text-xs">
              <h4 className="font-bold text-[var(--text-primary)] border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">Notifications</h4>
              {notifications.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {notifications.map((n, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] italic text-center py-4">No new notifications</p>
              )}
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-300 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none">
            {username ? username[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden sm:block text-left mr-2">
            <p className="text-xs font-bold text-[var(--text-primary)]">{username || 'Administrator'}</p>
            <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Corporate Workspace</p>
          </div>
        </div>

        {/* Top Navigation Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-lg border border-slate-800 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/20 transition cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
