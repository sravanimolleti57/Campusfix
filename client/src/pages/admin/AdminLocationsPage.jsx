import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import {
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Layers,
  Sparkles,
} from 'lucide-react';
import Loading from '../../components/ui/Loading';
import ErrorMessage from '../../components/ui/ErrorMessage';
import EmptyState from '../../components/ui/EmptyState';

const AdminLocationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState('');

  const fetchLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await adminService.getLocations();
      if (data.success && data.locations) {
        setLocations(data.locations);
      }
    } catch (err) {
      console.error('Failed to load locations overview:', err);
      setError(err.response?.data?.message || 'Could not fetch campus locations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Campus Infrastructure Hotspots</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {locations.length} Tracked Zones
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Identify recurring maintenance hotspots across academic lecture halls, departmental labs, and residential hostels
          </p>
        </div>

        <Link
          to="/admin/complaints"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <span>All Complaints</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search location (e.g. Science Block, Room 204)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {loading && <Loading message="Compiling campus location hotspots..." size="lg" className="py-20" />}

      {error && !loading && (
        <ErrorMessage
          title="Could not load locations"
          message={error}
          onRetry={fetchLocations}
          variant="card"
        />
      )}

      {!loading && !error && (
        <>
          {filteredLocations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations found"
              description="No defect records match your current location filter."
              actionText="Reset Search"
              onAction={() => setSearch('')}
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="stat-card bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>

                      {loc.active > 0 ? (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                          {loc.active} Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                          All Clear
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight">
                        {loc.location}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        <span className="text-slate-200 font-semibold">{loc.total}</span> total complaints logged
                      </p>
                    </div>

                    {/* Categories Tag Chips */}
                    {loc.categories && loc.categories.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {loc.categories.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[10px] text-slate-400"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer link */}
                  <Link
                    to={`/admin/complaints?search=${encodeURIComponent(loc.location)}`}
                    className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <span>View Spot Complaints</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLocationsPage;
