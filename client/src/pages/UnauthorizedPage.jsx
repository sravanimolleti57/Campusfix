import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const UnauthorizedPage = () => {
  const { user } = useAuth();

  const getBackPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'staff') return '/staff';
    return '/student';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-white">403 - Access Denied</h1>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Your current account role <span className="font-semibold text-slate-200">({user?.role || 'Guest'})</span> does not have authorization to view this area.
        </p>
      </div>

      <Link
        to={getBackPath()}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to My Portal
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
