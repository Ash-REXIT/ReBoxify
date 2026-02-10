
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, PackageIcon, LeafIcon, DashboardIcon, TruckIcon, QRIcon, BuildingIcon } from '../components/Icons';

interface LandingPageProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}


const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors duration-700">
      {/* Header / Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group hover:scale-105 transition-all" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xl transition-transform group-hover:rotate-6">R</div>
            <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white transition-colors">ReBoxify</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-50/50 dark:from-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="lg:w-1/2">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-8 transition-colors">SDG 12: Circular Economy Hub</span>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] mb-8 tracking-tighter transition-colors">
              Redefining the <span className="text-emerald-600">Box</span> Lifecycle.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed font-medium transition-colors">
              Replace cardboard waste with smart Polypropylene assets. Secured by deposits, optimized by QR, and rewarded with Green Tokens.
            </p>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full opacity-50 animate-pulse"></div>
            <div className="aspect-square bg-white dark:bg-slate-800 rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white/50 dark:border-white/5 transform lg:rotate-3">
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" alt="Sustainable Logistics" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* The ReBoxify Lifecycle */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter transition-colors">The Circular Workflow</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg font-medium transition-colors">From the factory to your door and back again — a waste-free delivery ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { id: '01', title: 'MNC Branding', desc: 'Brands like Amazon order unique-ID PP boxes. Lasered with permanent QR codes for individual tracking.' },
              { id: '02', title: 'The Eco-Choice', desc: 'Select "Eco-Box" at checkout. Pay a ₹80 refundable deposit. Worker scans QR at dispatch.' },
              { id: '03', title: 'Smart Returns', desc: '14-day return window. Return via next delivery or agent pickup. QR scan confirms the loop.' },
              { id: '04', title: 'Token Rewards', desc: 'Deposit refunded instantly + Green Tokens awarded. Used boxes are cleaned or recycled' }
            ].map((step, i) => (
              <div key={i} className="aspect-square p-10 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-[2.5rem] group hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 flex flex-col items-center text-center justify-center">
                <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 font-black text-xl group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/10">{step.id}</div>
                <h3 className="font-black text-xl mb-3 tracking-tight text-slate-900 dark:text-white transition-colors">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium transition-colors max-w-[180px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white dark:bg-[#020617] text-slate-900 dark:text-white px-6 relative overflow-hidden transition-colors duration-700">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 dark:from-emerald-900/10 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center relative z-10">
          <div>
            <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter transition-colors">Unified Control Hubs</h2>
            <div className="space-y-6">
              {[
                { path: '/user-login', icon: <UserIcon />, color: 'emerald', label: 'Consumer Dashboard', desc: 'Track deposits, timers, and Green Tokens.', border: 'hover:border-emerald-500' },
                { path: '/company-login', icon: <BuildingIcon />, color: 'indigo', label: 'MNC Inventory Manager', desc: 'Monitor Brand-unique IDs and degradation.', border: 'hover:border-indigo-500' },
                { path: '/partner-login', icon: <TruckIcon />, color: 'orange', label: 'Logistics Hub', desc: 'Delivery and Return scanning workflows.', border: 'hover:border-orange-500' },
                { path: '/admin-login', icon: <DashboardIcon />, color: 'emerald', label: 'Super Admin Security', desc: 'Platform-wide access, MNC governance, and KPIs.', border: 'hover:border-emerald-500' }
              ].map((role, i) => (
                <div key={i} onClick={() => navigate(role.path)} className={`p-8 bg-slate-50 dark:bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-slate-200 dark:border-white/5 ${role.border} transition-all cursor-pointer group`}>
                  <div className="flex justify-between items-center gap-6">
                    <div className="flex gap-6 items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${role.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                        role.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-orange-500/10 text-orange-500'
                        }`}>
                        {role.icon}
                      </div>
                      <div>
                        <h4 className="font-black text-xl tracking-tight leading-none mb-2 text-slate-900 dark:text-white transition-colors">{role.label}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-colors">{role.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => navigate(role.path)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl dark:shadow-none ${role.color === 'emerald' ? 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700' :
                        role.color === 'indigo' ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700' :
                          'bg-orange-600 text-white shadow-orange-500/20 hover:bg-orange-700'
                        }`}>Login</button>
                      <button className="shrink-0 w-12 h-12 bg-slate-200/50 dark:bg-white/10 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 text-slate-600 dark:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative group overflow-hidden bg-slate-900 dark:bg-emerald-600/5 rounded-[4rem] p-16 shadow-2xl transition-all duration-700 border border-slate-800 dark:border-emerald-500/20">
            {/* Animated Background Mesh */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <div className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-emerald-600/30 rounded-full blur-[100px] animate-pulse"></div>
              <div className="absolute -bottom-[20%] -left-[10%] w-[80%] h-[80%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/10">
                <LeafIcon />
              </div>
              <h3 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter text-white">Sustainable Impact</h3>
              <p className="text-slate-400 dark:text-emerald-100/60 mb-12 leading-relaxed text-lg font-medium">ReBoxify aligns with UN SDG 12 & 13 by automating the friction out of reusable packaging. Our system ensures 100% accountability through mandatory deposit safeguards.</p>

              <div className="grid grid-cols-2 gap-8">
                <div className="bg-white/[0.03] dark:bg-white/[0.05] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 transition-all group/stat">
                  <div className="text-5xl font-black mb-2 text-white group-hover/stat:scale-110 transition-transform">10+</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Cycles per box</div>
                </div>
                <div className="bg-white/[0.03] dark:bg-white/[0.05] backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 hover:border-indigo-500/30 transition-all group/stat">
                  <div className="text-5xl font-black mb-2 text-white group-hover/stat:scale-110 transition-transform">₹80</div>
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">Fixed Deposit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-20 bg-slate-50 dark:bg-[#020617] transition-colors border-t border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black">R</div>
              <span className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white transition-colors">ReBoxify</span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] text-center md:text-left">© 2024 ReBoxify Logistics Solutions.<br />Built for SDG Reuseability.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-10">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Platform</span>
              <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Privacy</a>
              <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Compliance</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Governance</span>
              <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Root Node</a>
              <a href="#" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Audit Ledger</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
