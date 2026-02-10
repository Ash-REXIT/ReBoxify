import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeafIcon, PackageIcon, QRIcon, UserIcon } from '../components/Icons';
import { getInventory, getDepositAmount, Box } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, saveIssue, deleteIssue, Issue, IssueType } from '../utils/issueStore';

const UserPortal: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { user } = session;
  const [activeBoxes, setActiveBoxes] = useState<Box[]>([]);
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [newIssue, setNewIssue] = useState({
    boxId: '',
    issueType: 'Box damaged on delivery' as IssueType,
    description: ''
  });

  useEffect(() => {
    const refreshData = () => {
      if (!user) return;
      const allInventory = getInventory();
      const userLower = user.email?.toLowerCase().trim();
      const inv = allInventory.filter(b =>
        b.status === 'DELIVERED' &&
        b.customer_id?.toLowerCase().trim() === userLower
      );
      setActiveBoxes(inv);

      const allIssues = getIssues();
      setUserIssues(allIssues.filter(i => i.customerId === user.id));
    };

    refreshData();
    window.addEventListener('storage', refreshData);
    const interval = setInterval(refreshData, 3000);

    // Auto-resolve simulation for standalone User Portal experience
    const resolutionInterval = setInterval(() => {
      const issues = getIssues();
      let changed = false;
      issues.forEach(issue => {
        if (issue.issueType === 'Box damaged on delivery' && issue.status === 'OPEN' && issue.customerId === user.id) {
          // If it's been open for more than 20 seconds, resolve/delete it
          const age = new Date().getTime() - new Date(issue.createdAt).getTime();
          if (age > 20000) {
            deleteIssue(issue.issueId);
            changed = true;
          }
        }
      });
      if (changed) refreshData();
    }, 2000);

    return () => {
      window.removeEventListener('storage', refreshData);
      clearInterval(interval);
      clearInterval(resolutionInterval);
    };
  }, [user]);

  if (!user || user.role !== 'user') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans px-6">
        <div className="text-white flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Authenticating Profile</h2>
            <p className="text-slate-400 text-sm">Securing your eco-footprint...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalDeposits = activeBoxes.reduce((acc, b) => acc + getDepositAmount(b), 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] relative overflow-hidden font-sans selection:bg-emerald-200 selection:text-emerald-900 transition-colors duration-700">
      {/* Enhanced Immersive Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden overflow-y-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-full h-full bg-gradient-to-br from-emerald-500/5 via-indigo-500/5 to-transparent dark:from-emerald-500/10 dark:via-transparent dark:to-indigo-500/5 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/30 dark:bg-emerald-500/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[140px] animate-[pulse_10s_infinite]"></div>
      </div>

      <header className="sticky top-0 z-[100] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-effect dark:bg-slate-900/40 border-white/20 dark:border-white/5 rounded-[3rem] px-8 lg:px-12 py-6 flex items-center justify-between shadow-2xl shadow-emerald-900/5 transition-all duration-700">
            <div className="flex items-center gap-8">
              <div
                onClick={() => navigate('/')}
                className="group flex items-center gap-4 cursor-pointer"
              >
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-emerald-500/20 group-hover:rotate-6 transition-all">R</div>
                <div className="hidden sm:block">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">ReBoxify</h1>
                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] leading-none">Circular Portal</p>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block"></div>
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Ecological Sentinel</span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden xl:flex flex-col items-end mr-6">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Current Sync</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
              </div>
              <button
                onClick={logout}
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-600 dark:hover:bg-rose-500 dark:hover:text-white transition-all active:scale-95 shadow-xl shadow-black/10 group"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 lg:px-12 space-y-16 relative z-10">
        <section className="grid lg:grid-cols-3 gap-8">
          {/* Token Vault - High Impact Hero Card */}
          <div className="lg:col-span-2 relative group overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-[4rem] p-12 transition-all duration-700 hover:border-emerald-500/40 shadow-2xl shadow-emerald-900/5 cursor-pointer hover:shadow-emerald-500/10 hover:-translate-y-1">
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 via-emerald-50/20 to-transparent dark:from-emerald-900/20 dark:via-emerald-950/10 dark:to-transparent transition-opacity duration-700"></div>
              <div className="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-emerald-500/10 rounded-full blur-[120px] group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between h-full gap-12">
              <div className="space-y-8 flex-1">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/5 transition-transform group-hover:scale-110">
                  <LeafIcon />
                </div>
                <div>
                  <h3 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">
                    {user.greenTokens?.toLocaleString() || 0}
                  </h3>
                  <p className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-900 bg-clip-text text-transparent text-[10px] font-black uppercase tracking-[0.4em]">Cumulative Green Credits</p>
                </div>
                <p className="text-emerald-900/70 dark:text-emerald-400 text-sm font-medium leading-relaxed max-w-sm">
                  Your commitment to circularity has generated significant ecological impact. Redeem your tokens for premium sustainable rewards.
                </p>
              </div>

              <div className="w-full md:w-auto shrink-0 space-y-4">
                <button className="w-full md:w-64 py-5 bg-emerald-700 dark:bg-emerald-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-3">
                  Marketplace Access
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-500/5 dark:bg-white/[0.03] rounded-3xl border border-emerald-500/10 dark:border-white/5 text-center group/stat">
                    <span className="block text-2xl font-black text-emerald-900 dark:text-white group-hover/stat:scale-110 transition-transform">12</span>
                    <span className="text-[8px] font-black text-emerald-700/60 dark:text-slate-500 uppercase tracking-widest">Saved Trees</span>
                  </div>
                  <div className="p-6 bg-emerald-500/5 dark:bg-white/[0.03] rounded-3xl border border-emerald-500/10 dark:border-white/5 text-center group/stat">
                    <span className="block text-2xl font-black text-emerald-900 dark:text-white group-hover/stat:scale-110 transition-transform">45kg</span>
                    <span className="text-[8px] font-black text-emerald-700/60 dark:text-slate-500 uppercase tracking-widest">CO2 Offset</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Column */}
          <div className="flex flex-col gap-8">
            {/* Security Deposits Card */}
            <div className="flex-1 glass-effect dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-[3.5rem] p-10 shadow-2xl shadow-black/[0.02] flex flex-col justify-between group hover:border-amber-500/20 transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-amber-500/5">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl group-hover:rotate-12 transition-transform">₹</div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-lg">Escrow Balance</span>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2">₹{totalDeposits.toFixed(0)}</h3>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">Secured Security Deposits</p>
              </div>
              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                <span>Active Assets</span>
                <span className="text-slate-900 dark:text-white font-black">{activeBoxes.length} Boxes</span>
              </div>
            </div>

            {/* Support Integration */}
            <div
              onClick={() => setShowIssueModal(true)}
              className="h-32 bg-indigo-600 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-500/20 text-white cursor-pointer group hover:bg-slate-900 transition-all duration-500 flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black tracking-tight leading-none mb-1">Support Desk</h3>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Report Operation Logs</p>
              </div>
              <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Asset Grid */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 px-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 dark:bg-emerald-500/10 flex items-center justify-center text-white dark:text-emerald-400 shadow-xl">
                  <PackageIcon />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Eco-Fleet Status</h2>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Real-time Asset Lifecycle Telemetry</p>
            </div>

            {activeBoxes.length > 0 && (
              <div className="px-8 py-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-2xl border border-rose-500/20 flex items-center gap-4 shadow-xl shadow-rose-500/5 transition-transform hover:scale-105 cursor-default group">
                <span className="flex relative h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                URGENT ACTION: RETURN WINDOW CLOSING
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10">
            {activeBoxes.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 py-32 px-10 text-center bg-white/40 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[4rem] group hover:border-emerald-500/30 transition-all duration-700">
                <div className="w-32 h-32 bg-white dark:bg-white/5 shadow-2xl shadow-black/5 rounded-[3rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 border border-slate-50 dark:border-white/5">
                  <div className="text-slate-200 dark:text-white/10 group-hover:text-emerald-500 transition-colors">
                    <PackageIcon />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Fleet Depleted</h4>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] max-w-sm mx-auto leading-relaxed">No active assets detected in your circular node.</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-10 px-12 py-5 bg-emerald-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:bg-slate-900 transition-all active:scale-95"
                >
                  Initiate New Protocol
                </button>
              </div>
            ) : (
              activeBoxes.map(box => (
                <div key={box.id} className="glass-effect dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[3.5rem] p-10 shadow-2xl shadow-black/[0.01] hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-700 group flex flex-col justify-between overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-20 h-20 bg-slate-900/5 dark:bg-white/5 rounded-[1.8rem] flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all duration-700 shadow-inner group-hover:rotate-6">
                        <PackageIcon />
                      </div>
                      <div className="text-right">
                        <span className="px-4 py-1.5 bg-emerald-500 dark:bg-emerald-500/20 text-white dark:text-emerald-400 text-[8px] font-black uppercase rounded-lg tracking-widest leading-none shadow-lg">In Possession</span>
                        <code className="block mt-3 text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-widest">#{box.id}</code>
                      </div>
                    </div>

                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-4">{box.company}</h4>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-slate-400 dark:text-slate-500">Cycle Status</span>
                        <span className="text-emerald-600 dark:text-emerald-400">92% Reliable</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full p-1 shadow-inner overflow-hidden flex items-center">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          style={{ width: '92%' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1.5">Escrow Refund</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">₹{getDepositAmount(box)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1.5">Days Left</p>
                      <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">
                        {(() => {
                          if (!box.deadline) return '14';
                          const diff = new Date(box.deadline).getTime() - new Date().getTime();
                          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          return days > 0 ? days.toString().padStart(2, '0') : '00';
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 w-full py-5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex flex-col items-center justify-center gap-2 border border-slate-100 dark:border-white/5">
                    <span className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      Automatic Collection
                    </span>
                    <span className="text-[9px] opacity-70">Partner will maximize route efficiency</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Support Ledger Section */}
        {userIssues.length > 0 && (
          <section className="space-y-10">
            <div className="flex items-center gap-4 px-6">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Support Ledger</h2>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] ml-0.5">Historical Account of Disruption Protocols</p>
              </div>
            </div>

            <div className="grid gap-6">
              {userIssues.map(issue => (
                <div key={issue.issueId} className="flex flex-col md:flex-row items-center justify-between p-8 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all duration-500 shadow-2xl shadow-black/[0.01]">
                  <div className="flex items-center gap-8 flex-1">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all shadow-inner">
                      <code className="text-[10px] font-black tracking-tighter">#{issue.issueId.split('-')[1]}</code>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase text-sm">{issue.issueType}</h4>
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Asset: <span className="text-indigo-600 dark:text-indigo-400">{issue.boxId}</span></p>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Logged: {new Date(issue.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 mt-6 md:mt-0 w-full md:w-auto">
                    {issue.issueType === 'Box damaged on delivery' && issue.status === 'OPEN' ? (
                      <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em]">Resolving...</span>
                      </div>
                    ) : (
                      <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-lg ${issue.status === 'OPEN' ? 'bg-amber-500 text-white border-amber-600' :
                        issue.status === 'IN_REVIEW' ? 'bg-indigo-500 text-white border-indigo-600' :
                          'bg-emerald-500 text-white border-emerald-600'
                        }`}>
                        {issue.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Global Policy Narrative */}
        <section className="relative px-6 py-10">
          <div className="glass-effect dark:bg-slate-900 border-white/20 dark:border-white/10 rounded-[4rem] p-12 lg:p-20 overflow-hidden shadow-2xl group transition-all duration-1000">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full blur-[140px] -mr-80 -mt-80 group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>

            <div className="flex flex-col lg:flex-row items-start gap-16 relative z-10">
              <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/30 group-hover:rotate-12 transition-all duration-700">
                <LeafIcon />
              </div>
              <div>
                <h4 className="text-5xl font-black text-emerald-900 dark:text-white mb-8 tracking-tighter">The Circular Covenant</h4>
                <div className="grid md:grid-cols-2 gap-12">
                  <p className="text-emerald-800/70 dark:text-emerald-400 text-lg leading-relaxed font-medium tracking-tight">
                    Being part of the circular vanguard requires precision. ReBoxify assets are high-value ecological instruments.
                    Every interaction is logged in the permanent ledger of sustainability.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 dark:bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-700/20">01</div>
                      <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest leading-relaxed">Returns must be initiated within 14 units.</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 dark:bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-700/20">02</div>
                      <p className="text-[10px] font-black text-emerald-800 dark:text-emerald-500 uppercase tracking-widest leading-relaxed">Maintain Eco-Node Integrity for refunds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-24 pb-24 text-center relative z-10">
        <p className="text-[11px] font-black text-slate-300 dark:text-slate-800 uppercase tracking-[0.8em] mb-6">Re•Boxify Lifecycle Transparency v2.5</p>
        <div className="flex justify-center items-center gap-6">
          <div className="h-[1px] w-16 bg-slate-100 dark:bg-white/5"></div>
          <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5"></div>
          <div className="h-[1px] w-16 bg-slate-100 dark:bg-white/5"></div>
        </div>
      </footer>

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6 lg:p-12">
          <div className="bg-white dark:bg-[#020617] w-full max-w-2xl rounded-[4rem] p-12 md:p-16 shadow-2xl border border-white/20 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity opacity-50 group-hover:opacity-100 duration-1000"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Issue Protocol</h2>
                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.4em]">Operational Disruption Entry</p>
                </div>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newIssue.boxId) return;
                  const box = activeBoxes.find(b => b.id === newIssue.boxId);
                  saveIssue({
                    ...newIssue,
                    customerId: user.id,
                    companyId: box?.company || 'UNKNOWN'
                  });
                  setShowIssueModal(false);
                  setNewIssue({ boxId: '', issueType: 'Box damaged on delivery', description: '' });
                }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Affected Asset</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. ESA-012"
                      value={newIssue.boxId}
                      onChange={(e) => setNewIssue({ ...newIssue, boxId: e.target.value.toUpperCase() })}
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 font-black text-xs mb-1 uppercase"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conflict Nature</label>
                    <select
                      value={newIssue.issueType}
                      onChange={(e) => setNewIssue({ ...newIssue, issueType: e.target.value as IssueType })}
                      className="w-full px-8 py-5 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 font-black text-xs"
                    >
                      <option value="Box damaged on delivery" className="bg-white dark:bg-slate-900">Damage on Delivery</option>
                      <option value="Box missing parts / broken" className="bg-white dark:bg-slate-900">Structural Failure</option>
                      <option value="Unable to return box" className="bg-white dark:bg-slate-900">Return Blockage</option>
                      <option value="Other" className="bg-white dark:bg-slate-900">Other Anomaly</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observational Data</label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Provide details of the circular discrepancy..."
                    className="w-full px-8 py-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[160px] font-medium placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-900/40 hover:bg-slate-950 transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                    Transmit Protocol
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        .font-sans { font-family: 'Outfit', sans-serif; }
      `}} />
    </div>
  );
};

export default UserPortal;
