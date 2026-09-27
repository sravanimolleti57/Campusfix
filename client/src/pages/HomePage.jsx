import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Shield,
  ArrowRight,
  Sparkles,
  Wifi,
  Zap,
  Droplets,
  Monitor,
  Home,
  FlaskConical,
  Trash2,
  TreePine,
  Search,
  CheckCircle,
  FileCheck,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const stats = [
  { label: 'Campus Issues Resolved', value: '4,850+', change: '+12% this semester' },
  { label: 'Verified Resolution Rate', value: '98.4%', change: 'Quality checked' },
  { label: 'Average Turnaround', value: '< 18 hrs', change: 'Emergency: < 2 hrs' },
  { label: 'Campus Facilities Covered', value: '14 Blocks', change: 'Academic & Hostels' },
];

const howItWorksSteps = [
  {
    step: '01',
    title: 'Spot & Report',
    desc: 'Students snap a photo of the defect, tag the campus location (e.g. Science Block B, Room 204), and submit in seconds.',
    icon: AlertCircle,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    step: '02',
    title: 'Intelligent Triage',
    desc: 'Campus administration reviews ticket severity (Low, Medium, Critical) and dispatches it directly to the designated trade technician.',
    icon: Layers,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    step: '03',
    title: 'On-Site Resolution',
    desc: 'Maintenance staff receives real-time task notifications, carries required parts, completes the repair, and attaches photographic proof.',
    icon: Wrench,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  {
    step: '04',
    title: 'Student Verification',
    desc: 'The reporting student verifies that the equipment or facility is working properly before the ticket is officially closed.',
    icon: CheckCircle2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
];

const categories = [
  {
    name: 'Classroom AV & Equipment',
    desc: 'Ceiling projectors, smart podiums, microphone systems, and student seating in lecture halls.',
    icon: Monitor,
    urgentExample: 'Faulty HDMI projection in Lecture Theatre 1',
  },
  {
    name: 'Electrical & Power Systems',
    desc: 'Tripped circuit breakers, non-functional ceiling fans, faulty switchboards, and corridor illumination.',
    icon: Zap,
    urgentExample: 'Power socket failure in Computer Center A',
  },
  {
    name: 'Campus Wi-Fi & IT Infrastructure',
    desc: 'Access point outages, weak signal spots in libraries, and ethernet port failures in departmental labs.',
    icon: Wifi,
    urgentExample: 'Wi-Fi AP offline on Library 2nd Floor',
  },
  {
    name: 'Plumbing & Water Supply',
    desc: 'Restroom tap leaks, water cooler filter replacements, low pressure, and drainage blockages.',
    icon: Droplets,
    urgentExample: 'Water cooler overflow in Mechanical Wing',
  },
  {
    name: 'Hostel Maintenance & Housing',
    desc: 'Residential room furniture, bathroom geysers, balcony doors, and common room facilities.',
    icon: Home,
    urgentExample: 'Geyser heating element trip in Hostel Block 3',
  },
  {
    name: 'Laboratory Facilities & Safety',
    desc: 'Fume hood ventilation, emergency eye-wash stations, gas valve leaks, and test equipment power.',
    icon: FlaskConical,
    urgentExample: 'Fume extractor non-functional in Organic Lab',
  },
  {
    name: 'Campus Sanitation & Hygiene',
    desc: 'Waste disposal bins, sanitization dispenser refills, and corridor sweeping maintenance.',
    icon: Trash2,
    urgentExample: 'Recycling station full outside Cafeteria',
  },
  {
    name: 'Grounds & Campus Security',
    desc: 'Pathway paving hazards, perimeter fence lighting, emergency call-box stations, and signage.',
    icon: TreePine,
    urgentExample: 'Pathway streetlamp defective near East Gate',
  },
];

const lifecycleStages = [
  { stage: '1. Submitted', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', desc: 'Ticket logged with timestamp and location coordinates.' },
  { stage: '2. Under Review', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', desc: 'Admin assesses priority and checks duplicate reports.' },
  { stage: '3. Assigned', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', desc: 'Allocated to qualified electrical, plumbing, or IT technician.' },
  { stage: '4. In Progress', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', desc: 'Technician on-site carrying diagnostics and replacement parts.' },
  { stage: '5. Resolved', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', desc: 'Repair concluded with completion photos and technician notes.' },
  { stage: '6. Verified / Closed', badge: 'bg-slate-800 text-slate-300 border-slate-700', desc: 'Student reviews fix and marks issue resolved.' },
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleReportProblem = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'student') {
      navigate('/student/report');
    } else if (user?.role === 'staff') {
      navigate('/staff');
    } else {
      navigate('/admin');
    }
  };

  const handleTrackComplaint = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role === 'student') {
      navigate('/student/complaints');
    } else if (user?.role === 'staff') {
      navigate('/staff');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Glow ambient background circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/15 blur-[140px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/4 right-5 w-[350px] h-[250px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Smart Institutional Facilities Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Report Campus Problems.<br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                Track Real Solutions.
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl mx-auto">
              CampusFix eliminates lost paper slips, forgotten verbal reports, and informal messages. Empowering students, maintenance staff, and campus administration through a single accountable platform.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={handleReportProblem}
                id="hero-report-btn"
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <span>Report a Problem</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleTrackComplaint}
                id="hero-track-btn"
                className="px-7 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-blue-400" />
                <span>Track Complaint</span>
              </button>
            </div>

            {/* Live operational badge */}
            <div className="pt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold text-slate-300">Live Campus Dispatch Desk:</span>
              <span>Available 24/7 across all campus zones</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATISTICS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1 text-center sm:text-left">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {s.value}
                </span>
                <h4 className="text-xs font-bold text-slate-200">{s.label}</h4>
                <p className="text-[11px] text-blue-400 font-medium">{s.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. HOW CAMPUSFIX WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Resolution Workflow</span>
          <h2 className="text-3xl font-extrabold text-white">How CampusFix Works</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            From fault detection to verified resolution, every campus maintenance request follows a clear four-step chain of custody.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorksSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="stat-card bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition relative"
              >
                <div className="flex justify-between items-start">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-700">{step.step}</span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PROBLEM CATEGORIES */}
      <section id="categories" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Department Scope</span>
          <h2 className="text-3xl font-extrabold text-white">Covered Problem Categories</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            CampusFix routes complaints directly to specialized campus technicians based on precise trade classifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                className="stat-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/30 transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{cat.desc}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-400 block">Recent triage:</span>
                  <span className="truncate block italic">{cat.urgentExample}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. COMPLAINT LIFECYCLE */}
      <section id="lifecycle" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Total Transparency</span>
          <h2 className="text-3xl font-extrabold text-white">The Complaint Lifecycle</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Track status transitions in real time. No ticket is marked resolved until the fix is certified.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {lifecycleStages.map((stage, idx) => (
              <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${stage.badge}`}>
                  {stage.stage}
                </span>
                <p className="text-[11px] text-slate-400 leading-snug">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BENEFITS SECTION */}
      <section id="benefits" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Campus Stakeholders</span>
          <h2 className="text-3xl font-extrabold text-white">Benefits for the Entire University</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Structured accountability elevates facilities maintenance across all campus departments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* For Students */}
          <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">For Students</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No more wondering whether broken laboratory equipment or dark hostel hallways will be repaired. Get a tracking ticket with full status visibility.
            </p>
            <ul className="text-xs space-y-2 text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">✓ Report from mobile in under 60 seconds</li>
              <li className="flex items-center gap-2">✓ Automated status notifications</li>
              <li className="flex items-center gap-2">✓ Verified closure feedback</li>
            </ul>
          </div>

          {/* For Staff */}
          <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">For Maintenance Staff</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clear work queues organized by building, floor, and urgency. Technicians carry the right parts on the first visit with attached complaint photographs.
            </p>
            <ul className="text-xs space-y-2 text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">✓ Filter tasks by trade & room number</li>
              <li className="flex items-center gap-2">✓ Upload before/after proof of work</li>
              <li className="flex items-center gap-2">✓ Document materials & spare parts used</li>
            </ul>
          </div>

          {/* For Administration */}
          <div className="stat-card bg-slate-900/50 border border-slate-800 rounded-2xl p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">For Campus Administration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Institutional intelligence on recurring maintenance bottlenecks, staff SLA compliance, and data-driven facilities budget allocations.
            </p>
            <ul className="text-xs space-y-2 text-slate-300 pt-2 border-t border-slate-800/80">
              <li className="flex items-center gap-2">✓ Recharts analytical dashboards</li>
              <li className="flex items-center gap-2">✓ Average turnaround SLA enforcement</li>
              <li className="flex items-center gap-2">✓ Institutional audit trail & history</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 p-8 sm:p-12 shadow-2xl text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Notice an infrastructure defect on campus today?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Help improve our learning and living spaces. Log a problem in under 60 seconds and track its verified repair right from your device.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={handleReportProblem}
              className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              to="/register"
              className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold hover:-translate-y-0.5 transition-all"
            >
              <span>Create Student Account</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
