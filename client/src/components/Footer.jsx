import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Activity,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Heart,
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs">
      {/* Top Footer Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand Info & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Campus<span className="text-blue-500">Fix</span>
              </span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              The institutional standard for smart campus problem reporting, automated ticket dispatch, and verified facilities resolution. Connecting students, technicians, and administration.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Campus Facilities & Helpdesk Systems Active</span>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Departments
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#categories" className="hover:text-white transition-colors">Classroom AV & Equipment</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Electrical & Power Systems</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Campus Wi-Fi & IT Network</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Plumbing & Water Supply</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Hostel & Housing Blocks</a></li>
              <li><a href="#categories" className="hover:text-white transition-colors">Laboratory Facilities</a></li>
            </ul>
          </div>

          {/* Platform Portals */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/student" className="hover:text-white transition-colors">Student Reporting Desk</Link></li>
              <li><Link to="/staff" className="hover:text-white transition-colors">Maintenance Staff Portal</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Administration Console</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Authentication Gateway</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Student Account Setup</Link></li>
            </ul>
          </div>

          {/* Emergency & Campus Support */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Campus Support
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Emergency: ext. 4444 / (555) 019-2000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>facilities@campusfix.edu</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Estate Management Office, North Campus Block</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="border-t border-slate-900 bg-slate-950/80 py-5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 CampusFix – Smart Campus Problem Reporting and Resolution System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Powered by MongoDB, Express, React & Node.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
