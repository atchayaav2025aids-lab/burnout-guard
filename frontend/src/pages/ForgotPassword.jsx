import React, { useState } from 'react';
import { Brain, Lock, User, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';

export default function ForgotPassword({ onNavigate, backendUrl }) {
  const [formData, setFormData] = useState({ username_or_email: '', new_password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username_or_email || !formData.new_password) {
      setError("Please fill in all details.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed.");
      }

      setSuccess("Password successfully updated. Redirecting to login...");
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 select-none relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-white/10 shadow-2xl space-y-6 backdrop-blur-md">
        
        {/* App Logo */}
        <div className="flex flex-col items-center text-center space-y-2 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
            <Brain className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white mt-2">
            Reset Password
          </h2>
          <p className="text-[11px] text-slate-400">Update your account credentials below</p>
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
 
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">Username or Email</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                placeholder="john_doe or john@corporate.com"
                value={formData.username_or_email}
                onChange={(e) => {
                  setError(null);
                  setSuccess(null);
                  setFormData({...formData, username_or_email: e.target.value});
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white outline-none placeholder-slate-600 transition"
              />
            </div>
          </div>
 
          <div className="space-y-1">
            <label className="text-slate-400 font-semibold">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={formData.new_password}
                onChange={(e) => {
                  setError(null);
                  setSuccess(null);
                  setFormData({...formData, new_password: e.target.value});
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-white outline-none placeholder-slate-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-400 border-t border-slate-800/80 pt-4">
          <button 
            onClick={() => onNavigate('login')} 
            className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
          >
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
}
