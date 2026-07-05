import React, { useState } from 'react';
import { Settings, Shield, User, Bell, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function SettingsPage({ username, token, backendUrl, isDarkMode, setIsDarkMode }) {
  const [passwordForm, setPasswordForm] = useState({ username_or_email: username, new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!passwordForm.new_password || !passwordForm.confirm_password) {
      setError("Please fill in both password fields.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_or_email: username,
          new_password: passwordForm.new_password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to update password.");
      }

      setSuccess("Your account password has been updated successfully.");
      setPasswordForm({ username_or_email: username, new_password: '', confirm_password: '' });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-fade-in text-xs">
      
      {/* Title */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white">Account Settings</h1>
        <p className="text-[10px] text-slate-400 mt-0.5">Manage credentials, theme choices, and email notifications</p>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-300 rounded-lg text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-lg text-xs flex items-start gap-2.5">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-400 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Profile & Themes */}
        <div className="space-y-6">
          {/* User Profile */}
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <User className="h-4.5 w-4.5 text-indigo-500" />
              <span>User Profile context</span>
            </h3>
            
            <div className="space-y-3 font-medium">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Account Username</span>
                <span className="text-slate-200 font-bold">{username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Access Role</span>
                <span className="text-emerald-400 font-bold">Authorized Workspace Analyst</span>
              </div>
            </div>
          </div>

          {/* Theme selection */}
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white">Visual Themes Selection</h3>
            <div className="flex items-center justify-between font-medium">
              <span className="text-slate-400">Dark Mode Interface Theme</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Toggle Theme
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Password Form */}
        <div className="space-y-6">
          <div className="card-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-indigo-500" />
              <span>Security & Password change</span>
            </h3>

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.new_password}
                  onChange={(e) => {
                    setError(null);
                    setSuccess(null);
                    setPasswordForm({...passwordForm, new_password: e.target.value});
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-white outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirm_password}
                  onChange={(e) => {
                    setError(null);
                    setSuccess(null);
                    setPasswordForm({...passwordForm, confirm_password: e.target.value});
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
