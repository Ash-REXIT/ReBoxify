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

    return () => {
      window.removeEventListener('storage', refreshData);
      clearInterval(interval);
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
      {/* Immersive Background Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[55%] h-[55%] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-[140px] animate-[pulse_8s_infinite]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-50/30 dark:bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="sticky top-0 z-50 px-6 py-6 transition-all duration-500">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[2.5rem] px-10 py-5 flex items-center justify-between shadow-2xl shadow-black/[0.02] dark:shadow-black/40">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10 transition-all active:scale-90 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
              </button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">My Eco-Fleet</h1>
                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em] leading-none mb-1">Impact Level: Circular Vanguard</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-12 mr-10">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Ecological ID</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-white/5 px-4 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">{user.email}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="px-8 py-3 bg-slate-900 dark:bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-black/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10 lg:px-12 space-y-16 relative z-10">
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Token Vault Card */}
          <div className="md:col-span-2 relative group overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-400 dark:via-emerald-500 dark:to-teal-600 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-emerald-500/20">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
              <LeafIcon />
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.3em] mb-6">Green Token Balance</p>
                <div className="flex items-center gap-6">
                  <h3 className="text-8xl font-black tracking-tighter leading-none">{user.greenTokens?.toLocaleString() || 0}</h3>
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 animate-bounce">
                    <LeafIcon />
                  </div>
                </div>
              </div>

              <div className="mt-16">
                <button className="w-full py-5 bg-white text-emerald-700 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-50 transition-all shadow-2xl shadow-emerald-900/20 active:scale-[0.98] flex items-center justify-center gap-3">
                  Rewards Marketplace
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Refundable Equity Card */}
          <div className="bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] rounded-[3.5rem] p-12 shadow-2xl shadow-black/[0.02] flex flex-col justify-between group hover:border-emerald-500/20 transition-all duration-500">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20 mb-6 transition-colors">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">Active Deposits</span>
              </div>
              <h3 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">₹{totalDeposits.toFixed(0)}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed">Secured across active assets.</p>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Possession Count</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-300">{activeBoxes.length}</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-white/5 rounded-full flex p-1 shadow-inner">
                <div
                  className="h-full bg-slate-900 dark:bg-emerald-500 rounded-full transition-all duration-1000 shadow-xl"
                  style={{ width: activeBoxes.length > 0 ? '100%' : '0%' }}
                ></div>
              </div>
            </div>
          </div>

          {/* Helpline Card */}
          <div
            onClick={() => setShowIssueModal(true)}
            className="bg-indigo-600 rounded-[3.5rem] p-12 shadow-2xl shadow-indigo-500/20 text-white cursor-pointer group hover:bg-slate-900 transition-all duration-500 flex flex-col justify-between"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-all duration-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight leading-none mb-4">Helpline</h3>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em]">Report an Issue</p>
            </div>
          </div>
        </section>

        {/* Dynamic Asset Grid */}
        <section className="bg-white/40 dark:bg-white/[0.01] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[4.5rem] p-8 md:p-14 shadow-2xl shadow-black/[0.02]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 px-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white/10 flex items-center justify-center text-white">
                  <PackageIcon />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Eco-Fleet Status</h2>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] ml-16">Active Asset Lifecycle Telemetry</p>
            </div>

            {activeBoxes.length > 0 && (
              <div className="px-8 py-3.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-2xl border border-rose-500/20 flex items-center gap-4 shadow-2xl shadow-rose-500/5 hover:scale-105 transition-transform cursor-default">
                <span className="flex relative h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
                URGENT ACTION: RETURN WINDOW CLOSING
              </div>
            )}
          </div>

          <div className="grid gap-10">
            {activeBoxes.length === 0 ? (
              <div className="py-32 px-10 text-center bg-white/20 dark:bg-white/[0.01] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[4rem] group hover:border-emerald-500/30 transition-all duration-700">
                <div className="w-32 h-32 bg-white dark:bg-white/5 shadow-2xl shadow-black/5 rounded-[3rem] flex items-center justify-center mx-auto mb-12 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 border border-slate-50 dark:border-white/5">
                  <div className="text-slate-200 dark:text-white/10 group-hover:text-emerald-500 transition-colors">
                    <PackageIcon />
                  </div>
                </div>
                <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">System Node: Empty</h4>
                <p className="text-slate-400 dark:text-slate-500 text-[11px] font-black uppercase tracking-widest max-w-sm mx-auto leading-relaxed">Your current sustainability circle is optimized. No pending handovers detected.</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-12 px-12 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:bg-slate-900 dark:hover:bg-emerald-500 transition-all active:scale-95"
                >
                  Explore Partners
                </button>
              </div>
            ) : (
              activeBoxes.map(box => (
                <div key={box.id} className="p-10 bg-white/60 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] rounded-[4rem] shadow-2xl shadow-black/[0.01] hover:shadow-black/10 hover:-translate-y-2 transition-all duration-700 group flex flex-col xl:flex-row xl:items-center gap-14">
                  <div className="flex items-center gap-10 shrink-0">
                    <div className="w-28 h-28 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-200 dark:text-white/5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-all duration-700 shadow-inner group-hover:scale-110 border border-slate-100 dark:border-white/5">
                      <PackageIcon />
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="px-4 py-1.5 bg-slate-900 dark:bg-white/10 text-white text-[9px] font-black uppercase rounded-lg tracking-widest leading-none shadow-xl transition-colors">Possession Active</span>
                        <code className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-lg tracking-widest uppercase">ID: {box.id}</code>
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">{box.company} Eco-Link</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em]">Lifecycle Live</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-5">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                          {(() => {
                            if (!box.deadline) return '14';
                            const diff = new Date(box.deadline).getTime() - new Date().getTime();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            return days > 0 ? days.toString().padStart(2, '0') : '00';
                          })()}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Days Remaining</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.3em] leading-none">
                        {(() => {
                          if (!box.deadline) return '100';
                          const diff = new Date(box.deadline).getTime() - new Date().getTime();
                          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          const percent = Math.max(0, Math.min(100, (days / 14) * 100));
                          return Math.round(percent);
                        })()}% Cycle Health
                      </span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full p-1 shadow-inner relative overflow-hidden flex items-center">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 rounded-full relative shadow-[0_0_20px_rgba(30,58,138,0.3)] transition-all duration-1000"
                        style={{
                          width: (() => {
                            if (!box.deadline) return '100%';
                            const diff = new Date(box.deadline).getTime() - new Date().getTime();
                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                            const percent = Math.max(0, Math.min(100, (days / 14) * 100));
                            return `${percent}%`;
                          })()
                        }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest px-4 italic">Next Step: Partner collection scheduled for delivery window.</p>
                  </div>

                  <div className="flex items-center gap-12 justify-between xl:justify-end border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5 pt-10 xl:pt-0 xl:pl-16 transition-all">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] leading-none mb-3">Escrow Value</p>
                      <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">₹{getDepositAmount(box)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Support Ledger Section */}
        {userIssues.length > 0 && (
          <section className="bg-white/40 dark:bg-white/[0.01] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[4.5rem] p-8 md:p-14 shadow-2xl shadow-black/[0.02]">
            <div className="flex items-center gap-4 mb-12 px-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">Support Ledger</h2>
            </div>

            <div className="grid gap-6">
              {userIssues.map(issue => (
                <div key={issue.issueId} className="flex items-center justify-between p-8 bg-white/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-3xl group hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center gap-8">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                      <code className="text-[10px] font-black tracking-tighter">#{issue.issueId.split('-')[1]}</code>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white tracking-tight mb-1 uppercase text-sm">{issue.issueType}</h4>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Box ID: <span className="text-indigo-600">{issue.boxId}</span> • {new Date(issue.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${issue.status === 'OPEN' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                      issue.status === 'IN_REVIEW' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      }`}>
                      {issue.status}
                    </span>
                    <button
                      onClick={() => {
                        if (window.confirm("Permanently archive this report?")) {
                          deleteIssue(issue.issueId);
                          setUserIssues(getIssues().filter(i => i.customerId === user.id));
                        }
                      }}
                      className="w-10 h-10 bg-rose-500/10 text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Global Policy Narrative */}
        <section className="relative p-1">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/20 rounded-[4.5rem] blur-[80px]"></div>
          <div className="relative bg-slate-900 rounded-[4.5rem] p-16 overflow-hidden border border-slate-800 shadow-2xl group transition-all duration-700 hover:border-emerald-500/30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-opacity opacity-50 group-hover:opacity-100 duration-1000"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>

            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="w-28 h-28 bg-emerald-500/10 text-emerald-400 rounded-[2.5rem] flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <LeafIcon />
              </div>
              <div className="text-center lg:text-left">
                <h4 className="text-4xl font-black text-white mb-6 tracking-tight">The Circular Covenant</h4>
                <p className="text-slate-400 text-lg leading-relaxed max-w-4xl font-medium tracking-tight">
                  Being part of the circular vanguard requires precision. ReBoxify assets are high-value ecological instruments.
                  Handover must be completed within <span className="text-white bg-white/10 px-3 py-1 rounded-xl text-base font-black uppercase tracking-widest mx-1 whitespace-nowrap">14 Cycle Units</span>.
                  Delayed returns trigger the transformation of security deposits into procurement levies.
                  Maintain <span className="text-emerald-400 border-b-2 border-emerald-500/30 font-black">Eco-Node Integrity</span> for frictionless refunds.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="pt-24 pb-20 text-center relative z-10">
        <div className="flex justify-center items-center gap-8 mb-8 opacity-20 transition-all duration-700">
          <div className="w-10 h-10 rounded-3xl bg-slate-300 dark:bg-white/10"></div>
          <div className="w-10 h-10 rounded-3xl bg-slate-300 dark:bg-white/10"></div>
          <div className="w-10 h-10 rounded-3xl bg-slate-300 dark:bg-white/10"></div>
        </div>
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.8em] mb-4">Re-Boxify Protocol v2.5.0 Full-Fidelity System</p>
        <div className="flex justify-center items-center gap-6">
          <div className="h-[1px] w-12 bg-slate-100 dark:bg-white/5"></div>
          <p className="text-[10px] font-black text-emerald-600/40 dark:text-emerald-500/20 uppercase tracking-[0.3em] font-mono">End-to-End Circular Transparency Verified</p>
          <div className="h-[1px] w-12 bg-slate-100 dark:bg-white/5"></div>
        </div>
      </footer>

      {/* Issue Reporting Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#0f172a] w-full max-w-xl rounded-[3rem] p-10 shadow-2xl border border-white/20 dark:border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

            <div className="relative z-10">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Report a Disruption</h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-10">Structural Accountability Protocol</p>

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
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Assigned Asset (Box ID)</label>
                  <select
                    required
                    value={newIssue.boxId}
                    onChange={(e) => setNewIssue({ ...newIssue, boxId: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="" className="bg-white dark:bg-slate-900">Select Box</option>
                    {activeBoxes.map(b => (
                      <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">{b.id} ({b.company})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Disruption Type</label>
                  <select
                    value={newIssue.issueType}
                    onChange={(e) => setNewIssue({ ...newIssue, issueType: e.target.value as IssueType })}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Box damaged on delivery" className="bg-white dark:bg-slate-900">Box damaged on delivery</option>
                    <option value="Box missing parts / broken" className="bg-white dark:bg-slate-900">Box missing parts / broken</option>
                    <option value="Unable to return box" className="bg-white dark:bg-slate-900">Unable to return box</option>
                    <option value="Other" className="bg-white dark:bg-slate-900">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description (Optional)</label>
                  <textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Describe the visible degradation..."
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[120px]"
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    Submit Report
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
