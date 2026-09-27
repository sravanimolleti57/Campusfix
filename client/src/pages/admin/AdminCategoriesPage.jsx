import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import {
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import { getCategoryIcon } from '../../utils/complaintHelpers';

const AdminCategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminService.getCategories();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories overview:', err);
      setError(err.response?.data?.message || 'Could not fetch category metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Problem Categories & Trade Scope</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              10 Active Classifications
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Institutional defect volume, pending triage queues, and resolution rates across facility departments
          </p>
        </div>

        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <span>All Complaints Triage</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading && <Loading message="Analyzing category complaint volumes..." size="lg" className="py-20" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load categories"
          message={error}
          onRetry={fetchCategories}
          variant="card"
        />
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.name);
            const resolutionRate = cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 100;

            return (
              <div
                key={cat.name}
                className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top: Icon + Title */}
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>

                    {cat.critical > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        <AlertTriangle className="w-3 h-3 text-rose-400" /> {cat.critical} Critical
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                        Normal SLA
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat.total} reported • {cat.pending} pending
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                      <span className="text-base font-extrabold text-white">{cat.total}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-[10px] text-amber-400 block font-semibold">Pending</span>
                      <span className="text-base font-extrabold text-amber-300">{cat.pending}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                      <span className="text-[10px] text-emerald-400 block font-semibold">Resolved</span>
                      <span className="text-base font-extrabold text-emerald-300">{cat.resolved}</span>
                    </div>
                  </div>

                  {/* Resolution Rate Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 font-medium">Resolution Rate</span>
                      <span className={`font-bold ${resolutionRate >= 70 ? 'text-emerald-400' : resolutionRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {resolutionRate}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          resolutionRate >= 70 ? 'bg-emerald-500' :
                          resolutionRate >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${resolutionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <Link
                  to={`/admin/complaints?category=${encodeURIComponent(cat.name)}`}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span>View Tickets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
