import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Wrench,
  Lock,
  Mail,
  ArrowRight,
  Shield,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      showToast(`Welcome back, ${result.user.name}!`, 'success');
      if (from) {
        navigate(from, { replace: true });
        return;
      }

      if (result.user.role === 'admin') navigate('/admin');
      else if (result.user.role === 'staff') navigate('/staff');
      else navigate('/student');
    } else {
      setFormError(result.message);
      showToast(result.message, 'error');
    }
  };

  // Quick fill helper for testing all 3 roles
  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setFormError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl shadow-black/40 space-y-7 backdrop-blur-sm">
          {/* Top Header */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
              <Wrench className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign in to CampusFix</h1>
              <p className="text-sm text-slate-400 mt-1">
                Enter your campus credentials to access your portal
              </p>
            </div>
          </div>

          {/* Demo Quick Credentials for Testing */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-blue-400" /> Quick-Test Credentials
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student@campusfix.edu', 'studentpassword123')}
                className="py-2 px-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5" /> Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('staff@campusfix.edu', 'staffpassword123')}
                className="py-2 px-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Briefcase className="w-3.5 h-3.5" /> Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@campusfix.edu', 'adminpassword123')}
                className="py-2 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5" /> Admin
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-sm text-slate-300 font-semibold">Campus Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="yourname@campusfix.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-sm text-slate-300 font-semibold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link to Register */}
          <div className="text-center pt-2 border-t border-slate-800/60 text-sm text-slate-400">
            <span>Don't have an account? </span>
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Register as Student
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
