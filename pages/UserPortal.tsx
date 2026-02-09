import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeafIcon, PackageIcon, QRIcon, UserIcon } from '../components/Icons';
import { getInventory, Box } from '../utils/boxStore';

const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeBoxes, setActiveBoxes] = useState<Box[]>([]);
  const sessionString = localStorage.getItem('reboxify_session');
  const session = sessionString ? JSON.parse(sessionString) : null;

  useEffect(() => {
    if (!session || session.role !== 'user') {
      navigate('/login');
      return;
    }
    // Filter inventory for boxes in user's possession
    const inv = getInventory().filter(b => b.status === 'DELIVERED');
    setActiveBoxes(inv);
  }, [navigate]);

  if (!session || session.role !== 'user') {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized. Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <h1 className="text-xl font-bold text-slate-800">My Eco-Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Green Tokens</p>
              <p className="text-blue-600 font-bold flex items-center justify-end gap-1">
                <LeafIcon /> 1,240
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
              {session.email?.substring(0, 2).toUpperCase() || 'JD'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Stats Row */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Refundable Deposits</p>
            <h3 className="text-3xl font-bold text-slate-900">₹{(activeBoxes.length * 80).toFixed(2)}</h3>
            <p className="text-xs text-slate-400 mt-2">Held for {activeBoxes.length} active box(es)</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Green Tokens</p>
            <h3 className="text-3xl font-bold text-blue-600">1,240</h3>
            <button className="mt-3 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">Redeem on Amazon</button>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Impact</p>
            <h3 className="text-3xl font-bold text-slate-900">4.5kg</h3>
            <p className="text-xs text-slate-400 mt-2">CO2 diverted from landfills</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-900/5 p-8 border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Active Return Windows</h2>
            <div className="px-4 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">ACTION REQUIRED</div>
          </div>

          <div className="space-y-4">
            {activeBoxes.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold">No active eco-boxes in possession.</p>
              </div>
            ) : (
              activeBoxes.map(box => (
                <div key={box.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm">
                      <PackageIcon />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{box.company} Reusable</h4>
                      <p className="text-sm text-slate-500 font-mono">{box.id}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[64%] animate-pulse"></div>
                      </div>
                      <span className="text-sm font-bold text-orange-600">9 Days Left</span>
                    </div>
                    <p className="text-xs text-slate-400">Agent pickup scheduled for Day 14 if not returned.</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:scale-105 transition-transform">Schedule Pickup</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-blue-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <LeafIcon />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-1">Return & Refund Policy</h4>
            <p className="text-blue-100 text-sm opacity-90 leading-relaxed">
              If the box is not returned within 14 days, the ₹80 deposit will not be refunded. Furthermore, an automated penalty will be deducted via your linked Autopay account to cover box replacement costs. Keep the cycle going!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserPortal;
