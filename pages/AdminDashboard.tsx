import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, TruckIcon, QRIcon, PackageIcon, LeafIcon } from '../components/Icons';
import { getInventory, validateAndTransition, isValidBoxId, getDepositAmount, Box, calculateNetImpact, createBox as createBoxApi, deleteBoxApi } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, updateIssueStatus, deleteIssue, Issue, IssueStatus } from '../utils/issueStore';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { user } = session;
  const [inventory, setInventory] = useState<Box[]>([]);
  const [newBoxId, setNewBoxId] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!session.isAuthenticated || user?.role !== 'admin') {
      navigate('/admin-login');
      return;
    }

    // Initial load
    const loadData = async () => {
      setInventory(await getInventory());
      setIssues(await getIssues());
    };
    loadData();

    // Auto-refresh data loop
    const interval = setInterval(async () => {
      const invCallback = await getInventory();
      setInventory(invCallback);

      const currentIssues = await getIssues();
      setIssues(currentIssues);

      // AI Auto-Resolution Logic
      currentIssues.forEach(issue => {
        if (issue.issueType === 'Box damaged on delivery' && issue.status === 'OPEN' && !resolvingIds.has(issue.issueId)) {
          // Start resolution process for this issue
          setResolvingIds(prev => new Set(prev).add(issue.issueId));

          setTimeout(async () => {
            // After 20s, delete the issue (simulate resolution)
            await deleteIssue(issue.issueId);
            setResolvingIds(prev => {
              const next = new Set(prev);
              next.delete(issue.issueId);
              return next;
            });
            // Trigger re-render/update
            setIssues(await getIssues());
          }, 20000);
        }
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [navigate, session, user, resolvingIds]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unauthorized Access</h2>
          <p className="text-slate-500 text-sm mb-6">You do not have administrative privileges.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">Return Home</button>
        </div>
      </div>
    );
  }

  const createBox = async () => {
    if (!newBoxId) return;
    const upperId = newBoxId.toUpperCase().trim();
    if (!isValidBoxId(upperId)) {
      alert("Invalid Box ID format. Use AAA-000 (e.g. RBX-101).");
      return;
    }
    const current = await getInventory();
    if (current.find(b => b.id === upperId)) {
      alert("Box ID already exists!");
      return;
    }
    // We need to call create API.
    const newBox: Box = { id: upperId, company: null, status: 'CREATED', uses: 0, condition: 'NEW' };
    try {
      await createBoxApi(newBox);
      setInventory(await getInventory());
      setNewBoxId('');
    } catch (e) {
      alert("Failed to create box");
    }
  };

  const deleteBox = async (id: string) => {
    if (!window.confirm(`Permanently delete box ${id}?`)) return;
    await deleteBoxApi(id);
    setInventory(await getInventory());
  };

  const assignToMNC = async (id: string, companyId: string) => {
    const res = await validateAndTransition(id, 'admin', 'EXPORTED', { company: companyId });
    if (res.success) {
      setInventory(await getInventory());
    } else {
      alert(res.message);
    }
  };
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* Top Header Section */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <BuildingIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ReBoxify <span className="text-indigo-600 dark:text-indigo-400">Admin Console</span></h1>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Global Fleet Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 pr-6 border-r border-slate-200 dark:border-slate-800">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">{user.id}</span>
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Super Administrator</span>
              </div>
              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                {user.id.substring(0, 1).toUpperCase()}
              </div>
            </div>
            <button
              onClick={logout}
              className="px-5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <PackageIcon />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">+4.2%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Global Box Fleet</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{inventory.length}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <TruckIcon />
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">Live Feed</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">In Circulation</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">{inventory.filter(b => b.status !== 'CREATED' && b.status !== 'RETIRED').length}</h3>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
                <BuildingIcon />
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Registered Partners</p>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">2</h3>
          </div>

          <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-2xl border border-indigo-700 shadow-lg shadow-indigo-600/10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/10 text-white rounded-xl">
                <LeafIcon />
              </div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Environmental Impact</p>
            <h3 className="text-3xl font-extrabold text-white">{calculateNetImpact(inventory).totalImpact.toFixed(1)}kg</h3>
          </div>
        </section>

        {/* Operational Grid */}
        <section className="grid lg:grid-cols-12 gap-8">
          {/* Asset Control Panel */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                Quick Registration
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">Box Lifecycle ID</label>
                  <input
                    value={newBoxId}
                    onChange={(e) => setNewBoxId(e.target.value)}
                    placeholder="e.g. RBX-101"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <button
                  onClick={createBox}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="text-xl leading-none">+</span>
                  Register New Box
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol Integrity</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest italic">Stable</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500 animate-[progress_3s_ease-in-out_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900 p-8 rounded-2xl border border-indigo-950 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h3 className="text-white font-bold mb-2">Administrative Briefing</h3>
              <p className="text-indigo-200 text-xs leading-relaxed opacity-80 mb-6">Manage global circular inventory, monitor MNC handovers, and resolve cross-border lifecycle anomalies instantly.</p>
              <button className="text-white underline text-xs font-bold hover:text-indigo-200 transition-colors">Internal Ops Manual →</button>
            </div>
          </div>

          {/* Inventory Ledger */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Lifecycle Ledger</h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">Asset Condition & State History</p>
              </div>
              <div className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
                Viewing {inventory.length} Assets
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-[#f8fafc] dark:bg-[#0f172a] sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                  <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-5">Box Identifier</th>
                    <th className="px-6 py-5">Phase</th>
                    <th className="px-6 py-5">Condition</th>
                    <th className="px-6 py-5">Circulation</th>
                    <th className="px-6 py-5">Custodian</th>
                    <th className="px-6 py-5 text-right">Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800 uppercase">
                  {inventory.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic text-sm font-medium">No assets deployed in the global network.</td></tr>
                  ) : (
                    inventory.map((box) => (
                      <tr key={box.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-5">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-sm">{box.id}</span>
                        </td>
                        <td className="px-6 py-5 text-xs">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${box.status === 'CREATED' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                            {box.status}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${box.condition === 'NEW' ? 'text-emerald-500' :
                            box.condition === 'DAMAGED' ? 'text-rose-500' :
                              'text-amber-500'
                            }`}>
                            {box.condition}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{box.uses}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Cycles</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {box.company ? (
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 uppercase tracking-tight">
                              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                              {box.company}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Available</span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {box.status === 'CREATED' ? (
                              <>
                                <button onClick={() => assignToMNC(box.id, 'MNC-AMZ')} className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-colors">AMZ</button>
                                <button onClick={() => assignToMNC(box.id, 'MNC-FLK')} className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[9px] font-bold rounded-lg border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-colors">FLK</button>
                              </>
                            ) : (
                              <button onClick={() => deleteBox(box.id)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors" title="Decommission Asset">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Global Operational Alerts */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-3 italic italic italic italic">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600">!</div>
                Global Anomaly Registry
              </h2>
            </div>
            <span className="px-4 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-500/20">Operational Alerts</span>
          </div>

          <div className="p-2">
            <div className="grid grid-cols-1 divide-y divide-slate-50 dark:divide-slate-800">
              {issues.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-slate-400 italic text-sm font-medium">No global disruptions detected in the network trace.</p>
                </div>
              ) : (
                issues.map(issue => (
                  <div key={issue.issueId} className={`px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group ${resolvingIds.has(issue.issueId) ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'hover:bg-slate-50/50 border-transparent border-l-4'}`}>

                    {resolvingIds.has(issue.issueId) ? (
                      <div className="flex-1 flex items-center gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center">
                          <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Auto-Resolution Active</h4>
                          <p className="text-xs text-indigo-600 font-medium">Analyzing damage vectors... Resolving anomaly {issue.issueId}...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold rounded uppercase tracking-wider tabular-nums font-mono italic italic italic italic">#{issue.issueId.split('-')[1]}</span>
                          <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded uppercase tracking-widest italic italic italic italic">Box: {issue.boxId}</span>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest italic italic italic italic">{issue.companyId}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">{issue.issueType}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{issue.description}</p>
                      </div>
                    )}

                    {!resolvingIds.has(issue.issueId) && (
                      <div className="flex items-center gap-4">
                        <select
                          value={issue.status}
                          onChange={(e) => {
                            updateIssueStatus(issue.issueId, e.target.value as IssueStatus);
                            setIssues(getIssues());
                          }}
                          className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border outline-none cursor-pointer transition-all ${issue.status === 'OPEN' ? 'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-300' :
                            issue.status === 'IN_REVIEW' ? 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-300'
                            }`}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                        <button
                          onClick={() => {
                            if (window.confirm("Archive this anomaly permanently?")) {
                              deleteIssue(issue.issueId);
                              setIssues(getIssues());
                            }
                          }}
                          className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6V4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}} />
    </div>
  );
};

export default AdminDashboard;
