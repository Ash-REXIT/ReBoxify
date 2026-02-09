import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingIcon, TruckIcon, QRIcon, PackageIcon } from '../components/Icons';
import { getInventory, validateAndTransition, isValidBoxId, getDepositAmount, Box, calculateNetImpact } from '../utils/boxStore';
import { useAuth } from '../contexts/AuthContext';
import { getIssues, updateIssueStatus, deleteIssue, Issue, IssueStatus } from '../utils/issueStore';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { user } = session;
  const [inventory, setInventory] = useState<Box[]>([]);
  const [newBoxId, setNewBoxId] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    setInventory(getInventory());

    const refreshIssues = () => {
      setIssues(getIssues());
    };

    refreshIssues();
    const interval = setInterval(refreshIssues, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">Unauthorized Access.</div>;
  }

  const createBox = () => {
    if (!newBoxId) return;
    const upperId = newBoxId.toUpperCase().trim();
    if (!isValidBoxId(upperId)) {
      alert("Invalid Box ID format. Please use AAA-000 format (e.g. RBX-101).");
      return;
    }
    const current = getInventory();
    if (current.find(b => b.id === upperId)) {
      alert("Box ID already exists!");
      return;
    }
    const newBox: Box = { id: upperId, company: null, status: 'CREATED', uses: 0, condition: 'NEW' };
    const updated = [...current, newBox];
    localStorage.setItem('reboxify_inventory', JSON.stringify(updated));
    setInventory(updated);
    setNewBoxId('');
    alert(`Box ${upperId} created successfully!`);
  };

  const deleteBox = (id: string) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete box ${id}?`)) return;
    const updated = getInventory().filter(b => b.id !== id);
    localStorage.setItem('reboxify_inventory', JSON.stringify(updated));
    setInventory(updated);
  };

  const assignToMNC = (id: string, companyId: string) => {
    const res = validateAndTransition(id, 'admin', 'EXPORTED', { company: companyId });
    if (res.success) {
      setInventory(getInventory());
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] font-sans text-slate-900 dark:text-white relative overflow-x-hidden transition-colors duration-700">
      {/* Immersive Control Tower Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-500/10 dark:bg-indigo-900/40 rounded-full blur-[140px] animate-pulse duration-[10s]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-200/50 dark:bg-slate-800/50 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-900/20 rounded-full blur-[100px]"></div>
      </div>

      <header className="relative z-40 px-10 py-8 bg-white/70 dark:bg-white/[0.02] backdrop-blur-3xl border-b border-slate-200 dark:border-white/[0.05] flex justify-between items-center sticky top-0 shadow-2xl transition-all">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/10 transition-all active:scale-90 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="flex items-center gap-5 cursor-pointer group" onClick={() => navigate('/')}>
            <div className="w-14 h-14 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-2xl transition-transform group-hover:rotate-6">R</div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none transition-colors group-hover:text-emerald-600">Control Tower</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.3em]">Governance Node Active</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="px-8 py-3.5 bg-white/50 dark:bg-white/5 hover:bg-rose-500 hover:text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-white/10"
        >
          Exit
        </button>
      </header>

      <main className="relative z-10 p-8 md:p-12 max-w-[1600px] mx-auto space-y-12">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl">
            <PackageIcon />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Total Assets</p>
            <h3 className="text-5xl font-black tracking-tighter">{inventory.length}</h3>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl">
            <TruckIcon />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Active Loop</p>
            <h3 className="text-5xl font-black tracking-tighter text-emerald-500">{inventory.filter(b => b.status !== 'CREATED' && b.status !== 'RETIRED').length}</h3>
          </div>
          <div className="bg-white dark:bg-white/[0.03] p-8 rounded-[3rem] border border-slate-200 dark:border-white/[0.08] shadow-2xl">
            <BuildingIcon />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">MNC Partners</p>
            <h3 className="text-5xl font-black tracking-tighter text-indigo-400">2</h3>
          </div>
          <div className="bg-emerald-600/5 dark:bg-emerald-600/10 p-8 rounded-[3rem] border-2 border-emerald-500/20 shadow-2xl">
            <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Impact</p>
            <h3 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{calculateNetImpact(inventory).totalImpact.toFixed(1)}kg</h3>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-white/[0.02] backdrop-blur-3xl rounded-[3.5rem] p-10 border border-slate-200 dark:border-white/[0.05] md:col-span-2 shadow-2xl">
            <div className="flex items-center gap-4 mb-10">
              <QRIcon />
              <h2 className="text-2xl font-black tracking-tight uppercase leading-none">Asset Registration</h2>
            </div>
            <div className="flex gap-4">
              <input value={newBoxId} onChange={(e) => setNewBoxId(e.target.value)} placeholder="RBX-X-000" className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 text-sm font-mono" />
              <button onClick={createBox} className="px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Register</button>
            </div>
          </div>
        </section>

        {/* Global Disruption Registry */}
        <section className="bg-white/40 dark:bg-white/[0.01] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.05] rounded-[4rem] p-10 shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl">!</div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Global Issue Registry</h2>
          </div>

          <div className="grid gap-4">
            {issues.length === 0 ? (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-20">No anomalies detected.</p>
            ) : (
              issues.map(issue => (
                <div key={issue.issueId} className="p-8 bg-white/60 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[2.5rem] flex flex-col xl:flex-row xl:items-center justify-between gap-8 group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 font-mono text-[9px] font-black group-hover:text-amber-600">ID-{issue.issueId.split('-')[1]}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase rounded-lg">BOX: {issue.boxId}</span>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[8px] font-black uppercase rounded-lg">{issue.companyId}</span>
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">{issue.issueType}</h4>
                      <p className="text-xs text-slate-500 max-w-2xl">{issue.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <select
                      value={issue.status}
                      onChange={(e) => {
                        updateIssueStatus(issue.issueId, e.target.value as IssueStatus);
                        setIssues(getIssues());
                      }}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${issue.status === 'OPEN' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                          issue.status === 'IN_REVIEW' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_REVIEW">IN_REVIEW</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                    <button
                      onClick={() => {
                        if (window.confirm("Purge this issue from the registry?")) {
                          deleteIssue(issue.issueId);
                          setIssues(getIssues());
                        }
                      }}
                      className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all active:scale-90"
                      title="Delete Issue"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-white/[0.01] backdrop-blur-3xl rounded-[4rem] border border-slate-200 dark:border-white/[0.05] overflow-hidden shadow-2xl">
          <div className="px-12 py-10 border-b border-slate-100 dark:border-white/[0.05] flex justify-between items-center">
            <h2 className="text-3xl font-black tracking-tighter leading-none text-slate-900 dark:text-white uppercase">Lifecycle Ledger</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 text-[10px] font-black uppercase border-b border-slate-100 dark:border-white/5">
                  <th className="px-12 py-8">Asset</th>
                  <th className="px-8 py-8">State</th>
                  <th className="px-8 py-8">Custodian</th>
                  <th className="px-8 py-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((box) => (
                  <tr key={box.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-12 py-8 font-mono font-black text-slate-700 dark:text-white/90">{box.id}</td>
                    <td className="px-8 py-8 text-xs text-slate-500">{box.status}</td>
                    <td className="px-8 py-8 text-xs font-black text-indigo-500">{box.company || 'N/A'}</td>
                    <td className="px-12 py-8 text-right">
                      {box.status === 'CREATED' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => assignToMNC(box.id, 'MNC-AMZ')} className="px-3 py-1.5 bg-amber-600 text-white text-[9px] font-black rounded-lg">AMZ</button>
                          <button onClick={() => assignToMNC(box.id, 'MNC-FLK')} className="px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-lg">FLK</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
