
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
    <div className="min-h-screen bg-white">
      {/* Header / Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">R</div>
            <span className="text-xl font-bold tracking-tight text-slate-800">ReBoxify</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6">SDG 12: Sustainable Consumption</span>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] mb-6">Redefining the Delivery Box Lifecycle.</h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Replace cardboard waste with smart Polypropylene boxes. Tracked by QR, secured by deposits, and rewarded with Green Tokens.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/user-portal')} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all">Start Your Eco-Journey</button>
              <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all">View ROI for Brands</button>
            </div>
          </div>
          <div className="lg:w-1/2 relative">
            <div className="aspect-square bg-emerald-100/50 rounded-[3rem] overflow-hidden">
              <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000" alt="Sustainable Logistics" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
            </div>
          </div>
        </div>
      </section>


      {/* The ReBoxify Lifecycle */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">The Circular Workflow</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">From the factory to your door and back again — a waste-free delivery ecosystem.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 font-bold">01</div>
              <h3 className="font-bold text-xl mb-3">MNC Branding</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Brands like Amazon order unique-ID PP boxes. Lasered with permanent QR codes for individual tracking.</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 font-bold">02</div>
              <h3 className="font-bold text-xl mb-3">The Eco-Choice</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Select "Eco-Box" at checkout. Pay a ₹80 refundable deposit (based on size). Worker scans QR at dispatch.</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 font-bold">03</div>
              <h3 className="font-bold text-xl mb-3">Smart Returns</h3>
              <p className="text-slate-500 text-sm leading-relaxed">14-day cooldown period. Return via next delivery or agent pickup. QR scan confirms the return loop.</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-6 font-bold">04</div>
              <h3 className="font-bold text-xl mb-3">Token Rewards</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Deposit refunded instantly + Green Tokens awarded. Used boxes are cleaned or recycled if degraded.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-900 text-white px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-bold mb-8">Integrated Platform Architecture</h2>
            <div className="space-y-6">
              <div onClick={() => navigate('/user-portal')} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserIcon /></div>
                  <div>
                    <h4 className="font-bold">Consumer Dashboard</h4>
                    <p className="text-slate-400 text-sm">Track deposits, countdown timers, and Green Tokens.</p>
                  </div>
                </div>
              </div>
              <div onClick={() => navigate('/company-admin')} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-indigo-500 transition-all cursor-pointer group">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><BuildingIcon /></div>
                  <div>
                    <h4 className="font-bold">MNC Inventory Manager</h4>
                    <p className="text-slate-400 text-sm">Monitor Brand-unique IDs and degradation metrics.</p>
                  </div>
                </div>
              </div>
              <div onClick={() => navigate('/delivery-partner')} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-orange-500 transition-all cursor-pointer group">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><TruckIcon /></div>
                  <div>
                    <h4 className="font-bold">Logistics Hub</h4>
                    <p className="text-slate-400 text-sm">Delivery and Return scanning workflows.</p>
                  </div>
                </div>
              </div>
              <div onClick={() => navigate('/super-admin')} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer group">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><DashboardIcon /></div>
                  <div>
                    <h4 className="font-bold">Super Admin Control Panel</h4>
                    <p className="text-slate-400 text-sm">Manage platform-wide access, assign MNC admins, oversee box inventory, and monitor sustainability metrics.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-emerald-600 p-12 rounded-[3rem] shadow-2xl shadow-emerald-500/20">
            <h3 className="text-3xl font-bold mb-6">Sustainable Impact</h3>
            <p className="text-emerald-100 mb-8 leading-relaxed">ReBoxify aligns with UN SDG 12 & 13 by automating the friction out of reusable packaging. Our system ensures 100% box accountability through mandatory deposit and autopay safeguards.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-700 p-6 rounded-2xl">
                <div className="text-3xl font-bold">100+</div>
                <div className="text-sm text-emerald-200">Cycles per box</div>
              </div>
              <div className="bg-emerald-700 p-6 rounded-2xl">
                <div className="text-3xl font-bold">₹80</div>
                <div className="text-sm text-emerald-200">Fixed Deposit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-600 rounded flex items-center justify-center text-white font-bold text-xs">R</div>
            <span className="font-bold text-slate-800">ReBoxify</span>
          </div>
          <div className="text-slate-400 text-xs">© 2024 ReBoxify Logistics Solutions. Built for SDG Reuseability.</div>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-emerald-600">Privacy</a>
            <a href="#" className="hover:text-emerald-600">Compliance</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
